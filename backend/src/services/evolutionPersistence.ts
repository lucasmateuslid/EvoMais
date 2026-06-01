import type { SupabaseClient } from '@supabase/supabase-js';

export type EvolutionInstanceStatus =
  | 'creating'
  | 'queued'
  | 'generating_qr'
  | 'qr_ready'
  | 'connected'
  | 'disconnected'
  | 'error';

export type EvolutionOrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface EvolutionInstanceRecordInput {
  organizationId: string;
  instanceName: string;
  connectionId?: string | null;
  sellerId?: string | null;
  status?: EvolutionInstanceStatus;
  phoneNumber?: string | null;
  qrCode?: string | null;
  qrExpiresAt?: string | null;
  lastHeartbeat?: string | null;
  errorMessage?: string | null;
  rawPayload?: unknown;
}

export interface EvolutionWebhookLogInput {
  organizationId?: string | null;
  source?: string;
  eventType: string;
  idempotencyKey?: string | null;
  instanceName?: string | null;
  messageId?: string | null;
  payload: unknown;
  status?: 'received' | 'processed' | 'failed' | 'dead';
  errorMessage?: string | null;
  processedAt?: string | null;
}

export interface EvolutionMessageRecordInput {
  organizationId?: string | null;
  instanceName: string;
  remoteJid: string;
  messageId?: string | null;
  direction?: 'inbound' | 'outbound';
  content?: string | null;
  mediaUrl?: string | null;
  status?: 'pending' | 'delivered' | 'read' | 'failed';
  rawPayload?: unknown;
}

export interface EvolutionOrderRecordInput {
  organizationId: string;
  connectionId?: string | null;
  conversationId?: string | null;
  sellerId?: string | null;
  customerPhone: string;
  customerName?: string | null;
  status?: EvolutionOrderStatus;
  totalValue?: number;
  currency?: string;
  items?: unknown;
  notes?: string | null;
  orderNumber?: string | null;
  externalId?: string | null;
  rawPayload?: unknown;
}

export async function createEvolutionInstanceRecord(
  supabase: SupabaseClient,
  input: EvolutionInstanceRecordInput,
) {
  const { data, error } = await supabase
    .from('evolution_instances')
    .upsert(
      {
        organization_id: input.organizationId,
        connection_id: input.connectionId ?? null,
        seller_id: input.sellerId ?? null,
        instance_name: input.instanceName,
        status: input.status ?? 'creating',
        phone_number: input.phoneNumber ?? null,
        qr_code: input.qrCode ?? null,
        qr_expires_at: input.qrExpiresAt ?? null,
        last_heartbeat: input.lastHeartbeat ?? null,
        error_message: input.errorMessage ?? null,
        raw_payload: input.rawPayload ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,instance_name' },
    )
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateEvolutionInstanceRecord(
  supabase: SupabaseClient,
  organizationId: string,
  instanceName: string,
  patch: Partial<Omit<EvolutionInstanceRecordInput, 'organizationId' | 'instanceName'>> & {
    updatedAt?: string;
  },
) {
  const { data, error } = await supabase
    .from('evolution_instances')
    .update({
      connection_id: patch.connectionId ?? undefined,
      seller_id: patch.sellerId ?? undefined,
      status: patch.status,
      phone_number: patch.phoneNumber ?? undefined,
      qr_code: patch.qrCode ?? undefined,
      qr_expires_at: patch.qrExpiresAt ?? undefined,
      last_heartbeat: patch.lastHeartbeat ?? undefined,
      error_message: patch.errorMessage ?? undefined,
      raw_payload: patch.rawPayload ?? undefined,
      updated_at: patch.updatedAt ?? new Date().toISOString(),
    })
    .eq('organization_id', organizationId)
    .eq('instance_name', instanceName)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createEvolutionWebhookLog(
  supabase: SupabaseClient,
  input: EvolutionWebhookLogInput,
) {
  const { data, error } = await supabase
    .from('webhook_logs')
    .insert({
      organization_id: input.organizationId ?? null,
      source: input.source ?? 'evolution',
      event_type: input.eventType,
      idempotency_key: input.idempotencyKey ?? null,
      instance_name: input.instanceName ?? null,
      message_id: input.messageId ?? null,
      payload: input.payload,
      status: input.status ?? 'received',
      error_message: input.errorMessage ?? null,
      processed_at: input.processedAt ?? null,
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateEvolutionWebhookLog(
  supabase: SupabaseClient,
  webhookLogId: string,
  patch: {
    status?: 'received' | 'processed' | 'failed' | 'dead';
    errorMessage?: string | null;
    processedAt?: string | null;
  },
) {
  const { data, error } = await supabase
    .from('webhook_logs')
    .update({
      status: patch.status,
      error_message: patch.errorMessage ?? undefined,
      processed_at: patch.processedAt ?? undefined,
    })
    .eq('id', webhookLogId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createEvolutionMessageRecord(
  supabase: SupabaseClient,
  input: EvolutionMessageRecordInput,
) {
  const { data, error } = await supabase
    .from('evolution_messages')
    .upsert(
      {
        organization_id: input.organizationId ?? null,
        instance_name: input.instanceName,
        remote_jid: input.remoteJid,
        message_id: input.messageId ?? null,
        direction: input.direction ?? 'inbound',
        content: input.content ?? null,
        media_url: input.mediaUrl ?? null,
        status: input.status ?? 'delivered',
        raw_payload: input.rawPayload ?? null,
      },
      { onConflict: 'message_id' },
    )
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createEvolutionOrderRecord(
  supabase: SupabaseClient,
  input: EvolutionOrderRecordInput,
) {
  const { data, error } = await supabase
    .from('evolution_orders')
    .insert({
      organization_id: input.organizationId,
      connection_id: input.connectionId ?? null,
      conversation_id: input.conversationId ?? null,
      seller_id: input.sellerId ?? null,
      customer_phone: input.customerPhone,
      customer_name: input.customerName ?? null,
      status: input.status ?? 'pending',
      total_value: input.totalValue ?? 0,
      currency: input.currency ?? 'BRL',
      items: input.items ?? [],
      notes: input.notes ?? null,
      order_number: input.orderNumber ?? null,
      external_id: input.externalId ?? null,
      raw_payload: input.rawPayload ?? null,
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function resolveOrganizationForInstance(
  supabase: SupabaseClient,
  instanceName: string,
) {
  const { data: instanceRecord } = await supabase
    .from('evolution_instances')
    .select('organization_id')
    .eq('instance_name', instanceName)
    .maybeSingle();

  if (instanceRecord?.organization_id) {
    return instanceRecord.organization_id as string;
  }

  const { data: connectionRecord } = await supabase
    .from('connections')
    .select('organization_id')
    .eq('instance_name', instanceName)
    .maybeSingle();

  return (connectionRecord?.organization_id as string | undefined) ?? null;
}

export function extractEvolutionQrCode(payload: unknown): string | null {
  const visited = new WeakSet<object>();

  function toDataUrl(value: string) {
    const normalized = value.trim().replace(/\s+/g, '');

    if (!normalized) {
      return null;
    }

    if (normalized.startsWith('data:image')) {
      return normalized;
    }

    if (normalized.startsWith('base64,')) {
      return `data:image/png;base64,${normalized.slice('base64,'.length)}`;
    }

    const isLikelyBase64 = /^[A-Za-z0-9+/=]+$/.test(normalized) && normalized.length > 120;
    if (isLikelyBase64) {
      return `data:image/png;base64,${normalized}`;
    }

    return null;
  }

  function walk(value: unknown): string | null {
    if (typeof value === 'string') {
      return toDataUrl(value);
    }

    if (!value || typeof value !== 'object') {
      return null;
    }

    if (visited.has(value)) {
      return null;
    }

    visited.add(value);

    const record = value as Record<string, unknown>;

    for (const key of ['qrCode', 'qrcode', 'qr', 'qr_code']) {
      const candidate = record[key];
      if (typeof candidate === 'string' && candidate.trim()) {
        const qrCode = toDataUrl(candidate);
        if (qrCode) {
          return qrCode;
        }
      }
    }

    for (const nestedValue of Object.values(record)) {
      const nestedResult = walk(nestedValue);
      if (nestedResult) {
        return nestedResult;
      }
    }

    return null;
  }

  return walk(payload);
}
