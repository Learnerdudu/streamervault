import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SpotlightHero } from "@/components/SpotlightHero";
import { MovieCarousel } from "@/components/MovieCarousel";
import { MovieCard } from "@/components/MovieCard";
import { AdBanner } from "@/components/AdBanner";
import { ContinueWatching } from "@/components/ContinueWatching";
import { AnimeCategoriesNav } from "@/components/AnimeCategoriesNav";
import { CollectionsSection } from "@/components/CollectionsSection";

import {
  getTrending,
  getCuratedItems,
  discoverByGenre,
  discoverAnimeByDateRange,
  type TMDBMovie,
} from "@/lib/tmdb";
import { ANIME_SEASONS } from "@/lib/animeSeasons";
import { getTopGenre } from "@/lib/genreAffinity";

const TRENDING_PICKS: Array<{ id: number; type: "movie" | "tv" }> = [
  { id: 76479, type: "tv" },
  { id: 502356, type: "movie" },
  { id: 66732, type: "tv" },
];

const GENRE_ACTION = 28;
const GENRE_HORROR = 27;
const GENRE_DRAMA = 18;

const Index = () => {
  const { t } = useTranslation();
  const [trending, setTrending] = useState<TMDBMovie[]>([]);
  const [heroPool, setHeroPool] = useState<TMDBMovie[]>([]);
  const [adrenaline, setAdrenaline] = useState<TMDBMovie[]>([]);
  const [lateNight, setLateNight] = useState<TMDBMovie[]>([]);
  const [ethereal, setEthereal] = useState<TMDBMovie[]>([]);
  const [vault, setVault] = useState<TMDBMovie[]>([]);
  const [cult, setCult] = useState<TMDBMovie[]>([]);
  const [picked, setPicked] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);

  // Anime season filtering (instant, no reload)
  const [activeSeason, setActiveSeason] = useState<string | null>(null);
  const [seasonItems, setSeasonItems] = useState<TMDBMovie[]>([]);
  const [seasonLoading, setSeasonLoading] = useState(false);

  useEffect(() => {
    const topGenre = getTopGenre();
    const personalizedReq = topGenre
      ? discoverByGenre("movie", topGenre).catch(() => [])
      : Promise.resolve<TMDBMovie[]>([]);

    Promise.all([
      getCuratedItems(TRENDING_PICKS),
      getTrending(),
      discoverByGenre("movie", GENRE_ACTION),
      discoverByGenre("movie", GENRE_HORROR),
      discoverByGenre("tv", GENRE_DRAMA),
      discoverByGenre("movie", GENRE_DRAMA),
      discoverByGenre("tv", 35),
      personalizedReq,
    ])
      .then(([curated, trendingAll, action, horror, dramaTv, dramaMovie, comedyTv, personalized]) => {
        setTrending(curated);
        setHeroPool(trendingAll);
        setAdrenaline(action);
        setLateNight(horror);
        setEthereal(dramaTv);
        setVault(dramaMovie);
        setCult(comedyTv);
        setPicked(personalized);
      })
      .finally(() => setLoading(false));
  }, []);

  // Load anime when a season is selected
  useEffect(() => {
    if (!activeSeason) {
      setSeasonItems([]);
      return;
    }
    const season = ANIME_SEASONS.find((s) => s.id === activeSeason);
    if (!season) return;
    setSeasonLoading(true);
    Promise.all([
      discoverAnimeByDateRange("tv", season.from, season.to),
      discoverAnimeByDateRange("movie", season.from, season.to),
    ])
      .then(([tv, movies]) => {
        const merged = [...tv, ...movies].filter((i) => i.poster_path);
        setSeasonItems(merged);
      })
      .finally(() => setSeasonLoading(false));
  }, [activeSeason]);

  const activeLabel = useMemo(
    () => ANIME_SEASONS.find((s) => s.id === activeSeason)?.label ?? null,
    [activeSeason],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Spotlight rotates between top-3 trending titles */}
      {!activeSeason && heroPool.length > 0 && <SpotlightHero items={heroPool} />}

      <div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6">
          {/* Horizontal HiAnime category bar — sits below the hero */}
          <AnimeCategoriesNav activeSeasonId={activeSeason} onSelectSeason={setActiveSeason} />

          <AdBanner />

          {activeSeason ? (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-2xl tracking-wide text-foreground sm:text-3xl">
                  🌸 {activeLabel} Anime
                </h2>
                <button
                  onClick={() => setActiveSeason(null)}
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary"
                >
                  Clear filter
                </button>
              </div>
              {seasonLoading ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-[2/3] animate-pulse rounded-md bg-muted/40" />
                  ))}
                </div>
              ) : seasonItems.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No titles found for this season.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {seasonItems.map((item) => (
                    <MovieCard key={`${item.media_type}-${item.id}`} item={item} mediaType={item.media_type} />
                  ))}
                </div>
              )}
            </section>
          ) : (
            <>
              <ContinueWatching />
              <CollectionsSection />
              {picked.length > 0 && (
                <MovieCarousel title={t("rows.pickedForYou")} items={picked} mediaType="movie" />
              )}
              <MovieCarousel title={t("rows.trending")} items={trending} />
              <MovieCarousel title={t("rows.adrenaline")} items={adrenaline} mediaType="movie" />
              <MovieCarousel title={t("rows.lateNight")} items={lateNight} mediaType="movie" />
              <MovieCarousel title={t("rows.ethereal")} items={ethereal} mediaType="tv" />
              <MovieCarousel title={t("rows.vault")} items={vault} mediaType="movie" />
              <MovieCarousel title={t("rows.cult")} items={cult} mediaType="tv" />
            </>
          )}
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Index;
