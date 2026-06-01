import { createClient } from '@supabase/supabase-js';

import { backendCapabilities, config } from '../config.js';

function requireSupabaseEnv(value: string | undefined, name: string) {
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is required to initialize Supabase clients.`);
  }

  if (value.includes('placeholder')) {
    throw new Error(`${name} cannot use placeholder values.`);
  }

  return value;
}

const supabaseUrl = requireSupabaseEnv(config.SUPABASE_URL, 'SUPABASE_URL');
const supabaseServiceRoleKey = requireSupabaseEnv(config.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');
const supabaseAnonKey = requireSupabaseEnv(config.SUPABASE_ANON_KEY, 'SUPABASE_ANON_KEY');

export const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'x-evomais-backend': 'true',
    },
  },
});

export function createUserSupabaseClient(accessToken: string) {
  if (!accessToken) {
    throw new Error('accessToken is required to create a user Supabase client.');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export function isSupabaseReady() {
  return backendCapabilities.supabase;
}