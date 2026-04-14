# 🔐 Configuração de RLS (Row Level Security) - EvoMais

## Resumo Executivo

O sistema usa **Row Level Security (RLS)** do Supabase para garantir isolamento de dados entre organizações e controlar acesso baseado em roles.

---

## 📊 Arquitetura

### Tabelas com RLS Habilitado
```sql
-- 13 tabelas protegidas por RLS:
- organizations
- profiles
- sellers
- seller_connections
- connections
- conversations
- messages
- seller_activity
- seller_daily_stats
- ai_analyses
- score_configs
- deals
- audit_logs
```

### Funções de Segurança

#### 1. `get_user_org()` - Obtém organização do usuário
```sql
SELECT organization_id 
FROM profiles 
WHERE user_id = auth.uid() 
LIMIT 1;
```
**Uso:** Filtra dados por organização automaticamente

#### 2. `is_super_admin()` - Verifica se é super admin
```sql
SELECT EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() AND role = 'super_admin'
);
```
**Uso:** Permite super admin acessar dados de qualquer organização

#### 3. `is_org_admin(org_id UUID)` - Verifica se é admin da org
```sql
SELECT EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
    AND organization_id = org_id 
    AND role IN ('admin', 'super_admin')
);
```
**Uso:** Permite admin gerenciar sua organização

---

## 🛡️ Políticas de Acesso por Tabela

### ORGANIZATIONS
| Ação | Regra |
|------|------|
| **SELECT** | Cada usuário vê sua org + super admin vê todas |
| **UPDATE** | Apenas super admin |
| **DELETE** | Apenas super admin |
| **INSERT** | Apenas super admin |

**Exemplo:**
```sql
-- Usuário normal vê apenas sua org
SELECT * FROM organizations;
-- ↓ Retorna: organização_id do usuário

-- Super admin vê todas as orgs
SELECT * FROM organizations;
-- ↓ Retorna: todas as organizações
```

### PROFILES
| Ação | Regra |
|------|------|
| **SELECT** | Usuários veem perfis de sua org + super admin vê todos |
| **UPDATE** | Apenas o próprio perfil ou admin da org |
| **INSERT** | Admin da org ou super admin |
| **DELETE** | Admin da org ou super admin |

**Exemplo:**
```sql
-- Usuário normal vê perfis de sua org
SELECT * FROM profiles;
-- ↓ Retorna: perfis da mesma organização

-- Admin pode criar novos perfis em sua org
INSERT INTO profiles (user_id, organization_id, role, name, email, status)
VALUES (...);
-- ↓ Funciona se organization_id = organização do admin
```

### SELLERS
| Ação | Regra |
|------|------|
| **SELECT** | Usuários veem vendedores de sua org + super admin vê todos |
| **INSERT** | Podem criar vendedores em sua org |
| **UPDATE** | Podem atualizar vendedores de sua org |
| **DELETE** | Podem deletar vendedores de sua org |

### CONNECTIONS, CONVERSATIONS, MESSAGES
| Ação | Regra |
|------|------|
| **SELECT** | Filtra por `organization_id = get_user_org()` |
| **INSERT** | Valida `organization_id` do usuário |
| **UPDATE** | Apenas registros da org do usuário |
| **DELETE** | Apenas registros da org do usuário |

### AI_ANALYSES, DEALS, SCORE_CONFIGS
| Ação | Regra |
|------|------|
| **SELECT** | Filtra por `organization_id = get_user_org()` |
| **INSERT** | Valida `organization_id` do usuário |
| **UPDATE** | Apenas registros da org do usuário |
| **DELETE** | Apenas registros da org do usuário |

---

## 👥 Roles do Sistema

### 1. `super_admin` - Gerenciador de Plataforma
- ✅ Acessa **todas** as organizações
- ✅ Cria/edita/deleta organizações
- ✅ Gerencia usuários de qualquer org
- ✅ Visualiza relatórios globais
- ❌ **Não é criado via API** - apenas via SQL manual

### 2. `admin` - Gerenciador da Organização
- ✅ Gerencia usuários **de sua org**
- ✅ Cria/edita/deleta dados de sua org
- ✅ Convida novos usuários
- ❌ Não pode acessar outras orgs
- ❌ Não pode deletar a org

### 3. `user` - Usuário Regular
- ✅ Cria/edita dados de sua org
- ✅ Acessa vendedores/conexões/conversas
- ❌ Não pode gerenciar usuários
- ❌ Não pode editar configurações

### 4. `viewer` - Consultor/Leitor
- ✅ Apenas visualiza dados de sua org
- ✅ Sem acesso a criar/editar/deletar
- ❌ Somente leitura

---

## 🔄 Fluxo de Autorização

```
Usuário faz query → RLS Policy ativa
                   ↓
        ┌──────────────────────┐
        │ É super_admin()?     │
        └──────────────────────┘
           ✓ SIM → Sem filtro
           ✗ NÃO ↓
        Filtra por organization_id = get_user_org()
```

---

## 📝 SQL para Criar Super Admin

```sql
-- Passo 1: Criar user em auth.users (Supabase Console)
-- Email: lucasmateus.lima@outlook.com
-- Password: <sua_senha>

-- Passo 2: Link user com organization + role super_admin
WITH org AS (
  INSERT INTO organizations (
    name, email, status, plan, max_users
  )
  VALUES (
    'EvoMais Platform',
    'lucasmateus.lima@outlook.com',
    'active',
    'enterprise',
    999
  )
  RETURNING id
),
usr AS (
  SELECT id FROM auth.users WHERE email = 'lucasmateus.lima@outlook.com' LIMIT 1
)
INSERT INTO profiles (
  user_id, organization_id, role, name, email, status
)
SELECT usr.id, org.id, 'super_admin', 'Lucas Mateus Lima', 'lucasmateus.lima@outlook.com', 'active'
FROM usr, org
ON CONFLICT (user_id) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  role = EXCLUDED.role,
  updated_at = NOW();
```

---

## 🧪 Testando RLS

### Teste 1: Usuário normal não vê outras orgs
```sql
-- Login como user_a (org_1)
SELECT * FROM organizations;
-- ✅ Esperado: Apenas org_1

-- Tentar deletar org_1
DELETE FROM organizations WHERE id = 'org_1';
-- ❌ Esperado: ERROR - RLS policy violation
```

### Teste 2: Super admin vê todas as orgs
```sql
-- Login como super_admin
SELECT * FROM organizations;
-- ✅ Esperado: Todas as orgs

-- Super admin pode deletar
DELETE FROM organizations WHERE id = 'org_1';
-- ✅ Esperado: Sucesso
```

### Teste 3: Admin pode criar usuários em sua org
```sql
-- Login como admin (org_1)
INSERT INTO profiles (
  user_id, organization_id, role, name, email, status
)
VALUES (
  'new_user_id',
  'org_1',
  'user',
  'Novo Usuário',
  'novo@org1.com',
  'active'
);
-- ✅ Esperado: Sucesso

-- Tentar criar usuário em org_2
INSERT INTO profiles (
  user_id, organization_id, role, name, email, status
)
VALUES (
  'another_user_id',
  'org_2',
  'user',
  'Outro Usuário',
  'outro@org2.com',
  'active'
);
-- ❌ Esperado: ERROR - RLS policy violation
```

---

## 🚀 Endpoints de Login

### Login Normal (qualquer usuário)
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@org.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "accessToken": "eyJ...",
  "user": { "id": "uuid", "email": "..." },
  "profile": { "role": "user", "organization_id": "org_id", ... }
}
```

### Login Super Admin (apenas super_admin)
```bash
POST /api/auth/super-admin/login
Content-Type: application/json

{
  "email": "super@admin.com",
  "password": "senha123"
}
```

**Resposta:** Idêntico, mas com `role: "super_admin"`

**Erro se não for super_admin:**
```json
{
  "error": "forbidden",
  "message": "Only super admins can access this endpoint."
}
```

---

## 🔒 Segurança

### Por que `super_admin` não é criado via API?
1. **Prevenção de escalação de privilégio** - Impossível elevar acesso via API
2. **Auditoria** - Criação manual deixa rastro em logs de admin
3. **Controle** - Apenas você (admin da plataforma) pode criar
4. **Segurança** - Não há endpoint público para provisionar admin

### Best Practices
✅ Alterar senha do super admin regularmente
✅ Usar MFA (Multi-Factor Authentication) no Supabase
✅ Monitorar logs de acesso a dados sensíveis
✅ Fazer backup das chaves (SUPABASE_SERVICE_ROLE_KEY)
✅ Rotacionar credenciais periodicamente

---

## 📋 Checklist de Configuração Inicial

- [x] RLS habilitado em 13 tabelas
- [x] Funções de segurança criadas (get_user_org, is_super_admin, is_org_admin)
- [x] Políticas de acesso configuradas
- [x] SQL para criar super_admin pronto
- [x] Endpoint `/api/auth/super-admin/login` implementado
- [ ] Super admin criado comSQL
- [ ] Login testado no frontend
- [ ] Monitoramento de RLS policies

---

## 📞 Suporte

Se receber erro `Supabase backend auth is not configured`:
- Verifique `SUPABASE_URL` no `.env`
- Verifique `SUPABASE_ANON_KEY` no `.env`
- Verifique `SUPABASE_SERVICE_ROLE_KEY` no `.env`
- Reinicie o backend com `npm run dev`

---

**Última atualização:** 14 de Abril de 2026
