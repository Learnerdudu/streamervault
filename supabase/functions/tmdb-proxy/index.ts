const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TMDB_BASE = "https://api.themoviedb.org/3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("TMDB_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "TMDB_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const url = new URL(req.url);
    // Path after /tmdb-proxy is forwarded to TMDB.
    // e.g. /tmdb-proxy/movie/popular -> /movie/popular
    const match = url.pathname.match(/\/tmdb-proxy(\/.*)?$/);
    let endpoint = match?.[1] || "";

    // Also support ?endpoint=/movie/popular as a fallback (functions.invoke uses POST + body).
    let bodyParams: Record<string, string> = {};
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body && typeof body === "object") {
          if (typeof body.endpoint === "string") endpoint = body.endpoint;
          if (body.params && typeof body.params === "object") {
            for (const [k, v] of Object.entries(body.params)) {
              bodyParams[k] = String(v);
            }
          }
        }
      } catch {
        /* no body */
      }
    }

    if (!endpoint || !endpoint.startsWith("/")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid endpoint" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Basic safety: only allow simple path chars
    if (!/^\/[a-zA-Z0-9/_\-]+$/.test(endpoint)) {
      return new Response(
        JSON.stringify({ error: "Invalid endpoint format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const tmdbUrl = new URL(`${TMDB_BASE}${endpoint}`);
    // Query params from URL (for GET) and bodyParams (for POST)
    url.searchParams.forEach((v, k) => {
      if (k !== "endpoint") tmdbUrl.searchParams.set(k, v);
    });
    for (const [k, v] of Object.entries(bodyParams)) {
      tmdbUrl.searchParams.set(k, v);
    }
    tmdbUrl.searchParams.set("api_key", apiKey);
    if (!tmdbUrl.searchParams.has("include_adult")) {
      tmdbUrl.searchParams.set("include_adult", "false");
    }

    const tmdbRes = await fetch(tmdbUrl.toString());
    const text = await tmdbRes.text();

    return new Response(text, {
      status: tmdbRes.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    console.error("tmdb-proxy error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
