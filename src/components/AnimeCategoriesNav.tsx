import { ANIME_SEASONS } from "@/lib/animeSeasons";
import { cn } from "@/lib/utils";

interface Props {
  activeSeasonId: string | null;
  onSelectSeason: (id: string | null) => void;
}

/**
 * Horizontal HiAnime-style category bar. Pill-shaped glassy buttons with
 * neon-red hover glow. Replaces the legacy left sidebar.
 */
export function AnimeCategoriesNav({ activeSeasonId, onSelectSeason }: Props) {
  const items: Array<{ id: string | null; label: string }> = [
    { id: null, label: "All" },
    ...ANIME_SEASONS.map((s) => ({ id: s.id, label: s.label })),
  ];

  return (
    <nav
      aria-label="Anime categories"
      className="mb-8 flex gap-2 overflow-x-auto pb-2"
      style={{ scrollbarWidth: "none" }}
    >
      {items.map((item) => {
        const active = activeSeasonId === item.id;
        return (
          <button
            key={item.label}
            onClick={() => onSelectSeason(item.id)}
            className={cn(
              "anime-pill shrink-0 rounded-full border px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300",
              active
                ? "border-primary/60 bg-primary/20 text-primary shadow-[0_0_20px_hsl(var(--glow-hue)/0.5)]"
                : "border-white/10 bg-white/5 text-foreground/80 hover:border-primary/50 hover:text-primary",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
