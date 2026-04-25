/**
 * Centralized credential & config file.
 * Paste your real keys below — every module imports from here, not from .env.
 *
 * Public/publishable keys are safe in the client bundle. Anything labelled
 * "server-only" should NOT be added here; route those calls through an edge
 * function instead.
 */

export const appConfig = {
  // TMDB v3 API key (public)
  TMDB_API_KEY: "2dca580c2a14b55200e784d157207b4d",

  // Pusher (Module 8 — currently stubbed, paste keys to enable)
  PUSHER_KEY: "",
  PUSHER_CLUSTER: "",

  // OpenSubtitles (Module 4 — optional, currently disabled)
  OPEN_SUBTITLES_KEY: "",

  // External APIs (no keys required, but URLs centralised for easy override)
  ANILIST_GRAPHQL: "https://graphql.anilist.co",
  JIKAN_BASE: "https://api.jikan.moe/v4",
  KITSU_BASE: "https://kitsu.io/api/edge",
  CONSUMET_BASE: "https://api.consumet.org",
  ANN_RSS: "https://www.animenewsnetwork.com/all/rss.xml",

  // Caching: minutes to keep API responses fresh in React Query
  CACHE_MINUTES: 60,
} as const;
