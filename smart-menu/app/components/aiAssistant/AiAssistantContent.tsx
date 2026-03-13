"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import RestaurantHeader from "@/app/components/ui/RestaurantHeader";
import AiAssistantPromptPanel, {
  type AiAssistantRouterResponse,
} from "@/app/components/aiAssistant/AiAssistantPromptPanel";
import { type Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";
import { incrementMenuItemView } from "@/app/lib/menuItemViews";

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
const NO_CREDITS_IMAGE_SIZES = "(max-width: 768px) 80vw, 400px";
const CANDIDATE_IMAGE_SIZE = 56;
const CANDIDATE_IMAGE_SIZES = "56px";
const HERO_IMAGE_FALLBACK = "/images/ai-assistant-cook.png";
const HERO_THINKING_FALLBACK = "/images/ai-assistant-cook-thinking.png";
const NO_CREDITS_FALLBACK = "/images/no-credits.png";
const MENU_ITEM_PLACEHOLDER = "/images/menu-item-placeholder.png";

type CachedAssistantState = {
  prompt: string;
  assistantText: string;
  candidates: Candidate[];
  resultLocale: Locale | null;
};

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

type Props = {
  restaurantId: string;
  restaurantSlug?: string;
  suggestionPrompts: Suggestion[];
  prompt: string;
  restaurantName?: string;
  assistantName?: LocalizedField;
  aiCreditsRemaining?: number;
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
  aiCreditsRemaining,
  aiAssistantImageUrl,
  aiAssistantThinkingImageUrl,
  aiAssistantNoCreditsImageUrl,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const clientSearchParams = useSearchParams();
  const locale = useLocale() as Locale;
  const t = useTranslations("aiAssistantContent");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">(
    "idle"
  );
  const [assistantText, setAssistantText] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [resultLocale, setResultLocale] = useState<Locale | null>(null);
  const [shouldAutoPrompt, setShouldAutoPrompt] = useState(false);
  const slugOrId = restaurantSlug ?? restaurantId;
  const normalizedPrompt = useMemo(() => prompt?.trim() ?? "", [prompt]);
  const cacheKey = slugOrId ? `ai-assistant:${slugOrId}` : null;
  const lastPromptRef = useRef<string | null>(normalizedPrompt || null);

  const updatePromptParam = useCallback(
    (value: string) => {
      if (!pathname) return;
      const params = new URLSearchParams(
        clientSearchParams ? clientSearchParams.toString() : undefined
      );
      if (value) {
        params.set("prompt", value);
      } else {
        params.delete("prompt");
      }
      const query = params.toString();
      const target = query ? `${pathname}?${query}` : pathname;
      router.replace(target, { scroll: false });
    },
    [clientSearchParams, pathname, router]
  );

  const persistCache = useCallback(
    (payload: CachedAssistantState) => {
      if (!cacheKey || typeof window === "undefined") return;
      try {
        window.sessionStorage.setItem(cacheKey, JSON.stringify(payload));
      } catch {
        // silent
      }
    },
    [cacheKey]
  );

  useEffect(() => {
    if (!cacheKey) {
      setShouldAutoPrompt(Boolean(normalizedPrompt));
      return;
    }
    if (typeof window === "undefined") return;

    if (!normalizedPrompt) {
      setShouldAutoPrompt(false);
      return;
    }

    try {
      const raw = window.sessionStorage.getItem(cacheKey);
      if (!raw) {
        setShouldAutoPrompt(true);
        return;
      }
      const parsed = JSON.parse(raw) as CachedAssistantState | null;
      if (parsed?.prompt === normalizedPrompt) {
        setAssistantText(parsed.assistantText ?? "");
        setCandidates(Array.isArray(parsed.candidates) ? parsed.candidates : []);
        setResultLocale(parsed.resultLocale ?? null);
        setStatus("success");
        lastPromptRef.current = parsed.prompt;
        setShouldAutoPrompt(false);
      } else {
        setShouldAutoPrompt(true);
      }
    } catch {
      window.sessionStorage.removeItem(cacheKey);
      setShouldAutoPrompt(Boolean(normalizedPrompt));
    }
  }, [cacheKey, normalizedPrompt]);
  const restaurantHomeHref = useMemo(
    () => buildLocalizedPath(`/restaurant/${slugOrId}`, locale),
    [locale, slugOrId]
  );
  const noCreditsTitle = t("noCreditsTitle");
  const backToMenuLabel = t("backToMenu");

  const handleResult = useCallback(
    (payload?: AiAssistantResponse) => {
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

      const normalizedCandidates = Array.isArray(items) ? items : [];
      setAssistantText(text);
      setCandidates(normalizedCandidates);
      setResultLocale(routerLanguage ?? null);

      const activePrompt = lastPromptRef.current ?? normalizedPrompt;
      if (activePrompt?.trim()) {
        persistCache({
          prompt: activePrompt.trim(),
          assistantText: text,
          candidates: normalizedCandidates,
          resultLocale: routerLanguage ?? null,
        });
      }
    },
    [normalizedPrompt, persistCache]
  );

  const restaurantDisplayName = restaurantName?.trim();
  const heroImageSrc =
    status === "loading"
      ? resolveImageSource(aiAssistantThinkingImageUrl, HERO_THINKING_FALLBACK)
      : resolveImageSource(aiAssistantImageUrl, HERO_IMAGE_FALLBACK);
  const noCreditsImageSrc = resolveImageSource(
    aiAssistantNoCreditsImageUrl,
    NO_CREDITS_FALLBACK,
    NO_CREDITS_FALLBACK
  );
  const hasCredits =
    typeof aiCreditsRemaining === "number" ? aiCreditsRemaining > 0 : true;
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

  const handlePromptPending = useCallback(
    (message: string) => {
      setPendingMessage(message);
      const trimmed = message.trim();
      if (trimmed) {
        lastPromptRef.current = trimmed;
        updatePromptParam(trimmed);
      }
    },
    [updatePromptParam]
  );

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
              <img
                key={status === "loading" ? "thinking" : "regular"}
                src={heroImageSrc}
                alt={`AI Асистент ${assistantDisplayName}`}
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
              <div className="mt-4 flex min-h-[40vh] flex-col gap-3 overflow-auto text-left">
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
                    const img = item?.image?.url ?? MENU_ITEM_PLACEHOLDER;
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
                        onClick={() => {
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
                          src={img}
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
              initialMessage={normalizedPrompt}
              restaurantId={restaurantId}
              restaurantName={restaurantDisplayName}
              autoSubmitInitialMessage={shouldAutoPrompt}
              onStatusChange={setStatus}
              onResult={handleResult}
              onPromptPending={handlePromptPending}
              onPromptSettled={() => setPendingMessage(null)}
            />
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
            <img
              src={aiAssistantNoCreditsImageUrl ?? "/images/no-credits.png"}
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
