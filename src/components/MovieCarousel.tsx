import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MovieCard } from "./MovieCard";
import type { TMDBMovie } from "@/lib/tmdb";

interface MovieCarouselProps {
  title: string;
  items: TMDBMovie[];
  mediaType?: string;
}

export function MovieCarousel({ title, items, mediaType }: MovieCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }

  if (!items.length) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-3 px-4 font-display text-2xl tracking-wide text-foreground sm:px-0">{title}</h2>
      <div className="group relative">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-4 z-10 hidden w-12 items-center justify-center bg-gradient-to-r from-background/90 to-transparent opacity-0 transition-opacity group-hover:opacity-100 sm:flex"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-7 w-7 text-foreground" />
        </button>
        <div ref={scrollRef} className="carousel-row px-4 sm:px-0">
          {items.map((item) => (
            <MovieCard key={`${mediaType || item.media_type}-${item.id}`} item={item} mediaType={mediaType} />
          ))}
        </div>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-4 z-10 hidden w-12 items-center justify-center bg-gradient-to-l from-background/90 to-transparent opacity-0 transition-opacity group-hover:opacity-100 sm:flex"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-7 w-7 text-foreground" />
        </button>
      </div>
    </section>
  );
}
