import { Users, MessageSquare, Clock, TrendingUp, ArrowUpRight, ArrowDownRight, MoreHorizontal, BrainCircuit, Zap, FileText, Plus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const areaData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 550 },
  { name: 'Apr', value: 450 },
  { name: 'May', value: 700 },
  { name: 'Jun', value: 650 },
];

const barData = [
  { name: 'Seg', sales: 40, prospects: 24 },
  { name: 'Ter', sales: 30, prospects: 13 },
  { name: 'Qua', sales: 20, prospects: 58 },
  { name: 'Qui', sales: 27, prospects: 39 },
  { name: 'Sex', sales: 18, prospects: 48 },
  { name: 'Sáb', sales: 23, prospects: 38 },
  { name: 'Dom', sales: 34, prospects: 43 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* AI Velocity Insight */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <BrainCircuit className="w-5 h-5 text-purple-300" />
              <span className="text-sm font-bold text-purple-300 tracking-wider uppercase">AI VELOCITY INSIGHT</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Seu pipeline cresceu 24.8% esta semana.</h2>
            <p className="text-purple-100/80 leading-relaxed max-w-3xl">
              A inteligência Evo+ identificou uma concentração incomum de leads qualificados no setor de tecnologia. Recomendamos priorizar a equipe de vendas de alta performance para o fechamento imediato.
            </p>
          </div>
          <button className="whitespace-nowrap flex items-center gap-2 px-6 py-3 bg-white text-purple-900 rounded-xl font-bold hover:bg-purple-50 transition-colors shadow-lg shadow-purple-900/20">
            <Zap className="w-5 h-5" />
            Acelerar Leads
          </button>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat Card 1 */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-gray-800/50 transition-colors duration-200">
          <div className="flex justify-between items-start">
            <div className="bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-2xl">
              <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="flex items-center text-sm font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              12%
            </span>
          </div>
          <div className="mt-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Receita Mensal</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">R$ 1.2M</p>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-gray-800/50 transition-colors duration-200">
          <div className="flex justify-between items-start">
            <div className="bg-brand/10 dark:bg-brand-light/10 p-3 rounded-2xl">
              <Users className="h-6 w-6 text-brand dark:text-brand-light" />
            </div>
            <span className="flex items-center text-sm font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              8.4%
            </span>
          </div>
          <div className="mt-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Novos Leads</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">458</p>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-gray-800/50 transition-colors duration-200">
          <div className="flex justify-between items-start">
            <div className="bg-orange-50 dark:bg-orange-500/10 p-3 rounded-2xl">
              <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="flex items-center text-sm font-medium text-red-500 bg-red-50 dark:bg-red-500/10 px-2.5 py-1 rounded-full">
              <ArrowDownRight className="h-4 w-4 mr-1" />
              0.5%
            </span>
          </div>
          <div className="mt-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Conversão</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">3.2%</p>
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-gray-800/50 transition-colors duration-200">
          <div className="flex justify-between items-start">
            <div className="bg-purple-50 dark:bg-purple-500/10 p-3 rounded-2xl">
              <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="flex items-center text-sm font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <ArrowDownRight className="h-4 w-4 mr-1" />
              2d
            </span>
          </div>
          <div className="mt-6">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">Tempo Médio Ciclo</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">14d</p>
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart Card */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-gray-800/50 transition-colors duration-200 lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Performance Semanal</h2>
            <div className="flex gap-2">
              <span className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
                <span className="w-3 h-3 rounded-full bg-brand mr-2"></span>
                Vendas
              </span>
              <span className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400">
                <span className="w-3 h-3 rounded-full bg-emerald-400 mr-2"></span>
                Prospectos
              </span>
            </div>
          </div>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" strokeOpacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb', opacity: 0.1 }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', backgroundColor: 'var(--color-bg-surface)', color: '#fff' }}
                />
                <Bar dataKey="sales" fill="#2563eb" radius={[6, 6, 6, 6]} barSize={32} />
                <Bar dataKey="prospects" fill="#34d399" radius={[6, 6, 6, 6]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel Evolution */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-gray-800/50 transition-colors duration-200 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Evolução do Funil</h2>
            <button className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors">
              <MoreHorizontal className="h-5 w-5 text-gray-400" />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div className="relative">
              <div className="w-full bg-brand/10 dark:bg-blue-900/20 rounded-xl p-4 flex justify-between items-center border border-blue-100 dark:border-blue-800/30">
                <div>
                  <p className="text-xs font-bold text-brand dark:text-brand-light tracking-wider">PROSPECÇÃO</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Leads Ativos</p>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">1.240</span>
              </div>
            </div>
            
            <div className="relative pl-4">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"></div>
              <div className="w-full bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 flex justify-between items-center border border-purple-100 dark:border-purple-800/30">
                <div>
                  <p className="text-xs font-bold text-purple-600 dark:text-purple-400 tracking-wider">QUALIFICAÇÃO</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">SQLs</p>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">458</span>
              </div>
            </div>

            <div className="relative pl-8">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"></div>
              <div className="w-full bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 flex justify-between items-center border border-orange-100 dark:border-orange-800/30">
                <div>
                  <p className="text-xs font-bold text-orange-600 dark:text-orange-400 tracking-wider">PROPOSTA</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Negociações</p>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">124</span>
              </div>
            </div>

            <div className="relative pl-12">
              <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"></div>
              <div className="w-full bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 flex justify-between items-center border border-emerald-100 dark:border-emerald-800/30">
                <div>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">FECHAMENTO</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Este Mês</p>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">42</span>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-gray-50 dark:bg-surface-deep rounded-xl p-4 flex items-start gap-3">
            <BrainCircuit className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-purple-500 tracking-wider mb-1">INSIGHT DO FUNIL</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de conversão de Proposta para Fechamento subiu 4% após o novo script de IA.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Hot Leads */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-gray-800/50 transition-colors duration-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hot Leads</h2>
              <p className="text-xs font-bold text-red-500 tracking-wider mt-1">ALTA PRIORIDADE</p>
            </div>
            <button className="text-sm font-medium text-brand dark:text-brand-light hover:text-brand-dark">Ver todos</button>
          </div>
          
          <div className="space-y-4">
            {[
              { name: 'Global Tech S.A.', value: 'R$ 240.000,00', color: 'bg-red-500' },
              { name: 'Lumina Cloud', value: 'R$ 115.000,00', color: 'bg-orange-500' },
              { name: 'Apex Ventures', value: 'R$ 89.500,00', color: 'bg-amber-500' },
            ].map((lead, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-deep rounded-xl hover:bg-gray-100 dark:hover:bg-surface-input transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${lead.color}`}></div>
                  <span className="font-medium text-gray-900 dark:text-white">{lead.name}</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">{lead.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performance */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-gray-800/50 transition-colors duration-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top Performance</h2>
            <button className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors">
              <MoreHorizontal className="h-5 w-5 text-gray-400" />
            </button>
          </div>
          
          <div className="space-y-4">
            {[
              { name: 'Ricardo Oliveira', score: '104%', avatar: 'https://i.pravatar.cc/150?u=ricardo' },
              { name: 'Ana Clara Mendes', score: '92%', avatar: 'https://i.pravatar.cc/150?u=ana' },
              { name: 'Marcos Silva', score: '88%', avatar: 'https://i.pravatar.cc/150?u=marcos' },
            ].map((person, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-surface-deep rounded-xl">
                <div className="flex items-center gap-3">
                  <img src={person.avatar} alt={person.name} className="w-10 h-10 rounded-full object-cover" />
                  <span className="font-medium text-gray-900 dark:text-white">{person.name}</span>
                </div>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full text-sm">{person.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-gray-100/50 dark:border-gray-800/50 transition-colors duration-200">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Ações Rápidas</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center justify-center gap-3 p-6 bg-brand/10 dark:bg-blue-900/20 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-brand dark:text-brand-light" />
              </div>
              <span className="font-medium text-blue-900 dark:text-blue-300">Novo Lead</span>
            </button>
            
            <button className="flex flex-col items-center justify-center gap-3 p-6 bg-purple-50 dark:bg-purple-900/20 rounded-2xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-800/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="font-medium text-purple-900 dark:text-purple-300">Relatório</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
