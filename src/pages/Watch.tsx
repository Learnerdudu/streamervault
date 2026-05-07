import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sparkles, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EpisodeSelector } from "@/components/EpisodeSelector";
import { AmbientGlow } from "@/components/AmbientGlow";
import { XRayPanel } from "@/components/XRayPanel";
import {
  getMovieDetails,
  getTVDetails,
  getPlayerUrl,
  getTrending,
  getImageUrl,
  type TMDBTVDetails,
  type TMDBMovie,
} from "@/lib/tmdb";
import { supabase } from "@/lib/externalSupabase";
import { useAuth } from "@/hooks/useAuth";

const SERVER_LABELS = ["Vaplayer", "StreamIMDB", "VidLink", "Legacy (vidsrc)"];

const Watch = () => {
  const { t } = useTranslation();
  const { type, id } = useParams<{ type: string; id: string }>();
  const [searchParams] = useSearchParams();
  const isTV = type === "tv";
  const tmdbId = Number(id);
  const { user } = useAuth();

  const initialSeason = Number(searchParams.get("s")) || 1;
  const initialEpisode = Number(searchParams.get("e")) || 1;
  const resumeFrom = Number(searchParams.get("t")) || 0;

  const [title, setTitle] = useState("");
  const [posterPath, setPosterPath] = useState<string | null>(null);
  const [tvDetails, setTvDetails] = useState<TMDBTVDetails | null>(null);
  const [season, setSeason] = useState(initialSeason);
  const [episode, setEpisode] = useState(initialEpisode);
  const [loading, setLoading] = useState(true);
  const [server, setServer] = useState(1);
  const [showHelper, setShowHelper] = useState(false);
  const [xrayOpen, setXrayOpen] = useState(false);
  const [resumeOffered, setResumeOffered] = useState(false);

  const startedAtRef = useRef<number>(Date.now());
  const baseSecondsRef = useRef<number>(resumeFrom);

  // Module 4: "Next Up" recommendations
  const nextUp = useQuery({
    queryKey: ["next-up", tmdbId],
    queryFn: () => getTrending(isTV ? "tv" : "movie"),
  });

  useEffect(() => {
    if (!tmdbId) return;
    setLoading(true);
    if (isTV) {
      getTVDetails(tmdbId)
        .then((data) => {
          setTitle(data.name);
          setTvDetails(data);
          setPosterPath((data as unknown as { poster_path: string | null }).poster_path ?? null);
        })
        .finally(() => setLoading(false));
    } else {
      getMovieDetails(tmdbId)
        .then((data) => {
          setTitle(data.title || "");
          setPosterPath((data as unknown as { poster_path: string | null }).poster_path ?? null);
        })
        .finally(() => setLoading(false));
    }
  }, [tmdbId, isTV]);

  // Module 5: Resume offer toast on first load
  useEffect(() => {
    if (!user || !tmdbId || resumeOffered || loading) return;
    setResumeOffered(true);
    supabase
      .from("watch_history")
      .select("progress_seconds, season, episode")
      .eq("user_id", user.id)
      .eq("tmdb_id", tmdbId)
      .eq("media_type", isTV ? "tv" : "movie")
      .maybeSingle()
      .then(({ data }) => {
        const sec = data?.progress_seconds ?? 0;
        if (sec > 30) {
          const m = Math.floor(sec / 60);
          const s = sec % 60;
          const epLabel = isTV && data?.episode ? ` Ep ${data.episode}` : "";
          toast(`Resume${epLabel} at ${m}:${String(s).padStart(2, "0")}?`, {
            duration: 8000,
            action: {
              label: "Play",
              onClick: () => {
                if (isTV && data?.season) setSeason(data.season);
                if (isTV && data?.episode) setEpisode(data.episode);
                baseSecondsRef.current = sec;
                startedAtRef.current = Date.now();
                // The embed players don't support seeking via URL, but the
                // baseline now reflects the true offset for accurate saves.
              },
            },
          });
        }
      });
  }, [user, tmdbId, isTV, loading, resumeOffered]);

  useEffect(() => {
    startedAtRef.current = Date.now();
    baseSecondsRef.current = 0;
  }, [season, episode]);

  // Module 5: 30-second heartbeat — only writes monotonically increasing progress.
  // Skips initial zero write so we don't clobber a real saved offset with 0.
  useEffect(() => {
    if (!user || !tmdbId || !title) return;
    const lastSavedRef = { current: baseSecondsRef.current };

    const upsert = async (progressSeconds: number) => {
      // Sanity: must be >= last persisted (don't skip backward) and reasonable (< 12h)
      if (progressSeconds <= lastSavedRef.current) return;
      if (progressSeconds > 12 * 60 * 60) return;
      const { error } = await supabase
        .from("watch_history")
        .upsert(
          {
            user_id: user.id,
            tmdb_id: tmdbId,
            media_type: isTV ? "tv" : "movie",
            title,
            poster_path: posterPath,
            season: isTV ? season : null,
            episode: isTV ? episode : null,
            progress_seconds: progressSeconds,
            watched_at: new Date().toISOString(),
          },
          { onConflict: "user_id,tmdb_id,media_type" },
        );
      if (error) {
        console.error("[Heartbeat] upsert failed:", error.message);
        return;
      }
      lastSavedRef.current = progressSeconds;
    };

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      upsert(baseSecondsRef.current + elapsed);
    }, 30_000);

    return () => clearInterval(interval);
  }, [user, tmdbId, isTV, title, posterPath, season, episode]);

  const playerUrl = useMemo(
    () =>
      isTV
        ? getPlayerUrl(tmdbId, season, episode, server)
        : getPlayerUrl(tmdbId, undefined, undefined, server),
    [tmdbId, isTV, season, episode, server],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-[1600px] px-4 pt-24 pb-16 sm:px-6">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {t("watch.back")}
        </Link>

        <h1 className="mb-5 font-display text-4xl tracking-wide text-foreground sm:text-5xl">
          {title}
          {resumeFrom > 0 && (
            <span className="ml-3 align-middle text-xs font-normal uppercase tracking-widest text-primary">
              {t("watch.resuming")} {Math.floor(resumeFrom / 60)}:
              {String(resumeFrom % 60).padStart(2, "0")}
            </span>
          )}
        </h1>

        {isTV && tvDetails && (
          <div className="mb-5">
            <EpisodeSelector
              seasons={tvDetails.seasons}
              selectedSeason={season}
              selectedEpisode={episode}
              onSeasonChange={setSeason}
              onEpisodeChange={setEpisode}
            />
          </div>
        )}

        {/* Module 4: Theater Mode 70/30 split */}
        <div className="grid gap-4 lg:grid-cols-[7fr_3fr]">
          <div className="relative">
            <AmbientGlow posterPath={posterPath} />
            <div
              className="relative w-full overflow-hidden rounded-xl bg-card shadow-2xl"
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                key={playerUrl}
                src={playerUrl}
                className="absolute inset-0 h-full w-full"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                referrerPolicy="no-referrer"
                loading="lazy"
                title={title}
              />
              {xrayOpen && (
                <XRayPanel
                  tmdbId={tmdbId}
                  type={isTV ? "tv" : "movie"}
                  onClose={() => setXrayOpen(false)}
                />
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => setXrayOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                  xrayOpen
                    ? "border-primary/50 bg-primary/20 text-primary"
                    : "border-white/15 bg-black/30 text-foreground/80 hover:bg-black/50 hover:text-foreground"
                }`}
                style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {t("xray.toggle")}
              </button>
              <button
                onClick={() => setShowHelper((v) => !v)}
                className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {t("watch.tryServer")}
              </button>
            </div>
            {showHelper && (
              <p className="mt-2 text-right text-xs text-muted-foreground">{t("watch.serverHint")}</p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {[1, 2, 3, 4].map((s, i) => (
                <button
                  key={s}
                  onClick={() => setServer(s)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    server === s
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary text-secondary-foreground hover:bg-[hsl(var(--surface-hover))]"
                  }`}
                >
                  {t("watch.server")} {s} — {SERVER_LABELS[i]}
                </button>
              ))}
            </div>
          </div>

          {/* Next Up sidebar */}
          <aside className="space-y-3">
            <h3 className="font-display text-xl tracking-wide text-foreground">▶ Next Up</h3>
            <div className="space-y-2">
              {(nextUp.data ?? []).slice(0, 8).map((item: TMDBMovie) => {
                const itemType = (item.media_type === "tv" ? "tv" : "movie") as "tv" | "movie";
                const poster = getImageUrl(item.poster_path, "w154");
                const itemTitle = item.title || item.name || "Untitled";
                return (
                  <Link
                    key={`${item.media_type}-${item.id}`}
                    to={`/watch/${itemType}/${item.id}`}
                    className="group flex gap-3 rounded-lg border border-transparent bg-card/40 p-2 transition-all hover:border-primary/40 hover:bg-card hover:shadow-[0_0_15px_hsl(var(--primary)/0.25)]"
                  >
                    {poster ? (
                      <img src={poster} alt={itemTitle} className="h-24 w-16 shrink-0 rounded object-cover" loading="lazy" />
                    ) : (
                      <div className="h-24 w-16 shrink-0 rounded bg-muted" />
                    )}
                    <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
                      <div>
                        <p className="line-clamp-2 text-sm font-bold text-foreground group-hover:text-primary">
                          {itemTitle}
                        </p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                          {itemType} · {item.vote_average?.toFixed(1) ?? "—"}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 self-start text-[10px] font-bold uppercase tracking-widest text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        <Play className="h-3 w-3 fill-current" /> Play
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Watch;
