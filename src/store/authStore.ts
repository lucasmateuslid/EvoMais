import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  organizationId: string | null;
  profile: any | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setOrganizationId: (id: string | null) => void;
  setProfile: (profile: any | null) => void;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  organizationId: null,
  profile: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setOrganizationId: (organizationId) => set({ organizationId }),
  setProfile: (profile) => set({ profile }),
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, organizationId: null, profile: null });
  },
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        set({ user: session.user });
        
        // Fetch profile to get organization_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
          
        if (profile) {
          set({ profile, organizationId: (profile as any).organization_id });
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      set({ isLoading: false });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        set({ user: session.user });
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
          
        if (profile) {
          set({ profile, organizationId: (profile as any).organization_id });
        }
      } else if (event === 'SIGNED_OUT') {
        set({ user: null, organizationId: null, profile: null });
      }
    });
  },
}));
