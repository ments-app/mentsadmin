-- ============================================================
-- AI-Based Applications System
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference (one of these will be set)
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,

  -- Applicant info (snapshot at application time)
  user_id UUID NOT NULL,
  user_name TEXT,
  user_email TEXT,
  user_avatar_url TEXT,
  user_tagline TEXT,
  user_city TEXT,

  -- Full profile snapshot
  profile_snapshot JSONB DEFAULT '{}',

  -- AI Profile Analysis
  match_score INTEGER DEFAULT 0,
  match_breakdown JSONB DEFAULT '{}',
  profile_summary TEXT,
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',

  -- AI Interview
  ai_questions JSONB DEFAULT '[]',

  -- Final Scores
  interview_score INTEGER DEFAULT 0,
  overall_score INTEGER DEFAULT 0,
  ai_recommendation TEXT DEFAULT 'pending',
  ai_summary TEXT,
  hire_suggestion TEXT,

  -- Integrity tracking
  tab_switch_count INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'in_progress',
  admin_notes TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Must reference either a job or a gig
  CONSTRAINT chk_application_reference CHECK (
    (job_id IS NOT NULL AND gig_id IS NULL) OR
    (job_id IS NULL AND gig_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_gig_id ON applications(gig_id);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_overall_score ON applications(overall_score DESC);

-- One application per user per job
CREATE UNIQUE INDEX idx_unique_job_application ON applications(job_id, user_id) WHERE job_id IS NOT NULL;
-- One application per user per gig
CREATE UNIQUE INDEX idx_unique_gig_application ON applications(gig_id, user_id) WHERE gig_id IS NOT NULL;

-- RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own in-progress applications"
  ON applications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'in_progress');

CREATE POLICY "Service role full access"
  ON applications
  USING (true)
  WITH CHECK (true);
