ALTER TABLE public.rankings DROP CONSTRAINT IF EXISTS rankings_op_check;
ALTER TABLE public.rankings ADD CONSTRAINT rankings_op_check CHECK (op IN ('+','-','x','/'));