import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroBanner } from "@/components/HeroBanner";
import { MovieCarousel } from "@/components/MovieCarousel";
import { AdBanner } from "@/components/AdBanner";
import {
  getTrending,
  getPopularMovies,
  getTopRatedMovies,
  getPopularTV,
  getTopRatedTV,
  getCuratedItems,
  type TMDBMovie,
} from "@/lib/tmdb";

// Editorial Trending row — TMDB IDs:
//   The Boys (TV) — 76479
//   The Super Mario Bros. Movie placeholder until "Galaxy" releases — 502356
//   Stranger Things (TV) — 66732 (Tales from '85 spinoff lives under same franchise)
const TRENDING_PICKS: Array<{ id: number; type: "movie" | "tv" }> = [
  { id: 76479, type: "tv" },
  { id: 502356, type: "movie" },
  { id: 66732, type: "tv" },
];

const Index = () => {
  const [trending, setTrending] = useState<TMDBMovie[]>([]);
  const [heroPool, setHeroPool] = useState<TMDBMovie[]>([]);
  const [popularMovies, setPopularMovies] = useState<TMDBMovie[]>([]);
  const [topMovies, setTopMovies] = useState<TMDBMovie[]>([]);
  const [popularTV, setPopularTV] = useState<TMDBMovie[]>([]);
  const [topTV, setTopTV] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCuratedItems(TRENDING_PICKS),
      getTrending(),
      getPopularMovies(),
      getTopRatedMovies(),
      getPopularTV(),
      getTopRatedTV(),
    ])
      .then(([curated, trendingAll, pm, tm, pt, tt]) => {
        setTrending(curated);
        setHeroPool(trendingAll);
        setPopularMovies(pm);
        setTopMovies(tm);
        setPopularTV(pt);
        setTopTV(tt);
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <AdBanner />
      </div>
      <div className="relative z-10 mx-auto mt-12 max-w-7xl px-4 pb-16 sm:px-6">
        <MovieCarousel title="🔥 Trending Now" items={trending} />
        <MovieCarousel title="Popular Movies" items={popularMovies} mediaType="movie" />
        <MovieCarousel title="Top Rated Movies" items={topMovies} mediaType="movie" />
        <MovieCarousel title="Popular TV Shows" items={popularTV} mediaType="tv" />
        <MovieCarousel title="Top Rated TV Shows" items={topTV} mediaType="tv" />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
