import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { supabase } from '../lib/supabase';
import { disconnectRealtimeSocket } from '../services/realtimeService';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';

if (!BACKEND_URL) {
  throw new Error('VITE_BACKEND_URL não configurado.');
}

interface AuthState {
  accessToken: string | null;
  user: any | null;
  organizationId: string | null;
  profile: any | null;
  isLoading: boolean;
  setAccessToken: (token: string | null) => void;
  setUser: (user: any | null) => void;
  setOrganizationId: (id: string | null) => void;
  setProfile: (profile: any | null) => void;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

let authUnsubscribe: (() => void) | null = null;

async function fetchUserProfile(accessToken: string) {
  const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json() as { profile?: any | null };
  return data.profile || null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      accessToken: null,
      user: null,
      organizationId: null,
      profile: null,
      isLoading: true,
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),
      setOrganizationId: (organizationId) => set({ organizationId }),
      setProfile: (profile) => set({ profile }),
      login: async (email, password) => {
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.message || 'Erro ao fazer login');
        }

        const data = await response.json() as {
          accessToken: string;
          refreshToken: string;
          user: any;
          profile: any | null;
        };

        await supabase.auth.setSession({
          access_token: data.accessToken,
          refresh_token: data.refreshToken,
        });

        set({
          accessToken: data.accessToken,
          user: data.user,
          profile: data.profile,
          organizationId: data.profile?.organization_id ?? null,
          isLoading: false,
        });
      },
      signOut: async () => {
        await fetch(`${BACKEND_URL}/api/auth/logout`, { method: 'POST' });
        await supabase.auth.signOut().catch(() => undefined);
        disconnectRealtimeSocket();
        set({ accessToken: null, user: null, organizationId: null, profile: null });
      },
      initialize: async () => {
        if (!authUnsubscribe) {
          const { data } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session?.access_token) {
              set({ accessToken: null, user: null, organizationId: null, profile: null, isLoading: false });
              return;
            }

            void fetchUserProfile(session.access_token)
              .then(profile => {
                set({
                  accessToken: session.access_token,
                  user: session.user,
                  profile,
                  organizationId: profile?.organization_id ?? null,
                  isLoading: false,
                });
              })
              .catch(() => {
                set({
                  accessToken: session.access_token,
                  user: session.user,
                  isLoading: false,
                });
              });
          });

          authUnsubscribe = () => {
            data.subscription.unsubscribe();
          };
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;

        if (!session?.access_token) {
          set({ accessToken: null, user: null, organizationId: null, profile: null, isLoading: false });
          return;
        }

        const profile = await fetchUserProfile(session.access_token);
        set({
          accessToken: session.access_token,
          user: session.user,
          profile,
          organizationId: profile?.organization_id ?? null,
          isLoading: false,
        });
      },
    }),
    {
      name: 'evomais-auth-store',
      partialize: state => ({
        organizationId: state.organizationId,
        profile: state.profile,
      }),
    },
  ),
);
