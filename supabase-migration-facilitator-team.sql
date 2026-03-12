-- Migration: Facilitator Team Members (Co-Admins)
-- Run this in the Supabase SQL editor

-- 1. Add parent_facilitator_id to admin_profiles for co-admins
ALTER TABLE admin_profiles
  ADD COLUMN IF NOT EXISTS parent_facilitator_id uuid REFERENCES admin_profiles(id);

-- Index for fast co-admin lookups
CREATE INDEX IF NOT EXISTS idx_admin_profiles_parent_facilitator
  ON admin_profiles(parent_facilitator_id)
  WHERE parent_facilitator_id IS NOT NULL;

-- 2. Facilitator team members (invitations)
CREATE TABLE IF NOT EXISTS facilitator_team_members (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  facilitator_id   uuid NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
  email            text NOT NULL,
  display_name     text,
  invited_by       uuid REFERENCES admin_profiles(id),
  invited_at       timestamptz NOT NULL DEFAULT now(),
  user_id          uuid REFERENCES admin_profiles(id),   -- populated when they accept
  accepted_at      timestamptz,
  status           text NOT NULL DEFAULT 'pending',      -- pending | active | removed
  UNIQUE(facilitator_id, email)
);

CREATE INDEX IF NOT EXISTS idx_facilitator_team_facilitator
  ON facilitator_team_members(facilitator_id);

CREATE INDEX IF NOT EXISTS idx_facilitator_team_email
  ON facilitator_team_members(email);

-- Enable RLS (admin client bypasses RLS anyway but good practice)
ALTER TABLE facilitator_team_members ENABLE ROW LEVEL SECURITY;
