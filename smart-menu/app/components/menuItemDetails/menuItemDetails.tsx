"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, Heart } from "lucide-react";
import {
  getAllergenIconEntry,
  resolveTooltipLabel,
} from "./allergens/iconMap";
import Image from "next/image";
import menuItemPlaceholder from "@/public/images/menu-item-placeholder.png";

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
  allergens?: Allergen[];
  restaurantId?: string;
};

export default function MenuItemDetails({
  id,
  name,
  description,
  imageUrl,
  allergens = [],
  restaurantId,
}: Props) {
  const router = useRouter();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const favoritesKey = useMemo(
    () => (restaurantId ? `favorites:${restaurantId}` : "favorites:default"),
    [restaurantId]
  );

  useEffect(() => {
    setActiveTooltip(null);
  }, [allergens]);

  return (
    <div className="min-h-dvh bg-[#3F5D50]">
      <MenuItemHero
        name={name}
        imageUrl={imageUrl}
        onBack={() => router.back()}
      />

      {/* BOTTOM SHEET */}
      <div className="h-[55vh] rounded-t-[40px] bg-[#F7F7F7] px-6 pb-10 pt-10 shadow-[0_-20px_60px_rgba(0,0,0,0.25)]">
        <h1 className="font-great-vibes text-5xl leading-tight text-[#2F3A37]">
          {name}
        </h1>

        {!!description && (
          <p className="mt-4 text-lg leading-relaxed text-[#2F3A37]/80">
            {description}
          </p>
        )}

        {/* allergens */}
        {allergens.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2F3A37]/60">
              Алергени
            </p>

            <div className="mt-3 flex flex-wrap gap-3">
              {allergens.map((a) => {
                const iconEntry = getAllergenIconEntry(a.code);
                const tooltipText = resolveTooltipLabel(a.label, iconEntry);
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
        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            className="flex-1 cursor-pointer rounded-full bg-[#1B1F1E] py-4 text-sm font-semibold text-white shadow-lg"
            onClick={() => {
              if (!restaurantId) return;
              const prompt = `Што оди со ${name}?`;
              const params = new URLSearchParams({ prompt });
              router.push(`/restaurant/${restaurantId}/ai-assistant?${params.toString()}`);
            }}
          >
            AI ПРЕПОРАКА
          </button>

          <FavoriteButton itemId={id} storageKey={favoritesKey} />
        </div>

        <button
          type="button"
          className="cursor-pointer mt-6 pb-6 w-full text-center text-xs text-[#2F3A37]/70 underline underline-offset-4"
        >
          Сподели твое мислење
        </button>
      </div>
    </div>
  );
}

type FavoriteButtonProps = {
  itemId: string;
  storageKey: string;
};

type MenuItemHeroProps = {
  name: string;
  imageUrl: string;
  onBack: () => void;
};

const MenuItemHero = memo(function MenuItemHero({
  name,
  imageUrl,
  onBack,
}: MenuItemHeroProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
  }, [imageUrl]);

  return (
    <div className="flex justify-center items-center relative h-[45vh] w-full">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="cursor-pointer absolute left-4 top-4 z-10 rounded-md bg-black/40 p-1.5 backdrop-blur"
      >
        <ArrowLeft className="h-5 w-5 text-white" />
      </button>

      <div className="relative grid h-70 w-70 place-items-center">
        <Image
          src={menuItemPlaceholder}
          alt=""
          aria-hidden="true"
          priority
          className={clsx(
            "absolute inset-0 h-70 w-70 rounded-full object-cover transition-opacity duration-300",
            imageLoaded ? "opacity-0" : "opacity-100"
          )}
        />
        <Image
          width={400}
          height={400}
          priority
          quality={100}
          src={imageUrl}
          alt={name}
          loading="eager"
          onLoadingComplete={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
          className={clsx(
            "relative! h-70 w-70 rounded-full object-cover transition-opacity duration-300",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    </div>
  );
});

function FavoriteButton({ itemId, storageKey }: FavoriteButtonProps) {
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
      aria-label={isFavorite ? "Отстрани од омилени" : "Додај во омилени"}
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
