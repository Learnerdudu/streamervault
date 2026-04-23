import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { searchMulti, getImageUrl, type TMDBMovie } from "@/lib/tmdb";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

/**
 * Full-screen glassmorphic search overlay.
 * - Centered wide glass bar
 * - Large horizontal result tiles (poster + title + year + 1-line desc)
 * - Arrow keys + Enter for keyboard navigation
 * - Esc closes
 */
export function GlassSearchOverlay({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  // Focus input + lock body scroll when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults([]);
      setActive(0);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setActive(0);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchMulti(query);
        setResults(res.filter((r) => r.poster_path).slice(0, 8));
        setActive(0);
      } finally {
        setLoading(false);
      }
    }, 250);
  }, [query]);

  function go(item: TMDBMovie) {
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
        background: "hsl(0 0% 4% / 0.6)",
        backdropFilter: "blur(40px) saturate(140%)",
        WebkitBackdropFilter: "blur(40px) saturate(140%)",
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
