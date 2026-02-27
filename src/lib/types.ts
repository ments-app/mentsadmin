export interface Competition {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  created_by: string;
  is_external: boolean;
  external_url: string | null;
  created_at: string;
  has_leaderboard: boolean;
  prize_pool: string | null;
  banner_image_url: string | null;
  // Extended fields
  tags: string[];
  is_featured: boolean;
  is_active: boolean;
  domain: string | null;
  organizer_name: string | null;
  participation_type: 'individual' | 'team';
  team_size_min: number;
  team_size_max: number;
  eligibility_criteria: string | null;
}

export interface CompetitionRound {
  id: string;
  competition_id: string;
  round_number: number;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface CompetitionFaq {
  id: string;
  competition_id: string;
  question: string;
  answer: string;
  order_index: number;
  created_at: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string | null;
  location: string | null;
  salary_range: string | null;
  job_type: 'full-time' | 'part-time' | 'contract' | 'remote' | 'internship';
  requirements: string | null;
  deadline: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  // Detailed fields
  company_logo_url: string | null;
  company_website: string | null;
  experience_level: 'any' | 'internship' | 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  skills_required: string[];
  benefits: string | null;
  responsibilities: string | null;
  category: 'engineering' | 'design' | 'marketing' | 'sales' | 'operations' | 'finance' | 'hr' | 'legal' | 'product' | 'data' | 'support' | 'content' | 'other';
  work_mode: 'onsite' | 'remote' | 'hybrid';
  contact_email: string | null;
}

export interface Gig {
  id: string;
  title: string;
  description: string | null;
  budget: string | null;
  duration: string | null;
  skills_required: string[];
  deadline: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  // Detailed fields
  company: string | null;
  company_logo_url: string | null;
  company_website: string | null;
  category: 'development' | 'design' | 'writing' | 'marketing' | 'video' | 'audio' | 'data' | 'consulting' | 'other';
  experience_level: 'any' | 'beginner' | 'intermediate' | 'expert';
  payment_type: 'fixed' | 'hourly' | 'milestone' | 'negotiable';
  deliverables: string | null;
  responsibilities: string | null;
  contact_email: string | null;
}

export interface Application {
  id: string;
  job_id: string | null;
  gig_id: string | null;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  user_avatar_url: string | null;
  user_tagline: string | null;
  user_city: string | null;
  profile_snapshot: Record<string, unknown>;
  match_score: number;
  match_breakdown: { skills: number; experience: number; level: number; overall: number };
  profile_summary: string | null;
  strengths: string[];
  weaknesses: string[];
  ai_questions: Array<{
    id: number;
    question: string;
    type: string;
    answer: string;
    score: number;
    feedback: string;
  }>;
  interview_score: number;
  overall_score: number;
  ai_recommendation: 'strongly_recommend' | 'recommend' | 'maybe' | 'not_recommend' | 'pending';
  ai_summary: string | null;
  hire_suggestion: string | null;
  tab_switch_count: number;
  time_spent_seconds: number;
  status: 'in_progress' | 'submitted' | 'reviewed' | 'shortlisted' | 'rejected';
  admin_notes: string | null;
  started_at: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  event_url: string | null;
  banner_image_url: string | null;
  event_type: 'online' | 'in-person' | 'hybrid';
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  // Extended fields
  tags: string[];
  is_featured: boolean;
  organizer_name: string | null;
  category: 'event' | 'meetup' | 'workshop' | 'conference' | 'seminar';
}

export interface SchemeMetadata {
  location?: string;
  recent_investments?: string;
  sectors?: string;
  avg_startup_age?: string;
  avg_num_founders?: string;
  avg_founder_age?: string;
  companies_invested?: string;
}

export interface CompanyOfferMetadata {
  discount_value?: string;
  promo_code?: string;
  valid_until?: string;
  terms?: string;
}

export interface ToolMetadata {
  pricing_model?: string;
  platform?: string;
  features?: string;
}

export interface BankOfferMetadata {
  interest_rate?: string;
  loan_range?: string;
  repayment_period?: string;
  collateral_required?: string;
}

export type ResourceMetadata = SchemeMetadata | CompanyOfferMetadata | ToolMetadata | BankOfferMetadata;

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  icon: string | null;
  logo_url: string | null;
  category: 'govt_scheme' | 'accelerator_incubator' | 'company_offer' | 'tool' | 'bank_offer' | 'scheme';
  provider: string | null;
  eligibility: string | null;
  deadline: string | null;
  tags: string[];
  metadata: ResourceMetadata;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}
