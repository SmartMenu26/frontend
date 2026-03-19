import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import type { SuggestedBlog } from "@/app/lib/blogs";
import type { Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";
import { formatPublishedDate } from "./utils";

type BlogGridProps = {
  items: SuggestedBlog[];
  locale: Locale;
  copy: {
    tag: string;
    readMore: string;
    emptyState: string;
  };
};

export default function BlogGrid({ items, locale, copy }: BlogGridProps) {
  if (!items.length) {
    return (
      <p className="mt-8 text-center text-base text-[#4A4D52]">
        {copy.emptyState}
      </p>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.slug}
          href={buildLocalizedPath(`/blog/${item.slug}`, locale)}
          className="group block h-full rounded-[28px] border border-black/5 bg-white shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)]"
        >
          <article>
            <div className="relative overflow-hidden rounded-[28px] rounded-b-none">
              {item.coverImage ? (
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="h-56 w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-56 items-center justify-center bg-gradient-to-br from-[#F0E3D0] to-[#F6F1EA] text-sm font-semibold uppercase tracking-wide text-[#A16B00]">
                  Smart Menu
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 px-6 py-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#7A5A2A]">
                <Newspaper size={16} aria-hidden="true" />
                <span>{copy.tag}</span>
              </div>
              <h3 className="text-2xl font-semibold text-[#1B1F1E] leading-snug line-clamp-2">
                {item.title}
              </h3>
              {item.excerpt && (
                <p className="text-sm text-[#4A4D52] line-clamp-3">{item.excerpt}</p>
              )}
              {item.publishedAt && (
                <p className="text-xs font-medium uppercase tracking-wide text-[#7A5A2A]/80">
                  {formatPublishedDate(item.publishedAt, locale)}
                </p>
              )}
              <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#355B4B]">
                {copy.readMore}
                <ArrowRight size={18} aria-hidden="true" className="transition-transform" />
              </span>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}
