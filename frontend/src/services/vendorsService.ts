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

export const vendorsService = {
  async list(): Promise<VendorsResponse> {
    const response = await authorizedFetch('/api/vendors');

    if (!response.ok) {
      throw new Error('Erro ao carregar vendedores');
    }

    return response.json() as Promise<VendorsResponse>;
  },
};
