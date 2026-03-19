import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import RestaurantHeader from "@/app/components/ui/RestaurantHeader";
import LanguageSwitcher from "@/app/components/languageSwitcher/LanguageSwitcher";
import Footer from "@/app/components/ui/Footer";
import BlogGrid from "@/app/components/blog/BlogGrid";
import BlogPagination from "@/app/components/blog/BlogPagination";
import { fetchBlogList } from "@/app/lib/blogs";
import { defaultLocale, locales, type Locale } from "@/i18n";
import { getSiteUrl } from "@/lib/siteMeta";
import { buildLocalizedPath } from "@/lib/routing";

const BLOGS_PER_PAGE = 9;

export const revalidate = 300;

const resolveLocale = (value: string): Locale =>
  (locales.find((candidate) => candidate === value) ?? defaultLocale) as Locale;

const parsePage = (value: unknown) => {
  if (typeof value !== "string") return 1;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

type PageParams = {
  locale: string;
};

type PageProps = {
  params: Promise<PageParams>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale: routeLocale } = await params;
  const locale = resolveLocale(routeLocale);
  const t = await getTranslations({ locale, namespace: "blogIndex" });
  const title = t("meta.title");
  const description = t("meta.description");
  const canonicalPath = buildLocalizedPath("/blog", locale);
  const siteUrl = getSiteUrl();

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}${canonicalPath}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BlogIndexPage({ params, searchParams }: PageProps) {
  const { locale: routeLocale } = await params;
  const locale = resolveLocale(routeLocale);
  const resolvedSearch = (searchParams ? await searchParams : {}) ?? {};
  const currentPage = parsePage(resolvedSearch.page);

  const [{ items, meta }, t] = await Promise.all([
    fetchBlogList({ page: currentPage, limit: BLOGS_PER_PAGE }),
    getTranslations({ locale, namespace: "blogIndex" }),
  ]);

  const hero = {
    eyebrow: t("hero.eyebrow"),
    title: t("hero.title"),
    description: t("hero.description"),
    count: t("hero.count", { count: meta.total }),
  };

  const gridCopy = {
    tag: t("grid.tag"),
    readMore: t("grid.readMore"),
    emptyState: t("grid.empty"),
  };

  const paginationCopy = {
    previous: t("pagination.previous"),
    next: t("pagination.next"),
  };

  return (
    <>
      <div className="min-h-screen bg-[#F7F7F7]">
        <RestaurantHeader showName={false} />
        <section className="bg-[#F7F7F7] pb-10 pt-16">
          <div className="container mx-auto px-4 text-center md:max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#7A5A2A]">
              {hero.eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-semibold text-[#1B1F1E] md:text-5xl">
              {hero.title}
            </h1>
            <p className="mt-4 text-lg text-[#4A4D52]">{hero.description}</p>
            <p className="mt-2 text-sm text-[#7A5A2A]/80">{hero.count}</p>
          </div>
        </section>
        <section className="pb-20">
          <div className="container mx-auto px-4">
            <BlogGrid items={items} locale={locale} copy={gridCopy} />
            <BlogPagination page={meta.page} pages={meta.pages} locale={locale} copy={paginationCopy} />
          </div>
        </section>
        <Footer />
      </div>
      <div className="pointer-events-auto fixed bottom-4 right-4 z-50">
        <Suspense fallback={null}>
          <LanguageSwitcher />
        </Suspense>
      </div>
    </>
  );
}
