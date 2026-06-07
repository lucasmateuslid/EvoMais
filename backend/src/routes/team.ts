import { Router } from 'express';
import { z } from 'zod';

import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { adminSupabase } from '../services/supabase.js';

const memberRoleSchema = z.enum(['admin', 'user', 'viewer']);

const inviteMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  phone: z.string().optional(),
  role: memberRoleSchema.default('user'),
});

const updateMemberSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  role: memberRoleSchema.optional(),
  status: z.string().optional(),
});

function canAssignRole(currentRole: string | null | undefined, targetRole: string | undefined) {
  if (!targetRole) {
    return true;
  }
  if (currentRole === 'super_admin') {
    return true;
  }
  return targetRole !== 'admin';
}

async function getCurrentProfile(request: AuthenticatedRequest) {
  if (!request.userId) return null;

  const { data, error } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('user_id', request.userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

function canManageMembers(role?: string | null) {
  return role === 'admin' || role === 'super_admin';
}

export const teamRouter = Router();
teamRouter.use(requireAuth);

teamRouter.get('/members', async (req, res, next) => {
  try {
    const current = await getCurrentProfile(req as AuthenticatedRequest);

    if (!current || !canManageMembers(current.role)) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const { data, error } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('organization_id', current.organization_id)
      .order('created_at', { ascending: false });

    if (error) return next(error);

    res.json({ members: data || [] });
  } catch (error) {
    next(error);
  }
});

teamRouter.post('/members/invite', async (req, res, next) => {
  try {
    const current = await getCurrentProfile(req as AuthenticatedRequest);

    if (!current || !canManageMembers(current.role)) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const payload = inviteMemberSchema.parse(req.body);

    if (!canAssignRole(current.role, payload.role)) {
      return res.status(403).json({
        error: 'forbidden',
        message: 'Only super admins can invite admin members.',
      });
    }

    const authAdmin = adminSupabase.auth.admin as any;
    const { data: inviteResult, error: inviteError } = await authAdmin.inviteUserByEmail(payload.email, {
      data: {
        name: payload.name,
        organization_id: current.organization_id,
        role: payload.role,
      },
    });

    if (inviteError || !inviteResult?.user) {
      return next(inviteError);
    }

    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .insert({
        user_id: inviteResult.user.id,
        organization_id: current.organization_id,
        role: payload.role,
        name: payload.name,
        email: payload.email,
        phone: payload.phone || null,
        status: 'pending',
      })
      .select('*')
      .single();

    if (profileError) {
      return next(profileError);
    }

    res.status(201).json({
      user: inviteResult.user,
      profile,
    });
  } catch (error) {
    next(error);
  }
});

teamRouter.patch('/members/:profileId', async (req, res, next) => {
  try {
    const current = await getCurrentProfile(req as AuthenticatedRequest);

    if (!current || !canManageMembers(current.role)) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const payload = updateMemberSchema.parse(req.body);

    if (!canAssignRole(current.role, payload.role)) {
      return res.status(403).json({
        error: 'forbidden',
        message: 'Only super admins can promote members to admin.',
      });
    }

    const { data: target, error: targetError } = await adminSupabase
      .from('profiles')
      .select('id, organization_id, role')
      .eq('id', req.params.profileId)
      .maybeSingle();

    if (targetError || !target) {
      return res.status(404).json({ error: 'not_found' });
    }

    if (current.role !== 'super_admin' && target.organization_id !== current.organization_id) {
      return res.status(403).json({ error: 'forbidden' });
    }

    if (current.role !== 'super_admin' && target.role === 'super_admin') {
      return res.status(403).json({
        error: 'forbidden',
        message: 'Only super admins can edit super admin members.',
      });
    }

    const { data, error } = await adminSupabase
      .from('profiles')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.params.profileId)
      .select('*')
      .single();

    if (error) return next(error);

    res.json({ member: data });
  } catch (error) {
    next(error);
  }
});
