import Image from "next/image";
import Link from "next/link";
import smartMenuScreen from "@/public/images/smart-menu-screen.png";

type SmartMenuShowcaseProps = {
  title: string;
  cta: string;
  imageAlt: string;
  href?: string;
};

export default function SmartMenuShowcase({
  title,
  cta,
  imageAlt,
  href = "#contact",
}: SmartMenuShowcaseProps) {
  return (
    <div className="smart-menu-showcase-grid overflow-hidden pb-0 pt-10 md:pb-10 text-black md:py-0">
      <div className="container relative z-20 mx-auto flex flex-col-reverse md:grid min-h-[360px] items-center gap-8 px-4 md:grid-cols-[0.9fr_1.1fr] lg:min-h-[460px]">
        <div className="smart-menu-showcase-image-enter relative mx-auto flex h-[320px] w-full max-w-[420px] items-start justify-center md:h-[460px] md:max-w-[560px] md:justify-start">
          <Image
            src={smartMenuScreen}
            alt={imageAlt}
            className="h-auto w-[340px] max-w-none md:absolute md:-left-8 md:-top-1 md:w-[470px] lg:-left-14 lg:-top-5 lg:w-[560px]"
            priority={false}
            sizes="(min-width: 1024px) 560px, (min-width: 768px) 470px, 270px"
          />
        </div>

        <div className="smart-menu-showcase-copy-enter relative z-30 mx-auto flex max-w-[640px] flex-col items-center text-center opacity-100 md:items-end md:text-right">
          <h1 className="max-w-[600px] text-3xl pt-4 md:pt-0 font-bold leading-tight text-[#181B25] opacity-100 md:text-5xl lg:text-5xl">
            {title}
          </h1>
          <Link
            href={href}
            className="relative z-30 mt-8 inline-flex min-w-[220px] items-center justify-center rounded-lg bg-[#181B25] px-8 py-4 text-base font-semibold text-white opacity-100 shadow-[0_18px_45px_rgba(56,108,66,0.28)] transition hover:bg-[#2f5d38]"
          >
            {cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
