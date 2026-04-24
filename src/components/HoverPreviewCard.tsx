import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Eye, Plus, Clock, Sparkles } from "lucide-react";

import { getImageUrl, getTrailerKey, type TMDBMovie } from "@/lib/tmdb";
import { trackGenres } from "@/lib/genreAffinity";
import { QuickPeekModal } from "@/components/QuickPeekModal";
import { CollectionPicker } from "@/components/CollectionPicker";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  item: TMDBMovie;
  mediaType?: string;
}

const HOVER_DELAY_MS = 800;

/**
 * Card with Quick-Peek video portal.
 * - Desktop: hover >800ms → scale 1.1, cross-fade poster → muted YouTube trailer loop,
 *   glowing rim light + glassmorphic Match%/Resolution/Runtime badges.
 * - Mobile/touch: static enlarged poster (no trailer fetch, saves data).
 */
export function HoverPreviewCard({ item, mediaType }: Props) {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [hovering, setHovering] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [trailerRequested, setTrailerRequested] = useState(false);
  const [peekOpen, setPeekOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const type = (mediaType || item.media_type || "movie") as "movie" | "tv";
  const title = item.title || item.name || "Untitled";
  const poster = getImageUrl(item.poster_path, "w342");
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);

  // Match % derived from TMDB rating (0–10 → 0–100)
  const matchPct = item.vote_average > 0 ? Math.round(item.vote_average * 10) : null;
  // Resolution heuristic: high-budget recent releases tend to be 4K-available
  const resolution = item.vote_average >= 7.5 ? "4K" : "HD";
  // Anime detection (TMDB genre 16 = Animation) → show SUB/DUB badges
  const isAnime = item.genre_ids?.includes(16) ?? false;

  // Lazy: fetch trailer key only after the hover-delay fires
  function handleEnter() {
    if (isMobile) return;
    setHovering(true);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      if (!trailerRequested) {
        setTrailerRequested(true);
        getTrailerKey(item.id, type).then((key) => setTrailerKey(key));
      }
      setShowVideo(true);
    }, HOVER_DELAY_MS);
  }

  function handleLeave() {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHovering(false);
    setShowVideo(false);
  }

  useEffect(() => {
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
    };
  }, []);

  function handlePlay() {
    trackGenres(item.genre_ids);
  }

  function openPeek(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPeekOpen(true);
  }

  function openPicker(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPickerOpen(true);
  }

  return (
    <>
      <div
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className="relative"
      >
        <Link
          to={`/watch/${type}/${item.id}`}
          onClick={handlePlay}
          className={`movie-card group relative block overflow-hidden rounded-lg transition-all duration-500 ease-out ${
            hovering && !isMobile ? "z-30 scale-110 rim-light" : "z-0 scale-100"
          }`}
        >
          {/* Poster — fades out when video is ready */}
          {poster ? (
            <img
              src={poster}
              alt={title}
              loading="lazy"
              className={`aspect-[2/3] w-full object-cover transition-opacity duration-500 ${
                showVideo && trailerKey ? "opacity-0" : "opacity-100"
              }`}
            />
          ) : (
            <div className="flex aspect-[2/3] w-full items-center justify-center bg-muted text-xs text-muted-foreground">
              No Image
            </div>
          )}

          {/* Trailer cross-fade (desktop only, lazy-loaded) */}
          {!isMobile && showVideo && trailerKey && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden bg-black animate-fade-in">
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&playsinline=1&playlist=${trailerKey}`}
                title={`${title} preview`}
                allow="autoplay; encrypted-media; picture-in-picture"
                className="absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2 border-0"
                style={{ pointerEvents: "none" }}
              />
              {/* Soft vignette to keep badges legible */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
            </div>
          )}

          {/* Quick stats — glassmorphic floating badges (desktop hover only) */}
          {!isMobile && hovering && (
            <div className="pointer-events-none absolute left-2 right-2 top-2 flex flex-wrap gap-1.5 animate-fade-in">
              {matchPct !== null && (
                <span className="glass-badge text-[10px] font-bold text-primary">
                  <Sparkles className="h-2.5 w-2.5" /> {matchPct}% Match
                </span>
              )}
              <span className="glass-badge text-[10px] font-bold text-foreground">
                {resolution}
              </span>
              {year && (
                <span className="glass-badge text-[10px] font-semibold text-foreground/90">
                  <Clock className="h-2.5 w-2.5" /> {year}
                </span>
              )}
            </div>
          )}

          {/* Add-to-vault floating button */}
          {user && (
            <button
              onClick={openPicker}
              aria-label="Add to vault"
              className="absolute right-2 bottom-14 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-foreground opacity-0 backdrop-blur-md transition-all hover:bg-primary hover:text-primary-foreground group-hover:opacity-100"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}

          {/* SUB / DUB corner badges for anime */}
          {isAnime && (
            <div className="pointer-events-none absolute right-2 top-2 flex flex-col gap-1">
              <span className="rounded-sm bg-primary/90 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary-foreground shadow-md">
                SUB
              </span>
              <span className="rounded-sm bg-foreground/90 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-background shadow-md">
                DUB
              </span>
            </div>
          )}

          {/* Quick Peek button (kept; play/pause/skip overlay removed for clean preview) */}
          <button
            onClick={openPeek}
            aria-label="Quick peek"
            className="absolute bottom-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-foreground opacity-0 backdrop-blur-md transition-all hover:bg-secondary group-hover:opacity-100"
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* Title strip — only when not playing video */}
          {!showVideo && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1 p-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <p className="truncate text-xs font-semibold text-foreground">{title}</p>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                {item.vote_average > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    {item.vote_average.toFixed(1)}
                  </span>
                )}
                {year && <span>· {year}</span>}
              </div>
            </div>
          )}
        </Link>
      </div>

      <QuickPeekModal item={item} mediaType={type} open={peekOpen} onOpenChange={setPeekOpen} />
      <CollectionPicker item={item} mediaType={type} open={pickerOpen} onOpenChange={setPickerOpen} />
    </>
  );
}
