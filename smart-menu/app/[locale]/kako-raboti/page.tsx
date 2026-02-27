import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";
import { TrackedAnchor, TrackedLink } from "@/app/components/ui/TrackedLink";
import { PageLabelTracker } from "@/app/components/analytics/PageLabelTracker";

const STEP_KEYS = ["upload", "qr", "assistant", "insights"] as const;
const COMPARISON_INDEXES = [0, 1, 2, 3] as const;
const PAGE_LABEL: Record<Locale, string> = {
  mk: "Како работи",
  sq: "Si funksionon",
  en: "How It Works",
};

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function HowItWorksPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "howItWorks" });

  const steps = STEP_KEYS.map((key) => ({
    key,
    title: t(`steps.${key}.title`),
    body: t(`steps.${key}.body`),
  }));
  const comparisonItems = COMPARISON_INDEXES.map((idx) => t(`comparison.items.${idx}`));
  const localSeoCopy = t("localSeo");

  const homeHref = buildLocalizedPath("/", locale);
  const demoHref = "mailto:restaurantsmart26@gmail.com?subject=Smart%20Menu%20Demo";
  const contactHref = buildLocalizedPath("/#contact", locale);

  return (
    <div className="bg-[#F7F7F7] text-[#1B1F1E]">
      <PageLabelTracker label={PAGE_LABEL[locale]} locale={locale} />
      <section className="container mx-auto px-4 py-16">
        <Link href={homeHref} className="inline-flex mb-4" aria-label="Smart Menu home">
          <Image
            src="/icons/smart-logo-512x512.png"
            alt="Smart Menu"
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
            priority
          />
        </Link>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#7A5A2A]">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[#4A4D52]">{t("hero.description")}</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <TrackedAnchor
            href={demoHref}
            className="inline-flex items-center justify-center rounded-full bg-[#1B1F1E] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#2C3330]"
            eventName="cta_click"
            eventParams={{ section: "how_it_works", cta: "hero_primary", locale }}
          >
            {t("cta.primary")}
          </TrackedAnchor>
          <TrackedLink
            href={contactHref}
            className="inline-flex items-center justify-center rounded-full border border-[#1B1F1E] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#1B1F1E] transition hover:bg-[#1B1F1E] hover:text-white"
            eventName="cta_click"
            eventParams={{ section: "how_it_works", cta: "hero_secondary", locale }}
          >
            {t("cta.secondary")}
          </TrackedLink>
        </div>
      </section>

      <section className="container mx-auto grid gap-6 px-4 pb-20 md:grid-cols-2">
        {steps.map((step, index) => (
          <div
            key={step.key}
            className="rounded-3xl border border-[#E2E4E9] bg-white p-6 shadow-sm"
          >
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7A5A2A]">
              {index + 1}
            </span>
            <h3 className="mt-3 text-2xl font-semibold text-[#1B1F1E]">{step.title.replace(/^\d+\.\s*/, "")}</h3>
            <p className="mt-3 text-[#4A4D52]">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="bg-white">
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-semibold text-[#1B1F1E]">{t("comparison.title")}</h2>
          <ul className="mt-6 grid gap-4 text-[#1B1F1E] md:grid-cols-2">
            {comparisonItems.map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-2xl border border-[#E2E4E9] bg-[#F7F7F7] px-4 py-3 text-sm">
                <span className="mt-1 block h-2 w-2 rounded-full bg-[#7A5A2A]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16 text-center">
        <p className="text-lg text-[#4A4D52]">{localSeoCopy}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <TrackedAnchor
            href={demoHref}
            className="inline-flex items-center justify-center rounded-full bg-[#1B1F1E] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#2C3330]"
            eventName="cta_click"
            eventParams={{ section: "how_it_works", cta: "footer_primary", locale }}
          >
            {t("cta.primary")}
          </TrackedAnchor>
          <TrackedLink
            href={contactHref}
            className="inline-flex items-center justify-center rounded-full border border-[#1B1F1E] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#1B1F1E] transition hover:bg-[#1B1F1E] hover:text-white"
            eventName="cta_click"
            eventParams={{ section: "how_it_works", cta: "footer_secondary", locale }}
          >
            {t("cta.secondary")}
          </TrackedLink>
        </div>
      </section>
    </div>
  );
}
