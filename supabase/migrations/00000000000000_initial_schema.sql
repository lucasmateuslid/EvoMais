-- Create tables
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  logo_url TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user',
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE seller_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected',
  connected_at TIMESTAMPTZ
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  contact_phone TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  started_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL, -- 'seller' or 'contact'
  content TEXT,
  media_url TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE seller_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  is_idle BOOLEAN DEFAULT false,
  idle_since TIMESTAMPTZ,
  UNIQUE(seller_id)
);

CREATE TABLE seller_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_messages INT DEFAULT 0,
  total_conversations INT DEFAULT 0,
  avg_response_time INT, -- in seconds
  UNIQUE(seller_id, date)
);

CREATE TABLE ai_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES sellers(id) ON DELETE CASCADE,
  analysis_text TEXT,
  score INT,
  insights_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE score_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  config_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Setup
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_configs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization
CREATE OR REPLACE FUNCTION get_user_org()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Policies (Example: Sellers table)
CREATE POLICY "Users can view sellers in their org"
  ON sellers FOR SELECT
  USING (organization_id = get_user_org());

CREATE POLICY "Users can insert sellers in their org"
  ON sellers FOR INSERT
  WITH CHECK (organization_id = get_user_org());

CREATE POLICY "Users can update sellers in their org"
  ON sellers FOR UPDATE
  USING (organization_id = get_user_org());

CREATE POLICY "Users can delete sellers in their org"
  ON sellers FOR DELETE
  USING (organization_id = get_user_org());

-- Add similar policies for other tables based on organization_id
-- For tables that link to sellers (like seller_connections), you might join or use subqueries:
CREATE POLICY "Users can view seller connections in their org"
  ON seller_connections FOR SELECT
  USING (seller_id IN (SELECT id FROM sellers WHERE organization_id = get_user_org()));

-- ... Add remaining policies as needed
