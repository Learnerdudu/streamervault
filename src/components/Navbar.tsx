import { Link, useNavigate } from "react-router-dom";
import { Search, Film } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { searchMulti, getImageUrl, type TMDBMovie } from "@/lib/tmdb";

export function Navbar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    }
    function onScroll() {
      setScrolled(window.scrollY > 30);
    }
    document.addEventListener("mousedown", handleClick);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClick);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  function handleSearch(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await searchMulti(value);
      setResults(res.slice(0, 8));
    }, 350);
  }

  function handleSelect(item: TMDBMovie) {
    const type = item.media_type === "tv" ? "tv" : "movie";
    navigate(`/watch/${type}/${item.id}`);
    setShowSearch(false);
    setQuery("");
    setResults([]);
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-background/95 backdrop-blur-md shadow-lg" : "bg-gradient-to-b from-background/90 to-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 group">
          <Film className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
          <span className="font-display text-2xl tracking-wide text-foreground">
            STREAM<span className="text-primary">VAULT</span>
          </span>
        </Link>

        <div ref={searchRef} className="relative">
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-secondary/70 px-3 py-1.5 transition-colors focus-within:border-primary/60">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search movies & shows..."
              className="w-40 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none sm:w-64"
              value={query}
              onFocus={() => setShowSearch(true)}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          {showSearch && results.length > 0 && (
            <div className="absolute right-0 top-12 w-80 overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
              {results.map((item) => (
                <button
                  key={`${item.media_type}-${item.id}`}
                  onClick={() => handleSelect(item)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent"
                >
                  {item.poster_path ? (
                    <img src={getImageUrl(item.poster_path, "w92")!} alt="" className="h-14 w-10 rounded object-cover" />
                  ) : (
                    <div className="flex h-14 w-10 items-center justify-center rounded bg-muted text-xs text-muted-foreground">N/A</div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{item.title || item.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {item.media_type} · {(item.release_date || item.first_air_date || "").slice(0, 4)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
