import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/AppError.js';
import { config } from '../config.js';
import { adminSupabase } from '../services/supabase.js';

export interface TenantAwareRequest extends Request {
  tenantSubdomain?: string;
  tenantOrganizationId?: string;
  tenantDomain?: string;
}

function normalizeHost(value: string) {
  return value.trim().toLowerCase().replace(/:\d+$/, '');
}

function extractSubdomain(host: string) {
  const normalized = normalizeHost(host);

  if (!normalized || normalized === 'localhost' || normalized === '127.0.0.1') {
    return null;
  }

  const rootDomain = config.TENANT_ROOT_DOMAIN.toLowerCase();
  const localRootDomain = config.TENANT_LOCAL_ROOT_DOMAIN.toLowerCase();

  if (normalized.endsWith(`.${rootDomain}`)) {
    const candidate = normalized.slice(0, -(`.${rootDomain}`.length));
    return candidate || null;
  }

  if (normalized.endsWith(`.${localRootDomain}`)) {
    const candidate = normalized.slice(0, -(`.${localRootDomain}`.length));
    return candidate || null;
  }

  return null;
}

function resolveIncomingHost(req: Request) {
  const forwardedHost = req.header('x-forwarded-host');
  if (forwardedHost) {
    const firstForwarded = forwardedHost.split(',')[0]?.trim();
    if (firstForwarded) {
      return firstForwarded;
    }
  }

  return req.header('host') || '';
}

export async function resolveTenantFromHost(req: TenantAwareRequest, _res: Response, next: NextFunction) {
  if (!config.ENABLE_TENANT_SUBDOMAIN) {
    return next();
  }

  const incomingHost = resolveIncomingHost(req);
  const subdomain = extractSubdomain(incomingHost);

  if (!subdomain) {
    return next();
  }

  const { data, error } = await adminSupabase
    .from('tenants')
    .select('organization_id, subdomain, domain, status')
    .eq('subdomain', subdomain)
    .maybeSingle();

  if (error) {
    return next(error);
  }

  if (!data || data.status !== 'active' || !data.organization_id) {
    return next(
      new AppError({
        code: 'tenant_not_found',
        statusCode: 404,
        domain: 'auth',
        message: 'Tenant not found for the current subdomain.',
      }),
    );
  }

  req.tenantSubdomain = data.subdomain;
  req.tenantOrganizationId = data.organization_id;
  req.tenantDomain = data.domain;

  return next();
}
