# Auditoria EvoMais — Rotas Backend / Frontend / Admin-Frontend

Data: 2026-06-01
Escopo: `backend/`, `frontend/`, `admin-frontend/`.

---

## 1. Mapa de rotas backend

Origem: `backend/src/index.ts:86-106` e `backend/src/adminIndex.ts:31-62`.

| Prefixo | Router | Autenticação | Observação |
|---|---|---|---|
| `/` | inline | público | banner |
| `/health` | `health.ts` | público | OK |
| `/api/tenant` | `tenants.ts` (singular) | **público** | `GET /current` — resolve tenant pelo subdomain |
| `/api/auth` | `auth.ts` | público + rateLimit | `login`, `me`, `logout`, `super-admin/login`, `forgot-password`, `reset-password` |
| `/api/admin` | `admin.ts` | `requireAuth` + `ensureSuperAdmin` | `stats`, `jobs`, `logs` |
| `/api/tenants` | `tenants.ts` | `requireAuth` | `GET /`, `POST /`, `POST /users`, `PATCH /:tenantId` |
| `/api/team` | `team.ts` | `requireAuth` + `canManageMembers` | `GET/POST/PATCH /members` |
| `/api/ai` | `ai.ts` | `requireAuth` + rateLimit | `POST /chat` |
| `/api/metrics` | `metrics.ts` | `requireAuth` | `GET /dashboard`, `GET /timeline` |
| `/api/vendors` | `vendors.ts` | `requireAuth` | `GET /`, `POST /` |
| `/api/chat` | `chat.ts` | `requireAuth` + rateLimit (POST) | `vendors/:vendorId/conversations[/...]` |
| `/api/connections` | `connections.ts` | `requireAuth` | CRUD + `POST :id/connect`, `PATCH :id/status` |
| `/api/crm` | `crm.ts` | `requireAuth` | `deals` CRUD |
| `/api/evolution` | `evolution.ts` | `requireAuth` | `POST /instances`, `GET /instances`, `POST /messages` (rate-limit só em `messages`) |
| `/webhook/evolution` | `webhook.ts` | HMAC `x-webhook-signature` | **sem rate-limit** |

`adminIndex.ts` (bin separado) expõe `health, auth, admin, tenant, tenants`, sem `resolveTenantFromHost` montado.

---

## 2. Inconsistências críticas frontend ⇄ backend

### 2.1 `SettingsPage` quebrado — endpoints inexistentes
`frontend/src/services/evolutionService.ts`:

| Linha | Frontend chama | Backend tem? |
|---|---|---|
| 51 | `GET /api/evolution/instances/:name/qrcode` | ❌ |
| 61 | `POST /api/evolution/instances/:name/restart` | ❌ |
| 71 | `DELETE /api/evolution/instances/:name` | ❌ |

### 2.2 Payload incorreto na criação de instância
`SettingsPage.tsx:62` envia `{ name }`. Backend (`evolution.ts:15-17`) exige `{ instanceName }`. Zod retorna 400 sempre.

### 2.3 Frontend principal tem páginas admin órfãs
`frontend/src/pages/admin/*` existem mas o `App.tsx:72` sempre redireciona `/admin/*` para `VITE_ADMIN_APP_URL`. Páginas e services duplicados (`frontend/src/services/adminService.ts`, `adminTenantsService.ts`) = código morto.

### 2.4 CORS único quebra ambiente com 2 frontends
`config.ts:16` `CORS_ORIGIN` é string única. Frontend e admin-frontend em portas diferentes: só um passa. Mesmo problema no Socket.IO (`realtime/socket.ts:18-24`).

---

## 3. Problemas de segurança

### 3.1 Escalação em `PATCH /api/team/members/:profileId`
`backend/src/routes/team.ts:115-156`: admin local pode promover qualquer membro da própria org para `admin`. Convite default é `'admin'` (linha 14). Risco alto.

### 3.2 Bypass de `tenant_mismatch` sem subdomain
`middleware/auth.ts:72-81`. Se o request não tem `tenantOrganizationId` resolvido, a checagem passa. Em produção, acesso por IP/host raiz contorna o isolamento por subdomain.

### 3.3 `super-admin/login` exposto no servidor principal
`index.ts:95` monta `authRouter` que inclui `/super-admin/login`. Amplia superfície de brute force.

### 3.4 Webhook sem rate-limit e idempotency frágil
`routes/webhook.ts:192`: sem `express-rate-limit`. `idempotencyKey = sha256(eventType:instanceName:rawBody)` — qualquer mudança no payload (timestamp) gera nova chave. `webhookPayloadSchema = z.record(z.string(), z.unknown())` aceita qualquer shape.

### 3.5 `trust proxy` não configurado
Nenhum bin chama `app.set('trust proxy', ...)`. Rate-limiters atrás de proxy usam IP do proxy → rate-limit global, e IPs reais não chegam para auditoria.

### 3.6 Endpoints sem rate-limit
- `POST /api/evolution/instances` (caro, provisiona).
- `POST /api/connections`, `POST /api/connections/:id/connect`.
- `POST /api/vendors`.
- `POST /api/crm/deals`.
- `POST /webhook/evolution`.

### 3.7 RLS bypass desnecessária
- `chat.ts:276` usa `adminSupabase` para um `profiles.name` que poderia ser via user client.
- `team.ts` inteiro usa `adminSupabase` — abre todos os profiles se a RLS for endurecida.

### 3.8 `DELETE /api/connections/:id` é destrutivo demais
`connections.ts:251-334`: após deletar a connection, apaga `messages` e `conversations` de **todos os sellers que compartilham o mesmo telefone**. Perda de dados em massa.

### 3.9 `reset-password` aceita múltiplas modalidades + fallback de service-role
`auth.ts:247-372`: cai em `admin.updateUserById` se o `updateUser` falhar, autorizando a troca apenas com `accessToken` ainda válido. Caminho relaxado.

### 3.10 `tenants PATCH` não normaliza `subdomain`
`tenants.ts:321-360` ao contrário do POST, não converte para lowercase.

---

## 4. Bugs lógicos

### 4.1 `chat.ts` grava `delivered` sem ter enviado
`chat.ts:291-322`: status inicial `'delivered'`; só recalcula se há `connection.api_provider === 'evolution'`. Vendedor sem connection → UI mostra "entregue" para mensagem que nunca saiu.

### 4.2 `vendors POST` emite `connections:updated` com payload null
`vendors.ts:91-99` quando `connectWhatsApp=false`.

### 4.3 `connections POST/CONNECT` síncronos
Chamam `provisionEvolutionInstance` no caminho da request (até 15s). Deveria ir para fila.

### 4.4 `provisionEvolutionInstance` reescreve via `upsert`
`evolutionPersistence.ts:70-101`: chamado também pelo webhook (`webhook.ts:258-266`) sem `connection_id`/`seller_id` → upsert pode zerar colunas setadas em outro caminho.

### 4.5 `extractEvolutionMessageId` BFS frouxo
`chat.ts:38-64`: aceita qualquer string chamada `id`, pode confundir com `instance.id` etc.

### 4.6 Workers nunca sobem na config atual
`config.ts:21` espera `REDIS_URL`. A `.env` usa `CACHE_REDIS_URI` (var da Evolution). `ENABLE_WORKERS=false`. Toda persistência cara está síncrona.

### 4.7 `GET /api/tenants` sem paginação
`tenants.ts:117-127` sem `.limit()`.

### 4.8 `tenants POST /users` ignora `organizations.max_users`
`tenants.ts:210-319` não consulta limite do plano.

### 4.9 Socket.IO continua com token expirado
`frontend/src/services/realtimeService.ts:11-41`: handshake valida uma vez (`socket.ts:33`), nunca revalida.

### 4.10 `adminIndex.ts` sem `resolveTenantFromHost`
`tenant_mismatch` nunca dispara no bin admin.

### 4.11 Código duplicado/órfão no frontend principal
`frontend/src/pages/admin/*` + `frontend/src/services/adminService.ts` + `frontend/src/services/adminTenantsService.ts`.

---

## 5. Pontos positivos

- HMAC com `timingSafeEqual` no webhook.
- Rate-limiters por usuário em `ai.chat` e `chat.send`.
- Circuit breaker na Evolution API.
- Correlation-ID + AsyncLocalStorage em logs.
- RLS-aware: `createUserSupabaseClient` propaga JWT nas rotas de domínio.
- `securityHeaders` cobre CSP, X-Frame, HSTS condicional.
- `auth.requireAuth` checa `tenant_mismatch` quando subdomain está presente.

---

## 6. Punch list de correções

### Crítico
1. Corrigir `frontend/services/evolutionService.ts`: payload `{ name }` → `{ instanceName }`.
2. Implementar (ou remover do front) `GET /instances/:name/qrcode`, `POST /instances/:name/restart`, `DELETE /instances/:name`.
3. Corrigir `DELETE /api/connections/:id` para não apagar histórico de outros sellers.

### Alto (segurança)
4. Tirar `/api/auth/super-admin/login` do `index.ts`.
5. Endurecer `team.ts`: default de role `'user'`, bloquear promoção via PATCH.
6. Em produção, exigir `tenantOrganizationId` no `/api/auth/login`.
7. `app.set('trust proxy', 1)` nos dois bins.
8. Rate-limit no webhook, `POST /api/evolution/instances`, `POST /api/connections[*]`, `POST /api/vendors`.
9. `CORS_ORIGIN` lista (array), replicar no Socket.IO.

### Médio (lógica/UX)
10. `chat.ts`: `pending`/`failed` quando não há connection.
11. `vendors.ts`: não emitir `connections:updated` quando `connection` é null.
12. Mover `provisionEvolutionInstance` para fila Redis; alinhar `REDIS_URL`.
13. `tenants PATCH` normalizar `subdomain.toLowerCase()`.
14. `tenants POST /users` validar `max_users` do plano.
15. Excluir `frontend/src/pages/admin/*` e services órfãos.
16. Refresh/expiração do socket quando token expira.

### Baixo
17. `webhook.ts`: schema mais estrito; idempotência por `messageId`.
18. `extractEvolutionMessageId` restringir caminho.
19. `evolution_instances`: usar `update` no caminho do webhook.
20. Paginação em `GET /api/tenants` e `GET /api/vendors`.
