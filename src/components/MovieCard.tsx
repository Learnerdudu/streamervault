import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Play, Eye, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getImageUrl, type TMDBMovie } from "@/lib/tmdb";
import { trackGenres } from "@/lib/genreAffinity";
import { QuickPeekModal } from "@/components/QuickPeekModal";
import { CollectionPicker } from "@/components/CollectionPicker";
import { useAuth } from "@/hooks/useAuth";

interface MovieCardProps {
  item: TMDBMovie;
  mediaType?: string;
}

export function MovieCard({ item, mediaType }: MovieCardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [peekOpen, setPeekOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const type = (mediaType || item.media_type || "movie") as "movie" | "tv";
  const title = item.title || item.name || "Untitled";
  const poster = getImageUrl(item.poster_path, "w342");
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);

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
      <Link
        to={`/watch/${type}/${item.id}`}
        onClick={handlePlay}
        className="movie-card group relative block overflow-hidden rounded-md transition-transform duration-300 ease-out hover:scale-105 hover:z-10"
      >
        {poster ? (
          <img src={poster} alt={title} className="aspect-[2/3] w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex aspect-[2/3] w-full items-center justify-center bg-muted text-xs text-muted-foreground">
            No Image
          </div>
        )}

        {user && (
          <button
            onClick={openPicker}
            aria-label="Add to vault"
            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-foreground opacity-0 backdrop-blur-md transition-all hover:bg-primary hover:text-primary-foreground group-hover:opacity-100"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-t from-background/95 via-background/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 shadow-xl">
            <Play className="h-4 w-4 fill-current text-primary-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-foreground">
              {t("card.quickPlay")}
            </span>
          </div>
          <button
            onClick={openPeek}
            className="flex items-center gap-2 rounded-full bg-secondary/90 px-4 py-2 shadow-xl backdrop-blur-sm transition-colors hover:bg-secondary"
          >
            <Eye className="h-4 w-4 text-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {t("card.quickPeek")}
            </span>
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 translate-y-1 p-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
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
      </Link>

      <QuickPeekModal item={item} mediaType={type} open={peekOpen} onOpenChange={setPeekOpen} />
      <CollectionPicker item={item} mediaType={type} open={pickerOpen} onOpenChange={setPickerOpen} />
    </>
  );
}
