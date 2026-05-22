-- ─────────────────────────────────────────────────────────────────────────
--  Migration : système de réservation avec contrat électronique
--
--  À exécuter UNE FOIS dans Supabase > SQL Editor
-- ─────────────────────────────────────────────────────────────────────────

-- ── 1. Nouveaux champs sur reservations ───────────────────────────────────
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS prenom              text,
  ADD COLUMN IF NOT EXISTS nom                 text,
  ADD COLUMN IF NOT EXISTS adresse             text,
  ADD COLUMN IF NOT EXISTS telephone           text,
  ADD COLUMN IF NOT EXISTS client_type         text DEFAULT 'particulier',
  ADD COLUMN IF NOT EXISTS raison_sociale      text,
  ADD COLUMN IF NOT EXISTS siret               text,
  ADD COLUMN IF NOT EXISTS instagram           text,
  ADD COLUMN IF NOT EXISTS contrat_signe_url   text,
  ADD COLUMN IF NOT EXISTS contrat_version     integer,
  ADD COLUMN IF NOT EXISTS signature_data      jsonb,
  ADD COLUMN IF NOT EXISTS statut              text DEFAULT 'en_attente_paiement',
  ADD COLUMN IF NOT EXISTS rgpd_consent_at     timestamptz,
  ADD COLUMN IF NOT EXISTS acompte_amount      numeric,
  ADD COLUMN IF NOT EXISTS stripe_session_id   text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent text;

-- ── 2. Table des modèles de contrats ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id uuid NOT NULL REFERENCES public.formations(id) ON DELETE CASCADE,
  type         text NOT NULL CHECK (type IN ('particulier', 'pro')),
  contenu      text NOT NULL DEFAULT '',
  version      integer NOT NULL DEFAULT 1,
  updated_at   timestamptz DEFAULT now(),
  UNIQUE (formation_id, type)
);

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- Lecture : admins authentifiés uniquement
DROP POLICY IF EXISTS "Admin read contract_templates" ON public.contract_templates;
CREATE POLICY "Admin read contract_templates"
  ON public.contract_templates FOR SELECT
  USING (auth.role() = 'authenticated');

-- Écriture : admins authentifiés uniquement
DROP POLICY IF EXISTS "Admin write contract_templates" ON public.contract_templates;
CREATE POLICY "Admin write contract_templates"
  ON public.contract_templates FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── 3. Table des paramètres admin ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.parametres_admin (
  cle       text PRIMARY KEY,
  valeur    text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.parametres_admin ENABLE ROW LEVEL SECURITY;

-- Lecture : admins authentifiés uniquement
DROP POLICY IF EXISTS "Admin read parametres_admin" ON public.parametres_admin;
CREATE POLICY "Admin read parametres_admin"
  ON public.parametres_admin FOR SELECT
  USING (auth.role() = 'authenticated');

-- Écriture : admins authentifiés uniquement
DROP POLICY IF EXISTS "Admin write parametres_admin" ON public.parametres_admin;
CREATE POLICY "Admin write parametres_admin"
  ON public.parametres_admin FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Valeurs par défaut
INSERT INTO public.parametres_admin (cle, valeur) VALUES
  ('acompte_percent',   '30'),
  ('contact_email',     ''),
  ('contact_telephone', ''),
  ('adresse_organisme', ''),
  ('siret_organisme',   ''),
  ('nom_organisme',     'Beauty Home Concept')
ON CONFLICT (cle) DO NOTHING;

-- ── 4. Bucket Supabase Storage pour les contrats signés ───────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- Lecture : admins authentifiés uniquement (pour télécharger les contrats signés)
DROP POLICY IF EXISTS "Admin read contracts bucket" ON storage.objects;
CREATE POLICY "Admin read contracts bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'contracts' AND auth.role() = 'authenticated');

-- Écriture : service role (depuis l'API /api/contract/sign)
DROP POLICY IF EXISTS "Service role write contracts bucket" ON storage.objects;
CREATE POLICY "Service role write contracts bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'contracts');
