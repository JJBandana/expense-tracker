ALTER TABLE public.transactions ALTER COLUMN date TYPE timestamptz USING date::timestamptz;
ALTER TABLE public.transactions ALTER COLUMN date SET DEFAULT now();
