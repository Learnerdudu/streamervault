import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { jikanPosterUrl, type JikanAnime } from "@/lib/jikan";
import { searchMulti } from "@/lib/tmdb";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  items: JikanAnime[];
  loading: boolean;
}

/**
 * Right-rail Top 10 list with massive stroked red index numbers.
 * Sourced strictly from Jikan "Top Airing".
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
        <span className="inline-block h-3 w-1 bg-primary" /> Top 10 Airing
      </h3>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <ol className="space-y-2.5">
          {items.slice(0, 10).map((a, i) => {
            const title = a.title_english || a.title;
            return (
              <motion.li
                key={a.mal_id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="anime-glow-hover relative flex items-center gap-3 overflow-hidden rounded-md border border-transparent bg-zinc-900/60 pr-2 hover:border-primary/40"
              >
                <span className="hianime-index hianime-index--sm">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="ml-12 flex-shrink-0">
                  <img
                    src={jikanPosterUrl(a) ?? ""}
                    alt=""
                    loading="lazy"
                    className="h-16 w-12 rounded object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => open(title)}
                  className="min-w-0 flex-1 py-1 text-left"
                >
                  <p className="truncate text-sm font-bold text-foreground transition-colors hover:text-primary">
                    {title}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                    {a.score != null && (
                      <span className="flex items-center gap-1">
                        <Star className="h-2.5 w-2.5 fill-primary text-primary" />
                        {a.score.toFixed(1)}
                      </span>
                    )}
                    {a.episodes && <span>· EP {a.episodes}</span>}
                  </div>
                </button>
              </motion.li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
