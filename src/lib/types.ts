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
}

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  icon: string | null;
  category: 'govt_scheme' | 'accelerator_incubator' | 'company_offer' | 'tool' | 'bank_offer';
  provider: string | null;
  eligibility: string | null;
  deadline: string | null;
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}
