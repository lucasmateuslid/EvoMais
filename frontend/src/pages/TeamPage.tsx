import { useEffect, useState } from 'react';

import { teamService, type TeamMember } from '../services/teamService';

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadMembers() {
      try {
        setLoading(true);
        const data = await teamService.listMembers();
        if (!mounted) {
          return;
        }
        setMembers(data);
        setError(null);
      } catch (err) {
        if (!mounted) {
          return;
        }
        setError('Nao foi possivel carregar a equipe.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadMembers();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return <div className="rounded-lg border border-divider-subtle bg-surface p-6 text-sm font-medium text-secondary">Carregando equipe...</div>;
  }

  if (error) {
    return <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-300">{error}</div>;
  }

  return (
    <div className="rounded-lg border border-divider-subtle bg-surface p-6 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold text-primary">Equipe</h2>
      <p className="mb-4 text-sm font-medium text-secondary">Membros da organizacao com acesso ao sistema.</p>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-divider-subtle bg-surface-input/50 text-primary">
              <th className="py-2 pr-4 font-medium">Nome</th>
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Papel</th>
              <th className="py-2 pr-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member.id} className="border-b border-divider-subtle/60 text-primary hover:bg-surface-input/35 transition-colors">
                <td className="py-2 pr-4">{member.name}</td>
                <td className="py-2 pr-4 text-secondary font-medium">{member.email}</td>
                <td className="py-2 pr-4 text-secondary font-semibold">{member.role}</td>
                <td className="py-2 pr-4 text-secondary font-semibold">{member.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}