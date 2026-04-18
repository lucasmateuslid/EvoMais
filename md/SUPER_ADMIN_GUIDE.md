# 🚀 Guia para Acessar como Super Admin - EvoMais

## ✅ Checklist: O que foi feito

- [x] SUPABASE_ANON_KEY configurada no backend `.env`
- [x] Rota `/api/auth/super-admin/login` criada no backend
- [x] Página AdminLoginPage.tsx atualizada para usar o backend
- [x] Documento RLS explicado detalhadamente em [RLS_CONFIGURATION.md](./RLS_CONFIGURATION.md)
- [x] Perfil super_admin criado no SQL (você executou)

---

## 🔐 Passo 1: Verificar se o Super Admin foi criado

Ir no **Supabase Console** → **SQL Editor** e executar:

```sql
SELECT user_id, role, email, organization_id FROM profiles WHERE email = 'lucasmateus.lima@outlook.com';
```

**Esperado:**
```
user_id              | role       | email                          | organization_id
─────────────────────┼────────────┼────────────────────────────────┼─────────────────
abc123de-f456-789...  | super_admin | lucasmateus.lima@outlook.com  | xyz789ab-c012-345...
```

Se não aparecer, execute este SQL novamente:
```sql
WITH org AS (
  INSERT INTO organizations (name, email, status, plan, max_users)
  VALUES ('EvoMais Platform', 'lucasmateus.lima@outlook.com', 'active', 'enterprise', 999)
  RETURNING id
),
usr AS (
  SELECT id FROM auth.users WHERE email = 'lucasmateus.lima@outlook.com' LIMIT 1
)
INSERT INTO profiles (user_id, organization_id, role, name, email, status)
SELECT usr.id, org.id, 'super_admin', 'Lucas Mateus Lima', 'lucasmateus.lima@outlook.com', 'active'
FROM usr, org
ON CONFLICT (user_id) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  role = EXCLUDED.role,
  updated_at = NOW();
```

---

## 🌐 Passo 2: Iniciar o Backend e Frontend

### Terminal 1 - Backend
```bash
wsl -d Debian bash -c "cd /home/lucas/EvoMais/backend && npm run dev"
```

**Esperado:**
```
listening on 4000
```

### Terminal 2 - Frontend
```bash
wsl -d Debian bash -c "cd /home/lucas/EvoMais/frontend && npm run dev"
```

**Esperado:**
```
➜  Local:   http://localhost:3000/
```

---

## 🔓 Passo 3: Acessar o Painel Super Admin

1. Abra [`http://localhost:3000/admin`](http://localhost:3000/admin) no navegador
2. Você verá a página "Painel Super Admin"
3. Preencha:
   - **Email:** `lucasmateus.lima@outlook.com`
   - **Senha:** A senha que você configurou no Supabase

4. Clique em **"Acessar Painel"**

---

## ✨ Passo 4: Login Normal (Organização)

Para testar o login normal (como usuário regular da organização):

1. Abra [`http://localhost:3000`](http://localhost:3000)
2. Preencha:
   - **Email:** `lucasmateus.lima@outlook.com`
   - **Senha:** A mesma senha

3. Clique em **"Sign In"**

---

## 🧪 Testando RLS Policies

Depois de fazer login, vamos testar se o isolamento de dados está funcionando:

### Teste 1: Listar Organizações (Super Admin)
```bash
# Login como super admin (seu token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/crm/deals

# Esperado: Retorna dados da sua org (EvoMais Platform)
```

### Teste 2: Criar um Novo Usuário (Super Admin)
```bash
POST /api/team/members/invite
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "email": "novo.usuario@evomais.com",
  "name": "Novo Usuário",
  "role": "user"
}
```

---

## 🛠️ Configurações de Segurança

### `.env` - Backend (já configurado ✅)
```dotenv
VITE_BACKEND_URL=http://localhost:4000
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

SUPABASE_URL=https://nxbmvyzvkpkbhonleqeo.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### `.env` - Frontend (já configurado ✅)
```dotenv
VITE_BACKEND_URL=http://localhost:4000
```

---

## 🚨 Possíveis Erros

### ❌ "Supabase backend auth is not configured"
- **Solução:** Verifique se `SUPABASE_ANON_KEY` está no `.env` do backend
- Reinicie: `npm run dev`

### ❌ "Only super admins can access this endpoint"
- **Solução:** Seu usuário não tem `role = 'super_admin'`
- Execute SQL para verificar: `SELECT role FROM profiles WHERE email = 'lucasmateus.lima@outlook.com';`
- Se role ≠ `super_admin`, use SQL para corrigir

### ❌ CORS error (Access-Control-Allow-Origin)
- **Solução:** Verifique `CORS_ORIGIN=http://localhost:3000` no `.env`
- Reinicie o backend

### ❌ "Credenciais inválidas"
- **Solução:** Verifique senha no Supabase Console
- Pode estar com espaços extras ou incorreta

---

## 📊 Autenticação Explicada

```
┌─────────────────────┐
│   Frontend React    │
│   localhost:5173    │
└──────────┬──────────┘
           │
           │ POST /api/auth/super-admin/login
           │ {email, password}
           ▼
┌──────────────────────┐
│  Backend Express     │
│  localhost:4000      │
└──────────┬───────────┘
           │
           │ Supabase auth.signInWithPassword()
           ▼
┌──────────────────────┐
│  Supabase Auth       │
│  (PostgreSQL)        │
└──────────┬───────────┘
           │ Se OK:
           │ - Retorna session.access_token
           │ - Backend valida: role = 'super_admin'?
           ▼
┌──────────────────────┐
│   JWT Token + Profile│
│   Armazenado local   │
└──────────────────────┘
           │
           ▼ Próximas requisições
┌──────────────────────┐
│ GET /api/team/members│
│ Header: Authorization│
│ Bearer YOUR_TOKEN    │
└──────────────────────┘
```

---

## 📝 URLs Importantes

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/auth/login` | POST | Login normal (qualquer usuário) |
| `/api/auth/super-admin/login` | POST | Login super admin (apenas super_admin) |
| `/api/auth/me` | GET | Verificar autenticação |
| `/api/auth/logout` | POST | Fazer logout |
| `/api/team/members` | GET | Listar usuários (super admin) |
| `/api/team/members/invite` | POST | Convidar usuário (super admin) |
| `/api/crm/deals` | GET | Listar deals (usuário org) |

---

## 🔑 Próximas Steps

- [ ] Testar login super admin
- [ ] Testar login normal
- [ ] Criar novo usuário via `/api/team/members/invite`
- [ ] Verificar isolamento de dados (RLS)
- [ ] Configurar MFA no Supabase
- [ ] Implementar refresh token (JWT)
- [ ] Adicionar logout e session management

---

**Status:** ✅ Configuração completa
**Última atualização:** 14 de Abril de 2026
**Próxima etapa:** [Testar login](#-passo-3-acessar-o-painel-super-admin)
