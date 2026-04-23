import { useEffect, useState } from "react";
import { HeroBanner } from "@/components/HeroBanner";
import type { TMDBMovie } from "@/lib/tmdb";

interface SpotlightHeroProps {
  items: TMDBMovie[];
  intervalMs?: number;
}

/**
 * Auto-rotating spotlight: cycles through up to 3 trending titles,
 * each rendered with the existing cinematic HeroBanner (trailer loop).
 */
export function SpotlightHero({ items, intervalMs = 12000 }: SpotlightHeroProps) {
  const pool = items.slice(0, 3);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (pool.length < 2) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % pool.length);
    }, intervalMs);
    return () => clearInterval(t);
  }, [pool.length, intervalMs]);

  if (!pool.length) return null;
  const current = pool[idx];

  return (
    <div className="relative">
      <HeroBanner key={current.id} item={current} />
      {pool.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {pool.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setIdx(i)}
              aria-label={`Spotlight ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === idx ? "w-8 bg-primary" : "w-3 bg-foreground/30 hover:bg-foreground/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
