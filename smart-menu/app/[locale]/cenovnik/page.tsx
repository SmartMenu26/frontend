import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n";
import { TrackedAnchor } from "@/app/components/ui/TrackedLink";
import { buildLocalizedPath } from "@/lib/routing";
import { PageLabelTracker } from "@/app/components/analytics/PageLabelTracker";

const PLAN_KEYS = ["starter", "pro", "enterprise"] as const;
const FEATURE_INDEXES = [0, 1, 2, 3] as const;
const ROI_INDEXES = [0, 1, 2] as const;
const FAQ_INDEXES = [0, 1, 2] as const;
const PAGE_LABEL: Record<Locale, string> = {
  mk: "Ценовник",
  sq: "Çmime",
  en: "Pricing",
};

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });
  const homeHref = buildLocalizedPath("/", locale);

  const plans = PLAN_KEYS.map((key) => ({
    key,
    name: t(`plans.${key}.name`),
    price: t(`plans.${key}.price`),
    period: t(`plans.${key}.period`),
    description: t(`plans.${key}.description`),
    features: FEATURE_INDEXES.map((idx) => t(`plans.${key}.features.${idx}`)),
  }));

  const roiItems = ROI_INDEXES.map((idx) => t(`roi.items.${idx}`));
  const faqItems = FAQ_INDEXES.map((idx) => ({
    question: t(`faq.${idx}.question`),
    answer: t(`faq.${idx}.answer`),
  }));
  const aiCredits = {
    title: t("aiCredits.title"),
    price: t("aiCredits.price"),
    period: t("aiCredits.period"),
    description: t("aiCredits.description"),
    cta: t("aiCredits.cta"),
  };
  const planEventParams = (planKey: string) => ({
    eventName: "pricing_cta_click",
    eventParams: { plan: planKey, locale },
  });

  return (
    <div className="bg-[#F7F7F7] text-[#1B1F1E]">
      <PageLabelTracker label={PAGE_LABEL[locale]} locale={locale} />
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="mb-4 flex justify-center">
          <Link href={homeHref} aria-label="Smart Menu home" className="mb-4 inline-flex">
            <Image
              src="/icons/smart-logo-512x512.png"
              alt="Smart Menu"
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover"
              priority
            />
          </Link>
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#7A5A2A]">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-4 text-4xl font-semibold md:text-5xl">{t("hero.title")}</h1>
        <p className="mt-4 text-lg text-[#4A4D52]">{t("hero.description")}</p>
      </section>

      <section className="container mx-auto grid gap-6 px-4 pb-12 md:grid-cols-4">
        {plans.map((plan, index) => (
          <div
            key={plan.key}
            className={`rounded-3xl border border-[#E2E4E9] bg-white p-6 shadow-sm ${
              index === 1 ? "ring-2 ring-[#1B1F1E]" : ""
            }`}
          >
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#7A5A2A]">
              {plan.name}
            </p>
            <div className="mt-4 text-4xl font-semibold text-[#1B1F1E]">
              {plan.price}
              <span className="text-base font-medium text-[#4A4D52]">{plan.period}</span>
            </div>
            <p className="mt-2 text-[#4A4D52]">{plan.description}</p>
            <ul className="mt-6 space-y-2 text-left text-sm text-[#1B1F1E]">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#1B1F1E]" aria-hidden />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <TrackedAnchor
              href="mailto:restaurantsmart26@gmail.com"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[#1B1F1E] px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#2C3330]"
              {...planEventParams(plan.key)}
            >
              {t("cta")}
            </TrackedAnchor>
          </div>
        ))}
        <div className="rounded-3xl border border-[#0B3B2E] bg-[#0B3B2E] p-6 text-white shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
            AI
          </p>
          <div className="mt-4 text-4xl font-semibold">
            {aiCredits.price}
            <span className="text-base font-medium text-white/80">{aiCredits.period}</span>
          </div>
          <p className="mt-2 text-white/80">{aiCredits.description}</p>
          <TrackedAnchor
            href="mailto:restaurantsmart26@gmail.com"
            className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-white px-4 py-2 text-sm font-semibold uppercase tracking-wide transition hover:bg-white hover:text-[#0B3B2E]"
            {...planEventParams("ai_credits")}
          >
            {aiCredits.cta}
          </TrackedAnchor>
        </div>
      </section>

      <section className="container mx-auto grid gap-8 px-4 pb-20 md:grid-cols-2">
        <div className="rounded-3xl border border-[#E2E4E9] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">{t("roi.title")}</h2>
          <ul className="mt-4 space-y-3 text-[#4A4D52]">
            {roiItems.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 block h-2 w-2 rounded-full bg-[#7A5A2A]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-[#E2E4E9] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">FAQ</h2>
          <div className="mt-4 space-y-4">
            {faqItems.map((faq) => (
              <div key={faq.question}>
                <p className="font-semibold text-[#1B1F1E]">{faq.question}</p>
                <p className="text-sm text-[#4A4D52]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
