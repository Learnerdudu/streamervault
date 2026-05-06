export const appConfig = {
  // TMDB_API_KEY removed — now stored as a Supabase secret and accessed via the tmdb-proxy edge function.
  PUSHER_KEY: "6f827724b69d76d79f13",
  PUSHER_CLUSTER: "eu",
  PUSHER_APP_ID: "2146381",
  OPEN_SUBTITLES_KEY: "",
  ANILIST_GRAPHQL: "https://graphql.anilist.co",
  JIKAN_BASE: "https://api.jikan.moe/v4",
  KITSU_BASE: "https://kitsu.io/api/edge",
  CONSUMET_BASE: "https://api.consumet.org",
  ANN_RSS: "https://www.animenewsnetwork.com/all/rss.xml",
  CORS_PROXY: "https://api.allorigins.win/raw?url=",
  CACHE_MINUTES: 60,
  THEME_ACCENT: "#ff0000",
  THEME_BG: "bg-zinc-950",
} as const;
