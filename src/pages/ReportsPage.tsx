import React from 'react';

export default function ReportsPage() {
  // Mock data based on the image
  const conversas = 142;
  const mensagens = 1847;
  const leadsQuentes = 18;
  const altaIntencao = 22;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      <div className="bg-surface-card border border-divider-subtle rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <span className="text-sm font-medium text-secondary">Período:</span>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-surface border border-divider-subtle text-sm font-medium text-secondary hover:text-primary transition-colors">
              Hoje
            </button>
            <button className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold shadow-sm">
              Semana
            </button>
            <button className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-surface border border-divider-subtle text-sm font-medium text-secondary hover:text-primary transition-colors">
              Mês
            </button>
          </div>
        </div>
        <button className="w-full sm:w-auto px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-bold shadow-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Gerar Relatório
        </button>
      </div>

      <div className="bg-surface-card border border-divider-subtle rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <h2 className="text-lg font-bold text-primary">Resumo Executivo</h2>
        </div>
        <p className="text-secondary text-sm leading-relaxed">
          Na última semana, a equipe comercial manteve um ritmo consistente de atendimento com {conversas} conversas ativas e {mensagens.toLocaleString('pt-BR')} mensagens trocadas. Destaque para o vendedor Carlos que converteu 3 leads quentes. Identificamos oportunidades de melhoria no tempo de resposta inicial e na abordagem de objeções sobre preço.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="bg-surface border border-divider-subtle rounded-xl p-6 text-center shadow-sm">
            <svg className="w-8 h-8 text-blue-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-3xl font-bold text-primary mb-1">{conversas}</p>
            <p className="text-sm font-medium text-muted">Conversas</p>
          </div>
          
          <div className="bg-surface border border-divider-subtle rounded-xl p-6 text-center shadow-sm">
            <svg className="w-8 h-8 text-emerald-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-3xl font-bold text-primary mb-1">{mensagens}</p>
            <p className="text-sm font-medium text-muted">Mensagens</p>
          </div>

          <div className="bg-surface border border-divider-subtle rounded-xl p-6 text-center shadow-sm">
            <svg className="w-8 h-8 text-red-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
            <p className="text-3xl font-bold text-primary mb-1">{leadsQuentes}</p>
            <p className="text-sm font-medium text-muted">Leads Quentes</p>
          </div>

          <div className="bg-surface border border-divider-subtle rounded-xl p-6 text-center shadow-sm">
            <svg className="w-8 h-8 text-emerald-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <p className="text-3xl font-bold text-primary mb-1">{altaIntencao}</p>
            <p className="text-sm font-medium text-muted">Alta Intenção</p>
          </div>
        </div>
      </div>
    </div>
  );
}
