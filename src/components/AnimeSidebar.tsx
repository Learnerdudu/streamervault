import { useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { ANIME_SEASONS } from "@/lib/animeSeasons";
import { cn } from "@/lib/utils";

interface AnimeSidebarProps {
  activeSeasonId: string | null;
  onSelectSeason: (id: string | null) => void;
}

/**
 * Slim, collapsible glassmorphism sidebar pinned to the left edge.
 * Sits below the navbar; toggles between mini (icon) and expanded states.
 */
export function AnimeSidebar({ activeSeasonId, onSelectSeason }: AnimeSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-20 z-30 hidden h-[calc(100vh-5rem)] flex-col border-r border-white/10 bg-background/40 backdrop-blur-xl transition-[width] duration-300 md:flex",
        collapsed ? "w-14" : "w-56",
      )}
      aria-label="Anime seasons"
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-background text-muted-foreground shadow-md transition-colors hover:text-foreground"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-4">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        {!collapsed && (
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-foreground/90">
            Anime Seasons
          </span>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        <button
          onClick={() => onSelectSeason(null)}
          className={cn(
            "group flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
            activeSeasonId === null
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
          )}
          title="All"
        >
          <span className="flex h-2 w-2 shrink-0 rounded-full bg-current" />
          {!collapsed && <span className="truncate">All Titles</span>}
        </button>

        {ANIME_SEASONS.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelectSeason(s.id)}
            title={s.label}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
              activeSeasonId === s.id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            <span className="flex h-2 w-2 shrink-0 rounded-full bg-current opacity-60" />
            {!collapsed && <span className="truncate">{s.label}</span>}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className="border-t border-white/5 p-3">
          <p className="text-[10px] leading-relaxed text-muted-foreground/70">
            Live from TMDB · click a season to filter the grid.
          </p>
        </div>
      )}
    </aside>
  );
}
