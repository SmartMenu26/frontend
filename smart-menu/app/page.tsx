import Link from "next/link";
import InstallAppButton from "./_components/InstallAppButton";

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
    title: "Why digital menus convert better than PDFs",
    excerpt:
      "A dynamic experience lets guests browse by mood, allergies, and cravings so they order with confidence.",
    href: "/restaurant/6957e610dfe0f2ca815211f8",
  },
  {
    title: "From QR codes to curated journeys",
    excerpt: "How Smart Menu tells your brand story with cinematic imagery, pairing ideas, and chef notes.",
    href: "/restaurant/6957e610dfe0f2ca815211f8",
  },
];

const contacts = [
  {
    label: "Email",
    value: "team@smartmenu.app",
    href: "mailto:team@smartmenu.app",
  },
  {
    label: "Phone / WhatsApp",
    value: "+389 70 000 000",
    href: "tel:+38970000000",
  },
  {
    label: "Visit our studio",
    value: "Skopje · Remote-first",
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
    <div className="bg-[#F7F7F7] text-[#1B1F1E]">
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F7F7F7] to-white">
        <div className="container mx-auto flex flex-col gap-10 px-4 pb-20 pt-24 md:flex-row md:items-center">
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

          <div className="relative flex-1">
            <div className="rounded-[36px] border border-white/60 bg-white/80 p-6 shadow-[0_45px_90px_rgba(10,8,6,0.08)] backdrop-blur">
              <p className="text-sm font-medium uppercase tracking-wide text-[#7A5A2A]">Live preview</p>
              <p className="mt-3 text-2xl font-semibold text-[#2F3A37]">
                Digital menus that feel like your restaurant.
              </p>
              <p className="mt-4 text-sm text-[#4A4D52]">
                Card-based browsing, rich photography, allergen insight, and an AI recommendation concierge—everything powered by
                Smart Menu.
              </p>
              <div className="mt-6 rounded-3xl bg-[#3F5D50] p-4 text-white shadow-inner">
                <p className="text-xs uppercase tracking-[0.3em] text-white/70">What guests see</p>
                <p className="mt-3 text-3xl font-semibold">“What should I pair with the house risotto?”</p>
                <p className="mt-3 text-sm text-white/80">
                  Smart Menu suggests perfect pairings, wine flights, and chef notes in Macedonian, English, or Albanian.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white" />
      </section>

      <section className="container mx-auto px-4 py-16">
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

      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#7A5A2A]">From the journal</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#1B1F1E]">
                Stories on crafting modern dining journeys.
              </h2>
            </div>
            <Link
              href="/restaurant/6957e610dfe0f2ca815211f8"
              className="inline-flex items-center justify-center rounded-full border border-[#1B1F1E]/10 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-[#1B1F1E] transition hover:bg-[#1B1F1E] hover:text-white"
            >
              Read more
            </Link>
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
                <Link
                  href={post.href}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#7A5A2A] hover:underline"
                >
                  Continue reading →
                </Link>
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

                const supports = restaurant.supportedLanguages?.length
                  ? restaurant.supportedLanguages.join(", ")
                  : "mk/sq/en";

                return (
                  <article
                    key={restaurant._id ?? restaurant.slug}
                    className="rounded-3xl border border-black/5 bg-white p-5 shadow-[0_15px_40px_rgba(15,24,21,0.05)]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7A5A2A]/80">
                      {restaurant.plan ?? "Premium"}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-[#1B1F1E]">{label}</h3>
                    <p className="mt-1 text-sm text-[#4A4D52]">Languages: {supports}</p>
                    <Link
                      href={`/restaurant/${restaurant._id ?? restaurant.slug}`}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#7A5A2A] hover:underline"
                    >
                      View menu →
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section id="contact" className="bg-[#1B1F1E] py-16 text-white">
        <div className="container mx-auto grid gap-10 px-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">Let's talk</p>
            <h2 className="mt-3 text-3xl font-semibold">Ready to serve your guests?</h2>
            <p className="mt-4 text-sm text-white/80">
              Tell us about your concept, audience, and challenges. We'll tailor a Smart Menu rollout that feels like a natural
              extension of your brand.
            </p>
          </div>
          <div className="grid gap-4 text-sm">
            {contacts.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">{item.label}</p>
                {item.href ? (
                  <Link href={item.href} className="mt-1 block text-lg font-semibold text-white">
                    {item.value}
                  </Link>
                ) : (
                  <p className="mt-1 text-lg font-semibold text-white">{item.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
