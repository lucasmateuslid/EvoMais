-- CRM deals table used by the frontend and backend proxy
CREATE TABLE deals (
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deals in their org"
  ON deals FOR SELECT
  USING (organization_id = get_user_org());

CREATE POLICY "Users can insert deals in their org"
  ON deals FOR INSERT
  WITH CHECK (organization_id = get_user_org());

CREATE POLICY "Users can update deals in their org"
  ON deals FOR UPDATE
  USING (organization_id = get_user_org())
  WITH CHECK (organization_id = get_user_org());

CREATE POLICY "Users can delete deals in their org"
  ON deals FOR DELETE
  USING (organization_id = get_user_org());

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());