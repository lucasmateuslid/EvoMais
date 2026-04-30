import { Router } from 'express';
import { z } from 'zod';

import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { logger } from '../logger.js';
import { emitTenantEvent } from '../realtime/socket.js';
import { provisionEvolutionInstance } from '../services/evolutionProvisioning.js';
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

        // load the connection first to get phone number for related seller lookup
    const { data: connectionRecord, error: connFetchError } = await supabase
      .from('connections')
      .select('*')
      .eq('id', req.params.connectionId)
      .eq('organization_id', request.organizationId)
      .maybeSingle();

    if (connFetchError) return next(connFetchError);

    const { error: deleteError } = await supabase
      .from('connections')
      .delete()
      .eq('id', req.params.connectionId)
      .eq('organization_id', request.organizationId);

    if (deleteError) {
      return next(deleteError);
    }

    // If we have a phone on the connection, try to find matching seller(s)
    if (connectionRecord?.phone) {
      const normalizedPhone = String(connectionRecord.phone).replace(/\D/g, '');

      const { data: sellers, error: sellersError } = await supabase
        .from('sellers')
        .select('id')
        .eq('organization_id', request.organizationId)
        .eq('phone', normalizedPhone);

      if (sellersError) return next(sellersError);

      const sellerIds = (sellers || []).map((s: any) => s.id).filter(Boolean);

      if (sellerIds.length > 0) {
        // delete messages for these sellers (scope to organization for safety)
        const { data: deletedMessages, error: delMsgError } = await supabase
          .from('messages')
          .delete()
          .in('seller_id', sellerIds)
          .eq('organization_id', request.organizationId)
          .select('id, conversation_id');

        if (delMsgError) return next(delMsgError);

        // delete conversations for these sellers and capture deleted conversation ids
        const { data: deletedConversations, error: delConvError } = await supabase
          .from('conversations')
          .delete()
          .in('seller_id', sellerIds)
          .eq('organization_id', request.organizationId)
          .select('id');

        if (delConvError) return next(delConvError);

        const deletedConversationIds = (deletedConversations || []).map((c: any) => c.id);

        // notify clients that conversations were removed
        if (deletedConversationIds.length > 0) {
          emitTenantEvent(request.organizationId, 'conversations:deleted', {
            conversationIds: deletedConversationIds,
          });
        }
      }
    }

    emitTenantEvent(request.organizationId, 'connections:deleted', {
      connectionId: req.params.connectionId,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});


// PATCH_MARKER_REMOVE_CHATS

