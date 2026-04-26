import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { jikanPosterUrl, type JikanAnime } from "@/lib/jikan";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  items: JikanAnime[];
  loading: boolean;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * "Estimated Schedule" strip — horizontal scroller showing today's airing
 * anime with air time, episode number and title. Sharp red time labels.
 */
export function AiringScheduleStrip({ items, loading }: Props) {
  const today = DAY_NAMES[new Date().getDay()];

  return (
    <section className="border-y border-border/40 bg-zinc-950/80 py-5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-xl tracking-wide text-foreground sm:text-2xl">
            <span className="text-primary">●</span> Estimated Schedule
          </h2>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Airing {today}
          </span>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-72 flex-shrink-0 rounded-md" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">No releases scheduled today.</p>
        ) : (
          <div className="carousel-row">
            {items.map((a, idx) => {
              const time = a.broadcast?.time ?? "TBA";
              const ep = a.episodes ?? "?";
              const title = a.title_english || a.title;
              const poster = jikanPosterUrl(a);
              return (
                <motion.div
                  key={a.mal_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.3) }}
                  className="anime-glow-hover flex w-72 flex-shrink-0 items-stretch gap-3 rounded-md border border-border/40 bg-card/60 p-2"
                >
                  {poster && (
                    <img
                      src={poster}
                      alt=""
                      loading="lazy"
                      className="h-20 w-14 flex-shrink-0 rounded object-cover"
                    />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                    <p className="truncate text-sm font-bold text-foreground" title={title}>
                      {title}
                    </p>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-primary">
                        <Clock className="h-3 w-3" />
                        {time}
                      </span>
                      <span className="rounded-sm bg-primary/15 px-1.5 py-0.5 font-bold uppercase tracking-wider text-primary">
                        EP {ep}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
