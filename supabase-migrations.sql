-- Run this in Supabase SQL Editor before using Jobs, Gigs, Events CRUD

-- JOBS TABLE
CREATE TABLE IF NOT EXISTS jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  company text NOT NULL,
  description text,
  location text,
  salary_range text,
  job_type text NOT NULL DEFAULT 'full-time'
    CHECK (job_type IN ('full-time', 'part-time', 'contract', 'remote', 'internship')),
  requirements text,
  deadline timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for jobs" ON jobs FOR SELECT USING (true);

-- GIGS TABLE
CREATE TABLE IF NOT EXISTS gigs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  budget text,
  duration text,
  skills_required text[] DEFAULT '{}',
  deadline timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for gigs" ON gigs FOR SELECT USING (true);

-- EVENTS TABLE
CREATE TABLE IF NOT EXISTS events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  event_date timestamptz,
  location text,
  event_url text,
  banner_image_url text,
  event_type text NOT NULL DEFAULT 'online'
    CHECK (event_type IN ('online', 'in-person', 'hybrid')),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for events" ON events FOR SELECT USING (true);

-- RESOURCES TABLE
CREATE TABLE IF NOT EXISTS resources (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  url text,
  icon text,
  category text NOT NULL DEFAULT 'tool'
    CHECK (category IN ('govt_scheme', 'accelerator_incubator', 'company_offer', 'tool', 'bank_offer')),
  provider text,
  eligibility text,
  deadline timestamptz,
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for resources" ON resources FOR SELECT USING (true);
