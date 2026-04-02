import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";

export default async function NotFoundPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations({ locale, namespace: "notFound" });
  const homepageHref = buildLocalizedPath("/", locale);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#101217] px-4 py-24 text-center text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#fbd3a7]/40 blur-3xl" aria-hidden />
        <div className="absolute bottom-[-15%] right-[-10%] h-80 w-80 rounded-full bg-[#a2c4ff]/25 blur-3xl" aria-hidden />
      </div>
      <div className="relative flex w-full max-w-4xl flex-col items-center text-center">
        <Image
          src="/icons/404-page.png"
          width={1008}
          height={1053}
          alt={t("imageAlt")}
          className="h-auto w-full max-w-[440px] md:max-w-[540px] rounded-[123px]"
          priority
        />
        <h1 className="mt-10 text-4xl font-semibold md:text-5xl">{t("title")}</h1>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#fbd3a7]">
          {t("eyebrow")}
        </p>
        <p className="mt-4 max-w-2xl text-base text-white/85 md:text-lg">
          {t("description")}
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={homepageHref}
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#111315] transition hover:bg-white/90"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            {t("primaryCta")}
          </Link>
          <Link
            href="mailto:restaurantsmart26@gmail.com"
            className="inline-flex items-center justify-center rounded-full border border-white/60 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:border-white hover:bg-white/10"
          >
            <LifeBuoy className="mr-2 h-4 w-4" aria-hidden />
            {t("secondaryCta")}
          </Link>
        </div>
        <p className="mt-6 text-xs uppercase tracking-[0.2em] text-white/50">
          {t("hint")}
        </p>
      </div>
    </div>
  );
}
