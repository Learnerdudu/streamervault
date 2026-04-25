import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/externalSupabase";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source?: string;
}

async function fetchNews(): Promise<NewsItem[]> {
  const { data, error } = await supabase.functions.invoke("ann-news");
  if (error) throw error;
  return (data?.items ?? []) as NewsItem[];
}

const NewsPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["ann-rss"],
    queryFn: fetchNews,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 pt-28 pb-16 sm:px-6">
        <h1 className="mb-2 font-display text-4xl tracking-wide text-foreground sm:text-5xl">
          📰 Anime News
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Live feed from <a href="https://www.animenewsnetwork.com" className="text-primary hover:underline">Anime News Network</a>.
        </p>

        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2 border-b border-border/40 pb-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            Could not load news feed. The ANN RSS edge function may need to be deployed.
          </div>
        )}

        <ul className="space-y-6">
          {data?.map((item) => (
            <li key={item.link} className="border-b border-border/40 pb-5">
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer noopener"
                className="block group"
              >
                <h2 className="font-display text-xl tracking-wide text-foreground transition-colors group-hover:text-primary">
                  {item.title}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground/70">
                  {new Date(item.pubDate).toLocaleString()}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  );
};

export default NewsPage;
