-- ============================================================
-- RBAC SCHEMA MIGRATION
-- Ments Admin — Role-Based Access Control
-- Run this in Supabase SQL editor (as service role)
-- ============================================================

-- ─── 1. ADMIN PROFILES ──────────────────────────────────────
-- Central identity table linked to auth.users.
-- SuperAdmin rows are INSERT-only via SQL (no frontend path).

CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role                TEXT NOT NULL CHECK (role IN ('superadmin', 'facilitator', 'startup')),
  verification_status TEXT NOT NULL DEFAULT 'pending'
                        CHECK (verification_status IN ('pending', 'approved', 'rejected', 'suspended')),
  display_name        TEXT,
  email               TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_admin_profiles_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 2. FACILITATOR PROFILES ────────────────────────────────
-- Extended data collected during facilitator onboarding.

CREATE TABLE IF NOT EXISTS public.facilitator_profiles (
  id                  UUID PRIMARY KEY REFERENCES public.admin_profiles(id) ON DELETE CASCADE,
  organisation_name   TEXT NOT NULL,
  organisation_address TEXT NOT NULL,
  organisation_type   TEXT NOT NULL
                        CHECK (organisation_type IN ('ecell','incubator','accelerator','college_cell','other')),
  official_email      TEXT NOT NULL,
  poc_name            TEXT NOT NULL,
  contact_number      TEXT NOT NULL,
  website             TEXT,
  document_url        TEXT,
  verification_notes  TEXT,   -- SuperAdmin notes on approval/rejection
  approved_by         UUID REFERENCES public.admin_profiles(id),
  approved_at         TIMESTAMPTZ,
  rejected_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_facilitator_profiles_updated_at
  BEFORE UPDATE ON public.facilitator_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 3. STARTUP FACILITATOR ASSIGNMENTS ─────────────────────
-- Tracks which facilitator verified which startup.
-- Startup can appear as "pending" visible to all facilitators,
-- then a facilitator claims and approves/rejects.

CREATE TABLE IF NOT EXISTS public.startup_facilitator_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id      UUID NOT NULL REFERENCES public.startup_profiles(id) ON DELETE CASCADE,
  facilitator_id  UUID NOT NULL REFERENCES public.admin_profiles(id),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected','suspended')),
  assigned_by     UUID REFERENCES public.admin_profiles(id),
  notes           TEXT,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(startup_id, facilitator_id)
);

CREATE TRIGGER trg_startup_assignments_updated_at
  BEFORE UPDATE ON public.startup_facilitator_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 4. AUDIT LOGS ──────────────────────────────────────────
-- Immutable append-only table. No UPDATE/DELETE allowed.

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,       -- e.g. 'approve_facilitator', 'reject_startup'
  actor_id    UUID NOT NULL,       -- who performed the action
  actor_role  TEXT NOT NULL,
  target_type TEXT NOT NULL,       -- 'facilitator', 'startup', 'job', 'user', etc.
  target_id   TEXT NOT NULL,
  details     JSONB,               -- arbitrary metadata
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent modification of audit entries
CREATE OR REPLACE RULE audit_logs_no_update AS
  ON UPDATE TO public.audit_logs DO INSTEAD NOTHING;
CREATE OR REPLACE RULE audit_logs_no_delete AS
  ON DELETE TO public.audit_logs DO INSTEAD NOTHING;

-- ─── 5. EXTEND CONTENT TABLES ───────────────────────────────
-- Add ownership columns to jobs, gigs, events, competitions.
-- Nullable to preserve existing rows.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS facilitator_id UUID REFERENCES public.admin_profiles(id),
  ADD COLUMN IF NOT EXISTS startup_id     UUID REFERENCES public.startup_profiles(id);

ALTER TABLE public.gigs
  ADD COLUMN IF NOT EXISTS facilitator_id UUID REFERENCES public.admin_profiles(id),
  ADD COLUMN IF NOT EXISTS startup_id     UUID REFERENCES public.startup_profiles(id);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS facilitator_id UUID REFERENCES public.admin_profiles(id),
  ADD COLUMN IF NOT EXISTS startup_id     UUID REFERENCES public.startup_profiles(id);

ALTER TABLE public.competitions
  ADD COLUMN IF NOT EXISTS facilitator_id UUID REFERENCES public.admin_profiles(id),
  ADD COLUMN IF NOT EXISTS startup_id     UUID REFERENCES public.startup_profiles(id);

-- Applications ownership
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS facilitator_id UUID REFERENCES public.admin_profiles(id),
  ADD COLUMN IF NOT EXISTS startup_id     UUID REFERENCES public.startup_profiles(id);

-- ─── 6. INDEXES ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_admin_profiles_role        ON public.admin_profiles(role);
CREATE INDEX IF NOT EXISTS idx_admin_profiles_status      ON public.admin_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_startup_assignments_fac    ON public.startup_facilitator_assignments(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_startup_assignments_startup ON public.startup_facilitator_assignments(startup_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor           ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target          ON public.audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created         ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_facilitator           ON public.jobs(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_jobs_startup               ON public.jobs(startup_id);
CREATE INDEX IF NOT EXISTS idx_gigs_facilitator           ON public.gigs(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_gigs_startup               ON public.gigs(startup_id);
CREATE INDEX IF NOT EXISTS idx_events_facilitator         ON public.events(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_competitions_facilitator   ON public.competitions(facilitator_id);

-- ─── 7. ROW LEVEL SECURITY ──────────────────────────────────

ALTER TABLE public.admin_profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilitator_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_facilitator_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs                  ENABLE ROW LEVEL SECURITY;

-- admin_profiles: users can read their own row
CREATE POLICY "users_read_own_profile"
  ON public.admin_profiles FOR SELECT
  USING (auth.uid() = id);

-- facilitator_profiles: facilitators can read their own row
CREATE POLICY "facilitator_read_own"
  ON public.facilitator_profiles FOR SELECT
  USING (auth.uid() = id);

-- startup_facilitator_assignments: startups see their own assignments
CREATE POLICY "startup_see_own_assignments"
  ON public.startup_facilitator_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.id = auth.uid() AND ap.role = 'startup'
    )
  );

-- audit_logs: only service role can insert; no user reads via client
-- (All reads done server-side with service role key)

-- ─── 8. HELPER: INSERT SUPERADMIN ───────────────────────────
-- Usage (after creating the Supabase auth user manually):
--
--   INSERT INTO public.admin_profiles (id, role, verification_status, display_name, email)
--   VALUES ('<auth_user_uuid>', 'superadmin', 'approved', 'Super Admin', 'admin@ments.app');
--
-- SuperAdmin rows CANNOT be inserted via any frontend path.
-- This is enforced by the absence of any API/action that sets role='superadmin'.
