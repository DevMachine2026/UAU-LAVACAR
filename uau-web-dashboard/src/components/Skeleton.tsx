import { cn } from "@/utils/cn";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-gray-200", className)} />
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <SkeletonBlock className="h-3 w-20" />
      <SkeletonBlock className="mt-3 h-7 w-32" />
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="h-10 border-b border-gray-200 bg-gray-50" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          className="flex gap-4 border-b border-gray-100 px-4 py-3 last:border-0"
          key={i}
        >
          {Array.from({ length: cols }).map((__, j) => (
            <SkeletonBlock
              className={`h-4 ${j === 0 ? "w-1/3" : "w-20"}`}
              key={j}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          key={i}
        >
          <SkeletonBlock className="h-4 w-3/4" />
          <SkeletonBlock className="mt-2 h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
