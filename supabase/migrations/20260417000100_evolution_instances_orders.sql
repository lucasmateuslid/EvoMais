-- ============================================================
-- Evolution integration tables: instances and orders
-- ============================================================

-- ----------------------------
-- evolution_instances
-- ----------------------------
CREATE TABLE IF NOT EXISTS evolution_instances (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connection_id   UUID        REFERENCES connections(id) ON DELETE SET NULL,
  seller_id       UUID        REFERENCES sellers(id) ON DELETE SET NULL,
  instance_name   TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'creating'
                              CHECK (status IN ('creating', 'queued', 'generating_qr', 'qr_ready', 'connected', 'disconnected', 'error')),
  phone_number    TEXT,
  qr_code         TEXT,
  qr_expires_at   TIMESTAMPTZ,
  last_heartbeat  TIMESTAMPTZ,
  error_message   TEXT,
  raw_payload     JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, instance_name)
);

CREATE INDEX IF NOT EXISTS evolution_instances_org_idx      ON evolution_instances(organization_id);
CREATE INDEX IF NOT EXISTS evolution_instances_status_idx   ON evolution_instances(status);
CREATE INDEX IF NOT EXISTS evolution_instances_conn_idx     ON evolution_instances(connection_id);
CREATE INDEX IF NOT EXISTS evolution_instances_seller_idx   ON evolution_instances(seller_id);

ALTER TABLE evolution_instances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view evolution instances in their org" ON evolution_instances;
CREATE POLICY "Users can view evolution instances in their org"
  ON evolution_instances FOR SELECT
  USING (organization_id = get_user_org() OR is_super_admin());

DROP POLICY IF EXISTS "Users can create evolution instances in their org" ON evolution_instances;
CREATE POLICY "Users can create evolution instances in their org"
  ON evolution_instances FOR INSERT
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

DROP POLICY IF EXISTS "Users can update evolution instances in their org" ON evolution_instances;
CREATE POLICY "Users can update evolution instances in their org"
  ON evolution_instances FOR UPDATE
  USING (organization_id = get_user_org() OR is_super_admin())
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

DROP POLICY IF EXISTS "Users can delete evolution instances in their org" ON evolution_instances;
CREATE POLICY "Users can delete evolution instances in their org"
  ON evolution_instances FOR DELETE
  USING (organization_id = get_user_org() OR is_super_admin());

GRANT ALL ON TABLE evolution_instances TO authenticated;

-- ----------------------------
-- evolution_orders
-- ----------------------------
CREATE TABLE IF NOT EXISTS evolution_orders (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connection_id   UUID        REFERENCES connections(id) ON DELETE SET NULL,
  conversation_id UUID        REFERENCES conversations(id) ON DELETE SET NULL,
  seller_id       UUID        REFERENCES sellers(id) ON DELETE SET NULL,
  customer_phone  TEXT        NOT NULL,
  customer_name   TEXT,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  total_value     NUMERIC     NOT NULL DEFAULT 0,
  currency        TEXT        NOT NULL DEFAULT 'BRL',
  items           JSONB       NOT NULL DEFAULT '[]'::jsonb,
  notes           TEXT,
  order_number    TEXT        UNIQUE,
  external_id     TEXT,
  raw_payload     JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at    TIMESTAMPTZ,
  shipped_at      TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS evolution_orders_org_idx          ON evolution_orders(organization_id);
CREATE INDEX IF NOT EXISTS evolution_orders_status_idx       ON evolution_orders(status);
CREATE INDEX IF NOT EXISTS evolution_orders_phone_idx        ON evolution_orders(customer_phone);
CREATE INDEX IF NOT EXISTS evolution_orders_created_idx      ON evolution_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS evolution_orders_conversation_idx ON evolution_orders(conversation_id);

ALTER TABLE evolution_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view evolution orders in their org" ON evolution_orders;
CREATE POLICY "Users can view evolution orders in their org"
  ON evolution_orders FOR SELECT
  USING (organization_id = get_user_org() OR is_super_admin());

DROP POLICY IF EXISTS "Users can create evolution orders in their org" ON evolution_orders;
CREATE POLICY "Users can create evolution orders in their org"
  ON evolution_orders FOR INSERT
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

DROP POLICY IF EXISTS "Users can update evolution orders in their org" ON evolution_orders;
CREATE POLICY "Users can update evolution orders in their org"
  ON evolution_orders FOR UPDATE
  USING (organization_id = get_user_org() OR is_super_admin())
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

DROP POLICY IF EXISTS "Users can delete evolution orders in their org" ON evolution_orders;
CREATE POLICY "Users can delete evolution orders in their org"
  ON evolution_orders FOR DELETE
  USING (organization_id = get_user_org() OR is_super_admin());

GRANT ALL ON TABLE evolution_orders TO authenticated;
