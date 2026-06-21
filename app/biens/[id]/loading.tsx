import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="bg-white">
      <div className="container py-8">
        <Skeleton className="h-4 w-40" />

        <div className="mt-6 grid gap-2 sm:grid-cols-4 sm:grid-rows-2">
          <Skeleton className="aspect-[4/3] w-full sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:h-full" />
          <Skeleton className="hidden aspect-[4/3] w-full sm:block" />
          <Skeleton className="hidden aspect-[4/3] w-full sm:block" />
          <Skeleton className="hidden aspect-[4/3] w-full sm:block" />
          <Skeleton className="hidden aspect-[4/3] w-full sm:block" />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="space-y-3 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          </div>

          <div>
            <div className="card-surface space-y-4 p-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-72 w-full" />
              <Skeleton className="h-12 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
