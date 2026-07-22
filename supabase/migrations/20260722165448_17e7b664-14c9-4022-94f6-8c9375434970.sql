
CREATE TABLE public.rankings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  age INT NOT NULL,
  op TEXT NOT NULL CHECK (op IN ('+','-')),
  level INT NOT NULL CHECK (level BETWEEN 1 AND 4),
  mode TEXT NOT NULL CHECK (mode IN ('blind','choices')),
  score INT NOT NULL,
  total INT NOT NULL,
  seconds INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.rankings TO anon, authenticated;
GRANT ALL ON public.rankings TO service_role;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view rankings" ON public.rankings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert rankings" ON public.rankings FOR INSERT WITH CHECK (
  length(name) BETWEEN 1 AND 40
  AND age BETWEEN 1 AND 120
  AND score BETWEEN 0 AND total
  AND total BETWEEN 1 AND 200
  AND seconds BETWEEN 0 AND 100000
);
CREATE INDEX rankings_leaderboard_idx ON public.rankings (op, score DESC, seconds ASC);
