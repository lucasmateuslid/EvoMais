-- Seed tenants for local and validation environments
INSERT INTO tenants (organization_id, subdomain, domain, status)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'empresa1', 'empresa1.fulana.local', 'active'),
  ('550e8400-e29b-41d4-a716-446655440002', 'empresa2', 'empresa2.fulana.local', 'active')
ON CONFLICT (organization_id) DO UPDATE SET
  subdomain = EXCLUDED.subdomain,
  domain = EXCLUDED.domain,
  status = EXCLUDED.status,
  updated_at = NOW();
