import { Skeleton } from "@/components/ui/skeleton";

function SkeletonRow() {
  return (
    <div className="flex justify-between px-3 py-0.5">
      <Skeleton className="h-2.5 w-16 bg-gray-800" />
      <Skeleton className="h-2.5 w-14 bg-gray-800" />
      <Skeleton className="h-2.5 w-14 bg-gray-800" />
    </div>
  );
}

export function OrderBookSkeleton() {
  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-700">
      {/* Control bar */}
      <div className="flex items-center px-3 py-2 border-b border-gray-700 gap-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="w-5 h-5 rounded bg-gray-800" />
        ))}
      </div>
      {/* Header */}
      <div className="flex justify-between px-3 py-1">
        <Skeleton className="h-2.5 w-16 bg-gray-800" />
        <Skeleton className="h-2.5 w-14 bg-gray-800" />
        <Skeleton className="h-2.5 w-14 bg-gray-800" />
      </div>
      {/* Ask rows */}
      <div className="flex-1 flex flex-col justify-end gap-0.5 py-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
      {/* Price */}
      <div className="flex items-center px-3 py-1.5 border-y border-gray-700">
        <Skeleton className="h-4 w-24 bg-gray-800" />
      </div>
      {/* Bid rows */}
      <div className="flex-1 flex flex-col gap-0.5 py-1">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
      {/* Ratio bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-t border-gray-700">
        <Skeleton className="h-2.5 w-8 bg-gray-800" />
        <Skeleton className="flex-1 h-1.5 rounded bg-gray-800" />
        <Skeleton className="h-2.5 w-8 bg-gray-800" />
      </div>
    </div>
  );
}
