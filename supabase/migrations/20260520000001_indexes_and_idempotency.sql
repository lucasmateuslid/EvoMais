-- ============================================================
-- Critical indexes and webhook idempotency
-- (schema-safe: only references columns that exist today)
-- ============================================================

-- conversations: schema real usa contact_phone (não remote_jid)
create index if not exists idx_conversations_organization_id
  on conversations (organization_id);

create index if not exists idx_conversations_org_contact_phone
  on conversations (organization_id, contact_phone);

create index if not exists idx_conversations_last_message_at
  on conversations (organization_id, last_message_at desc nulls last);

-- messages
create index if not exists idx_messages_conversation_id
  on messages (conversation_id);

create index if not exists idx_messages_created_at
  on messages (created_at desc);

create index if not exists idx_messages_message_id
  on messages (message_id);

create index if not exists idx_messages_conversation_created_at
  on messages (conversation_id, created_at desc);

-- sellers
create index if not exists idx_sellers_organization_id
  on sellers (organization_id);

-- connections
create index if not exists idx_connections_organization_id
  on connections (organization_id);

create index if not exists idx_connections_instance_name
  on connections (instance_name);

-- evolution_instances
create index if not exists idx_evolution_instances_organization_id
  on evolution_instances (organization_id);

create index if not exists idx_evolution_instances_instance_name
  on evolution_instances (instance_name);

-- evolution_messages (essa tabela TEM remote_jid e instance_name)
create index if not exists idx_evolution_messages_organization_id
  on evolution_messages (organization_id);

create index if not exists idx_evolution_messages_instance_name
  on evolution_messages (instance_name);

create index if not exists idx_evolution_messages_remote_jid
  on evolution_messages (remote_jid);

-- webhook_logs: adicionar colunas que o backend espera
create index if not exists idx_webhook_logs_created_at
  on webhook_logs (created_at desc);

alter table webhook_logs
  add column if not exists idempotency_key text,
  add column if not exists instance_name text,
  add column if not exists message_id text;

create unique index if not exists idx_webhook_logs_idempotency_key
  on webhook_logs (idempotency_key)
  where idempotency_key is not null;
