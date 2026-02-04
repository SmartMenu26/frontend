"use client";

import { useMemo, useState } from "react";
import HamburgerButton from "@/app/components/ui/HamburgerButton";

type Props = {
  showName?: boolean;
  name?: string;
};

export default function RestaurantHeader({ showName = true, name }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName = name?.trim() || "Bakal";
  const headingSizeClass = useMemo(() => {
    const charThreshold = 14;
    return displayName.length > charThreshold
      ? "text-7xl md:text-6xl leading-none pt-6"
      : "text-8xl md:text-9xl";
  }, [displayName]);

  return (
    <>
      {/* HEADER */}
      <div className="container mx-auto relative">
        <HamburgerButton
          open={menuOpen}
          onToggle={() => setMenuOpen((v) => !v)}
          className="absolute top-6 right-6 z-100"
        />

        {showName && (
          <h1
            className={`mx-6 md:mx-0 ${headingSizeClass} text-[#6B2E2E] font-birthstone`}
          >
            {displayName}
          </h1>
        )}
      </div>

      {/* BACKDROP */}
      <div
        onClick={() => setMenuOpen(false)}
        className={[
          "fixed inset-0 bg-black/30 z-40 transition-opacity duration-300",
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />
      {/* SLIDE-IN MENU (glass) */}
      <div
        className={[
          "fixed top-0 left-0 h-screen w-full z-50",
          "transform transition-transform duration-300 ease-out",
          menuOpen ? "translate-x-0" : "-translate-x-full",

          // 👇 glass effect
          "bg-white/60 backdrop-blur-xl",
          "border-r border-white/30",
          "shadow-[20px_0_60px_rgba(0,0,0,0.18)]",
        ].join(" ")}
      >
        <div className="pt-24 px-6">
          <p className="text-lg font-medium mb-4">Menu item 1</p>
          <p className="text-lg font-medium mb-4">Menu item 2</p>
          <p className="text-lg font-medium mb-4">Menu item 3</p>
        </div>
      </div>

    </>
  );
}
