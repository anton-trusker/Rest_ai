
-- Business profile
CREATE TABLE IF NOT EXISTS business_profile (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name   TEXT,
  logo_url        TEXT,
  timezone        TEXT DEFAULT 'UTC',
  currency        TEXT DEFAULT 'USD',
  language        TEXT DEFAULT 'en',
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Glass dimensions (for partial bottle counting)
CREATE TABLE IF NOT EXISTS glass_dimensions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT NOT NULL,
  volume_ml       NUMERIC NOT NULL,
  is_default      BOOLEAN DEFAULT false,
  sort_order      INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Locations (storage areas)
CREATE TABLE IF NOT EXISTS locations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  location_type   TEXT, -- bar, cellar, kitchen, etc.
  sort_order      INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- User-Location mapping
CREATE TABLE IF NOT EXISTS user_locations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location_id     UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  UNIQUE(user_id, location_id)
);

-- RLS Policies
ALTER TABLE business_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE glass_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- Business Profile: Read by all auth, Update by Admin
CREATE POLICY "Authenticated users can read business profile" ON business_profile
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can update business profile" ON business_profile
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
    )
  );

-- Glass Dimensions: Read by all auth, Manage by Admin
CREATE POLICY "Authenticated users can read glass dimensions" ON glass_dimensions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage glass dimensions" ON glass_dimensions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
    )
  );

-- Locations: Read by all auth, Manage by Admin
CREATE POLICY "Authenticated users can read locations" ON locations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage locations" ON locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
    )
  );

-- User Locations: Read by all auth, Manage by Admin
CREATE POLICY "Authenticated users can read user locations" ON user_locations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage user locations" ON user_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('admin', 'super_admin')
    )
  );
