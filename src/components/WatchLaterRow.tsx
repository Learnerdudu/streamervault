import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { supabase } from "@/lib/externalSupabase";
import { useAuth } from "@/hooks/useAuth";
import { getImageUrl } from "@/lib/tmdb";

interface Row {
  id: string;
  tmdb_id: number;
  media_type: "movie" | "tv";
  title: string;
  poster_path: string | null;
}

/** Homepage row showing the user's latest Watch Later items. */
export function WatchLaterRow() {
  const { user } = useAuth();
  const [items, setItems] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    supabase
      .from("watch_later")
      .select("id, tmdb_id, media_type, title, poster_path")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false })
      .limit(12)
      .then(({ data, error }) => {
        if (error) {
          console.error("[WatchLater] row fetch failed:", error.message);
          return;
        }
        setItems((data ?? []) as Row[]);
      });
  }, [user]);

  if (!user || items.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold tracking-wide text-foreground sm:text-xl">
        <Bookmark className="h-5 w-5 text-primary" /> Watch Later
      </h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {items.map((it) => {
          const url = it.poster_path ? getImageUrl(it.poster_path, "w342") : null;
          return (
            <Link
              key={it.id}
              to={`/watch/${it.media_type}/${it.tmdb_id}`}
              className="group block"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-white/10 bg-muted shadow-md transition-transform group-hover:scale-[1.03]">
                {url ? (
                  <img src={url} alt={it.title} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary/10 to-secondary/30" />
                )}
              </div>
              <p className="mt-2 line-clamp-1 text-xs font-medium text-foreground">{it.title}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
