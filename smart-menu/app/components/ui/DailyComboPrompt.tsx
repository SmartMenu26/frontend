"use client";

import clsx from "clsx";
import Image from "next/image";
import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";

export type DailyComboPromptProps = {
  isOpen?: boolean;
  onAccept?: () => void;
  onDismiss?: () => void;
  className?: string;
  autoDismissDurationMs?: number;
  progressInstance?: number;
};

const PROGRESS_RADIUS = 13;
const PROGRESS_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;

export default function DailyComboPrompt({
  isOpen = false,
  onAccept,
  onDismiss,
  className = "",
  autoDismissDurationMs = 10000,
  progressInstance,
}: DailyComboPromptProps) {
  const t = useTranslations("dailyComboPrompt");
  const animationId =
    typeof progressInstance === "number" ? `daily-combo-progress-${progressInstance}` : null;
  const progressClassName = animationId && isOpen ? `combo-progress ${animationId}` : undefined;
  const progressStyle =
    animationId && isOpen
      ? {
          animation: `${animationId}-keyframes ${autoDismissDurationMs}ms linear forwards`,
          strokeDasharray: PROGRESS_CIRCUMFERENCE,
          strokeDashoffset: PROGRESS_CIRCUMFERENCE,
        }
      : undefined;

  return (
    <div
      className={clsx(
        "flex flex-col items-end gap-2",
        "transition-all duration-500 ease-out will-change-transform",
        isOpen ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0 pointer-events-none",
        className,
      )}
      aria-live="polite"
    >
      <div className="flex-shrink-0 rounded-full border border-white/40 bg-white p-1 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
        <Image
          src="/icons/cook-daily-meal.webp"
          alt={t("chefImageAlt")}
          width={60}
          height={60}
          className="h-12 w-12 rounded-full object-cover"
        />
      </div>
      <div className="flex w-full min-w-[220px] max-w-[280px] items-center gap-2 rounded-2xl bg-[#3E3A3A] px-4 py-2.5 text-white shadow-[0_14px_30px_rgba(0,0,0,0.35)]">
        <p className="flex-1 text-sm font-medium leading-snug text-white/95">
          {t("message")}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onAccept}
            aria-label={t("acceptButtonAria")}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-emerald-400 transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
          >
            <Check className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label={t("dismissButtonAria")}
            className="relative inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white/10 text-rose-400 transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
          >
            <svg
              className="absolute inset-0"
              viewBox="0 0 32 32"
              role="presentation"
              aria-hidden="true"
              style={{ pointerEvents: "none" }}
            >
              <circle
                cx="16"
                cy="16"
                r={PROGRESS_RADIUS}
                stroke="white"
                strokeOpacity={0.25}
                strokeWidth={2}
                fill="none"
              />
              <circle
                cx="16"
                cy="16"
                r={PROGRESS_RADIUS}
                stroke="white"
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                className={progressClassName}
                style={progressStyle}
              />
            </svg>
            <span className="relative z-10">
              <X className="h-3.5 w-3.5" aria-hidden />
            </span>
          </button>
        </div>
      </div>
      {animationId && isOpen ? (
        <style jsx>{`
          .${animationId} {
            stroke-dasharray: ${PROGRESS_CIRCUMFERENCE};
          }

          @keyframes ${animationId}-keyframes {
            from {
              stroke-dashoffset: ${PROGRESS_CIRCUMFERENCE};
            }
            to {
              stroke-dashoffset: 0;
            }
          }
        `}</style>
      ) : null}
    </div>
  );
}
