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

const tenantUserRoleSchema = z.enum(['user', 'viewer', 'admin', 'super_admin']);

const createTenantUserSchema = z.object({
  organization_id: z.string().uuid().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  role: tenantUserRoleSchema.default('user'),
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

function canCreateRole(currentRole?: string | null, targetRole?: string) {
  if (currentRole === 'super_admin') {
    return true;
  }

  return targetRole !== 'super_admin';
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

    const limit = Math.min(Number(req.query.limit ?? 50), 200);
    const offset = Math.max(Number(req.query.offset ?? 0), 0);

    const query = adminSupabase
      .from('tenants')
      .select('id, organization_id, subdomain, domain, status, created_at, organizations(id, name, email, plan, status, max_users, created_at)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

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

tenantsRouter.post('/users', async (req, res, next) => {
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

    const payload = createTenantUserSchema.parse(req.body);

    if (!canCreateRole(currentProfile.role, payload.role)) {
      throw new AppError({
        code: 'forbidden',
        statusCode: 403,
        domain: 'auth',
        message: 'Only super admins can create super admin users.',
      });
    }

    const organizationId = isSuperAdmin(currentProfile)
      ? payload.organization_id
      : currentProfile.organization_id;

    if (!organizationId) {
      throw new AppError({
        code: 'validation_error',
        statusCode: 400,
        domain: 'validation',
        message: 'organization_id is required.',
      });
    }

    if (!isSuperAdmin(currentProfile) && payload.organization_id && payload.organization_id !== currentProfile.organization_id) {
      throw new AppError({
        code: 'forbidden',
        statusCode: 403,
        domain: 'auth',
        message: 'Organization mismatch for the current admin.',
      });
    }

    const { data: organization, error: organizationError } = await adminSupabase
      .from('organizations')
      .select('id, name, email, status, max_users')
      .eq('id', organizationId)
      .maybeSingle();

    if (organizationError) {
      return next(organizationError);
    }

    if (!organization) {
      return res.status(404).json({ error: 'organization_not_found' });
    }

    if (organization.max_users && Number.isFinite(organization.max_users)) {
      const { count: currentCount, error: countError } = await adminSupabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (countError) {
        return next(countError);
      }

      if ((currentCount ?? 0) >= organization.max_users) {
        return res.status(409).json({
          error: 'plan_limit_reached',
          message: `Organization plan limit (${organization.max_users}) reached.`,
        });
      }
    }

    const authAdmin = adminSupabase.auth.admin as {
      createUser: (input: Record<string, unknown>) => Promise<{ data: { user: { id: string } | null } | null; error: Error | null }>;
      deleteUser: (userId: string) => Promise<{ error: Error | null }>;
    };

    const { data: createdUserData, error: createUserError } = await authAdmin.createUser({
      email: payload.email.toLowerCase(),
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        name: payload.name,
        organization_id: organizationId,
        role: payload.role,
        phone: payload.phone || null,
      },
    });

    if (createUserError || !createdUserData?.user?.id) {
      return next(createUserError || new Error('failed to create auth user'));
    }

    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .insert({
        user_id: createdUserData.user.id,
        organization_id: organizationId,
        role: payload.role,
        name: payload.name,
        email: payload.email.toLowerCase(),
        phone: payload.phone || null,
        status: 'active',
      })
      .select('*')
      .single();

    if (profileError) {
      await authAdmin.deleteUser(createdUserData.user.id).catch(() => null);
      return next(profileError);
    }

    res.status(201).json({
      user: createdUserData.user,
      profile,
      organization,
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

    if (payload.subdomain) {
      updates.subdomain = payload.subdomain.toLowerCase();
      if (!payload.domain) {
        updates.domain = `${payload.subdomain.toLowerCase()}.${config.TENANT_ROOT_DOMAIN}`;
      }
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
