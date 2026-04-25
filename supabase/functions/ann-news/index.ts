// ANN RSS proxy — bypasses CORS by fetching server-side and returning JSON.
// Cached aggressively; ANN updates every few hours.
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const ANN_RSS = "https://www.animenewsnetwork.com/all/rss.xml";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

function parseRSS(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const fieldRegex = (tag: string) =>
    new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const cdataRegex = /<!\[CDATA\[([\s\S]*?)\]\]>/;

  const strip = (s: string): string => {
    if (!s) return "";
    const m = s.match(cdataRegex);
    const raw = m ? m[1] : s;
    return raw.replace(/<[^>]+>/g, "").trim();
  };

  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const t = block.match(fieldRegex("title"));
    const l = block.match(fieldRegex("link"));
    const p = block.match(fieldRegex("pubDate"));
    const d = block.match(fieldRegex("description"));
    items.push({
      title: strip(t?.[1] ?? ""),
      link: strip(l?.[1] ?? ""),
      pubDate: strip(p?.[1] ?? ""),
      description: strip(d?.[1] ?? "").slice(0, 280),
    });
    if (items.length >= 40) break;
  }
  return items;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const res = await fetch(ANN_RSS, {
      headers: { "User-Agent": "StreamVault/1.0 (RSS proxy)" },
    });
    if (!res.ok) {
      return new Response(JSON.stringify({ error: `ANN ${res.status}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const xml = await res.text();
    const items = parseRSS(xml);

    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=1800",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
