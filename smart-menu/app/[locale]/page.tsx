import Link from "next/link";
import { Suspense } from "react";
import { Instagram, Mail, PhoneCall } from "lucide-react";
import InstallAppButton from "../_components/InstallAppButton";
import LanguageSwitcher from "../components/languageSwitcher/LanguageSwitcher";
import RestaurantHeader from "../components/ui/RestaurantHeader";

const highlights = [
  {
    title: "Instant Menu Updates",
    body: "Publish seasonal dishes, sold-out items, or dynamic pricing in seconds without reprinting any paper menus.",
  },
  {
    title: "AI Concierge",
    body: "Help guests discover dishes through natural language questions and dietary filters powered by our AI assistant.",
  },
  {
    title: "Actionable Insights",
    body: "Understand what guests view and favorite so you can fine-tune offers, bundles, and upsell flows.",
  },
];

const blogSnippets = [
  {
    title: "Why AI-powered menus outperform static QR menus",
    excerpt:
      "Static QR menus only display dishes. Smart Menu actively guides guests with personalized recommendations, helping them decide faster and order more.",
    href: "/restaurant/6957e610dfe0f2ca815211f8",
  },
  {
    title: "Turn indecision into higher average orders",
    excerpt:
      "An AI assistant suggests dishes based on mood, dietary needs, and preferences — reducing hesitation and increasing upsells naturally.",
    href: "/restaurant/6957e610dfe0f2ca815211f8",
  },
];


const contacts = [
  {
    label: "Email",
    value: "restaurantsmart26@gmail.com",
    href: "mailto:restaurantsmart26@gmail.com",
    icon: Mail,
  },
  {
    label: "Phone / WhatsApp",
    value: "+389 71 863 999",
    href: "tel:+38971863999",
    icon: PhoneCall,
  },
  {
    label: "Visit our Instagram Profile",
    value: "https://www.instagram.com/restaurantsmart26/",
    href: "https://www.instagram.com/restaurantsmart26/",
    icon: Instagram,
  },
];

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
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";

  try {
    const res = await fetch(`${origin}/api/restaurants`);
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

export default async function Home() {
  const restaurants = await loadRestaurants();

  return (
    <>
      <div className="bg-[#F7F7F7] text-[#1B1F1E]">
      <RestaurantHeader showName={false} />
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F7F7F7] to-white">
        <div className="container mx-auto flex flex-col gap-[60px] md:gap-10 px-4 pb-20 pt-24 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7A5A2A]">
              Hospitality, reimagined
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-[#1B1F1E] md:text-6xl">
              Smart Menu helps guests fall in love with your food before the first bite.
            </h1>
            <p className="mt-6 text-lg text-[#4A4D52] md:text-xl">
              Showcase signature dishes, explain stories, and guide every guest with personalized suggestions— all in a
              beautifully branded experience that lives on their phones.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/restaurant/6957e610dfe0f2ca815211f8"
                className="inline-flex items-center justify-center rounded-full bg-[#1B1F1E] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-[#2C3330]"
              >
                Explore Live Demo
              </Link>
              <Link
                href="#contact"
                className="inline-flex items-center justify-center rounded-full border border-[#1B1F1E] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#1B1F1E] transition hover:bg-[#1B1F1E] hover:text-white"
              >
                Talk to us
              </Link>
            </div>
          </div>

            <img
              src="/images/mock.png"
              alt="Smart Menu preview on a smartphone"
              className="mx-auto w-full p-4 rounded-4xl shadow-lg scale-120"
            />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white" />
      </section>

      <section id="why-us" className="container mx-auto px-4 py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#7A5A2A]">
          Why restaurants choose us
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-[#1B1F1E] md:text-4xl">
          Delight guests and empower your team.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-black/5 bg-white p-6 shadow-[0_15px_40px_rgba(15,24,21,0.05)]"
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
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#7A5A2A]">Growth Insights</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#1B1F1E]">
                The Future of Smart Restaurant Menus
              </h2>
            </div>

          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {blogSnippets.map((post) => (
              <article
                key={post.title}
                className="rounded-3xl border border-black/5 bg-gradient-to-br from-white to-[#F9F6F1] p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#7A5A2A]/80">Insight</p>
                <h3 className="mt-3 text-2xl font-semibold text-[#2F3A37]">{post.title}</h3>
                <p className="mt-3 text-sm text-[#4A4D52]">{post.excerpt}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {restaurants.length > 0 ? (
        <section className="bg-[#F7F7F7] py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#7A5A2A]">Live deployments</p>
                <h2 className="mt-3 text-3xl font-semibold text-[#1B1F1E]">Restaurants already on Smart Menu.</h2>
              </div>
              <InstallAppButton />
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {restaurants.slice(0, 3).map((restaurant) => {
                const label =
                  typeof restaurant.name === "string"
                    ? restaurant.name
                    : restaurant.name?.mk ?? restaurant.name?.en ?? restaurant.name?.sq ?? "Ресторан";
                const image = restaurant.imageUrl;

                return (
                  <article
                    key={restaurant._id ?? restaurant.slug}
                    className="w-full md:w-fit flex gap-3 rounded-3xl border border-black/5 bg-gray p-2 shadow-[0_15px_40px_rgba(15,24,21,0.05)] transition-transform duration-300 hover:scale-[1.02]"
                  >
                    {image ? (
                      <div className="relative w-full md:h-54 md:w-54 overflow-hidden rounded-2xl">
                        <img
                          src={image}
                          alt={label}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section id="contact" className="bg-[#1B1F1E] py-16 text-white">
        <div className="container mx-auto grid gap-12 px-4 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70 sm:text-sm">Let's talk</p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Ready to serve your guests?</h2>
            <p className="mt-4 text-sm text-white/80 sm:text-base">
              Tell us about your concept, audience, and challenges. We'll tailor a Smart Menu rollout that feels like a natural
              extension of your brand.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {contacts.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-center sm:text-left transition hover:bg-white/10"
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
