import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { emitTenantEvent } from '../realtime/socket.js';
const dealSchema = z.object({
    stage: z.enum(['prospeccao', 'qualificacao', 'proposta', 'negociacao', 'fechamento']),
    company: z.string().min(1),
    value: z.number().nonnegative(),
    consultant_id: z.string().min(1),
    consultant_name: z.string().min(1),
    consultant_initials: z.string().min(1),
    days_in_stage: z.number().int().nonnegative().optional(),
    followup_status: z.enum(['vencido', 'hoje', 'amanhã', 'ok', 'reunião', 'contrato']),
    checklist: z.any().nullable().optional(),
    color: z.string().min(1),
    info: z.string().nullable().optional(),
    info_type: z.enum(['danger', 'success', 'info']).nullable().optional(),
});
const updateStageSchema = z.object({
    stage: z.enum(['prospeccao', 'qualificacao', 'proposta', 'negociacao', 'fechamento']),
});
export const crmRouter = Router();
crmRouter.use(requireAuth);
crmRouter.get('/deals', async (req, res, next) => {
    try {
        const request = req;
        const supabase = request.supabase;
        if (!supabase || !request.organizationId) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        const { data, error } = await supabase
            .from('deals')
            .select('*')
            .eq('organization_id', request.organizationId)
            .order('created_at', { ascending: false });
        if (error) {
            return next(error);
        }
        res.json({ deals: data || [] });
    }
    catch (error) {
        next(error);
    }
});
crmRouter.post('/deals', async (req, res, next) => {
    try {
        const request = req;
        const supabase = request.supabase;
        if (!supabase || !request.organizationId) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        const payload = dealSchema.parse(req.body);
        const { data, error } = await supabase
            .from('deals')
            .insert({
            ...payload,
            organization_id: request.organizationId,
        })
            .select('*')
            .single();
        if (error) {
            return next(error);
        }
        emitTenantEvent(request.organizationId, 'crm:deal_created', {
            deal: data,
        });
        res.status(201).json({ deal: data });
    }
    catch (error) {
        next(error);
    }
});
crmRouter.patch('/deals/:dealId', async (req, res, next) => {
    try {
        const request = req;
        const supabase = request.supabase;
        const { dealId } = req.params;
        if (!supabase || !request.organizationId) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        const payload = updateStageSchema.parse(req.body);
        const { data, error } = await supabase
            .from('deals')
            .update({ stage: payload.stage })
            .eq('id', dealId)
            .eq('organization_id', request.organizationId)
            .select('*')
            .single();
        if (error) {
            return next(error);
        }
        emitTenantEvent(request.organizationId, 'crm:deal_updated', {
            deal: data,
        });
        res.json({ deal: data });
    }
    catch (error) {
        next(error);
    }
});
crmRouter.delete('/deals/:dealId', async (req, res, next) => {
    try {
        const request = req;
        const supabase = request.supabase;
        const { dealId } = req.params;
        if (!supabase || !request.organizationId) {
            return res.status(401).json({ error: 'unauthorized' });
        }
        const { error } = await supabase
            .from('deals')
            .delete()
            .eq('id', dealId)
            .eq('organization_id', request.organizationId);
        if (error) {
            return next(error);
        }
        emitTenantEvent(request.organizationId, 'crm:deal_deleted', {
            dealId,
        });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
