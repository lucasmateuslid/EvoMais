## 🔑 AUTENTICAÇÃO COMPLETA - GUIA PRÁTICO

### 1️⃣ COMO FUNCIONA A AUTENTICAÇÃO

```
┌─────────────────────────────────────────────────────────┐
│ USUÁRIO FOCA COMO CRIAR CONTA NO SUPABASE              │
├─────────────────────────────────────────────────────────┤
│ 1. Clica em "Criar Conta"                               │
│ 2. Entra email + senha                                   │
│ ↓                                                        │
│ auth.users é CRIADO automaticamente pelo Supabase       │
│ ↓                                                        │
│ 3. Admin precisa criar "profiles"                        │
│    (vinculando user_id com organization_id)             │
│ ↓                                                        │
│ 4. Usuário recebe JWT token                              │
│ 5. Frontend armazena token                               │
│ 6. TODOS os requests incluem o token                     │
│ 7. RLS verifica se usuário pode acessar dados           │
└─────────────────────────────────────────────────────────┘
```

### 2️⃣ FLUXO DE LOGIN PASSO A PASSO

#### Frontend - React
```typescript
// src/pages/LoginPage.tsx
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Fazer login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // 2. Obter profile do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (!profile) {
        throw new Error('Usuário ainda não foi configurado no sistema');
      }

      // 3. Armazenar info na store
      localStorage.setItem('user_org', profile.organization_id);
      
      // 4. Redirecionar para dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Erro no login:', error.message);
      alert('Falha no login: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
```

### 3️⃣ CRIAR NOVO USUÁRIO

#### Opção A: Via Supabase Dashboard (Mais fácil)
```
1. Supabase Dashboard
2. Authentication > Users
3. Clique "Add user"
4. Email e senha
5. Click "Create user"
6. Copy o UUID
```

#### Opção B: Via SQL (Backend)
```sql
-- Criar no auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  'novo@email.com',
  crypt('senha123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'novo@email.com')
RETURNING id;
```

#### Opção C: Via Frontend (Público)
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'novo@email.com',
  password: 'senha123',
  options: {
    data: {
      full_name: 'João Silva'
    }
  }
});

if (error) console.error('Erro:', error);
else console.log('Usuário criado:', data.user.id);
```

### 4️⃣ VINCULAR USUÁRIO À ORGANIZAÇÃO

```sql
-- Depois que o usuário é criado, execute:
INSERT INTO profiles (
  user_id,
  organization_id,
  name,
  email,
  role,
  status
)
VALUES (
  'abc123-def456-ghi789', -- UUID do auth.users
  '550e8400-e29b-41d4-a716-446655440001', -- Org ID
  'João Silva',
  'joao@empresa.com',
  'user', -- user, admin, viewer, super_admin
  'active'
);
```

### 5️⃣ ROLES E PERMISSÕES

**Role Hierarchy:**
```
super_admin
  ↓
  Pode: Criar orgs, gerenciar tudo
  Ver: TODAS organizações
  
admin
  ↓
  Pode: Gerenciar usuários da org, settings
  Ver: APENAS sua organização
  
user (Padrão)
  ↓
  Pode: CRM, vendas, conversar
  Ver: Dados da sua organização
  
viewer
  ↓
  Pode: Apenas ver dados
  Ver: Dados da sua organização (read-only)
```

**Trocar role de usuário:**
```sql
UPDATE profiles
SET role = 'admin'
WHERE user_id = 'uuid-do-usuario'
  AND organization_id = get_user_org();
```

### 6️⃣ LOGOUT

```typescript
// Frontend
const handleLogout = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem('user_org');
  window.location.href = '/login';
};
```

### 7️⃣ VERIFICAR SE ESTÁ LOGADO

```typescript
// React Hook
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se já está logado
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkUser();

    // Escutar mudanças
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  return { user, loading };
}
```

### 8️⃣ BACKEND - USAR SERVICE ROLE

```typescript
// backend/src/index.ts
import { createClient } from '@supabase/supabase-js';

// Service role tem acesso TOTAL (ignora RLS)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ Nunca exponha isso
);

// Exemplo: Backend criando usuário
app.post('/api/admin/create-user', async (req, res) => {
  // VERIFICAR se o request vem de um admin autenticado
  const user = req.user; // do middleware JWT
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Não autorizado' });
  }

  const { email, password, name, organization_id, role } = req.body;

  try {
    // Criar em auth.users com service role
    const { data: authUser, error: authError } = await supabase.auth.admin
      .createUser({
        email,
        password,
        email_confirm: true
      });

    if (authError) throw authError;

    // Criar em profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authUser.user.id,
        organization_id,
        name,
        email,
        role
      });

    if (profileError) throw profileError;

    res.json({
      message: 'Usuário criado com sucesso',
      user_id: authUser.user.id
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### 9️⃣ MIDDLEWARE - VERIFICAR TOKEN

```typescript
// backend/src/middleware/auth.ts
import jwt from 'jsonwebtoken';

export async function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token não encontrado' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET!);
    
    // Buscar profile do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', decoded.sub)
      .single();

    if (!profile) {
      return res.status(401).json({ error: 'Usuário não configurado' });
    }

    // Adicionar ao request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      organization_id: profile.organization_id,
      role: profile.role
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
}
```

### 🔟 RESET DE SENHA

```typescript
// Frontend - Solicitar reset
const { error } = await supabase.auth.resetPasswordForEmail(
  'usuario@email.com',
  {
    redirectTo: 'https://seu-app.com/reset-password'
  }
);

// Frontend - Completar reset
const { error: resetError } = await supabase.auth.updateUser({
  password: 'novaSenha123'
});
```

### 1️⃣1️⃣ 2FA (Two-Factor Authentication)

```typescript
// Habilitar 2FA
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp'
});

// QR Code
console.log(data.totp.qr_code);

// Verificar 2FA
const { data, error } = await supabase.auth.mfa.verify({
  factorId: 'factor_id',
  code: '000000'
});
```

### 1️⃣2️⃣ RENOVAR TOKEN

```typescript
// Quando token expirar
const { data: { session }, error } = await supabase.auth.refreshSession();

if (error) {
  // Fazer logout
  await supabase.auth.signOut();
  window.location.href = '/login';
}
```

---

## ⚠️ SEGURANÇA - CHECKLIST

✅ **Antes de ir para produção:**

- [ ] RLS habilitado em TODAS as tabelas
- [ ] Testar que usuário não vê dados de outra org
- [ ] Trocar anon key se foi exposta
- [ ] Service role key NUNCA no frontend
- [ ] 2FA habilitado para admins
- [ ] Audit logs sendo gravados
- [ ] Backup automático configurado
- [ ] Monitorar logins suspeitos
- [ ] Testar forgot password flow
- [ ] JWT expiration configurado

---

**Sua autenticação está segura e pronta para produção!** 🔒
