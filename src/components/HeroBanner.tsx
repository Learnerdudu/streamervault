import { Link } from "react-router-dom";
import { Play, Info } from "lucide-react";
import { getImageUrl, type TMDBMovie } from "@/lib/tmdb";

interface HeroBannerProps {
  item: TMDBMovie;
}

export function HeroBanner({ item }: HeroBannerProps) {
  const title = item.title || item.name || "Untitled";
  const backdrop = getImageUrl(item.backdrop_path, "w1280");
  const type = item.media_type === "tv" ? "tv" : "movie";

  return (
    <div className="relative h-[75vh] min-h-[500px] w-full overflow-hidden">
      {backdrop && (
        <img
          src={backdrop}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero-side)" }} />

      <div className="absolute bottom-24 left-0 max-w-2xl px-4 sm:px-8 md:px-12">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
          {type === "tv" ? "Featured Series" : "Featured Film"}
        </p>
        <h1 className="font-display text-5xl leading-none text-foreground sm:text-7xl md:text-8xl">
          {title}
        </h1>
        <p className="mt-5 line-clamp-3 max-w-xl text-sm text-foreground/80 sm:text-base">
          {item.overview}
        </p>
        <div className="mt-7 flex gap-3">
          <Link
            to={`/watch/${type}/${item.id}`}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-7 py-3 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:bg-[hsl(var(--primary-hover))] hover:shadow-[var(--shadow-glow)]"
          >
            <Play className="h-5 w-5 fill-current" /> Play Now
          </Link>
          <button className="inline-flex items-center gap-2 rounded-md bg-secondary/70 px-7 py-3 text-sm font-bold text-foreground backdrop-blur-sm transition-colors hover:bg-secondary">
            <Info className="h-5 w-5" /> More Info
          </button>
        </div>
      </div>
    </div>
  );
}
