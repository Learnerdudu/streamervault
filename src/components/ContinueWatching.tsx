import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/externalSupabase";
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
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());

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
      .then(({ data, error }) => {
        if (error) {
          console.error("[WatchHistory] fetch failed:", error.message, error);
          return;
        }
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

  function handleRemove(it: Item) {
    if (!user) return;
    const key = `${it.mediaType}-${it.movie.id}`;

    // Optimistic hide
    setHiddenKeys((prev) => new Set(prev).add(key));

    // Schedule the actual delete in 3s
    let undone = false;
    const timer = setTimeout(async () => {
      if (undone) return;
      await supabase
        .from("watch_history")
        .delete()
        .eq("user_id", user.id)
        .eq("tmdb_id", it.movie.id)
        .eq("media_type", it.mediaType);
      // Drop from local list permanently
      setItems((prev) => prev.filter((x) => `${x.mediaType}-${x.movie.id}` !== key));
    }, 3000);

    toast("Removed from Continue Watching", {
      duration: 3000,
      action: {
        label: "Undo",
        onClick: () => {
          undone = true;
          clearTimeout(timer);
          setHiddenKeys((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        },
      },
    });
  }

  const visible = items.filter(
    (it) => !hiddenKeys.has(`${it.mediaType}-${it.movie.id}`),
  );

  if (!user || visible.length === 0) return null;

  return (
    <div className="mt-20 px-4 sm:px-8 md:px-12">
      <h2 className="mb-3 font-display text-2xl tracking-wide text-foreground sm:text-3xl">
        {t("rows.continueWatching")}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {visible.map((it) => (
          <div key={`${it.mediaType}-${it.movie.id}`} className="group relative">
            <button
              onClick={() => handleRemove(it)}
              aria-label="Remove from Continue Watching"
              className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 backdrop-blur-md transition-all hover:bg-primary hover:text-primary-foreground group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <SmartResumeCard
              item={it.movie}
              mediaType={it.mediaType}
              progressSeconds={it.progressSeconds}
              season={it.season}
              episode={it.episode}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
