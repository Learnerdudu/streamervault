/**
 * AniList GraphQL — semantic anime search (Tier 2 of the Hyper-Search engine).
 * Used when TMDB returns < 5 hits, to catch plot/tag-based queries like
 * "boy with rubber powers".
 */

import { appConfig } from "@/config/appConfig";
import type { TMDBMovie } from "@/lib/tmdb";

interface AniListMedia {
  id: number;
  idMal: number | null;
  title: { romaji: string; english: string | null; native: string | null };
  description: string | null;
  averageScore: number | null;
  startDate: { year: number | null };
  coverImage: { large: string | null; extraLarge: string | null };
  bannerImage: string | null;
  isAdult: boolean;
  episodes: number | null;
  genres: string[];
}

const SEARCH_QUERY = `
  query ($s: String, $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      media(search: $s, type: ANIME, isAdult: false, sort: SEARCH_MATCH) {
        id
        idMal
        title { romaji english native }
        description(asHtml: false)
        averageScore
        startDate { year }
        coverImage { large extraLarge }
        bannerImage
        isAdult
        episodes
        genres
      }
    }
  }
`;

/** Convert AniList media → TMDBMovie-compatible shape so existing cards work. */
function toTMDBLike(m: AniListMedia): TMDBMovie & { episodes?: number | null } {
  const title = m.title.english || m.title.romaji || m.title.native || "Untitled";
  return {
    id: m.idMal ? m.idMal + 1_000_000 : m.id + 2_000_000, // namespaced to avoid TMDB collisions
    name: title,
    title,
    poster_path: m.coverImage.extraLarge || m.coverImage.large,
    backdrop_path: m.bannerImage,
    overview: (m.description || "").replace(/<[^>]+>/g, ""),
    vote_average: m.averageScore ? m.averageScore / 10 : 0,
    first_air_date: m.startDate.year ? `${m.startDate.year}-01-01` : "",
    media_type: "tv",
    genre_ids: m.genres.includes("Romance") ? [10749] : [16],
    episodes: m.episodes,
  };
}

// ─── Airing schedule (used by AnimeHub) ──────────────────────────────────────

export interface AniListSchedule {
  mal_id: number;
  anilist_id: number;
  title: string;
  episode: number | null;
  airingAt: number; // unix seconds
  poster: string | null;
  banner: string | null;
}

const SCHEDULE_QUERY = `
  query ($from: Int, $to: Int, $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      airingSchedules(airingAt_greater: $from, airingAt_lesser: $to, sort: TIME) {
        episode
        airingAt
        media {
          id
          idMal
          isAdult
          title { romaji english }
          coverImage { large extraLarge }
          bannerImage
          countryOfOrigin
          format
        }
      }
    }
  }
`;

interface ScheduleEntry {
  episode: number | null;
  airingAt: number;
  media: {
    id: number;
    idMal: number | null;
    isAdult: boolean;
    title: { romaji: string | null; english: string | null };
    coverImage: { large: string | null; extraLarge: string | null };
    bannerImage: string | null;
    countryOfOrigin: string | null;
    format: string | null;
  };
}

async function fetchSchedule(fromUnix: number, toUnix: number, perPage = 50): Promise<AniListSchedule[]> {
  const res = await fetch(appConfig.ANILIST_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      query: SCHEDULE_QUERY,
      variables: { from: fromUnix, to: toUnix, perPage },
    }),
  });
  if (!res.ok) throw new Error(`AniList ${res.status}`);
  const json = await res.json();
  const entries: ScheduleEntry[] = json?.data?.Page?.airingSchedules ?? [];
  return entries
    .filter((e) => !e.media.isAdult)
    .map((e) => ({
      mal_id: e.media.idMal ?? e.media.id,
      anilist_id: e.media.id,
      title: e.media.title.english || e.media.title.romaji || "Untitled",
      episode: e.episode,
      airingAt: e.airingAt,
      poster: e.media.coverImage.extraLarge || e.media.coverImage.large,
      banner: e.media.bannerImage,
    }));
}

/** Today's airing schedule (00:00 → 24:00 local time). */
export async function getAniListTodaysSchedule(): Promise<AniListSchedule[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(24, 0, 0, 0);
  return fetchSchedule(Math.floor(start.getTime() / 1000), Math.floor(end.getTime() / 1000), 50);
}

/** Upcoming episodes for the next 7 days. */
export async function getAniListWeekSchedule(): Promise<AniListSchedule[]> {
  const now = Math.floor(Date.now() / 1000);
  return fetchSchedule(now, now + 7 * 24 * 3600, 50);
}

/** Soonest single upcoming release (for the countdown sidebar). */
export async function getAniListNextRelease(): Promise<AniListSchedule | null> {
  const list = await getAniListWeekSchedule();
  return list[0] ?? null;
}

export async function searchAniList(query: string, perPage = 8): Promise<TMDBMovie[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(appConfig.ANILIST_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: SEARCH_QUERY, variables: { s: query, perPage } }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const media: AniListMedia[] = json?.data?.Page?.media ?? [];
    return media.filter((m) => !m.isAdult).map(toTMDBLike);
  } catch {
    return [];
  }
}

// ─── Anime list endpoints (AniList replaces Jikan for the Hub grids) ─────────

export interface AniListListItem {
  id: number;
  malId: number | null;
  title: string;
  poster: string | null;
  banner: string | null;
  episodes: number | null;
  score: number | null; // 0-10
  year: number | null;
  synopsis: string | null;
  format: string | null;
  status: string | null;
}

const LIST_FRAGMENT = `
  id
  idMal
  isAdult
  episodes
  averageScore
  startDate { year }
  format
  status
  description(asHtml: false)
  title { romaji english }
  coverImage { large extraLarge }
  bannerImage
`;

interface RawListMedia {
  id: number;
  idMal: number | null;
  isAdult: boolean;
  episodes: number | null;
  averageScore: number | null;
  startDate: { year: number | null };
  format: string | null;
  status: string | null;
  description: string | null;
  title: { romaji: string | null; english: string | null };
  coverImage: { large: string | null; extraLarge: string | null };
  bannerImage: string | null;
}

function toListItem(m: RawListMedia): AniListListItem {
  return {
    id: m.id,
    malId: m.idMal,
    title: m.title.english || m.title.romaji || "Untitled",
    poster: m.coverImage.extraLarge || m.coverImage.large,
    banner: m.bannerImage,
    episodes: m.episodes,
    score: m.averageScore != null ? m.averageScore / 10 : null,
    year: m.startDate.year,
    synopsis: m.description ? m.description.replace(/<[^>]+>/g, "") : null,
    format: m.format,
    status: m.status,
  };
}

async function aniListPage(sort: string, status: string | null, perPage = 20): Promise<AniListListItem[]> {
  const query = `
    query ($perPage: Int, $sort: [MediaSort], $status: MediaStatus) {
      Page(page: 1, perPage: $perPage) {
        media(type: ANIME, isAdult: false, sort: $sort, status: $status) { ${LIST_FRAGMENT} }
      }
    }
  `;
  const res = await fetch(appConfig.ANILIST_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables: { perPage, sort: [sort], status } }),
  });
  if (!res.ok) throw new Error(`AniList ${res.status}`);
  const json = await res.json();
  const list: RawListMedia[] = json?.data?.Page?.media ?? [];
  return list.filter((m) => !m.isAdult).map(toListItem);
}

/** Recently updated / currently airing — sorted by trending. */
export const getAniListRecentlyUpdated = () => aniListPage("TRENDING_DESC", "RELEASING", 20);
/** New releases — popularity within currently releasing slate. */
export const getAniListNewReleases = () => aniListPage("POPULARITY_DESC", "RELEASING", 20);
/** Latest completed — most-recently finished anime, sorted by end date. */
export const getAniListLatestCompleted = () => aniListPage("END_DATE_DESC", "FINISHED", 20);
/** Top 10 — highest scored across all anime. */
export const getAniListTopTen = () => aniListPage("SCORE_DESC", null, 10);
