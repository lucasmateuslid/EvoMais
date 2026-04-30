import type { SupabaseClient } from '@supabase/supabase-js';

import {
  createEvolutionInstanceRecord,
  extractEvolutionQrCode,
  updateEvolutionInstanceRecord,
} from './evolutionPersistence.js';
import { createEvolutionInstance, reconnectEvolutionInstance } from './evolutionService.js';

export async function provisionEvolutionInstance(params: {
  supabase: SupabaseClient;
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

  if (creationResponse.status === 'conflict') {
    await updateEvolutionInstanceRecord(supabase, organizationId, instanceName, {
      status: 'error',
      rawPayload: creationResponse.payload ?? null,
      errorMessage: creationResponse.message,
    });

    return creationResponse;
  }

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
