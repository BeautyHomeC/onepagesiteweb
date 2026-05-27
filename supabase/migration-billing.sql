-- supabase/migration-billing.sql
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Allow public SELECT on sessions (anon key used by FormationsSection.tsx)
CREATE POLICY "sessions_public_read" ON sessions
  FOR SELECT USING (true);

-- 2. Add billing columns to reservations
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS solde_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS solde_payment_method TEXT,
  ADD COLUMN IF NOT EXISTS facture_finale_url TEXT,
  ADD COLUMN IF NOT EXISTS stripe_solde_session_id TEXT;
