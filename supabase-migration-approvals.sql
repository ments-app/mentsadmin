-- Migration: Add approval_status to startup-created content
-- Run this in Supabase SQL editor

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved'
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE gigs
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved'
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved'
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE competitions
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved'
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Indexes for fast pending queue queries
CREATE INDEX IF NOT EXISTS idx_jobs_approval_status ON jobs(approval_status) WHERE approval_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_gigs_approval_status ON gigs(approval_status) WHERE approval_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_events_approval_status ON events(approval_status) WHERE approval_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_competitions_approval_status ON competitions(approval_status) WHERE approval_status = 'pending';
