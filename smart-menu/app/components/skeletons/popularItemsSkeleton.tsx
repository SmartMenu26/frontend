export function PopularSkeletonCard() {
  return (
    <div className="shrink-0">
      <div className="relative flex h-[200px] w-[200px] items-end justify-center rounded-[21px] bg-black/10 px-4 pb-2 pt-20 shadow-md animate-pulse">
        <div className="absolute -top-4 left-1/2 h-[155px] w-[155px] -translate-x-1/2 rounded-full bg-black/15" />

        <div className="w-full space-y-1.5">
          <div className="h-3 w-full rounded bg-black/15" />
          <div className="h-3 w-3/4 rounded bg-black/10" />
        </div>
      </div>

      <div className="mt-2 flex justify-center">
        <div className="h-6 w-20 rounded-full bg-black/10 animate-pulse" />
      </div>
    </div>
  );
}
