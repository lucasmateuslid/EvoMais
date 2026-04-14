import { Router } from 'express';
import { z } from 'zod';

import { config } from '../config.js';
import { AppError } from '../errors/AppError.js';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import type { TenantAwareRequest } from '../middleware/tenant.js';
import { adminSupabase } from '../services/supabase.js';

const createTenantSchema = z.object({
  organization_id: z.string().uuid().optional(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  plan: z.string().optional(),
  max_users: z.number().int().positive().optional(),
  subdomain: z.string().min(2).max(63).regex(/^[a-z0-9-]+$/),
  domain: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

const updateTenantSchema = z.object({
  subdomain: z.string().min(2).max(63).regex(/^[a-z0-9-]+$/).optional(),
  domain: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

const tenantRouter = Router();
const tenantsRouter = Router();

async function getCurrentProfile(request: AuthenticatedRequest) {
  if (!request.userId) {
    return null;
  }

  const { data, error } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('user_id', request.userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

function isSuperAdmin(profile: { role?: string | null } | null) {
  return profile?.role === 'super_admin';
}

tenantRouter.get('/current', async (req, res, next) => {
  try {
    const request = req as TenantAwareRequest;

    if (!request.tenantOrganizationId) {
      return res.json({
        tenant: null,
      });
    }

    const { data, error } = await adminSupabase
      .from('tenants')
      .select('id, organization_id, subdomain, domain, status, created_at')
      .eq('organization_id', request.tenantOrganizationId)
      .maybeSingle();

    if (error) {
      return next(error);
    }

    res.json({
      tenant: data || null,
    });
  } catch (error) {
    next(error);
  }
});

tenantsRouter.use(requireAuth);

tenantsRouter.get('/', async (req, res, next) => {
  try {
    const request = req as AuthenticatedRequest;
    const currentProfile = await getCurrentProfile(request);

    if (!currentProfile) {
      throw new AppError({
        code: 'forbidden',
        statusCode: 403,
        domain: 'auth',
        message: 'Current profile not found.',
      });
    }

    const query = adminSupabase
      .from('tenants')
      .select('id, organization_id, subdomain, domain, status, created_at, organizations(id, name, email, plan, status, max_users, created_at)')
      .order('created_at', { ascending: false });

    const { data, error } = isSuperAdmin(currentProfile)
      ? await query
      : await query.eq('organization_id', currentProfile.organization_id);

    if (error) {
      return next(error);
    }

    res.json({
      tenants: data || [],
    });
  } catch (error) {
    next(error);
  }
});

tenantsRouter.post('/', async (req, res, next) => {
  try {
    const request = req as AuthenticatedRequest;
    const currentProfile = await getCurrentProfile(request);

    if (!isSuperAdmin(currentProfile)) {
      throw new AppError({
        code: 'forbidden',
        statusCode: 403,
        domain: 'auth',
        message: 'Only super admins can create tenants.',
      });
    }

    const payload = createTenantSchema.parse(req.body);

    let organizationId = payload.organization_id;

    if (!organizationId) {
      if (!payload.name || !payload.email) {
        throw new AppError({
          code: 'validation_error',
          statusCode: 400,
          domain: 'validation',
          message: 'name and email are required when organization_id is not provided.',
        });
      }

      const { data: orgData, error: orgError } = await adminSupabase
        .from('organizations')
        .insert({
          name: payload.name,
          email: payload.email,
          phone: payload.phone || null,
          plan: payload.plan || 'free',
          max_users: payload.max_users || 5,
          status: 'active',
        })
        .select('id')
        .single();

      if (orgError || !orgData?.id) {
        return next(orgError || new Error('failed to create organization'));
      }

      organizationId = orgData.id;
    }

    const normalizedSubdomain = payload.subdomain.toLowerCase();

    const { data, error } = await adminSupabase
      .from('tenants')
      .insert({
        organization_id: organizationId,
        subdomain: normalizedSubdomain,
        domain: payload.domain || `${normalizedSubdomain}.${config.TENANT_ROOT_DOMAIN}`,
        status: payload.status,
      })
      .select('id, organization_id, subdomain, domain, status, created_at')
      .single();

    if (error) {
      return next(error);
    }

    res.status(201).json({
      tenant: data,
    });
  } catch (error) {
    next(error);
  }
});

tenantsRouter.patch('/:tenantId', async (req, res, next) => {
  try {
    const request = req as AuthenticatedRequest;
    const currentProfile = await getCurrentProfile(request);

    if (!isSuperAdmin(currentProfile)) {
      throw new AppError({
        code: 'forbidden',
        statusCode: 403,
        domain: 'auth',
        message: 'Only super admins can update tenants.',
      });
    }

    const payload = updateTenantSchema.parse(req.body);

    const updates: Record<string, unknown> = {
      ...payload,
    };

    if (payload.subdomain && !payload.domain) {
      updates.domain = `${payload.subdomain.toLowerCase()}.${config.TENANT_ROOT_DOMAIN}`;
    }

    const { data, error } = await adminSupabase
      .from('tenants')
      .update(updates)
      .eq('id', req.params.tenantId)
      .select('id, organization_id, subdomain, domain, status, created_at')
      .single();

    if (error) {
      return next(error);
    }

    res.json({ tenant: data });
  } catch (error) {
    next(error);
  }
});

export { tenantRouter, tenantsRouter };
