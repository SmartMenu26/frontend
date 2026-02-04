export function SkeletonCard() {
  return (
    <div className="shrink-0">
      {/* card box */}
      <div className="relative h-[140px] w-[140px] rounded-[21px] bg-black/10 shadow-md animate-pulse">
        {/* image placeholder (sticks out) */}
        <div className="absolute -top-4 left-1/2 h-[105px] w-[105px] -translate-x-1/2 rounded-full bg-black/15" />

        {/* title placeholder */}
        <div className="absolute left-4 right-4 bottom-8 h-4 rounded bg-black/10" />
        <div className="absolute left-6 right-6 bottom-4 h-3 rounded bg-black/10" />
      </div>

      {/* price pill */}
      <div className="mt-2 flex justify-center">
        <div className="h-7 w-24 rounded-full bg-black/10 animate-pulse" />
      </div>
    </div>
  );
}
    
