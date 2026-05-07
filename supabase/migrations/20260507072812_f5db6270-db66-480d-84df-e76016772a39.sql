-- Deduplicate any existing rows before adding the constraints
DELETE FROM public.watch_history a
USING public.watch_history b
WHERE a.ctid < b.ctid
  AND a.user_id = b.user_id
  AND a.tmdb_id = b.tmdb_id
  AND a.media_type = b.media_type;

DELETE FROM public.watch_later a
USING public.watch_later b
WHERE a.ctid < b.ctid
  AND a.user_id = b.user_id
  AND a.tmdb_id = b.tmdb_id
  AND a.media_type = b.media_type;

ALTER TABLE public.watch_history
  ADD CONSTRAINT watch_history_user_tmdb_media_unique
  UNIQUE (user_id, tmdb_id, media_type);

ALTER TABLE public.watch_later
  ADD CONSTRAINT watch_later_user_tmdb_media_unique
  UNIQUE (user_id, tmdb_id, media_type);