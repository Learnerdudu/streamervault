import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Play, Star } from "lucide-react";
import { jikanPosterUrl, type JikanAnime } from "@/lib/jikan";
import { searchMulti } from "@/lib/tmdb";
import { useNavigate } from "react-router-dom";

interface Props {
  anime: JikanAnime;
  /** HiAnime-style index number (1-10). Pass undefined to hide. */
  index?: number;
}

/**
 * Anime card with sharp-corner badges, episode count, and a giant
 * semi-transparent index number behind it (HiAnime style).
 * Clicking searches TMDB by title and routes to /watch.
 */
export function AnimeCard({ anime, index }: Props) {
  const navigate = useNavigate();
  const poster = jikanPosterUrl(anime);
  const title = anime.title_english || anime.title;

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    const hits = await searchMulti(title);
    const real = hits.find((r) => r.poster_path);
    if (real) {
      const t = real.media_type === "tv" ? "tv" : "movie";
      navigate(`/watch/${t}/${real.id}`);
    } else {
      // No TMDB equivalent — toast (silent fallback)
      navigate("/");
    }
  }

  return (
    <div className="hover-preview relative">
      {index !== undefined && (
        <span className="hianime-index">{String(index).padStart(2, "0")}</span>
      )}
      <motion.div
        whileHover={{
          scale: 1.12,
          boxShadow: "0 0 15px #ff0000, 0 0 30px hsl(0 100% 50% / 0.45)",
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative ml-12 rounded-lg"
      >
        <Link
          to="#"
          onClick={handleClick}
          className="movie-card group relative block overflow-hidden rounded-lg"
        >
          {poster ? (
            <img
              src={poster}
              alt={title}
              loading="lazy"
              className="aspect-[2/3] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[2/3] w-full items-center justify-center bg-muted text-xs text-muted-foreground">
              No Image
            </div>
          )}

          {/* Top-right: SUB / DUB / quality */}
          <div className="pointer-events-none absolute right-2 top-2 flex flex-col items-end gap-1">
            <span className="hi-badge hi-badge--sub">SUB</span>
            <span className="hi-badge hi-badge--dub">DUB</span>
            <span className="hi-badge hi-badge--hd">HD</span>
          </div>

          {/* Bottom-left: episode count */}
          {anime.episodes && (
            <div className="pointer-events-none absolute left-2 top-2">
              <span className="hi-badge hi-badge--ep">EP {anime.episodes}</span>
            </div>
          )}

          <div className="neon-play">
            <Play className="h-5 w-5 fill-current" />
          </div>

          {/* Title strip */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2">
            <p className="truncate text-xs font-bold text-foreground">{title}</p>
            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
              {anime.score && (
                <span className="flex items-center gap-1">
                  <Star className="h-2.5 w-2.5 fill-primary text-primary" />
                  {anime.score.toFixed(1)}
                </span>
              )}
              {anime.year && <span>· {anime.year}</span>}
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
