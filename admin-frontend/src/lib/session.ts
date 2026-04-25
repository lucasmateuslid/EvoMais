export const ADMIN_SESSION_KEY = 'evomais-admin-session';

export type AdminSessionProfile = {
  role?: string;
  name?: string | null;
  email?: string | null;
  organization_id?: string | null;
};

export type AdminSession = {
  accessToken: string;
  refreshToken?: string;
  user: unknown;
  profile: AdminSessionProfile | null;
};

let inMemorySession: AdminSession | null = null;

export function getAdminSession(): AdminSession | null {
  return inMemorySession;
}

export function setAdminSession(session: AdminSession) {
  inMemorySession = session;
}

export function clearAdminSession() {
  inMemorySession = null;
}