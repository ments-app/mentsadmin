-- ─── Student Access Control Migration ────────────────────────────────────────
-- Run this in your Supabase SQL editor to enable the facilitator student-email
-- access list and email-restricted visibility on content tables.

-- 1. Add visibility column to all content tables
--    Values: 'public' (default) | 'email_restricted' | 'facilitator_only'

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'email_restricted', 'facilitator_only'));

ALTER TABLE gigs
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'email_restricted', 'facilitator_only'));

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'email_restricted', 'facilitator_only'));

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'email_restricted', 'facilitator_only'));

-- 2. Facilitator student email access list table

CREATE TABLE IF NOT EXISTS facilitator_student_emails (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  facilitator_id uuid     NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  added_at    timestamptz DEFAULT now(),
  UNIQUE (facilitator_id, email)
);

ALTER TABLE facilitator_student_emails ENABLE ROW LEVEL SECURITY;

-- Facilitators can manage their own list only
CREATE POLICY "Facilitator manages own student list"
  ON facilitator_student_emails
  FOR ALL
  USING  (facilitator_id = auth.uid())
  WITH CHECK (facilitator_id = auth.uid());

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_facilitator_student_emails_facilitator
  ON facilitator_student_emails (facilitator_id);

CREATE INDEX IF NOT EXISTS idx_facilitator_student_emails_email
  ON facilitator_student_emails (email);

-- 3. (Optional) target_facilitator_ids for facilitator-targeted content
--    Already added in facilitators.ts logic — add the column if needed:

ALTER TABLE jobs        ADD COLUMN IF NOT EXISTS target_facilitator_ids uuid[] DEFAULT NULL;
ALTER TABLE gigs        ADD COLUMN IF NOT EXISTS target_facilitator_ids uuid[] DEFAULT NULL;
ALTER TABLE events      ADD COLUMN IF NOT EXISTS target_facilitator_ids uuid[] DEFAULT NULL;
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS target_facilitator_ids uuid[] DEFAULT NULL;

-- 4. facilitator_id FK column (needed for facilitator-owned content routing)
--    If not already present:

ALTER TABLE jobs        ADD COLUMN IF NOT EXISTS facilitator_id uuid REFERENCES auth.users(id);
ALTER TABLE gigs        ADD COLUMN IF NOT EXISTS facilitator_id uuid REFERENCES auth.users(id);
ALTER TABLE events      ADD COLUMN IF NOT EXISTS facilitator_id uuid REFERENCES auth.users(id);
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS facilitator_id uuid REFERENCES auth.users(id);

ALTER TABLE jobs        ADD COLUMN IF NOT EXISTS startup_id uuid REFERENCES startup_profiles(id);
ALTER TABLE events      ADD COLUMN IF NOT EXISTS startup_id uuid REFERENCES startup_profiles(id);
ALTER TABLE competitions ADD COLUMN IF NOT EXISTS startup_id uuid REFERENCES startup_profiles(id);
