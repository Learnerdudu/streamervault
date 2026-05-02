CREATE TABLE IF NOT EXISTS public.watch_later (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, tmdb_id, media_type)
);

ALTER TABLE public.watch_later ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own watch later"
  ON public.watch_later FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own watch later"
  ON public.watch_later FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own watch later"
  ON public.watch_later FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own watch later"
  ON public.watch_later FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_watch_later_user ON public.watch_later(user_id, added_at DESC);