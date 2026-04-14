-- EVOMAIS - TEST DATA
-- Execute this AFTER complete_database_schema.sql
-- Use only in development!

-- ✅ Passo 1: Inserir Organizações
INSERT INTO organizations (id, name, email, phone, plan, status, max_users) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Tech Sales Corp', 'contato@techsales.com', '+55 11 99999-9999', 'pro', 'active', 20),
('550e8400-e29b-41d4-a716-446655440002', 'Digital Marketing Inc', 'info@digitalmarketing.com', '+55 21 88888-8888', 'basic', 'active', 10)
ON CONFLICT DO NOTHING;

-- ⚠️ IMPORTANTE: Profiles precisa de users em auth.users
-- Crie users MANUALMENTE no Supabase Dashboard > Authentication > Users
-- Depois execute este SQL para criar os profiles:
/*
INSERT INTO profiles (user_id, organization_id, name, email, role, status, phone) VALUES
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'João Vendedor', 'vendedor1@techsales.com', 'user', 'active', '+55 11 99999-0001'),
('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440001', 'Maria Sales', 'vendedor2@techsales.com', 'user', 'active', '+55 11 99999-0002'),
('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440001', 'Carlos Admin', 'admin1@techsales.com', 'admin', 'active', '+55 11 99999-0003'),
('550e8400-e29b-41d4-a716-446655440104', '550e8400-e29b-41d4-a716-446655440002', 'Ana Admin', 'admin2@digitalmarketing.com', 'admin', 'active', '+55 21 88888-0001')
ON CONFLICT DO NOTHING;
*/ 

INSERT INTO sellers (id, organization_id, name, email, phone, status) VALUES
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', 'João Silva', 'joao@techsales.com', '+55 11 998765432', 'active'),
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440001', 'Maria Santos', 'maria@techsales.com', '+55 11 987654321', 'active'),
('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440001', 'Pedro Costa', 'pedro@techsales.com', '+55 11 976543210', 'active'),
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440002', 'Ana Paulo', 'ana@digitalmarketing.com', '+55 21 987654321', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO seller_connections (id, seller_id, organization_id, name, phone, instance_name, status, api_provider) VALUES
('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', 'iPhone João', '+55 11 998765432', 'joao_vendedor', 'connected', 'evolution'),
('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440001', 'iPhone Maria', '+55 11 987654321', 'maria_vendedor', 'connected', 'evolution'),
('550e8400-e29b-41d4-a716-446655440501', '550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440002', 'iPhone Ana', '+55 21 987654321', 'ana_vendedor', 'disconnected', 'evolution')
ON CONFLICT DO NOTHING;

INSERT INTO conversations (id, organization_id, seller_id, contact_phone, contact_name, status, started_at) VALUES
('550e8400-e29b-41d4-a716-446655440601', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440201', '+55 11 912345678', 'Cliente ABC Ltda', 'open', NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440602', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440201', '+55 11 923456789', 'Empresa XYZ', 'closed', NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440603', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440202', '+55 11 934567890', 'Novo Cliente', 'open', NOW() - INTERVAL '2 days'),
('550e8400-e29b-41d4-a716-446655440701', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440301', '+55 21 912345678', 'Marketing Solutions Co', 'open', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

INSERT INTO messages (conversation_id, seller_id, organization_id, sender_type, sender_name, content, status, message_id, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440601', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', 'seller', 'João', 'Oi! Tudo bem? Gostaria de falar sobre nossos serviços?', 'delivered', 'msg_001', NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440601', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', 'contact', 'Cliente ABC', 'Olá! Sim, tenho interesse! Pode me enviar mais informações?', 'read', 'msg_002', NOW() - INTERVAL '4.9 days'),
('550e8400-e29b-41d4-a716-446655440601', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', 'seller', 'João', 'Perfeito! Vou enviar uma proposta. Qual é o melhor horário para conversar?', 'delivered', 'msg_003', NOW() - INTERVAL '4.8 days')
ON CONFLICT DO NOTHING;

INSERT INTO deals (organization_id, stage, company, value, consultant_id, consultant_name, consultant_initials, days_in_stage, followup_status, color, info, info_type) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'prospeccao', 'ABC Consultoria', 5000.00, 'joao_001', 'João Silva', 'JS', 5, 'ok', '#3B82F6', 'Contato inicial feito', 'info'),
('550e8400-e29b-41d4-a716-446655440001', 'qualificacao', 'XYZ Logística', 12000.00, 'joao_001', 'João Silva', 'JS', 8, 'amanhã', '#10B981', 'Reunião marcada para amanhã', 'success'),
('550e8400-e29b-41d4-a716-446655440001', 'proposta', 'Tech Solutions', 25000.00, 'maria_001', 'Maria Santos', 'MS', 3, 'ok', '#8B5CF6', 'Proposta enviada, aguardando feedback', 'info'),
('550e8400-e29b-41d4-a716-446655440001', 'negociacao', 'Enterprise Corp', 50000.00, 'maria_001', 'Maria Santos', 'MS', 2, 'hoje', '#F59E0B', 'Negociação em andamento', 'danger'),
('550e8400-e29b-41d4-a716-446655440001', 'fechamento', 'Global Industries', 100000.00, 'joao_001', 'João Silva', 'JS', 1, 'reunião', '#06B6D4', 'Última reunião para fechar', 'info'),
('550e8400-e29b-41d4-a716-446655440002', 'prospeccao', 'Marketing Plus', 3000.00, 'ana_001', 'Ana Paulo', 'AP', 2, 'ok', '#3B82F6', 'Contato inicial', 'info')
ON CONFLICT DO NOTHING;

-- ✅ DADOS DE TESTE INSERIDOS COM SUCESSO!

-- 📋 PRÓXIMOS PASSOS:
-- 1. Execute este script (test_data.sql)
-- 2. Crie usuários em: Supabase Dashboard > Authentication > Users
-- 3. Copie os UUIDs dos usuários criados
-- 4. Execute a parte comentada de PROFILES (substituindo os UUIDs)

-- 🔐 SEGURANÇA:
-- RLS está HABILITADO em todas as tabelas
-- Cada usuário verá APENAS dados da sua organização
