## 📖 RÁPIDA REFERÊNCIA - COMANDOS SQL ÚTEIS

### 🔍 QUERIES ÚTEIS

#### Ver todas as organizações
```sql
SELECT id, name, email, plan, status FROM organizations;
```

#### Ver usuários de uma organização
```sql
SELECT p.name, p.email, p.role, p.status, o.name as org
FROM profiles p
JOIN organizations o ON p.organization_id = o.id
WHERE o.id = '550e8400-e29b-41d4-a716-446655440001';
```

#### Ver conversas abertas
```sql
SELECT 
  c.id, 
  s.name as vendedor, 
  c.contact_name as cliente,
  c.contact_phone,
  COUNT(m.id) as total_mensagens,
  MAX(m.created_at) as ultima_mensagem
FROM conversations c
LEFT JOIN sellers s ON c.seller_id = s.id
LEFT JOIN messages m ON c.id = m.conversation_id
WHERE c.status = 'open'
  AND c.organization_id = get_user_org()
GROUP BY c.id, s.name, c.contact_name, c.contact_phone
ORDER BY MAX(m.created_at) DESC;
```

#### Dashboard de vendedores
```sql
SELECT 
  s.name,
  COUNT(DISTINCT c.id) as conversas,
  COUNT(DISTINCT m.id) as mensagens,
  COUNT(DISTINCT d.id) as oportunidades,
  SUM(d.value) as valor_total,
  sa.status
FROM sellers s
LEFT JOIN conversations c ON s.id = c.seller_id
LEFT JOIN messages m ON s.id = m.seller_id
LEFT JOIN deals d ON d.consultant_id = s.id::text
LEFT JOIN seller_activity sa ON s.id = sa.seller_id
WHERE s.organization_id = get_user_org()
GROUP BY s.name, sa.status;
```

#### Deals por estágio
```sql
SELECT 
  stage,
  COUNT(*) as quantidade,
  SUM(value) as valor_total,
  AVG(value) as valor_medio,
  AVG(days_in_stage) as dias_medio
FROM deals
WHERE organization_id = get_user_org()
GROUP BY stage
ORDER BY 
  CASE stage
    WHEN 'prospeccao' THEN 1
    WHEN 'qualificacao' THEN 2
    WHEN 'proposta' THEN 3
    WHEN 'negociacao' THEN 4
    WHEN 'fechamento' THEN 5
  END;
```

#### Atividades recentes
```sql
SELECT 
  table_name,
  operation,
  created_at,
  new_values::text
FROM audit_logs
WHERE organization_id = get_user_org()
ORDER BY created_at DESC
LIMIT 20;
```

---

### ➕ INSERIR DADOS

#### Criar nova organização
```sql
INSERT INTO organizations (name, email, phone, plan, status, max_users)
VALUES (
  'Nova Empresa',
  'contato@novaempresa.com',
  '+55 11 99999-9999',
  'pro',
  'active',
  15
)
RETURNING id, name, email;
```

#### Criar novo vendedor
```sql
INSERT INTO sellers (organization_id, name, email, phone, status)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Novo Vendedor',
  'vendedor@empresa.com',
  '+55 11 987654321',
  'active'
)
RETURNING id, name, email;
```

#### Criar novo deal
```sql
INSERT INTO deals (
  organization_id,
  stage,
  company,
  value,
  consultant_id,
  consultant_name,
  consultant_initials,
  days_in_stage,
  followup_status,
  color
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'prospeccao',
  'Empresa XYZ',
  15000.00,
  'vendedor_001',
  'João Silva',
  'JS',
  0,
  'ok',
  '#3B82F6'
)
RETURNING id;
```

#### Registrar nova conversa
```sql
INSERT INTO conversations (
  organization_id,
  seller_id,
  contact_phone,
  contact_name,
  status,
  started_at
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440201',
  '+55 11 912345678',
  'Novo Cliente',
  'open',
  NOW()
)
RETURNING id;
```

---

### ✏️ ATUALIZAR DADOS

#### Atualizar status do deal
```sql
UPDATE deals
SET 
  stage = 'negociacao',
  days_in_stage = 3,
  updated_at = NOW()
WHERE id = 'seu-deal-id'
  AND organization_id = get_user_org();
```

#### Marcar conversa como encerrada
```sql
UPDATE conversations
SET 
  status = 'closed',
  updated_at = NOW()
WHERE id = 'sua-conversa-id'
  AND organization_id = get_user_org();
```

#### Atualizar perfil do usuário
```sql
UPDATE profiles
SET 
  name = 'Novo Nome',
  phone = '+55 11 98765-4321',
  updated_at = NOW()
WHERE user_id = auth.uid();
```

#### Atualizar atividade do vendedor
```sql
UPDATE seller_activity
SET 
  status = 'online',
  last_message_at = NOW(),
  is_idle = false,
  updated_at = NOW()
WHERE seller_id = 'seu-vendedor-id'
  AND organization_id = get_user_org();
```

---

### 🗑️ DELETAR DADOS

#### Deletar deal
```sql
DELETE FROM deals
WHERE id = 'seu-deal-id'
  AND organization_id = get_user_org();
```

#### Deletar conversa (deleta todas as mensagens também)
```sql
DELETE FROM conversations
WHERE id = 'sua-conversa-id'
  AND organization_id = get_user_org();
```

#### Deletar vendedor (deleta conversas, msgs, stats)
```sql
DELETE FROM sellers
WHERE id = 'seu-vendedor-id'
  AND organization_id = get_user_org();
```

---

### 🔐 VERIFICAÇÕES DE SEGURANÇA

#### Ver função auxiliar atual
```sql
SELECT get_user_org() as minha_organizacao;
```

#### Verificar se é super_admin
```sql
SELECT is_super_admin() as sou_super_admin;
```

#### Verificar se é admin de uma org
```sql
SELECT is_org_admin('550e8400-e29b-41d4-a716-446655440001') as sou_admin;
```

#### Ver meu usuário atual
```sql
SELECT 
  auth.uid() as meu_id,
  current_user,
  current_timestamp;
```

---

### 📊 AGREGAÇÕES & RELATÓRIOS

#### Taxa de conversão por vendedor
```sql
SELECT 
  s.name,
  COUNT(DISTINCT c.id) as total_conversas,
  COUNT(DISTINCT CASE WHEN d.id IS NOT NULL THEN c.id END) as conversas_com_deal,
  ROUND(
    COUNT(DISTINCT CASE WHEN d.id IS NOT NULL THEN c.id END)::numeric / 
    NULLIF(COUNT(DISTINCT c.id), 0) * 100, 
    2
  ) as taxa_conversao_pct
FROM sellers s
LEFT JOIN conversations c ON s.id = c.seller_id
LEFT JOIN deals d ON d.consultant_id = s.id::text
WHERE s.organization_id = get_user_org()
GROUP BY s.name;
```

#### Valor em aberto por estágio
```sql
SELECT 
  stage,
  COUNT(*) as deals,
  SUM(value) as valor_aberto,
  ROUND(AVG(value), 2) as valor_medio
FROM deals
WHERE organization_id = get_user_org()
  AND followup_status NOT IN ('fechado', 'perdido')
GROUP BY stage
ORDER BY valor_aberto DESC;
```

#### Top 5 oportunidades
```sql
SELECT 
  company,
  value,
  stage,
  consultant_name,
  created_at
FROM deals
WHERE organization_id = get_user_org()
ORDER BY value DESC
LIMIT 5;
```

---

### 🔄 MANUTENÇÃO

#### Atualizar timestamps de todas as conversas
```sql
UPDATE conversations
SET updated_at = NOW()
WHERE organization_id = get_user_org();
```

#### Recalcular estatísticas de um vendedor
```sql
INSERT INTO seller_daily_stats (
  seller_id,
  organization_id,
  date,
  total_messages,
  total_conversations
)
SELECT 
  m.seller_id,
  m.organization_id,
  DATE(m.created_at),
  COUNT(*),
  COUNT(DISTINCT m.conversation_id)
FROM messages m
WHERE m.seller_id = 'seu-vendedor-id'
GROUP BY m.seller_id, m.organization_id, DATE(m.created_at)
ON CONFLICT (seller_id, date) DO UPDATE SET
  total_messages = EXCLUDED.total_messages,
  total_conversations = EXCLUDED.total_conversations;
```

#### Listar índices da tabela
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'deals';
```

**Tudo que você precisa para trabalhar com o Supabase!** 💪
