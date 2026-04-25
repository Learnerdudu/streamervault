/**
 * THE IRON WALL 2.0 — Triple-API content sanitization.
 *
 * Layer 1 (synchronous, always-on):
 *   - TMDB adult flag
 *   - Blocklisted genre IDs (18 Drama, 10749 Romance per project spec)
 *   - Keyword scrub on title/overview
 *   - Studio blocklist (when studio data is available)
 *
 * Layer 2 (asynchronous, opt-in via verifyAdultAsync):
 *   - AniList GraphQL  → isAdult
 *   - Jikan (MAL)      → rating in {Rx, R+}
 *   - Kitsu            → nsfw === true
 *
 * Async layer is opt-in because it adds 3 network calls per item. Use it for
 * the Anime Hub & Search results, NOT for every TMDB row on the homepage.
 */

import type { TMDBMovie } from "@/lib/tmdb";
import { appConfig } from "@/config/appConfig";

// --- Layer 1: synchronous blocklists -----------------------------------------

const BLOCKED_GENRE_IDS = new Set<number>([18, 10749]);

const ADULT_KEYWORDS = [
  "porn", "xxx", "erotic", "erotica", "hentai", "softcore", "hardcore",
  "nude", "nudity", "sex tape", "explicit", "adult film", "18+", "milf",
  "uncensored", "ecchi", "lewd", "fetish", "smut", "yaoi", "yuri",
  "bara", "futanari", "boys love", "girls love",
];

const BLOCKED_STUDIOS = new Set(
  [
    "Pink Pineapple", "Bunnywalker", "Green Bunny", "MS Pictures",
    "Milky Animation Label", "Collaboration Works", "Seven", "PoLoS",
    "Discovery", "Mary Jane", "T-Rex", "Queen Bee", "Studio Echi", "Gold Bear",
  ].map((s) => s.toLowerCase()),
);

interface SanitizableItem {
  id?: number;
  adult?: boolean;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  genre_ids?: number[];
  production_companies?: Array<{ name: string }>;
  studios?: Array<{ name: string }>;
}

export function isBlocked(item: SanitizableItem): boolean {
  if (item.adult === true) return true;
  if (item.genre_ids?.some((g) => BLOCKED_GENRE_IDS.has(g))) return true;

  const studios = [
    ...(item.production_companies ?? []),
    ...(item.studios ?? []),
  ];
  if (studios.some((s) => BLOCKED_STUDIOS.has(s.name?.toLowerCase() ?? ""))) {
    return true;
  }

  const haystack = [
    item.title, item.name, item.original_title, item.original_name, item.overview,
  ].filter(Boolean).join(" ").toLowerCase();
  return ADULT_KEYWORDS.some((k) => haystack.includes(k));
}

/** Synchronous strip — covers ~95% of cases with zero extra network cost. */
export function sanitize<T extends SanitizableItem>(items: T[]): T[] {
  return items.filter((i) => !isBlocked(i));
}

// --- Layer 2: async cross-reference ------------------------------------------

interface AsyncVerdict {
  blocked: boolean;
  source?: "anilist" | "jikan" | "kitsu";
}

async function checkAniList(title: string): Promise<AsyncVerdict> {
  try {
    const res = await fetch(appConfig.ANILIST_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        query: `query ($s: String) { Media(search: $s, type: ANIME) { isAdult } }`,
        variables: { s: title },
      }),
    });
    if (!res.ok) return { blocked: false };
    const json = await res.json();
    if (json?.data?.Media?.isAdult === true) return { blocked: true, source: "anilist" };
    return { blocked: false };
  } catch {
    return { blocked: false };
  }
}

async function checkJikan(title: string): Promise<AsyncVerdict> {
  try {
    const res = await fetch(
      `${appConfig.JIKAN_BASE}/anime?q=${encodeURIComponent(title)}&limit=1&sfw=false`,
    );
    if (!res.ok) return { blocked: false };
    const json = await res.json();
    const rating: string | undefined = json?.data?.[0]?.rating;
    if (rating && (rating.startsWith("Rx") || rating.startsWith("R+"))) {
      return { blocked: true, source: "jikan" };
    }
    return { blocked: false };
  } catch {
    return { blocked: false };
  }
}

async function checkKitsu(title: string): Promise<AsyncVerdict> {
  try {
    const res = await fetch(
      `${appConfig.KITSU_BASE}/anime?filter[text]=${encodeURIComponent(title)}&page[limit]=1`,
    );
    if (!res.ok) return { blocked: false };
    const json = await res.json();
    const nsfw = json?.data?.[0]?.attributes?.nsfw;
    if (nsfw === true) return { blocked: true, source: "kitsu" };
    return { blocked: false };
  } catch {
    return { blocked: false };
  }
}

const verifyCache = new Map<string, boolean>();

/**
 * Cross-reference a single title against AniList, Jikan, and Kitsu.
 * Returns true if ANY source flags it adult. Result cached per session.
 */
export async function verifyAdultAsync(title: string): Promise<boolean> {
  const key = title.toLowerCase().trim();
  if (verifyCache.has(key)) return verifyCache.get(key)!;

  const [a, j, k] = await Promise.all([
    checkAniList(title),
    checkJikan(title),
    checkKitsu(title),
  ]);

  const blocked = a.blocked || j.blocked || k.blocked;
  verifyCache.set(key, blocked);
  return blocked;
}

/**
 * Async batch sanitize — runs Layer 1 first, then async cross-check on
 * survivors. Use sparingly (Anime Hub, search results), not on every row.
 */
export async function sanitizeWithVerify<T extends SanitizableItem>(items: T[]): Promise<T[]> {
  const layer1 = sanitize(items);
  const verdicts = await Promise.all(
    layer1.map(async (item) => {
      const t = item.title || item.name || "";
      if (!t) return false;
      return verifyAdultAsync(t);
    }),
  );
  return layer1.filter((_, i) => !verdicts[i]);
}

// Legacy alias so existing tmdb.ts imports keep working
export const purify = sanitize;

// Re-export typed version for TMDB-specific callers
export function sanitizeTMDB(items: TMDBMovie[]): TMDBMovie[] {
  return sanitize(items as SanitizableItem[]) as TMDBMovie[];
}
