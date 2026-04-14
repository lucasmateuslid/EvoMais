// Evolution API v2 Wrapper

const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_GLOBAL_API_KEY = import.meta.env.VITE_EVOLUTION_GLOBAL_API_KEY || '';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';

export const evolutionApi = {
  async createInstance(instanceName: string) {
    if (BACKEND_URL) {
      const response = await fetch(`${BACKEND_URL}/api/evolution/instances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName,
        }),
      });

      return response.json();
    }

    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_GLOBAL_API_KEY
      },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      })
    });
    return response.json();
  },

  async sendMessage(instanceName: string, number: string, text: string) {
    if (BACKEND_URL) {
      const response = await fetch(`${BACKEND_URL}/api/evolution/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName,
          number,
          text,
        }),
      });

      return response.json();
    }

    const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_GLOBAL_API_KEY
      },
      body: JSON.stringify({
        number,
        options: {
          delay: 1200,
          presence: "composing"
        },
        textMessage: {
          text
        }
      })
    });
    return response.json();
  }
};
