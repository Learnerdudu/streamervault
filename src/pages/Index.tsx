import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroBanner } from "@/components/HeroBanner";
import { MovieCarousel } from "@/components/MovieCarousel";
import { AdBanner } from "@/components/AdBanner";
import { ContinueWatching } from "@/components/ContinueWatching";
import {
  getTrending,
  getCuratedItems,
  discoverByGenre,
  type TMDBMovie,
} from "@/lib/tmdb";
import { getTopGenre } from "@/lib/genreAffinity";

// Editorial Trending row
const TRENDING_PICKS: Array<{ id: number; type: "movie" | "tv" }> = [
  { id: 76479, type: "tv" },
  { id: 502356, type: "movie" },
  { id: 66732, type: "tv" },
];

// Mood collections — TMDB genre IDs
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
      discoverByGenre("tv", 35), // comedy as cult
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const heroItem = heroPool[0];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {heroItem && <HeroBanner item={heroItem} />}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-[100px] pb-16 sm:px-6">
        <AdBanner />
        <ContinueWatching />
        {picked.length > 0 && (
          <MovieCarousel title={t("rows.pickedForYou")} items={picked} mediaType="movie" />
        )}
        <MovieCarousel title={t("rows.trending")} items={trending} />
        <MovieCarousel title={t("rows.adrenaline")} items={adrenaline} mediaType="movie" />
        <MovieCarousel title={t("rows.lateNight")} items={lateNight} mediaType="movie" />
        <MovieCarousel title={t("rows.ethereal")} items={ethereal} mediaType="tv" />
        <MovieCarousel title={t("rows.vault")} items={vault} mediaType="movie" />
        <MovieCarousel title={t("rows.cult")} items={cult} mediaType="tv" />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
