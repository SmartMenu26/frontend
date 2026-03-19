import type { Locale } from "@/i18n";
import { formatPublishedDate } from "./utils";
import BlogTags from "./BlogTags";

type BlogHeroProps = {
  title: string;
  excerpt?: string;
  coverImage?: string | null;
  publishedAt?: string | null;
  readingTimeLabel?: string | null;
  eyebrow?: string;
  tags?: string[];
  typeLabel?: string;
  locale: Locale;
};

export default function BlogHero({
  title,
  excerpt,
  coverImage,
  publishedAt,
  readingTimeLabel,
  eyebrow,
  tags,
  typeLabel,
  locale,
}: BlogHeroProps) {
  const formattedDate = formatPublishedDate(publishedAt, locale);
  const metaParts = [formattedDate, readingTimeLabel].filter(Boolean);
  const metaLine = [typeLabel, metaParts.join(" • ").trim()].filter(Boolean).join(" • ");

  return (
    <section className="bg-white">
      <div className="container mx-auto px-4 pb-12 pt-12 text-center md:max-w-3xl">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#7A5A2A]">
            {eyebrow}
          </p>
        )}
        <BlogTags tags={tags} className="mt-4 justify-center" />
        <h1 className="mt-4 text-2xl font-semibold leading-tight text-[#1B1F1E] md:text-5xl">
          {title}
        </h1>
        {metaLine && (
          <p className="mt-4 text-sm font-medium uppercase tracking-wide text-[#4A4D52]">
            {metaLine}
          </p>
        )}
        {excerpt && (
          <p className="mt-6 text-lg text-[#4A4D52] md:text-xl">
            {excerpt}
          </p>
        )}
      </div>
      {coverImage && (
        <div className="container mx-auto px-4 pb-12">
          <div className="relative overflow-hidden rounded-[40px] border border-black/5 bg-white shadow-[0_24px_50px_rgba(0,0,0,0.08)]">
            <img
              src={coverImage}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </section>
  );
}
