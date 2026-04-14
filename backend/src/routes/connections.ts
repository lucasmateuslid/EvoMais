import { Router } from 'express';
import { z } from 'zod';

import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

const connectionSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  instance_name: z.string().min(1),
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

    const { data, error } = await supabase
      .from('connections')
      .insert({
        ...payload,
        phone: payload.phone.replace(/\D/g, ''),
        organization_id: request.organizationId,
        status: 'connecting',
      })
      .select('*')
      .single();

    if (error) {
      return next(error);
    }

    res.status(201).json({ connection: data });
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

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
