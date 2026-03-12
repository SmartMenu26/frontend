import { Facebook, Instagram, MapPin, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { greatVibes } from "@/app/fonts";

export type RestaurantContactLabels = {
  title: string;
  location: string;
  phone: string;
  call: string;
  facebook: string;
  instagram: string;
};

type Props = {
  labels: RestaurantContactLabels;
  restaurantName?: string;
  location?: string;
  phone?: string;
  facebookUrl?: string;
  instagramUrl?: string;
};

type ContactLineProps = {
  icon: LucideIcon;
  text: string;
  href?: string;
  underline?: boolean;
  ariaLabel?: string;
};

const ContactLine = ({ icon: Icon, text, href, underline, ariaLabel }: ContactLineProps) => {
  const content = (
    <>
      <Icon className="h-5 w-5 text-[#1B1F1E]" aria-hidden />
      <span
        className={`text-base leading-snug text-[#1B1F1E] ${
          underline ? "underline underline-offset-4" : ""
        }`}
      >
        {text}
      </span>
    </>
  );

  if (href) {
    const isExternal = href.startsWith("http");
    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer" : undefined}
        className="flex items-center gap-3"
        aria-label={ariaLabel}
      >
        {content}
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3" aria-label={ariaLabel}>
      {content}
    </div>
  );
};

const formatPhoneHref = (phone?: string) => {
  if (!phone) return undefined;
  return `tel:${phone.replace(/[^+\d]/g, "")}`;
};

const formatMapsHref = (location?: string) => {
  if (!location) return undefined;
  const query = encodeURIComponent(location);
  return `https://maps.google.com/?q=${query}`;
};

const formatSocialLabel = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
};

export default function RestaurantContactCard({
  labels,
  restaurantName,
  location,
  phone,
  facebookUrl,
  instagramUrl,
}: Props) {
  const hasContent = location || phone || facebookUrl || instagramUrl;
  if (!hasContent) return null;

  const telHref = formatPhoneHref(phone);
  const mapHref = formatMapsHref(location);

  return (
    <section
      id="restaurant-contact"
      className="rounded-[32px] border border-[#0F1F1A]/10 bg-white px-6 py-7 text-[#1B1F1E] shadow-sm"
    >
      {restaurantName ? (
        <p className={`${greatVibes.className} text-4xl text-[#1B1F1E]`}>
          {restaurantName}
        </p>
      ) : (
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#1B1F1E]/60">
          {labels.title}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {phone ? (
          <ContactLine
            icon={Phone}
            text={phone}
            href={telHref}
            ariaLabel={`${labels.call} ${phone}`}
          />
        ) : null}

        {location ? (
          <ContactLine
            icon={MapPin}
            text={location}
            href={mapHref}
            underline
            ariaLabel={`${labels.location}: ${location}`}
          />
        ) : null}

        {facebookUrl ? (
          <ContactLine
            icon={Facebook}
            text={`${labels.facebook}`}
            href={facebookUrl}
            ariaLabel={`${labels.facebook}: ${formatSocialLabel(facebookUrl)}`}
          />
        ) : null}

        {instagramUrl ? (
          <ContactLine
            icon={Instagram}
            text={`${labels.instagram}`}
            href={instagramUrl}
            ariaLabel={`${labels.instagram}: ${formatSocialLabel(instagramUrl)}`}
          />
        ) : null}
      </div>
    </section>
  );
}
