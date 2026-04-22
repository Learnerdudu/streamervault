import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, Music, X } from "lucide-react";
import { getCredits, getImageUrl, type TMDBCredits, type TMDBCrewMember } from "@/lib/tmdb";

interface XRayPanelProps {
  tmdbId: number;
  type: "movie" | "tv";
  onClose: () => void;
}

export function XRayPanel({ tmdbId, type, onClose }: XRayPanelProps) {
  const { t } = useTranslation();
  const [credits, setCredits] = useState<TMDBCredits | null>(null);
  const [tab, setTab] = useState<"cast" | "music">("cast");

  useEffect(() => {
    let cancelled = false;
    getCredits(tmdbId, type).then((c) => {
      if (!cancelled) setCredits(c);
    });
    return () => {
      cancelled = true;
    };
  }, [tmdbId, type]);

  const top5 = credits?.cast.slice(0, 5) ?? [];
  const composers: TMDBCrewMember[] =
    credits?.crew.filter(
      (c) =>
        c.job === "Original Music Composer" ||
        c.job === "Music" ||
        c.department === "Sound" && /compos/i.test(c.job),
    ).slice(0, 5) ?? [];

  return (
    <div
      className="absolute left-4 top-4 z-20 w-72 rounded-xl border border-white/15 bg-black/40 p-4 text-foreground shadow-2xl animate-fade-in"
      style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1">
          <button
            onClick={() => setTab("cast")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              tab === "cast" ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" /> {t("xray.cast")}
          </button>
          <button
            onClick={() => setTab("music")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
              tab === "music" ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-foreground"
            }`}
          >
            <Music className="h-3.5 w-3.5" /> {t("xray.music")}
          </button>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-foreground/60 transition-colors hover:bg-white/10 hover:text-foreground"
          aria-label="Close X-Ray"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!credits && <p className="text-xs text-foreground/60">{t("xray.loading")}</p>}

      {credits && tab === "cast" && (
        <ul className="space-y-2">
          {top5.length === 0 && <li className="text-xs text-foreground/60">{t("xray.empty")}</li>}
          {top5.map((p) => {
            const img = getImageUrl(p.profile_path, "w185");
            return (
              <li key={p.id} className="flex items-center gap-2.5">
                {img ? (
                  <img src={img} alt={p.name} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-white/10" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{p.name}</p>
                  <p className="truncate text-[11px] text-foreground/60">{p.character}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {credits && tab === "music" && (
        <ul className="space-y-2">
          {composers.length === 0 && <li className="text-xs text-foreground/60">{t("xray.empty")}</li>}
          {composers.map((p) => {
            const img = getImageUrl(p.profile_path, "w185");
            return (
              <li key={`${p.id}-${p.job}`} className="flex items-center gap-2.5">
                {img ? (
                  <img src={img} alt={p.name} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-white/10" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{p.name}</p>
                  <p className="truncate text-[11px] text-foreground/60">{p.job}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
