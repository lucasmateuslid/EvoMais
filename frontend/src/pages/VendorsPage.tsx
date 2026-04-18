import { useState } from 'react';
import { Link as LinkIcon, MessageCircle, Users as UsersIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ConnectionsModal } from '../components/connections/ConnectionsModal';
import { useVendors } from '../hooks/useVendors';
import { vendorsService } from '../services/vendorsService';

function buildInstanceNamePreview(vendorName: string) {
  const normalized = vendorName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${normalized || 'vendedor'}-wa`;
}

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
  const { data, loading, error, refresh } = useVendors();
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);
  const [focusVendorPhoneForConnection, setFocusVendorPhoneForConnection] = useState<string | null>(null);
  const [isCreateVendorModalOpen, setIsCreateVendorModalOpen] = useState(false);
  const [isSubmittingVendor, setIsSubmittingVendor] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [apiProvider, setApiProvider] = useState<'evolution' | 'whatsmeow'>('evolution');

  const instanceNamePreview = buildInstanceNamePreview(vendorName);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmittingVendor(true);
      const created = await vendorsService.create({
        name: vendorName,
        email: vendorEmail,
        phone: vendorPhone,
        connectWhatsApp: true,
        api_provider: apiProvider,
      });

      setVendorName('');
      setVendorEmail('');
      setVendorPhone('');
      setApiProvider('evolution');
      setIsCreateVendorModalOpen(false);
      await refresh();
      setFocusVendorPhoneForConnection(created.seller.phone);
      setIsConnectionsModalOpen(true);
    } catch (err) {
      console.error('Erro ao criar vendedor:', err);
      alert('Nao foi possivel criar vendedor e conexao WhatsApp. Verifique os dados e tente novamente.');
    } finally {
      setIsSubmittingVendor(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
        {error || 'Erro ao carregar vendedores.'}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-end gap-3 sm:flex-row">
        <button
          onClick={() => setIsConnectionsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl border border-divider-subtle bg-surface px-4 py-2 text-sm font-semibold text-primary hover:bg-surface-input transition-colors"
        >
          <LinkIcon className="h-4 w-4" />
          Conexões
        </button>
        <button
          onClick={() => setIsCreateVendorModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
        >
          <UsersIcon className="h-4 w-4" />
          Novo Vendedor
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-divider-subtle bg-surface p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary">Ativos Agora</p>
          <p className="mt-2 text-3xl font-bold text-primary">{data.summary.activeNow}</p>
          <p className="text-sm font-medium text-secondary">de {data.summary.totalVendors} vendedores</p>
        </div>
        <div className="rounded-2xl border border-divider-subtle bg-surface p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary">Conversas Hoje</p>
          <p className="mt-2 text-3xl font-bold text-primary">{data.summary.totalConversationsToday}</p>
        </div>
        <div className="rounded-2xl border border-divider-subtle bg-surface p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary">Gerado em</p>
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
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-primary">
                          {vendor.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-primary">{vendor.name}</p>
                      <p className="text-xs font-medium text-secondary">{vendor.email}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${vendor.status === 'connected' || vendor.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : vendor.status === 'connecting' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                    {vendor.status === 'connected' || vendor.status === 'active' ? 'Conectado' : vendor.status === 'connecting' ? 'Conectando' : 'Desconectado'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-surface-input p-3">
                    <p className="text-[11px] font-bold uppercase text-secondary">Leads Hoje</p>
                    <p className="mt-1 text-lg font-bold text-primary">{vendor.leadsHoje}</p>
                  </div>
                  <div className="rounded-xl bg-surface-input p-3">
                    <p className="text-[11px] font-bold uppercase text-secondary">Conversão</p>
                    <p className="mt-1 text-lg font-bold text-primary">{vendor.conversao}%</p>
                  </div>
                  <div className="rounded-xl bg-surface-input p-3">
                    <p className="text-[11px] font-bold uppercase text-secondary">Conversas</p>
                    <p className="mt-1 text-lg font-bold text-primary">{vendor.totals.conversations}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-surface-input p-3">
                  <p className="text-xs font-bold text-secondary">Última conversa</p>
                  <p className="mt-1 text-sm text-primary">{relativeTime(vendor.ultimaConversa)}</p>
                  <p className="mt-1 text-xs font-medium text-secondary">{vendor.ultimaMensagem || 'Sem mensagens recentes.'}</p>
                </div>
              </div>

              <div className="border-t border-divider-subtle bg-surface-input/60 p-3">
                <button
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-sm font-semibold text-primary"
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
                      <p className="rounded-lg bg-surface p-3 text-xs font-medium text-secondary">Sem conversas para este vendedor.</p>
                    ) : (
                      vendor.conversations.map(conversation => (
                        <button
                          key={conversation.id}
                          onClick={() => navigate(`/chat/${vendor.id}/${conversation.id}`)}
                          className="flex w-full items-center justify-between rounded-lg bg-surface p-3 text-left hover:bg-surface-input/80 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium text-primary">{conversation.name}</p>
                            <p className="text-xs font-medium text-secondary">{conversation.phone}</p>
                          </div>
                          <p className="text-xs font-medium text-secondary">{relativeTime(conversation.time)}</p>
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

      <ConnectionsModal
        isOpen={isConnectionsModalOpen}
        onClose={() => {
          setIsConnectionsModalOpen(false);
          setFocusVendorPhoneForConnection(null);
        }}
        focusVendorPhone={focusVendorPhoneForConnection}
      />

      {isCreateVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-divider-subtle bg-surface p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-primary">Novo Vendedor</h3>
            <p className="mt-1 text-sm text-secondary">Cadastre o vendedor e conecte o WhatsApp no mesmo fluxo.</p>

            <form onSubmit={handleCreateVendor} className="mt-5 space-y-3">
              <input
                type="text"
                required
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Nome do vendedor"
                className="w-full rounded-xl border border-divider-subtle bg-surface-input px-4 py-2.5 text-sm text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <input
                type="email"
                required
                value={vendorEmail}
                onChange={(e) => setVendorEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-divider-subtle bg-surface-input px-4 py-2.5 text-sm text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <input
                type="text"
                required
                value={vendorPhone}
                onChange={(e) => setVendorPhone(e.target.value)}
                placeholder="Telefone com DDD"
                className="w-full rounded-xl border border-divider-subtle bg-surface-input px-4 py-2.5 text-sm text-primary placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-brand"
              />
              <div className="rounded-xl border border-divider-subtle bg-surface-input px-4 py-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-secondary">Instancia gerada automaticamente</p>
                <p className="mt-1 text-sm font-semibold text-primary">{instanceNamePreview}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className={`cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-medium ${apiProvider === 'evolution' ? 'border-brand bg-brand/10 text-brand' : 'border-divider-subtle text-secondary hover:bg-surface-input'}`}>
                  <input type="radio" className="sr-only" checked={apiProvider === 'evolution'} onChange={() => setApiProvider('evolution')} />
                  Evolution
                </label>
                <label className={`cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-medium ${apiProvider === 'whatsmeow' ? 'border-brand bg-brand/10 text-brand' : 'border-divider-subtle text-secondary hover:bg-surface-input'}`}>
                  <input type="radio" className="sr-only" checked={apiProvider === 'whatsmeow'} onChange={() => setApiProvider('whatsmeow')} />
                  Whatsmeow
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateVendorModalOpen(false)}
                  className="flex-1 rounded-xl border border-divider-subtle px-4 py-2.5 text-sm font-semibold text-secondary hover:bg-surface-input"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVendor}
                  className="flex-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
                >
                  {isSubmittingVendor ? 'Criando...' : 'Criar e Conectar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
