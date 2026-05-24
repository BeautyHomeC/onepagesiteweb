-- ─── google_rating ─────────────────────────────────────────────────────────
create table if not exists google_rating (
  id int primary key default 1 check (id = 1),
  note decimal(2,1) not null default 5.0,
  nb_avis int not null default 0,
  google_url text not null default '',
  updated_at timestamptz not null default now()
);

alter table google_rating enable row level security;

create policy "Public read google_rating"
  on google_rating for select using (true);

create policy "Service role all google_rating"
  on google_rating for all using (auth.role() = 'service_role');

-- seed the single row so upsert works immediately
insert into google_rating (id, note, nb_avis, google_url)
values (1, 5.0, 0, '')
on conflict (id) do nothing;

-- ─── contact_messages ───────────────────────────────────────────────────────
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  prenom text not null,
  nom text not null,
  email text not null,
  message text not null,
  lu boolean not null default false,
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;

create policy "Public insert contact_messages"
  on contact_messages for insert with check (true);

create policy "Service role all contact_messages"
  on contact_messages for all using (auth.role() = 'service_role');
