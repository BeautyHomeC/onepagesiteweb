-- ─────────────────────────────────────────────────────────────────────────
--  Migration : ajout des champs nécessaires à la conformité Qualiopi / légale
--
--  À exécuter UNE FOIS dans Supabase > SQL Editor :
--    1. Va sur ton dashboard Supabase
--    2. SQL Editor → New query
--    3. Copie-colle ce fichier et clique "Run"
-- ─────────────────────────────────────────────────────────────────────────

-- Champs ajoutés à la table formations
ALTER TABLE public.formations
  ADD COLUMN IF NOT EXISTS duree_formation  text,          -- ex : "1 JOUR (7 HEURES) en présentiel"
  ADD COLUMN IF NOT EXISTS horaire          text,          -- ex : "9H30 / 17H"
  ADD COLUMN IF NOT EXISTS nombre_eleves    integer DEFAULT 2,
  ADD COLUMN IF NOT EXISTS programme_pdf_url text,         -- URL publique du programme PDF
  ADD COLUMN IF NOT EXISTS programme_file   text;          -- nom fichier (fallback si pas d'URL)

-- Champ ajouté à la table reservations pour la traçabilité du consentement
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS consent_cgv      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_rgpd     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_contrat  boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_timestamp timestamp with time zone,
  ADD COLUMN IF NOT EXISTS client_ip        text,
  ADD COLUMN IF NOT EXISTS instagram_client text,
  ADD COLUMN IF NOT EXISTS raison_sociale   text,
  ADD COLUMN IF NOT EXISTS siret_client     text,
  ADD COLUMN IF NOT EXISTS client_type      text DEFAULT 'particulier';

-- Bucket pour les programmes PDF (séparé des images, lecture publique)
INSERT INTO storage.buckets (id, name, public)
VALUES ('formations_documents', 'formations_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique des documents (programmes PDF, etc.)
DROP POLICY IF EXISTS "Documents formations visibles par tous" ON storage.objects;
CREATE POLICY "Documents formations visibles par tous"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'formations_documents');

-- Upload réservé aux admins authentifiés
DROP POLICY IF EXISTS "Admin peut uploader des documents formations" ON storage.objects;
CREATE POLICY "Admin peut uploader des documents formations"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'formations_documents' AND auth.role() = 'authenticated');
