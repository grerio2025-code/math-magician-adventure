-- Competitions
CREATE TABLE public.competitions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  join_code text NOT NULL UNIQUE,
  has_pin boolean NOT NULL DEFAULT false,
  start_at timestamptz NOT NULL,
  ops text[] NOT NULL,
  difficulty text NOT NULL DEFAULT 'mudah',
  difficulty_custom jsonb,
  input_type text NOT NULL DEFAULT 'choices',
  duration_seconds integer NOT NULL DEFAULT 60,
  total_questions integer NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'upcoming',
  question_seed bigint NOT NULL,
  started_at timestamptz,
  ended_at timestamptz,
  host_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT competitions_status_check CHECK (status IN ('upcoming','live','completed')),
  CONSTRAINT competitions_input_type_check CHECK (input_type IN ('blind','choices')),
  CONSTRAINT competitions_difficulty_check CHECK (difficulty IN ('mudah','sedang','sulit','custom')),
  CONSTRAINT competitions_duration_check CHECK (duration_seconds BETWEEN 15 AND 3600),
  CONSTRAINT competitions_total_check CHECK (total_questions BETWEEN 5 AND 200),
  CONSTRAINT competitions_title_check CHECK (length(title) BETWEEN 1 AND 120),
  CONSTRAINT competitions_ops_check CHECK (array_length(ops, 1) BETWEEN 1 AND 4)
);

GRANT SELECT ON public.competitions TO anon, authenticated;
GRANT ALL ON public.competitions TO service_role;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view competitions"
  ON public.competitions FOR SELECT USING (true);

-- Secrets (host key + PIN), never readable by clients
CREATE TABLE public.competition_secrets (
  competition_id uuid NOT NULL PRIMARY KEY REFERENCES public.competitions(id) ON DELETE CASCADE,
  host_key text NOT NULL,
  pin text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.competition_secrets TO service_role;
ALTER TABLE public.competition_secrets ENABLE ROW LEVEL SECURITY;

-- Participants
CREATE TABLE public.competition_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  player_key text NOT NULL,
  name text NOT NULL,
  age integer NOT NULL,
  school text,
  country_code text NOT NULL DEFAULT 'ID',
  score integer NOT NULL DEFAULT 0,
  answered integer NOT NULL DEFAULT 0,
  seconds integer NOT NULL DEFAULT 0,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, player_key),
  CONSTRAINT participants_name_check CHECK (length(name) BETWEEN 1 AND 40),
  CONSTRAINT participants_age_check CHECK (age BETWEEN 1 AND 120),
  CONSTRAINT participants_score_check CHECK (score >= 0),
  CONSTRAINT participants_seconds_check CHECK (seconds BETWEEN 0 AND 100000)
);

GRANT SELECT ON public.competition_participants TO anon, authenticated;
GRANT ALL ON public.competition_participants TO service_role;
ALTER TABLE public.competition_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view competition participants"
  ON public.competition_participants FOR SELECT USING (true);

-- Lightweight per-device player profiles
CREATE TABLE public.players (
  player_key text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  age integer NOT NULL,
  school text,
  country_code text NOT NULL DEFAULT 'ID',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT players_name_check CHECK (length(name) BETWEEN 1 AND 40),
  CONSTRAINT players_age_check CHECK (age BETWEEN 1 AND 120)
);

GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER competitions_set_updated_at
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER participants_set_updated_at
  BEFORE UPDATE ON public.competition_participants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER players_set_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX competitions_status_start_idx ON public.competitions (status, start_at DESC);
CREATE INDEX participants_competition_idx ON public.competition_participants (competition_id, score DESC, seconds ASC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.competitions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_participants;