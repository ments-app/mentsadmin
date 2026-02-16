-- Run this in Supabase SQL Editor to add Scheme support + metadata/logo fields

-- Add metadata JSONB column for scheme-specific fields
ALTER TABLE resources ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Add logo_url column for custom logos (applies to all categories)
ALTER TABLE resources ADD COLUMN IF NOT EXISTS logo_url text;

-- Update category constraint to include 'scheme'
ALTER TABLE resources DROP CONSTRAINT IF EXISTS resources_category_check;
ALTER TABLE resources ADD CONSTRAINT resources_category_check
  CHECK (category IN ('govt_scheme','accelerator_incubator','company_offer','tool','bank_offer','scheme'));
