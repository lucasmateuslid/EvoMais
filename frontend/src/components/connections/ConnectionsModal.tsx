import React, { useState, useEffect } from 'react';
import { connectionsService, type Connection } from '../../services/connectionsService';
import { 
  Search, Plus, RefreshCw, Wifi, WifiOff, Trash2, X, QrCode, Smartphone, Server, MessageCircle, ChevronDown, ChevronUp, Eye, BrainCircuit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ConnectionsModal({ isOpen, onClose }: ConnectionsModalProps) {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals state
  const [isNewConnectionModalOpen, setIsNewConnectionModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [activeConnectionForQr, setActiveConnectionForQr] = useState<Connection | null>(null);

  // Form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newInstanceName, setNewInstanceName] = useState('');
  const [newApiProvider, setNewApiProvider] = useState<'evolution' | 'whatsmeow'>('evolution');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [expandedConnectionId, setExpandedConnectionId] = useState<string | null>(null);

  const toggleConnection = (id: string) => {
    setExpandedConnectionId(expandedConnectionId === id ? null : id);
  };

  const MOCK_CONVERSATIONS = [
    { id: 'c1', name: 'João Paulo da Silva', phone: '+55 84 8751-9114', time: '17:26', initials: 'JS', color: 'bg-yellow-500' },
    { id: 'c2', name: 'Marcos', phone: '+55 84 9151-9147', time: '12:17', initials: 'MA', color: 'bg-purple-500' },
    { id: 'c3', name: 'Veículos', phone: '+55 84 9176-0760', time: '10:51', avatar: 'https://i.pravatar.cc/150?u=veiculos' },
    { id: 'c4', name: 'Matheus', phone: '+55 84 9204-4598', time: '09:47', initials: 'MA', color: 'bg-green-500' },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchConnections();
    }
  }, [isOpen]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const data = await connectionsService.list();
      setConnections(data);
    } catch (error) {
      console.error('Error fetching connections:', error);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConnection = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      const data = await connectionsService.create({
        name: newName,
        phone: newPhone,
        instance_name: newInstanceName,
        api_provider: newApiProvider,
      });

      if (data) {
        setConnections([data, ...connections]);
        setIsNewConnectionModalOpen(false);
        // Reset form
        setNewName('');
        setNewPhone('');
        setNewInstanceName('');
        
        // Open QR Modal for the new connection
        setActiveConnectionForQr(data);
        setIsQrModalOpen(true);
        
        // Simulate QR scan success after 5 seconds
        setTimeout(() => {
          updateConnectionStatus(data.id, 'connected');
          setIsQrModalOpen(false);
        }, 5000);
      }
    } catch (error) {
      console.error('Error creating connection:', error);
      alert('Erro ao criar conexão. Verifique autenticação e disponibilidade do backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConnection = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conexão?')) return;

    try {
      await connectionsService.remove(id);
      setConnections(connections.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting connection:', error);
    }
  };

  const updateConnectionStatus = async (id: string, status: 'connected' | 'disconnected' | 'connecting') => {
    try {
      const updated = await connectionsService.updateStatus(id, status);
      setConnections(connections.map(c => c.id === id ? updated : c));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleReconnect = (connection: Connection) => {
    updateConnectionStatus(connection.id, 'connecting');
    setActiveConnectionForQr(connection);
    setIsQrModalOpen(true);
    
    // Simulate QR scan success after 5 seconds
    setTimeout(() => {
      updateConnectionStatus(connection.id, 'connected');
      setIsQrModalOpen(false);
    }, 5000);
  };

  const filteredConnections = connections.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.instance_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl shadow-2xl border border-divider-subtle w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-divider-subtle">
          <div className="flex items-center gap-3">
            <div className="bg-brand/10 p-2 rounded-xl text-brand dark:text-brand-light">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary">Conexões</h2>
              <p className="text-sm text-muted">Gerencie suas instâncias WhatsApp conectadas</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors p-2 rounded-lg hover:bg-surface-input"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-6 text-primary pb-10">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-end items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  onClick={fetchConnections}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-surface border border-gray-200 dark:border-gray-800/50 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-surface-input transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Recarregar
                </button>
                <button 
                  onClick={() => setIsNewConnectionModalOpen(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nova Conexão
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input 
                  type="text" 
                  placeholder="Buscar conexão por nome ou instância..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border border-gray-200 dark:border-gray-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-surface border border-gray-200 dark:border-gray-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand w-full sm:w-48"
              >
                <option value="all">Todos os status</option>
                <option value="connected">Conectado</option>
                <option value="disconnected">Desconectado</option>
                <option value="connecting">Conectando</option>
              </select>
            </div>

            <div className="text-sm text-muted flex items-center gap-2">
              <Server className="w-4 h-4" />
              <span>{filteredConnections.length} conexões encontradas</span>
            </div>

            {/* Connections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredConnections.map((connection) => (
                <div key={connection.id} className="bg-surface rounded-2xl border border-gray-200 dark:border-gray-800/50 p-5 flex flex-col gap-4 transition-all hover:shadow-md">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-brand dark:text-brand-light font-bold text-lg flex-shrink-0">
                        {connection.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary truncate max-w-[180px]" title={connection.name}>
                          {connection.name}
                        </h3>
                        <p className="text-xs text-muted">{formatPhone(connection.phone)}</p>
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      connection.status === 'connected' 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' 
                        : connection.status === 'connecting'
                        ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20'
                        : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'
                    }`}>
                      {connection.status === 'connected' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                      {connection.status === 'connected' ? 'Conectado' : connection.status === 'connecting' ? 'Conectando...' : 'Desconectado'}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-mono text-muted bg-surface-input p-2 rounded-lg truncate" title={connection.instance_name}>
                      {connection.instance_name}
                    </p>
                    <p className="text-[10px] text-muted uppercase tracking-wider mt-1 px-1">
                      API: {connection.api_provider}
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button 
                      onClick={() => handleDeleteConnection(connection.id)}
                      className="p-2 text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Excluir conexão"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    {connection.status === 'connected' ? (
                      <button 
                        onClick={() => updateConnectionStatus(connection.id, 'disconnected')}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <WifiOff className="w-4 h-4" />
                        Desconectar
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleReconnect(connection)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-brand dark:text-brand-light hover:bg-brand/10 dark:hover:bg-brand-light/10 rounded-lg transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reconectar
                      </button>
                    )}
                  </div>

                  {/* Conversations Dropdown */}
                  {connection.status === 'connected' && (
                    <div className="border-t border-gray-100 dark:border-gray-800/50 -mx-5 -mb-5">
                      <button 
                        onClick={() => toggleConnection(connection.id)}
                        className="w-full px-5 py-3 flex items-center justify-between text-sm font-medium text-secondary hover:bg-gray-50 dark:hover:bg-surface-input transition-colors rounded-b-2xl"
                      >
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          Ver conversas
                        </div>
                        {expandedConnectionId === connection.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      
                      {expandedConnectionId === connection.id && (
                        <div className="bg-gray-50 dark:bg-surface-deep border-t border-gray-100 dark:border-gray-800/50 p-2 max-h-64 overflow-y-auto scrollbar-hide rounded-b-2xl">
                          <p className="text-xs font-semibold text-muted px-4 py-2">{MOCK_CONVERSATIONS.length} conversas</p>
                          <div className="space-y-1">
                            {MOCK_CONVERSATIONS.map((conv) => (
                              <div key={conv.id} className="flex items-center justify-between p-3 hover:bg-white dark:hover:bg-surface rounded-xl transition-colors group">
                                <div className="flex items-center gap-3">
                                  {conv.avatar ? (
                                    <img src={conv.avatar} alt="" className="w-10 h-10 rounded-full" />
                                  ) : (
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm ${conv.color}`}>
                                      {conv.initials}
                                    </div>
                                  )}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm text-primary">{conv.name}</span>
                                      <span className="text-xs text-gray-500">{conv.time}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">{conv.phone}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => {
                                      onClose();
                                      navigate(`/chat/${connection.id}/${conv.id}`);
                                    }}
                                    className="p-2 text-muted hover:text-brand dark:hover:text-brand-light transition-colors"
                                    title="Visualizar conversa"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-secondary hover:bg-gray-50 dark:hover:bg-surface-input transition-colors">
                                    <BrainCircuit className="w-3.5 h-3.5" />
                                    Analisar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* New Connection Modal */}
            {isNewConnectionModalOpen && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-surface rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800/50 w-full max-w-md overflow-hidden">
                  <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Nova Conexão</h2>
                        <p className="text-xs text-muted">Defina os dados para criar uma nova instância</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsNewConnectionModalOpen(false)}
                      className="text-muted hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleCreateConnection} className="p-6 flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1.5">Nome do Consultor</label>
                      <input 
                        type="text" 
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="ex: Consultora Joyce" 
                        className="w-full px-4 py-2.5 bg-surface-input border border-gray-200 dark:border-gray-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1.5">Número do WhatsApp</label>
                      <input 
                        type="text" 
                        required
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="ex: 11999999999" 
                        className="w-full px-4 py-2.5 bg-surface-input border border-gray-200 dark:border-gray-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                      <p className="text-xs text-gray-500 mt-1.5">DDD + número (somente números)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1.5">Nome da Instância</label>
                      <input 
                        type="text" 
                        required
                        value={newInstanceName}
                        onChange={(e) => setNewInstanceName(e.target.value)}
                        placeholder="ex: vendas01 ou suporte" 
                        className="w-full px-4 py-2.5 bg-surface-input border border-gray-200 dark:border-gray-800/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary mb-1.5">Provedor de API (Fallback)</label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className={`flex items-center justify-center px-4 py-3 border rounded-xl cursor-pointer transition-colors ${newApiProvider === 'evolution' ? 'border-brand-light bg-brand/10 dark:bg-brand-light/10 text-brand-dark dark:text-brand-light' : 'border-gray-200 dark:border-gray-800 text-muted hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                          <input type="radio" name="api" value="evolution" checked={newApiProvider === 'evolution'} onChange={() => setNewApiProvider('evolution')} className="sr-only" />
                          <span className="text-sm font-medium">Evolution API</span>
                        </label>
                        <label className={`flex items-center justify-center px-4 py-3 border rounded-xl cursor-pointer transition-colors ${newApiProvider === 'whatsmeow' ? 'border-brand-light bg-brand/10 dark:bg-brand-light/10 text-brand-dark dark:text-brand-light' : 'border-gray-200 dark:border-gray-800 text-muted hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                          <input type="radio" name="api" value="whatsmeow" checked={newApiProvider === 'whatsmeow'} onChange={() => setNewApiProvider('whatsmeow')} className="sr-only" />
                          <span className="text-sm font-medium">Whatsmeow</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button 
                        type="button"
                        onClick={() => setIsNewConnectionModalOpen(false)}
                        className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-800 text-secondary rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                        Criar e Conectar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* QR Code Modal */}
            {isQrModalOpen && activeConnectionForQr && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-surface rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800/50 w-full max-w-sm overflow-hidden flex flex-col items-center p-8 text-center relative">
                  <button 
                    onClick={() => setIsQrModalOpen(false)}
                    className="absolute top-4 right-4 text-muted hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
                    <Wifi className="w-5 h-5" />
                    <h2 className="text-xl font-bold text-primary">Conectar WhatsApp</h2>
                  </div>
                  
                  <p className="text-sm text-muted mb-6">
                    Escaneie o QR Code para conectar a instância <br/>
                    <span className="font-mono font-medium text-primary">{activeConnectionForQr.instance_name}</span>
                  </p>

                  <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100 mb-6 relative">
                    {/* Mock QR Code - In a real app, this would be an img src from the API */}
                    <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded-lg overflow-hidden relative">
                      <QrCode className="w-32 h-32 text-gray-300" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent animate-scan"></div>
                    </div>
                  </div>

                  <div className="text-sm text-muted mb-6">
                    <p className="font-medium text-primary mb-1">Escaneie com seu WhatsApp</p>
                    <p className="text-xs">Menu → Dispositivos conectados → Conectar aparelho</p>
                  </div>

                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 text-sm font-medium mb-6">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Aguardando conexão...
                  </div>

                  <div className="flex w-full gap-3">
                    <button 
                      onClick={() => setIsQrModalOpen(false)}
                      className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-800 text-secondary rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-primary rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Atualizar QR
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

