"use client";

import clsx from "clsx";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { buildLocalizedPath } from "@/lib/routing";
import type { DailyComboOffer } from "@/app/lib/restaurants";
import type { Locale } from "@/i18n";

type DailyComboModalProps = {
  open: boolean;
  combo: DailyComboOffer;
  onClose: () => void;
  closeLabel: string;
  emptyLabel: string;
  restaurantSlug?: string;
  locale?: Locale;
};

export default function DailyComboModal({
  open,
  combo,
  onClose,
  closeLabel,
  emptyLabel,
  restaurantSlug,
  locale,
}: DailyComboModalProps) {
  const [shouldRender, setShouldRender] = useState(open);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldRender(true);
      document.body.style.setProperty("overflow", "hidden");
      return () => {
        document.body.style.removeProperty("overflow");
      };
    }

    document.body.style.removeProperty("overflow");
    const timeout = window.setTimeout(() => setShouldRender(false), 240);
    return () => {
      window.clearTimeout(timeout);
      document.body.style.removeProperty("overflow");
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const items = Array.isArray(combo.items) ? combo.items : [];
  const hasItems = items.length > 0;

  const handleItemClick = useCallback(
    (itemId?: string) => {
      if (!restaurantSlug || !itemId) {
        return;
      }

      const path = buildLocalizedPath(
        `/restaurant/${restaurantSlug}/menuItem/${itemId}`,
        locale ?? "mk"
      );

      router.push(path);
      onClose();
    },
    [restaurantSlug, router, onClose, locale]
  );

  if (!shouldRender && !open) {
    return null;
  }

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center px-4 py-8",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={clsx(
          "absolute inset-0 bg-black/70 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
        aria-hidden="true"
      />
      <div
        className={clsx(
          "relative z-10 w-full max-w-3xl transform rounded-[40px] bg-white p-6 text-slate-900 shadow-[0_35px_70px_rgba(15,23,42,0.2)] transition-all duration-200 sm:p-10",
          open ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="text-center">
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{combo.title}</h2>
        </div>

        <div className="mt-10 flex flex-col items-center">
          {hasItems ? (
            <div className="flex w-full items-center justify-center gap-5 text-slate-900">
              {items.map((item, index) => (
                <button
                  type="button"
                  key={item.id ?? `combo-${index}`}
                  onClick={() => handleItemClick(item.menuItemId)}
                  className="flex flex-col items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/30"
                >
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-slate-200 shadow-[0_12px_28px_rgba(15,23,42,0.2)]">
                    <Image
                      src={item.imageUrl ?? "/icons/cook-daily-meal.webp"}
                      alt={item.imageAlt ?? item.title}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                  <p className="flex min-h-10 items-center justify-center text-center text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>

                  {item.price ? (
                    <span className="rounded-full border border-slate-200 px-3 py-0.5 text-xs text-slate-600">
                      {item.price}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-3xl bg-slate-100 px-4 py-3 text-center text-sm text-slate-600">
              {emptyLabel}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full rounded-full bg-slate-100 px-6 py-3 text-center text-base font-semibold text-slate-900 transition hover:bg-slate-200"
        >
          {closeLabel}
        </button>
      </div>
    </div>
  );
}
