"use client";

import type { SVGProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { type Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";

const FOOTER_LOGO_SIZE = 40;
const FOOTER_LOGO_SIZES = "40px";

export default function Footer() {
  const t = useTranslations("footer");
  const locale = useLocale() as Locale;
  const homeHref = buildLocalizedPath("/", locale);

  return (
    <footer className="mt-1 border-t border-black/5 bg-[#F7F7F7] backdrop-blur">
      <div className="container mx-auto flex flex-col justify-center items-center gap-2 px-6 text-[#2F3A37] md:flex-row md:items-center md:justify-between pt-4 pb-2">
        <div className="flex flex-col items-center gap-2">
          <Image
            src="/icons/smart-logo-192x192.png"
            alt="Smart Menu logo"
            width={FOOTER_LOGO_SIZE}
            height={FOOTER_LOGO_SIZE}
            sizes={FOOTER_LOGO_SIZES}
            className="h-10 w-10"
            loading="lazy"
          />
          <div className="flex gap-4">
            <Link href={homeHref} className="hover:text-[#074128]">
              {t("home")}
            </Link>
            <a
              href="mailto:contact@smartmenu.app"
              className="hover:text-[#074128]"
            >
              {t("contact")}
            </a>
          </div>
        </div>

        <InstagramIcon className="h-6 w-6 text-[#2F3A37]" strokeWidth={1.7} />
      </div>
    </footer>
  );
}

function InstagramIcon({
  className,
  strokeWidth = 2,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
