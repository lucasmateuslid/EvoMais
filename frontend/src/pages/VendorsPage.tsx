import { useState } from 'react';
import { Link as LinkIcon, MessageCircle, Users as UsersIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ConnectionsModal } from '../components/connections/ConnectionsModal';
import { useVendors } from '../hooks/useVendors';

function relativeTime(value?: string | null) {
  if (!value) {
    return 'Sem conversa recente';
  }

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'Agora';
  if (diffMinutes < 60) return `Há ${diffMinutes} min`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Há ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  return `Há ${diffDays} d`;
}

export default function VendorsPage() {
  const navigate = useNavigate();
  const { data, loading, error } = useVendors();
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-300/40 bg-red-500/10 p-4 text-sm text-red-500">
        {error || 'Erro ao carregar vendedores.'}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-end gap-3 sm:flex-row">
        <button
          onClick={() => setIsConnectionsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl border border-divider-subtle bg-surface px-4 py-2 text-sm font-medium text-secondary"
        >
          <LinkIcon className="h-4 w-4" />
          Conexões
        </button>
        <button className="flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white">
          <UsersIcon className="h-4 w-4" />
          Novo Vendedor
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-divider-subtle bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Ativos Agora</p>
          <p className="mt-2 text-3xl font-bold text-primary">{data.summary.activeNow}</p>
          <p className="text-sm text-secondary">de {data.summary.totalVendors} vendedores</p>
        </div>
        <div className="rounded-2xl border border-divider-subtle bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Conversas Hoje</p>
          <p className="mt-2 text-3xl font-bold text-primary">{data.summary.totalConversationsToday}</p>
        </div>
        <div className="rounded-2xl border border-divider-subtle bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">Gerado em</p>
          <p className="mt-2 text-lg font-semibold text-primary">{new Date(data.generatedAt).toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {data.vendors.map(vendor => {
          const expanded = expandedVendorId === vendor.id;
          return (
            <div key={vendor.id} className="overflow-hidden rounded-2xl border border-divider-subtle bg-surface shadow-sm">
              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 overflow-hidden rounded-full bg-surface-input">
                      {vendor.avatar_url ? (
                        <img src={vendor.avatar_url} alt={vendor.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-secondary">
                          {vendor.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-primary">{vendor.name}</p>
                      <p className="text-xs text-secondary">{vendor.email}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${vendor.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}>
                    {vendor.status === 'active' ? 'Conectado' : vendor.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-surface-input p-3">
                    <p className="text-[10px] font-semibold uppercase text-secondary">Leads Hoje</p>
                    <p className="mt-1 text-lg font-bold text-primary">{vendor.leadsHoje}</p>
                  </div>
                  <div className="rounded-xl bg-surface-input p-3">
                    <p className="text-[10px] font-semibold uppercase text-secondary">Conversão</p>
                    <p className="mt-1 text-lg font-bold text-primary">{vendor.conversao}%</p>
                  </div>
                  <div className="rounded-xl bg-surface-input p-3">
                    <p className="text-[10px] font-semibold uppercase text-secondary">Conversas</p>
                    <p className="mt-1 text-lg font-bold text-primary">{vendor.totals.conversations}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-surface-input p-3">
                  <p className="text-xs font-semibold text-secondary">Última conversa</p>
                  <p className="mt-1 text-sm text-primary">{relativeTime(vendor.ultimaConversa)}</p>
                  <p className="mt-1 text-xs text-secondary">{vendor.ultimaMensagem || 'Sem mensagens recentes.'}</p>
                </div>
              </div>

              <div className="border-t border-divider-subtle bg-surface-input/40 p-3">
                <button
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-sm font-medium text-secondary"
                  onClick={() => setExpandedVendorId(expanded ? null : vendor.id)}
                >
                  <span className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Conversas ({vendor.conversations.length})
                  </span>
                  <span>{expanded ? 'Ocultar' : 'Mostrar'}</span>
                </button>

                {expanded && (
                  <div className="mt-2 space-y-2">
                    {vendor.conversations.length === 0 ? (
                      <p className="rounded-lg bg-surface p-3 text-xs text-secondary">Sem conversas para este vendedor.</p>
                    ) : (
                      vendor.conversations.map(conversation => (
                        <button
                          key={conversation.id}
                          onClick={() => navigate(`/chat/${vendor.id}/${conversation.id}`)}
                          className="flex w-full items-center justify-between rounded-lg bg-surface p-3 text-left hover:bg-surface-input"
                        >
                          <div>
                            <p className="text-sm font-medium text-primary">{conversation.name}</p>
                            <p className="text-xs text-secondary">{conversation.phone}</p>
                          </div>
                          <p className="text-xs text-secondary">{relativeTime(conversation.time)}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConnectionsModal isOpen={isConnectionsModalOpen} onClose={() => setIsConnectionsModalOpen(false)} />
    </div>
  );
}
