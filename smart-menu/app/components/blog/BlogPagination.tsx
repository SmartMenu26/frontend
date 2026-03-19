import Link from "next/link";
import type { Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";

type BlogPaginationProps = {
  page: number;
  pages: number;
  locale: Locale;
  copy: {
    previous: string;
    next: string;
  };
};

const buildHref = (targetPage: number, locale: Locale) => {
  const search = targetPage > 1 ? `?page=${targetPage}` : "";
  return buildLocalizedPath(`/blog${search}`, locale);
};

export default function BlogPagination({ page, pages, locale, copy }: BlogPaginationProps) {
  if (pages <= 1) return null;
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < pages ? page + 1 : null;

  return (
    <div className="mt-10 flex justify-between gap-4">
      <span>
        {prevPage ? (
          <Link
            href={buildHref(prevPage, locale)}
            className="inline-flex items-center gap-2 rounded-full border border-[#CED8D3] px-6 py-2 text-sm font-semibold text-[#355B4B] transition hover:bg-[#F4F7F5]"
          >
            ← {copy.previous}
          </Link>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-transparent px-6 py-2 text-sm text-[#9AA5A1]">
            ← {copy.previous}
          </span>
        )}
      </span>
      <span>
        {nextPage ? (
          <Link
            href={buildHref(nextPage, locale)}
            className="inline-flex items-center gap-2 rounded-full border border-[#CED8D3] px-6 py-2 text-sm font-semibold text-[#355B4B] transition hover:bg-[#F4F7F5]"
          >
            {copy.next} →
          </Link>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-transparent px-6 py-2 text-sm text-[#9AA5A1]">
            {copy.next} →
          </span>
        )}
      </span>
    </div>
  );
}
