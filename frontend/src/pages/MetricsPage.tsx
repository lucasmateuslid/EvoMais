import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { 
  Download, ChevronDown, Calendar as CalendarIcon, BarChart2, Clock, Search, Check, FileText, FileSpreadsheet, Users, BrainCircuit
} from 'lucide-react';

// Mock Data
const dataPorDia = [
  { name: 'Dom', mensagens: 0, conversas: 0 },
  { name: 'Seg', mensagens: 0, conversas: 0 },
  { name: 'Ter', mensagens: 0, conversas: 0 },
  { name: 'Qua', mensagens: 244, conversas: 41 },
  { name: 'Qui', mensagens: 963, conversas: 86 },
  { name: 'Sex', mensagens: 709, conversas: 55 },
  { name: 'Sáb', mensagens: 220, conversas: 19 },
];

const dataPorHora = Array.from({ length: 24 }, (_, i) => ({
  name: `${i.toString().padStart(2, '0')}:00`,
  mensagens: Math.floor(Math.random() * 300),
  conversas: Math.floor(Math.random() * 50),
}));
dataPorHora[9] = { name: '09:00', mensagens: 380, conversas: 60 };
dataPorHora[11] = { name: '11:00', mensagens: 103, conversas: 21 };

const consultants = [
  'Todos os corretores',
  'Consultora Joyce',
  'Consultora Melry Câmara',
  'Jariane Representante Lock',
  'LOCK PROTEÇÃO VEICULAR',
  'Taise comercial'
];

const periods = ['Hoje', 'Ontem', 'Esta semana', 'Última semana', 'Mês', '3 meses', 'Personalizado'];

const tabs = [
  { id: 'heatmap', name: 'Dia/Hora', icon: CalendarIcon },
  { id: 'daily', name: 'Por Dia', icon: BarChart2 },
  { id: 'hourly', name: 'Por Hora', icon: Clock },
  { id: 'calendar', name: 'Calendário', icon: CalendarIcon },
];

export default function MetricsPage() {
  const [selectedConsultant, setSelectedConsultant] = useState(consultants[0]);
  const [isConsultantDropdownOpen, setIsConsultantDropdownOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Esta semana');
  const [selectedTab, setSelectedTab] = useState('daily');
  const [isExportOpen, setIsExportOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 text-gray-900 dark:text-white pb-10">
      {/* Header & Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-end items-center">
          {/* Export Button */}
          <div className="relative">
            <button 
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-surface border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportar
            </button>
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 py-1 z-50">
                <button className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                  <FileText className="w-4 h-4 mr-2" /> Exportar PDF
                </button>
                <button className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                  <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar CSV
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4">
          {/* Consultant Dropdown */}
          <div className="relative w-full sm:w-auto">
            <button 
              onClick={() => setIsConsultantDropdownOpen(!isConsultantDropdownOpen)}
              className="flex items-center justify-between w-full sm:w-64 px-4 py-2 bg-surface border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium"
            >
              <div className="flex items-center gap-2 truncate">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="truncate">{selectedConsultant}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            
            {isConsultantDropdownOpen && (
              <div className="absolute left-0 mt-2 w-full sm:w-72 bg-surface rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 py-2 z-50">
                <div className="px-3 pb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Buscar vendedor..." 
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-surface-deep border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto scrollbar-hide">
                  {consultants.map(c => (
                    <button
                      key={c}
                      onClick={() => { setSelectedConsultant(c); setIsConsultantDropdownOpen(false); }}
                      className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedConsultant === c ? 'text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-500/10' : ''}`}
                    >
                      {selectedConsultant === c && <Check className="w-4 h-4 mr-2" />}
                      <span className={selectedConsultant === c ? 'font-medium' : 'ml-6'}>{c}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Periods */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm w-full sm:w-auto">
            <span className="text-gray-500 dark:text-gray-400 mr-2 mb-2 sm:mb-0">Período:</span>
            <div className="flex flex-wrap gap-2">
              {periods.map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-4 py-1.5 rounded-full border transition-colors ${
                    selectedPeriod === p 
                      ? 'bg-brand border-brand text-white' 
                      : 'bg-surface border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {p === 'Personalizado' && <CalendarIcon className="w-3 h-3 inline mr-1.5" />}
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap sm:flex-nowrap bg-surface rounded-xl border border-gray-200 dark:border-gray-800 p-1 gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              selectedTab === tab.id
                ? 'bg-gray-100 dark:bg-[#1f2937] text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="truncate">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Main Chart Area */}
      <div className="bg-surface rounded-2xl border border-gray-200 dark:border-gray-800 p-6 min-h-[400px]">
        {selectedTab === 'daily' && (
          <div className="h-full flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold">Mensagens e Conversas por Dia</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Volume de mensagens e conversas por dia da semana</p>
            </div>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataPorDia} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend iconType="square" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar yAxisId="left" dataKey="mensagens" name="Mensagens" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="conversas" name="Conversas" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedTab === 'hourly' && (
          <div className="h-full flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold">Mensagens e Conversas por Hora</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Distribuição ao longo do dia</p>
            </div>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataPorHora} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} minTickGap={30} />
                  <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="mensagens" name="Mensagens" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="conversas" name="Conversas" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedTab === 'heatmap' && (
          <div className="h-full flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold">Mapa de Calor</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Intensidade de mensagens por dia e hora (hover para ver conversas)</p>
            </div>
            <div className="flex-1 overflow-x-auto">
               <HeatmapComponent />
            </div>
          </div>
        )}

        {selectedTab === 'calendar' && (
          <div className="h-full flex flex-col">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Abril De 2026</h3>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 bg-brand text-white rounded-full text-sm font-medium">Mensagens</button>
                <button className="px-4 py-1.5 bg-transparent text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-sm font-medium">Conversas</button>
              </div>
            </div>
            <div className="flex-1">
               <CalendarComponent />
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-surface rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Mensagens</p>
          <p className="text-3xl font-bold text-brand dark:text-brand-light">2.136</p>
        </div>
        <div className="bg-surface rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Conversas</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-500">344</p>
        </div>
        <div className="bg-surface rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Dia Mais Ativo</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">Quinta</p>
        </div>
        <div className="bg-surface rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Hora de Pico</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">09:00</p>
        </div>
        <div className="bg-surface rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col items-center justify-center text-center shadow-sm">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Consultor Mais Ativo</p>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400 truncate w-full" title="Consultora Joyce">Consultora Joyce</p>
        </div>
      </div>
    </div>
  );
}

// Helper Components

function HeatmapComponent() {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
  
  // Generate mock heatmap data
  const getIntensityClass = (day: number, hour: number) => {
    if (day < 3) return 'bg-gray-100 dark:bg-[#1f2937]'; // Empty
    if (hour < 6 || hour > 22) return 'bg-gray-100 dark:bg-[#1f2937]';
    
    const rand = Math.random();
    if (rand > 0.8) return 'bg-red-500'; // Ruim/Alta intensidade
    if (rand > 0.5) return 'bg-yellow-500'; // Médio
    if (rand > 0.2) return 'bg-green-500'; // Bom
    return 'bg-gray-100 dark:bg-[#1f2937]';
  };

  return (
    <div className="min-w-[800px]">
      <div className="grid grid-cols-8 gap-1 mb-2">
        <div className="w-12"></div>
        {days.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500">{day}</div>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        {hours.map((hour, hIdx) => (
          <div key={hour} className="grid grid-cols-8 gap-1 items-center">
            <div className="text-xs text-gray-500 w-12 text-right pr-2">{hour}</div>
            {days.map((_, dIdx) => (
              <div 
                key={`${dIdx}-${hIdx}`} 
                className={`h-4 rounded-sm ${getIntensityClass(dIdx, hIdx)} transition-colors hover:opacity-80 cursor-pointer`}
                title={`${days[dIdx]} às ${hour}`}
              ></div>
            ))}
          </div>
        ))}
      </div>
      <div className="flex justify-center items-center gap-6 mt-8 text-xs font-medium text-gray-500">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Ruim</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Médio</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Bom</div>
      </div>
    </div>
  );
}

function CalendarComponent() {
  const daysOfWeek = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  // Mock calendar days for April 2026
  const days = Array.from({ length: 35 }, (_, i) => {
    const date = i - 2; // Start from previous month's end
    const isCurrentMonth = date > 0 && date <= 30;
    const displayDate = date <= 0 ? 31 + date : (date > 30 ? date - 30 : date);
    
    let status = null;
    let value = null;
    if (isCurrentMonth) {
      if (date === 8) { status = 'yellow'; value = 244; }
      if (date === 15) { status = 'green'; value = 963; }
      if (date === 22) { status = 'green'; value = 709; }
      if (date === 11) { status = 'red'; value = 220; }
    }

    return { date: displayDate, isCurrentMonth, status, value };
  });

  return (
    <div className="flex flex-col h-full">
      <div className="bg-brand/10 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-4 mb-6 flex gap-3">
        <BrainCircuit className="w-5 h-5 text-brand dark:text-brand-light flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">Análise de IA</h4>
          <p className="text-sm text-blue-800 dark:text-blue-200/80 leading-relaxed">
            O mês apresentou uma performance oscilante, com dois dias de alta performance que impulsionaram o total de mensagens e dois dias que ficaram significativamente abaixo da média. É crucial investigar as causas dessa variação e buscar maior consistência para os próximos meses.
          </p>
          <div className="flex items-center gap-6 mt-4 text-xs font-medium text-blue-800 dark:text-blue-300">
            <span>Classificação:</span>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div> Fraco — até 240 mensagens</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Normal — até 700 mensagens</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Forte — acima de 700 mensagens</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
        {daysOfWeek.map(day => (
          <div key={day} className="bg-gray-50 dark:bg-surface py-3 text-center text-xs font-bold text-gray-500 tracking-wider">
            {day}
          </div>
        ))}
        {days.map((day, i) => (
          <div 
            key={i} 
            className={`bg-white dark:bg-surface-deep min-h-[120px] p-2 relative transition-colors hover:bg-gray-50 dark:hover:bg-surface ${!day.isCurrentMonth ? 'opacity-40' : ''} ${day.date === 11 && day.isCurrentMonth ? 'ring-2 ring-inset ring-brand z-10' : ''}`}
          >
            <span className={`text-sm font-medium ${day.date === 11 && day.isCurrentMonth ? 'bg-brand text-white w-7 h-7 rounded-full flex items-center justify-center absolute top-2 right-2' : 'text-gray-700 dark:text-gray-300 absolute top-2 right-2'}`}>
              {day.date}
            </span>
            
            {day.status && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
                <div className={`w-5 h-5 rounded-full mb-1.5 shadow-sm ${
                  day.status === 'red' ? 'bg-red-500' : 
                  day.status === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{day.value}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

