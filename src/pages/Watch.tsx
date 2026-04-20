import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EpisodeSelector } from "@/components/EpisodeSelector";
import {
  getMovieDetails,
  getTVDetails,
  getPlayerUrl,
  type TMDBTVDetails,
} from "@/lib/tmdb";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const SERVER_LABELS = ["Vaplayer", "StreamIMDB", "VidLink", "Legacy (vidsrc)"];

const Watch = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const isTV = type === "tv";
  const tmdbId = Number(id);

  const [title, setTitle] = useState("");
  const [tvDetails, setTvDetails] = useState<TMDBTVDetails | null>(null);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [loading, setLoading] = useState(true);
  const [server, setServer] = useState(1);
  const [showHelper, setShowHelper] = useState(false);

  useEffect(() => {
    if (!tmdbId) return;
    setLoading(true);
    if (isTV) {
      getTVDetails(tmdbId)
        .then((data) => {
          setTitle(data.name);
          setTvDetails(data);
        })
        .finally(() => setLoading(false));
    } else {
      getMovieDetails(tmdbId)
        .then((data) => setTitle(data.title || ""))
        .finally(() => setLoading(false));
    }
  }, [tmdbId, isTV]);

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
      <div className="mx-auto max-w-5xl px-4 pt-24 pb-16 sm:px-6">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Browse
        </Link>

        <h1 className="mb-5 font-display text-4xl tracking-wide text-foreground sm:text-5xl">
          {title}
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

        <div
          className="relative w-full overflow-hidden rounded-xl bg-card shadow-2xl"
          style={{ paddingBottom: "56.25%" }}
        >
          {/*
            Player iframe — sandbox attribute removed (was causing
            'Media Unavailable / Disable Sandbox' errors). referrerPolicy is
            'no-referrer' so providers don't block based on origin.
          */}
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
        </div>

        {/* Manual helper — no auto-popup. */}
        <div className="mt-3 flex items-center justify-end">
          <button
            onClick={() => setShowHelper((v) => !v)}
            className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            Video not loading? Try another server
          </button>
        </div>

        {showHelper && (
          <p className="mt-2 text-right text-xs text-muted-foreground">
            Pick a different server below — different sources may have different sources for this title.
          </p>
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
              Server {s} — {SERVER_LABELS[i]}
            </button>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Watch;
