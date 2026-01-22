-- 📋 Bond Package Submissions Table
-- Run this in Supabase SQL Editor

CREATE TABLE bond_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Client Information
  client_full_name TEXT NOT NULL,
  date_bond_executed TEXT,
  court_case_number TEXT NOT NULL,
  past_convictions_case_numbers TEXT,
  
  -- Birth & Identity
  birth_certificate_number TEXT,
  state_of_birth TEXT,
  date_of_birth DATE,
  ucc_trust_number TEXT,
  social_security_number TEXT,
  ssn_back_number TEXT,
  
  -- Third Party (Creditor)
  third_party_name TEXT,
  third_party_address TEXT,
  third_party_city TEXT,
  third_party_state TEXT,
  third_party_zip TEXT,
  third_party_county TEXT,
  
  -- Prison (if applicable)
  prison_number TEXT,
  prison_name TEXT,
  prison_address TEXT,
  
  -- Court Information
  trial_court_name TEXT,
  trial_court_type TEXT CHECK (trial_court_type IN ('State', 'Federal')),
  court_address TEXT,
  court_city TEXT,
  court_state TEXT,
  court_zip TEXT,
  
  -- Amount
  amount_owed TEXT,
  
  -- Generated PDF (optional - store path or blob reference)
  pdf_generated BOOLEAN DEFAULT FALSE,
  pdf_path TEXT
);

-- Index for faster queries on status
CREATE INDEX idx_bond_submissions_status ON bond_submissions(status);
CREATE INDEX idx_bond_submissions_created_at ON bond_submissions(created_at DESC);

-- Row Level Security (optional but recommended)
ALTER TABLE bond_submissions ENABLE ROW LEVEL SECURITY;

-- Allow inserts from authenticated AND anonymous users (for form submissions)
CREATE POLICY "Allow anonymous inserts" ON bond_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only allow service role to read/update (for your local processor)
CREATE POLICY "Service role full access" ON bond_submissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Optional: Also allow anon to read their own submissions (if needed)
-- CREATE POLICY "Allow reading own submissions" ON bond_submissions
--   FOR SELECT
--   TO anon
--   USING (true);

COMMENT ON TABLE bond_submissions IS 'Bond package form submissions from production site';
