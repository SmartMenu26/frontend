"use client";

import React from "react";
import clsx from "clsx";

type Props = {
  open: boolean;
  onToggle: () => void;
  className?: string;
  ariaLabel?: string;
};

export default function HamburgerButton({
  open,
  onToggle,
  className = "",
  ariaLabel = "Toggle menu",
}: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={ariaLabel}
      aria-expanded={open}
      className={clsx(
        "cursor-pointer inline-flex h-10 w-10 items-center justify-center rounded-full",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30",
        className
      )}
    >
      {/* top line */}
      <span
        className={clsx(
          "absolute h-0.5 w-6 rounded-full bg-current",
          "transition-transform duration-300 ease-out",
          open ? "translate-y-0 rotate-45" : "-translate-y-1.5 rotate-0"
        )}
      />
      {/* bottom line */}
      <span
        className={clsx(
          "absolute h-[2px] w-6 rounded-full bg-current",
          "transition-transform duration-300 ease-out",
          open ? "translate-y-0 -rotate-45" : "translate-y-[6px] rotate-0"
        )}
      />
    </button>
  );
}
