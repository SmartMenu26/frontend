"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type WhyUsCard = {
  key: string;
  title: string;
  body: string;
};

type WhyUsSectionProps = {
  title: string;
  cards: WhyUsCard[];
};

const CARD_IMAGES = [
  {
    src: "/images/increased_orders_illustration.svg",
    alt: "Increased orders illustration",
    width: 520,
    height: 350,
  },
  {
    src: "/images/google_reviews_illustration.svg",
    alt: "Google reviews illustration",
    width: 520,
    height: 350,
  },
  {
    src: "/images/satisfied_guests_illustration.svg",
    alt: "Satisfied guests illustration",
    width: 520,
    height: 350,
  },
] as const;

function splitTitle(title: string) {
  const smartMenuIndex = title.toLowerCase().indexOf("smart menu");

  if (smartMenuIndex === -1) {
    return { lead: title, accent: "" };
  }

  return {
    lead: title.slice(0, smartMenuIndex).trim(),
    accent: title.slice(smartMenuIndex).trim(),
  };
}

export default function WhyUsSection({ title, cards }: WhyUsSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const titleParts = splitTitle(title);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || isVisible) return;

    if (!("IntersectionObserver" in window)) {
      const timeout = globalThis.setTimeout(() => setIsVisible(true), 0);
      return () => globalThis.clearTimeout(timeout);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "0px 0px -15% 0px",
        threshold: 0.2,
      }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <section ref={sectionRef} id="why-us" className="bg-white px-3 py-10 sm:px-4 sm:py-14 lg:py-20">
      <div className="mx-auto max-w-[1820px]">
        <h2
          className={`${isVisible ? "landing-fade" : "opacity-0 translate-y-3"} text-center text-[36px] font-light leading-[1.06] text-[#1B1F1E] sm:text-[3.25rem] lg:text-[60px]`}
        >
          {titleParts.lead}
          {titleParts.accent ? (
            <>
              {" "}
              <span className="text-[#9B9B9B]">{titleParts.accent}</span>
            </>
          ) : null}
        </h2>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 md:grid-cols-3 lg:mt-8 lg:gap-4">
          {cards.map((card, index) => {
            const image = CARD_IMAGES[index % CARD_IMAGES.length];

            return (
              <article
                key={card.key}
                className={`${isVisible ? "landing-fade" : "opacity-0 translate-y-3"} flex min-h-[350px] flex-col justify-between overflow-hidden rounded-[8px] bg-[#FAF8F6] shadow-[0_10px_28px_rgba(24,27,37,0.045),0_2px_8px_rgba(24,27,37,0.035)] sm:min-h-[430px] lg:min-h-[610px]`}
                style={{ animationDelay: `${160 + index * 100}ms` }}
              >
                <div className="relative z-10 px-5 pt-5 sm:px-7 sm:pt-7 lg:px-10 lg:pt-10">
                  <h3 className="text-lg font-bold leading-tight text-black sm:text-xl lg:text-[1.4rem]">
                    {card.title}
                  </h3>
                  <p className="mt-2 max-w-[35rem] text-sm leading-6 text-[#5E5E5E] sm:text-base sm:leading-7 lg:mt-4 lg:text-[18px]">
                    {card.body}
                  </p>
                </div>

                <div className="flex h-[190px] items-end justify-center px-3 sm:h-[250px] sm:px-4 lg:h-[350px]">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    className="h-[190px] w-[285px] max-w-full object-contain sm:h-[250px] sm:w-[375px] lg:h-[350px] lg:w-[520px]"
                    sizes="(min-width: 1024px) 31vw, (min-width: 768px) 33vw, 100vw"
                  />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
