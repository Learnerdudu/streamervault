import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AnimeCard } from "@/components/AnimeCard";
import { PosterRowSkeleton, HeroSkeleton } from "@/components/Skeletons";
import {
  getTopAiring,
  getMostPopular,
  getMostFavorite,
  getLatestCompleted,
  getTopTen,
  getTodaysSchedule,
  jikanPosterUrl,
} from "@/lib/jikan";

/**
 * Module 3 — Anime Hub.
 * Spotlight cross-fade · Top 10 with HiAnime index numbers · 4 dense rows
 * · today's airing schedule. All data via Jikan, cached 60min.
 */
const AnimeHub = () => {
  const topAiring = useQuery({ queryKey: ["jikan", "top-airing"], queryFn: getTopAiring });
  const popular = useQuery({ queryKey: ["jikan", "most-popular"], queryFn: getMostPopular });
  const favorite = useQuery({ queryKey: ["jikan", "most-favorite"], queryFn: getMostFavorite });
  const latest = useQuery({ queryKey: ["jikan", "latest-completed"], queryFn: getLatestCompleted });
  const top10 = useQuery({ queryKey: ["jikan", "top-10"], queryFn: getTopTen });
  const today = useQuery({ queryKey: ["jikan", "today"], queryFn: getTodaysSchedule });

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
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Spotlight Hero with cross-fading backdrops */}
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
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

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

      <main className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6">
        <Section title="🔥 Top 10 This Week" loading={top10.isLoading} numbered data={top10.data ?? []} />
        <Section title="📡 Top Airing" loading={topAiring.isLoading} data={topAiring.data ?? []} />
        <Section title="⭐ Most Popular" loading={popular.isLoading} data={popular.data ?? []} />
        <Section title="❤️ Most Favorite" loading={favorite.isLoading} data={favorite.data ?? []} />
        <Section title="✅ Latest Completed" loading={latest.isLoading} data={latest.data ?? []} />
        <Section title="📺 Airing Today" loading={today.isLoading} data={today.data ?? []} />
      </main>

      <Footer />
    </div>
  );
};

interface SectionProps {
  title: string;
  loading: boolean;
  data: ReturnType<typeof getTopAiring> extends Promise<infer T> ? T : never;
  numbered?: boolean;
}
function Section({ title, loading, data, numbered }: SectionProps) {
  return (
    <section>
      <h2 className="mb-6 font-display text-3xl tracking-wide text-foreground">{title}</h2>
      {loading ? (
        <PosterRowSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {data.slice(0, numbered ? 10 : 12).map((a, i) => (
            <AnimeCard key={a.mal_id} anime={a} index={numbered ? i + 1 : undefined} />
          ))}
        </div>
      )}
    </section>
  );
}

export default AnimeHub;
