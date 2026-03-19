import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import RestaurantHeader from "@/app/components/ui/RestaurantHeader";
import LanguageSwitcher from "@/app/components/languageSwitcher/LanguageSwitcher";
import Footer from "@/app/components/ui/Footer";
import BlogHero from "@/app/components/blog/BlogHero";
import BlogBody from "@/app/components/blog/BlogBody";
import BlogSuggestions from "@/app/components/blog/BlogSuggestions";
import {
  fetchBlogBySlug,
  fetchBlogSuggestions,
  estimateReadingMinutes,
} from "@/app/lib/blogs";
import { defaultLocale, locales, type Locale } from "@/i18n";
import { getSiteUrl } from "@/lib/siteMeta";
import { buildLocalizedPath } from "@/lib/routing";

export const revalidate = 300;

const BLOG_SUFFIX = "Smart Menu Blog";

const resolveLocale = (value: string): Locale =>
  (locales.find((candidate) => candidate === value) ?? defaultLocale) as Locale;

type PageParams = {
  locale: string;
  slug: string;
};

type PageProps = {
  params: Promise<PageParams>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale: routeLocale, slug } = await params;
  const locale = resolveLocale(routeLocale);
  const blog = await fetchBlogBySlug(slug);
  const siteUrl = getSiteUrl();
  const metadataBase = new URL(siteUrl);

  if (!blog) {
    const fallbackTitle = BLOG_SUFFIX;
    return {
      metadataBase,
      title: fallbackTitle,
      description: "Smart Menu blog article",
    };
  }

  const title = `${blog.title} | ${BLOG_SUFFIX}`;
  const description = blog.excerpt ?? undefined;
  const canonicalPath = buildLocalizedPath(`/blog/${blog.slug}`, locale);
  const absoluteUrl = `${siteUrl}${canonicalPath}`;
  const ogImages = blog.coverImage ? [{ url: blog.coverImage }] : undefined;

  return {
    metadataBase,
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImages?.map((image) => image.url),
    },
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { locale: routeLocale, slug } = await params;
  const locale = resolveLocale(routeLocale);
  const [blog, suggestions] = await Promise.all([
    fetchBlogBySlug(slug),
    fetchBlogSuggestions(slug, 3),
  ]);

  if (!blog) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "blogPage" });
  const readingMinutes = blog.blocks.length ? estimateReadingMinutes(blog.blocks) : null;
  const readingTimeLabel = readingMinutes ? t("meta.readingTime", { minutes: readingMinutes }) : null;
  const suggestionsCopy = {
    eyebrow: t("suggested.eyebrow"),
    title: t("suggested.title"),
    ctaLabel: t("suggested.cta"),
  };
  const heroEyebrow = t("hero.eyebrow");
  const heroTypeLabel = t("hero.typeLabel");

  return (
    <>
      <div className="min-h-screen bg-[#F7F7F7] text-[#1B1F1E]">
        <RestaurantHeader showName={false} />
        <BlogHero
          locale={locale}
          eyebrow={heroEyebrow}
          typeLabel={heroTypeLabel}
          title={blog.title}
          excerpt={blog.excerpt ?? undefined}
          coverImage={blog.coverImage}
          publishedAt={blog.publishedAt}
          readingTimeLabel={readingTimeLabel}
          tags={blog.tags}
        />
        <BlogBody blocks={blog.blocks} />
        <BlogSuggestions items={suggestions} locale={locale} copy={suggestionsCopy} />
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
