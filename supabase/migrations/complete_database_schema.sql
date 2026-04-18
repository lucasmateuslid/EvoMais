-- ============================================================================
-- EVOMAIS - COMPLETE DATABASE SCHEMA WITH AUTHENTICATION & MULTI-TENANT RLS
-- Generated: 2026-04-14
-- Purpose: Production-ready Supabase database schema with user management
-- ============================================================================

-- SECTION 1: CORE TABLES

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  logo_url TEXT,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  max_users INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  last_sign_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seller_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  instance_name TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'disconnected',
  api_provider TEXT DEFAULT 'evolution',
  connected_at TIMESTAMPTZ,
  webhook_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  instance_name TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'disconnected',
  api_provider TEXT DEFAULT 'evolution',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  contact_phone TEXT NOT NULL,
  contact_name TEXT,
  status TEXT DEFAULT 'open',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  closed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(seller_id, contact_phone)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  sender_name TEXT,
  content TEXT,
  media_url TEXT,
  media_type TEXT,
  message_id TEXT UNIQUE,
  status TEXT DEFAULT 'delivered',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seller_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  is_idle BOOLEAN DEFAULT false,
  idle_since TIMESTAMPTZ,
  status TEXT DEFAULT 'offline',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(seller_id)
);

CREATE TABLE IF NOT EXISTS seller_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_messages INT DEFAULT 0,
  total_conversations INT DEFAULT 0,
  avg_response_time INT,
  conversion_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(seller_id, date)
);

CREATE TABLE IF NOT EXISTS ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  analysis_text TEXT,
  score INT,
  insights_json JSONB,
  model_type TEXT DEFAULT 'gemini',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS score_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  config_json JSONB,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, method)
);

CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  company TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 0,
  consultant_id TEXT NOT NULL,
  consultant_name TEXT NOT NULL,
  consultant_initials TEXT NOT NULL,
  days_in_stage INT NOT NULL DEFAULT 0,
  followup_status TEXT NOT NULL,
  checklist JSONB,
  color TEXT NOT NULL,
  info TEXT,
  info_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SECTION 2: INDEXES FOR PERFORMANCE

CREATE INDEX IF NOT EXISTS idx_organizations_email ON organizations(email);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_sellers_organization_id ON sellers(organization_id);
CREATE INDEX IF NOT EXISTS idx_sellers_email ON sellers(email);
CREATE INDEX IF NOT EXISTS idx_sellers_status ON sellers(status);
CREATE INDEX IF NOT EXISTS idx_seller_connections_seller_id ON seller_connections(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_connections_organization_id ON seller_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_seller_connections_status ON seller_connections(status);
CREATE INDEX IF NOT EXISTS idx_seller_connections_instance_name ON seller_connections(instance_name);
CREATE INDEX IF NOT EXISTS idx_connections_organization_id ON connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_connections_instance_name ON connections(instance_name);
CREATE INDEX IF NOT EXISTS idx_conversations_organization_id ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact_phone ON conversations(contact_phone);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_started_at ON conversations(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);
CREATE INDEX IF NOT EXISTS idx_conversations_closed_at ON conversations(closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_tags ON conversations USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_seller_id ON messages(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_organization_id ON messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_seller_activity_seller_id ON seller_activity(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_activity_organization_id ON seller_activity(organization_id);
CREATE INDEX IF NOT EXISTS idx_seller_activity_status ON seller_activity(status);
CREATE INDEX IF NOT EXISTS idx_seller_daily_stats_seller_id ON seller_daily_stats(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_daily_stats_organization_id ON seller_daily_stats(organization_id);
CREATE INDEX IF NOT EXISTS idx_seller_daily_stats_date ON seller_daily_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_conversation_id ON ai_analyses(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_seller_id ON ai_analyses(seller_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_organization_id ON ai_analyses(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_score ON ai_analyses(score DESC);
CREATE INDEX IF NOT EXISTS idx_deals_organization_id ON deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_consultant_id ON deals(consultant_id);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_followup_status ON deals(followup_status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- SECTION 3: ROW LEVEL SECURITY (RLS)

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- SECTION 4: SECURITY FUNCTIONS

CREATE OR REPLACE FUNCTION get_user_org()
RETURNS UUID AS $$
  SELECT organization_id 
  FROM profiles 
  WHERE user_id = auth.uid() 
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
      AND organization_id = org_id 
      AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- SECTION 5: RLS POLICIES - ORGANIZATIONS

CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (id = get_user_org() OR is_super_admin());

CREATE POLICY "Super admin can update organizations"
  ON organizations FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admin can delete organizations"
  ON organizations FOR DELETE
  USING (is_super_admin());

CREATE POLICY "Super admin can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (is_super_admin());

-- SECTION 6: RLS POLICIES - PROFILES

CREATE POLICY "Users can view profiles in their org"
  ON profiles FOR SELECT
  USING (organization_id = get_user_org() OR user_id = auth.uid() OR is_super_admin());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid() OR is_org_admin(organization_id))
  WITH CHECK (user_id = auth.uid() OR is_org_admin(organization_id));

CREATE POLICY "Org admin can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (is_org_admin(organization_id) OR is_super_admin());

CREATE POLICY "Org admin can delete profiles"
  ON profiles FOR DELETE
  USING (is_org_admin(organization_id) OR is_super_admin());

-- SECTION 7: RLS POLICIES - SELLERS

CREATE POLICY "Users can view sellers in their org"
  ON sellers FOR SELECT
  USING (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can create sellers in their org"
  ON sellers FOR INSERT
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can update sellers in their org"
  ON sellers FOR UPDATE
  USING (organization_id = get_user_org() OR is_super_admin())
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can delete sellers in their org"
  ON sellers FOR DELETE
  USING (organization_id = get_user_org() OR is_super_admin());

-- SECTION 8: RLS POLICIES - CONNECTIONS & CONVERSATIONS

CREATE POLICY "Users can view seller connections in their org"
  ON seller_connections FOR SELECT
  USING (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can create seller connections in their org"
  ON seller_connections FOR INSERT
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can update seller connections in their org"
  ON seller_connections FOR UPDATE
  USING (organization_id = get_user_org() OR is_super_admin())
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can delete seller connections in their org"
  ON seller_connections FOR DELETE
  USING (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can view connections in their org"
  ON connections FOR SELECT
  USING (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can create connections in their org"
  ON connections FOR INSERT
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can update connections in their org"
  ON connections FOR UPDATE
  USING (organization_id = get_user_org() OR is_super_admin())
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can delete connections in their org"
  ON connections FOR DELETE
  USING (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can view conversations in their org"
  ON conversations FOR SELECT
  USING (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can create conversations in their org"
  ON conversations FOR INSERT
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can update conversations in their org"
  ON conversations FOR UPDATE
  USING (organization_id = get_user_org() OR is_super_admin())
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can delete conversations in their org"
  ON conversations FOR DELETE
  USING (organization_id = get_user_org() OR is_super_admin());

-- SECTION 9: RLS POLICIES - MESSAGES

CREATE POLICY "Users can view messages in their org"
  ON messages FOR SELECT
  USING (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can create messages in their org"
  ON messages FOR INSERT
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can update messages in their org"
  ON messages FOR UPDATE
  USING (organization_id = get_user_org() OR is_super_admin())
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can delete messages in their org"
  ON messages FOR DELETE
  USING (organization_id = get_user_org() OR is_super_admin());

-- SECTION 10: RLS POLICIES - SELLER ACTIVITY & STATS

CREATE POLICY "Users can view seller activity in their org"
  ON seller_activity FOR SELECT
  USING (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Service can manage seller activity"
  ON seller_activity FOR INSERT
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Service can update seller activity"
  ON seller_activity FOR UPDATE
  USING (organization_id = get_user_org() OR is_super_admin())
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can view seller stats in their org"
  ON seller_daily_stats FOR SELECT
  USING (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Service can manage seller stats"
  ON seller_daily_stats FOR INSERT
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Service can update seller stats"
  ON seller_daily_stats FOR UPDATE
  USING (organization_id = get_user_org() OR is_super_admin())
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

-- SECTION 11: RLS POLICIES - AI & DEALS

CREATE POLICY "Users can view AI analyses in their org"
  ON ai_analyses FOR SELECT
  USING (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Service can create AI analyses"
  ON ai_analyses FOR INSERT
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Service can update AI analyses"
  ON ai_analyses FOR UPDATE
  USING (organization_id = get_user_org() OR is_super_admin())
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can view score configs in their org"
  ON score_configs FOR SELECT
  USING (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Org admin can create score configs"
  ON score_configs FOR INSERT
  WITH CHECK (is_org_admin(organization_id) OR is_super_admin());

CREATE POLICY "Org admin can update score configs"
  ON score_configs FOR UPDATE
  USING (is_org_admin(organization_id) OR is_super_admin())
  WITH CHECK (is_org_admin(organization_id) OR is_super_admin());

CREATE POLICY "Org admin can delete score configs"
  ON score_configs FOR DELETE
  USING (is_org_admin(organization_id) OR is_super_admin());

CREATE POLICY "Users can view deals in their org"
  ON deals FOR SELECT
  USING (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can create deals in their org"
  ON deals FOR INSERT
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can update deals in their org"
  ON deals FOR UPDATE
  USING (organization_id = get_user_org() OR is_super_admin())
  WITH CHECK (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Users can delete deals in their org"
  ON deals FOR DELETE
  USING (organization_id = get_user_org() OR is_super_admin());

-- SECTION 12: RLS POLICIES - AUDIT

CREATE POLICY "Users can view audit logs in their org"
  ON audit_logs FOR SELECT
  USING (organization_id = get_user_org() OR is_super_admin());

CREATE POLICY "Service can create audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- SECTION 13: GRANT PERMISSIONS

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.sellers TO authenticated;
GRANT ALL ON public.seller_connections TO authenticated;
GRANT ALL ON public.connections TO authenticated;
GRANT ALL ON public.conversations TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.seller_activity TO authenticated;
GRANT ALL ON public.seller_daily_stats TO authenticated;
GRANT ALL ON public.ai_analyses TO authenticated;
GRANT ALL ON public.score_configs TO authenticated;
GRANT ALL ON public.deals TO authenticated;
GRANT ALL ON public.audit_logs TO authenticated;

GRANT EXECUTE ON FUNCTION get_user_org() TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_admin(UUID) TO authenticated;

-- END OF SCHEMA
