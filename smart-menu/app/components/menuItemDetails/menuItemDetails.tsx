"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, Heart } from "lucide-react";
import {
  getAllergenIconEntry,
  resolveTooltipLabel,
} from "./allergens/iconMap";
import Image from "next/image";
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
  price,
}: Props) {
  const router = useRouter();
  const locale = useLocale() as Locale;
  const t = useTranslations("menuItemDetails");
  const tAllergens = useTranslations("menuItemDetails.allergens");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const handleBack = useCallback(() => router.back(), [router]);

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
  const priceText = priceLabel ? t("priceLabel", { price: priceLabel }) : null;
  const favoriteLabels = {
    add: t("favorite.add"),
    remove: t("favorite.remove"),
  };
  const backLabel = t("back");

  return (
    <div className="min-h-dvh bg-[#3F5D50] flex flex-col justify-between">
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
                const assistantHref = buildLocalizedPath(
                  `/restaurant/${restaurantId}/ai-assistant?${params.toString()}`,
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
            className="cursor-pointer mt-6 pb-6 w-full text-center text-xs text-[#2F3A37]/70 underline underline-offset-4"
          >
            {shareLabel}
          </button>
        </section>
      </div>
    </div>
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

  useEffect(() => {
    setImageLoaded(false);
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
        <div
          aria-hidden="true"
          className={clsx(
            "absolute inset-0 rounded-full bg-white/10 transition-opacity duration-300",
            imageLoaded ? "opacity-0" : "opacity-100"
          )}
        />
        <Image
          width={HERO_IMAGE_SIZE}
          height={HERO_IMAGE_SIZE}
          priority
          quality={85}
          src={imageUrl}
          alt={imageAlt ?? name}
          loading="eager"
          sizes={HERO_IMAGE_SIZES}
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI0Y2RkZFNiIvPjwvc3ZnPg=="
          onLoadingComplete={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
          className={clsx(
            "h-full w-full rounded-full object-cover transition-opacity duration-300",
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
