"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import DailyComboPrompt from "../ui/DailyComboPrompt";
import DailyComboModal from "./DailyComboModal";
import type { DailyComboOffer } from "@/app/lib/restaurants";
import type { Locale } from "@/i18n";

type RestaurantDailyComboPromptProps = {
  restaurantSlug?: string;
  locale?: Locale;
  combo?: DailyComboOffer | null;
};

const STORAGE_KEY_PREFIX = "sm-daily-combo-dismissed";
const HIDE_DELAY_MS = 350;
const OPEN_DELAY_MS = 250;
const INITIAL_DELAY_MS = 4000;
const AUTO_DISMISS_MS = 10000;

export default function RestaurantDailyComboPrompt({
  restaurantSlug,
  locale,
  combo,
}: RestaurantDailyComboPromptProps) {
  const promptCopy = useTranslations("dailyComboModal");
  const storageKey = useMemo(() => {
    const parts = [
      STORAGE_KEY_PREFIX,
      restaurantSlug ?? "public",
      locale ?? "default",
    ];
    return parts.join(":");
  }, [restaurantSlug, locale]);

  const [shouldRender, setShouldRender] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const showTimeoutRef = useRef<number | null>(null);
  const openDelayTimeoutRef = useRef<number | null>(null);
  const autoDismissTimeoutRef = useRef<number | null>(null);
  const [progressInstance, setProgressInstance] = useState<number | null>(null);
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);

  const fallbackCombo = useMemo<DailyComboOffer>(() => {
    const types = ["drink", "main", "salad"] as const;
    return {
      title: promptCopy("title"),
      subtitle: promptCopy("subtitle"),
      totalPrice: promptCopy("fallback.totalPrice"),
      items: types.map((type) => ({
        id: type,
        type,
        title: promptCopy(`fallback.${type}.title`),
        description: promptCopy(`fallback.${type}.description`),
        price: promptCopy(`fallback.${type}.price`),
      })),
    };
  }, [promptCopy]);

  const comboData = useMemo<DailyComboOffer>(() => {
    if (combo && Array.isArray(combo.items) && combo.items.length > 0) {
      return {
        title: combo.title ?? promptCopy("title"),
        subtitle: combo.subtitle ?? promptCopy("subtitle"),
        totalPrice: combo.totalPrice ?? fallbackCombo.totalPrice,
        items: combo.items,
      };
    }
    return fallbackCombo;
  }, [combo, fallbackCombo, promptCopy]);

  const markDismissed = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // ignore storage failures
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const dismissed = window.localStorage.getItem(storageKey) === "1";
    if (dismissed) {
      return;
    }

    showTimeoutRef.current = window.setTimeout(() => {
      window.requestAnimationFrame(() => setShouldRender(true));
      openDelayTimeoutRef.current = window.setTimeout(() => {
        setIsOpen(true);
        setProgressInstance(Date.now());
      }, OPEN_DELAY_MS);
    }, INITIAL_DELAY_MS);

    return () => {
      if (showTimeoutRef.current) {
        window.clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }
      if (openDelayTimeoutRef.current) {
        window.clearTimeout(openDelayTimeoutRef.current);
        openDelayTimeoutRef.current = null;
      }
    };
  }, [storageKey]);

  const hidePrompt = useCallback(() => {
    setIsOpen(false);
    setProgressInstance(null);
    if (typeof window !== "undefined") {
      markDismissed();
      window.setTimeout(() => setShouldRender(false), HIDE_DELAY_MS);
    } else {
      setShouldRender(false);
    }
  }, [markDismissed]);

  const handleAccept = useCallback(() => {
    hidePrompt();
    setIsComboModalOpen(true);
  }, [hidePrompt]);

  const handleModalClose = useCallback(() => {
    setIsComboModalOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      if (autoDismissTimeoutRef.current) {
        window.clearTimeout(autoDismissTimeoutRef.current);
        autoDismissTimeoutRef.current = null;
      }
      return;
    }

    autoDismissTimeoutRef.current = window.setTimeout(() => {
      hidePrompt();
    }, AUTO_DISMISS_MS);

    return () => {
      if (autoDismissTimeoutRef.current) {
        window.clearTimeout(autoDismissTimeoutRef.current);
        autoDismissTimeoutRef.current = null;
      }
    };
  }, [isOpen, hidePrompt]);

  return (
    <>
      {shouldRender ? (
        <div className="pointer-events-none fixed right-3 top-28 z-40 flex justify-end md:right-10 md:top-20">
          <DailyComboPrompt
            isOpen={isOpen}
            onAccept={handleAccept}
            onDismiss={hidePrompt}
            autoDismissDurationMs={AUTO_DISMISS_MS}
            progressInstance={progressInstance ?? undefined}
            className="pointer-events-auto"
          />
        </div>
      ) : null}

      <DailyComboModal
        open={isComboModalOpen}
        combo={comboData}
        onClose={handleModalClose}
        closeLabel={promptCopy("close")}
        emptyLabel={promptCopy("empty")}
        restaurantSlug={restaurantSlug}
        locale={locale}
      />
    </>
  );
}
