-- ============================================================
-- Tabelas operacionais: webhook_logs, ai_analysis_jobs, evolution_messages
-- ============================================================

-- ----------------------------
-- webhook_logs
-- ----------------------------
CREATE TABLE IF NOT EXISTS webhook_logs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID       REFERENCES organizations(id) ON DELETE SET NULL,
  source         TEXT        NOT NULL DEFAULT 'evolution',
  event_type     TEXT        NOT NULL DEFAULT 'unknown',
  payload        JSONB,
  status         TEXT        NOT NULL DEFAULT 'received'
                             CHECK (status IN ('received', 'processed', 'failed', 'dead')),
  error_message  TEXT,
  processed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS webhook_logs_org_idx       ON webhook_logs(organization_id);
CREATE INDEX IF NOT EXISTS webhook_logs_status_idx    ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS webhook_logs_created_idx   ON webhook_logs(created_at DESC);

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS; authenticated users see their tenant
CREATE POLICY "service_role bypass webhook_logs"
  ON webhook_logs
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "users read own org webhook_logs"
  ON webhook_logs FOR SELECT
  USING (organization_id = get_user_org());

-- ----------------------------
-- ai_analysis_jobs
-- ----------------------------
CREATE TABLE IF NOT EXISTS ai_analysis_jobs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID        REFERENCES conversations(id) ON DELETE SET NULL,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'running', 'done', 'failed')),
  provider        TEXT,
  request         JSONB,
  response_text   TEXT,
  error           TEXT,
  latency_ms      INT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ai_jobs_org_idx     ON ai_analysis_jobs(organization_id);
CREATE INDEX IF NOT EXISTS ai_jobs_status_idx  ON ai_analysis_jobs(status);
CREATE INDEX IF NOT EXISTS ai_jobs_created_idx ON ai_analysis_jobs(created_at DESC);

ALTER TABLE ai_analysis_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role bypass ai_analysis_jobs"
  ON ai_analysis_jobs
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "users read own org ai_analysis_jobs"
  ON ai_analysis_jobs FOR SELECT
  USING (organization_id = get_user_org());

-- ----------------------------
-- evolution_messages
-- ----------------------------
CREATE TABLE IF NOT EXISTS evolution_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        REFERENCES organizations(id) ON DELETE CASCADE,
  instance_name   TEXT        NOT NULL,
  remote_jid      TEXT        NOT NULL,
  message_id      TEXT        UNIQUE,
  direction       TEXT        NOT NULL DEFAULT 'inbound'
                              CHECK (direction IN ('inbound', 'outbound')),
  content         TEXT,
  media_url       TEXT,
  status          TEXT        NOT NULL DEFAULT 'delivered'
                              CHECK (status IN ('pending', 'delivered', 'read', 'failed')),
  raw_payload     JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS evo_msg_org_idx      ON evolution_messages(organization_id);
CREATE INDEX IF NOT EXISTS evo_msg_jid_idx      ON evolution_messages(remote_jid);
CREATE INDEX IF NOT EXISTS evo_msg_created_idx  ON evolution_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS evo_msg_instance_idx ON evolution_messages(instance_name);

ALTER TABLE evolution_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role bypass evolution_messages"
  ON evolution_messages
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "users read own org evolution_messages"
  ON evolution_messages FOR SELECT
  USING (organization_id = get_user_org());
