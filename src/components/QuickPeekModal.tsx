import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play, Star, Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  getTrailerKey,
  getMovieDetails,
  getTVDetails,
  getTrending,
  getImageUrl,
  type TMDBMovie,
} from "@/lib/tmdb";

interface Props {
  item: TMDBMovie | null;
  mediaType: "movie" | "tv";
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function QuickPeekModal({ item, mediaType, open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<number | null>(null);
  const [trending, setTrending] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !item) return;
    setTrailerKey(null);
    setRuntime(null);
    setTrending(false);
    setLoading(true);

    Promise.all([
      getTrailerKey(item.id, mediaType),
      mediaType === "movie"
        ? getMovieDetails(item.id).then((d) => d.runtime ?? null).catch(() => null)
        : Promise.resolve(null),
      getTrending("all").then((res) => res.some((r) => r.id === item.id)).catch(() => false),
    ])
      .then(([key, rt, isTrending]) => {
        setTrailerKey(key);
        setRuntime(rt);
        setTrending(isTrending);
      })
      .finally(() => setLoading(false));
  }, [open, item, mediaType]);

  if (!item) return null;
  const title = item.title || item.name || "Untitled";
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const backdrop = getImageUrl(item.backdrop_path, "w1280");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden p-0">
        {/* Trailer / backdrop */}
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          {trailerKey ? (
            <iframe
              key={trailerKey}
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&playsinline=1`}
              className="absolute inset-0 h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title={`${title} trailer`}
            />
          ) : backdrop ? (
            <img src={backdrop} alt={title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              {loading ? "…" : t("modal.noTrailer")}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="space-y-3 p-6">
          <DialogTitle className="font-display text-3xl tracking-wide text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {title} preview
          </DialogDescription>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {item.vote_average > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-foreground">
                <Star className="h-3 w-3 fill-primary text-primary" />
                <span className="font-semibold">{item.vote_average.toFixed(1)}</span>
                <span className="text-muted-foreground">/10</span>
              </span>
            )}
            {year && <span>{year}</span>}
            {runtime && <span>{runtime} min</span>}
            <span className="capitalize">{mediaType === "tv" ? "Series" : "Film"}</span>
            {trending && (
              <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 font-semibold text-primary">
                <Flame className="h-3 w-3" /> {t("modal.trending")}
              </span>
            )}
          </div>

          <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
            {item.overview || "—"}
          </p>

          <div className="pt-2">
            <Link
              to={`/watch/${mediaType}/${item.id}`}
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:bg-[hsl(var(--primary-hover))] hover:shadow-[var(--shadow-glow)]"
            >
              <Play className="h-4 w-4 fill-current" /> {t("modal.watchNow")}
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
