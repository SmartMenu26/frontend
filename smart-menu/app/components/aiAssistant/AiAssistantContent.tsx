"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import RestaurantHeader from "@/app/components/ui/RestaurantHeader";
import AiAssistantPromptPanel, {
  type AiAssistantRouterResponse,
} from "@/app/components/aiAssistant/AiAssistantPromptPanel";
import assistantIllustration from "@/public/images/ai-assistant-cook.png";
import assistantThinking from "@/public/images/ai-assistant-cook-thinking.png";
import menuItemPlaceholder from "@/public/images/menu-item-placeholder.png";
import noCreditsImage from "@/public/images/no-credits.png";
import { type Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";

type Suggestion = {
  id: string;
  label: string;
  icon: string;
};

type LocalizedField = Partial<Record<Locale, string>> | string;

type Candidate = {
  _id?: string;
  name?: LocalizedField;
  description?: LocalizedField;
  image?: {
    url?: string;
    alt?: Partial<Record<Locale, string>>;
    altMk?: string;
    altSq?: string;
    altEn?: string;
  };
};

const localeFallbackOrder: Locale[] = ["mk", "sq", "en"];
type AiAssistantResponse = AiAssistantRouterResponse<Candidate>;
const fallbackCandidateTitle: Record<Locale, string> = {
  mk: "Предлог",
  sq: "Sugjerim",
  en: "Suggestion",
};
const fallbackCandidateDescription: Record<Locale, string> = {
  mk: "Пробај го овој специјалитет.",
  sq: "Provo këtë specialitet.",
  en: "Give this special a try.",
};

function resolveLocalizedField(
  value: LocalizedField | undefined,
  locale: Locale
) {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  const chain = [locale, ...localeFallbackOrder.filter((code) => code !== locale)];
  for (const code of chain) {
    const candidate = value[code];
    if (candidate) return candidate;
  }
  return undefined;
}

type Props = {
  restaurantId: string;
  suggestionPrompts: Suggestion[];
  prompt: string;
  restaurantName?: string;
  assistantName?: LocalizedField;
  aiCreditsRemaining?: number;
};

export default function AiAssistantContent({
  restaurantId,
  suggestionPrompts,
  prompt,
  restaurantName,
  assistantName,
  aiCreditsRemaining,
}: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations("aiAssistantContent");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">(
    "idle"
  );
  const [assistantText, setAssistantText] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [resultLocale, setResultLocale] = useState<Locale | null>(null);
  const restaurantHomeHref = useMemo(
    () => buildLocalizedPath(`/restaurant/${restaurantId}`, locale),
    [locale, restaurantId]
  );
  const noCreditsTitle = t("noCreditsTitle");
  const backToMenuLabel = t("backToMenu");

  const handleResult = useCallback((payload?: AiAssistantResponse) => {
    const dataBlock = payload?.data;
    const nestedData = Array.isArray(dataBlock) ? undefined : dataBlock;
    const nestedCandidates = Array.isArray(dataBlock)
      ? dataBlock
      : nestedData?.candidates;

    const text =
      payload?.router?.assistantText ??
      nestedData?.router?.assistantText ??
      "";
    const items = payload?.candidates ?? nestedCandidates ?? [];
    const routerLanguage =
      payload?.router?.language ?? nestedData?.router?.language ?? null;

    setAssistantText(text);
    setCandidates(Array.isArray(items) ? items : []);
    setResultLocale(routerLanguage ?? null);
  }, []);

  const restaurantDisplayName = restaurantName?.trim();
  const heroImage = status === "loading" ? assistantThinking : assistantIllustration;
  const hasCredits =
    typeof aiCreditsRemaining === "number" ? aiCreditsRemaining > 0 : true;
  const displayLocale = resultLocale ?? locale;
  const assistantDisplayName =
    resolveLocalizedField(assistantName, displayLocale) || "Асистентот";

  return (
    <div className="min-h-dvh bg-[#F5F5F5] text-[#1E1F24]">
      <RestaurantHeader showName={false} />
      <div className="mx-auto flex w-full max-w-md flex-col px-6">
        <header className="h-[10vh] flex items-center justify-between">
          <Link
            href={restaurantHomeHref}
            aria-label={backToMenuLabel}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1E1F24] shadow-md transition hover:bg-[#f1f1f1]"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>

          <div className="h-10 w-10 rounded-full bg-transparent" />
        </header>

        {hasCredits ? (
          <div className="pb-4 h-[95vh] text-center flex flex-col justify-around">
            {status === "idle" && (
              <p className="text-left text-[22px] leading-snug text-[#4B4F54]">
                {t("intro.prefix")}{" "}
                <span className="font-semibold text-[#1E1F24]">{assistantDisplayName}!</span>
                <br />
                {t("intro.suffix")}
              </p>
            )}

            <div className="flex justify-center">
              <Image
                key={status === "loading" ? "thinking" : "regular"}
                src={heroImage}
                alt={`AI Асистент ${assistantDisplayName}`}
                priority
                className="h-auto w-60 max-w-full select-none transition-opacity duration-300"
              />
            </div>

            {status === "loading" && (
              <div className="mt-4 flex flex-col items-center gap-1 text-sm font-medium text-[#4B4F54]">
                <span className="text-md">{t("loading.caption")}</span>
                <span className="flex items-center gap-1">
                  {[0, 1, 2].map((idx) => (
                    <span
                      key={idx}
                      className="h-1.5 w-1.5 rounded-full bg-[#4B4F54] animate-bounce"
                      style={{ animationDelay: `${idx * 0.2}s` }}
                    />
                  ))}
                </span>
              </div>
            )}

            {status !== "loading" && (assistantText || candidates.length) ? (
              <div className="mt-4 flex max-h-[40vh] flex-col gap-3 overflow-auto text-left">
                {assistantText ? (
                  <p className="mt-6 rounded-2xl bg-[#F4F5F7] px-3 py-3 text-left text-sm text-[#4B4F54]">
                    {assistantText}
                  </p>
                ) : null}

                {candidates.length > 0 ? (
                  candidates.map((item) => {
                    const id = item?._id ?? "";
                    const title =
                      resolveLocalizedField(item?.name, displayLocale) ??
                      fallbackCandidateTitle[displayLocale];
                    const description =
                      resolveLocalizedField(item?.description, displayLocale) ??
                      fallbackCandidateDescription[displayLocale];
                    const img = item?.image?.url ?? menuItemPlaceholder.src;
                    const imageAlt =
                      resolveLocalizedField(item?.image?.alt, displayLocale) ??
                      resolveLocalizedField(
                        {
                          mk: item?.image?.altMk,
                          sq: item?.image?.altSq,
                          en: item?.image?.altEn,
                        },
                        displayLocale
                      ) ??
                      title;

                    const href = id
                      ? buildLocalizedPath(
                          `/restaurant/${restaurantId}/menuItem/${id}`,
                          locale
                        )
                      : restaurantHomeHref;

                    return (
                      <Link
                        key={id + title}
                        href={href}
                        className="flex items-center gap-3 rounded-[22px] border border-[#ECEFF5] bg-white px-3 py-3 text-[#1E1F24] shadow-sm transition hover:border-[#C2CADB]"
                      >
                        <Image
                          src={img}
                          alt={imageAlt}
                          width={56}
                          height={56}
                          className="h-14 w-14 rounded-2xl object-cover"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-[#1E1F24]">
                            {title}
                          </p>
                          <p className="mt-1 text-xs text-[#6B7280] line-clamp-2">
                            {description}
                          </p>
                        </div>
                        <svg
                          className="h-4 w-4 text-[#4B4F54]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="7" y1="17" x2="17" y2="7" />
                          <polyline points="7 7 17 7 17 17" />
                        </svg>
                      </Link>
                    );
                  })
                ) : (
                  <p className="rounded-2xl border border-dashed border-[#C8CED8] bg-white/70 px-4 py-4 text-sm text-[#6B7280]">
                    Нема препораки за ова барање. Пробај да побараш конкретна храна или пијалок.
                  </p>
                )}
              </div>
            ) : null}

            {pendingMessage ? (
              <div className="mb-3 flex justify-end">
                <div className="max-w-[75%] rounded-3xl bg-[#E7F3EC] px-4 py-3 text-right text-sm font-medium text-[#1E1F24] shadow-[0_4px_12px_rgba(15,24,21,0.06)]">
                  {pendingMessage}
                </div>
              </div>
            ) : null}

            <AiAssistantPromptPanel<Candidate>
              suggestionPrompts={suggestionPrompts}
              initialMessage={prompt}
              restaurantId={restaurantId}
              restaurantName={restaurantDisplayName}
              onStatusChange={setStatus}
              onResult={handleResult}
              onPromptPending={setPendingMessage}
              onPromptSettled={() => setPendingMessage(null)}
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
            <Image
              src={noCreditsImage}
              alt="No credits illustration"
              priority
              className="h-[50vh] max-w-full select-none object-cover"
            />
            <p className="text-lg font-medium text-[#1E1F24]">
              {noCreditsTitle}
            </p>
            <Link
              href={restaurantHomeHref}
              aria-label={backToMenuLabel}
              className="inline-flex items-center justify-center text-[#1E1F24] underline"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
              {backToMenuLabel}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
