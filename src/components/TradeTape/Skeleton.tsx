import { Skeleton } from "@/components/ui/skeleton";

export function TradeTapeSkeleton() {
  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex justify-between px-3 py-2 border-b border-gray-700">
        <Skeleton className="h-2.5 w-8 bg-gray-800" />
        <Skeleton className="h-2.5 w-20 bg-gray-800" />
        <Skeleton className="h-2.5 w-16 bg-gray-800" />
      </div>
      {/* Rows */}
      <div className="flex-1 flex flex-col gap-0.5 py-1 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex justify-between px-3 py-0.5">
            <Skeleton className="h-2.5 w-10 bg-gray-800" />
            <Skeleton
              className="h-2.5 bg-gray-800"
              style={{ width: `${48 + (i % 3) * 12}px` }}
            />
            <Skeleton className="h-2.5 w-14 bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
