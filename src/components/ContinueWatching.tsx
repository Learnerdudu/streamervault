import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SmartResumeCard } from "@/components/SmartResumeCard";
import type { TMDBMovie } from "@/lib/tmdb";

interface Row {
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  progress_seconds: number;
  season: number | null;
  episode: number | null;
}

interface Item {
  movie: TMDBMovie;
  mediaType: "movie" | "tv";
  progressSeconds: number;
  season: number | null;
  episode: number | null;
}

export function ContinueWatching() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    supabase
      .from("watch_history")
      .select("tmdb_id, media_type, title, poster_path, progress_seconds, season, episode")
      .eq("user_id", user.id)
      .order("watched_at", { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (!data) return;
        setItems(
          (data as Row[]).map((r) => ({
            movie: {
              id: r.tmdb_id,
              title: r.media_type === "movie" ? r.title : undefined,
              name: r.media_type === "tv" ? r.title : undefined,
              poster_path: r.poster_path,
              backdrop_path: null,
              overview: "",
              vote_average: 0,
              media_type: r.media_type,
            },
            mediaType: r.media_type,
            progressSeconds: r.progress_seconds ?? 0,
            season: r.season,
            episode: r.episode,
          })),
        );
      });
  }, [user]);

  if (!user || items.length === 0) return null;

  return (
    <div className="mt-20 px-4 sm:px-8 md:px-12">
      <h2 className="mb-3 font-display text-2xl tracking-wide text-foreground sm:text-3xl">
        {t("rows.continueWatching")}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((it) => (
          <SmartResumeCard
            key={`${it.mediaType}-${it.movie.id}`}
            item={it.movie}
            mediaType={it.mediaType}
            progressSeconds={it.progressSeconds}
            season={it.season}
            episode={it.episode}
          />
        ))}
      </div>
    </div>
  );
}
