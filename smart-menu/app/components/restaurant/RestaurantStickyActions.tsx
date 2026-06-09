"use client";

import {
  HandPlatter,
  Minus,
  Plus,
  ReceiptText,
  ShoppingBasket,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { Locale } from "@/i18n";
import { extractApiData, type RestaurantOrder, type RestaurantServiceRequestType } from "@/app/lib/restaurantOperations";
import useRestaurantCart, { CART_ADD_EVENT } from "@/app/components/restaurant/useRestaurantCart";

type RestaurantStickyActionsProps = {
  restaurantId?: string;
  restaurantSlug?: string;
  onRequestWaiter?: () => void;
  onRequestBill?: () => void;
  onVisibilityChange?: (visible: boolean) => void;
};

type FeedbackToastState = {
  title: string;
  description: string;
};

const TOP_SHOW_THRESHOLD = 72;
const HIDE_SCROLL_DELTA = 18;
const SHOW_SCROLL_DELTA = 10;
const SHEET_CLOSE_DRAG_THRESHOLD = 96;
const WAITER_COOLDOWN_MS = 60_000;
const STICKY_REVEAL_MS = 2600;

const getWaiterCooldownKey = (
  restaurantId?: string,
  restaurantSlug?: string,
  table?: string
) =>
  `smart-menu:waiter-call:${restaurantId ?? restaurantSlug ?? "default"}:${table ?? "no-table"}`;

export default function RestaurantStickyActions({
  restaurantId,
  restaurantSlug,
  onRequestWaiter,
  onRequestBill,
  onVisibilityChange,
}: RestaurantStickyActionsProps) {
  const t = useTranslations("restaurantStickyActions");
  const locale = useLocale() as Locale;
  const {
    items,
    itemCount,
    table,
    total,
    clearCart,
    incrementItem,
    decrementItem,
    storageKey,
  } = useRestaurantCart({
    restaurantId,
    restaurantSlug,
  });
  const [isVisible, setIsVisible] = useState(true);
  const [feedbackToast, setFeedbackToast] = useState<FeedbackToastState | null>(null);
  const [isBillSheetOpen, setIsBillSheetOpen] = useState(false);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const [cartSheetDragY, setCartSheetDragY] = useState(0);
  const [waiterCooldownUntil, setWaiterCooldownUntil] = useState<number | null>(null);
  const [waiterCooldownNow, setWaiterCooldownNow] = useState(() => Date.now());
  const [isWaiterSubmitting, setIsWaiterSubmitting] = useState(false);
  const [activeBillRequestType, setActiveBillRequestType] =
    useState<RestaurantServiceRequestType | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const lastScrollYRef = useRef(0);
  const feedbackToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stickyRevealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waiterCooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waiterCountdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cartDragStartYRef = useRef<number | null>(null);
  const isStickyPinnedRef = useRef(false);
  const waiterCooldownStorageKey = useMemo(
    () => getWaiterCooldownKey(restaurantId, restaurantSlug, table),
    [restaurantId, restaurantSlug, table]
  );
  const isAnySheetOpen = isBillSheetOpen || isCartSheetOpen;
  const isStickyActionsVisible = isVisible && !isAnySheetOpen;

  useEffect(() => {
    onVisibilityChange?.(isStickyActionsVisible);
  }, [isStickyActionsVisible, onVisibilityChange]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    lastScrollYRef.current = window.scrollY;
    let ticking = false;

    const updateVisibility = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollYRef.current;

      if (isStickyPinnedRef.current) {
        setIsVisible(true);
        lastScrollYRef.current = currentScrollY;
        ticking = false;
        return;
      }

      if (currentScrollY <= TOP_SHOW_THRESHOLD) {
        setIsVisible(true);
      } else if (scrollDelta >= HIDE_SCROLL_DELTA) {
        setIsVisible(false);
      } else if (scrollDelta <= -SHOW_SCROLL_DELTA) {
        setIsVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateVisibility);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackToastTimeoutRef.current) {
        clearTimeout(feedbackToastTimeoutRef.current);
      }
      if (stickyRevealTimeoutRef.current) {
        clearTimeout(stickyRevealTimeoutRef.current);
      }
      if (waiterCooldownTimeoutRef.current) {
        clearTimeout(waiterCooldownTimeoutRef.current);
      }
      if (waiterCountdownIntervalRef.current) {
        clearInterval(waiterCountdownIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleCartAdded = (event: Event) => {
      const customEvent = event as CustomEvent<{ storageKey?: string }>;
      if (customEvent.detail?.storageKey !== storageKey) return;

      isStickyPinnedRef.current = true;
      setIsVisible(true);

      if (stickyRevealTimeoutRef.current) {
        clearTimeout(stickyRevealTimeoutRef.current);
      }

      stickyRevealTimeoutRef.current = setTimeout(() => {
        isStickyPinnedRef.current = false;
        stickyRevealTimeoutRef.current = null;

        if (window.scrollY > TOP_SHOW_THRESHOLD && !isAnySheetOpen) {
          setIsVisible(false);
        }
      }, STICKY_REVEAL_MS);
    };

    window.addEventListener(CART_ADD_EVENT, handleCartAdded as EventListener);

    return () => {
      window.removeEventListener(CART_ADD_EVENT, handleCartAdded as EventListener);
    };
  }, [isAnySheetOpen, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(waiterCooldownStorageKey);
      const storedUntil = raw ? Number.parseInt(raw, 10) : Number.NaN;
      if (Number.isFinite(storedUntil) && storedUntil > Date.now()) {
        setWaiterCooldownUntil(storedUntil);
        return;
      }
      window.localStorage.removeItem(waiterCooldownStorageKey);
    } catch {
      // ignore storage errors
    }

    setWaiterCooldownUntil(null);
  }, [waiterCooldownStorageKey]);

  useEffect(() => {
    if (waiterCountdownIntervalRef.current) {
      clearInterval(waiterCountdownIntervalRef.current);
      waiterCountdownIntervalRef.current = null;
    }

    if (waiterCooldownTimeoutRef.current) {
      clearTimeout(waiterCooldownTimeoutRef.current);
      waiterCooldownTimeoutRef.current = null;
    }

    if (!waiterCooldownUntil) return;

    const remainingMs = waiterCooldownUntil - Date.now();
    if (remainingMs <= 0) {
      setWaiterCooldownUntil(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(waiterCooldownStorageKey);
      }
      return;
    }

    setWaiterCooldownNow(Date.now());
    waiterCountdownIntervalRef.current = setInterval(() => {
      setWaiterCooldownNow(Date.now());
    }, 1000);

    waiterCooldownTimeoutRef.current = setTimeout(() => {
      setWaiterCooldownUntil(null);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(waiterCooldownStorageKey);
      }
    }, remainingMs);
  }, [waiterCooldownStorageKey, waiterCooldownUntil]);

  const hasRequestContext = Boolean(restaurantSlug && table);
  const waiterCooldownRemainingMs = waiterCooldownUntil
    ? Math.max(0, waiterCooldownUntil - waiterCooldownNow)
    : 0;
  const waiterCooldownSeconds = waiterCooldownRemainingMs
    ? Math.ceil(waiterCooldownRemainingMs / 1000)
    : 0;
  const isWaiterDisabled =
    isWaiterSubmitting || !hasRequestContext || waiterCooldownRemainingMs > 0;
  const showWaiterCountdown = waiterCooldownRemainingMs > 0;
  const waiterButtonLabel = showWaiterCountdown
    ? `${t("waiter")} ${waiterCooldownSeconds}s`
    : t("waiter");

  useEffect(() => {
    if (!waiterCooldownUntil || waiterCooldownRemainingMs > 0) return;

    setWaiterCooldownUntil(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(waiterCooldownStorageKey);
    }
  }, [
    waiterCooldownRemainingMs,
    waiterCooldownStorageKey,
    waiterCooldownUntil,
  ]);

  useEffect(() => {
    if (!isAnySheetOpen || typeof document === "undefined") return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsBillSheetOpen(false);
      setIsCartSheetOpen(false);
      setCartSheetDragY(0);
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAnySheetOpen]);

  const cartTotalLabel = useMemo(() => {
    const formatter = new Intl.NumberFormat(resolveIntlLocale(locale), {
      maximumFractionDigits: 0,
    });
    return t("totalValue", {
      amount: formatter.format(total),
    });
  }, [locale, t, total]);

  const normalizedCartCount = Number.isFinite(itemCount) ? Math.max(0, itemCount) : 0;
  const visibleCartCount = normalizedCartCount > 99 ? "99+" : String(normalizedCartCount);
  const isBillRequestPending = activeBillRequestType !== null;
  const isOrderSubmitDisabled =
    isSubmittingOrder || !items.length || !hasRequestContext;

  const closeAllSheets = () => {
    setIsBillSheetOpen(false);
    setIsCartSheetOpen(false);
    setCartSheetDragY(0);
  };

  const showFeedbackToast = (title: string, description: string) => {
    setFeedbackToast({ title, description });

    if (feedbackToastTimeoutRef.current) {
      clearTimeout(feedbackToastTimeoutRef.current);
    }

    feedbackToastTimeoutRef.current = setTimeout(() => {
      setFeedbackToast(null);
    }, 2600);
  };

  const createServiceRequest = async (type: RestaurantServiceRequestType) => {
    if (!restaurantSlug || !table) return null;

    const response = await fetch("/api/service-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        restaurantSlug,
        tableNumber: table,
        type,
        note: "",
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(
        typeof payload?.error === "string" ? payload.error : "Failed to create service request."
      );
    }

    return extractApiData<Record<string, unknown>>(payload);
  };

  const handleWaiterClick = async () => {
    if (isWaiterDisabled) return;

    setIsWaiterSubmitting(true);

    try {
      await createServiceRequest("call_waiter");
      onRequestWaiter?.();

      const nextCooldownUntil = Date.now() + WAITER_COOLDOWN_MS;
      setWaiterCooldownUntil(nextCooldownUntil);

      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            waiterCooldownStorageKey,
            String(nextCooldownUntil)
          );
        } catch {
          // ignore storage errors
        }
      }

      showFeedbackToast(
        t("waiterToastTitle"),
        t("waiterToastDescription")
      );
    } catch (error) {
      console.error("Waiter request failed:", error);
    } finally {
      setIsWaiterSubmitting(false);
    }
  };

  const handleBillRequest = async (type: RestaurantServiceRequestType) => {
    if (!restaurantSlug || !table || isBillRequestPending) return;

    setActiveBillRequestType(type);

    try {
      await createServiceRequest(type);
      setIsBillSheetOpen(false);
      onRequestBill?.();

      if (type === "bill_split") {
        showFeedbackToast(
          t("splitBillToastTitle"),
          t("splitBillToastDescription")
        );
      } else {
        showFeedbackToast(
          t("billToastTitle"),
          t("billToastDescription")
        );
      }
    } catch (error) {
      console.error("Bill request failed:", error);
    } finally {
      setActiveBillRequestType(null);
    }
  };

  const handleSubmitOrder = async () => {
    if (!restaurantSlug || !table || !items.length || isSubmittingOrder) return;

    setIsSubmittingOrder(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantSlug,
          tableNumber: table,
          items: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            note: item.note,
          })),
          guestNote: "",
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string" ? payload.error : "Failed to submit order."
        );
      }

      const createdOrder = extractApiData<RestaurantOrder>(payload);
      if (!createdOrder) {
        throw new Error("Missing created order payload.");
      }

      clearCart();
      closeAllSheets();
      showFeedbackToast(
        t("orderSuccessTitle"),
        t("orderSuccessDescription")
      );
    } catch (error) {
      console.error("Order submit failed:", error);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleBillClick = () => {
    if (!hasRequestContext) return;
    onRequestBill?.();
    setIsCartSheetOpen(false);
    setCartSheetDragY(0);
    setIsBillSheetOpen(true);
  };

  const handleCartClick = () => {
    setIsBillSheetOpen(false);
    setCartSheetDragY(0);
    setIsCartSheetOpen(true);
  };

  const handleCartSheetPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    cartDragStartYRef.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleCartSheetPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (cartDragStartYRef.current === null) return;
    const nextDragY = Math.max(0, event.clientY - cartDragStartYRef.current);
    setCartSheetDragY(nextDragY);
  };

  const handleCartSheetPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (cartDragStartYRef.current === null) return;
    cartDragStartYRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (cartSheetDragY >= SHEET_CLOSE_DRAG_THRESHOLD) {
      closeAllSheets();
      return;
    }

    setCartSheetDragY(0);
  };

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-50 transition duration-300",
          isAnySheetOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      >
        <button
          type="button"
          aria-label={t("closeSheet")}
          className="absolute inset-0 bg-black/0"
          onClick={closeAllSheets}
        />

        {isBillSheetOpen ? (
          <div
            className={[
              "absolute inset-x-0 bottom-0 mx-auto w-full max-w-[42rem] px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] transition duration-300 ease-out",
              isBillSheetOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0",
            ].join(" ")}
            role="dialog"
            aria-modal="true"
            aria-label={t("billSheetTitle")}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="overflow-hidden rounded-t-[30px] rounded-b-[28px] bg-[#F7F7F5]/92 shadow-[0_24px_60px_rgba(0,0,0,0.18)] ring-1 ring-white/65 backdrop-blur-[26px]">
              <div className="flex justify-center pt-3">
                <span className="h-1.5 w-12 rounded-full bg-black/12" />
              </div>
              <div className="px-4 pb-3 pt-2">
                <p className="pb-3 text-center text-sm font-semibold text-[#5B625F]">
                  {t("billSheetTitle")}
                </p>
                <div className="overflow-hidden rounded-[24px] bg-white/82 ring-1 ring-black/5">
                  <SheetButton
                    icon={ReceiptText}
                    label={t("requestBill")}
                    onClick={() => void handleBillRequest("bill_normal")}
                    disabled={isBillRequestPending}
                  />
                  <SheetButton
                    icon={UsersRound}
                    label={t("splitBill")}
                    onClick={() => void handleBillRequest("bill_split")}
                    disabled={isBillRequestPending}
                    withBorder
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsBillSheetOpen(false)}
                  className="mt-3 flex w-full items-center justify-center rounded-[24px] bg-white/90 px-4 py-4 text-base font-semibold text-[#1B1F1E] shadow-[0_10px_24px_rgba(15,24,21,0.08)] ring-1 ring-black/5 transition hover:bg-white"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isCartSheetOpen ? (
          <div
            className={[
              "absolute inset-x-0 bottom-0 mx-auto w-full max-w-[42rem] px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] transition duration-300 ease-out",
              isCartSheetOpen ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0",
            ].join(" ")}
            role="dialog"
            aria-modal="true"
            aria-label={t("cartTitle")}
            onClick={(event) => event.stopPropagation()}
            style={{
              transform: isCartSheetOpen
                ? `translateY(${cartSheetDragY}px)`
                : "translateY(40px)",
              transition: cartSheetDragY
                ? "none"
                : "transform 300ms ease-out, opacity 300ms ease-out",
            }}
          >
            <div className="overflow-hidden rounded-t-[32px] rounded-b-[28px] bg-[#FAFAF8]/96 shadow-[0_28px_64px_rgba(8,16,13,0.2)] ring-1 ring-white/75 backdrop-blur-[22px]">
              <div
                className="touch-none px-5 pb-2 pt-3"
                onPointerDown={handleCartSheetPointerDown}
                onPointerMove={handleCartSheetPointerMove}
                onPointerUp={handleCartSheetPointerEnd}
                onPointerCancel={handleCartSheetPointerEnd}
              >
                <div className="flex justify-center">
                  <span className="h-1.5 w-12 rounded-full bg-black/12" />
                </div>
                <div className="mt-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-[#141816]">
                      <ShoppingBasket className="h-5 w-5" strokeWidth={2} />
                      <h2 className="text-[1.15rem] font-semibold tracking-[-0.02em]">
                        {t("cartTitle")}
                      </h2>
                    </div>
                    {table ? (
                      <p className="mt-1 text-sm text-[#5E6763]">
                        {t("tableLabel", { table })}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    aria-label={t("closeCart")}
                    onClick={closeAllSheets}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/88 text-[#1B1F1E] shadow-[0_10px_24px_rgba(15,24,21,0.08)] ring-1 ring-black/5 transition hover:bg-white"
                  >
                    <X className="h-5 w-5" strokeWidth={2.1} />
                  </button>
                </div>
              </div>

              <div className="px-5 pb-5">
                <div className="max-h-[40vh] overflow-y-auto rounded-[26px] bg-white/88 ring-1 ring-black/5">
                  {items.length ? (
                    <ul className="divide-y divide-black/6">
                      {items.map((item) => (
                        <li
                          key={`${item.menuItemId}:${item.note}`}
                          className="flex items-center justify-between gap-3 px-4 py-4"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-base font-semibold text-[#161A18]">
                              {item.name}
                            </p>
                            {item.note ? (
                              <p className="mt-1 text-xs text-[#65706A]">
                                {item.note}
                              </p>
                            ) : null}
                            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#F1F3EF] px-2 py-1 ring-1 ring-black/5">
                              <button
                                type="button"
                                aria-label={t("decreaseQuantity", { item: item.name })}
                                onClick={() => decrementItem(item.menuItemId, item.note)}
                                className="grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-white text-[#161A18] shadow-[0_4px_10px_rgba(15,24,21,0.08)] ring-1 ring-black/5 transition hover:bg-[#F8F8F6]"
                              >
                                <Minus className="h-4 w-4" strokeWidth={2.2} />
                              </button>
                              <span className="min-w-[1.5rem] text-center text-sm font-semibold text-[#161A18]">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                aria-label={t("increaseQuantity", { item: item.name })}
                                onClick={() => incrementItem(item.menuItemId, item.note)}
                                className="grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-white text-[#161A18] shadow-[0_4px_10px_rgba(15,24,21,0.08)] ring-1 ring-black/5 transition hover:bg-[#F8F8F6]"
                              >
                                <Plus className="h-4 w-4" strokeWidth={2.2} />
                              </button>
                            </div>
                          </div>
                          <p className="shrink-0 text-sm font-medium text-[#5A625E]">
                            {formatLineTotal(item.quantity * item.price, locale)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-5 py-8 text-center text-sm text-[#65706A]">
                      {t("cartEmpty")}
                    </div>
                  )}
                </div>

                <div className="mt-4 rounded-[26px] bg-white/92 p-4 shadow-[0_12px_30px_rgba(15,24,21,0.08)] ring-1 ring-black/5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-medium text-[#5B625F]">
                      {t("totalLabel")}
                    </span>
                    <span className="text-lg font-semibold text-[#171C19]">
                      {cartTotalLabel}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isOrderSubmitDisabled}
                    onClick={() => void handleSubmitOrder()}
                    className={[
                      "mt-4 flex w-full items-center justify-center rounded-[24px] px-4 py-4 text-base font-semibold shadow-[0_14px_34px_rgba(17,24,21,0.16)] transition",
                      !isOrderSubmitDisabled
                        ? "bg-[#1B1F1E] text-white hover:bg-[#111514]"
                        : "cursor-not-allowed bg-[#D7DBD8] text-[#6D7470] shadow-none",
                    ].join(" ")}
                  >
                    {isSubmittingOrder ? t("sendingOrder") : t("sendOrder")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={[
          "pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 transition-all duration-300 ease-out md:px-6",
          isStickyActionsVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        ].join(" ")}
        aria-hidden={!isStickyActionsVisible}
      >
        <div className="mx-auto mb-3 flex w-full max-w-[42rem] justify-center">
          <div
            className={[
              "max-w-[21rem] rounded-[24px] border border-white/80 bg-[#18201D]/88 px-4 py-3 text-center text-white shadow-[0_14px_32px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-xl transition-all duration-300",
              feedbackToast
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-3 opacity-0",
            ].join(" ")}
            role="status"
            aria-live="polite"
          >
            <p className="text-sm font-semibold tracking-[-0.02em]">
              {feedbackToast?.title ?? ""}
            </p>
            <p className="mt-1 text-xs text-white/78">
              {feedbackToast?.description ?? ""}
            </p>
          </div>
        </div>
        <div className="pointer-events-auto mx-auto flex w-full max-w-[42rem] items-center justify-between gap-2 rounded-[32px] border border-white/85 bg-white/72 px-1 shadow-[0_10px_24px_rgba(15,24,21,0.08),0_24px_56px_rgba(15,24,21,0.14),inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-[22px] backdrop-saturate-180">
          <ActionButton
            icon={HandPlatter}
            label={waiterButtonLabel}
            ariaLabel={t("waiterAria")}
            onClick={handleWaiterClick}
            disabled={isWaiterDisabled}
            labelClassName={isWaiterDisabled ? "text-sm sm:text-base" : undefined}
          />
          <ActionButton
            icon={ReceiptText}
            label={t("bill")}
            ariaLabel={t("billAria")}
            onClick={handleBillClick}
            disabled={!hasRequestContext}
          />
          <ActionButton
            icon={ShoppingBasket}
            label={visibleCartCount}
            ariaLabel={t("cartAria", { count: normalizedCartCount })}
            onClick={handleCartClick}
            className="max-w-[4.75rem] flex-none px-1.5 sm:max-w-[5.5rem]"
          />
        </div>
      </div>
    </>
  );
}

type SheetButtonProps = {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  withBorder?: boolean;
};

function SheetButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  withBorder = false,
}: SheetButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "flex w-full items-center justify-center gap-3 px-4 py-4 text-[1.05rem] font-medium text-[#111111] transition",
        disabled ? "cursor-not-allowed opacity-50" : "hover:bg-black/[0.025]",
        withBorder ? "border-t border-black/6" : "",
      ].join(" ")}
    >
      <Icon className="h-5 w-5 shrink-0 text-[#3E4542]" strokeWidth={2} />
      {label}
    </button>
  );
}

type ActionButtonProps = {
  icon: LucideIcon;
  label: string;
  ariaLabel: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
};

function ActionButton({
  icon: Icon,
  label,
  ariaLabel,
  onClick,
  disabled = false,
  className,
  labelClassName,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={[
        "flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[22px] px-2 py-2 text-[#111111] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B1F1E]/20 sm:gap-3 sm:px-3",
        disabled
          ? "cursor-not-allowed opacity-45"
          : "hover:bg-black/[0.03]",
        className ?? "",
      ].join(" ")}
    >
      <Icon className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" strokeWidth={1.8} />
      <span
        className={[
          "whitespace-nowrap text-base font-medium leading-none sm:text-[1.15rem]",
          labelClassName ?? "",
        ].join(" ")}
      >
        {label}
      </span>
    </button>
  );
}

const resolveIntlLocale = (locale: Locale) => {
  switch (locale) {
    case "mk":
      return "mk-MK";
    case "sq":
      return "sq-AL";
    case "tr":
      return "tr-TR";
    case "en":
    default:
      return "en-US";
  }
};

const formatLineTotal = (amount: number, locale: Locale) => {
  const formatter = new Intl.NumberFormat(resolveIntlLocale(locale), {
    maximumFractionDigits: 0,
  });

  if (locale === "en") {
    return `MKD ${formatter.format(amount)}`;
  }

  return `${formatter.format(amount)} ден`;
};
