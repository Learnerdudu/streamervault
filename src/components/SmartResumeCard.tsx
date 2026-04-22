import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Play, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getImageUrl, type TMDBMovie } from "@/lib/tmdb";

interface SmartResumeCardProps {
  item: TMDBMovie;
  mediaType: "movie" | "tv";
  progressSeconds: number;
  season?: number | null;
  episode?: number | null;
}

/**
 * Continue Watching card with Ken Burns hover preview + smart resume.
 * Cross-fades the poster into a slow zoom/pan loop on hover.
 */
export function SmartResumeCard({
  item,
  mediaType,
  progressSeconds,
  season,
  episode,
}: SmartResumeCardProps) {
  const { t } = useTranslation();
  const [hover, setHover] = useState(false);
  const title = item.title || item.name || "Untitled";
  const poster = getImageUrl(item.poster_path, "w342");

  const params = new URLSearchParams();
  if (progressSeconds > 0) params.set("t", String(progressSeconds));
  if (mediaType === "tv" && season) params.set("s", String(season));
  if (mediaType === "tv" && episode) params.set("e", String(episode));
  const qs = params.toString();
  const href = `/watch/${mediaType}/${item.id}${qs ? `?${qs}` : ""}`;

  function fmt(sec: number) {
    if (!sec) return "";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  return (
    <Link
      to={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="movie-card group relative block overflow-hidden rounded-md transition-transform duration-300 ease-out hover:scale-105 hover:z-10"
    >
      {poster ? (
        <img
          src={poster}
          alt={title}
          loading="lazy"
          className={`aspect-[2/3] w-full object-cover transition-transform duration-[3000ms] ease-out ${
            hover ? "scale-110 -translate-y-2" : "scale-100"
          }`}
        />
      ) : (
        <div className="flex aspect-[2/3] w-full items-center justify-center bg-muted text-xs text-muted-foreground">
          No Image
        </div>
      )}

      {/* Subtle vignette during hover for cinematic feel */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          hover ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent 40%, hsl(0 0% 0% / 0.55) 100%)",
        }}
      />

      {/* Resume overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-t from-background/95 via-background/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 shadow-xl">
          {progressSeconds > 0 ? (
            <RotateCcw className="h-4 w-4 text-primary-foreground" />
          ) : (
            <Play className="h-4 w-4 fill-current text-primary-foreground" />
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-foreground">
            {progressSeconds > 0 ? `${t("card.resume")} ${fmt(progressSeconds)}` : t("card.quickPlay")}
          </span>
        </div>
      </div>

      {/* Progress bar at bottom */}
      {progressSeconds > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/50">
          <div
            className="h-full bg-primary"
            style={{ width: `${Math.min(100, (progressSeconds / 60 / 90) * 100)}%` }}
          />
        </div>
      )}

      <div className="absolute inset-x-0 bottom-1 translate-y-1 p-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="truncate text-xs font-semibold text-foreground">{title}</p>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          {item.vote_average > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-primary text-primary" />
              {item.vote_average.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
