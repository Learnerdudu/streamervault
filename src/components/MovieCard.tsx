import { Link } from "react-router-dom";
import { Star, Play } from "lucide-react";
import { getImageUrl, type TMDBMovie } from "@/lib/tmdb";

interface MovieCardProps {
  item: TMDBMovie;
  mediaType?: string;
}

export function MovieCard({ item, mediaType }: MovieCardProps) {
  const type = mediaType || item.media_type || "movie";
  const title = item.title || item.name || "Untitled";
  const poster = getImageUrl(item.poster_path, "w342");
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);

  return (
    <Link to={`/watch/${type}/${item.id}`} className="movie-card group">
      {poster ? (
        <img src={poster} alt={title} className="aspect-[2/3] w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex aspect-[2/3] w-full items-center justify-center bg-muted text-xs text-muted-foreground">
          No Image
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="rounded-full bg-primary/90 p-3 shadow-lg">
          <Play className="h-5 w-5 fill-current text-primary-foreground" />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 translate-y-2 p-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <p className="truncate text-xs font-semibold text-foreground">{title}</p>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-primary text-primary" />
            {item.vote_average.toFixed(1)}
          </span>
          {year && <span>· {year}</span>}
        </div>
      </div>
    </Link>
  );
}
