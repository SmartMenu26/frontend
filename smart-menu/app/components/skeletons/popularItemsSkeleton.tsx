export function PopularSkeletonCard() {
  return (
    <div className="shrink-0">
      <div className="relative h-[120px] w-[120px] rounded-[21px] bg-black/10 shadow-md animate-pulse">
        <div className="absolute -top-5 left-1/2 h-[90px] w-[90px] -translate-x-1/2 rounded-full bg-black/15" />

        <div className="absolute left-3 right-3 bottom-6 h-3 rounded bg-black/15" />
        <div className="absolute left-6 right-6 bottom-3 h-3 rounded bg-black/10" />
      </div>

      <div className="mt-2 flex justify-center">
        <div className="h-6 w-20 rounded-full bg-black/10 animate-pulse" />
      </div>
    </div>
  );
}
