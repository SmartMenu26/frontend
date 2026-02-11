"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import HamburgerButton from "@/app/components/ui/HamburgerButton";

type Props = {
  showName?: boolean;
  name?: string;
};

export default function RestaurantHeader({ showName = true, name }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName = name?.trim() || "Restaurant";
  const navLinks = [
    { href: "#why-us", label: "Why us" },
    { href: "#about-us", label: "About us" },
    { href: "#contact", label: "Contact us" },
  ];
  const headingSizeClass = useMemo(() => {
    if (displayName.length > 28) return "text-4xl md:text-5xl";
    if (displayName.length > 22) return "text-5xl md:text-6xl";
    if (displayName.length > 16) return "text-6xl md:text-7xl";
    if (displayName.length > 7) return "text-5xl md:text-8xl";
    return "text-7xl md:text-9xl";
  }, [displayName]);

  return (
    <>
      {/* HEADER */}
      <div className="container mx-auto relative">
        <HamburgerButton
          open={menuOpen}
          onToggle={() => setMenuOpen((v) => !v)}
          className="absolute top-5 right-6 z-100 text-[#1B1F1E]"
          ariaLabel="Toggle navigation menu"
        />

        {showName && (
          <h1
            className={`pt-3 mx-6 md:mx-0 ${headingSizeClass} text-[#6B2E2E] font-great-vibes leading-tight whitespace-nowrap`}
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
        aria-hidden={!menuOpen}
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
        <nav className="pt-24 px-6 flex flex-col gap-4 text-lg font-semibold text-[#1B1F1E]">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="inline-flex items-center gap-2 hover:text-[#6B2E2E] transition"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

    </>
  );
}
