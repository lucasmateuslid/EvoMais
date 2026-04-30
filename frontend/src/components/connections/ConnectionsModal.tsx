import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Wifi,
  WifiOff,
  Trash2,
  X,
  QrCode,
  Smartphone,
  Server,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { connectionsService, type Connection, type EvolutionInstance } from '../../services/connectionsService';
import { vendorsService, type Vendor } from '../../services/vendorsService';

interface ConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewOnly?: boolean;
  focusVendorPhone?: string | null;
}

function normalizePhone(value: string | null | undefined) {
  return String(value || '').replace(/\D/g, '');
}

function buildInstancePreview(vendorName: string) {
  const normalized = vendorName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${normalized || 'vendedor'}-wa`;
}

export function ConnectionsModal({ isOpen, onClose, viewOnly = false, focusVendorPhone = null }: ConnectionsModalProps) {
  const navigate = useNavigate();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [evolutionInstances, setEvolutionInstances] = useState<EvolutionInstance[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isNewConnectionModalOpen, setIsNewConnectionModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [activeConnectionForQr, setActiveConnectionForQr] = useState<Connection | null>(null);

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newApiProvider, setNewApiProvider] = useState<'evolution' | 'whatsmeow'>('evolution');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [isConnectingVendor, setIsConnectingVendor] = useState(false);
  const [expandedConnectionId, setExpandedConnectionId] = useState<string | null>(null);

  const autoConnectPhoneRef = useRef<string | null>(null);

  const toggleConnection = (id: string) => {
    setExpandedConnectionId(expandedConnectionId === id ? null : id);
  };

  const selectedVendor = useMemo(
    () => vendors.find(vendor => vendor.id === selectedVendorId) || null,
    [vendors, selectedVendorId],
  );

  const vendorsByPhone = useMemo(() => {
    const map = new Map<string, Vendor>();
    for (const vendor of vendors) {
      map.set(normalizePhone(vendor.phone), vendor);
    }
    return map;
  }, [vendors]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void (async () => {
      setLoading(true);
      await Promise.all([fetchConnections(), fetchEvolutionInstances(), fetchVendors()]);
      setLoading(false);
    })();
  }, [isOpen]);

  useEffect(() => {
    if (!isQrModalOpen) {
      return;
    }

    const interval = window.setInterval(() => {
      void fetchConnections();
      void fetchEvolutionInstances();
      void fetchVendors();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isQrModalOpen]);

  useEffect(() => {
    if (!isQrModalOpen || !activeConnectionForQr) {
      return;
    }

    const latestConnection = connections.find(connection => connection.id === activeConnectionForQr.id);

    if (latestConnection?.status === 'connected') {
      setIsQrModalOpen(false);
      setActiveConnectionForQr(null);
    }
  }, [activeConnectionForQr, connections, isQrModalOpen]);

  useEffect(() => {
    if (!isOpen || !focusVendorPhone || vendors.length === 0) {
      return;
    }

    if (autoConnectPhoneRef.current === focusVendorPhone) {
      return;
    }

    const normalizedTarget = normalizePhone(focusVendorPhone);
    const vendor = vendors.find(item => normalizePhone(item.phone) === normalizedTarget);

    if (!vendor) {
      return;
    }

    autoConnectPhoneRef.current = focusVendorPhone;
    setSelectedVendorId(vendor.id);
    void connectVendorById(vendor.id);
  }, [isOpen, focusVendorPhone, vendors]);

  const fetchConnections = async () => {
    try {
      const data = await connectionsService.list();
      setConnections(data);
    } catch (error) {
      console.error('Error fetching connections:', error);
      setConnections([]);
    }
  };

  const fetchEvolutionInstances = async () => {
    try {
      const data = await connectionsService.listEvolutionInstances();
      setEvolutionInstances(data);
    } catch (error) {
      console.error('Error fetching Evolution instances:', error);
      setEvolutionInstances([]);
    }
  };

  const fetchVendors = async () => {
    try {
      const data = await vendorsService.list();
      setVendors(data.vendors || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
    }
  };

  const connectVendorById = async (vendorId: string) => {
    const vendor = vendors.find(item => item.id === vendorId);

    if (!vendor) {
      return;
    }

    try {
      setIsConnectingVendor(true);
      setErrorMessage(null);

      const normalizedPhone = normalizePhone(vendor.phone);
      const existingConnection = connections.find(connection => normalizePhone(connection.phone) === normalizedPhone);

      let connection: Connection;

      if (existingConnection) {
        if (existingConnection.status === 'connecting') {
          connection = existingConnection;
        } else {
          connection = await connectionsService.connect(existingConnection.id);
        }
      } else {
        connection = await connectionsService.create({
          name: vendor.name,
          phone: vendor.phone,
          api_provider: 'evolution',
        });
      }

      setActiveConnectionForQr(connection);
      setIsQrModalOpen(true);

      await Promise.all([fetchConnections(), fetchEvolutionInstances(), fetchVendors()]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido ao conectar WhatsApp';
      console.error('Error connecting vendor WhatsApp:', error);
      setErrorMessage(`⚠️ Erro: ${errorMsg}`);
      setIsConnectingVendor(false);
    }
  };

  const handleCreateConnection = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const data = await connectionsService.create({
        name: newName,
        phone: newPhone,
        instance_name: newInstanceName.trim() || undefined,
        api_provider: newApiProvider,
      });

      setConnections([data, ...connections]);
      setIsNewConnectionModalOpen(false);
      setNewName('');
      setNewPhone('');
      setNewInstanceName('');

      const connected = await connectionsService.connect(data.id);
      setActiveConnectionForQr(connected);
      setIsQrModalOpen(true);
      await Promise.all([fetchConnections(), fetchEvolutionInstances(), fetchVendors()]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido ao criar conexão';
      console.error('Error creating connection:', error);
      setErrorMessage(`⚠️ Erro: ${errorMsg}`);
      setIsSubmitting(false);
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conexão?')) return;

    try {
      await connectionsService.remove(id);
      setConnections(connections.filter(connection => connection.id !== id));
    } catch (error) {
      console.error('Error deleting connection:', error);
    }
  };

  const updateConnectionStatus = async (id: string, status: 'connected' | 'disconnected' | 'connecting') => {
    try {
      const updated = await connectionsService.updateStatus(id, status);
      setConnections(connections.map(connection => (connection.id === id ? updated : connection)));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleReconnect = async (connection: Connection) => {
    try {
      setErrorMessage(null);
      const updated = await connectionsService.connect(connection.id);
      setConnections(prev => prev.map(item => (item.id === updated.id ? updated : item)));
      setActiveConnectionForQr(updated);
      setIsQrModalOpen(true);
      await Promise.all([fetchConnections(), fetchEvolutionInstances(), fetchVendors()]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido ao reconectar';
      console.error('Error reconnecting connection:', error);
      setErrorMessage(`⚠️ Erro: ${errorMsg}`);
    }
  };

  const filteredConnections = connections.filter(connection => {
    const matchesSearch =
      connection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.instance_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || connection.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatPhone = (phone: string) => {
    if (phone.length === 11) {
      return `(${phone.substring(0, 2)}) ${phone.substring(2, 7)}-${phone.substring(7)}`;
    }
    return phone;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl shadow-2xl border border-divider-subtle w-full max-w-5xl max-h-[95vh] lg:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start sm:items-center p-4 sm:p-6 border-b border-divider-subtle gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 bg-brand/10 p-2 rounded-lg sm:rounded-xl text-brand dark:text-brand-light">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-primary truncate">Conexões</h2>
              <p className="text-xs sm:text-sm text-muted line-clamp-2">
                {viewOnly
                  ? 'Status das conexões WhatsApp dos vendedores'
                  : 'Conecte vendedores via QR Code na Evolution API'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-muted hover:text-primary transition-colors p-2 rounded-lg hover:bg-surface-input"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:gap-6 text-primary pb-4">
            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-lg sm:rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-red-700 dark:text-red-300">{errorMessage}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="flex-shrink-0 text-red-500 hover:text-red-700 dark:hover:text-red-200"
                    aria-label="Fechar mensagem"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* QR Code Connection Section */}
            {!viewOnly && (
              <div className="rounded-xl sm:rounded-2xl border border-divider-subtle bg-surface-input/50 p-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-primary mb-2">Conectar vendedor via QR</label>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <select
                        value={selectedVendorId}
                        onChange={(event) => {
                          const id = event.target.value;
                          setSelectedVendorId(id);
                          if (id) {
                            void connectVendorById(id);
                          }
                        }}
                        className="flex-1 rounded-lg sm:rounded-xl border border-divider-subtle bg-surface px-3 py-2 sm:py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      >
                        <option value="">Selecione um vendedor...</option>
                        {vendors.map(vendor => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={!selectedVendorId || isConnectingVendor}
                        onClick={() => {
                          if (selectedVendorId) {
                            void connectVendorById(selectedVendorId);
                          }
                        }}
                        className="flex-shrink-0 rounded-lg sm:rounded-xl bg-brand hover:bg-brand-hover disabled:opacity-50 text-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-colors"
                      >
                        {isConnectingVendor ? 'Conectando...' : 'Conectar'}
                      </button>
                    </div>
                  </div>
                  {selectedVendor && (
                    <p className="text-xs text-secondary">
                      Instância: <span className="font-mono text-primary">{buildInstancePreview(selectedVendor.name)}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Filters and Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  className="w-full pl-9 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-surface border border-divider-subtle rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <select
                value={statusFilter}
                onChange={event => setStatusFilter(event.target.value)}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border border-divider-subtle rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="all">Todos</option>
                <option value="connected">Conectado</option>
                <option value="disconnected">Desconectado</option>
                <option value="connecting">Conectando</option>
              </select>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => {
                    setLoading(true);
                    void Promise.all([fetchConnections(), fetchEvolutionInstances(), fetchVendors()]).finally(() => setLoading(false));
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-surface border border-divider-subtle rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-surface-input transition-colors"
                  aria-label="Recarregar"
                >
                  <RefreshCw className={`w-4 h-4 flex-shrink-0 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Recarregar</span>
                </button>
                {!viewOnly && (
                  <button
                    onClick={() => setIsNewConnectionModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-colors flex-shrink-0"
                  >
                    <Plus className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">Nova</span>
                  </button>
                )}
              </div>
            </div>

            {/* Connections Count */}
            <div className="text-xs sm:text-sm text-muted flex items-center gap-2">
              <Server className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>{filteredConnections.length} {filteredConnections.length === 1 ? 'conexão' : 'conexões'}</span>
            </div>

            {/* Connections Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-max">
              {filteredConnections.map(connection => {
                const vendor = vendorsByPhone.get(normalizePhone(connection.phone));
                const conversations = vendor?.conversations || [];
                const isExpanded = expandedConnectionId === connection.id;

                return (
                  <div
                    key={connection.id}
                    className="bg-surface rounded-xl sm:rounded-2xl border border-divider-subtle p-3 sm:p-4 flex flex-col gap-3 transition-all hover:shadow-md hover:border-brand/30 group"
                  >
                    {/* Connection Header */}
                    <div className="flex items-start justify-between gap-2 min-h-10">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-brand dark:text-brand-light font-bold text-sm sm:text-base">
                          {connection.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-primary text-sm sm:text-base truncate" title={connection.name}>
                            {connection.name}
                          </h3>
                          <p className="text-xs text-muted">{formatPhone(connection.phone)}</p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div
                        className={`flex-shrink-0 flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${
                          connection.status === 'connected'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                            : connection.status === 'connecting'
                              ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20'
                              : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'
                        }`}
                      >
                        {connection.status === 'connected' ? (
                          <Wifi className="w-3 h-3" />
                        ) : (
                          <WifiOff className="w-3 h-3" />
                        )}
                        <span className="hidden sm:inline">
                          {connection.status === 'connected'
                            ? 'Conectado'
                            : connection.status === 'connecting'
                              ? 'Conectando...'
                              : 'Desconectado'}
                        </span>
                        <span className="inline sm:hidden">
                          {connection.status === 'connected'
                            ? 'OK'
                            : connection.status === 'connecting'
                              ? '...'
                              : 'OFF'}
                        </span>
                      </div>
                    </div>

                    {/* Instance Info */}
                    <div className="bg-surface-input rounded-lg p-2.5 sm:p-3">
                      <p className="text-xs font-mono text-muted truncate" title={connection.instance_name}>
                        {connection.instance_name}
                      </p>
                      <p className="text-[10px] text-muted uppercase tracking-wider mt-1">API: {connection.api_provider}</p>
                    </div>

                    {/* Actions */}
                    {!viewOnly && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-divider-subtle">
                        <button
                          type="button"
                          onClick={() => handleDeleteConnection(connection.id)}
                          className="flex-shrink-0 p-1.5 sm:p-2 text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Excluir conexão"
                          aria-label="Excluir conexão"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {connection.status === 'connected' ? (
                          <button
                            type="button"
                            onClick={() => updateConnectionStatus(connection.id, 'disconnected')}
                            className="flex-1 flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="hidden sm:inline">Desconectar</span>
                            <span className="inline sm:hidden">Descon.</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleReconnect(connection)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-brand dark:text-brand-light hover:bg-brand/10 dark:hover:bg-brand-light/10 rounded-lg transition-colors"
                          >
                            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="hidden sm:inline">Conectar QR</span>
                            <span className="inline sm:hidden">QR</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Conversations Section */}
                    {connection.status === 'connected' && (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleConnection(connection.id)}
                          className="w-full px-3 sm:px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm font-medium text-secondary hover:bg-surface-input transition-colors rounded-lg border border-divider-subtle -mx-3 sm:-mx-4 px-3 sm:px-4"
                        >
                          <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 flex-shrink-0" />
                            <span>
                              {conversations.length} {conversations.length === 1 ? 'conversa' : 'conversas'}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 flex-shrink-0" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="bg-surface-input rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                            {conversations.length === 0 ? (
                              <p className="px-3 sm:px-4 py-3 text-xs text-secondary text-center">Sem conversas</p>
                            ) : (
                              <div className="divide-y divide-divider-subtle">
                                {conversations.map(conv => (
                                  <div key={conv.id} className="flex items-center justify-between p-3 sm:p-3 hover:bg-surface transition-colors group/conv">
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-xs sm:text-sm text-primary truncate">
                                        {conv.name}
                                      </p>
                                      <p className="text-xs text-muted">{conv.phone}</p>
                                    </div>
                                    {vendor && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          onClose();
                                          navigate(`/chat/${vendor.id}/${conv.id}`);
                                        }}
                                        className="flex-shrink-0 ml-2 p-1.5 text-muted hover:text-brand dark:hover:text-brand-light transition-colors opacity-0 group-hover/conv:opacity-100"
                                        title="Abrir conversa"
                                        aria-label="Abrir conversa"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* New Connection Modal */}
            {isNewConnectionModalOpen && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-surface rounded-xl sm:rounded-2xl shadow-xl border border-divider-subtle w-full max-w-sm overflow-hidden">
                  <div className="flex justify-between items-start sm:items-center p-4 sm:p-6 border-b border-divider-subtle gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 bg-emerald-100 dark:bg-emerald-500/20 p-1.5 sm:p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                        <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base sm:text-xl font-bold text-primary">Nova Conexão</h2>
                        <p className="text-xs text-muted">Criar nova instância</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsNewConnectionModalOpen(false)}
                      className="flex-shrink-0 text-muted hover:text-primary transition-colors p-1.5 sm:p-2 rounded-lg"
                      aria-label="Fechar"
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateConnection} className="p-4 sm:p-6 flex flex-col gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-secondary mb-1.5">Nome do Consultor</label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={event => setNewName(event.target.value)}
                        placeholder="ex: Consultora Joyce"
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-surface-input border border-divider-subtle rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-secondary mb-1.5">Número do WhatsApp</label>
                      <input
                        type="text"
                        required
                        value={newPhone}
                        onChange={event => setNewPhone(event.target.value)}
                        placeholder="ex: 11999999999"
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-surface-input border border-divider-subtle rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                      <p className="text-xs text-muted mt-1">DDD + número (apenas números)</p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-secondary mb-1.5">Nome da Instância (opcional)</label>
                      <input
                        type="text"
                        value={newInstanceName}
                        onChange={event => setNewInstanceName(event.target.value)}
                        placeholder="deixe em branco para gerar automaticamente"
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-surface-input border border-divider-subtle rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-secondary mb-2">Provedor de API</label>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <label
                          className={`flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl cursor-pointer transition-colors text-xs sm:text-sm font-medium ${
                            newApiProvider === 'evolution'
                              ? 'border-brand bg-brand/10 dark:bg-brand/20 text-brand-dark dark:text-brand-light'
                              : 'border-divider-subtle text-muted hover:bg-surface-input'
                          }`}
                        >
                          <input
                            type="radio"
                            name="api"
                            value="evolution"
                            checked={newApiProvider === 'evolution'}
                            onChange={() => setNewApiProvider('evolution')}
                            className="sr-only"
                          />
                          <span>Evolution</span>
                        </label>
                        <label
                          className={`flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-3 border rounded-lg sm:rounded-xl cursor-pointer transition-colors text-xs sm:text-sm font-medium ${
                            newApiProvider === 'whatsmeow'
                              ? 'border-brand bg-brand/10 dark:bg-brand/20 text-brand-dark dark:text-brand-light'
                              : 'border-divider-subtle text-muted hover:bg-surface-input'
                          }`}
                        >
                          <input
                            type="radio"
                            name="api"
                            value="whatsmeow"
                            checked={newApiProvider === 'whatsmeow'}
                            onChange={() => setNewApiProvider('whatsmeow')}
                            className="sr-only"
                          />
                          <span>Whatsmeow</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2 sm:gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => setIsNewConnectionModalOpen(false)}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-divider-subtle text-secondary rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-surface-input transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                            <span className="hidden sm:inline">Conectando...</span>
                          </>
                        ) : (
                          <>
                            <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Criar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* QR Code Modal */}
            {isQrModalOpen && activeConnectionForQr && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-surface rounded-xl sm:rounded-2xl shadow-2xl border border-divider-subtle w-full max-w-sm overflow-hidden flex flex-col items-center p-4 sm:p-8 text-center relative">
                  <button
                      type="button"
                    onClick={() => setIsQrModalOpen(false)}
                    className="absolute top-3 sm:top-4 right-3 sm:right-4 text-muted hover:text-primary transition-colors p-1.5 sm:p-2"
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>

                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                    <Wifi className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <h2 className="text-base sm:text-xl font-bold text-primary">Conectar WhatsApp</h2>
                  </div>

                  <p className="text-xs sm:text-sm text-muted mb-4 sm:mb-6">
                    Escaneie o QR Code
                    <br />
                    <span className="font-mono font-medium text-primary text-xs sm:text-sm">{activeConnectionForQr.instance_name}</span>
                  </p>

                  <div className="bg-white dark:bg-surface-deep p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-inner border border-divider-subtle mb-4 sm:mb-6 relative">
                    {(() => {
                      const instance = evolutionInstances.find(item => item.instance_name === activeConnectionForQr.instance_name);

                      if (instance?.qr_code?.startsWith('data:image')) {
                        return (
                          <img
                            src={instance.qr_code}
                            alt="QR Code da Evolution"
                            className="w-40 h-40 sm:w-48 sm:h-48 rounded-lg object-contain"
                          />
                        );
                      }

                      return (
                        <div className="w-40 h-40 sm:w-48 sm:h-48 bg-gray-100 dark:bg-surface-input flex items-center justify-center rounded-lg overflow-hidden relative">
                          <QrCode className="w-24 h-24 sm:w-32 sm:h-32 text-gray-300" />
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent animate-scan"></div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="text-xs sm:text-sm text-muted mb-4 sm:mb-6">
                    <p className="font-medium text-primary mb-1">Escaneie com seu WhatsApp</p>
                    <p className="text-xs">Menu → Dispositivos → Conectar</p>
                  </div>

                  <div className="mb-4 w-full rounded-lg sm:rounded-xl border border-divider-subtle bg-surface-input px-3 py-2 sm:py-3 text-left text-xs text-secondary">
                    {(() => {
                      const instance = evolutionInstances.find(item => item.instance_name === activeConnectionForQr.instance_name);

                      if (!instance) {
                        return 'Aguardando Evolution API...';
                      }

                      if (instance.error_message) {
                        return `Erro: ${instance.error_message}`;
                      }

                      return `Status: ${instance.status}`;
                    })()}
                  </div>

                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 text-xs sm:text-sm font-medium mb-4 sm:mb-6">
                    <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin flex-shrink-0" />
                    Aguardando conexão...
                  </div>

                  <div className="flex w-full gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setIsQrModalOpen(false)}
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-divider-subtle text-secondary rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-surface-input transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const instance = evolutionInstances.find(item => item.instance_name === activeConnectionForQr.instance_name);
                        const shouldReconnect = Boolean(
                          instance && (
                            instance.error_message ||
                            instance.status === 'queued' ||
                            instance.status === 'error' ||
                            instance.status === 'disconnected' ||
                            instance.status === 'generating_qr'
                          ),
                        );

                        if (shouldReconnect) {
                          void handleReconnect(activeConnectionForQr);
                          return;
                        }

                        void Promise.all([fetchConnections(), fetchEvolutionInstances(), fetchVendors()]);
                      }}
                      className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 dark:bg-gray-800 text-primary rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>Atualizar</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
