import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CompactAnimeCard } from "@/components/CompactAnimeCard";
import { AiringScheduleStrip } from "@/components/AiringScheduleStrip";
import { Top10Sidebar } from "@/components/Top10Sidebar";
import { NewsSidebar } from "@/components/NewsSidebar";
import { LiveCountdown } from "@/components/LiveCountdown";
import { PosterRowSkeleton, HeroSkeleton } from "@/components/Skeletons";
import {
  getTopAiring,
  getMostPopular,
  getLatestCompleted,
  getTopTen,
  getTodaysSchedule,
  getNextBigRelease,
  jikanPosterUrl,
  type JikanAnime,
} from "@/lib/jikan";

/**
 * Module 3 — HiAnime-style Anime Hub.
 *  ┌─ Spotlight Hero
 *  ├─ Estimated Schedule strip (today's airing)
 *  └─ 2-column body: 75% dense grids · 25% Countdown + Top 10 + News
 */
const AnimeHub = () => {
  const topAiring = useQuery({ queryKey: ["jikan", "top-airing"], queryFn: getTopAiring });
  const popular = useQuery({ queryKey: ["jikan", "most-popular"], queryFn: getMostPopular });
  const latest = useQuery({ queryKey: ["jikan", "latest-completed"], queryFn: getLatestCompleted });
  const top10 = useQuery({ queryKey: ["jikan", "top-10"], queryFn: getTopTen });
  const today = useQuery({ queryKey: ["jikan", "today"], queryFn: getTodaysSchedule });
  const next = useQuery({ queryKey: ["jikan", "next-big"], queryFn: getNextBigRelease });

  // Spotlight rotator
  const spotlight = (top10.data ?? []).slice(0, 5);
  const [spotIdx, setSpotIdx] = useState(0);
  useEffect(() => {
    if (spotlight.length < 2) return;
    const t = setInterval(() => setSpotIdx((i) => (i + 1) % spotlight.length), 9000);
    return () => clearInterval(t);
  }, [spotlight.length]);

  const current = spotlight[spotIdx];

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />

      {/* ── Spotlight Hero ───────────────────────────────────────────────── */}
      <section className="relative h-[70vh] min-h-[480px] w-full overflow-hidden">
        {top10.isLoading ? (
          <HeroSkeleton />
        ) : (
          <>
            <AnimatePresence mode="sync">
              {current && (
                <motion.img
                  key={current.mal_id}
                  src={jikanPosterUrl(current) ?? undefined}
                  alt={current.title}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2 }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/40 to-transparent" />

            {current && (
              <div className="relative z-10 mx-auto max-w-7xl px-4 pt-32 sm:px-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  Top Trending Anime
                </p>
                <h1 className="font-display text-5xl tracking-wide text-foreground sm:text-6xl md:text-7xl">
                  {current.title_english || current.title}
                </h1>
                <p className="mt-3 line-clamp-3 max-w-xl text-sm text-foreground/80 sm:text-base">
                  {current.synopsis}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  {current.episodes && <span className="hi-badge hi-badge--ep">EP {current.episodes}</span>}
                  <span className="hi-badge hi-badge--sub">SUB</span>
                  <span className="hi-badge hi-badge--dub">DUB</span>
                  <span className="hi-badge hi-badge--hd">HD</span>
                </div>
              </div>
            )}

            <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
              {spotlight.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSpotIdx(i)}
                  aria-label={`Spotlight ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === spotIdx ? "w-8 bg-primary" : "w-3 bg-foreground/30 hover:bg-foreground/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── Estimated Schedule (Airing Today) ────────────────────────────── */}
      <AiringScheduleStrip items={today.data ?? []} loading={today.isLoading} />

      {/* ── Hi-density 2-column body ─────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[3fr_1fr]">
          {/* ─── LEFT 75% ── grids ──────────────────────────────────────── */}
          <div className="space-y-12">
            <Grid title="Recently Updated" loading={topAiring.isLoading} data={topAiring.data ?? []} />
            <Grid title="New Releases" loading={popular.isLoading} data={popular.data ?? []} />
            <Grid title="Latest Completed" loading={latest.isLoading} data={latest.data ?? []} />
          </div>

          {/* ─── RIGHT 25% ── countdown + top10 + news ─────────────────── */}
          <aside className="space-y-6">
            <NextBigCountdown next={next.data ?? null} loading={next.isLoading} />
            <Top10Sidebar items={top10.data ?? []} loading={top10.isLoading} />
            <NewsSidebar />
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

// ── Helpers ─────────────────────────────────────────────────────────────

interface GridProps { title: string; loading: boolean; data: JikanAnime[] }
function Grid({ title, loading, data }: GridProps) {
  return (
    <section>
      <h2 className="mb-5 flex items-center gap-2 font-display text-2xl tracking-wide text-foreground sm:text-3xl">
        <span className="inline-block h-4 w-1 bg-primary" /> {title}
      </h2>
      {loading ? (
        <PosterRowSkeleton />
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {data.slice(0, 15).map((a, i) => (
            <CompactAnimeCard key={a.mal_id} anime={a} delay={Math.min(i * 0.025, 0.3)} />
          ))}
        </div>
      )}
    </section>
  );
}

function NextBigCountdown({ next, loading }: { next: JikanAnime | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="h-40 animate-pulse rounded-lg border border-border/40 bg-card/40" />
    );
  }
  const title = next?.title_english || next?.title || "Next Big Release";
  const target = next?.aired?.from ?? undefined;
  return (
    <div className="overflow-hidden rounded-lg border border-primary/30 bg-card/40">
      <div className="border-b border-border/40 px-4 py-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Next Big Release</p>
        <p className="mt-1 truncate font-display text-lg tracking-wide text-foreground" title={title}>
          {title}
        </p>
      </div>
      <div className="px-2 pb-2">
        <LiveCountdown target={target} label={title} />
      </div>
    </div>
  );
}

export default AnimeHub;
