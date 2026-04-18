import crypto from 'node:crypto';
import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';

import { config } from '../config.js';
import { logger } from '../logger.js';
import { adminSupabase } from '../services/supabase.js';
import {
  createEvolutionInstanceRecord,
  createEvolutionMessageRecord,
  createEvolutionOrderRecord,
  createEvolutionWebhookLog,
  resolveOrganizationForInstance,
  updateEvolutionInstanceRecord,
  updateEvolutionWebhookLog,
} from '../services/evolutionPersistence.js';

const webhookPayloadSchema = z.record(z.string(), z.unknown());

export const webhookRouter = Router();

type WebhookRequest = Request & { rawBody?: string };

function buildSignature(rawBody: string, secret: string) {
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return `sha256=${digest}`;
}

function isSignatureValid(rawBody: string, signatureHeader: string, secret: string) {
  const expected = buildSignature(rawBody, secret);
  const received = signatureHeader.trim();

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(received, 'utf8');

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function getPayloadValue(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function normalizeEventType(payload: Record<string, unknown>) {
  return (
    getPayloadValue(payload, ['event', 'eventType', 'type', 'action']) || 'unknown'
  ).toLowerCase();
}

function normalizeInstanceName(payload: Record<string, unknown>) {
  return (
    getPayloadValue(payload, ['instanceName', 'instance', 'instance_name']) || null
  );
}

function normalizeRemoteJid(payload: Record<string, unknown>) {
  return getPayloadValue(payload, ['remoteJid', 'remote_jid', 'from', 'phone', 'number']);
}

function normalizeMessageId(payload: Record<string, unknown>) {
  return getPayloadValue(payload, ['messageId', 'message_id', 'id']);
}

function normalizePhone(value: string | null | undefined) {
  return String(value || '').replace(/\D/g, '');
}

function shouldSyncInboundMessage(eventType: string) {
  const normalized = eventType.toLowerCase();

  if (normalized.includes('out')) {
    return false;
  }

  return normalized.includes('message') || normalized.includes('messages') || normalized.includes('notify') || normalized.includes('chat');
}

function extractText(payload: Record<string, unknown>) {
  const directText = getPayloadValue(payload, ['text', 'message', 'content', 'body']);

  if (directText) {
    return directText;
  }

  const nested = payload.data;
  if (nested && typeof nested === 'object') {
    return getPayloadValue(nested as Record<string, unknown>, ['text', 'message', 'content', 'body']);
  }

  return null;
}

function resolveConnectionStatus(eventType: string, payload: Record<string, unknown>) {
  const status = getPayloadValue(payload, ['status', 'state', 'connectionStatus']);
  const qrCode = getPayloadValue(payload, ['qr', 'qrcode', 'qrCode']);

  if (qrCode || eventType.includes('qr')) {
    return 'connecting' as const;
  }

  if (status && ['open', 'connected', 'authenticated', 'online', 'ready'].includes(status.toLowerCase())) {
    return 'connected' as const;
  }

  if (status && ['close', 'closed', 'disconnected', 'offline', 'logout', 'error'].includes(status.toLowerCase())) {
    return 'disconnected' as const;
  }

  if (eventType.includes('disconnect') || eventType.includes('logout')) {
    return 'disconnected' as const;
  }

  return 'connecting' as const;
}

function resolveEvolutionInstanceStatus(eventType: string, payload: Record<string, unknown>) {
  const connectionStatus = resolveConnectionStatus(eventType, payload);
  const qrCode = getPayloadValue(payload, ['qr', 'qrcode', 'qrCode']);
  const errorMessage = getPayloadValue(payload, ['error', 'errorMessage', 'reason']);

  if (errorMessage) {
    return 'error' as const;
  }

  if (qrCode || eventType.includes('qr')) {
    return 'qr_ready' as const;
  }

  if (connectionStatus === 'connected') {
    return 'connected' as const;
  }

  if (connectionStatus === 'disconnected') {
    return 'disconnected' as const;
  }

  return 'generating_qr' as const;
}

function resolveOrderPayload(payload: Record<string, unknown>) {
  const orderPayload =
    (payload.order && typeof payload.order === 'object' ? payload.order : null) ||
    (payload.data && typeof payload.data === 'object' && 'order' in payload.data
      ? (payload.data as Record<string, unknown>).order
      : null);

  if (!orderPayload || typeof orderPayload !== 'object') {
    return null;
  }

  const order = orderPayload as Record<string, unknown>;
  const customerPhone =
    getPayloadValue(order, ['customerPhone', 'phone', 'number']) ||
    getPayloadValue(payload, ['customerPhone', 'phone', 'number']);

  if (!customerPhone) {
    return null;
  }

  return {
    customerPhone,
    customerName: getPayloadValue(order, ['customerName', 'name']),
    orderNumber: getPayloadValue(order, ['orderNumber', 'number']),
    externalId: getPayloadValue(order, ['externalId', 'id']),
    notes: getPayloadValue(order, ['notes', 'comment']),
  };
}

webhookRouter.post('/evolution', async (req, res, next) => {
  try {
    if (!config.WEBHOOK_SECRET) {
      return res.status(503).json({
        error: 'webhook_not_configured',
        message: 'WEBHOOK_SECRET is required to process webhook events.',
      });
    }

    const signature = String(req.header('x-webhook-signature') || '');

    if (!signature) {
      return res.status(401).json({
        error: 'invalid_signature',
        message: 'Webhook signature is required.',
      });
    }

    const request = req as WebhookRequest;
    const rawBody = request.rawBody || JSON.stringify(req.body || {});

    if (!isSignatureValid(rawBody, signature, config.WEBHOOK_SECRET)) {
      return res.status(401).json({
        error: 'invalid_signature',
        message: 'Webhook signature is invalid.',
      });
    }

    const payload = webhookPayloadSchema.parse(req.body);
    const eventType = normalizeEventType(payload);
    const instanceName = normalizeInstanceName(payload);
    const organizationId = instanceName ? await resolveOrganizationForInstance(adminSupabase, instanceName) : null;

    const webhookLog = await createEvolutionWebhookLog(adminSupabase, {
      organizationId,
      eventType,
      payload,
      status: 'received',
    });

    try {
      if (instanceName && organizationId) {
        const status = resolveEvolutionInstanceStatus(eventType, payload);
        const qrCode = getPayloadValue(payload, ['qr', 'qrcode', 'qrCode']);
        const errorMessage = getPayloadValue(payload, ['error', 'errorMessage', 'reason']);

        await createEvolutionInstanceRecord(adminSupabase, {
          organizationId,
          instanceName,
          status,
          qrCode,
          errorMessage,
          rawPayload: payload,
        });

        await updateEvolutionInstanceRecord(adminSupabase, organizationId, instanceName, {
          status,
          qrCode,
          errorMessage,
          lastHeartbeat: new Date().toISOString(),
          rawPayload: payload,
        });

        if (organizationId) {
          await adminSupabase
            .from('connections')
            .update({ status: resolveConnectionStatus(eventType, payload) })
            .eq('organization_id', organizationId)
            .eq('instance_name', instanceName);
        }

        const remoteJid = normalizeRemoteJid(payload);
        const messageId = normalizeMessageId(payload);
        const text = extractText(payload);
        const direction = eventType.includes('out') ? 'outbound' : 'inbound';

        if (remoteJid) {
          await createEvolutionMessageRecord(adminSupabase, {
            organizationId,
            instanceName,
            remoteJid,
            messageId,
            direction,
            content: text,
            status: eventType.includes('read') ? 'read' : 'delivered',
            rawPayload: payload,
          });

          if (text && shouldSyncInboundMessage(eventType)) {
            const normalizedRemotePhone = normalizePhone(remoteJid);

            const { data: connection } = await adminSupabase
              .from('connections')
              .select('id, phone')
              .eq('organization_id', organizationId)
              .eq('instance_name', instanceName)
              .maybeSingle();

            const sellerPhone = normalizePhone(connection?.phone);

            if (normalizedRemotePhone && sellerPhone && normalizedRemotePhone !== sellerPhone) {
              const { data: seller } = await adminSupabase
                .from('sellers')
                .select('id, name')
                .eq('organization_id', organizationId)
                .eq('phone', sellerPhone)
                .maybeSingle();

              if (seller?.id) {
                const timestamp = new Date().toISOString();

                const { data: conversation, error: conversationError } = await adminSupabase
                  .from('conversations')
                  .upsert(
                    {
                      organization_id: organizationId,
                      seller_id: seller.id,
                      contact_phone: normalizedRemotePhone,
                      contact_name: null,
                      status: 'open',
                      last_message_at: timestamp,
                      updated_at: timestamp,
                    },
                    { onConflict: 'seller_id,contact_phone' },
                  )
                  .select('id')
                  .single();

                if (conversationError) {
                  throw conversationError;
                }

                if (messageId) {
                  await adminSupabase
                    .from('messages')
                    .upsert(
                      {
                        organization_id: organizationId,
                        conversation_id: conversation.id,
                        seller_id: seller.id,
                        sender_type: 'contact',
                        sender_name: null,
                        content: text,
                        message_id: messageId,
                        status: 'delivered',
                        updated_at: timestamp,
                      },
                      { onConflict: 'message_id' },
                    );
                } else {
                  await adminSupabase
                    .from('messages')
                    .insert({
                      organization_id: organizationId,
                      conversation_id: conversation.id,
                      seller_id: seller.id,
                      sender_type: 'contact',
                      sender_name: null,
                      content: text,
                      status: 'delivered',
                      updated_at: timestamp,
                    });
                }
              }
            }
          }
        }

        const orderPayload = resolveOrderPayload(payload);
        if (orderPayload) {
          await createEvolutionOrderRecord(adminSupabase, {
            organizationId,
            customerPhone: orderPayload.customerPhone,
            customerName: orderPayload.customerName,
            orderNumber: orderPayload.orderNumber,
            externalId: orderPayload.externalId,
            notes: orderPayload.notes,
            rawPayload: payload,
          });
        }
      }

      await updateEvolutionWebhookLog(adminSupabase, webhookLog.id, {
        status: 'processed',
        processedAt: new Date().toISOString(),
      });
    } catch (processingError) {
      logger.warn({ processingError, eventType, instanceName }, 'Evolution webhook processing failed');

      await updateEvolutionWebhookLog(adminSupabase, webhookLog.id, {
        status: 'failed',
        errorMessage: processingError instanceof Error ? processingError.message : 'unknown_error',
        processedAt: new Date().toISOString(),
      });

      throw processingError;
    }

    logger.info({ eventType, instanceName, organizationId }, 'Evolution webhook received');

    res.json({
      received: true,
      eventType,
    });
  } catch (error) {
    next(error);
  }
});