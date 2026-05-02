import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import type { AniListListItem } from "@/lib/anilist";
import { searchMulti } from "@/lib/tmdb";

interface Props {
  anime: AniListListItem;
  delay?: number;
}

/**
 * HiAnime-style compact poster card backed by AniList data.
 * SUB/DUB badges top-right · EP count top-left · title strip bottom.
 */
export function CompactAniListCard({ anime, delay = 0 }: Props) {
  const navigate = useNavigate();

  async function handleClick() {
    const hits = await searchMulti(anime.title);
    const real = hits.find((r) => r.poster_path);
    if (real) {
      const t = real.media_type === "tv" ? "tv" : "movie";
      navigate(`/watch/${t}/${real.id}`);
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className="anime-glow-hover group relative block overflow-hidden rounded-md bg-card text-left"
    >
      {anime.poster ? (
        <img
          src={anime.poster}
          alt={anime.title}
          loading="lazy"
          className="aspect-[2/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="flex aspect-[2/3] w-full items-center justify-center bg-muted text-xs text-muted-foreground">
          No Image
        </div>
      )}

      <div className="pointer-events-none absolute right-1.5 top-1.5 flex flex-col items-end gap-1">
        <span className="hi-badge hi-badge--sub">SUB</span>
        <span className="hi-badge hi-badge--dub">DUB</span>
      </div>

      {anime.episodes != null && (
        <span className="hi-badge hi-badge--ep pointer-events-none absolute left-1.5 top-1.5">
          EP {anime.episodes}
        </span>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-2 pb-2 pt-6">
        <p className="truncate text-xs font-bold text-foreground">{anime.title}</p>
        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
          {anime.score != null && (
            <span className="flex items-center gap-1">
              <Star className="h-2.5 w-2.5 fill-primary text-primary" />
              {anime.score.toFixed(1)}
            </span>
          )}
          {anime.year && <span>· {anime.year}</span>}
        </div>
      </div>
    </motion.button>
  );
}
