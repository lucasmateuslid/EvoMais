import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { logger } from '../logger.js';
import { emitTenantEvent } from '../realtime/socket.js';
import { provisionEvolutionInstance } from '../services/evolutionProvisioning.js';
import { generateUniqueConnectionInstanceName } from '../utils/instanceName.js';

const connectionMutationLimiter = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.CONNECTIONS_RATE_LIMIT_PER_USER ?? '15'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.userId || req.ip,
  message: {
    error: 'Too many connection requests. Please wait a minute and try again.',
  },
});

const connectionSchema = z.object({
  name: z.string().trim().min(1),
  phone: z
    .string()
    .trim()
    .min(1)
    .transform(value => value.replace(/\D/g, ''))
    .refine(value => value.length >= 10, 'phone must contain at least 10 digits'),
  instance_name: z.string().trim().min(1).optional(),
  api_provider: z.enum(['evolution', 'whatsmeow']).default('evolution'),
});

const updateStatusSchema = z.object({
  status: z.enum(['connected', 'disconnected', 'connecting']),
});

export const connectionsRouter = Router();

connectionsRouter.use(requireAuth);

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

connectionsRouter.post('/', connectionMutationLimiter, async (req, res, next) => {
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
        phone: payload.phone,
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

        const provisioningResponse = await provisionEvolutionInstance({
          supabase,
          organizationId: request.organizationId,
          connectionId: data.id,
          instanceName: data.instance_name,
          sellerId: seller?.id ?? null,
        });

        if (provisioningResponse.status !== 'sent') {
          const { data: failedConnection } = await supabase
            .from('connections')
            .update({ status: 'disconnected', updated_at: new Date().toISOString() })
            .eq('id', data.id)
            .eq('organization_id', request.organizationId)
            .select('*')
            .single();

          emitTenantEvent(request.organizationId, 'connections:updated', {
            connection: failedConnection ?? data,
          });
        }
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

connectionsRouter.post('/:connectionId/connect', connectionMutationLimiter, async (req, res, next) => {
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

    if (connection.status === 'connecting') {
      const lastUpdateMs = connection.updated_at ? new Date(connection.updated_at).getTime() : 0;
      const isRecentlyConnecting = Number.isFinite(lastUpdateMs) && Date.now() - lastUpdateMs < 30_000;

      if (isRecentlyConnecting) {
        return res.json({ connection });
      }
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

        const provisioningResponse = await provisionEvolutionInstance({
          supabase,
          organizationId: request.organizationId,
          connectionId: updatedConnection.id,
          instanceName: updatedConnection.instance_name,
          sellerId: seller?.id ?? null,
        });

        if (provisioningResponse.status !== 'sent') {
          const { data: failedConnection } = await supabase
            .from('connections')
            .update({ status: 'disconnected', updated_at: new Date().toISOString() })
            .eq('id', updatedConnection.id)
            .eq('organization_id', request.organizationId)
            .select('*')
            .single();

          emitTenantEvent(request.organizationId, 'connections:updated', {
            connection: failedConnection ?? updatedConnection,
          });
        }
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

    const { error: deleteError } = await supabase
      .from('connections')
      .delete()
      .eq('id', req.params.connectionId)
      .eq('organization_id', request.organizationId);

    if (deleteError) {
      return next(deleteError);
    }

    emitTenantEvent(request.organizationId, 'connections:deleted', {
      connectionId: req.params.connectionId,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
