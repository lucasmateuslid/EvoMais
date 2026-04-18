# Stack Remaining - EvoMais CRM + IA Hibrida

## Resumo Executivo
Este documento foi revisado com base no codigo atual do repositorio em 2026-04-14.

Status geral atualizado: **~65% concluido** (core backend, multi-tenant, realtime e dashboard principal com dados reais ja entregues).

---

## O que ja foi feito

### 1. Backend core e arquitetura base
- [x] API Express em TypeScript ativa
- [x] Rotas principais registradas: auth, team, crm, connections, ai, evolution, webhook, tenant, tenants, metrics, vendors, chat
- [x] Tratamento de erro centralizado com AppError e padrao de resposta consistente
- [x] Correlation ID em middleware e logs
- [x] Prestart build no backend para evitar dist desatualizado

### 2. Multi-tenant por subdominio
- [x] Middleware de resolucao de tenant por host
- [x] Validacao tenant/profile no fluxo de autenticacao (tenant_mismatch)
- [x] Migration de tenants criada: 20260414001000_tenants_subdomain.sql
- [x] Seed de tenants criado: 20260414001010_seed_tenants_empresa1_empresa2.sql
- [x] Endpoint publico de tenant atual: GET /api/tenant/current

### 3. Realtime
- [x] Socket.IO no backend (rooms por tenant)
- [x] Socket.IO no frontend (conexao por token)
- [x] Eventos realtime para CRM/chat/connections
- [x] Hooks frontend atualizando dashboard/vendors/chat em tempo real

### 4. Dashboards e frontend principal
- [x] Dashboard principal com layout novo aplicado
- [x] Dashboard principal consumindo dados reais por tenant (metricsService)
- [x] KPI + funil + hot leads + top performance com dados do banco
- [x] Paginas de Metrics, Vendors e Chat conectadas em endpoints reais

### 5. Super admin
- [x] Login de super admin no backend: POST /api/auth/super-admin/login
- [x] Restricao de layout admin no frontend (somente role super_admin)
- [x] Listagem e atualizacao de tenants para super admin em /api/tenants

### 6. Filas e jobs
- [x] BullMQ configurado com Redis
- [x] Workers para ai-analysis e evolution-send
- [x] Retry basico via defaultJobOptions (attempts/backoff)
- [ ] Worker webhook-process ainda nao implementado

### 7. Infra local
- [x] docker-compose com Redis local
- [x] Config de capacidades no backend (workers/websockets/tenantSubdomain)

---

## O que falta (priorizado)

## P0 - Bloqueador de producao

### 1. Webhook processor real (Evolution)
Status: **parcial** (assinatura HMAC validada em /webhook/evolution; processamento de negocio ainda pendente)

Falta:
- [x] Validar assinatura HMAC
- [ ] Processar status delivered/read/failed
- [ ] Persistir payload e processamento em tabela dedicada
- [ ] Acionar retry e fluxos de correcao

Passos sugeridos:
1. Criar migration para `webhook_logs`.
2. Criar `backend/src/services/webhookService.ts` com parser e handlers.
3. Refatorar `backend/src/routes/webhook.ts` para usar o service.
4. Publicar eventos de atualizacao via realtime quando aplicavel.

### 2. Banco para trilha operacional
Status: **parcial** (tenants e deals existem; tabelas operacionais novas ainda faltam)

Falta:
- [ ] `webhook_logs`
- [ ] `ai_analysis_jobs`
- [ ] `evolution_messages` (opcional, recomendado)
- [ ] RLS/policies para as tabelas acima

Passos sugeridos:
1. Criar nova migration incremental com as 3 tabelas.
2. Aplicar policies por organization_id + super admin.
3. Atualizar services para escrever nesses registros.

### 3. Workers completos
Status: **parcial**

Falta:
- [ ] Worker para `webhook-process`
- [ ] Estrategia DLQ para falhas permanentes
- [ ] Observabilidade de fila (dashboard ou endpoint de health)

Passos sugeridos:
1. Adicionar processor `webhook-process` em `backend/src/jobs/worker.ts`.
2. Criar fila de dead-letter ou regra de fail final.
3. Expor endpoint de status de workers/queues.

### 4. Auth robusto para producao
Status: **parcial** (refresh token no login existe, mas fluxo completo ainda nao)

Falta:
- [ ] Revogacao/blacklist de token
- [ ] Politica de expiracao e renovacao consistente
- [ ] Credencial service-to-service para webhooks internos

---

## P1 - Alta prioridade

### 5. Rate limiting e throttling
Status: **nao iniciado**

Falta:
- [ ] Rate limit global
- [ ] Rate limit por tenant
- [ ] Rate limit por rota critica (IA/webhook/auth)

Passos sugeridos:
1. Instalar `express-rate-limit`.
2. Aplicar middleware global + regras por rota.
3. Integrar Redis para contagem distribuida.

### 6. Multi-model IA (Gemini + Claude + Groq)
Status: **concluido** (roteamento multi-provedor com Gemini, OpenAI, Anthropic, DeepSeek e Groq; fallback e validacao de resposta implementados)

Falta:
- [ ] Persistir telemetria de custo/latencia por provider em tabela propria
- [ ] Expor selecao manual de provider no frontend/admin

Passos sugeridos:
1. Criar tabela de analise de uso por provider.
2. Expor métricas no admin.
3. Permitir override manual do provider por requisição quando necessario.

### 7. Versionamento de API
Status: **nao iniciado**

Falta:
- [ ] Prefixo `/api/v1`
- [ ] Estrategia de deprecacao

Passos sugeridos:
1. Criar camada de router v1.
2. Migrar rotas atuais sem quebrar cliente.

---

## P2 - Media prioridade

### 8. Admin backend (visao global)
Status: **parcial** (endpoints base /api/admin/stats, /api/admin/jobs e /api/admin/logs implementados)

Falta:
- [x] `/api/admin/stats`
- [x] `/api/admin/jobs`
- [x] `/api/admin/logs`

Passos sugeridos:
1. Evoluir payloads dos endpoints admin com visoes operacionais (erros, latencia e uso por tenant).
2. Adicionar pagina admin consumindo os endpoints globais.

### 9. Email service
Status: **nao iniciado**

### 10. Observabilidade avancada
Status: **parcial** (Sentry/Pino base prontos)

Falta:
- [ ] DSN real e ambiente por stage
- [ ] Dashboards de erro e latencia
- [ ] Health checks detalhados

### 11. Docker completo
Status: **parcial** (apenas Redis em compose)

Falta:
- [ ] Dockerfile backend
- [ ] Dockerfile frontend
- [ ] compose com app completo

---

## P3 - Qualidade e governanca
- [ ] Testes unitarios/integracao/e2e
- [ ] Swagger/OpenAPI
- [ ] ESLint + Prettier + hooks
- [ ] CI (GitHub Actions)
- [ ] Otimizacoes de performance e cache
- [ ] CLI de operacao (seed/migrate/health-check)

---

## Passos a serem seguidos (execucao recomendada)

## Fase 1 - Fechar P0 (1 a 2 dias)
1. Criar migration de `webhook_logs`, `ai_analysis_jobs`, `evolution_messages`.
2. Implementar `webhookService` + HMAC + persistencia.
3. Completar worker `webhook-process` e estrategia de falha final.
4. Criar endpoint de health de workers e validar com Redis ativo.

## Fase 2 - Seguranca e estabilidade (1 dia)
1. Adicionar rate limiting global e por tenant.
2. Revisar fluxo de refresh/revogacao de token.
3. Validar todas as rotas sensiveis com testes de autorizacao.

## Fase 3 - IA e admin global (2 dias)
1. Implementar `aiHybridService` (Gemini/Claude/Groq + fallback).
2. Evoluir payload de `/api/admin/stats`, `/api/admin/jobs`, `/api/admin/logs` com indicadores operacionais.
3. Exibir esses dados no dashboard admin.

## Fase 4 - Operacao e qualidade (2 a 3 dias)
1. Dockerizar backend/frontend e ajustar compose completo.
2. Subir testes minimos de regressao (auth + crm + metrics + tenants).
3. Adicionar Swagger e pipeline CI.

---

## Checklist imediato (proxima sessao)
- [ ] Rodar migrations pendentes no ambiente alvo
- [ ] Subir Redis via compose e validar workers habilitados
- [ ] Implementar migration operacional (webhook/ai_analysis/evolution_messages)
- [ ] Implementar webhook service com validacao de assinatura
- [ ] Completar worker webhook-process
- [ ] Criar endpoint de status de fila/workers

---

## Dependencias faltantes (atualizado)

### Backend
```json
{
  "@anthropic-ai/sdk": "^3.0.0",
  "groq-sdk": "^0.5.0",
  "express-rate-limit": "^7.1.0",
  "nodemailer": "^6.9.0",
  "swagger-ui-express": "^4.6.0",
  "swagger-jsdoc": "^6.2.8",
  "commander": "^11.1.0",
  "chalk": "^5.3.0"
}
```

### Frontend
```json
{
  "zustand-persist": "^0.1.0"
}
```

---

## Referencias rapidas
- Supabase RLS: https://supabase.com/docs/guides/auth/row-level-security
- BullMQ: https://docs.bullmq.io/
- Claude API: https://docs.anthropic.com/
- Groq API: https://api.groq.com/docs
- Socket.IO: https://socket.io/docs/v4/server-installation/
- Sentry Node: https://docs.sentry.io/platforms/node/

---

Ultima revisao: 2026-04-14
Proxima revisao recomendada: apos concluir os itens P0
