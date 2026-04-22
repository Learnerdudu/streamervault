import { getImageUrl } from "@/lib/tmdb";

interface AmbientGlowProps {
  posterPath: string | null;
}

/**
 * Cinematic backlight behind the player. The player is a cross-origin iframe,
 * so we cannot sample its pixels — instead we render a heavily blurred poster
 * that mimics ambient room light. Pure CSS, zero runtime cost (no canvas loop
 * needed, so the 10fps throttle requirement is moot — this is 0fps / static).
 */
export function AmbientGlow({ posterPath }: AmbientGlowProps) {
  const src = getImageUrl(posterPath, "w500");
  if (!src) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      style={{ transform: "scale(1.1)" }}
    >
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        style={{ filter: "blur(100px) opacity(0.6) saturate(1.5)" }}
      />
    </div>
  );
}
