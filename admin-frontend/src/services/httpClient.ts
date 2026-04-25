import { getAdminSession } from '../lib/session';

const BACKEND_URL = import.meta.env.VITE_ADMIN_BACKEND_URL?.replace(/\/$/, '') || '';
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

function requireBackendUrl() {
  if (!BACKEND_URL) {
    throw new Error('VITE_ADMIN_BACKEND_URL nao configurado.');
  }

  return BACKEND_URL;
}

export function getAdminBackendUrl() {
  return requireBackendUrl();
}

async function getAccessToken() {
  return getAdminSession()?.accessToken || null;
}

function withTimeoutSignal(init?: RequestInit) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT_MS);
  const signal = init?.signal ?? controller.signal;

  return {
    signal,
    clear: () => window.clearTimeout(timeout),
  };
}

export async function authorizedFetch(path: string, init?: RequestInit) {
  const backendUrl = requireBackendUrl();
  const token = await getAccessToken();

  if (!token) {
    throw new Error('Super admin nao autenticado');
  }

  const timed = withTimeoutSignal(init);

  try {
    return await fetch(`${backendUrl}${path}`, {
      ...init,
      signal: timed.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
    });
  } finally {
    timed.clear();
  }
}

export async function publicFetch(path: string, init?: RequestInit) {
  const backendUrl = requireBackendUrl();
  const timed = withTimeoutSignal(init);

  try {
    return await fetch(`${backendUrl}${path}`, {
      ...init,
      signal: timed.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
  } finally {
    timed.clear();
  }
}