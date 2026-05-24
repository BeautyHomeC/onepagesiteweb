-- ============================================================
-- Sprint 1 — Témoignages vidéo + Liste d'attente
-- ============================================================

-- ── Table : temoignages ──────────────────────────────────────
create table if not exists temoignages (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  role        text,
  texte       text not null,
  note        int  not null default 5 check (note between 1 and 5),
  photo_url   text,
  video_url   text,
  video_type  text check (video_type in ('youtube', 'vimeo', 'upload')),
  featured    boolean not null default false,
  ordre       int     not null default 0,
  created_at  timestamptz not null default now()
);

-- RLS
alter table temoignages enable row level security;

create policy "Public read temoignages"
  on temoignages for select
  using (true);

create policy "Service role full access temoignages"
  on temoignages for all
  using (auth.role() = 'service_role');

-- ── Table : liste_attente ────────────────────────────────────
create table if not exists liste_attente (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references sessions(id) on delete cascade,
  prenom       text not null,
  nom          text not null,
  email        text not null,
  created_at   timestamptz not null default now(),
  notified_at  timestamptz
);

create index if not exists idx_liste_attente_session
  on liste_attente(session_id);

-- RLS
alter table liste_attente enable row level security;

create policy "Anyone can insert waitlist entry"
  on liste_attente for insert
  with check (true);

create policy "Service role full access waitlist"
  on liste_attente for all
  using (auth.role() = 'service_role');

-- ── Storage buckets ──────────────────────────────────────────
-- Run manually in the Supabase dashboard → Storage, or via the CLI:
--
--   supabase storage create temoignages-media --public
--   supabase storage create programme-pdfs    --public
--
-- Or via SQL (requires pg_extensions.storage_objects to be available):
-- insert into storage.buckets (id, name, public) values ('temoignages-media', 'temoignages-media', true) on conflict do nothing;
-- insert into storage.buckets (id, name, public) values ('programme-pdfs',    'programme-pdfs',    true) on conflict do nothing;

-- Storage RLS (run after buckets are created):
-- create policy "Public read temoignages-media"  on storage.objects for select using (bucket_id = 'temoignages-media');
-- create policy "Service role write temoignages-media" on storage.objects for insert using (bucket_id = 'temoignages-media' and auth.role() = 'service_role');
-- create policy "Public read programme-pdfs"     on storage.objects for select using (bucket_id = 'programme-pdfs');
-- create policy "Service role write programme-pdfs" on storage.objects for insert using (bucket_id = 'programme-pdfs' and auth.role() = 'service_role');
