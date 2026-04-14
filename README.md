# EvoMais

Plataforma CRM com foco em operação comercial e atendimento via WhatsApp, com recursos de IA para análise e automações.

## O que é o projeto

O EvoMais integra:

- Gestão de pipeline comercial (deals, kanban, follow-ups);
- Atendimento e integrações com Evolution API;
- Recursos de IA para análise e assistência operacional;
- Backend com APIs para CRM, IA, webhooks e saúde do sistema.

## Stack principal

### Frontend

- React 19 + TypeScript
- Vite
- TailwindCSS
- React Query
- Zustand
- Radix UI / shadcn

### Backend

- Node.js + TypeScript
- Express
- Supabase (dados/autenticação)
- BullMQ (fila)
- Redis (cache/fila)
- Sentry (observabilidade)

### Infra

- Docker Compose para Redis local
- SQL/migrations em `supabase/migrations`

## Estrutura resumida

- `frontend/`: aplicação web (UI, páginas, hooks, serviços)
- `backend/`: API e integrações
- `supabase/`: schema, migrations e dados de apoio
- `docker-compose.yml`: Redis local para fila/cache

## Como funciona (visão geral)

1. O frontend consome as rotas do backend para CRM, IA e integrações;
2. O backend coordena regras de negócio, integra com Supabase e Evolution API;
3. Quando habilitado (`REDIS_URL`), jobs assíncronos usam BullMQ + Redis;
4. Endpoint de saúde (`/health`) expõe status e capacidades ativas.

## Pré-requisitos

- Node.js 20+
- npm 10+
- Docker Desktop (opcional, para Redis local)

## Configuração de ambiente

### Frontend (`frontend/.env`)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_EVOLUTION_API_URL`
- `VITE_EVOLUTION_GLOBAL_API_KEY`

### Backend (`backend/.env`)

- `PORT` (default 4000)
- `NODE_ENV`
- `CORS_ORIGIN`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REDIS_URL` (ex.: `redis://localhost:6379`)
- `GEMINI_API_KEY`, `ANTHROPIC_API_KEY` ou `GROQ_API_KEY`
- `EVOLUTION_API_URL`
- `EVOLUTION_GLOBAL_API_KEY`
- `SENTRY_DSN`

Use os arquivos `.env.example` como base e nunca versione chaves reais.

## Rodando localmente

Na raiz do projeto:

1. Instalar dependências:

```bash
npm run install:frontend
npm run install:backend
```

2. Subir Redis (opcional, mas recomendado para filas):

```bash
docker compose up -d redis
```

3. Rodar frontend:

```bash
npm run dev
```

4. Rodar backend (outro terminal):

```bash
npm run dev:backend
```

## Scripts úteis (raiz)

- `npm run dev`: frontend em desenvolvimento
- `npm run dev:backend`: backend em desenvolvimento
- `npm run build`: build do frontend
- `npm run build:backend`: build do backend
- `npm run start:backend`: backend em modo produção

## Documentação adicional

Você encontra guias complementares na raiz, como autenticação, SQL, estrutura visual de banco e próximos passos.
