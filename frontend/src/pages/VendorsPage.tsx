import { useState } from 'react';
import { Search, Edit2, Trash2, ChevronDown, ChevronUp, Eye, MessageCircle, Phone, Users as UsersIcon, X, Plus, ArrowRight, BrainCircuit, MoreVertical, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ConnectionsModal } from '../components/connections/ConnectionsModal';

const MOCK_VENDORS = [
  {
    id: '1',
    name: 'Ricardo Silva',
    status: 'CONECTADO',
    avatar: 'https://i.pravatar.cc/150?u=ricardo',
    leadsHoje: 42,
    conversao: '12.5%',
    ultimaConversa: 'HÁ 2 MIN',
    ultimaMensagem: '"Com certeza! Podemos agendar a demonstração para amanhã às 14h..."',
    tags: ['H', 'Q'],
    conversations: [
      { id: 'c1', name: 'João Paulo da Silva', phone: '+55 84 8751-9114', time: '17:26', initials: 'JS', color: 'bg-yellow-500' },
      { id: 'c2', name: 'Marcos', phone: '+55 84 9151-9147', time: '12:17', initials: 'MA', color: 'bg-purple-500' },
      { id: 'c3', name: 'Veículos', phone: '+55 84 9176-0760', time: '10:51', avatar: 'https://i.pravatar.cc/150?u=veiculos' },
      { id: 'c4', name: 'Matheus', phone: '+55 84 9204-4598', time: '09:47', initials: 'MA', color: 'bg-green-500' },
    ]
  },
  {
    id: '2',
    name: 'Ana Beatriz',
    status: 'CONECTADO',
    avatar: 'https://i.pravatar.cc/150?u=ana',
    leadsHoje: 28,
    conversao: '18.2%',
    ultimaConversa: 'HÁ 15 MIN',
    ultimaMensagem: '"A proposta comercial foi enviada por e-mail, aguardo seu retorno."',
    tags: ['AI'],
    conversations: []
  },
  {
    id: '3',
    name: 'Marcos Paulo',
    status: 'DESCONECTADO',
    avatar: 'https://i.pravatar.cc/150?u=marcos',
    leadsHoje: 15,
    conversao: '5.4%',
    ultimaConversa: 'HÁ 2H',
    ultimaMensagem: '"Entendido, o suporte técnico entrará em contato em breve."',
    tags: [],
    conversations: []
  },
  {
    id: '4',
    name: 'Juliana Mendes',
    status: 'CONECTADO',
    avatar: 'https://i.pravatar.cc/150?u=juliana',
    leadsHoje: 56,
    conversao: '22.1%',
    ultimaConversa: 'AGORA MESMO',
    ultimaMensagem: '"Obrigado pelo fechamento! Estaremos enviando o kit de boas-vindas."',
    tags: ['H', 'AI'],
    conversations: []
  },
  {
    id: '5',
    name: 'Carlos Eduardo',
    status: 'CONECTADO',
    avatar: 'https://i.pravatar.cc/150?u=carlos',
    leadsHoje: 12,
    conversao: '9.8%',
    ultimaConversa: 'HÁ 45 MIN',
    ultimaMensagem: '"Pode contar comigo para sanar qualquer dúvida sobre a integração."',
    tags: ['Q'],
    conversations: []
  }
];

export default function VendorsPage() {
  const navigate = useNavigate();
  const [expandedVendorId, setExpandedVendorId] = useState<string | null>(null);
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);

  const toggleVendor = (id: string) => {
    setExpandedVendorId(expandedVendorId === id ? null : id);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-end gap-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsConnectionsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface border border-gray-200 dark:border-gray-800/50 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-input transition-colors w-full sm:w-auto"
          >
            <LinkIcon className="w-4 h-4" />
            Conexões
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-sm font-medium transition-colors w-full sm:w-auto">
            <UsersIcon className="w-4 h-4" />
            Novo Vendedor
          </button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface border border-gray-200 dark:border-gray-800/50 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider mb-2">ATIVOS AGORA</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">14</span>
            <span className="text-lg text-emerald-500 font-medium">/ 18</span>
          </div>
        </div>

        <div className="bg-surface border border-gray-200 dark:border-gray-800/50 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider mb-2">CONVERSAS HOJE</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">432</span>
            <span className="text-sm text-emerald-500 font-medium bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">+12%</span>
          </div>
        </div>

        <div className="bg-surface border border-gray-200 dark:border-gray-800/50 rounded-2xl p-6 shadow-sm flex items-center justify-between group cursor-pointer hover:border-purple-500/50 transition-colors">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="w-4 h-4 text-purple-500" />
              <p className="text-xs font-bold text-purple-500 tracking-wider">AI INSIGHT</p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              O desempenho médio de fechamento subiu 8% na última hora. O vendedor <span className="font-semibold text-brand-light">Ricardo Silva</span> está com maior volume de leads qualificados.
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {MOCK_VENDORS.map((vendor) => (
          <div key={vendor.id} className="bg-surface border border-gray-200 dark:border-gray-800/50 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={vendor.avatar} alt={vendor.name} className="w-12 h-12 rounded-full object-cover bg-gray-100 dark:bg-gray-800" />
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-surface ${vendor.status === 'CONECTADO' ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{vendor.name}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${vendor.status === 'CONECTADO' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                      {vendor.status}
                    </span>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-surface-deep rounded-xl p-4">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-1">LEADS HOJE</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{vendor.leadsHoje}</p>
                </div>
                <div className="bg-gray-50 dark:bg-surface-deep rounded-xl p-4">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider mb-1">CONVERSÃO</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{vendor.conversao}</p>
                </div>
              </div>

              {/* Last Conversation */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">ÚLTIMA CONVERSA</p>
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 tracking-wider">{vendor.ultimaConversa}</p>
                </div>
                <div className="bg-gray-50 dark:bg-surface-deep rounded-xl p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    {vendor.ultimaMensagem}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-surface-input/30 flex justify-between items-center">
              <div className="flex -space-x-2">
                {vendor.tags.map((tag, i) => (
                  <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-surface ${
                    tag === 'H' ? 'bg-orange-500' : 
                    tag === 'Q' ? 'bg-emerald-500' : 
                    tag === 'AI' ? 'bg-purple-500' : 'bg-brand-light'
                  }`}>
                    {tag}
                  </div>
                ))}
              </div>
              <button className="text-sm font-semibold text-brand dark:text-brand-light hover:text-brand-dark dark:hover:text-blue-300 transition-colors">
                Ver Detalhes
              </button>
            </div>

            {/* Conversations Dropdown */}
            <div className="border-t border-gray-100 dark:border-gray-800/50">
              <button 
                onClick={() => toggleVendor(vendor.id)}
                className="w-full px-6 py-3 flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-input transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Ver conversas
                </div>
                {expandedVendorId === vendor.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {expandedVendorId === vendor.id && (
                <div className="bg-gray-50 dark:bg-surface-deep border-t border-gray-100 dark:border-gray-800/50 p-2 max-h-64 overflow-y-auto scrollbar-hide">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-4 py-2">{vendor.conversations.length} conversas</p>
                  <div className="space-y-1">
                    {vendor.conversations.map((conv) => (
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
                              <span className="font-medium text-sm text-gray-900 dark:text-white">{conv.name}</span>
                              <span className="text-xs text-gray-500">{conv.time}</span>
                            </div>
                            <span className="text-xs text-gray-500">{conv.phone}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => navigate(`/chat/${vendor.id}/${conv.id}`)}
                            className="p-2 text-gray-400 hover:text-brand dark:hover:text-brand-light transition-colors"
                            title="Visualizar conversa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-input transition-colors">
                            <BrainCircuit className="w-3.5 h-3.5" />
                            Analisar
                          </button>
                        </div>
                      </div>
                    ))}
                    {vendor.conversations.length === 0 && (
                      <div className="p-4 text-center text-sm text-gray-500">
                        Nenhuma conversa ativa no momento.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add Vendor Card */}
        <button className="bg-transparent border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center p-8 hover:border-brand-light dark:hover:border-brand-light hover:bg-brand/10/50 dark:hover:bg-brand-light/5 transition-all group min-h-[400px]">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-surface flex items-center justify-center mb-4 group-hover:bg-blue-100 dark:group-hover:bg-brand-light/20 transition-colors">
            <Plus className="w-8 h-8 text-gray-400 group-hover:text-brand dark:group-hover:text-brand-light" />
          </div>
          <span className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-wider group-hover:text-brand dark:group-hover:text-brand-light">
            ADICIONAR VENDEDOR
          </span>
        </button>
      </div>

      <ConnectionsModal 
        isOpen={isConnectionsModalOpen} 
        onClose={() => setIsConnectionsModalOpen(false)} 
      />
    </div>
  );
}
