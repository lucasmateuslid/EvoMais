# EvoMais - Proximos Passos (Pendencias)

Este documento lista o que ja foi concluido, o que ainda falta e a ordem recomendada para finalizar a arquitetura da sprint.

## 1. Estado Atual (Concluido)

- Backend Node.js base criado (`backend/`) com:
  - Rotas: `/health`, `/api/ai/chat`, `/api/evolution/*`, `/api/crm/*`, `/webhook/evolution`
  - Middleware de erro e request logging
  - Circuit breaker basico para Evolution API
  - Fila BullMQ opcional via `REDIS_URL`
- Frontend com proxy opcional para backend via `VITE_BACKEND_URL`
  - IA: fallback para cliente local Gemini
  - CRM: fallback para Supabase direto
- Migration criada para CRM + RLS:
  - `supabase/migrations/20260413000100_crm_deals_and_rls.sql`

## 2. Pendencias Criticas (Ordem Prioritaria)

## Passo 1 - Aplicar migrations no Supabase

Objetivo: garantir que tabela `deals` e policies RLS estejam ativas.

A fazer:

1. Rodar a migration no projeto Supabase alvo.
2. Confirmar existencia da tabela `deals`.
3. Confirmar policies em `deals` e `profiles`.

Checklist:

- [ ] `deals` criada com colunas esperadas
- [ ] RLS habilitado em `deals`
- [ ] Policies de select/insert/update/delete em `deals`
- [ ] Policies de select/update em `profiles`

## Passo 2 - Configurar variaveis de ambiente

Objetivo: deixar frontend e backend prontos para rodar conectados.

A fazer no backend (`backend/.env`):

- [ ] `PORT=4000`
- [ ] `CORS_ORIGIN=http://localhost:3000`
- [ ] `SUPABASE_URL=...`
- [ ] `SUPABASE_ANON_KEY=...`
- [ ] `SUPABASE_SERVICE_ROLE_KEY=...`
- [ ] `REDIS_URL=redis://localhost:6379` (ou cloud)
- [ ] `GEMINI_API_KEY=...`
- [ ] `EVOLUTION_API_URL=...`
- [ ] `EVOLUTION_GLOBAL_API_KEY=...`
- [ ] `SENTRY_DSN=...` (opcional nesta fase)

A fazer no frontend (`.env`):

- [ ] `VITE_BACKEND_URL=http://localhost:4000`
- [ ] `VITE_SUPABASE_URL=...`
- [ ] `VITE_SUPABASE_ANON_KEY=...`
- [ ] `VITE_EVOLUTION_API_URL=...`
- [ ] `VITE_EVOLUTION_GLOBAL_API_KEY=...`
- [ ] `GEMINI_API_KEY=...` (fallback local)

## Passo 3 - Subir stack local completa

Objetivo: validar integracao end-to-end.

Comandos:

```bash
# terminal 1
cd backend
npm install
npm run dev

# terminal 2
cd ..
npm run dev
```

Checklist:

- [ ] Backend responde em `http://localhost:4000/health`
- [ ] Frontend abre em `http://localhost:3000`
- [ ] Login funciona
- [ ] CRM carrega deals
- [ ] Alterar etapa no Kanban persiste no banco

## Passo 4 - Validar isolamento multi-tenant (RLS)

Objetivo: garantir que org A nao acesse dados da org B.

Teste minimo:

- [ ] Criar 2 usuarios em organizacoes diferentes
- [ ] Fazer login com usuario A e confirmar que so ve deals da org A
- [ ] Fazer login com usuario B e confirmar que so ve deals da org B
- [ ] Validar que update/delete de deal de outra org falha

## Passo 5 - Endurecer observabilidade minima

Objetivo: reduzir tempo de diagnostico em producao.

A fazer:

- [ ] Ativar `SENTRY_DSN` no backend
- [ ] Adicionar `requestId` nos logs (Pino)
- [ ] Registrar erros de integracao Evolution/IA com contexto
- [ ] Criar endpoint `GET /health` com status detalhado de dependencias (Redis/Supabase)

## Passo 6 - Completar Evolution API com fila real

Objetivo: tirar fluxo de "best effort" e ir para entrega confiavel.

A fazer:

- [ ] Enfileirar envios em `evolution-send`
- [ ] Processador dedicado para retry/backoff
- [ ] Persistir status de envio (sent/failed/retry)
- [ ] Tratar webhook de delivery/read
- [ ] Alerta quando circuit breaker abrir

## Passo 7 - IA hibrida (fase seguinte da sprint)

Objetivo: reduzir custo e melhorar resposta por tipo de tarefa.

A fazer:

- [ ] Roteamento por provedor (Gemini/Claude/Groq)
- [ ] Cache semantico (Redis + embeddings)
- [ ] Telemetria de tokens/custo por requisicao
- [ ] Politica de fallback entre modelos

## 3. Lacunas Tecnicas Ainda Abertas

- [ ] Sem testes automatizados (unitarios/integracao/e2e)
- [ ] Sem dashboard de jobs BullMQ
- [ ] Sem schema de auditoria para eventos criticos
- [ ] Sem rate limiting por tenant
- [ ] Sem runbook de incidente

## 4. Definicao de Pronto (Sprint)

Considere esta fase pronta quando:

- [ ] Login + CRM funcionando via backend
- [ ] RLS validado com 2 tenants reais
- [ ] Evolution com retry confiavel + webhook
- [ ] Logs estruturados + Sentry ativo
- [ ] Build frontend e backend verdes

## 5. Proxima Execucao Recomendada (agora)

Ordem sugerida para sua proxima sessao:

1. Aplicar migration no Supabase.
2. Preencher `.env` de frontend e backend.
3. Subir backend + frontend local.
4. Rodar testes manuais de CRM e RLS.
5. Implementar fila real da Evolution.

---

Se quiser, na proxima etapa eu ja implemento diretamente:

- Dashboard de fila BullMQ
- Persistencia de status de mensagens no banco
- Teste automatizado inicial (smoke) para `/health` e `/api/crm/deals`
