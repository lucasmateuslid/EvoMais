# Stack Restante - EvoMais CRM + IA Híbrida

## 📋 Resumo Executivo

Este documento lista **toda tecnologia, pacote e feature** que ainda falta ser implementada para completar a stack do EvoMais. Priorizado por criticidade e ordem de implementação.

**Última atualização:** 2026-04-14  
**Status geral:** 40% stack implementada (foundation + core backend complete)

---

## 🔴 Crítico - Bloqueador de Produção (P0)

### 1. Redis + BullMQ Workers Reais
**Status:** Setup feito, workers não testados  
**Pacotes:** `ioredis`, `bullmq` ✅ (já instalados)  
**O que falta:**
- [ ] Testar conectividade com Redis real (local ou cloud)
- [ ] Implementar worker processor completo para `evolution-send` job
- [ ] Implementar worker processor completo para `ai-analysis` job
- [ ] Implementar worker processor completo para `webhook-process` job
- [ ] Adicionar retry logic e dead-letter queue (DLQ)
- [ ] Adicionar job visibility dashboard (BullMQ UI opcional)

**Referência:** `backend/src/jobs/worker.ts` (stubs existem)

---

### 2. Webhook Processor + Persistência (Evolution API)
**Status:** Rota recebe webhooks `/webhook/evolution`, mas não processa  
**O que falta:**
- [ ] Parser de status updates (delivered, read, failed)
- [ ] Atualizar status de mensagens em DB
- [ ] Trigger ações (re-send, alertas, relogs)
- [ ] Validar assinatura HMAC do Evolution API
- [ ] Persistir raw webhook payload em `webhook_logs` table (nova migration)
- [ ] Implementar retry com exponential backoff

**Novo arquivo:** `backend/src/services/webhookService.ts`  
**Nova migration:** `webhook_logs` table

---

### 3. Banco de Dados - Novas Tabelas
**Status:** Migration inicial exists, mas faltam tabelas cruciais  
**Migrations necessárias:**
```sql
-- Tabela 1: webhook_logs
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  source VARCHAR(50), -- 'evolution', 'external'
  event_type VARCHAR(100), -- 'message.status', 'contact.update'
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela 2: ai_analysis_jobs
CREATE TABLE ai_analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id),
  status VARCHAR(20), -- 'pending', 'processing', 'done', 'failed'
  analysis_result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Tabela 3: evolution_messages (opcional, para tracking)
CREATE TABLE evolution_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  phone_number VARCHAR(20),
  message_text TEXT,
  direction VARCHAR(20), -- 'inbound', 'outbound'
  status VARCHAR(20), -- 'sent', 'delivered', 'read', 'failed'
  external_id VARCHAR(100), -- ID do Evolution
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS policies para cada tabela acima
```

---

### 4. JWT Validation Melhorado
**Status:** Básico implementado  
**Pacotes:** `jsonwebtoken`, `@supabase/supabase-js` ✅  
**O que falta:**
- [ ] Token refresh flow (JWT + refresh token)
- [ ] Token revocation list (blacklist)
- [ ] Token expiration handling
- [ ] Service-to-service auth (API keys para webhooks)

**Referência:** `backend/src/middleware/auth.ts`

---

## 🟠 Alto Prioridade - Bloqueador de Features (P1)

### 5. Multi-Model IA Routing
**Status:** Suporta só Gemini, faltam alternativas  
**Pacotes necessários:**
```json
{
  "@anthropic-ai/sdk": "^3.x",  // Claude
  "groq-sdk": "^0.x"             // Groq
}
```

**O que falta:**
- [ ] Implementar Claude client (Anthropic API)
- [ ] Implementar Groq client (Groq API)
- [ ] Switch logic: qual model usar baseado em:
  - Custo (Groq = $0.0001/token, Claude = $0.008)
  - Latência (Groq rápido, Claude preciso)
  - Tipo de análise (texto vs. estruturado)
- [ ] Fallback chain: Gemini → Claude → Groq → determinístico
- [ ] Cache de embeddings (via Redis, não só memory)

**Novo arquivo:** `backend/src/services/aiHybridService.ts`  
**Atualizar:** `backend/src/services/aiService.ts` (integrar multi-model)

---

### 6. Rate Limiting + Throttling
**Status:** Não implementado  
**Pacotes:**
```json
{
  "express-rate-limit": "^7.x",
  "redis": "^4.x" // para rate limit distribuído
}
```

**O que falta:**
- [ ] Rate limiting global (ex: 100 req/min por IP)
- [ ] Rate limiting por tenant (ex: 50 req/min por org)
- [ ] Rate limiting por modelo IA (ex: 10 análises/min por org)
- [ ] Throttling de Evolution API (não sobrecarregar)
- [ ] Retorno de X-RateLimit-Remaining headers

---

### 7. API Versioning
**Status:** Não implementado  
**O que falta:**
- [ ] Router versioning: `/api/v1/`, `/api/v2/`
- [ ] Deprecated endpoint handling
- [ ] Version migration guide

**Novo padrão:**
```typescript
app.use('/api/v1', require('./routes/v1'));
app.use('/api/v2', require('./routes/v2'));
```

---

## 🟡 Médio Prioridade - Features Importantes (P2)

### 8. Admin Dashboard Backend
**Status:** Estrutura base existe (`AdminDashboardPage.tsx`), backend vazio  
**O que falta:**
- [ ] Endpoint GET `/api/admin/stats` (total orgs, users, deals)
- [ ] Endpoint GET `/api/admin/tenants` (listar todas orgs)
- [ ] Endpoint PATCH `/api/admin/tenants/:id` (ativar/desativar)
- [ ] Endpoint GET `/api/admin/jobs` (status das filas)
- [ ] Endpoint GET `/api/admin/logs` (errors, warnings)
- [ ] Auth super-admin (não org_id, mas role='admin')

**Novo arquivo:** `backend/src/routes/admin.ts`  
**Atualizar:** `backend/src/middleware/auth.ts` (adicionar `requireAdmin`)

---

### 9. Email Service
**Status:** Não implementado  
**Pacotes:**
```json
{
  "nodemailer": "^6.x",
  "@sendgrid/mail": "^7.x" // alternativa
}
```

**O que falta:**
- [ ] Configurar SMTP (SendGrid, Mailgun, etc)
- [ ] Templates de email (followup alerts, deal notifications)
- [ ] Queue para envio assíncrono (BullMQ job)
- [ ] Retry logic para falhas de envio

**Novo arquivo:** `backend/src/services/emailService.ts`

---

### 10. WebSocket Real-Time (Colaboração ao Vivo)
**Status:** Não implementado  
**Pacotes:**
```json
{
  "socket.io": "^4.x",
  "socket.io-redis": "^6.x" // adapter para múltiplos servers
}
```

**O que falta:**
- [ ] Setup Socket.IO no Express
- [ ] Namespaces: `/deals`, `/ai-chat`, `/notifications`
- [ ] Sync em tempo real quando deal é atualizado
- [ ] Notificações push para usuários conectados
- [ ] Desconexão graceful

---

### 11. Observability Completo
**Status:** Infrastructure existe (Sentry, Pino), não está ativo  
**O que falta:**
- [ ] Ativar Sentry com DSN real
- [ ] Capturar erros não-esperados
- [ ] Custom breadcrumbs para IA calls
- [ ] Performance monitoring (transaction tracing)
- [ ] CRON monitoring (health checks)
- [ ] Pino log aggregation (arquivo local + cloud opcional)
- [ ] Dashboards grafana (TODO opcional)

**Referência:** `backend/src/sentry.ts`, `backend/src/logger.ts`

---

### 12. Docker + Docker Compose
**Status:** Mencionado em comentários, não implementado  
**O que falta:**
- [ ] Dockerfile para backend (Node.js + Alpine)
- [ ] Dockerfile para frontend (build stage + nginx)
- [ ] docker-compose.yml:
  - backend service
  - frontend service
  - redis service
  - postgres (optional, para dev local)
- [ ] .dockerignore
- [ ] Scripts para build e deploy

---

## 🟢 Baixa Prioridade - Polish & Tests (P3)

### 13. Testes Automatizados
**Status:** Zero testes  
**Pacotes:**
```json
{
  "vitest": "^1.x",
  "jest": "^29.x",
  "@testing-library/react": "^14.x",
  "supertest": "^6.x"
}
```

**O que falta:**
- [ ] Unit tests para services (aiService, evolutionService)
- [ ] Integration tests para rotas (POST /api/crm/deals)
- [ ] E2E tests (login → create deal → AI analysis)
- [ ] Performance tests (benchmark IA calls)
- [ ] RLS validation tests (multi-tenant isolation)

---

### 14. API Documentation (Swagger/OpenAPI)
**Status:** Não implementado  
**Pacotes:**
```json
{
  "swagger-ui-express": "^4.x",
  "swagger-jsdoc": "^6.x"
}
```

**O que falta:**
- [ ] Swagger/OpenAPI definitions para todas rotas
- [ ] Interactive API explorer em `/api-docs`
- [ ] Request/response schemas (Zod → OpenAPI)
- [ ] Usage examples

---

### 15. Code Quality & Linting
**Status:** TypeScript strict ✅, mas sem linter configurado  
**Pacotes:**
```json
{
  "eslint": "^8.x",
  "prettier": "^3.x",
  "@rushstack/eslint-config": "^3.x"
}
```

**O que falta:**
- [ ] ESLint config (strict rules)
- [ ] Prettier auto-format
- [ ] Pre-commit hooks (husky + lint-staged)
- [ ] CI checks (GitHub Actions)

---

### 16. Performance Optimization
**Status:** Não medido ainda  
**O que falta:**
- [ ] Query optimization (indexes no Supabase)
- [ ] Connection pooling (já feito via Supabase)
- [ ] Caching layer (Redis para queries frequentes)
- [ ] CDN para frontend (se usar Vercel/Netlify)
- [ ] Image optimization (next/image ou sharp)
- [ ] Bundle analysis + splitting

---

### 17. CLI Utilities
**Status:** Não existem  
**Pacotes:**
```json
{
  "commander": "^11.x",
  "chalk": "^5.x"
}
```

**O que falta:**
- [ ] `npm run seed:db` - popular dados de teste
- [ ] `npm run migrate` - rodar migrations
- [ ] `npm run generate-docs` - gerar documentação
- [ ] `npm run health-check` - diagnosticar stack

---

## 📊 Dependências Não Instaladas

### Backend (faltam estes)
```json
{
  "@anthropic-ai/sdk": "^3.0.0",
  "groq-sdk": "^0.5.0",
  "express-rate-limit": "^7.1.0",
  "nodemailer": "^6.9.0",
  "socket.io": "^4.7.0",
  "socket.io-redis": "^6.1.0",
  "swagger-ui-express": "^4.6.0",
  "swagger-jsdoc": "^6.2.8",
  "commander": "^11.1.0",
  "chalk": "^5.3.0"
}
```

### Frontend (faltam estes)
```json
{
  "socket.io-client": "^4.7.0",
  "zustand-persist": "^0.1.0" // para persistência de store
}
```

---

## 🎯 Próximas Fases (Order)

### Fase 1: MVP Funcional (Semana 1-2)
- ✅ Backend Express com rotas
- ✅ Supabase + RLS
- ✅ Auth JWT
- ✅ CRM CRUD
- 🔲 Redis + BullMQ workers reais
- 🔲 Webhook processor
- 🔲 Novas tabelas (webhook_logs, ai_analysis_jobs)

### Fase 2: IA Completa (Semana 2-3)
- 🔲 Multi-model routing (Claude + Groq)
- 🔲 Cache Redis para embeddings
- 🔲 Rate limiting

### Fase 3: Admin & Real-Time (Semana 3-4)
- 🔲 Admin routes + dashboard
- 🔲 WebSocket + Socket.IO
- 🔲 Email service

### Fase 4: Quality & Deploy (Semana 4-5)
- 🔲 Testes (unit/integration/e2e)
- 🔲 Docker setup
- 🔲 Observability ativada
- 🔲 API documentation
- 🔲 ESLint + Prettier

### Fase 5: Polish (Semana 5-6)
- 🔲 Performance optimization
- 🔲 CLI utilities
- 🔲 CRON jobs (limpeza, relatórios)
- 🔲 Versioning API

---

## 📝 Checklist de Ação Imediata

```markdown
#### Hoje (Próximas 2 horas):
- [ ] Apply migration: `20260413000100_crm_deals_and_rls.sql`
- [ ] Populate `.env` files (Supabase creds, Redis URL)
- [ ] Test local stack: `npm run dev` (backend + frontend)
- [ ] Verify login flow works (profiles table accessibility)

#### Amanhã (Próximas 4 horas):
- [ ] Test CRM CRUD through frontend
- [ ] Verify multi-tenant RLS (2 users, 2 orgs isolation)
- [ ] Test `/api/ai/chat` endpoint
- [ ] Create webhook_logs table migration

#### Dia Seguinte (Próximas 8 horas):
- [ ] Implement BullMQ workers (evolution-send processor)
- [ ] Test webhook receiver
- [ ] Add Claude SDK + basic multi-model logic
- [ ] Implement rate limiting middleware

#### Rest of Week:
- [ ] Implement WebSocket basics
- [ ] Add admin routes
- [ ] Setup Docker
- [ ] Add Sentry DSN + activate monitoring
```

---

## 🔗 Referências Rápidas

- **Supabase RLS Docs:** https://supabase.com/docs/guides/auth/row-level-security
- **BullMQ Documentation:** https://docs.bullmq.io/
- **Claude API:** https://docs.anthropic.com/
- **Groq API:** https://api.groq.com/docs
- **Socket.IO Guide:** https://socket.io/docs/v4/server-installation/
- **Sentry Setup:** https://docs.sentry.io/platforms/node/

---

**Última revisão:** 2026-04-14  
**Próxima revisão:** Após conclusão de Fase 1
