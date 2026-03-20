-- ─── Facilitator Explore Startups Migration ──────────────────────────────────
-- Run this in your Supabase SQL editor.
-- Superadmin: full CRUD access. Facilitators: read-only.

CREATE TABLE IF NOT EXISTS facilitator_explore_startups (
  id                    uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  facilitator_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  startup_name          text        NOT NULL,
  email                 text,
  mobile                text,
  website               text,
  contact_person        text,
  address               text,
  sector                text,
  uploaded_to_superadmin boolean    NOT NULL DEFAULT false,
  uploaded_at           timestamptz,
  created_at            timestamptz DEFAULT now()
);

ALTER TABLE facilitator_explore_startups ENABLE ROW LEVEL SECURITY;

-- Superadmin: full access (insert, update, delete, select)
CREATE POLICY "Superadmin full access explore startups"
  ON facilitator_explore_startups
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role = 'superadmin'
    )
  );

-- Facilitator: read-only
CREATE POLICY "Facilitator read-only explore startups"
  ON facilitator_explore_startups
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
      AND admin_profiles.role = 'facilitator'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_explore_startups_facilitator
  ON facilitator_explore_startups (facilitator_id);

CREATE INDEX IF NOT EXISTS idx_explore_startups_uploaded
  ON facilitator_explore_startups (uploaded_to_superadmin);
