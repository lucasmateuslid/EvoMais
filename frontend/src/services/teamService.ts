import { authorizedFetch } from './httpClient';

export interface TeamMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const teamService = {
  async listMembers(): Promise<TeamMember[]> {
    const response = await authorizedFetch('/api/team/members');

    if (!response.ok) {
      throw new Error('Erro ao carregar equipe');
    }

    const data = await response.json() as { members?: TeamMember[] };
    return data.members || [];
  },
};