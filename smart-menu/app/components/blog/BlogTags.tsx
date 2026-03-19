type BlogTagsProps = {
  tags?: string[];
  variant?: "default" | "compact";
  className?: string;
};

const basePillClasses =
  "inline-flex items-center rounded-full bg-[#FFF8EE] text-[#7A5A2A] uppercase tracking-[0.2em] font-semibold";

const variantClasses: Record<NonNullable<BlogTagsProps["variant"]>, string> = {
  default: "px-3 py-1 text-[11px] md:text-xs",
  compact: "px-2.5 py-0.5 text-[10px]",
};

export default function BlogTags({
  tags,
  variant = "default",
  className = "",
}: BlogTagsProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className={["flex flex-wrap gap-2", className].filter(Boolean).join(" ")}>
      {tags.map((tag) => (
        <span key={tag} className={[basePillClasses, variantClasses[variant]].join(" ")}>
          {tag.toUpperCase()}
        </span>
      ))}
    </div>
  );
}
