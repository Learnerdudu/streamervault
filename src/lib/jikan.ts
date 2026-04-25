/**
 * Jikan API (MyAnimeList) — Anime Hub data + Top 10 + airing schedules.
 * Free, no auth, but rate-limited (~3 req/sec, 60/min). React Query caches
 * everything for 60min via the global config.
 */

import { appConfig } from "@/config/appConfig";
import type { TMDBMovie } from "@/lib/tmdb";

export interface JikanAnime {
  mal_id: number;
  title: string;
  title_english: string | null;
  synopsis: string | null;
  episodes: number | null;
  score: number | null;
  rating: string | null;
  status: string;
  year: number | null;
  images: {
    jpg: { large_image_url: string | null; image_url: string | null };
    webp: { large_image_url: string | null; image_url: string | null };
  };
  trailer?: { youtube_id: string | null };
  studios?: Array<{ name: string }>;
  genres?: Array<{ mal_id: number; name: string }>;
  aired?: { from: string | null };
  broadcast?: { day: string | null; time: string | null };
}

const BLOCKED_RATINGS = ["Rx", "R+"];

function safe(items: JikanAnime[]): JikanAnime[] {
  return items.filter((a) => {
    if (a.rating && BLOCKED_RATINGS.some((r) => a.rating!.startsWith(r))) return false;
    const s = (a.studios ?? []).map((x) => x.name?.toLowerCase());
    if (s.some((n) => ["pink pineapple", "bunnywalker", "green bunny", "queen bee", "t-rex", "mary jane", "milky animation label"].includes(n))) return false;
    return true;
  });
}

async function jikan<T>(path: string): Promise<T> {
  const res = await fetch(`${appConfig.JIKAN_BASE}${path}`);
  if (!res.ok) throw new Error(`Jikan ${res.status}`);
  return res.json();
}

export async function getTopAiring(): Promise<JikanAnime[]> {
  const data = await jikan<{ data: JikanAnime[] }>("/top/anime?filter=airing&limit=20&sfw=true");
  return safe(data.data);
}

export async function getMostPopular(): Promise<JikanAnime[]> {
  const data = await jikan<{ data: JikanAnime[] }>("/top/anime?filter=bypopularity&limit=20&sfw=true");
  return safe(data.data);
}

export async function getMostFavorite(): Promise<JikanAnime[]> {
  const data = await jikan<{ data: JikanAnime[] }>("/top/anime?filter=favorite&limit=20&sfw=true");
  return safe(data.data);
}

export async function getLatestCompleted(): Promise<JikanAnime[]> {
  const data = await jikan<{ data: JikanAnime[] }>("/anime?status=complete&order_by=end_date&sort=desc&limit=20&sfw=true");
  return safe(data.data);
}

export async function getTopTen(): Promise<JikanAnime[]> {
  const data = await jikan<{ data: JikanAnime[] }>("/top/anime?limit=10&sfw=true");
  return safe(data.data);
}

const DAY_MAP = ["sundays", "mondays", "tuesdays", "wednesdays", "thursdays", "fridays", "saturdays"];
export async function getTodaysSchedule(): Promise<JikanAnime[]> {
  const day = DAY_MAP[new Date().getDay()];
  const data = await jikan<{ data: JikanAnime[] }>(`/schedules?filter=${day}&sfw=true&limit=15`);
  return safe(data.data);
}

/** Convert Jikan → TMDBMovie-compatible shape so HoverPreviewCard works. */
export function jikanToTMDB(a: JikanAnime): TMDBMovie & { episodes?: number | null; mal_id?: number } {
  const title = a.title_english || a.title;
  return {
    id: a.mal_id + 1_000_000, // namespaced
    title,
    name: title,
    poster_path: null, // we set full URL via override below
    backdrop_path: null,
    overview: a.synopsis ?? "",
    vote_average: a.score ?? 0,
    first_air_date: a.aired?.from?.slice(0, 10) ?? (a.year ? `${a.year}-01-01` : ""),
    media_type: "tv",
    genre_ids: [16],
    episodes: a.episodes,
    mal_id: a.mal_id,
  };
}

/** Anime poster URL helper since Jikan returns full URLs not TMDB paths. */
export function jikanPosterUrl(a: JikanAnime): string | null {
  return a.images.webp.large_image_url || a.images.jpg.large_image_url;
}
