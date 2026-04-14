import { createClient } from '@supabase/supabase-js';
import { backendCapabilities, config } from '../config.js';
const supabaseUrl = config.SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseServiceRoleKey = config.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';
const supabaseAnonKey = config.SUPABASE_ANON_KEY || 'placeholder-anon-key';
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
export function createUserSupabaseClient(accessToken) {
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
