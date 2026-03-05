# Ments Admin Panel — Features & Permissions Guide

> A plain-language guide to everything the Ments Admin Panel can do and who can do what.

---

## What Is Ments Admin?

Ments Admin is the management dashboard for the **Ments startup platform**. It's where platform administrators, organisation facilitators, and startups come to manage content, review applications, moderate the community feed, and oversee the platform.

There are **three types of users** (roles), each with their own portal and set of capabilities.

---

## User Roles

### 🛡️ Super Admin

The **platform owner**. Has unrestricted access to everything. Manages the entire platform, approves facilitators, moderates content, and reviews analytics.

- Accesses the **Admin Dashboard** at `/dashboard`
- Can see and manage all data across the platform

### 🏢 Facilitator

An **organisation representative** — typically from a college E-Cell, incubator, or accelerator. Facilitators help onboard and verify startups assigned to them, and can post content (jobs, gigs, events, competitions) on behalf of their organisation.

- Accesses the **Facilitator Portal** at `/facilitator`
- Must be **approved by a Super Admin** before gaining access
- Can only see data related to their own organisation

### 🚀 Startup

A **startup entity** that uses the platform to post opportunities, manage their profile, and discover facilitators.

- Accesses the **Startup Portal** at `/startup`
- **Auto-approved** upon registration (no waiting period)
- Can only see and manage their own data

---

## How Sign-Up & Login Works

1. **Log in** using your Google account
2. If you're new, you'll be taken to the **onboarding screen** where you choose to register as a **Facilitator** or a **Startup**
3. **Facilitators** fill in organisation details and submit for verification → wait for Super Admin approval → get access
4. **Startups** either link their existing Ments account or create a new one → get instant access
5. If you already have a Ments platform account, the system automatically detects it and sets you up

### Verification Statuses

| Status | What It Means |
|--------|--------------|
| **Pending** | Waiting for review |
| **Approved** | Full access granted |
| **Rejected** | Application denied (can see reason) |
| **Suspended** | Account temporarily disabled |

---

## Features by Role

### Features Available to Everyone (All Roles)

| Feature | Description |
|---------|------------|
| **Post Jobs** | Create job listings with company info, salary, requirements, skills, work mode |
| **Post Gigs** | Create freelance gig listings with budget, duration, and deliverables |
| **Post Events** | Create event listings (online, in-person, or hybrid) with dates and banners |
| **Post Competitions** | Create competitions with deadlines, prizes, rounds, FAQs, and leaderboards |
| **View Applications** | See who applied to your jobs and gigs with AI-powered scoring |
| **AI Form Autofill** | Enter a company website and let AI automatically fill the form fields |
| **AI Content Generation** | Click on any field to get AI-generated suggestions |
| **Dark / Light Mode** | Toggle between dark and light themes |

---

### 🛡️ Super Admin Exclusive Features

| Feature | Description |
|---------|------------|
| **Manage Facilitators** | View all registered facilitators, approve/reject/suspend them |
| **View All Startups** | Browse all startup profiles on the platform |
| **Toggle Startup Visibility** | Feature, publish/unpublish, or delete startup profiles |
| **Feed Moderation** | View all community posts, delete/restore posts, handle content reports |
| **User Suspension** | Suspend or unsuspend platform users who violate guidelines |
| **Trending Management** | See algorithmically ranked trending posts; pin, remove, or reset them |
| **Resource Management** | Add, edit, and delete curated resources (govt schemes, tools, bank offers, company offers, accelerators) |
| **Bulk Resource Import** | Upload multiple resources at once |
| **Feed Analytics Dashboard** | View engagement metrics, content performance, retention, and A/B experiments |
| **Audit Logs** | View a full history of admin actions (who did what, when) |
| **Full Platform Analytics** | See total counts of jobs, gigs, events, competitions, and applications |

---

### 🏢 Facilitator Features

| Feature | Description |
|---------|------------|
| **My Startups** | View startups assigned to you for verification |
| **Claim Unassigned Startups** | Pick up unverified startups that aren't assigned to anyone yet |
| **Review Startups** | View full startup profile details; approve, reject, or suspend them |
| **Scoped Content** | See only the jobs, gigs, events, and competitions that you created |
| **Dashboard Stats** | View counts of your content and assigned startups |

---

### 🚀 Startup Features

| Feature | Description |
|---------|------------|
| **My Profile** | Edit your full startup profile — brand, description, social links, financials |
| **Manage Founders** | Add, edit, and reorder your founding team members |
| **Funding Rounds** | Track your funding history (pre-seed, seed, series A–C) |
| **Incubators & Awards** | Record incubator programs and awards you've received |
| **Browse Facilitators** | Discover approved facilitators (incubators, E-Cells, etc.) and apply to them |
| **My Posts** | View and manage jobs, gigs, events, and competitions you created |
| **Scoped Applications** | See applications to your own job and gig postings |

---

## Permissions Matrix (Who Can Do What)

| Action | Super Admin | Facilitator | Startup |
|--------|:-----------:|:-----------:|:-------:|
| Approve / reject facilitators | ✅ | | |
| View all facilitators | ✅ | | |
| View all startups | ✅ | | |
| Moderate feed posts | ✅ | | |
| Suspend any user | ✅ | | |
| Manage trending posts | ✅ | | |
| Manage resources | ✅ | | |
| View full analytics | ✅ | | |
| View audit logs | ✅ | | |
| Post jobs / gigs / events / competitions | ✅ | ✅ | ✅ |
| Approve / reject startups | ✅ | ✅ | |
| Suspend startups | ✅ | ✅ | |
| View facilitator analytics | ✅ | ✅ | |
| View own applicants | ✅ | ✅ | ✅ |
| Edit own startup profile | | | ✅ |
| Browse & apply to facilitators | | | ✅ |

---

## Content Types Explained

### 📋 Jobs

Full-time, part-time, contract, remote, or internship positions. Each job includes:
- Company name, logo, and website
- Location, salary range, and work mode (onsite/remote/hybrid)
- Experience level, required skills, category
- Application deadline and contact info

### ⚡ Gigs

Short-term freelance work. Each gig includes:
- Budget, duration, and payment type (fixed/hourly/milestone/negotiable)
- Required skills and experience level
- Deliverables and responsibilities

### 📅 Events

Events can be online, in-person, or hybrid. Each event includes:
- Date, location, and event URL
- Banner image and tags
- Category (event/meetup/workshop/conference/seminar)
- Featured flag for homepage promotion

### 🏆 Competitions

Competitions support advanced features:
- **Rounds**: multiple stages with individual start/end dates
- **FAQs**: question-and-answer pairs for participants
- **Registrations**: track who signed up; mark as shortlisted/winner/rejected
- Prize pool, team sizes, eligibility criteria, leaderboard toggle
- Individual or team participation

### 📦 Resources

Curated links and opportunities. Categories include:
- **Government Schemes**: eligibility, sectors, investment details
- **Accelerators / Incubators**: location, portfolio companies, founder demographics
- **Company Offers**: discount values, promo codes, expiry dates
- **Tools**: pricing model, platform, key features
- **Bank Offers**: interest rates, loan ranges, repayment terms, collateral

### 📄 Applications

When users apply for jobs or gigs, the system generates:
- **AI Match Score**: how well the applicant fits (0–100)
- **AI Interview**: auto-generated questions with scored answers
- **AI Recommendation**: strongly recommend / recommend / maybe / not recommend
- **Profile Summary**: AI-generated strengths and weaknesses
- **Integrity Data**: tab switches and time spent during application

---

## How Feed Moderation Works

1. Users post content on the Ments platform feed
2. Other users can **report** posts that violate guidelines
3. Super Admins see all posts and pending reports in the **Feed Moderation** section
4. For each report, an admin can:
   - **Resolve** it (take action, add notes)
   - **Dismiss** it (false report)
   - **Delete the post** and resolve the report in one step
5. Admins can also **suspend users** who repeatedly violate guidelines

---

## How Trending Works

The platform automatically ranks posts from the last 14 days using an engagement score:
- **Likes, replies, and media** contribute to the base score
- **Recent posts** get a boost (1.5× if under 24 hours old)
- **Fast-growing posts** get a velocity bonus

Super Admins can override the algorithm:
- **Pin** a post to keep it at the top
- **Remove** a post from trending
- **Reset** to let the algorithm decide again

---

## How the Facilitator ↔ Startup Relationship Works

1. A startup signs up and gets auto-approved
2. A facilitator sees the startup in the "Unassigned Startups" list
3. The facilitator **claims** the startup for verification
4. After reviewing the full profile, the facilitator **approves**, **rejects**, or **suspends** the startup
5. Alternatively, a startup can **browse facilitators** and apply to one

This creates a two-way discovery mechanism where facilitators can find startups and startups can find facilitators.

---

## Onboarding Flows

### Facilitator Onboarding

1. Sign in with Google
2. Choose "Facilitator" on the onboarding screen
3. Fill in: display name, organisation name, address, type (E-Cell/Incubator/Accelerator/College Cell/Other), official email, point of contact, phone, website
4. Optionally upload a verification document
5. Submit → redirected to waiting screen
6. Super Admin reviews and approves/rejects

### Startup Onboarding

Two paths:

**Path A — Existing Ments User:**
1. Sign in with Google
2. System detects your Ments account
3. Auto-registered as a startup → instant access

**Path B — New User:**
1. Sign in with Google
2. Choose "Startup" on the onboarding screen
3. Fill in: username, full name, brand name, stage, email, phone
4. Submit → instant access (auto-approved)

---

## Dashboard Overviews

### Super Admin Dashboard
Shows total counts for: Jobs, Gigs, Events, Competitions, Applications — plus quick access to all management sections.

### Facilitator Dashboard
Shows counts of content you've created (jobs, gigs, events, competitions) and the number of approved startups in your portfolio.

### Startup Dashboard
Shows counts of your posted content (jobs, gigs, events, competitions) and received applications.
