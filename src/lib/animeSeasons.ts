// Anime seasonal windows (TMDB date ranges).
// Each "season" = a real-world cour: Winter Jan-Mar, Spring Apr-Jun, Summer Jul-Sep, Fall Oct-Dec.
export interface AnimeSeason {
  id: string;
  label: string;
  from: string;
  to: string;
}

export const ANIME_SEASONS: AnimeSeason[] = [
  { id: "winter-2026", label: "Winter 2026", from: "2026-01-01", to: "2026-03-31" },
  { id: "fall-2025", label: "Fall 2025", from: "2025-10-01", to: "2025-12-31" },
  { id: "summer-2025", label: "Summer 2025", from: "2025-07-01", to: "2025-09-30" },
  { id: "spring-2025", label: "Spring 2025", from: "2025-04-01", to: "2025-06-30" },
];
