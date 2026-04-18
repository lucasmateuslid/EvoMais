import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { createEvolutionInstance, sendEvolutionMessage } from '../services/evolutionService.js';
import { createEvolutionInstanceRecord, createEvolutionMessageRecord, extractEvolutionQrCode, updateEvolutionInstanceRecord, } from '../services/evolutionPersistence.js';
const createInstanceSchema = z.object({
    instanceName: z.string().min(1),
});
const sendMessageSchema = z.object({
    instanceName: z.string().min(1),
    number: z.string().min(1),
    text: z.string().min(1),
});
export const evolutionRouter = Router();
evolutionRouter.use(requireAuth);
evolutionRouter.post('/instances', async (req, res, next) => {
    try {
        const authRequest = req;
        const supabase = authRequest.supabase;
        const organizationId = authRequest.organizationId;
        if (!supabase || !organizationId) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        const payload = createInstanceSchema.parse(req.body);
        const instanceRecord = await createEvolutionInstanceRecord(supabase, {
            organizationId,
            instanceName: payload.instanceName,
            status: 'creating',
        });
        const response = await createEvolutionInstance(payload);
        await updateEvolutionInstanceRecord(supabase, organizationId, payload.instanceName, {
            status: response.status === 'sent' ? 'generating_qr' : 'queued',
            qrCode: extractEvolutionQrCode(response.payload ?? null),
            rawPayload: response.payload ?? null,
            errorMessage: response.status === 'queued' ? response.message : null,
        });
        res.json({
            ...response,
            instance: instanceRecord,
        });
    }
    catch (error) {
        next(error);
    }
});
evolutionRouter.get('/instances', async (req, res, next) => {
    try {
        const authRequest = req;
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
    }
    catch (error) {
        next(error);
    }
});
evolutionRouter.post('/messages', async (req, res, next) => {
    try {
        const authRequest = req;
        const supabase = authRequest.supabase;
        const organizationId = authRequest.organizationId;
        if (!supabase || !organizationId) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        const payload = sendMessageSchema.parse(req.body);
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
    }
    catch (error) {
        next(error);
    }
});
