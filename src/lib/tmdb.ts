const TMDB_API_KEY = "2dca580c2a14b55200e784d157207b4d";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p";

export const getImageUrl = (path: string | null, size: string = "w500") =>
  path ? `${IMG_BASE}/${size}${path}` : null;

export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
}

export interface TMDBSeason {
  season_number: number;
  episode_count: number;
  name: string;
}

export interface TMDBTVDetails {
  id: number;
  name: string;
  seasons: TMDBSeason[];
  external_ids?: { imdb_id: string };
  number_of_seasons: number;
}

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

export async function getTrending(type: "movie" | "tv" | "all" = "all") {
  const data = await tmdbFetch<{ results: TMDBMovie[] }>(`/trending/${type}/week`);
  return data.results;
}

export async function getPopularMovies() {
  const data = await tmdbFetch<{ results: TMDBMovie[] }>("/movie/popular");
  return data.results;
}

export async function getTopRatedMovies() {
  const data = await tmdbFetch<{ results: TMDBMovie[] }>("/movie/top_rated");
  return data.results;
}

export async function getPopularTV() {
  const data = await tmdbFetch<{ results: TMDBMovie[] }>("/tv/popular");
  return data.results;
}

export async function getTopRatedTV() {
  const data = await tmdbFetch<{ results: TMDBMovie[] }>("/tv/top_rated");
  return data.results;
}

export async function getMovieDetails(id: number) {
  return tmdbFetch<TMDBMovie & { imdb_id: string }>(`/movie/${id}`, { append_to_response: "external_ids" });
}

export async function getTVDetails(id: number) {
  return tmdbFetch<TMDBTVDetails>(`/tv/${id}`, { append_to_response: "external_ids" });
}

export async function searchMulti(query: string) {
  const data = await tmdbFetch<{ results: TMDBMovie[] }>("/search/multi", { query });
  return data.results.filter((r) => r.media_type === "movie" || r.media_type === "tv");
}

/**
 * Get a curated list of TMDB items by ID. Used for the editorial Trending row
 * (The Boys S5, Super Mario Galaxy Movie, Stranger Things: Tales from '85).
 */
export async function getCuratedItems(
  items: Array<{ id: number; type: "movie" | "tv" }>,
): Promise<TMDBMovie[]> {
  const results = await Promise.all(
    items.map(async ({ id, type }) => {
      try {
        const data = await tmdbFetch<TMDBMovie>(`/${type}/${id}`);
        return { ...data, media_type: type };
      } catch {
        return null;
      }
    }),
  );
  return results.filter((r): r is TMDBMovie => r !== null) as TMDBMovie[];
}

/**
 * Build embed URL. ALL servers receive the numeric TMDB ID (no IMDB).
 * Server 4 = Legacy vidsrc-embed.ru, kept as the primary fallback.
 */
export function getPlayerUrl(
  tmdbId: number,
  season?: number,
  episode?: number,
  server: number = 1,
) {
  const isTV = season !== undefined && episode !== undefined;

  switch (server) {
    case 1:
      return isTV
        ? `https://vaplayer.ru/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://vaplayer.ru/embed/movie/${tmdbId}`;
    case 2:
      return isTV
        ? `https://streamimdb.me/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://streamimdb.me/embed/movie/${tmdbId}`;
    case 3:
      return isTV
        ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`
        : `https://vidlink.pro/movie/${tmdbId}`;
    case 4:
      return isTV
        ? `https://vidsrc-embed.ru/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`
        : `https://vidsrc-embed.ru/embed/movie?tmdb=${tmdbId}`;
    default:
      return isTV
        ? `https://vaplayer.ru/embed/tv/${tmdbId}/${season}/${episode}`
        : `https://vaplayer.ru/embed/movie/${tmdbId}`;
  }
}
