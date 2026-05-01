/**
 * Anime News fetcher — pulls ANN's RSS feed via the AllOrigins CORS proxy
 * directly from the browser. No edge function required.
 */

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
}

const ANN_RSS = "https://www.animenewsnetwork.com/all/rss.xml";
const PROXY = "https://api.allorigins.win/raw?url=";

const CDATA = /<!\[CDATA\[([\s\S]*?)\]\]>/;
const stripTags = (s: string): string => {
  if (!s) return "";
  const m = s.match(CDATA);
  return (m ? m[1] : s).replace(/<[^>]+>/g, "").trim();
};

const field = (block: string, tag: string): string => {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  return stripTags(m?.[1] ?? "");
};

export async function fetchAnimeNews(): Promise<NewsItem[]> {
  const url = `${PROXY}${encodeURIComponent(ANN_RSS)}`;
  const res = await fetch(url, { headers: { Accept: "text/xml,application/xml,*/*" } });
  if (!res.ok) throw new Error(`News feed ${res.status}`);
  const xml = await res.text();

  const items: NewsItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;
  while ((match = itemRe.exec(xml)) !== null) {
    items.push({
      title: field(match[1], "title"),
      link: field(match[1], "link"),
      pubDate: field(match[1], "pubDate"),
      description: field(match[1], "description").slice(0, 280),
    });
    if (items.length >= 40) break;
  }
  return items;
}
