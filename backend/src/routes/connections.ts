import { Router } from 'express';
import { z } from 'zod';

import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { logger } from '../logger.js';
import { emitTenantEvent } from '../realtime/socket.js';
import { createEvolutionInstance, reconnectEvolutionInstance } from '../services/evolutionService.js';
import {
  createEvolutionInstanceRecord,
  extractEvolutionQrCode,
  updateEvolutionInstanceRecord,
} from '../services/evolutionPersistence.js';
import { generateUniqueConnectionInstanceName } from '../utils/instanceName.js';

const connectionSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  instance_name: z.string().min(1).optional(),
  api_provider: z.enum(['evolution', 'whatsmeow']).default('evolution'),
});

const updateStatusSchema = z.object({
  status: z.enum(['connected', 'disconnected', 'connecting']),
});

export const connectionsRouter = Router();

connectionsRouter.use(requireAuth);

async function provisionEvolutionInstance(params: {
  supabase: NonNullable<AuthenticatedRequest['supabase']>;
  organizationId: string;
  connectionId: string;
  instanceName: string;
  sellerId?: string | null;
}) {
  const { supabase, organizationId, connectionId, instanceName, sellerId = null } = params;

  await createEvolutionInstanceRecord(supabase, {
    organizationId,
    connectionId,
    instanceName,
    sellerId,
    status: 'creating',
  });

  const creationResponse = await createEvolutionInstance({ instanceName });
  const creationQrCode = extractEvolutionQrCode(creationResponse.payload ?? null);

  const evolutionResponse = (creationResponse.status !== 'sent' || !creationQrCode)
    ? await reconnectEvolutionInstance(instanceName)
    : creationResponse;

  const qrCode = extractEvolutionQrCode(evolutionResponse.payload ?? null) || creationQrCode;

  await updateEvolutionInstanceRecord(supabase, organizationId, instanceName, {
    status: qrCode
      ? 'qr_ready'
      : evolutionResponse.status === 'sent'
        ? 'generating_qr'
        : 'queued',
    qrCode,
    rawPayload: evolutionResponse.payload ?? null,
    errorMessage: evolutionResponse.status !== 'sent' ? evolutionResponse.message : null,
  });

  return evolutionResponse;
}

connectionsRouter.get('/', async (req, res, next) => {
  try {
    const request = req as AuthenticatedRequest;
    const supabase = request.supabase;

    if (!supabase || !request.organizationId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .eq('organization_id', request.organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      return next(error);
    }

    res.json({ connections: data || [] });
  } catch (error) {
    next(error);
  }
});

connectionsRouter.post('/', async (req, res, next) => {
  try {
    const request = req as AuthenticatedRequest;
    const supabase = request.supabase;

    if (!supabase || !request.organizationId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const payload = connectionSchema.parse(req.body);
    const instanceName = payload.instance_name?.trim() || await generateUniqueConnectionInstanceName(supabase, request.organizationId, payload.name);

    const { data, error } = await supabase
      .from('connections')
      .insert({
        ...payload,
        instance_name: instanceName,
        phone: payload.phone.replace(/\D/g, ''),
        organization_id: request.organizationId,
        status: 'connecting',
      })
      .select('*')
      .single();

    if (error) {
      return next(error);
    }

    if (payload.api_provider === 'evolution') {
      try {
        const { data: seller } = await supabase
          .from('sellers')
          .select('id')
          .eq('organization_id', request.organizationId)
          .eq('phone', data.phone)
          .maybeSingle();

        await provisionEvolutionInstance({
          supabase,
          organizationId: request.organizationId,
          connectionId: data.id,
          instanceName: data.instance_name,
          sellerId: seller?.id ?? null,
        });
      } catch (provisioningError) {
        logger.warn({ provisioningError, instanceName: data.instance_name, organizationId: request.organizationId }, 'Evolution provisioning failed during connection creation');
      }
    }

    emitTenantEvent(request.organizationId, 'connections:created', {
      connection: data,
    });

    res.status(201).json({ connection: data });
  } catch (error) {
    next(error);
  }
});

connectionsRouter.post('/:connectionId/connect', async (req, res, next) => {
  try {
    const request = req as AuthenticatedRequest;
    const supabase = request.supabase;

    if (!supabase || !request.organizationId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .select('*')
      .eq('id', req.params.connectionId)
      .eq('organization_id', request.organizationId)
      .maybeSingle();

    if (connectionError) {
      return next(connectionError);
    }

    if (!connection) {
      return res.status(404).json({ error: 'connection_not_found' });
    }

    const { data: updatedConnection, error: updateError } = await supabase
      .from('connections')
      .update({ status: 'connecting', updated_at: new Date().toISOString() })
      .eq('id', connection.id)
      .eq('organization_id', request.organizationId)
      .select('*')
      .single();

    if (updateError) {
      return next(updateError);
    }

    if (updatedConnection.api_provider === 'evolution') {
      try {
        const { data: seller } = await supabase
          .from('sellers')
          .select('id')
          .eq('organization_id', request.organizationId)
          .eq('phone', updatedConnection.phone)
          .maybeSingle();

        await provisionEvolutionInstance({
          supabase,
          organizationId: request.organizationId,
          connectionId: updatedConnection.id,
          instanceName: updatedConnection.instance_name,
          sellerId: seller?.id ?? null,
        });
      } catch (provisioningError) {
        logger.warn({ provisioningError, instanceName: updatedConnection.instance_name, organizationId: request.organizationId }, 'Evolution provisioning failed during manual connect');
      }
    }

    emitTenantEvent(request.organizationId, 'connections:updated', {
      connection: updatedConnection,
    });

    res.json({ connection: updatedConnection });
  } catch (error) {
    next(error);
  }
});

connectionsRouter.patch('/:connectionId/status', async (req, res, next) => {
  try {
    const request = req as AuthenticatedRequest;
    const supabase = request.supabase;

    if (!supabase || !request.organizationId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const payload = updateStatusSchema.parse(req.body);

    const { data, error } = await supabase
      .from('connections')
      .update({ status: payload.status })
      .eq('id', req.params.connectionId)
      .eq('organization_id', request.organizationId)
      .select('*')
      .single();

    if (error) {
      return next(error);
    }

    emitTenantEvent(request.organizationId, 'connections:updated', {
      connection: data,
    });

    res.json({ connection: data });
  } catch (error) {
    next(error);
  }
});

connectionsRouter.delete('/:connectionId', async (req, res, next) => {
  try {
    const request = req as AuthenticatedRequest;
    const supabase = request.supabase;

    if (!supabase || !request.organizationId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', req.params.connectionId)
      .eq('organization_id', request.organizationId);

    if (error) {
      return next(error);
    }

    emitTenantEvent(request.organizationId, 'connections:deleted', {
      connectionId: req.params.connectionId,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
