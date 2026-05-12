import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/externalSupabase";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Props {
  tmdbId: number;
  mediaType: "tv" | "movie";
  title: string;
  posterPath?: string | null;
  className?: string;
  /** Compact icon-only button used on cards */
  compact?: boolean;
}

/**
 * Watch-Later toggle. Uses Supabase upsert/delete on the `watch_later` table
 * for any signed-in user. No localStorage fallback per project rule.
 */
export function WatchLaterButton({ tmdbId, mediaType, title, posterPath, className, compact }: Props) {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setSaved(false);
      return;
    }
    let cancelled = false;
    supabase
      .from("watch_later")
      .select("id, user_id, tmdb_id, media_type, title, poster_path")
      .eq("user_id", user.id)
      .eq("tmdb_id", tmdbId)
      .eq("media_type", mediaType)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error("DB_SYNC_ERROR:", error.message, error);
        if (!cancelled) setSaved(!!data);
      });
    return () => {
      cancelled = true;
    };
  }, [user, tmdbId, mediaType]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Sign in to save titles to Watch Later");
      return;
    }
    setLoading(true);
    if (saved) {
      const { error } = await supabase
        .from("watch_later")
        .delete()
        .eq("user_id", user.id)
        .eq("tmdb_id", tmdbId)
        .eq("media_type", mediaType);
      if (!error) {
        setSaved(false);
        toast("Removed from Watch Later");
      } else {
        toast.error("Couldn't remove — try again");
      }
    } else {
      const { error } = await supabase
        .from("watch_later")
        .upsert(
          {
            user_id: user.id,
            tmdb_id: tmdbId,
            media_type: mediaType,
            title,
            poster_path: posterPath ?? null,
          },
          { onConflict: "user_id,tmdb_id,media_type" },
        );
      if (!error) {
        setSaved(true);
        toast.success("Saved to Watch Later");
      } else {
        toast.error("Couldn't save — try again");
      }
    }
    setLoading(false);
  }

  const Icon = saved ? BookmarkCheck : Bookmark;

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        aria-label={saved ? "Remove from Watch Later" : "Add to Watch Later"}
        title={saved ? "In Watch Later" : "Add to Watch Later"}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_18px_hsl(var(--primary)/0.55)]",
          saved && "bg-primary text-primary-foreground border-primary/60",
          className,
        )}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
        saved
          ? "border-primary/60 bg-primary/20 text-primary"
          : "border-white/15 bg-black/40 text-foreground/85 hover:border-primary/50 hover:text-primary",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {saved ? "In Watch Later" : "Watch Later"}
    </button>
  );
}
