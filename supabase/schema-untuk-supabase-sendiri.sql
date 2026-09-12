-- =====================================================================
-- Go-Q : skema lengkap untuk dijalankan di project Supabase Anda sendiri
-- Jalankan seluruh isi file ini sekali di SQL Editor.
-- =====================================================================

-- ---------- fungsi bantu: auto isi updated_at ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- 1. rankings  (skor permainan level biasa)
-- =====================================================================
create table if not exists public.rankings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age integer not null,
  op text not null,
  level integer not null,
  mode text not null,
  score integer not null,
  total integer not null,
  seconds integer not null,
  created_at timestamptz not null default now()
);

grant select, insert on public.rankings to anon, authenticated;
grant all on public.rankings to service_role;

alter table public.rankings enable row level security;

create policy "Anyone can view rankings"
  on public.rankings for select using (true);

create policy "Anyone can insert rankings"
  on public.rankings for insert with check (
    length(name) between 1 and 40
    and age between 1 and 120
    and score >= 0 and score <= total
    and total between 1 and 200
    and seconds between 0 and 100000
  );

create index if not exists rankings_score_idx on public.rankings (score desc, seconds asc);

-- =====================================================================
-- 2. players  (profil ringan per perangkat)
-- =====================================================================
create table if not exists public.players (
  player_key text primary key,
  name text not null,
  age integer not null,
  school text,
  country_code text not null default 'ID',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- hanya diakses lewat server (service_role): tanpa akses anon/authenticated
grant all on public.players to service_role;
alter table public.players enable row level security;

create trigger players_set_updated_at
  before update on public.players
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 3. competitions  (lomba)
-- =====================================================================
create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  join_code text not null unique,
  has_pin boolean not null default false,
  start_at timestamptz not null,
  ops text[] not null,
  difficulty text not null default 'mudah',
  difficulty_custom jsonb,
  input_type text not null default 'choices',
  duration_seconds integer not null default 60,
  total_questions integer not null default 50,
  status text not null default 'upcoming',
  question_seed bigint not null,
  started_at timestamptz,
  ended_at timestamptz,
  host_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.competitions to anon, authenticated;
grant all on public.competitions to service_role;

alter table public.competitions enable row level security;

create policy "Anyone can view competitions"
  on public.competitions for select using (true);

create index if not exists competitions_status_idx on public.competitions (status, start_at desc);

create trigger competitions_set_updated_at
  before update on public.competitions
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 4. competition_secrets  (PIN + kunci host, server-only)
-- =====================================================================
create table if not exists public.competition_secrets (
  competition_id uuid primary key references public.competitions(id) on delete cascade,
  host_key text not null,
  pin text,
  created_at timestamptz not null default now()
);

grant all on public.competition_secrets to service_role;
alter table public.competition_secrets enable row level security;
-- sengaja tanpa policy: hanya server (service_role) yang boleh membacanya

-- =====================================================================
-- 5. competition_participants  (peserta + skor)
-- =====================================================================
create table if not exists public.competition_participants (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  player_key text not null,
  name text not null,
  age integer not null,
  school text,
  country_code text not null default 'ID',
  score integer not null default 0,
  answered integer not null default 0,
  seconds integer not null default 0,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (competition_id, player_key)
);

grant select on public.competition_participants to anon, authenticated;
grant all on public.competition_participants to service_role;

alter table public.competition_participants enable row level security;

create policy "Anyone can view competition participants"
  on public.competition_participants for select using (true);

create index if not exists participants_board_idx
  on public.competition_participants (competition_id, score desc, seconds asc);

create trigger participants_set_updated_at
  before update on public.competition_participants
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 6. Realtime (papan peringkat langsung)
-- =====================================================================
alter publication supabase_realtime add table public.competitions;
alter publication supabase_realtime add table public.competition_participants;
