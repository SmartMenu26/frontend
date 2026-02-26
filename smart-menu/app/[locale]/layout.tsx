import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { locales } from "../../i18n";

const languageAlternates = locales.reduce<Record<string, string>>((acc, locale) => {
  acc[locale] = `/${locale}`;
  return acc;
}, {});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    alternates: {
      canonical: `/${locale}`,
      languages: languageAlternates,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) notFound();

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
