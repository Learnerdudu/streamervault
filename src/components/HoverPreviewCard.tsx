import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Clock, Sparkles, Play } from "lucide-react";

import { getImageUrl, getTrailerKey, type TMDBMovie } from "@/lib/tmdb";
import { trackGenres } from "@/lib/genreAffinity";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  item: TMDBMovie;
  mediaType?: string;
}

const HOVER_DELAY_MS = 800;

/**
 * Module 6 — Neon-Red Interaction.
 * - framer-motion scale 1.12 + 0 0 15px #ff0000 border-glow on hover
 * - Custom red neon Play icon slides up (no white circular overlays)
 * - Lazy trailer load after 800ms hover
 * - Mobile: static enlarged poster
 */
export function HoverPreviewCard({ item, mediaType }: Props) {
  const isMobile = useIsMobile();
  const [hovering, setHovering] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [trailerRequested, setTrailerRequested] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const type = (mediaType || item.media_type || "movie") as "movie" | "tv";
  const title = item.title || item.name || "Untitled";
  const poster = getImageUrl(item.poster_path, "w342") || item.poster_path; // also handles raw URLs from Jikan
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);

  const matchPct = item.vote_average > 0 ? Math.round(item.vote_average * 10) : null;
  const resolution = item.vote_average >= 7.5 ? "4K" : "HD";
  const isAnime = item.genre_ids?.includes(16) ?? false;

  function handleEnter() {
    if (isMobile) return;
    setHovering(true);
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      // Synthetic id (AniList/Jikan) — no TMDB trailer, skip fetch
      if (!trailerRequested && item.id < 1_000_000) {
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

  useEffect(() => () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }, []);

  function handlePlay() { trackGenres(item.genre_ids); }

  // For synthetic ids we can't link to /watch — fall back to "/" (search will resolve)
  const href = item.id < 1_000_000 ? `/watch/${type}/${item.id}` : `/`;

  return (
    <div
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="hover-preview relative"
    >
      <motion.div
        animate={{
          scale: hovering && !isMobile ? 1.12 : 1,
          boxShadow: hovering && !isMobile
            ? "0 0 15px #ff0000, 0 0 30px hsl(0 100% 50% / 0.45)"
            : "0 10px 30px -10px hsl(0 0% 0% / 0.6)",
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className={`relative rounded-lg ${hovering && !isMobile ? "z-30" : "z-0"}`}
      >
        <Link
          to={href}
          onClick={handlePlay}
          className="movie-card group relative block overflow-hidden rounded-lg"
        >
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

          {!isMobile && showVideo && trailerKey && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden bg-black animate-fade-in">
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&playsinline=1&playlist=${trailerKey}`}
                title={`${title} preview`}
                allow="autoplay; encrypted-media; picture-in-picture"
                className="absolute left-1/2 top-1/2 h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2 border-0"
                style={{ pointerEvents: "none" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
            </div>
          )}

          {!isMobile && hovering && (
            <div className="pointer-events-none absolute left-2 right-2 top-2 flex flex-wrap gap-1.5 animate-fade-in">
              {matchPct !== null && (
                <span className="glass-badge text-[10px] font-bold text-primary">
                  <Sparkles className="h-2.5 w-2.5" /> {matchPct}% Match
                </span>
              )}
              <span className="glass-badge text-[10px] font-bold text-foreground">{resolution}</span>
              {year && (
                <span className="glass-badge text-[10px] font-semibold text-foreground/90">
                  <Clock className="h-2.5 w-2.5" /> {year}
                </span>
              )}
            </div>
          )}

          {isAnime && (
            <div className="pointer-events-none absolute right-2 top-2 flex flex-col gap-1">
              <span className="hi-badge hi-badge--sub">SUB</span>
              <span className="hi-badge hi-badge--dub">DUB</span>
            </div>
          )}

          {/* Module 6: Neon red play icon — slides up on hover */}
          <div className="neon-play">
            <Play className="h-5 w-5 fill-current" />
          </div>

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
      </motion.div>
    </div>
  );
}
