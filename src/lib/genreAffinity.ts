/**
 * Lightweight personalization — tracks the user's most-clicked TMDB genre IDs
 * in localStorage. Works for guests and signed-in users alike (no DB writes).
 */
const KEY = "sv_genre_affinity";

type AffinityMap = Record<string, number>;

function read(): AffinityMap {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function write(m: AffinityMap) {
  try {
    localStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* quota — ignore */
  }
}

export function trackGenres(genreIds: number[] | undefined) {
  if (!genreIds?.length) return;
  const m = read();
  for (const id of genreIds) {
    m[id] = (m[id] || 0) + 1;
  }
  write(m);
}

export function getTopGenre(): number | null {
  const m = read();
  let best: number | null = null;
  let bestCount = 0;
  for (const [id, count] of Object.entries(m)) {
    if (count > bestCount) {
      bestCount = count;
      best = Number(id);
    }
  }
  return best;
}
