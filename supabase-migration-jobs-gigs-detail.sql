-- ============================================================
-- MIGRATION: Enhanced Jobs & Gigs tables with detailed attributes
-- Run this in Supabase SQL Editor
-- ============================================================

-- ========================
-- JOBS TABLE — New Columns
-- ========================

-- Company branding
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_logo_url text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_website text;

-- Experience & skills
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_level text DEFAULT 'any'
  CHECK (experience_level IN ('any', 'internship', 'entry', 'mid', 'senior', 'lead', 'executive'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS skills_required text[] DEFAULT '{}';

-- Detailed info
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS responsibilities text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS category text DEFAULT 'other'
  CHECK (category IN ('engineering', 'design', 'marketing', 'sales', 'operations', 'finance', 'hr', 'legal', 'product', 'data', 'support', 'content', 'other'));
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS work_mode text DEFAULT 'onsite'
  CHECK (work_mode IN ('onsite', 'remote', 'hybrid'));

-- Contact
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS contact_email text;

-- ========================
-- GIGS TABLE — New Columns
-- ========================

-- Client info
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS company text;
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS company_logo_url text;
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS company_website text;

-- Classification
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS category text DEFAULT 'other'
  CHECK (category IN ('development', 'design', 'writing', 'marketing', 'video', 'audio', 'data', 'consulting', 'other'));
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS experience_level text DEFAULT 'any'
  CHECK (experience_level IN ('any', 'beginner', 'intermediate', 'expert'));
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'fixed'
  CHECK (payment_type IN ('fixed', 'hourly', 'milestone', 'negotiable'));

-- Detailed info
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS deliverables text;
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS responsibilities text;

-- Contact
ALTER TABLE gigs ADD COLUMN IF NOT EXISTS contact_email text;
