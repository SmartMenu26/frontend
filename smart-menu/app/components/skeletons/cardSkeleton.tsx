    export function SkeletonCard() {
        return (
            <div className="shrink-0">
                {/* card box */}
                <div className="relative h-40 w-40 rounded-[28px] bg-black/10 shadow-md animate-pulse">
                    {/* image placeholder (sticks out) */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-32.5 w-32.5 rounded-full bg-black/10" />

                    {/* title placeholder */}
                    <div className="absolute left-4 right-4 bottom-6 h-4 rounded bg-black/10" />
                    <div className="absolute left-8 right-8 bottom-2 h-3 rounded bg-black/10" />
                </div>

                {/* price pill */}
                <div className="mt-2 flex justify-center">
                    <div className="h-7 w-20 rounded-full bg-black/10 animate-pulse" />
                </div>
            </div>
        );
    }
    