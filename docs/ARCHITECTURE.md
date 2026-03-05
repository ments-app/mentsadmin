# Ments Admin Panel — Technical Architecture

> **Last updated:** March 2026
> **Stack:** Next.js 16 · React 19 · Supabase (PostgreSQL + Auth + Storage) · Groq AI · TypeScript · Tailwind CSS 4

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Tech Stack & Dependencies](#tech-stack--dependencies)
3. [Directory Structure](#directory-structure)
4. [Authentication & Session Management](#authentication--session-management)
5. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
6. [Middleware & Route Protection](#middleware--route-protection)
7. [Database Schema](#database-schema)
8. [Server Actions (Backend Logic)](#server-actions-backend-logic)
9. [Feature Modules](#feature-modules)
10. [AI Integration](#ai-integration)
11. [File Upload & Storage](#file-upload--storage)
12. [Feed Analytics Engine](#feed-analytics-engine)
13. [Audit Logging](#audit-logging)
14. [Frontend Architecture](#frontend-architecture)

---

## System Overview

Ments Admin is a **multi-tenant admin panel** for the Ments startup platform. It provides three distinct portals — **SuperAdmin**, **Facilitator**, and **Startup** — each with scoped access to manage jobs, gigs, events, competitions, applications, feed content, trending posts, startup profiles, and resources.

```
┌───────────────────────────────────────────────────────────────┐
│                      Next.js App Router                       │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │  /login   │  │  /onboarding  │  │  /pending-verification  │  │
│  └──────────┘  └──────────────┘  └────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────┐   │
│  │  /dashboard/* │  │  /facilitator/*   │  │  /startup/*    │   │
│  │  (SuperAdmin) │  │  (Facilitator)    │  │  (Startup)     │   │
│  └──────────────┘  └──────────────────┘  └───────────────┘   │
│                           │                                    │
│              ┌────────────┼────────────┐                       │
│              │   Server Actions Layer  │                       │
│              │   (src/actions/*.ts)     │                       │
│              └────────────┼────────────┘                       │
│                           │                                    │
│              ┌────────────┼────────────┐                       │
│              │    Supabase Backend     │                       │
│              │  PostgreSQL + Auth +    │                       │
│              │  Storage + RLS          │                       │
│              └─────────────────────────┘                       │
└───────────────────────────────────────────────────────────────┘
```

---

## Tech Stack & Dependencies

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 (App Router) | SSR, routing, server actions |
| UI | React 19, Tailwind CSS 4, lucide-react | Component rendering, styling, icons |
| Backend | Supabase (PostgreSQL) | Database, auth, storage, RLS |
| AI | Groq SDK | AI-powered autofill and content generation |
| Charts | Recharts | Analytics visualizations |
| Utilities | date-fns, clsx, tailwind-merge | Date formatting, class composition |

---

## Directory Structure

```
src/
├── actions/              # Server Actions (backend logic)
│   ├── rbac.ts           # Registration, profile management, audit logs
│   ├── facilitators.ts   # Facilitator CRUD + startup management
│   ├── startups.ts       # Startup profile CRUD (admin)
│   ├── startup-portal.ts # Startup self-service (scoped to own data)
│   ├── startup-profile.ts# Startup profile editing + facilitator discovery
│   ├── jobs.ts           # Job CRUD
│   ├── gigs.ts           # Gig CRUD
│   ├── events.ts         # Event CRUD
│   ├── competitions.ts   # Competition CRUD + rounds + FAQs + registrations
│   ├── applications.ts   # Application viewing + status management
│   ├── feed.ts           # Feed moderation (posts, reports, user suspension)
│   ├── feed-analytics.ts # Feed metrics, experiments, retention
│   ├── trending.ts       # Trending algorithm + override management
│   ├── resources.ts      # Resource CRUD + bulk import
│   └── upload.ts         # Banner image upload
├── app/
│   ├── api/ai/           # AI API routes (autofill, generate)
│   ├── auth/             # Supabase auth callback
│   ├── login/            # Login page
│   ├── onboarding/       # Registration flows (facilitator, startup)
│   ├── dashboard/        # SuperAdmin portal (12 modules)
│   ├── facilitator/      # Facilitator portal (7 modules)
│   ├── startup/          # Startup portal (8 modules)
│   ├── pending-verification/  # Facilitator waiting screen
│   ├── pending-approval/      # Startup waiting screen
│   └── resolving/        # Post-login role resolver
├── components/           # Shared UI components
│   ├── Sidebar.tsx       # Role-aware navigation sidebar
│   ├── DataTable.tsx     # Reusable data table
│   ├── FormField.tsx     # Form input component
│   ├── ImageUpload.tsx   # Image upload with preview
│   ├── DateTimePicker.tsx# Date/time input
│   ├── AiAutoFillButton.tsx   # AI autofill trigger
│   ├── AiFieldButton.tsx      # Per-field AI generation
│   ├── DeleteConfirmModal.tsx # Confirmation dialog
│   ├── StatusBadge.tsx   # Status indicator
│   ├── StatsCard.tsx     # Dashboard stat card
│   ├── ThemeProvider.tsx # Dark/light theme
│   ├── CategoryMetadataFields.tsx # Dynamic resource metadata
│   └── analytics/        # Feed analytics chart components
├── lib/
│   ├── auth.ts           # Session management, role enforcement
│   ├── rbac.ts           # Permission matrix, access helpers
│   ├── supabase.ts       # Client-side Supabase instance
│   ├── supabase-server.ts# Server-side Supabase (auth + admin)
│   ├── types.ts          # TypeScript type definitions
│   ├── scraper.ts        # Website scraper for AI autofill
│   ├── category-metadata.ts  # Resource metadata field definitions
│   └── cn.ts             # Utility: clsx + tailwind-merge
└── middleware.ts         # Route guards + role-based redirects
```

---

## Authentication & Session Management

### Auth Flow

1. User signs in via **Supabase Auth** (Google OAuth) at `/login`
2. Auth callback at `/auth/callback` exchanges code for session
3. Middleware intercepts every request, reads session cookie (`sb-admin-auth`)
4. Session user is looked up in `admin_profiles` table to determine role

### Two Supabase Clients

| Client | Created via | Purpose |
|--------|------------|---------|
| `createAuthClient()` | `@supabase/ssr` + cookies | Reads user session, respects RLS |
| `createAdminClient()` | `@supabase/supabase-js` + service role key | Bypasses RLS for admin operations |

### Session User Resolution (`getSessionUser`)

```typescript
// src/lib/auth.ts
async function getSessionUser(): Promise<SessionUser | null>
```

1. Gets authenticated user via `supabase.auth.getUser()`
2. Fetches `admin_profiles` record using the admin client
3. If role is `facilitator`, also fetches `facilitator_profiles`
4. Returns `{ authId, email, profile, facilitatorProfile }`

### Role Enforcement Functions

| Function | Allowed Roles | Requires Approved |
|----------|--------------|-------------------|
| `requireRole(roles, requireApproved)` | Configurable | Configurable |
| `requireSuperAdmin()` | `superadmin` | N/A (always approved) |
| `requireFacilitator()` | `facilitator` | Yes |
| `requireStartup()` | `startup` | Yes |
| `requireAdminOrFacilitator()` | `superadmin`, `facilitator` | Yes |

---

## Role-Based Access Control (RBAC)

### Roles

| Role | Description | Verification |
|------|------------|--------------|
| `superadmin` | Full platform admin | Auto-approved |
| `facilitator` | Organisation admin (e-cell, incubator, accelerator) | Requires SuperAdmin approval |
| `startup` | Startup entity | Auto-approved (or facilitator-gated if using assignment flow) |

### Permission Matrix (`src/lib/rbac.ts`)

| Permission | SuperAdmin | Facilitator | Startup |
|-----------|:----------:|:-----------:|:-------:|
| `APPROVE_FACILITATOR` | ✅ | | |
| `REJECT_FACILITATOR` | ✅ | | |
| `VIEW_ALL_FACILITATORS` | ✅ | | |
| `VIEW_ALL_STARTUPS` | ✅ | | |
| `OVERRIDE_MODERATION` | ✅ | | |
| `SUSPEND_ANY_USER` | ✅ | | |
| `VIEW_FULL_ANALYTICS` | ✅ | | |
| `VIEW_ALL_FEED` | ✅ | | |
| `MANAGE_TRENDING` | ✅ | | |
| `MANAGE_RESOURCES` | ✅ | | |
| `POST_JOB` | ✅ | ✅ | ✅ |
| `POST_GIG` | ✅ | ✅ | ✅ |
| `POST_EVENT` | ✅ | ✅ | ✅ |
| `POST_COMPETITION` | ✅ | ✅ | ✅ |
| `APPROVE_STARTUP` | ✅ | ✅ | |
| `REJECT_STARTUP` | ✅ | ✅ | |
| `SUSPEND_STARTUP` | ✅ | ✅ | |
| `VIEW_OWN_APPLICANTS` | ✅ | ✅ | ✅ |
| `VIEW_FACILITATOR_ANALYTICS` | ✅ | ✅ | |

### Ownership Assertions

```typescript
assertFacilitatorOwnsStartup(facilitatorId, assignmentFacilitatorId) // Throws if mismatch
assertStartupOwnsItem(startupId, itemStartupId)                     // Throws if mismatch
```

---

## Middleware & Route Protection

**File:** `src/middleware.ts`

The middleware runs on every non-static request and implements a multi-layer routing strategy:

### Routing Logic Flow

```
Request → Is /auth?                     → Pass through
        → Is /?                         → Redirect to /resolving or /login
        → Is protected & no user?       → Redirect to /login
        → Has user but no profile?      → Check for super_admin in users table
                                          → If super_admin → /dashboard
                                          → Else → /onboarding
        → Has profile:
          → role=superadmin             → Allow /dashboard/* only
          → role=facilitator + approved → Allow /facilitator/* only
          → role=facilitator + pending  → /pending-verification
          → role=startup                → Allow /startup/*
                                          → Allow /dashboard/jobs|gigs|events|competitions/* (shared forms)
                                          → Redirect list pages to startup equivalents
```

### Protected Prefixes

```typescript
const protectedPrefixes = ['/dashboard', '/facilitator', '/startup', '/onboarding', '/resolving'];
```

### Matcher Config

Excludes static assets via regex:
```typescript
matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
```

---

## Database Schema

### Core Tables

| Table | Description |
|-------|------------|
| `users` | Ments platform user accounts |
| `admin_profiles` | Admin panel profiles (role, verification status) |
| `facilitator_profiles` | Organisation details for facilitators |
| `startup_profiles` | Full startup entity data |
| `startup_founders` | Founder entries per startup |
| `startup_funding_rounds` | Funding history |
| `startup_incubators` | Incubator/accelerator participation |
| `startup_awards` | Awards and recognitions |
| `startup_facilitator_assignments` | Facilitator–startup verification assignments |

### Content Tables

| Table | Description |
|-------|------------|
| `jobs` | Job listings |
| `gigs` | Freelance gig listings |
| `events` | Event listings |
| `competitions` | Competition listings |
| `competition_rounds` | Multi-round competition structure |
| `competition_faqs` | FAQ entries per competition |
| `competition_entries` | Competition registrations |
| `resources` | Curated resources (schemes, tools, offers) |
| `applications` | AI-scored job/gig applications |

### Feed & Social Tables

| Table | Description |
|-------|------------|
| `posts` | Feed posts (supports parent-child for replies) |
| `post_likes` | Like records |
| `post_media` | Media attachments |
| `post_reports` | Content reports |
| `trending_overrides` | Admin pin/remove overrides for trending |

### Analytics Tables

| Table | Description |
|-------|------------|
| `feed_events` | Impression, engagement, dwell tracking |
| `feed_analytics_daily` | Pre-aggregated daily metrics |
| `user_sessions` | Session-level feed depth tracking |
| `post_features` | Engagement scores, virality velocity |
| `trending_topics` | Auto-detected trending topics |
| `feed_experiments` | A/B experiment definitions |
| `feed_experiment_assignments` | User–variant assignments |

### System Tables

| Table | Description |
|-------|------------|
| `audit_logs` | Action audit trail |

---

## Server Actions (Backend Logic)

All server actions are in `src/actions/` and use the `'use server'` directive. They're called directly from React Server Components and client components.

### Action Modules Summary

| Module | Functions | Auth Guard |
|--------|----------|------------|
| `rbac.ts` | `getMyProfile`, `registerAsFacilitator`, `registerAsStartup`, `registerNewStartup`, `autoRegisterMentsStartup`, `uploadVerificationDocument`, `writeAuditLog` | Auth client (user session) |
| `facilitators.ts` | `getFacilitators`, `getFacilitatorById`, `approveFacilitator`, `rejectFacilitator`, `suspendFacilitator`, `getFacilitatorStartups`, `getUnassignedStartups`, `claimStartupForVerification`, `approveStartup`, `rejectStartup`, `suspendStartup`, `getFacilitatorJobs/Gigs/Events/Competitions/Applications`, `getFacilitatorDashboardStats`, `getFacilitatorStartupDetail`, `getAuditLogs` | `requireSuperAdmin()` or `requireFacilitator()` |
| `startups.ts` | `getStartupProfiles`, `getStartupProfile`, `getFullStartupProfile`, `toggleStartupFeatured/Published/Visibility`, `deleteStartupProfile`, `createAdminStartupProfile`, `updateStartupCoreProfile`, `upsertStartupFounders/FundingRounds/Incubators/Awards`, `findUserByEmail`, `getStartupByOwnerId` | Admin client (service role) |
| `startup-portal.ts` | `getStartupDashboardStats`, `getStartupJobs`, `createStartupJob`, `deleteStartupJob`, `getStartupGigs/Events/Competitions/Applications` | `requireStartup()` |
| `startup-profile.ts` | `getMyStartupSummary`, `getMyFullStartupProfile`, `updateMyStartupProfile`, `updateMyFounders/FundingRounds/Incubators/Awards`, `getApprovedFacilitators`, `applyToFacilitator`, `getMyFacilitatorApplications`, `createMyStartupProfile` | `requireStartup()` |
| `jobs.ts` | `getJobs`, `getJob`, `createJob`, `updateJob`, `deleteJob` | Admin client |
| `gigs.ts` | `getGigs`, `getGig`, `createGig`, `updateGig`, `deleteGig` | Admin client |
| `events.ts` | `getEvents`, `getEvent`, `createEvent`, `updateEvent`, `deleteEvent` | Admin client |
| `competitions.ts` | `getCompetitions`, `getCompetition`, `createCompetition`, `updateCompetition`, `deleteCompetition`, `getCompetitionRounds`, `upsertCompetitionRounds`, `getCompetitionFaqs`, `upsertCompetitionFaqs`, `getCompetitionRegistrations`, `updateRegistrationStatus` | Admin client |
| `applications.ts` | `getJobApplications`, `getGigApplications`, `getApplication`, `updateApplicationStatus`, `getApplicationStats`, `getApplicationCount`, `getAllApplications`, `getRecentApplications`, `getPositionTitles`, `getTotalApplicationCount` | Admin client |
| `feed.ts` | `getFeedPosts`, `getPostReports`, `deletePost`, `restorePost`, `resolveReport`, `deleteAndResolveReport`, `suspendUser`, `unsuspendUser` | Admin client |
| `feed-analytics.ts` | `getFeedAnalyticsSummary`, `getFeedAnalyticsDaily`, `getContentPerformance`, `getExperimentsList`, `getExperimentDetails`, `getRetentionMetrics` | Admin client |
| `trending.ts` | `getTrendingPosts`, `pinPost`, `removePost`, `resetPost` | Admin client |
| `resources.ts` | `getResources`, `getResource`, `createResource`, `updateResource`, `deleteResource`, `bulkCreateResources` | Admin client |
| `upload.ts` | `uploadBannerImage` | Admin client |

---

## Feature Modules

### 1. Jobs Management

- **CRUD** for job listings with detailed fields: company info, salary range, job type (full-time/part-time/contract/remote/internship), experience level, skills, work mode, category
- **Application tracking**: AI-scored applications with match scores, interview scores, AI recommendations
- **Access**: SuperAdmin (global), Facilitator (scoped to own), Startup (scoped to own)

### 2. Gigs Management

- **CRUD** for freelance gigs: budget, duration, skills required, payment type (fixed/hourly/milestone/negotiable), deliverables
- Shares the same application system as Jobs
- **Access**: Same as Jobs

### 3. Events Management

- **CRUD** for events: online/in-person/hybrid types, categories (event/meetup/workshop/conference/seminar), featured flags, tags
- Banner image support via Supabase Storage
- **Access**: SuperAdmin (global), Facilitator (scoped), Startup (scoped)

### 4. Competitions Management

- **CRUD** with extended competition features:
  - Multi-round structure (`competition_rounds`)
  - FAQ management (`competition_faqs`)
  - Registration tracking with status management (registered/shortlisted/winner/rejected)
  - Leaderboard toggle, prize pool, participation type (individual/team), domain, eligibility
- **Access**: SuperAdmin (global), Facilitator (scoped), Startup (scoped)

### 5. Applications & AI Scoring

- Each application contains:
  - **Profile snapshot** of the applicant
  - **AI match score** with breakdown (skills, experience, level, overall)
  - **AI interview**: auto-generated questions with scores and feedback
  - **AI recommendation**: strongly_recommend / recommend / maybe / not_recommend
  - **Integrity tracking**: tab switch count, time spent
- Status workflow: `in_progress` → `submitted` → `reviewed` → `shortlisted` / `rejected`
- Aggregate statistics: score distributions, recommendation distributions, status counts

### 6. Feed Moderation (SuperAdmin only)

- View all platform posts (active/deleted filter, paginated)
- Per-post metrics: likes, replies, media count, report count
- **Content reports management**: pending/resolved/dismissed with moderator notes
- **Actions**: delete post, restore post, resolve/dismiss report, delete-and-resolve
- **User moderation**: suspend/unsuspend users with reason tracking

### 7. Trending Management (SuperAdmin only)

- **Algorithmic scoring** of recent posts (14-day window, up to 500 posts):
  - Score formula: `((likes × 3) + (replies × 5) + (media × 2) + velocityBonus) × recencyMultiplier`
  - Recency multiplier: 1.5× (≤24h), 1.2× (≤48h), 1.0× (>48h)
  - Velocity bonus: `(likes / ageHours) × 10`
- **Admin overrides**: pin, remove, reset posts in trending
- Pinned posts always appear first, removed posts are marked but visible to admins

### 8. Resources Management (SuperAdmin only)

- **Categories**: Government Scheme, Accelerator/Incubator, Company Offer, Tool, Bank Offer
- **Dynamic metadata** per category:
  - Schemes: location, sectors, investment data, founder demographics
  - Company offers: discount value, promo code, validity, terms
  - Tools: pricing model, platform, features
  - Bank offers: interest rate, loan range, repayment, collateral
- **Bulk import** support for batch resource creation

### 9. Startup Profiles

- Comprehensive profile data: brand name, registered name, legal status, CIN, stage, description, keywords, categories, social links, financials
- **Sub-entities**: founders, funding rounds, incubators, awards
- **Admin features**: toggle featured/published/visibility, delete
- **Startup self-service**: edit own profile, manage founders, funding, incubators, awards

### 10. Facilitator Management

- **Registration flow**: form with org details → pending verification → SuperAdmin approval
- **Verification document upload** to Supabase Storage
- **Lifecycle**: pending → approved / rejected / suspended
- **Startup assignments**: facilitators claim unassigned startups → review → approve/reject/suspend

### 11. Feed Analytics (SuperAdmin only)

- **Summary metrics**: impressions, engagements, engagement rate, avg dwell time, unique users, avg feed depth
- **Daily aggregates**: time-series data from `feed_analytics_daily`
- **Content performance**: top posts by engagement score, trending topics, top creators
- **A/B experiments**: experiment list, variant counts, per-experiment details
- **Retention metrics**: DAU/WAU/MAU, session depth distribution

---

## AI Integration

### API Routes (`src/app/api/ai/`)

| Route | Purpose |
|-------|---------|
| `/api/ai/autofill` | Auto-fills form fields by scraping a company website |
| `/api/ai/generate` | Generates content for individual fields via Groq LLM |

### Autofill Flow

1. User provides a company URL
2. Server scrapes the website using `src/lib/scraper.ts` (8s timeout, extracts title, meta, OG tags, body text → truncated to 2500 chars)
3. Scraped content is sent to Groq (via `groq-sdk`) with a structured prompt
4. AI returns a JSON object with suggested field values
5. Frontend populates the form

### Per-Field Generation

1. User clicks the AI button on a specific field
2. Context from existing form values + field description is sent to Groq
3. AI generates content for that specific field

---

## File Upload & Storage

### Banner Images (`src/actions/upload.ts`)

- **Allowed types**: JPEG, PNG, WebP, GIF
- **Max size**: 5 MB
- **Storage bucket**: `banners` (Supabase Storage)
- **Naming**: `{timestamp}-{random}.{ext}`
- Returns public URL after upload

### Verification Documents (`src/actions/rbac.ts`)

- **Storage bucket**: `admin-documents`
- **Path**: `verification-docs/{userId}-{timestamp}.{ext}`
- Used during facilitator onboarding for identity verification

---

## Feed Analytics Engine

### Data Pipeline

```
User Interaction → feed_events (raw) → feed_analytics_daily (aggregated)
                                      → post_features (per-post scores)
                                      → trending_topics (detected topics)
```

### Event Types Tracked

- `impression` — post shown in feed
- `like`, `reply`, `share`, `bookmark`, `click` — engagement events
- `dwell` — time spent viewing (with `dwell_ms` metadata)

### Metrics Computed

| Metric | Source | Computation |
|--------|--------|------------|
| Engagement Rate | feed_events | engagements / impressions |
| Avg Dwell Time | feed_events (dwell) | Mean of dwell_ms values |
| Feed Depth | user_sessions | Mean of feed_depth per session |
| DAU/WAU/MAU | feed_events | Distinct user_id counts per window |
| Virality Velocity | post_features | Rate of engagement over time |
| Like/Reply/Click Rates | post_features | Per-post engagement rates |

---

## Audit Logging

### Schema

```typescript
{
  action_type: string;    // e.g. 'approve_facilitator', 'suspend_startup'
  actor_id: string;       // Who performed the action
  actor_role: AdminRole;  // Their role at time of action
  target_type: string;    // e.g. 'facilitator', 'startup', 'job'
  target_id: string;      // ID of the target entity
  details: Record;        // Additional context (notes, reasons)
  created_at: timestamp;  // Auto-generated
}
```

### Logged Actions

- Facilitator: approve, reject, suspend
- Startup: approve, reject, suspend, claim for verification
- Content: job creation (startup portal)

---

## Frontend Architecture

### Theme System

- **ThemeProvider** (`src/components/ThemeProvider.tsx`) manages dark/light mode
- Theme persisted to `localStorage`, defaults to `dark`
- CSS variables defined in `globals.css` for sidebar, card, and semantic colors

### Sidebar Navigation

Role-aware sidebar with different navigation items per role:

- **SuperAdmin (12 items)**: Dashboard, Facilitators, Startups, Competitions, Jobs, Gigs, Applications, Events, Resources, Trending, Feed Moderation, Feed Analytics
- **Facilitator (7 items)**: Dashboard, My Startups, Jobs, Gigs, Events, Competitions, Applications
- **Startup (8 items)**: Dashboard, My Profile, Facilitators, Jobs, Gigs, Events, Competitions, Applications

### Shared Components

| Component | Description |
|-----------|------------|
| `DataTable` | Sortable, filterable data table with action columns |
| `FormField` | Standardized form input with label, error, and help text |
| `ImageUpload` | Drag-and-drop image upload with preview |
| `DateTimePicker` | Date + time selection component |
| `StatusBadge` | Colored badge for status display (approved/pending/rejected/suspended) |
| `StatsCard` | Dashboard metric card with icon and value |
| `DeleteConfirmModal` | Confirmation dialog for destructive actions |
| `AiAutoFillButton` | Trigger AI form autofill from company URL |
| `AiFieldButton` | Per-field AI content generation |
| `CategoryMetadataFields` | Dynamic form fields based on resource category |

### Analytics Visualizations (`src/components/analytics/`)

5 chart components powered by Recharts for the feed analytics dashboard.
