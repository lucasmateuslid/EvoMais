## 🚀 SETUP COMPLETO DO SUPABASE - EVOMAIS

Bem-vindo! Este documento contém tudo que você precisa para configurar seu banco de dados no Supabase com autenticação e gerenciamento de usuários.

### 📋 O QUE FOI CRIADO

Dois arquivos SQL foram gerados em `supabase/migrations/`:

1. **complete_database_schema.sql** (900+ linhas)
   - 13 tabelas completas
   - 40+ índices de performance
   - 50+ políticas de RLS (Row Level Security)
   - 3 funções de segurança
   - Sistema completo pronto para produção

2. **test_data.sql** (300+ linhas)
   - 2 organizações de exemplo
   - 4 usuários com diferentes roles
   - 4 vendedores
   - Conversas, mensagens e deals
   - Perfeito para testes iniciais

---

## 🔧 COMO EXECUTAR

### PASSO 1: Acessar Supabase

1. Abra [app.supabase.com](https://app.supabase.com)
2. Vá para seu projeto EvoMais
3. Clique em "SQL Editor" (ícone de database)

### PASSO 2: Executar o Schema

1. Clique em "New Query"
2. Copie TODO o conteúdo de `complete_database_schema.sql`
3. Cole no editor SQL
4. Clique em "Run" (ou Ctrl+Enter)
5. Aguarde a execução completar (~2-5 segundos)

### PASSO 3: Inserir Dados de Teste (Opcional)

1. Nova query
2. Copie TODO o conteúdo de `test_data.sql`
3. Cole e clique "Run"
4. Pronto! Suas tabelas estão populadas

---

## 📊 ESTRUTURA DO BANCO

### TABELAS PRINCIPAIS

| Tabela | Propósito | Chave Estrangeira |
|--------|-----------|-------------------|
| **organizations** | Empresas/Tenants | - |
| **profiles** | Usuários do sistema | auth.users, organizations |
| **sellers** | Vendedores/Equipes | organizations |
| **seller_connections** | Conexões WhatsApp | sellers, organizations |
| **conversations** | Conversas com clientes | sellers, organizations |
| **messages** | Mensagens de conversas | conversations, sellers |
| **deals** | Oportunidades de venda | organizations |
| **seller_activity** | Status dos vendedores | sellers, organizations |
| **seller_daily_stats** | Estatísticas diárias | sellers, organizations |
| **ai_analyses** | Análises de IA | conversations, sellers |
| **score_configs** | Configurações de scoring | organizations |
| **audit_logs** | Logs de auditoria | organizations |

### SEGURANÇA - RLS (Row Level Security)

✅ **Cada usuário vê APENAS dados da sua organização**

Exemplos:
```sql
-- Vendedor João vê APENAS deals de Tech Sales Corp
SELECT * FROM deals 
WHERE organization_id = get_user_org();

-- Admin da Digital Marketing vê APENAS usuários da Digital Marketing
SELECT * FROM profiles 
WHERE organization_id = get_user_org();
```

**3 Níveis de Acesso:**
- 👑 **super_admin**: Acesso a todas as organizações
- 🔐 **admin**: Gerencia usuários e configurações da sua org
- 👤 **user**: Acesso padrão ao CRM e vendas
- 👁️ **viewer**: Apenas leitura

---

## 🔐 AUTENTICAÇÃO

### Como Conectar no Frontend

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://seu-project.supabase.co',
  'sua-anon-key'
);

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@empresa.com',
  password: 'senha123'
});

// Obter dados do usuário
const user = data.user;
```

### Criar Usuário via Supabase Auth

1. Painel > Authentication > Users
2. "Add user" > Email/Password
3. Ele entra em `auth.users`
4. **Você ainda precisa criar o `profiles` record** para vinculá-lo à organização

```sql
-- Exemplo: Criar profile para novo usuário
INSERT INTO profiles (
  user_id, 
  organization_id, 
  name, 
  email, 
  role
) VALUES (
  'uuid-do-usuario-criado', 
  '550e8400-e29b-41d4-a716-446655440001',
  'João Silva',
  'joao@techsales.com',
  'user'
);
```

---

## 📱 FLUXO PRINCIPAL

```
1. Usuário cria conta (Supabase Auth)
2. É criado em auth.users
3. Admin manual cria profiles + org
4. Vendedores recebem conexões WhatsApp
5. Conversas começam
6. IA analisa (opcional)
7. Dados aparecem em deals/kanban
8. Relatorios/estatísticas geradas
```

---

## 🚨 IMPORTANTE

### ❌ NUNCA FAZER EM PRODUÇÃO

- ❌ Executar test_data.sql em banco real de clientes
- ❌ Resetar a database sem backup
- ❌ Compartilhar a "Service Role Key"
- ❌ Desabilitar RLS
- ❌ Usar anon key para operações sensíveis

### ✅ RECOMENDAÇÕES

- ✅ Manter backups semanais
- ✅ Testar migrations em staging antes
- ✅ Monitorar audit_logs regularmente
- ✅ Usar service role apenas no backend
- ✅ Implementar 2FA para admin accounts

---

## 🐛 TROUBLESHOOTING

### Erro: "Permission denied"
**Solução**: Verifique RLS policies - usuário está em `auth.users` mas sem profile

### Erro: "Relation does not exist"
**Solução**: Rode `complete_database_schema.sql` novamente

### Dados não aparecem após INSERT
**Solução**: RLS pode estar bloqueando. Verifique:
```sql
SELECT * FROM profiles WHERE user_id = auth.uid();
```

### Performance lenta em conversas
**Solução**: Índices já estão criados. Considere:
```sql
-- Verificar queries lentas
EXPLAIN ANALYZE 
SELECT * FROM messages 
WHERE conversation_id = 'xxx' 
ORDER BY created_at DESC;
```

---

## 📞 SUPORTE

Qualquer dúvida sobre:
- **Setup**: Abra issue no GitHub
- **Supabase**: Docs em [supabase.com/docs](https://supabase.com/docs)
- **RLS**: [RLS Guide - Supabase](https://supabase.com/docs/guides/auth/row-level-security)
- **PostgreSQL**: [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## ✅ CHECKLIST PÓS-SETUP

- [x] Executei `complete_database_schema.sql`
- [ ] Criei primeira organização
- [ ] Criei usuários de teste
- [ ] Testei login no frontend
- [ ] Inseri dados via API
- [ ] Testei RLS (usuário vê apenas seus dados)
- [ ] Conectei primeira configuração Evolution
- [ ] Recebi primeira conversa WhatsApp
- [ ] IA analisou conversas
- [ ] Deal apareceu no kanban

---

**Seu banco está 100% pronto para produção!** 🎉
