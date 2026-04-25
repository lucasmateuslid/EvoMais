// Evolution API v2 Wrapper

import { useAuthStore } from '../store/authStore';

const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';

if (!BACKEND_URL) {
  throw new Error('VITE_BACKEND_URL não configurado.');
}

async function getAccessToken() {
  return useAuthStore.getState().accessToken;
}

function createTimeoutSignal() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT_MS);

  return {
    signal: controller.signal,
    clear: () => window.clearTimeout(timeout),
  };
}

export const evolutionApi = {
  async createInstance(instanceName: string) {
    const token = await getAccessToken();

    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const timed = createTimeoutSignal();
    const response = await fetch(`${BACKEND_URL}/api/evolution/instances`, {
      method: 'POST',
      signal: timed.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        instanceName,
      }),
    }).finally(() => timed.clear());

    if (!response.ok) {
      throw new Error('Erro ao criar instância');
    }

    return response.json();
  },

  async sendMessage(instanceName: string, number: string, text: string) {
    const token = await getAccessToken();

    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const timed = createTimeoutSignal();
    const response = await fetch(`${BACKEND_URL}/api/evolution/messages`, {
      method: 'POST',
      signal: timed.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        instanceName,
        number,
        text,
      }),
    }).finally(() => timed.clear());

    if (!response.ok) {
      throw new Error('Erro ao enviar mensagem');
    }

    return response.json();
  }
};
