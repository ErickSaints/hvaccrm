export function SkeletonCard() {
  return (
    <div className="card !p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 animate-pulse">
      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 ml-auto" />
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="card !p-6 animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4" />
      <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}
