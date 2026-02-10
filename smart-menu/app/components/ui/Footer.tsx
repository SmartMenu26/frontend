"use client";

import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-1 border-t border-black/5 bg-[#F7F7F7] backdrop-blur py-6">
      <div className="container mx-auto flex flex-col gap-4 px-6 text-[#2F3A37] md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Image
            src="/icons/smart-logo-512x512.png"
            alt="Smart Menu logo"
            width={48}
            height={48}
            className="h-10 w-10 object-contain"
          />
          <div className="flex gap-3">
            <Link href="/" className="hover:text-[#074128]">
              Почетна
            </Link>
            <a
              href="mailto:contact@smartmenu.app"
              className="hover:text-[#074128]"
            >
              Контакт
            </a>
          </div>
        </div>


      </div>
    </footer>
  );
}
