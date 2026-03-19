import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { SuggestedBlog } from "@/app/lib/blogs";
import type { Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";
import { formatPublishedDate } from "./utils";

type BlogSuggestionsProps = {
  items: SuggestedBlog[];
  locale: Locale;
  copy: {
    eyebrow: string;
    title: string;
    ctaLabel: string;
  };
};

export default function BlogSuggestions({ items, locale, copy }: BlogSuggestionsProps) {
  if (!items.length) return null;

  return (
    <section className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#7A5A2A]">{copy.eyebrow}</p>
          <h2 className="text-3xl font-semibold text-[#1B1F1E]">{copy.title}</h2>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={buildLocalizedPath(`/blog/${item.slug}`, locale)}
              className="group flex h-full flex-col rounded-3xl border border-black/5 bg-[#F9F9F9] p-4 shadow-[0_16px_30px_rgba(0,0,0,0.05)] transition hover:shadow-[0_18px_32px_rgba(0,0,0,0.08)]"
            >
              <div className="relative overflow-hidden rounded-2xl bg-white">
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="h-48 w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-gradient-to-br from-[#F0E3D0] to-[#F6F1EA] text-sm font-medium text-[#A16B00]">
                    Smart Menu
                  </div>
                )}
              </div>
              <div className="mt-5 flex flex-1 flex-col">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#7A5A2A]/80">
                  {formatPublishedDate(item.publishedAt, locale) ?? ""}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[#1B1F1E] line-clamp-2">
                  {item.title}
                </h3>
                {item.excerpt && (
                  <p className="mt-2 text-sm text-[#4A4D52] line-clamp-3">{item.excerpt}</p>
                )}
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#355B4B]">
                  {copy.ctaLabel}
                  <ArrowUpRight size={18} className="transition-transform" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
