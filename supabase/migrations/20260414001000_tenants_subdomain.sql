-- Multi-tenant subdomain mapping (1 tenant = 1 organization)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  subdomain TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tenants_subdomain_format CHECK (subdomain ~ '^[a-z0-9-]+$'),
  CONSTRAINT tenants_status_check CHECK (status IN ('active', 'inactive'))
);

CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_organization_id ON tenants(organization_id);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view tenants in their org" ON tenants;
CREATE POLICY "Users can view tenants in their org"
  ON tenants FOR SELECT
  USING (organization_id = get_user_org() OR is_super_admin());

DROP POLICY IF EXISTS "Super admin can create tenants" ON tenants;
CREATE POLICY "Super admin can create tenants"
  ON tenants FOR INSERT
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admin can update tenants" ON tenants;
CREATE POLICY "Super admin can update tenants"
  ON tenants FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admin can delete tenants" ON tenants;
CREATE POLICY "Super admin can delete tenants"
  ON tenants FOR DELETE
  USING (is_super_admin());

GRANT ALL ON TABLE tenants TO authenticated;
