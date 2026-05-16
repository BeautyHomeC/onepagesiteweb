-- Création des tables

CREATE TABLE public.formations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  titre text NOT NULL,
  description text,
  prix numeric NOT NULL,
  duree text,
  image_url text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  formation_id uuid REFERENCES public.formations(id) ON DELETE CASCADE,
  date_debut date NOT NULL,
  date_fin date NOT NULL,
  places_disponibles integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.reservations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.sessions(id) ON DELETE RESTRICT,
  nom_client text NOT NULL,
  email_client text NOT NULL,
  telephone_client text NOT NULL,
  stripe_payment_id text UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- Activation de RLS (Row Level Security)
ALTER TABLE public.formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture publique
CREATE POLICY "Les formations sont visibles par tous" ON public.formations FOR SELECT USING (true);
CREATE POLICY "Les sessions sont visibles par tous" ON public.sessions FOR SELECT USING (true);

-- Politiques administrateur (Utilisateurs authentifiés via Supabase Auth)
CREATE POLICY "Admin full access formations" ON public.formations USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access sessions" ON public.sessions USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access reservations" ON public.reservations USING (auth.role() = 'authenticated');

-- Le backend (Webhook Stripe) utilisera la clé SUPABASE_SERVICE_ROLE_KEY pour contourner RLS 
-- et insérer dans la table reservations et mettre à jour la table sessions.

-- Création du bucket de stockage pour les images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('formations_images', 'formations_images', true)
ON CONFLICT (id) DO NOTHING;

-- Autoriser la lecture publique des images
CREATE POLICY "Images visibles par tous" ON storage.objects FOR SELECT USING (bucket_id = 'formations_images');

-- Autoriser l'upload d'images par l'administrateur
CREATE POLICY "Admin peut uploader des images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'formations_images' AND auth.role() = 'authenticated');
