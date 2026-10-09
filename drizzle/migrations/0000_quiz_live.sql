ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'speed';
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS current_question integer NOT NULL DEFAULT -1;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS question_started_at timestamptz;
ALTER TABLE public.competitions ADD COLUMN IF NOT EXISTS question_seconds integer NOT NULL DEFAULT 20;
ALTER TABLE public.competition_secrets ADD COLUMN IF NOT EXISTS mc_key text;

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  position integer NOT NULL,
  prompt text NOT NULL,
  choices text[],
  answer text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, position)
);
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  player_key text NOT NULL,
  position integer NOT NULL,
  correct boolean NOT NULL,
  ms integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (competition_id, player_key, position)
);
GRANT ALL ON public.quiz_answers TO service_role;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;