import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n";
import { TrackedAnchor } from "@/app/components/ui/TrackedLink";
import { buildLocalizedPath } from "@/lib/routing";
import { PageLabelTracker } from "@/app/components/analytics/PageLabelTracker";

const STAT_INDEXES = [0, 1, 2] as const;
const PAGE_LABEL: Record<Locale, string> = {
  mk: "За нас",
  sq: "Rreth nesh",
  en: "About Us",
};

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  const stats = STAT_INDEXES.map((idx) => t(`stats.${idx}`));
  const contactEvent = (channel: string) => ({
    eventName: "contact_click",
    eventParams: { channel, locale },
  });
  const homeHref = buildLocalizedPath("/", locale);

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
            priority
            className="h-16 w-16 rounded-full object-cover"
          />
        </Link>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#7A5A2A]">
          {t("hero.eyebrow")}
        </p>
        <h1 className="mt-4 text-4xl font-semibold md:text-5xl">{t("hero.title")}</h1>
        <p className="mt-4 max-w-3xl text-lg text-[#4A4D52]">{t("hero.description")}</p>
      </section>

      <section className="container mx-auto grid gap-6 px-4 pb-12 md:grid-cols-2">
        <div className="rounded-3xl border border-[#E2E4E9] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-[#1B1F1E]">{t("mission.title")}</h2>
          <p className="mt-3 text-[#4A4D52]">{t("mission.body")}</p>
          <ul className="mt-6 space-y-2 text-sm text-[#1B1F1E]">
            {stats.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 block h-2 w-2 rounded-full bg-[#1B1F1E]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-[#E2E4E9] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-[#1B1F1E]">{t("founder.title")}</h2>
          <p className="mt-3 text-[#4A4D52]">{t("founder.body")}</p>
        </div>
      </section>

      <section className="container mx-auto grid gap-6 px-4 pb-20 md:grid-cols-2">
        <div className="rounded-3xl border border-[#E2E4E9] bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold">{t("contact.title")}</h2>
          <div className="mt-4 space-y-2 text-[#4A4D52]">
            <p>
              <strong>Email:</strong>{" "}
              <TrackedAnchor
                className="underline"
                href={`mailto:${t("contact.email")}`}
                {...contactEvent("email")}
              >
                {t("contact.email")}
              </TrackedAnchor>
            </p>
            <p>
              <strong>Phone:</strong>{" "}
              <TrackedAnchor
                className="underline"
                href={`tel:${t("contact.phone")}`}
                {...contactEvent("phone")}
              >
                {t("contact.phone")}
              </TrackedAnchor>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
