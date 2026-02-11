"use client";

import Image from "next/image";
import { useLocale } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { locales, type Locale } from "@/i18n";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const FLAG_ICON: Record<Locale, string> = {
  mk: "/icons/flags/mk.svg",
  sq: "/icons/flags/al.svg",
  en: "/icons/flags/gb.svg",
};

type LanguageSwitcherProps = {
  className?: string;
};

export default function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLocale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const buildHref = useCallback(
    (targetLocale: Locale) => {
      const path = pathname ?? "/";
      const segments = path.split("/").filter(Boolean);

      if (segments.length === 0) {
        segments.push(targetLocale);
      } else if (locales.includes(segments[0] as Locale)) {
        segments[0] = targetLocale;
      } else {
        segments.unshift(targetLocale);
      }

      const nextPath = `/${segments.join("/")}`;
      const query = searchParams?.toString();
      return query ? `${nextPath}?${query}` : nextPath;
    },
    [pathname, searchParams]
  );

  const handleSwitch = useCallback(
    (targetLocale: Locale) => {
      if (targetLocale === currentLocale) {
        setOpen(false);
        return;
      }
      const href = buildHref(targetLocale);
      router.push(href);
      setOpen(false);
    },
    [buildHref, currentLocale, router]
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, []);

  const currentFlagSrc = FLAG_ICON[currentLocale];
  const currentLabel = currentLocale.toUpperCase();

  const remainingLocales = useMemo(
    () => locales.filter((locale) => locale !== currentLocale),
    [currentLocale]
  );

  return (
    <div ref={containerRef} className={clsx("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="cursor-pointer flex items-center gap-2 rounded-full border border-white/60 bg-white px-3 py-1 shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B1F1E]/50"
      >
        <Image
          src={currentFlagSrc}
          alt={`${currentLabel} flag`}
          width={24}
          height={24}
          className="h-6 w-6 rounded-full object-cover"
        />
        <span className="text-sm font-semibold text-[#1B1F1E]">{currentLabel}</span>
        <svg
          className={clsx(
            "h-4 w-4 text-[#1B1F1E] transition-transform",
            open ? "rotate-180" : "rotate-0"
          )}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-32 rounded-2xl border border-black/10 bg-white p-2 shadow-xl">
          <ul role="listbox" aria-label="Select language" className="cursor-pointer flex flex-col gap-1">
            {remainingLocales.map((locale) => (
              <li key={locale}>
                <button
                  type="button"
                  onClick={() => handleSwitch(locale)}
                  className="cursor-pointer flex w-full items-center gap-2 rounded-xl px-2 py-1 text-sm text-left text-[#1B1F1E] hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B1F1E]/30"
                >
                  <Image
                    src={FLAG_ICON[locale]}
                    alt={`${locale.toUpperCase()} flag`}
                    width={20}
                    height={20}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                  <span className="font-medium uppercase">{locale}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
