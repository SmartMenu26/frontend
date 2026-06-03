import Link from "next/link";
import { Suspense } from "react";
import { Instagram, Mail, PhoneCall } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import AnchorHashCleanup from "../components/AnchorHashCleanup";
import ContactFormShowcase from "../components/home/ContactFormShowcase";
import RestaurantLogoCarousel from "../components/home/RestaurantLogoCarousel";
import SmartMenuShowcase from "../components/home/SmartMenuShowcase";
import WhyUsSection from "../components/home/WhyUsSection";
import LanguageSwitcher from "../components/languageSwitcher/LanguageSwitcher";
import RestaurantHeader from "../components/ui/RestaurantHeader";
import type { Locale } from "@/i18n";
import { buildLocalizedPath } from "@/lib/routing";

const HIGHLIGHT_KEYS = ["increasedOrders", "googleReviews", "satisfiedGuests"] as const;

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
  const highlightTitle = t("highlights.title");
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
  const showcase = {
    title: t("showcase.title"),
    cta: t("showcase.cta"),
    imageAlt: t("showcase.imageAlt"),
  };
  const contactForm = {
    title: t("contactForm.title"),
    submitLabel: t("contactForm.submitLabel"),
    submittingLabel: t("contactForm.submittingLabel"),
    successMessage: t("contactForm.successMessage"),
    errorMessage: t("contactForm.errorMessage"),
    imageAlt: t("contactForm.imageAlt"),
    fields: {
      firstName: t("contactForm.fields.firstName"),
      lastName: t("contactForm.fields.lastName"),
      phone: t("contactForm.fields.phone"),
      email: t("contactForm.fields.email"),
      restaurantName: t("contactForm.fields.restaurantName"),
      message: t("contactForm.fields.message"),
    },
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
      <div className="bg-white text-[#1B1F1E]">
        <RestaurantHeader showName={false} />
        <section className="restaurant-carousel-pattern">
          <SmartMenuShowcase
            title={showcase.title}
            cta={showcase.cta}
            imageAlt={showcase.imageAlt}
          />
        </section>
        <RestaurantLogoCarousel
          title={deployments.title}
          restaurants={restaurantLogos}
        />
        <WhyUsSection title={highlightTitle} cards={highlightCards} />

        <ContactFormShowcase
          title={contactForm.title}
          submitLabel={contactForm.submitLabel}
          submittingLabel={contactForm.submittingLabel}
          successMessage={contactForm.successMessage}
          errorMessage={contactForm.errorMessage}
          imageAlt={contactForm.imageAlt}
          fields={contactForm.fields}
        />

        <section id="contact-details" className="bg-[#1B1F1E] py-16 text-white">
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
