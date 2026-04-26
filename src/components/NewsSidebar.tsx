import { useQuery } from "@tanstack/react-query";
import { Newspaper, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/externalSupabase";
import { Skeleton } from "@/components/ui/skeleton";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

async function fetchNews(): Promise<NewsItem[]> {
  const { data, error } = await supabase.functions.invoke("ann-news");
  if (error) throw error;
  return (data?.items ?? []) as NewsItem[];
}

/** Tiny coloured square thumbnail derived from the title (no images in RSS). */
function colorFromTitle(t: string): string {
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 70% 35%)`;
}

export function NewsSidebar() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["ann-rss-sidebar"],
    queryFn: fetchNews,
  });

  return (
    <section className="rounded-lg border border-border/40 bg-card/40 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display text-xl tracking-wide text-foreground">
          <Newspaper className="h-4 w-4 text-primary" /> Anime News
        </h3>
        <Link
          to="/news"
          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          All →
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="h-12 w-12 flex-shrink-0 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-xs text-muted-foreground">
          News feed unavailable.
        </p>
      )}

      <ul className="space-y-3">
        {data?.slice(0, 6).map((n) => (
          <li key={n.link}>
            <a
              href={n.link}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex gap-2.5"
            >
              <div
                className="grid h-12 w-12 flex-shrink-0 place-items-center rounded text-[10px] font-black uppercase text-white/90"
                style={{ background: colorFromTitle(n.title) }}
              >
                {n.title.split(" ").slice(0, 2).map((w) => w[0]).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                  {n.title}
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {new Date(n.pubDate).toLocaleDateString()}
                  <ExternalLink className="h-2.5 w-2.5" />
                </p>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
