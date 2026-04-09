"use client";

import {
  FormEvent,
  MouseEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useId,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, Heart, MessageSquare, Smile, ThumbsDown, ThumbsUp, X } from "lucide-react";
import {
  getAllergenIconEntry,
  resolveTooltipLabel,
} from "./allergens/iconMap";
import { useLocale, useTranslations } from "next-intl";
import { type Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";
import { trackEvent } from "@/app/lib/analytics";
import { greatVibes } from "@/app/fonts";

type Allergen = {
  key: string;
  label: string;
  code?: string;
};


type Props = {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  imageAlt?: string;
  allergens?: Allergen[];
  restaurantId?: string;
  restaurantSlug?: string;
  price?: number;
};

export default function MenuItemDetails({
  id,
  name,
  description,
  imageUrl,
  imageAlt,
  allergens = [],
  restaurantId,
  restaurantSlug,
  price,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale() as Locale;
  const t = useTranslations("menuItemDetails");
  const tAllergens = useTranslations("menuItemDetails.allergens");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const returnKind = searchParams?.get("kind") ?? undefined;
  const returnCategoryId = searchParams?.get("categoryId") ?? undefined;
  const returnSubcategoryId = searchParams?.get("subcategoryId") ?? undefined;
  const slugOrId = restaurantSlug ?? restaurantId ?? null;

  const backUrl = useMemo(() => {
    if (!slugOrId) return null;
    const base = buildLocalizedPath(`/restaurant/${slugOrId}`, locale);
    const params = new URLSearchParams();
    if (returnKind) params.set("kind", returnKind);
    if (returnCategoryId) params.set("categoryId", returnCategoryId);
    if (returnSubcategoryId) params.set("subcategoryId", returnSubcategoryId);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }, [slugOrId, locale, returnKind, returnCategoryId, returnSubcategoryId]);

  const handleBack = useCallback(() => {
    if (backUrl) {
      router.push(backUrl);
      return;
    }
    router.back();
  }, [backUrl, router]);

  const favoritesKey = useMemo(
    () => (restaurantId ? `favorites:${restaurantId}` : "favorites:default"),
    [restaurantId]
  );

  const visibleAllergens = useMemo(
    () =>
      allergens.filter((a) => {
        const label = a.label?.trim();
        if (!label) return false;
        const normalizedLabel = label.toLowerCase();
        const normalizedCode = a.code?.trim().toLowerCase();
        return normalizedLabel !== "none" && normalizedCode !== "none";
      }),
    [allergens]
  );

  useEffect(() => {
    setActiveTooltip(null);
  }, [visibleAllergens]);

  useEffect(() => {
    trackEvent("page_label", {
      label: `Menu Item - ${name}`,
      locale,
    });
  }, [locale, name]);

  const intlLocale = useMemo(() => {
    switch (locale) {
      case "mk":
        return "mk-MK";
      case "sq":
        return "sq-AL";
      case "en":
      default:
        return "en-US";
    }
  }, [locale]);

  const priceLabel = useMemo(() => {
    if (typeof price !== "number" || Number.isNaN(price)) return null;
    return new Intl.NumberFormat(intlLocale, {
      maximumFractionDigits: 2,
    }).format(price);
  }, [price, intlLocale]);

  const assistantPrompt = useMemo(
    () => t("assistantPrompt", { dish: name }),
    [t, name]
  );
  const assistantButtonLabel = t("assistantButton");
  const shareLabel = t("shareCta");
  const shareModalLabels = useMemo(
    () => ({
      title: t("shareModal.title"),
      foodLabel: t("shareModal.foodLabel"),
      serviceLabel: t("shareModal.serviceLabel"),
      feedbackLabel: t("shareModal.feedbackLabel"),
      feedbackPlaceholder: t("shareModal.feedbackPlaceholder"),
      submit: t("shareModal.submit"),
      closeAriaLabel: t("shareModal.closeAriaLabel"),
      successTitle: t("shareModal.successTitle"),
      successDescription: t("shareModal.successDescription"),
      errorMessage: t("shareModal.errorMessage"),
    }),
    [t]
  );
  const shareRatingLabels = useMemo(
    () => ({
      negative: t("shareModal.ratings.negative"),
      neutral: t("shareModal.ratings.neutral"),
      positive: t("shareModal.ratings.positive"),
    }),
    [t]
  );
  const priceText = priceLabel ? t("priceLabel", { price: priceLabel }) : null;
  const favoriteLabels = {
    add: t("favorite.add"),
    remove: t("favorite.remove"),
  };
  const backLabel = t("back");
  const handleShareClick = useCallback(() => {
    setShareModalOpen(true);
    trackEvent("menu_item_feedback_opened", {
      itemId: id,
      dish: name,
      locale,
    });
  }, [id, locale, name]);
  const handleShareSubmit = useCallback(
    async (payload: ShareFeedbackPayload) => {
      if (!restaurantId) {
        throw new Error(shareModalLabels.errorMessage);
      }

      const foodRating = ratingValueToScore(payload.foodRating);
      const serviceRating = ratingValueToScore(payload.serviceRating);
      if (foodRating === null || serviceRating === null) {
        throw new Error(shareModalLabels.errorMessage);
      }

      const suggestion = payload.comment.trim();

      const response = await fetch(`/api/restaurants/${restaurantId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          foodRating,
          serviceRating,
          suggestion,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok === false) {
        const message =
          result?.message || result?.error || shareModalLabels.errorMessage;
        throw new Error(message);
      }

      trackEvent("menu_item_feedback_submitted", {
        itemId: id,
        dish: name,
        locale,
        restaurantId,
        restaurantSlug,
        foodRating,
        serviceRating,
        comment: suggestion,
        commentLength: suggestion.length,
      });
    },
    [restaurantId, shareModalLabels.errorMessage, id, name, locale, restaurantSlug]
  );
  const handleShareClose = useCallback(() => {
    setShareModalOpen(false);
  }, []);

  return (
    <>
      <div className="min-h-dvh bg-[#3F5D50] flex flex-col justify-between gap-5">
      <MenuItemHero
        name={name}
        imageUrl={imageUrl}
        imageAlt={imageAlt}
        onBack={handleBack}
        backLabel={backLabel}
      />

      {/* BOTTOM SHEET */}
      <div className="flex flex-col justify-between gap-3 md:container md:mx-auto min-h-[55dvh] md:max-w-125 rounded-t-[40px] bg-[#F7F7F7] px-6 pb-4 pt-8 shadow-[0_-20px_60px_rgba(0,0,0,0.25)] md:min-h-[45dvh]">
        <section className="flex flex-col gap-4">
          <h1 className={`${greatVibes.className} text-5xl leading-tight text-[#2F3A37]`}>
            {name}
          </h1>

          {!!description && (
            <p className="text-lg leading-relaxed text-[#2F3A37]/80">
              {description}
            </p>
          )}
          {priceText && (
            <span className="border border-[#1B1F1E] border-solid rounded-full w-fit px-2 py-1 text-lg font-semibold text-[#1B1F1E] leading-tight">
              {priceText}
            </span>
          )}
        </section>
        <section>
          {/* allergens */}
          {visibleAllergens.length > 0 && (
            <div className="mt-3">
              {/* <p className="text-xs font-semibold uppercase tracking-wide text-[#2F3A37]/60">
                Алергени
              </p> */}

              <div className="mt-3 flex flex-wrap gap-3">
                {visibleAllergens.map((a) => {
                  const iconEntry = getAllergenIconEntry(a.code);
                  const tooltipText = resolveTooltipLabel(
                    a.label,
                    iconEntry,
                    (key) => tAllergens(key)
                  );
                  const tooltipId = `allergen-tooltip-${a.key}`;
                  const isActive = activeTooltip === a.key;

                  if (iconEntry) {
                    const Icon = iconEntry.icon;
                    return (
                      <button
                        type="button"
                        key={a.key}
                        aria-label={tooltipText}
                        aria-describedby={tooltipId}
                        className="group relative grid h-12 w-12 place-items-center rounded-2xl border border-[#2F3A37]/15 bg-white shadow-sm transition hover:border-[#2F3A37]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F3A37]/40"
                        data-active={isActive}
                        onClick={() =>
                          setActiveTooltip((prev) =>
                            prev === a.key ? null : a.key
                          )
                        }
                        onMouseLeave={() =>
                          setActiveTooltip((prev) =>
                            prev === a.key ? null : prev
                          )
                        }
                        onBlur={() =>
                          setActiveTooltip((prev) =>
                            prev === a.key ? null : prev
                          )
                        }
                      >
                        <Icon
                          className="h-5 w-5 text-[#1B1F1E]"
                          strokeWidth={1.8}
                        />

                        <span
                          id={tooltipId}
                          role="tooltip"
                          className={clsx(
                            "pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 -translate-x-1/2 rounded-2xl bg-[#2F3A37] px-3 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-all duration-150",
                            "before:absolute before:left-1/2 before:top-full before:-translate-x-1/2 before:border-[6px] before:border-transparent before:border-t-[#2F3A37] before:content-['']",
                            "group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100",
                            isActive ? "translate-y-0 opacity-100" : "translate-y-1"
                          )}
                        >
                          {tooltipText}
                        </span>
                      </button>
                    );
                  }

                  return (
                    <span
                      key={a.key}
                      className="rounded-full border border-[#2F3A37]/15 bg-white px-3 py-1 text-xs text-[#2F3A37]/80"
                    >
                      {a.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* actions */}
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              className="flex-1 cursor-pointer rounded-full bg-[#1B1F1E] py-4 text-sm font-semibold text-white shadow-lg"
              onClick={() => {
                if (!restaurantId) return;
                const params = new URLSearchParams({ prompt: assistantPrompt });
                const slugOrId = restaurantSlug ?? restaurantId;
                const assistantHref = buildLocalizedPath(
                  `/restaurant/${slugOrId}/ai-assistant?${params.toString()}`,
                  locale
                );
                router.push(assistantHref);
              }}
            >
              {assistantButtonLabel}
            </button>

            <FavoriteButton
              itemId={id}
              storageKey={favoritesKey}
              addLabel={favoriteLabels.add}
              removeLabel={favoriteLabels.remove}
            />
          </div>

          <button
            type="button"
            className="cursor-pointer mt-6 pb-6 w-full text-center text-xs text-[#2F3A37]/70 underline underline-offset-4 flex items-center justify-center gap-2"
            onClick={handleShareClick}
          >
            <MessageSquare className="h-4 w-5" /> {shareLabel}
          </button>
        </section>
      </div>
    </div>
      <ShareFeedbackModal
        open={isShareModalOpen}
        onClose={handleShareClose}
        onSubmit={handleShareSubmit}
        labels={shareModalLabels}
        ratingLabels={shareRatingLabels}
      />
    </>
  );
}

type FavoriteButtonProps = {
  itemId: string;
  storageKey: string;
  addLabel: string;
  removeLabel: string;
};

type MenuItemHeroProps = {
  name: string;
  imageUrl: string;
  imageAlt?: string;
  onBack: () => void;
  backLabel: string;
};

const HERO_IMAGE_SIZE = 300;
const HERO_IMAGE_SIZES = "300px";

const MenuItemHero = memo(function MenuItemHero({
  name,
  imageUrl,
  imageAlt,
  onBack,
  backLabel,
}: MenuItemHeroProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const heroImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const imgEl = heroImageRef.current;
    setImageLoaded(false);
    if (!imgEl) return;

    if (imgEl.complete && imgEl.naturalWidth > 0) {
      setImageLoaded(true);
      return;
    }

    const handleLoad = () => {
      setImageLoaded(true);
    };
    const handleError = () => {
      setImageLoaded(false);
    };

    imgEl.addEventListener("load", handleLoad);
    imgEl.addEventListener("error", handleError);

    return () => {
      imgEl.removeEventListener("load", handleLoad);
      imgEl.removeEventListener("error", handleError);
    };
  }, [imageUrl]);

  return (
    <div className="flex justify-center items-center relative min-h-[45dvh] w-full px-4 sm:min-h-[50dvh]">
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        className="cursor-pointer absolute left-4 top-4 z-10 rounded-md bg-black/40 p-1.5 backdrop-blur"
      >
        <ArrowLeft className="h-5 w-5 text-white" />
      </button>

      <div
        className="py-2 relative grid place-items-center"
        style={{ width: HERO_IMAGE_SIZE, height: HERO_IMAGE_SIZE }}
      >
        <img
          aria-hidden="true"
          width={HERO_IMAGE_SIZE}
          height={HERO_IMAGE_SIZE}
          src="/images/menu-item-placeholder.png"
          alt=""
          className={clsx(
            "absolute inset-0 h-full w-full rounded-full object-cover transition-opacity duration-300 max-h-[300px] max-w-[300px]",
            imageLoaded ? "opacity-0" : "opacity-100"
          )}
        />
        <img
          width={HERO_IMAGE_SIZE}
          height={HERO_IMAGE_SIZE}
          src={imageUrl}
          alt={imageAlt ?? name}
          sizes={HERO_IMAGE_SIZES}
          ref={heroImageRef}
          className={clsx(
            "h-full w-full rounded-full object-cover transition-opacity duration-300 max-h-[300px] max-w-[300px]",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    </div>
  );
});

function FavoriteButton({ itemId, storageKey, addLabel, removeLabel }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteBurst, setFavoriteBurst] = useState(false);
  const burstTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !itemId) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setIsFavorite(false);
        return;
      }
      const parsed: string[] = JSON.parse(raw);
      setIsFavorite(parsed.includes(itemId));
    } catch {
      setIsFavorite(false);
    }
  }, [storageKey, itemId]);

  useEffect(
    () => () => {
      if (burstTimeoutRef.current) {
        clearTimeout(burstTimeoutRef.current);
      }
    },
    []
  );

  const handleToggle = () => {
    if (typeof window === "undefined" || !itemId) return;
    setIsFavorite((prev) => {
      const next = !prev;
      try {
        const raw = localStorage.getItem(storageKey);
        const parsed: string[] = raw ? JSON.parse(raw) : [];
        const set = new Set(parsed);
        if (next) {
          set.add(itemId);
        } else {
          set.delete(itemId);
        }
        localStorage.setItem(storageKey, JSON.stringify(Array.from(set)));
      } catch {
        // ignore storage errors
      }

      if (burstTimeoutRef.current) {
        clearTimeout(burstTimeoutRef.current);
      }
      if (next) {
        setFavoriteBurst(true);
        burstTimeoutRef.current = setTimeout(() => {
          setFavoriteBurst(false);
        }, 400);
      } else {
        setFavoriteBurst(false);
      }
      return next;
    });
  };

  return (
    <button
      type="button"
      aria-label={isFavorite ? removeLabel : addLabel}
      aria-pressed={isFavorite}
      onClick={handleToggle}
      className="cursor-pointer grid h-14 w-14 place-items-center rounded-full bg-[#FF4D9D] shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
    >
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        {favoriteBurst && (
          <span className="absolute inset-0 rounded-full bg-white/70 animate-ping" />
        )}
        <Heart
          className="h-5 w-5 text-white"
          fill={isFavorite ? "currentColor" : "none"}
        />
      </span>
    </button>
  );
}

type RatingValue = "negative" | "neutral" | "positive";

type ShareFeedbackPayload = {
  foodRating: RatingValue | null;
  serviceRating: RatingValue | null;
  comment: string;
};

function ratingValueToScore(value: RatingValue | null): 1 | 3 | 5 | null {
  switch (value) {
    case "negative":
      return 1;
    case "neutral":
      return 3;
    case "positive":
      return 5;
    default:
      return null;
  }
}

type ShareFeedbackModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: ShareFeedbackPayload) => Promise<void>;
  labels: {
    title: string;
    foodLabel: string;
    serviceLabel: string;
    feedbackLabel: string;
    feedbackPlaceholder: string;
    submit: string;
    closeAriaLabel: string;
    successTitle: string;
    successDescription: string;
    errorMessage: string;
  };
  ratingLabels: Record<RatingValue, string>;
};

function ShareFeedbackModal({
  open,
  onClose,
  onSubmit,
  labels,
  ratingLabels,
}: ShareFeedbackModalProps) {
  const [foodRating, setFoodRating] = useState<RatingValue | null>(null);
  const [serviceRating, setServiceRating] = useState<RatingValue | null>(null);
  const [comment, setComment] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">(
    "idle"
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(open);
  const [isVisible, setIsVisible] = useState(open);
  const titleId = useId();
  const messageInputId = useId();
  const TRANSITION_MS = 300;

  useEffect(() => {
    if (!open) {
      setFoodRating(null);
      setServiceRating(null);
      setComment("");
      setSubmitState("idle");
      setSubmitError(null);
    }
  }, [open]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let rafId: number | null = null;

    if (open) {
      setIsMounted(true);
      rafId = requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      timeoutId = setTimeout(() => {
        setIsMounted(false);
      }, TRANSITION_MS);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (typeof document === "undefined") return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!isMounted) return null;

  const ratingOptions: Array<{
    value: RatingValue;
    Icon: typeof ThumbsUp;
    ariaLabel: string;
  }> = [
    { value: "negative", Icon: ThumbsDown, ariaLabel: ratingLabels.negative },
    { value: "neutral", Icon: Smile, ariaLabel: ratingLabels.neutral },
    { value: "positive", Icon: ThumbsUp, ariaLabel: ratingLabels.positive },
  ];

  const formDisabled = submitState === "submitting" || submitState === "success";
  const canSubmit = foodRating !== null && serviceRating !== null && !formDisabled;

  const resetErrorState = () => {
    if (submitState === "error") {
      setSubmitState("idle");
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && submitState !== "submitting") {
      onClose();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (formDisabled) return;
    if (foodRating === null || serviceRating === null) {
      setSubmitState("error");
      setSubmitError(labels.errorMessage);
      return;
    }

    setSubmitState("submitting");
    setSubmitError(null);
    try {
      await onSubmit({
        foodRating,
        serviceRating,
        comment: comment.trim(),
      });
      setSubmitState("success");
      onClose();
    } catch (error) {
      setSubmitState("error");
      setSubmitError(
        error instanceof Error ? error.message : labels.errorMessage
      );
    }
  };

  const renderRatingRow = (
    label: string,
    value: RatingValue | null,
    setter: (value: RatingValue | null) => void
  ) => (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-[#1B1F1E]">{label}</p>
      <div className="flex gap-3">
        {ratingOptions.map(({ value: optionValue, Icon, ariaLabel }) => {
          const isActive = value === optionValue;
          return (
            <button
              key={optionValue}
              type="button"
              aria-pressed={isActive}
              aria-label={ariaLabel}
              disabled={formDisabled}
              className={clsx(
                "grid h-12 w-12 place-items-center rounded-2xl border border-[#2F3A37]/15 bg-white text-[#1B1F1E]/70 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F3A37]/30",
                isActive &&
                  "border-transparent !bg-slate-600 shadow-[0_12px_35px_rgba(0,0,0,0.18)]",
                formDisabled && "opacity-50"
              )}
              onClick={() => {
                if (formDisabled) return;
                resetErrorState();
                setter(isActive ? null : optionValue);
              }}
            >
              <Icon
                className={clsx(
                  "h-5 w-5",
                  isActive ? "text-white" : "text-[#1B1F1E]"
                )}
                strokeWidth={1.8}
                fill="none"
              />
            </button>
          );
        })}
      </div>
    </div>
  );

  const submitLabel =
    submitState === "submitting" ? `${labels.submit}…` : labels.submit;

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-6 pt-10 transition-opacity duration-300 ease-out sm:items-center sm:pb-0",
        isVisible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
      onClick={handleOverlayClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={clsx(
          "w-full max-w-md rounded-[32px] bg-white p-6 text-left shadow-[0_30px_120px_rgba(0,0,0,0.35)] transition-all duration-300 ease-out will-change-transform will-change-opacity",
          isVisible
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-6 scale-95 opacity-0 sm:-translate-y-2 sm:scale-100"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-2xl font-semibold text-[#1B1F1E]">
            {labels.title}
          </h2>
          <button
            type="button"
            aria-label={labels.closeAriaLabel}
            onClick={() => {
              if (submitState === "submitting") return;
              onClose();
            }}
            className="cursor-pointer rounded-full bg-[#EFF1F0] p-2 text-[#1B1F1E]/60 transition hover:text-[#1B1F1E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F3A37]/30"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="mt-6 flex flex-col gap-6" onSubmit={handleSubmit}>
          {renderRatingRow(labels.foodLabel, foodRating, setFoodRating)}
          {renderRatingRow(labels.serviceLabel, serviceRating, setServiceRating)}

          <div className="flex flex-col gap-3">
            <label
              htmlFor={messageInputId}
              className="text-sm font-medium text-[#1B1F1E]"
            >
              {`${labels.feedbackLabel}:`}
            </label>
            <textarea
              id={messageInputId}
              rows={4}
              disabled={formDisabled}
              className={clsx(
                "w-full rounded-2xl border border-[#2F3A37]/15 bg-[#FDFDFD] px-4 py-3 text-sm text-[#1B1F1E] shadow-inner placeholder:text-[#1B1F1E]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F3A37]/30",
                formDisabled && "opacity-60"
              )}
              placeholder={labels.feedbackPlaceholder}
              value={comment}
              onChange={(event) => {
                resetErrorState();
                setComment(event.target.value);
              }}
            />
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className={clsx(
                "mt-2 w-full cursor-pointer rounded-full bg-[#1B1F1E] py-4 text-center text-sm font-semibold text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F3A37]/40",
                !canSubmit && "cursor-not-allowed opacity-60"
              )}
            >
              {submitLabel}
            </button>

            {submitError && (
              <p className="text-sm text-rose-600">{submitError}</p>
            )}

            {submitState === "success" && (
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-inner">
                <p className="font-semibold">{labels.successTitle}</p>
                <p className="text-xs text-emerald-700">{labels.successDescription}</p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
