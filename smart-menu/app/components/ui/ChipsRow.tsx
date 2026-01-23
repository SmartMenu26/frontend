"use client";

import React, { forwardRef, useEffect, useRef } from "react";

export type ChipVariant = "outline" | "solid";

export type ChipItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: ChipVariant;
  colorClassName?: string;
};

type ChipsRowProps = {
  items: ChipItem[];
  activeId?: string;
  className?: string;
  onChipClick?: (id: string) => void;
};

const ChipsRow = forwardRef<HTMLDivElement, ChipsRowProps>(
  ({ items, activeId, className = "", onChipClick }, containerRef) => {
    const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    // auto-scroll when active chip changes
    useEffect(() => {
      if (!activeId) return;
      const el = chipRefs.current[activeId];
      if (!el) return;

      el.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }, [activeId]);

    return (
      <div
        ref={containerRef}
        className={[
          "flex flex-nowrap gap-0.5 overflow-x-auto overflow-y-hidden",
          "whitespace-nowrap snap-x snap-mandatory",
          "px-1 touch-pan-x",
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          className,
        ].join(" ")}
        aria-label="Chips"
      >
        {items.map((item) => {
          const variant = item.variant ?? "outline";
          const isActive = item.id === activeId;

          const base =
            "inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold " +
            "transition" +
            "shrink-0 snap-start";

          const outline =
            "bg-white text-slate-900 border border-[#0D3B66] hover:bg-slate-50";

          const solid =
            item.colorClassName ?? "bg-slate-900 text-white hover:opacity-90";

          return (
            <button
              key={item.id}
              ref={(el) => {
                chipRefs.current[item.id] = el;
              }}
              type="button"
              onClick={() => onChipClick?.(item.id)}
              className={[
                "cursor-pointer",
                base,

                isActive
                  ? "bg-[#2F3A37] text-white hover:opacity-90"
                  : variant === "outline"
                    ? outline
                    : solid,

                isActive ? "" : "",
              ].join(" ")}

            >
              {item.icon && (
                <span className="text-base leading-none">{item.icon}</span>
              )}
              <span className="uppercase tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    );
  }
);

ChipsRow.displayName = "ChipsRow";
export default ChipsRow;
