import { sanitize } from "@/utils/SecurityMiddleware";
import { supabase } from "@/integrations/supabase/client";

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
  genre_ids?: number[];
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

export interface TMDBVideo {
  key: string;
  site: string;
  type: string;
  official: boolean;
  name: string;
}

// Iron Wall 2.0: synchronous sanitizer lives in src/utils/SecurityMiddleware.ts
// (re-exported as `purify` for any legacy importers).
export const purify = sanitize;

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  // Strict default: never request adult content. Callers can still override per-call.
  if (!("include_adult" in params)) {
    url.searchParams.set("include_adult", "false");
  }
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

export async function getTrending(type: "movie" | "tv" | "all" = "all") {
  const data = await tmdbFetch<{ results: TMDBMovie[] }>(`/trending/${type}/week`);
  return purify(data.results);
}

export async function getPopularMovies() {
  const data = await tmdbFetch<{ results: TMDBMovie[] }>("/movie/popular");
  return purify(data.results);
}

export async function getTopRatedMovies() {
  const data = await tmdbFetch<{ results: TMDBMovie[] }>("/movie/top_rated");
  return purify(data.results);
}

export async function getPopularTV() {
  const data = await tmdbFetch<{ results: TMDBMovie[] }>("/tv/popular");
  return purify(data.results);
}

export async function getTopRatedTV() {
  const data = await tmdbFetch<{ results: TMDBMovie[] }>("/tv/top_rated");
  return purify(data.results);
}

export async function getMovieDetails(id: number) {
  return tmdbFetch<TMDBMovie & { imdb_id: string; runtime?: number; genres?: { id: number; name: string }[] }>(
    `/movie/${id}`,
    { append_to_response: "external_ids" },
  );
}

export async function getTVDetails(id: number) {
  return tmdbFetch<TMDBTVDetails>(`/tv/${id}`, { append_to_response: "external_ids" });
}

export async function searchMulti(query: string) {
  const data = await tmdbFetch<{ results: TMDBMovie[] }>("/search/multi", { query });
  const filtered = data.results.filter((r) => r.media_type === "movie" || r.media_type === "tv");
  return purify(filtered);
}

export async function getCuratedItems(
  items: Array<{ id: number; type: "movie" | "tv" }>,
): Promise<TMDBMovie[]> {
  const results = await Promise.all(
    items.map(async ({ id, type }) => {
      try {
        const data = await tmdbFetch<TMDBMovie>(`/${type}/${id}`);
        return { ...data, media_type: type as string } as TMDBMovie;
      } catch {
        return null;
      }
    }),
  );
  return purify(results.filter((r): r is TMDBMovie => r !== null));
}

/** Discover by TMDB genre id — used for mood collections + personalization. */
export async function discoverByGenre(type: "movie" | "tv", genreId: number) {
  const data = await tmdbFetch<{ results: TMDBMovie[] }>(`/discover/${type}`, {
    with_genres: String(genreId),
    sort_by: "popularity.desc",
  });
  return purify(data.results.map((r) => ({ ...r, media_type: type as string })));
}

/**
 * Discover anime (Japanese animation, genre 16) within a date range.
 * Used for the seasonal Anime sidebar (Winter/Summer/Fall yearly windows).
 */
export async function discoverAnimeByDateRange(
  type: "tv" | "movie",
  fromDate: string,
  toDate: string,
) {
  const dateKeyFrom = type === "tv" ? "first_air_date.gte" : "primary_release_date.gte";
  const dateKeyTo = type === "tv" ? "first_air_date.lte" : "primary_release_date.lte";
  const data = await tmdbFetch<{ results: TMDBMovie[] }>(`/discover/${type}`, {
    with_genres: "16",
    with_original_language: "ja",
    sort_by: "popularity.desc",
    [dateKeyFrom]: fromDate,
    [dateKeyTo]: toDate,
  });
  return purify(data.results.map((r) => ({ ...r, media_type: type as string })));
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBCredits {
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

/** Fetch cast & crew for X-Ray mode. */
export async function getCredits(id: number, type: "movie" | "tv"): Promise<TMDBCredits> {
  return tmdbFetch<TMDBCredits>(`/${type}/${id}/credits`);
}

/** Fetch first official YouTube trailer/teaser key. Returns null if none. */
export async function getTrailerKey(id: number, type: "movie" | "tv"): Promise<string | null> {
  try {
    const data = await tmdbFetch<{ results: TMDBVideo[] }>(`/${type}/${id}/videos`);
    const videos = data.results.filter((v) => v.site === "YouTube");
    const official = videos.find((v) => v.official && v.type === "Trailer");
    const trailer = official || videos.find((v) => v.type === "Trailer") || videos.find((v) => v.type === "Teaser") || videos[0];
    return trailer?.key ?? null;
  } catch {
    return null;
  }
}

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
