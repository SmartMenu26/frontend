import Link from "next/link";
import { Suspense } from "react";
import { Instagram, Mail, PhoneCall } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import InstallAppButton from "../_components/InstallAppButton";
import AnchorHashCleanup from "../components/AnchorHashCleanup";
import LanguageSwitcher from "../components/languageSwitcher/LanguageSwitcher";
import RestaurantHeader from "../components/ui/RestaurantHeader";
import type { Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";

const HIGHLIGHT_KEYS = ["aiConcierge", "instantMenu", "insights"] as const;

export const dynamic = "force-dynamic";

const BLOG_POSTS = [
  {
    key: "aiVsQr",
    href: "/restaurant/6957e610dfe0f2ca815211f8",
  },
  {
    key: "upsell",
    href: "/restaurant/6957e610dfe0f2ca815211f8",
  },
] as const;

type ContactItem = {
  key: "email" | "phone" | "instagram";
  value: string;
  href?: string;
  icon: LucideIcon;
};

const CONTACT_ITEMS: ContactItem[] = [
  {
    key: "email",
    value: "restaurantsmart26@gmail.com",
    href: "mailto:restaurantsmart26@gmail.com",
    icon: Mail,
  },
  {
    key: "phone",
    value: "+389 71 863 999",
    href: "tel:+38971863999",
    icon: PhoneCall,
  },
  {
    key: "instagram",
    value: "smartmenumk",
    href: "https://www.instagram.com/smartmenumk/",
    icon: Instagram,
  },
];

type ContactCard = ContactItem & { label: string };

type RestaurantRecord = {
  _id?: string;
  slug?: string;
  name?: { mk?: string; sq?: string; en?: string } | string;
  supportedLanguages?: string[];
  aiEnabled?: boolean;
  plan?: string;
  imageUrl?: string;
};

async function loadRestaurants(): Promise<RestaurantRecord[]> {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  try {
    const res = await fetch(`${origin}/api/restaurants`, {
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn("Failed to fetch restaurants:", res.status);
      return [];
    }
    const payload = await res.json().catch(() => null);
    const data = payload?.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch restaurants:", error);
    return [];
  }
}

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const restaurants = await loadRestaurants();
  const hero = {
    eyebrow: t("hero.eyebrow"),
    heading: t("hero.heading"),
    subheading: t("hero.subheading"),
    primaryCta: t("hero.primaryCta"),
    secondaryCta: t("hero.secondaryCta"),
  };
  const highlightHeading = {
    eyebrow: t("highlights.eyebrow"),
    title: t("highlights.title"),
  };
  const highlightCards = HIGHLIGHT_KEYS.map((key) => ({
    key,
    title: t(`highlights.items.${key}.title`),
    body: t(`highlights.items.${key}.body`),
  }));
  const blogHeading = {
    eyebrow: t("blog.eyebrow"),
    title: t("blog.title"),
    tag: t("blog.tag"),
  };
  const blogPosts = BLOG_POSTS.map((post) => ({
    ...post,
    href: buildLocalizedPath(post.href, locale),
    title: t(`blog.posts.${post.key}.title`),
    excerpt: t(`blog.posts.${post.key}.excerpt`),
  }));
  const deployments = {
    eyebrow: t("deployments.eyebrow"),
    title: t("deployments.title"),
    fallbackRestaurant: t("deployments.fallbackRestaurant"),
  };
  const contactCopy = {
    eyebrow: t("contact.eyebrow"),
    title: t("contact.title"),
    body: t("contact.body"),
  };
  const contactCards: ContactCard[] = CONTACT_ITEMS.map((item) => ({
    ...item,
    label: t(`contact.items.${item.key}.label`),
  }));

  const restaurantLogos = restaurants
    .map((restaurant, index) => {
      const label =
        typeof restaurant.name === "string"
          ? restaurant.name
          : restaurant.name?.mk ??
            restaurant.name?.en ??
            restaurant.name?.sq ??
            deployments.fallbackRestaurant;
      const image = restaurant.imageUrl?.trim();

      if (!image) return null;

      return {
        key: restaurant._id ?? restaurant.slug ?? `restaurant-${index}`,
        label,
        image,
      };
    })
    .filter(
      (restaurant): restaurant is { key: string; label: string; image: string } =>
        Boolean(restaurant)
    );

  return (
    <>
      <AnchorHashCleanup />
      <div className="bg-[#F7F7F7] text-[#1B1F1E]">
      <RestaurantHeader showName={false} />
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F7F7F7] to-white">
        <div className="container mx-auto flex flex-col gap-[60px] md:gap-10 px-4 pb-20 pt-24 md:pt-10 md:flex-row md:items-center">
          <div className="landing-fade max-w-2xl" style={{ animationDelay: "120ms" }}>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7A5A2A]">
              {hero.eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#1B1F1E] md:text-6xl">
              {hero.heading}
            </h1>
            <p className="mt-6 text-lg text-[#4A4D52] md:text-xl">
              {hero.subheading}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="#contact"
                className="inline-flex items-center justify-center rounded-full border border-[#1B1F1E] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#1B1F1E] transition hover:bg-[#1B1F1E] hover:text-white"
              >
                {hero.secondaryCta}
              </Link>
            </div>
          </div>

            <div
              className="landing-fade mx-auto w-full md:w-1/2 md:p-4"
              style={{ animationDelay: "260ms" }}
            >
              <video
                className="w-full rounded-[36px] shadow-[0_30px_80px_rgba(0,0,0,0.15)]"
                src="/smart-menu-ai-video.mp4"
                autoPlay
                muted
                loop
                playsInline
                poster="/images/mock.png"
              />
            </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white" />
      </section>

      <section id="why-us" className="container mx-auto px-4 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#7A5A2A]">
          {highlightHeading.eyebrow}
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-[#1B1F1E] md:text-4xl">
          {highlightHeading.title}
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {highlightCards.map((item, index) => (
            <article
              key={item.key}
              className="landing-fade rounded-2xl border border-black/5 bg-white p-6 shadow-[0_15px_40px_rgba(15,24,21,0.05)]"
              style={{ animationDelay: `${200 + index * 100}ms` }}
            >
              <h3 className="text-xl font-semibold text-[#2F3A37]">{item.title}</h3>
              <p className="mt-3 text-sm text-[#4A4D52]">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="about-us" className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#7A5A2A]">
                {blogHeading.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-[#1B1F1E]">
                {blogHeading.title}
              </h2>
            </div>

          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {blogPosts.map((post, index) => (
              <article
                key={post.key}
                className="landing-fade rounded-3xl border border-black/5 bg-gradient-to-br from-white to-[#F9F6F1] p-6"
                style={{ animationDelay: `${200 + index * 120}ms` }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#7A5A2A]/80">
                  {blogHeading.tag}
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-[#2F3A37]">{post.title}</h3>
                <p className="mt-3 text-sm text-[#4A4D52]">{post.excerpt}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {restaurantLogos.length > 0 ? (
        <section className="bg-[#F7F7F7] py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="mt-3 text-3xl font-semibold text-[#1B1F1E]">{deployments.title}</h2>
              </div>
              <InstallAppButton />
            </div>

            <div
              className="landing-fade mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
              style={{ animationDelay: "200ms" }}
            >
              {restaurantLogos.length > 1 ? (
                <div className="restaurant-logo-marquee flex w-max">
                  {[0, 1].map((group) => (
                    <div
                      key={group}
                      className={`flex shrink-0 gap-2 pr-4${
                        group === 1 ? " restaurant-logo-marquee-duplicate" : ""
                      }`}
                      aria-hidden={group === 1}
                    >
                      {restaurantLogos.map((restaurant) => (
                        <div
                          key={`${restaurant.key}-${group}`}
                          className="flex h-24 w-36 shrink-0 items-center justify-center  p-2 sm:h-28 sm:w-40 rounded-2xl"
                        >
                          <img
                            src={restaurant.image}
                            alt={restaurant.label}
                            className="max-h-full max-w-full object-contain rounded-2xl"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="flex h-24 w-36 items-center justify-center rounded-2xl border border-black/5 bg-white p-4 shadow-[0_15px_35px_rgba(15,24,21,0.06)] sm:h-28 sm:w-44">
                    <img
                      src={restaurantLogos[0].image}
                      alt={restaurantLogos[0].label}
                      className="max-h-full max-w-full object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <section id="contact" className="bg-[#1B1F1E] py-16 text-white">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-2">
          <div className="landing-fade text-center lg:text-left" style={{ animationDelay: "200ms" }}>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70 sm:text-sm">
              {contactCopy.eyebrow}
            </p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">{contactCopy.title}</h2>
            <p className="mt-4 text-sm text-white/80 sm:text-base">{contactCopy.body}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {contactCards.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.key}
                  className="landing-fade w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-center sm:text-left transition hover:bg-white/10"
                  style={{ animationDelay: `${200 + index * 100}ms` }}
                >
                  <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center">
                    {Icon ? <Icon className="h-5 w-5 text-white" aria-hidden="true" /> : null}
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60">{item.label}</p>
                  </div>
                  {item.href ? (
                    <Link href={item.href} className="mt-2 block text-lg font-semibold text-white break-words">
                      {item.value}
                    </Link>
                  ) : (
                    <p className="mt-2 text-lg font-semibold text-white break-words">{item.value}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
      </div>
      <div className="pointer-events-auto fixed bottom-4 right-4 z-50">
        <Suspense fallback={null}>
          <LanguageSwitcher />
        </Suspense>
      </div>
    </>
  );
}
