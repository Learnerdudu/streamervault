import type { TMDBSeason } from "@/lib/tmdb";

interface EpisodeSelectorProps {
  seasons: TMDBSeason[];
  selectedSeason: number;
  selectedEpisode: number;
  onSeasonChange: (season: number) => void;
  onEpisodeChange: (episode: number) => void;
}

export function EpisodeSelector({
  seasons,
  selectedSeason,
  selectedEpisode,
  onSeasonChange,
  onEpisodeChange,
}: EpisodeSelectorProps) {
  const currentSeason = seasons.find((s) => s.season_number === selectedSeason);
  const episodeCount = currentSeason?.episode_count || 1;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground">Season</label>
        <select
          value={selectedSeason}
          onChange={(e) => {
            onSeasonChange(Number(e.target.value));
            onEpisodeChange(1);
          }}
          className="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
        >
          {seasons
            .filter((s) => s.season_number > 0)
            .map((s) => (
              <option key={s.season_number} value={s.season_number}>
                {s.name}
              </option>
            ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-muted-foreground">Episode</label>
        <select
          value={selectedEpisode}
          onChange={(e) => onEpisodeChange(Number(e.target.value))}
          className="rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
        >
          {Array.from({ length: episodeCount }, (_, i) => i + 1).map((ep) => (
            <option key={ep} value={ep}>
              Episode {ep}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
