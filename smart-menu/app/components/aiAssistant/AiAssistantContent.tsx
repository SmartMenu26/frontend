"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import RestaurantHeader from "@/app/components/ui/RestaurantHeader";
import AiAssistantPromptPanel, {
  type AiAssistantRouterResponse,
} from "@/app/components/aiAssistant/AiAssistantPromptPanel";
import { type Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";
import { incrementMenuItemView } from "@/app/lib/menuItemViews";
import { preloadImage } from "@/app/lib/imagePreload";

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
  price?: number | string;
  priceValue?: number;
  image?: {
    url?: string;
    alt?: Partial<Record<Locale, string>>;
    altMk?: string;
    altSq?: string;
    altEn?: string;
  };
};

const localeFallbackOrder: Locale[] = ["mk", "sq", "en", "tr"];
type AiAssistantResponse = AiAssistantRouterResponse<Candidate>;
const fallbackCandidateTitle: Record<Locale, string> = {
  mk: "Предлог",
  sq: "Sugjerim",
  en: "Suggestion",
  tr: "Oneri",
};
const fallbackCandidateDescription: Record<Locale, string> = {
  mk: "Пробај го овој специјалитет.",
  sq: "Provo këtë specialitet.",
  en: "Give this special a try.",
  tr: "Bu spesiyali deneyin.",
};
const NO_CREDITS_IMAGE_SIZES = "(max-width: 768px) 80vw, 400px";
const CANDIDATE_IMAGE_SIZE = 56;
const CANDIDATE_IMAGE_SIZES = "56px";
const HERO_IMAGE_FALLBACK = "/images/ai-assistant-cook.png";
const HERO_THINKING_FALLBACK = "/images/ai-assistant-cook-thinking.png";
const NO_CREDITS_FALLBACK = "/images/no-credits.png";
const MENU_ITEM_PLACEHOLDER = "/images/menu-item-placeholder.webp";
const BACK_BUTTON_CLASSNAME =
  "inline-flex items-center rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-[#1E1F24] shadow-sm transition hover:border-black/15 hover:bg-white/90";

function resolveImageSource(
  primary?: string | null,
  fallback?: string,
  defaultSrc = ""
) {
  const trimmed = typeof primary === "string" ? primary.trim() : "";
  if (trimmed) return trimmed;
  if (fallback) return fallback;
  return defaultSrc;
}

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

function heroBackgroundImage(src: string) {
  return { backgroundImage: `url(${JSON.stringify(src)})` };
}

type Props = {
  restaurantId: string;
  restaurantSlug?: string;
  suggestionPrompts: Suggestion[];
  prompt: string;
  restaurantName?: string;
  assistantName?: LocalizedField;
  aiCreditsAvailable?: boolean;
  aiAssistantImageUrl?: string | null;
  aiAssistantThinkingImageUrl?: string | null;
  aiAssistantNoCreditsImageUrl?: string | null;
};

export default function AiAssistantContent({
  restaurantId,
  restaurantSlug,
  suggestionPrompts,
  prompt,
  restaurantName,
  assistantName,
  aiCreditsAvailable,
  aiAssistantImageUrl,
  aiAssistantThinkingImageUrl,
  aiAssistantNoCreditsImageUrl,
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
  const [loadedHeroSources, setLoadedHeroSources] = useState<
    Record<string, boolean>
  >({});
  const slugOrId = restaurantSlug ?? restaurantId;
  const restaurantHomeHref = useMemo(
    () => buildLocalizedPath(`/restaurant/${slugOrId}`, locale),
    [locale, slugOrId]
  );
  const noCreditsTitle = t("noCreditsTitle");
  const backToMenuLabel = t("backToMenu");
  const noRecommendationsText = t("noRecommendations");

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
  const regularHeroImageSrc = resolveImageSource(
    aiAssistantImageUrl,
    HERO_IMAGE_FALLBACK
  );
  const thinkingHeroImageSrc = resolveImageSource(
    aiAssistantThinkingImageUrl,
    HERO_THINKING_FALLBACK
  );
  const isThinking = status === "loading";
  const showThinkingHero =
    isThinking && loadedHeroSources[thinkingHeroImageSrc] === true;
  const noCreditsImageSrc = resolveImageSource(
    aiAssistantNoCreditsImageUrl,
    NO_CREDITS_FALLBACK,
    NO_CREDITS_FALLBACK
  );
  const hasCredits =
    typeof aiCreditsAvailable === "boolean" ? aiCreditsAvailable : true;
  const displayLocale = resultLocale ?? locale;
  const assistantDisplayName =
    resolveLocalizedField(assistantName, displayLocale) || "Асистентот";
  const numberLocale = useMemo(() => {
    switch (displayLocale) {
      case "sq":
        return "sq-AL";
      case "en":
        return "en-US";
      default:
        return "mk-MK";
    }
  }, [displayLocale]);
  const priceFormatter = useMemo(
    () =>
      new Intl.NumberFormat(numberLocale, {
        maximumFractionDigits: 2,
      }),
    [numberLocale]
  );
  const priceSuffix = useMemo(() => {
    switch (displayLocale) {
      case "sq":
        return "ден";
      case "en":
        return "MKD";
      default:
        return "ден";
    }
  }, [displayLocale]);

  useEffect(() => {
    let cancelled = false;

    const markLoaded = (src: string) => {
      if (cancelled) return;
      setLoadedHeroSources((current) =>
        current[src] ? current : { ...current, [src]: true }
      );
    };

    [regularHeroImageSrc, thinkingHeroImageSrc].forEach((src) => {
      const image = new window.Image();

      image.onload = () => markLoaded(src);
      image.src = src;

      if (image.complete && image.naturalWidth > 0) {
        queueMicrotask(() => markLoaded(src));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [regularHeroImageSrc, thinkingHeroImageSrc]);

  return (
    <div className="min-h-dvh bg-[#F5F5F5] text-[#1E1F24]">
      <RestaurantHeader showName={false} />
      <div className="mx-auto flex w-full max-w-md flex-col px-6">
        <header className="flex h-[10vh] items-center">
          <Link
            href={restaurantHomeHref}
            aria-label={backToMenuLabel}
            className={BACK_BUTTON_CLASSNAME}
          >
            <ChevronLeft aria-hidden="true" className="mr-1 h-4 w-4" />
            <span>{backToMenuLabel}</span>
          </Link>
        </header>

        {hasCredits ? (
          <div className="pb-4 h-[90vh] text-center flex flex-col justify-around">
            {status === "idle" && (
              <p className="text-left text-[22px] leading-snug text-[#4B4F54]">
                {t("intro.prefix")}{" "}
                <span className="font-semibold text-[#1E1F24]">{assistantDisplayName}!</span>
                <br />
                {t("intro.suffix")}
              </p>
            )}

            <div className="flex justify-center">
              <div
                role="img"
                aria-label={`AI Асистент ${assistantDisplayName}`}
                className="relative aspect-square w-72 max-w-full shrink-0 sm:w-80"
              >
                <div
                  aria-hidden="true"
                  style={heroBackgroundImage(regularHeroImageSrc)}
                  className={`absolute inset-0 bg-contain bg-center bg-no-repeat transition-opacity duration-200 ${
                    showThinkingHero ? "opacity-0" : "opacity-100"
                  }`}
                />
                <div
                  aria-hidden="true"
                  style={heroBackgroundImage(thinkingHeroImageSrc)}
                  className={`absolute inset-0 bg-contain bg-center bg-no-repeat transition-opacity duration-200 ${
                    showThinkingHero ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>
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
                    const resolvedImg = resolveImageSource(
                      item?.image?.url,
                      MENU_ITEM_PLACEHOLDER,
                      MENU_ITEM_PLACEHOLDER
                    );
                    const imageAlt =
                      resolveLocalizedField(item?.image?.alt, displayLocale) ??
                      resolveLocalizedField(
                        {
                          mk: item?.image?.altMk,
                          sq: item?.image?.altSq,
                          en: item?.image?.altEn,
                          tr: resolveLocalizedField(item?.image?.alt, "tr"),
                        },
                        displayLocale
                      ) ??
                      title;

                    const href = id
                      ? buildLocalizedPath(
                          `/restaurant/${slugOrId}/menuItem/${id}`,
                          locale
                        )
                      : restaurantHomeHref;
                    const resolvedPriceRaw =
                      typeof item?.price === "number"
                        ? item.price
                        : typeof item?.price === "string"
                        ? Number(
                            item.price
                              .replace(/[^\d.,.-]/g, "")
                              .replace(/,/g, ".")
                          )
                        : typeof item?.priceValue === "number"
                        ? item.priceValue
                        : undefined;
                    const priceLabel =
                      typeof resolvedPriceRaw === "number" &&
                      Number.isFinite(resolvedPriceRaw)
                        ? `${priceFormatter.format(resolvedPriceRaw)} ${priceSuffix}`
                        : null;

                    return (
                      <Link
                        key={id + title}
                        href={href}
                        onMouseEnter={() => preloadImage(resolvedImg)}
                        onTouchStart={() => preloadImage(resolvedImg)}
                        onFocus={() => preloadImage(resolvedImg)}
                        onClick={() => {
                          preloadImage(resolvedImg);
                          if (id) {
                            void incrementMenuItemView({
                              restaurantId,
                              menuItemId: id,
                            });
                          }
                        }}
                        className="flex items-center gap-3 rounded-[22px] border border-[#ECEFF5] bg-white px-3 py-3 text-[#1E1F24] shadow-sm transition hover:border-[#C2CADB]"
                      >
                        <img
                          src={resolvedImg}
                          alt={imageAlt}
                          width={CANDIDATE_IMAGE_SIZE}
                          height={CANDIDATE_IMAGE_SIZE}
                          loading="lazy"
                          sizes={CANDIDATE_IMAGE_SIZES}
                          className="h-14 w-14 rounded-2xl object-cover"
                        />
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-[#1E1F24]">
                                {title}
                              </p>
                              <p className="mt-1 text-xs text-[#6B7280] line-clamp-2">
                                {description}
                              </p>
                            </div>
                            {priceLabel && (
                              <span className="text-sm font-semibold text-[#1E1F24] whitespace-nowrap">
                                {priceLabel}
                              </span>
                            )}
                          </div>
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
                    {noRecommendationsText}
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
            <img
              src={noCreditsImageSrc}
              alt="No credits illustration"
              sizes={NO_CREDITS_IMAGE_SIZES}
              className="h-[50vh] max-w-full select-none object-cover"
            />

            <p className="text-lg font-medium text-[#1E1F24]">
              {noCreditsTitle}
            </p>
            <Link
              href={restaurantHomeHref}
              aria-label={backToMenuLabel}
              className={BACK_BUTTON_CLASSNAME}
            >
              <ChevronLeft aria-hidden="true" className="mr-1 h-4 w-4" />
              <span>{backToMenuLabel}</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
