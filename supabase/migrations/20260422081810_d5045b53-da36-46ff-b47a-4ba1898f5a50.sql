ALTER TABLE public.watch_history
ADD COLUMN IF NOT EXISTS progress_seconds integer NOT NULL DEFAULT 0;