// Evolution API v2 Wrapper

import { useAuthStore } from '../store/authStore';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';

if (!BACKEND_URL) {
  throw new Error('VITE_BACKEND_URL não configurado.');
}

async function getAccessToken() {
  return useAuthStore.getState().accessToken;
}

export const evolutionApi = {
  async createInstance(instanceName: string) {
    const token = await getAccessToken();

    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(`${BACKEND_URL}/api/evolution/instances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        instanceName,
      }),
    });

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

    const response = await fetch(`${BACKEND_URL}/api/evolution/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        instanceName,
        number,
        text,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro ao enviar mensagem');
    }

    return response.json();
  }
};
