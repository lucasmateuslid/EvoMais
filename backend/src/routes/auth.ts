import { createClient } from '@supabase/supabase-js';
import { Router } from 'express';
import { z } from 'zod';

import { config } from '../config.js';
import type { TenantAwareRequest } from '../middleware/tenant.js';
import { adminSupabase } from '../services/supabase.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authRouter = Router();

function hasTenantMismatch(req: TenantAwareRequest, organizationId?: string | null) {
  return Boolean(req.tenantOrganizationId && organizationId && req.tenantOrganizationId !== organizationId);
}

authRouter.post('/login', async (req, res, next) => {
  try {
    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
      return res.status(503).json({
        error: 'supabase_not_configured',
        message: 'Supabase backend auth is not configured.',
      });
    }

    const payload = loginSchema.parse(req.body);
    const authClient = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await authClient.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error || !data.session || !data.user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Invalid email or password.',
      });
    }

    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (profileError) {
      return next(profileError);
    }

    if (hasTenantMismatch(req as TenantAwareRequest, profile?.organization_id)) {
      return res.status(403).json({
        error: 'tenant_mismatch',
        message: 'Authenticated profile does not belong to the current tenant subdomain.',
      });
    }

    res.json({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: data.user,
      profile: profile || null,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : null;

    if (!token) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { data: authData, error: authError } = await adminSupabase.auth.getUser(token);

    if (authError || !authData.user) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      return next(profileError);
    }

    if (hasTenantMismatch(req as TenantAwareRequest, profile?.organization_id)) {
      return res.status(403).json({
        error: 'tenant_mismatch',
        message: 'Authenticated profile does not belong to the current tenant subdomain.',
      });
    }

    res.json({
      user: authData.user,
      profile: profile || null,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', (_req, res) => {
  res.status(204).send();
});

authRouter.post('/super-admin/login', async (req, res, next) => {
  try {
    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
      return res.status(503).json({
        error: 'supabase_not_configured',
        message: 'Supabase backend auth is not configured.',
      });
    }

    const payload = loginSchema.parse(req.body);
    const authClient = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await authClient.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error || !data.session || !data.user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Invalid email or password.',
      });
    }

    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (profileError) {
      return next(profileError);
    }

    if (hasTenantMismatch(req as TenantAwareRequest, profile?.organization_id)) {
      return res.status(403).json({
        error: 'tenant_mismatch',
        message: 'Authenticated profile does not belong to the current tenant subdomain.',
      });
    }

    // Verify super_admin role
    if (!profile || profile.role !== 'super_admin') {
      return res.status(403).json({
        error: 'forbidden',
        message: 'Only super admins can access this endpoint.',
      });
    }

    res.json({
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: data.user,
      profile: profile,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
      return res.status(503).json({
        error: 'supabase_not_configured',
        message: 'Supabase backend auth is not configured.',
      });
    }

    const payload = z.object({
      email: z.string().email(),
    }).parse(req.body);

    const authClient = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { error } = await authClient.auth.resetPasswordForEmail(payload.email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`,
    });

    if (error) {
      return next(error);
    }

    res.json({
      success: true,
      message: 'Email de recuperação enviado. Verifique sua caixa de entrada.',
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/reset-password', async (req, res, next) => {
  try {
    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
      return res.status(503).json({
        error: 'supabase_not_configured',
        message: 'Supabase backend auth is not configured.',
      });
    }

    const payload = z.object({
      token: z.string().optional(),
      accessToken: z.string().optional(),
      refreshToken: z.string().optional(),
      password: z.string().min(6),
    }).parse(req.body);

    const accessToken = payload.accessToken || payload.token;

    if (!accessToken || !payload.refreshToken) {
      return res.status(400).json({
        error: 'invalid_token',
        message: 'Use o fluxo de recuperação no navegador para concluir a redefinição.',
      });
    }

    const authClient = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { error: sessionError } = await authClient.auth.setSession({
      access_token: accessToken,
      refresh_token: payload.refreshToken,
    });

    if (sessionError) {
      return res.status(401).json({
        error: 'invalid_token',
        message: 'Token inválido ou expirado.',
      });
    }

    const { data, error } = await authClient.auth.updateUser({
      password: payload.password,
    });

    if (!error && data.user) {
      return res.json({
        success: true,
        message: 'Senha redefinida com sucesso.',
      });
    }

    if (!accessToken) {
      return res.status(401).json({
        error: 'invalid_token',
        message: 'Token inválido ou expirado.',
      });
    }

    const { data: authData, error: authError } = await adminSupabase.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return res.status(401).json({
        error: 'invalid_token',
        message: 'Token inválido ou expirado.',
      });
    }

    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(authData.user.id, {
      password: payload.password,
    });

    if (updateError) {
      return next(updateError);
    }

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso.',
    });
  } catch (error) {
    next(error);
  }
});