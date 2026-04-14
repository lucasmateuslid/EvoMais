## 📋 GUIA DE IMPLEMENTAÇÃO - PASSO A PASSO

### FASE 1: CONFIGURAÇÃO INICIAL (Hoje)

#### ✅ Passo 1.1: Executar Schema SQL
```bash
Arquivo: supabase/migrations/complete_database_schema.sql
Local: Supabase Dashboard > SQL Editor
Tempo: ~2 min
```

**O que recebe:**
- ✅ 13 tabelas criadas
- ✅ 40+ índices
- ✅ 50+ políticas RLS
- ✅ 3 funções de segurança
- ✅ Sistema pronto

#### ✅ Passo 1.2: Inserir Test Data
```bash
Arquivo: supabase/migrations/test_data.sql
Local: Supabase Dashboard > SQL Editor
Tempo: ~1 min
```

**O que recebe:**
- ✅ 2 organizações de exemplo
- ✅ 4 usuários
- ✅ 4 vendedores
- ✅ Dados para testar

#### ✅ Passo 1.3: Copiar Variáveis de Ambiente
```bash
Local: Supabase Project Settings > API

Copiar:
- SUPABASE_URL (exemplo: https://seu-project.supabase.co)
- SUPABASE_ANON_KEY (começa com eyJ...)
- SUPABASE_SERVICE_ROLE_KEY (úuuuliiiimo cuidado!)
```

---

### FASE 2: CONFIGURAR FRONTEND (2-4 horas)

#### Passo 2.1: Cliente Supabase
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

#### Passo 2.2: Auth Store (Zustand/Pinia)
```typescript
// src/store/authStore.ts
import { supabase } from '@/lib/supabase';

interface AuthStore {
  user: any | null;
  profile: any | null;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    profile: null,
    error: null
  }),

  actions: {
    async login(email: string, password: string) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        this.user = data.user;

        // Buscar profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        this.profile = profile;
        this.error = null;
      } catch (error) {
        this.error = error.message;
        throw error;
      }
    },

    async logout() {
      await supabase.auth.signOut();
      this.user = null;
      this.profile = null;
    }
  }
});
```

#### Passo 2.3: Proteger Rotas
```typescript
// src/router/ProtectedRoute.tsx
import { useAuthStore } from '@/store/authStore';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }) {
  const authStore = useAuthStore();

  if (!authStore.user) {
    return <Navigate to="/login" />;
  }

  return children;
}
```

#### Passo 2.4: Página de Login
Já fornecido em: [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md)

---

### FASE 3: CONFIGURAR BACKEND (4-8 horas)

#### Passo 3.1: Middleware JWT
Código completo em: [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md)

#### Passo 3.2: Rotas Protegidas
```typescript
// backend/src/routes/deals.ts
import { Router, Request } from 'express';
import { authMiddleware } from '../middleware/auth';
import { supabase } from '../services/supabase';

const router = Router();
router.use(authMiddleware);

// Listar deals
router.get('/deals', async (req: Request & { user: any }, res) => {
  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('organization_id', req.user.organization_id)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Criar deal
router.post('/deals', async (req: Request & { user: any }, res) => {
  const { stage, company, value, consultant_id, consultant_name } = req.body;

  const { data, error } = await supabase
    .from('deals')
    .insert({
      organization_id: req.user.organization_id,
      stage,
      company,
      value,
      consultant_id,
      consultant_name,
      consultant_initials: consultant_name.substring(0, 2).toUpperCase(),
      days_in_stage: 0,
      followup_status: 'ok',
      color: '#3B82F6'
    })
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

export default router;
```

#### Passo 3.3: Integração com Evolution API
```typescript
// backend/src/routes/evolution.ts
router.post('/webhook/messages', async (req, res) => {
  const { data } = req.body;

  // 1. Encontrar conversa
  let { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('contact_phone', data.sender)
    .single();

  if (!conversation) {
    // Criar nova conversa
    const { data: seller } = await supabase
      .from('seller_connections')
      .select('seller_id, organization_id')
      .eq('instance_name', data.instance)
      .single();

    const { data: newConv } = await supabase
      .from('conversations')
      .insert({
        seller_id: seller.seller_id,
        organization_id: seller.organization_id,
        contact_phone: data.sender,
        contact_name: data.senderName,
        status: 'open'
      })
      .select()
      .single();

    conversation = newConv;
  }

  // 2. Inserir mensagem
  await supabase
    .from('messages')
    .insert({
      conversation_id: conversation.id,
      seller_id: conversation.seller_id,
      organization_id: conversation.organization_id,
      sender_type: 'contact',
      sender_name: data.senderName,
      content: data.body,
      message_id: data.id,
      status: 'received'
    });

  // 3. Atualizar activity
  await supabase
    .from('seller_activity')
    .upsert({
      seller_id: conversation.seller_id,
      organization_id: conversation.organization_id,
      status: 'online',
      last_message_at: new Date()
    }, {
      onConflict: 'seller_id'
    });

  // 4. Disparar análise IA (background job)
  await triggerAIAnalysis(conversation.id);

  res.json({ success: true });
});
```

---

### FASE 4: TESTES (2-4 horas)

#### Teste 4.1: RLS - Segurança
```
1. Crear 2 usuários em orgs diferentes
2. User A fazer login
3. Tentar acessar dados de User B
4. ❌ Deve FALHAR
5. ✅ RLS está funcionando
```

#### Teste 4.2: Fluxo Completo
```
1. Fazer signup
2. Admin criar profile
3. Fazer login
4. Ver dashboard
5. Criar deal
6. Atualizar deal
7. Criar conversa manual
8. Enviar mensagem
9. Ver em kanban
```

#### Teste 4.3: Evolution Webhook
```
1. Conectar Evolution com Supabase
2. Enviar mensagem pelo WhatsApp
3. Verificar se criou conversa em BD
4. Verificar se appeared em dashboard
```

---

### FASE 5: PRODUÇÃO (1-2 horas)

#### Passo 5.1: Environment Variables
```bash
# .env.production
VITE_SUPABASE_URL=https://seu-projeto-prod.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=https://api.seu-app.com
```

#### Passo 5.2: Backup
```bash
# Configurar em Supabase Dashboard
Settings > Backups > Enable daily backups
```

#### Passo 5.3: Monitoramento
```bash
# Criar alertas para:
- Erros de RLS
- Falhas de autenticação
- Picos de uso
- Queries lentas
```

#### Passo 5.4: Cleanup
```sql
-- Remover dados de teste
DELETE FROM organizations 
WHERE name IN ('Tech Sales Corp', 'Digital Marketing Inc');

-- Verificar integridade
SELECT COUNT(*) FROM organizations;
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM sellers;
```

---

## 📊 TIMELINE RECOMENDADA

| Fase | Atividade | Tempo | Pessoas |
|------|-----------|-------|---------|
| 1 | Setup SQL | 30 min | 1 Dev |
| 2 | Frontend | 4h | 1 Dev Frontend |
| 3 | Backend | 8h | 1 Dev Backend |
| 4 | Testes | 4h | 2 QA |
| 5 | Deploy Pro | 2h | 1 DevOps |
| **TOTAL** | **Full Stack** | **~19h** | **5 dias** |

---

## ✅ CHECKLIST FINAL

- [ ] Schema criado e testado
- [ ] Test data inserido
- [ ] Frontend integrado
- [ ] Backend integrado
- [ ] Autenticação funcionando
- [ ] RLS validado
- [ ] Evolution conectado
- [ ] Todas as rotas testadas
- [ ] Variáveis de ambiente configuradas
- [ ] Backups habilitados
- [ ] Monitoramento ativo
- [ ] Team treinado

---

**Você está pronto para lançar!** 🚀
