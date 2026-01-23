export function PopularSkeletonCard() {
  return (
    <div className="shrink-0">
      <div className="relative h-30 w-30 rounded-[28px] bg-black/10 shadow-md animate-pulse">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 h-25 w-25 rounded-full bg-black/15" />

        <div className="absolute left-3 right-3 bottom-5 h-3 rounded bg-black/15" />
        <div className="absolute left-6 right-6 bottom-2 h-3 rounded bg-black/10" />
      </div>

      <div className="mt-2 flex justify-center">
        <div className="h-7 w-20 rounded-full bg-black/10 animate-pulse" />
      </div>
    </div>
  );
}