"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart } from "lucide-react";

type Allergen = {
  key: string;
  label: string;
};

type Props = {
  name: string;
  description?: string;
  imageUrl: string;
  allergens?: Allergen[];
};

export default function MenuItemDetails({
  name,
  description,
  imageUrl,
  allergens = [],
}: Props) {
  const router = useRouter();

  return (
    <div className="min-h-dvh bg-[#1F2F2A]">
      {/* TOP IMAGE AREA */}
      <div className="relative h-[48vh] w-full">
        {/* back button */}
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="absolute left-4 top-4 z-10 rounded-xl bg-black/40 p-2 backdrop-blur-md"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>

        {/* image */}
        <div className="absolute inset-0">
          <Image
            src={imageUrl}
            alt={name}
            fill
            priority
            className="object-contain p-8"
            sizes="100vw"
          />
        </div>
      </div>

      {/* BOTTOM SHEET */}
      <div className="rounded-t-[40px] bg-[#F7F7F7] px-6 pb-10 pt-10 shadow-[0_-20px_60px_rgba(0,0,0,0.25)]">
        <h1 className="font-birthstone text-5xl leading-tight text-[#2F3A37]">
          {name}
        </h1>

        {!!description && (
          <p className="mt-4 text-base leading-relaxed text-[#2F3A37]/80">
            {description}
          </p>
        )}

        {/* allergens */}
        {allergens.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#2F3A37]/60">
              Алергени
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {allergens.map((a) => (
                <span
                  key={a.key}
                  className="rounded-full border border-[#2F3A37]/15 bg-white px-3 py-1 text-xs text-[#2F3A37]/80"
                >
                  {a.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* actions */}
        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            className="flex-1 rounded-full bg-[#1B1F1E] py-4 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.22)]"
          >
            AI ПРЕПОРАКА
          </button>

          <button
            type="button"
            aria-label="Add to favorites"
            className="grid h-14 w-14 place-items-center rounded-full bg-[#FF4D9D] shadow-[0_10px_30px_rgba(0,0,0,0.22)]"
          >
            <Heart className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* optional footer link */}
        <button
          type="button"
          className="mt-6 w-full text-center text-xs text-[#2F3A37]/70 underline underline-offset-4"
        >
          Сподели твое мислење
        </button>
      </div>
    </div>
  );
}
