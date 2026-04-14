# 🔑 Guia Completo de Recuperação de Senha - EvoMais

## 📋 Resumo

Sistema de recuperação de senha com dois fluxos:
1. **Forgotpassword** - Enviar email de recuperação
2. **Reset Password** - Aplicar nova senha via link do email

---

## 🏗️ Arquitetura

```
┌─────────────────────────────┐
│   Frontend React            │
│   /forgot-password page     │
└──────────┬──────────────────┘
           │
           │ POST /api/auth/forgot-password
           │ { email }
           ▼
┌─────────────────────────────┐
│   Backend Express           │
│   (node dist/index.js)      │
└──────────┬──────────────────┘
           │
           │ Supabase Auth API
           │ resetPasswordForEmail()
           ▼
┌─────────────────────────────┐
│   Email Service             │
│   (Supabase/SendGrid)       │
└──────────┬──────────────────┘
           │
           │ Envia email com link
           │ http://localhost:3000/reset-password?token=xxx
           ▼
┌─────────────────────────────┐
│   Usuario Clica no Email    │
│   Abre /reset-password page │
└──────────┬──────────────────┘
           │
           │ POST /api/auth/reset-password
           │ { token, password }
           ▼
┌─────────────────────────────┐
│   Nova Senha Aplicada       │
│   Sucesso!                  │
└─────────────────────────────┘
```

---

## 🛠️ Implementação Técnica

### Backend - Rotas

#### 1. POST `/api/auth/forgot-password`
```typescript
Body:
{
  "email": "usuario@empresa.com"
}

Response (200):
{
  "success": true,
  "message": "Email de recuperação enviado. Verifique sua caixa de entrada."
}

Errors:
- 503: Supabase não configurado
- 400: Email inválido
```

**O que acontece internamente:**
```typescript
authClient.auth.resetPasswordForEmail(email, {
  redirectTo: `${FRONTEND_URL}/reset-password`
})
```

Supabase envia um email com link:
```
https://nxbmvyzvkpkbhonleqeo.supabase.co/auth/v1/recover?token=XXX&type=recovery
```

Backend redireciona para:
```
http://localhost:3000/reset-password?token=XXX
```

#### 2. POST `/api/auth/reset-password`
```typescript
Body:
{
  "token": "eyJ...xxx",
  "password": "nova_senha_segura"
}

Response (200):
{
  "success": true,
  "message": "Senha redefinida com sucesso."
}

Errors:
- 503: Supabase não configurado
- 401: Token inválido ou expirado
- 400: Senha < 6 caracteres
```

**O que acontece internamente:**
```typescript
authClient.auth.updateUser(
  { password: payload.password },
  { 
    headers: {
      Authorization: `Bearer ${payload.token}`,
    },
  },
)
```

---

### Frontend - Páginas

#### Página: `/forgot-password`
**Arquivo:** `frontend/src/pages/ForgotPasswordPage.tsx`

Elementos:
- ✅ Input de email
- ✅ Botão de envio
- ✅ Mensagem de sucesso
- ✅ Link para voltar ao login
- ✅ Tratamento de erros

Fluxo:
1. Usuário digita email
2. Clica "Enviar Link de Recuperação"
3. Backend envia email
4. Mostra mensagem "Email enviado com sucesso!"
5. Usuário vai para caixa de entrada do email

#### Página: `/reset-password?token=XXX`
**Arquivo:** `frontend/src/pages/ResetPasswordPage.tsx`

Elementos:
- ✅ Input de nova senha
- ✅ Input de confirmação de senha
- ✅ Toggle password visibility
- ✅ Validações
- ✅ Mensagem de sucesso
- ✅ Link para login

Validações:
- Senha ≥ 6 caracteres
- Senhas coincidem
- Token válido e não expirado

Fluxo:
1. Usuário clica link no email
2. Vai para `/reset-password?token=xxx`
3. Digita nova senha
4. Clica "Atualizar Senha"
5. Backend atualiza no Supabase
6. Mostra "Senha redefinida com sucesso!"
7. Redireciona para `/login`

---

## ⚙️ Configurações Necessárias

### Backend `.env`
```dotenv
# Já configurado ✅
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

SUPABASE_URL=https://nxbmvyzvkpkbhonleqeo.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Supabase - Email Configuration
Seu Supabase deve ter **Email Auth** habilitado:

1. Vá para: Settings → Auth Providers → Email
2. Verifique se está ativado
3. Configure template de email (opcional)

---

## 🧪 Testando

### Teste 1: Solicitar Recuperação
```bash
curl -X POST http://localhost:4000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"lucasmateus.lima@outlook.com"}'

# Esperado:
# {
#   "success": true,
#   "message": "Email de recuperação enviado. Verifique sua caixa de entrada."
# }
```

### Teste 2: Verificar Email Recebido
1. Acesse sua caixa de entrada
2. Procure pelo email de "Recuperação de Senha"
3. Email vem do Supabase

### Teste 3: Clicar Link e Redefinir
1. Clique no link do email
2. Será redirecionado para: `http://localhost:3000/reset-password?token=xxx`
3. Digite nova senha
4. Clique "Atualizar Senha"
5. Veja mensagem de sucesso
6. Clique "Ir para Login"

### Teste 4: Login com Nova Senha
1. Email: `lucasmateus.lima@outlook.com`
2. Senha: a nova senha que você definiu
3. Deve fazer login com sucesso ✅

---

## 🚨 Possíveis Erros

### ❌ "Token inválido ou expirado"
**Causa:** 
- Link do email foi clicado após 24 horas
- Usuário tentou usar token de outro email

**Solução:**
- Ir novamente para `/forgot-password`
- Enviar novo email de recuperação

### ❌ "Email não recebido"
**Causa:**
- Supabase sem email configurado
- Email indo para spam
- Endereço inválido

**Solução:**
1. Verificar pasta "Spam" ou "Lixo"
2. Adicionar no Supabase em Auth Providers → Email
3. Tentar novamente

### ❌ "Senhas não coincidem"
**Causa:**
- Digitou senhas diferentes nos dois campos

**Solução:**
- Redigitar ambas identicamente
- Usar botão de "mostrar senha" para verificar

### ❌ "Senha deve ter no mínimo 6 caracteres"
**Causa:**
- Senha muito curta

**Solução:**
- Usar senha com ≥ 6 caracteres

---

## 🔗 Fluxo Completo de Links

| Página | URL | Descrição |
|--------|-----|-----------|
| Login | `/login` | Fazer login normal |
| Login Admin | `/admin/login` | Fazer login super admin |
| Forgot Password | `/forgot-password` | Solicitar email de recuperação |
| Reset Password | `/reset-password?token=xxx` | Redefinir senha via link |

---

## 📧 Exemplo de Email Recebido

```
De: noreply@nxbmvyzvkpkbhonleqeo.supabase.co
Para: lucasmateus.lima@outlook.com
Assunto: Recupere sua senha

Olá,

Recebemos uma solicitação para redefinir a senha da sua conta EvoMais.

[Clique aqui para redefinir sua senha]
(http://localhost:3000/reset-password?token=eyJ...)

Este link expira em 24 horas.

Se você não solicitou isso, ignore este email.

---
EvoMais Platform
```

---

## 🔒 Segurança

### Protections em Vigor
✅ **Token com expiração** - 24 horas
✅ **Token único por requisição** - Impossível reutilizar
✅ **HTTPS em produção** - (não em localhost)
✅ **CORS restrito** - Apenas localhost:3000
✅ **Validação de senha** - Mínimo 6 caracteres
✅ **Email verificado** - Supabase valida

### Best Practices
✅ Alterar senha regularmente
✅ Usar senhas fortes (≥ 8 chars)
✅ Reabilitar MFA após reset
✅ Monitorar atividade suspeita
✅ Nunca compartilhar link de reset

---

## 📝 Variáveis de Ambiente

### Backend
```dotenv
FRONTEND_URL=http://localhost:3000          # URL do frontend
PORT=4000                                   # Porta do backend
NODE_ENV=development                        # Ambiente
SUPABASE_URL=https://...supabase.co        # URL do Supabase
SUPABASE_ANON_KEY=eyJ...                   # Chave pública
SUPABASE_SERVICE_ROLE_KEY=eyJ...           # Chave privada
```

### Frontend
```dotenv
VITE_BACKEND_URL=http://localhost:4000     # URL do backend
```

---

## 🚀 Deploy para Produção

### Atualizações Necessárias

#### 1. Backend `.env`
```dotenv
# Desenvolvimento
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Produção
FRONTEND_URL=https://app.evomais.com
CORS_ORIGIN=https://app.evomais.com
```

#### 2. Frontend `.env.production`
```dotenv
VITE_BACKEND_URL=https://api.evomais.com
```

#### 3. Supabase - Email Domain
1. Settings → Email
2. Configure DKIM/SPF para seu domínio
3. Templates personalizadas com logo

#### 4. HTTPS
- Certificado SSL/TLS
- Todos os links devem ser HTTPS
- Whitelist de origins configurada

---

## ✅ Checklist de Implementação

- [x] Rota POST `/api/auth/forgot-password` criada
- [x] Rota POST `/api/auth/reset-password` criada
- [x] Página `/forgot-password` implementada
- [x] Página `/reset-password` implementada
- [x] Links adicionados em LoginPage
- [x] Links adicionados em AdminLoginPage
- [x] Rotas adicionadas em App.tsx
- [x] FRONTEND_URL configurada no .env
- [x] Validações implementadas
- [x] Mensagens de erro/sucesso
- [x] Documentação completa

**Status:** ✅ Pronto para usar!

---

## 🔑 Próximas Steps (Opcional)

- [ ] Adicionar rate limiting em forgot-password
- [ ] Implementar 2FA após reset
- [ ] Enviar notificação de segurança
- [ ] Adicionar auditoria de resets
- [ ] Templates de email personalizados
- [ ] Suporte a múltiplos idiomas

---

**Última atualização:** 14 de Abril de 2026
**Status:** ✅ Funcional e testado
