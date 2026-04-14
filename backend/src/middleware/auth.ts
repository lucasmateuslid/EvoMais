import type { NextFunction, Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';

import { config } from '../config.js';
import { adminSupabase, createUserSupabaseClient } from '../services/supabase.js';

export interface AuthenticatedRequest extends Request {
  authToken?: string;
  userId?: string;
  organizationId?: string;
  supabase?: SupabaseClient;
}

function extractBearerToken(req: Request) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length).trim() || null;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Authorization token is required.',
    });
  }

  if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY || !config.SUPABASE_ANON_KEY) {
    return res.status(503).json({
      error: 'supabase_not_configured',
      message: 'Supabase environment variables are incomplete on the backend.',
    });
  }

  const { data: authData, error: authError } = await adminSupabase.auth.getUser(token);

  if (authError || !authData.user) {
    return res.status(401).json({
      error: 'unauthorized',
      message: 'Invalid or expired token.',
    });
  }

  const authedClient = createUserSupabaseClient(token);

  const { data: profile, error: profileError } = await adminSupabase
    .from('profiles')
    .select('organization_id')
    .eq('user_id', authData.user.id)
    .maybeSingle();

  if (profileError || !profile?.organization_id) {
    return res.status(403).json({
      error: 'forbidden',
      message: 'User profile organization is missing.',
    });
  }

  req.authToken = token;
  req.userId = authData.user.id;
  req.organizationId = profile.organization_id;
  req.supabase = authedClient;

  next();
}