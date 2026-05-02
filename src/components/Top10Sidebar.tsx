import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import type { AniListListItem } from "@/lib/anilist";
import { searchMulti } from "@/lib/tmdb";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  items: AniListListItem[];
  loading: boolean;
}

/**
 * Right-rail Top 10. Index numbers are MASSIVE, transparent, with a
 * 2.5px red neon stroke and a soft red drop-shadow glow.
 */
export function Top10Sidebar({ items, loading }: Props) {
  const navigate = useNavigate();

  async function open(title: string) {
    const hits = await searchMulti(title);
    const real = hits.find((r) => r.poster_path);
    if (real) navigate(`/watch/${real.media_type === "tv" ? "tv" : "movie"}/${real.id}`);
  }

  return (
    <section className="rounded-lg border border-border/40 bg-card/40 p-4">
      <h3 className="mb-4 flex items-center gap-2 font-display text-xl tracking-wide text-foreground">
        <span className="inline-block h-3 w-1 bg-primary" /> Top 10
      </h3>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <ol className="space-y-2.5">
          {items.slice(0, 10).map((a, i) => (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="anime-glow-hover relative flex items-center gap-3 overflow-hidden rounded-md border border-transparent bg-zinc-900/60 pr-2 pl-16 hover:border-primary/40"
            >
              <span className="hianime-index hianime-index--sm">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-shrink-0">
                {a.poster && (
                  <img
                    src={a.poster}
                    alt=""
                    loading="lazy"
                    className="h-16 w-12 rounded object-cover"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => open(a.title)}
                className="min-w-0 flex-1 py-1 text-left"
              >
                <p className="truncate text-sm font-bold text-foreground transition-colors hover:text-primary">
                  {a.title}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  {a.score != null && (
                    <span className="flex items-center gap-1">
                      <Star className="h-2.5 w-2.5 fill-primary text-primary" />
                      {a.score.toFixed(1)}
                    </span>
                  )}
                  {a.episodes && <span>· EP {a.episodes}</span>}
                  <span className="hi-badge hi-badge--sub scale-90">SUB</span>
                  <span className="hi-badge hi-badge--dub scale-90">DUB</span>
                </div>
              </button>
            </motion.li>
          ))}
        </ol>
      )}
    </section>
  );
}
