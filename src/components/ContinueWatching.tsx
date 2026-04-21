import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MovieCarousel } from "@/components/MovieCarousel";
import type { TMDBMovie } from "@/lib/tmdb";

interface Row {
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
}

export function ContinueWatching() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [items, setItems] = useState<TMDBMovie[]>([]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    supabase
      .from("watch_history")
      .select("tmdb_id, media_type, title, poster_path")
      .eq("user_id", user.id)
      .order("watched_at", { ascending: false })
      .limit(12)
      .then(({ data }) => {
        if (!data) return;
        setItems(
          (data as Row[]).map((r) => ({
            id: r.tmdb_id,
            title: r.media_type === "movie" ? r.title : undefined,
            name: r.media_type === "tv" ? r.title : undefined,
            poster_path: r.poster_path,
            backdrop_path: null,
            overview: "",
            vote_average: 0,
            media_type: r.media_type,
          })),
        );
      });
  }, [user]);

  if (!user || items.length === 0) return null;
  // Wrapper enforces 80px+ vertical space below the AdBanner / Hero.
  return (
    <div className="mt-20">
      <MovieCarousel title={t("rows.continueWatching")} items={items} />
    </div>
  );
}
