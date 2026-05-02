"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import HamburgerButton from "@/app/components/ui/HamburgerButton";
import { type Locale } from "@/i18n";
import { greatVibes } from "@/app/fonts";

type Props = {
  showName?: boolean;
  name?: string;
};

export default function RestaurantHeader({ showName = true, name }: Props) {
  const t = useTranslations("header");
  const locale = useLocale() as Locale;
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName = name?.trim() || t("fallbackName");
  const menuLabel = t("menuLabel");
  const homeHref = locale ? `/${locale}` : "/";
  const blogHref = locale ? `/${locale}/blog` : "/blog";
  const navLinks = useMemo(() => {
    return [
      {
        href: homeHref,
        label: t("nav.home"),
      },
      {
        href: `${homeHref}#why-us`,
        label: t("nav.whyUs"),
      },
      {
        href: `${homeHref}#about-us`,
        label: t("nav.aboutUs"),
      },
      {
        href: blogHref,
        label: t("nav.blog"),
      },
      {
        href: `${homeHref}#contact`,
        label: t("nav.contact"),
      },
    ];
  }, [blogHref, homeHref, t]);
  const desktopNavLinks = navLinks.slice(1);
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
      <header
        className="container mx-auto relative flex flex-col-reverse gap-10 md:items-base md:justify-between md:rounded-[32px]"
        role="banner"
      >
        <HamburgerButton
          open={menuOpen}
          onToggle={() => setMenuOpen((v) => !v)}
          className="absolute top-5 right-6 z-100 text-[#1B1F1E] md:hidden"
          ariaLabel={t("toggleLabel")}
        />

        {showName && (
          <h1
            className={[
              greatVibes.className,
              "pt-3 mx-4 md:mx-0 max-w-[90vw]",
              headingSizeClass,
              "text-[#6B2E2E]",
            ].join(" ")}
          >
            {displayName}
            <span className="block text-4xl md:text-4xl text-[#1B1F1E]/80 md:inline md:ml-3">
              {menuLabel}
            </span>
          </h1>
        )}

        <nav
          className="hidden md:flex items-center gap-6 text-base font-semibold text-[#1B1F1E] rounded-full border border-[#EADFD2]/70 bg-white/80 px-6 py-3 my-4"
          aria-label={menuLabel}
        >
          <Link
            href={homeHref}
            className="flex items-center gap-3 pr-5 mr-1 border-r border-[#EADFD2]/80"
            aria-label={displayName}
          >
            <img
              src="/icons/smart-logo-80x80.png"
              alt={`${displayName} logo`}
              width={48}
              height={48}
              loading="lazy"
              className="h-10 w-10 rounded-full border border-white/70 shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
            />
            <span className="text-sm uppercase tracking-[0.25em] text-[#6B2E2E]">
              Menu
            </span>
          </Link>

          <ul className="flex items-center gap-6">
            {desktopNavLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="relative inline-flex items-center gap-2 px-1 py-1 text-[#2F3A37] transition hover:text-[#6B2E2E]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* BACKDROP */}
      <div
        onClick={() => setMenuOpen(false)}
        className={[
          "fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 md:hidden",
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
        aria-hidden={!menuOpen}
      />
      {/* SLIDE-IN MENU (glass) */}
      <nav
        className={[
          "fixed top-0 left-0 h-screen w-full z-50 md:hidden",
          "transform transition-transform duration-300 ease-out",
          menuOpen ? "translate-x-0" : "-translate-x-full",

          // 👇 glass effect
          "bg-white/60 backdrop-blur-xl",
          "border-r border-white/30",
          "shadow-[20px_0_60px_rgba(0,0,0,0.18)]",
        ].join(" ")}
        aria-label="Главна навигација"
      >
        <ul className="pt-24 px-6 flex flex-col gap-4 text-lg font-semibold text-[#1B1F1E]">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="inline-flex items-center gap-2 hover:text-[#6B2E2E] transition"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
