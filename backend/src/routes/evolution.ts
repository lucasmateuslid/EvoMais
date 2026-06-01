import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { createEvolutionInstance, sendEvolutionMessage } from '../services/evolutionService.js';
import {
  createEvolutionInstanceRecord,
  createEvolutionMessageRecord,
  extractEvolutionQrCode,
  updateEvolutionInstanceRecord,
} from '../services/evolutionPersistence.js';
import type { EvolutionInstanceRequest, EvolutionMessageRequest } from '../types/evolution.js';

const createInstanceSchema = z.object({
  instanceName: z.string().trim().min(1),
});

const sendMessageSchema = z.object({
  instanceName: z.string().trim().min(1),
  number: z
    .string()
    .trim()
    .min(1)
    .transform(value => value.replace(/\D/g, ''))
    .refine(value => value.length >= 10, 'number must contain at least 10 digits'),
  text: z.string().trim().min(1),
});

export const evolutionRouter = Router();

const sendMessageLimiter = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.EVOLUTION_RATE_LIMIT_PER_USER ?? '60'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.userId || req.ip,
  message: {
    error: 'Too many Evolution message requests. Please wait a minute and try again.',
  },
});

evolutionRouter.use(requireAuth);

evolutionRouter.post('/instances', async (req, res, next) => {
  try {
    const authRequest = req as AuthenticatedRequest;
    const supabase = authRequest.supabase;
    const organizationId = authRequest.organizationId;

    if (!supabase || !organizationId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const payload: EvolutionInstanceRequest = createInstanceSchema.parse(req.body);
    const instanceRecord = await createEvolutionInstanceRecord(supabase, {
      organizationId,
      instanceName: payload.instanceName,
      status: 'creating',
    });

    const response = await createEvolutionInstance(payload);

    await updateEvolutionInstanceRecord(supabase, organizationId, payload.instanceName, {
      status: response.status === 'sent'
        ? 'generating_qr'
        : response.status === 'conflict'
          ? 'error'
          : 'queued',
      qrCode: extractEvolutionQrCode(response.payload ?? null),
      rawPayload: response.payload ?? null,
      errorMessage: response.status === 'sent' ? null : response.message,
    });

    res.json({
      ...response,
      instance: instanceRecord,
    });
  } catch (error) {
    next(error);
  }
});

evolutionRouter.get('/instances', async (req, res, next) => {
  try {
    const authRequest = req as AuthenticatedRequest;
    const supabase = authRequest.supabase;
    const organizationId = authRequest.organizationId;

    if (!supabase || !organizationId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { data, error } = await supabase
      .from('evolution_instances')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      return next(error);
    }

    res.json({ instances: data || [] });
  } catch (error) {
    next(error);
  }
});

evolutionRouter.post('/messages', sendMessageLimiter, async (req, res, next) => {
  try {
    const authRequest = req as AuthenticatedRequest;
    const supabase = authRequest.supabase;
    const organizationId = authRequest.organizationId;

    if (!supabase || !organizationId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const payload: EvolutionMessageRequest = sendMessageSchema.parse(req.body);
    const response = await sendEvolutionMessage(payload);

    await createEvolutionMessageRecord(supabase, {
      organizationId,
      instanceName: payload.instanceName,
      remoteJid: payload.number,
      direction: 'outbound',
      content: payload.text,
      status: response.status === 'sent' ? 'delivered' : 'pending',
      rawPayload: response.payload ?? null,
    });

    res.json(response);
  } catch (error) {
    next(error);
  }
});