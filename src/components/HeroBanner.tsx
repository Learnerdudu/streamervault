import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getImageUrl, getTrailerKey, type TMDBMovie } from "@/lib/tmdb";

interface HeroBannerProps {
  item: TMDBMovie;
}

export function HeroBanner({ item }: HeroBannerProps) {
  const { t } = useTranslation();
  const title = item.title || item.name || "Untitled";
  const backdrop = getImageUrl(item.backdrop_path, "w1280");
  const type = (item.media_type === "tv" ? "tv" : "movie") as "movie" | "tv";
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTrailerKey(item.id, type).then((key) => {
      if (!cancelled) setTrailerKey(key);
    });
    return () => {
      cancelled = true;
    };
  }, [item.id, type]);

  return (
    <div className="relative h-[75vh] min-h-[500px] w-full overflow-hidden">
      {/* Static backdrop — always rendered as a fallback layer beneath the trailer */}
      {backdrop && (
        <img
          src={backdrop}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Cinematic looping trailer — muted, no controls, click-through disabled */}
      {trailerKey && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&loop=1&controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&playsinline=1&playlist=${trailerKey}`}
            title={`${title} trailer loop`}
            allow="autoplay; encrypted-media; picture-in-picture"
            className="absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 border-0"
            style={{ pointerEvents: "none" }}
          />
        </div>
      )}

      {/* Stronger overlays so buttons stay readable over motion */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--gradient-hero)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--gradient-hero-side)" }} />

      <div className="absolute bottom-24 left-0 max-w-2xl px-4 sm:px-8 md:px-12">
        <p
          className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary"
          style={{ textShadow: "0 2px 8px hsl(0 0% 0% / 0.7)" }}
        >
          {type === "tv" ? t("hero.featuredSeries") : t("hero.featuredFilm")}
        </p>
        <h1
          className="font-display text-5xl leading-none text-foreground sm:text-7xl md:text-8xl"
          style={{ textShadow: "0 4px 20px hsl(0 0% 0% / 0.8)" }}
        >
          {title}
        </h1>
        <p
          className="mt-5 line-clamp-3 max-w-xl text-sm text-foreground/90 sm:text-base"
          style={{ textShadow: "0 2px 8px hsl(0 0% 0% / 0.8)" }}
        >
          {item.overview}
        </p>
      </div>
    </div>
  );
}
