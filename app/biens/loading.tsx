import { PropertyGridSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main>
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <div className="container py-12">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-9 w-72" />
          <Skeleton className="mt-3 h-4 w-96 max-w-full" />
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
            <div className="hidden lg:block">
              <div className="card-surface space-y-4 p-5">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="mt-6">
                <PropertyGridSkeleton count={6} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
