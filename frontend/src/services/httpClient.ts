import { useAuthStore } from '../store/authStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';

if (!BACKEND_URL) {
  throw new Error('VITE_BACKEND_URL não configurado.');
}

async function getAccessToken() {
  const appToken = useAuthStore.getState().accessToken;

  if (appToken) {
    return appToken;
  }

  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('authToken');
  }

  return null;
}

export async function authorizedFetch(path: string, init?: RequestInit) {
  const token = await getAccessToken();

  if (!token) {
    throw new Error('Usuário não autenticado');
  }

  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
}

export async function publicFetch(path: string, init?: RequestInit) {
  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
}
