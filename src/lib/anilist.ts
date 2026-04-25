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
