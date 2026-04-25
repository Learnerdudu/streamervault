import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Star, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { searchMulti, getImageUrl, type TMDBMovie } from "@/lib/tmdb";
import { searchAniList } from "@/lib/anilist";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/**
 * Hyper-Search overlay with cascading fallback:
 *   Tier 1 — TMDB (direct title match)
 *   Tier 2 — AniList GraphQL (semantic plot/synonym match for anime)
 * Tier 3 (Kitsu) and Tier 4 (TMDB keywords) intentionally deferred — they add
 * latency and rarely surface anything not already in T1+T2.
 */
export function GlassSearchOverlay({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [tier2Used, setTier2Used] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
      setActive(0);
      setTier2Used(false);
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setActive(0);
      setTier2Used(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        // Tier 1
        const tmdb = (await searchMulti(query)).filter((r) => r.poster_path).slice(0, 8);
        let merged = tmdb;
        let usedT2 = false;
        // Tier 2 — fire if Tier 1 thin
        if (tmdb.length < 5) {
          const anilist = await searchAniList(query, 8);
          const seen = new Set(tmdb.map((r) => `${r.media_type}-${r.id}`));
          const extra = anilist.filter((a) => !seen.has(`${a.media_type}-${a.id}`));
          merged = [...tmdb, ...extra].slice(0, 12);
          usedT2 = extra.length > 0;
        }
        setResults(merged);
        setTier2Used(usedT2);
        setActive(0);
      } finally {
        setLoading(false);
      }
    }, 280);
  }, [query]);

  async function go(item: TMDBMovie) {
    // AniList synthetic ids start at 1_000_000+; resolve to a real TMDB title
    if (item.id >= 1_000_000) {
      const title = item.title || item.name || "";
      const tmdbHits = await searchMulti(title);
      const real = tmdbHits.find((r) => r.poster_path);
      if (real) {
        const type = real.media_type === "tv" ? "tv" : "movie";
        onOpenChange(false);
        navigate(`/watch/${type}/${real.id}`);
        return;
      }
      onOpenChange(false);
      return;
    }
    const type = item.media_type === "tv" ? "tv" : "movie";
    onOpenChange(false);
    navigate(`/watch/${type}/${item.id}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      onOpenChange(false);
      return;
    }
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  }

  if (!open) return null;

  return (
    <div
      onKeyDown={onKeyDown}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex flex-col items-center px-4 pt-24 sm:pt-32 animate-fade-in"
      style={{
        background:
          "radial-gradient(ellipse at top, hsl(var(--glow-hue) / 0.12), hsl(0 0% 4% / 0.7))",
        backdropFilter: "blur(40px) saturate(160%)",
        WebkitBackdropFilter: "blur(40px) saturate(160%)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      {/* Close */}
      <button
        onClick={() => onOpenChange(false)}
        aria-label="Close search"
        className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-foreground/80 backdrop-blur-md transition-colors hover:bg-white/10 hover:text-foreground"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Search bar — liquid glass */}
      <div className="glass-panel flex w-full max-w-2xl items-center gap-3 rounded-2xl px-5 py-4 shadow-2xl">
        <Search className="h-5 w-5 text-primary" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("nav.search")}
          className="flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground outline-none"
          autoComplete="off"
          spellCheck={false}
        />
        {loading && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        )}
      </div>

      {/* Results */}
      <div className="mt-6 w-full max-w-3xl space-y-2 overflow-y-auto pb-20">
        {tier2Used && (
          <p className="px-1 pb-1 text-[10px] uppercase tracking-[0.2em] text-primary/80">
            Tier 2 · AniList semantic match included
          </p>
        )}
        {results.map((item, i) => {
          const title = item.title || item.name || "Untitled";
          const year = (item.release_date || item.first_air_date || "").slice(0, 4);
          const poster = getImageUrl(item.poster_path, "w185");
          const isActive = i === active;
          return (
            <button
              key={`${item.media_type}-${item.id}`}
              onClick={() => go(item)}
              onMouseEnter={() => setActive(i)}
              className={`glass-panel flex w-full items-center gap-4 rounded-xl p-3 text-left transition-all ${
                isActive
                  ? "scale-[1.01] ring-2 ring-primary/60 shadow-[0_0_30px_hsl(var(--primary)/0.25)]"
                  : "hover:bg-white/5"
              }`}
            >
              {poster ? (
                <img
                  src={poster}
                  alt=""
                  className="h-24 w-16 shrink-0 rounded-md object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-24 w-16 shrink-0 rounded-md bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="truncate text-base font-bold text-foreground">{title}</h3>
                  {year && <span className="text-xs text-muted-foreground">{year}</span>}
                  {item.id >= 1_000_000 && (
                    <span className="hi-badge hi-badge--hd flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" /> AniList
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <span className="capitalize">{item.media_type}</span>
                  {item.vote_average > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      {item.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground/90">
                  {item.overview || "—"}
                </p>
              </div>
            </button>
          );
        })}

        {!loading && query.length >= 2 && results.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">No results.</p>
        )}

        {query.length < 2 && (
          <p className="py-12 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground/70">
            Type to search · ↑ ↓ to navigate · ↵ to play · Esc to close
          </p>
        )}
      </div>
    </div>
  );
}
