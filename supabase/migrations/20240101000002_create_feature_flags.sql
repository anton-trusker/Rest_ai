
-- Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_key        TEXT NOT NULL UNIQUE,
  display_name    TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL, -- 'module', 'feature', 'ui', 'integration', 'experiment'
  
  -- State
  is_enabled      BOOLEAN NOT NULL DEFAULT false,
  
  -- Targeting
  target_type     TEXT DEFAULT 'global', -- 'global', 'organization', 'user', 'role', 'percentage'
  target_ids      UUID[],
  rollout_percentage INTEGER DEFAULT 100,
  
  -- Metadata
  is_system       BOOLEAN DEFAULT false,
  depends_on      TEXT[],
  phase           TEXT,
  release_version TEXT,
  
  -- Timestamps
  enabled_at      TIMESTAMPTZ,
  disabled_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_by      UUID REFERENCES profiles(id)
);

-- Feature Flag Logs
CREATE TABLE IF NOT EXISTS feature_flag_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_key    TEXT NOT NULL,
  old_value   BOOLEAN,
  new_value   BOOLEAN NOT NULL,
  changed_by  UUID REFERENCES profiles(id),
  changed_at  TIMESTAMPTZ DEFAULT NOW(),
  reason      TEXT
);

-- RLS Policies
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_logs ENABLE ROW LEVEL SECURITY;

-- Everyone can read flags (public info to control UI)
CREATE POLICY "Everyone can read feature flags" ON feature_flags
  FOR SELECT USING (true);

-- Only Admins/Super Admins can update flags
CREATE POLICY "Admins can update feature flags" ON feature_flags
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
    )
  );

-- Only Admins/Super Admins can read logs
CREATE POLICY "Admins can read feature flag logs" ON feature_flag_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
    )
  );
