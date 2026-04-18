import { Router } from 'express';
import { z } from 'zod';

import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { emitTenantEvent } from '../realtime/socket.js';
import { createEvolutionMessageRecord } from '../services/evolutionPersistence.js';
import { sendEvolutionMessage } from '../services/evolutionService.js';
import { adminSupabase } from '../services/supabase.js';

const sendMessageSchema = z.object({
  text: z.string().min(1),
});

const updateConversationSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
  closed_at: z.string().datetime().optional().nullable(),
});

export const chatRouter = Router();
chatRouter.use(requireAuth);

function normalizePhone(value: string | null | undefined) {
  return String(value || '').replace(/\D/g, '');
}

function extractEvolutionMessageId(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const queue: unknown[] = [payload];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || typeof current !== 'object') {
      continue;
    }

    const record = current as Record<string, unknown>;
    for (const key of ['messageId', 'message_id', 'id']) {
      const candidate = record[key];
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    queue.push(...Object.values(record));
  }

  return null;
}

chatRouter.get('/vendors/:vendorId/conversations', async (req, res, next) => {
  try {
    const request = req as AuthenticatedRequest;
    const supabase = request.supabase;

    if (!supabase || !request.organizationId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { vendorId } = req.params;

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, contact_name, contact_phone, status, started_at, last_message_at')
      .eq('organization_id', request.organizationId)
      .eq('seller_id', vendorId)
      .order('last_message_at', { ascending: false });

    if (error) {
      return next(error);
    }

    const ids = (conversations || []).map(conversation => conversation.id);

    const { data: messages, error: messagesError } = ids.length > 0
      ? await supabase
        .from('messages')
        .select('conversation_id, content, created_at')
        .eq('organization_id', request.organizationId)
        .in('conversation_id', ids)
        .order('created_at', { ascending: false })
      : { data: [], error: null };

    if (messagesError) {
      return next(messagesError);
    }

    const previews = new Map<string, { content: string | null; created_at: string | null }>();

    (messages || []).forEach(message => {
      if (!previews.has(message.conversation_id)) {
        previews.set(message.conversation_id, {
          content: message.content,
          created_at: message.created_at,
        });
      }
    });

    const normalized = (conversations || []).map(conversation => ({
      id: conversation.id,
      contactName: conversation.contact_name || conversation.contact_phone,
      contactPhone: conversation.contact_phone,
      status: conversation.status,
      startedAt: conversation.started_at,
      lastMessageAt: conversation.last_message_at,
      preview: previews.get(conversation.id)?.content || null,
    }));

    res.json({ conversations: normalized });
  } catch (error) {
    next(error);
  }
});

chatRouter.get('/vendors/:vendorId/conversations/:conversationId/messages', async (req, res, next) => {
  try {
    const request = req as AuthenticatedRequest;
    const supabase = request.supabase;

    if (!supabase || !request.organizationId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { vendorId, conversationId } = req.params;

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, contact_phone')
      .eq('id', conversationId)
      .eq('seller_id', vendorId)
      .eq('organization_id', request.organizationId)
      .maybeSingle();

    if (conversationError) {
      return next(conversationError);
    }

    if (!conversation) {
      return res.status(404).json({ error: 'not_found' });
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, sender_type, sender_name, content, media_url, media_type, status, created_at')
      .eq('conversation_id', conversationId)
      .eq('organization_id', request.organizationId)
      .order('created_at', { ascending: true });

    if (error) {
      return next(error);
    }

    res.json({
      messages: (messages || []).map(message => ({
        id: message.id,
        sender: message.sender_type,
        senderName: message.sender_name,
        text: message.content,
        mediaUrl: message.media_url,
        mediaType: message.media_type,
        status: message.status,
        createdAt: message.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
});

chatRouter.patch('/vendors/:vendorId/conversations/:conversationId', async (req, res, next) => {
  try {
    const request = req as AuthenticatedRequest;
    const supabase = request.supabase;

    if (!supabase || !request.organizationId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { vendorId, conversationId } = req.params;
    const payload = updateConversationSchema.parse(req.body);

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('seller_id', vendorId)
      .eq('organization_id', request.organizationId)
      .maybeSingle();

    if (conversationError) {
      return next(conversationError);
    }

    if (!conversation) {
      return res.status(404).json({ error: 'not_found' });
    }

    const shouldClose = payload.status === 'resolved' || payload.status === 'closed';
    const closedAt = shouldClose
      ? payload.closed_at || new Date().toISOString()
      : null;

    const { data: updated, error } = await supabase
      .from('conversations')
      .update({
        status: payload.status,
        closed_at: closedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .eq('organization_id', request.organizationId)
      .select('id, status, closed_at, last_message_at')
      .single();

    if (error) {
      return next(error);
    }

    emitTenantEvent(request.organizationId, 'chat:conversation_updated', {
      conversationId,
      vendorId,
      status: updated.status,
      closedAt: updated.closed_at,
      lastMessageAt: updated.last_message_at,
    });

    res.json({ conversation: updated });
  } catch (error) {
    next(error);
  }
});

chatRouter.post('/vendors/:vendorId/conversations/:conversationId/messages', async (req, res, next) => {
  try {
    const request = req as AuthenticatedRequest;
    const supabase = request.supabase;

    if (!supabase || !request.organizationId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { vendorId, conversationId } = req.params;
    const payload = sendMessageSchema.parse(req.body);

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, contact_phone')
      .eq('id', conversationId)
      .eq('seller_id', vendorId)
      .eq('organization_id', request.organizationId)
      .maybeSingle();

    if (conversationError) {
      return next(conversationError);
    }

    if (!conversation) {
      return res.status(404).json({ error: 'not_found' });
    }

    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('name')
      .eq('user_id', request.userId || '')
      .maybeSingle();

    const { data: seller } = await supabase
      .from('sellers')
      .select('phone')
      .eq('id', vendorId)
      .eq('organization_id', request.organizationId)
      .maybeSingle();

    const sellerPhone = normalizePhone(seller?.phone);

    let messageStatus: 'pending' | 'delivered' = 'delivered';

    if (sellerPhone) {
      const { data: connection } = await supabase
        .from('connections')
        .select('instance_name, api_provider')
        .eq('organization_id', request.organizationId)
        .eq('phone', sellerPhone)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (connection?.api_provider === 'evolution') {
        const evolutionResponse = await sendEvolutionMessage({
          instanceName: connection.instance_name,
          number: normalizePhone(conversation.contact_phone),
          text: payload.text,
        });

        messageStatus = evolutionResponse.status === 'sent' ? 'delivered' : 'pending';

        await createEvolutionMessageRecord(supabase, {
          organizationId: request.organizationId,
          instanceName: connection.instance_name,
          remoteJid: normalizePhone(conversation.contact_phone),
          messageId: extractEvolutionMessageId(evolutionResponse.payload),
          direction: 'outbound',
          content: payload.text,
          status: messageStatus,
          rawPayload: evolutionResponse.payload ?? null,
        });
      }
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        organization_id: request.organizationId,
        conversation_id: conversationId,
        seller_id: vendorId,
        sender_type: 'seller',
        sender_name: profile?.name || 'Atendente',
        content: payload.text,
        status: messageStatus,
      })
      .select('id, sender_type, sender_name, content, status, created_at')
      .single();

    if (error) {
      return next(error);
    }

    const nowIso = new Date().toISOString();
    await supabase
      .from('conversations')
      .update({
        last_message_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', conversationId)
      .eq('organization_id', request.organizationId);

    emitTenantEvent(request.organizationId, 'chat:message_created', {
      conversationId,
      vendorId,
      message: {
        id: message.id,
        sender: message.sender_type,
        senderName: message.sender_name,
        text: message.content,
        status: message.status,
        createdAt: message.created_at,
      },
    });

    emitTenantEvent(request.organizationId, 'chat:conversation_updated', {
      conversationId,
      vendorId,
      lastMessageAt: nowIso,
    });

    res.status(201).json({
      message: {
        id: message.id,
        sender: message.sender_type,
        senderName: message.sender_name,
        text: message.content,
        status: message.status,
        createdAt: message.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});
