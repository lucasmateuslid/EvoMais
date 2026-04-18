import { authorizedFetch } from './httpClient';

export interface VendorConversationPreview {
  id: string;
  name: string;
  phone: string;
  time: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  status: string;
  leadsHoje: number;
  conversao: number;
  ultimaConversa: string | null;
  ultimaMensagem: string | null;
  conversations: VendorConversationPreview[];
  totals: {
    deals: number;
    conversations: number;
    messages: number;
  };
}

export interface VendorsResponse {
  vendors: Vendor[];
  summary: {
    activeNow: number;
    totalVendors: number;
    totalConversationsToday: number;
  };
  generatedAt: string;
}

export interface CreateVendorPayload {
  name: string;
  email: string;
  phone: string;
  avatar_url?: string | null;
  connectWhatsApp?: boolean;
  instance_name?: string;
  api_provider?: 'evolution' | 'whatsmeow';
}

export const vendorsService = {
  async list(): Promise<VendorsResponse> {
    const response = await authorizedFetch('/api/vendors');

    if (!response.ok) {
      throw new Error('Erro ao carregar vendedores');
    }

    return response.json() as Promise<VendorsResponse>;
  },

  async create(payload: CreateVendorPayload) {
    const response = await authorizedFetch('/api/vendors', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Erro ao criar vendedor');
    }

    return response.json() as Promise<{
      seller: {
        id: string;
        name: string;
        email: string;
        phone: string;
        status: string;
      };
      connection: {
        id: string;
        status: string;
      } | null;
    }>;
  },
};
