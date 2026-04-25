import { create } from 'zustand';

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

export const useAuthStore = create<AuthState>()((set, get) => ({
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
      user: any;
      profile: any | null;
    };

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
    disconnectRealtimeSocket();
    set({ accessToken: null, user: null, organizationId: null, profile: null });
  },
  initialize: async () => {
    const token = get().accessToken;

    if (!token) {
      set({ accessToken: null, user: null, organizationId: null, profile: null, isLoading: false });
      return;
    }

    const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      set({ accessToken: null, user: null, organizationId: null, profile: null, isLoading: false });
      return;
    }

    const payload = await response.json() as {
      user: any;
      profile: any | null;
    };

    const profile = payload.profile || null;

    set({
      accessToken: token,
      user: payload.user,
      profile,
      organizationId: profile?.organization_id ?? null,
      isLoading: false,
    });
  },
}));
