import { Skeleton } from "@/components/ui/skeleton";

export function PosterRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[2/3] w-full rounded-lg" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[75vh] min-h-[500px] w-full">
      <Skeleton className="h-full w-full rounded-none" />
      <div className="absolute bottom-24 left-12 max-w-2xl space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-16 w-96" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}
