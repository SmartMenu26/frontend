export function CategorySkeleton({ active = false }: { active?: boolean }) {
  return (
    <div
      className={[
        "shrink-0 pb-2",
        "h-5 md:h-10",
        "w-30 md:w-42.5",
        "rounded-full",
        "animate-pulse",
        active ? "bg-black/15" : "bg-black/10",
      ].join(" ")}
    />
  );
}
