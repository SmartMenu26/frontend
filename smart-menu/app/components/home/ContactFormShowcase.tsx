"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import PhoneInput from "react-phone-number-input";
import {
  getCountryCallingCode,
  type Country,
  type Value as PhoneNumberValue,
} from "react-phone-number-input";
import phoneLabels from "react-phone-number-input/locale/en.json";
import smartMenuContactScreen from "@/public/images/smart-menu-screen-2.png";

type ContactFormShowcaseProps = {
  title: string;
  submitLabel: string;
  submittingLabel: string;
  successMessage: string;
  errorMessage: string;
  imageAlt: string;
  fields: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    restaurantName: string;
    message: string;
  };
};

type CountrySelectOption = {
  value?: Country;
  label: string;
};

type ContactCountrySelectProps = {
  value?: Country;
  onChange: (value?: Country) => void;
  options: CountrySelectOption[];
  disabled?: boolean;
  readOnly?: boolean;
  tabIndex?: number | string;
};

function getCountryFlag(country?: Country) {
  if (!country || country.length !== 2) return "";

  return country
    .toUpperCase()
    .split("")
    .map((letter) => String.fromCodePoint(letter.charCodeAt(0) + 127397))
    .join("");
}

function formatCountryLabel(label: string) {
  return label === "North Macedonia" ? "Macedonia" : label;
}

function ContactCountrySelect({
  value,
  onChange,
  options,
  disabled,
  readOnly,
  tabIndex,
}: ContactCountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selectedOptionRef = useRef<HTMLButtonElement>(null);

  const countryOptions = useMemo(
    () => options.filter((option): option is Required<CountrySelectOption> => Boolean(option.value)),
    [options]
  );
  const selectedOption = countryOptions.find((option) => option.value === value) ?? countryOptions[0];

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      selectedOptionRef.current?.scrollIntoView({ block: "center" });
    }
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className="contact-country-select">
      <button
        type="button"
        disabled={disabled || readOnly}
        tabIndex={typeof tabIndex === "string" ? Number(tabIndex) : tabIndex}
        className="contact-country-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="contact-country-select-flag" aria-hidden="true">
          {getCountryFlag(selectedOption?.value)}
        </span>
        <span className="contact-country-select-arrow" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div className="contact-country-select-menu" role="listbox">
          {countryOptions.map((option) => {
            const isSelected = option.value === selectedOption?.value;
            return (
              <button
                key={option.value}
                ref={isSelected ? selectedOptionRef : undefined}
                type="button"
                role="option"
                aria-selected={isSelected}
                className="contact-country-select-option"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span className="contact-country-select-option-flag" aria-hidden="true">
                  {getCountryFlag(option.value)}
                </span>
                <span className="contact-country-select-option-name">
                  {formatCountryLabel(option.label)}
                </span>
                <span className="contact-country-select-option-code">
                  +{getCountryCallingCode(option.value)}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function ContactFormShowcase({
  title,
  submitLabel,
  submittingLabel,
  successMessage,
  errorMessage,
  imageAlt,
  fields,
}: ContactFormShowcaseProps) {
  const [phoneValue, setPhoneValue] = useState<PhoneNumberValue>();
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const [isImageVisible, setIsImageVisible] = useState(false);

  useEffect(() => {
    const image = imageRef.current;
    if (!image || isImageVisible) return;

    if (!("IntersectionObserver" in window)) {
      const timeout = globalThis.setTimeout(() => setIsImageVisible(true), 0);
      return () => globalThis.clearTimeout(timeout);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsImageVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.2,
      }
    );

    observer.observe(image);

    return () => observer.disconnect();
  }, [isImageVisible]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState("submitting");

    const formData = new FormData(event.currentTarget);
    const payload = {
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      phone: phoneValue ?? "",
      email: formData.get("email"),
      restaurantName: formData.get("restaurantName"),
      message: formData.get("message"),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Contact form submission failed");
      }

      setSubmitState("success");
      formRef.current?.reset();
      setPhoneValue(undefined);
    } catch (error) {
      console.error(error);
      setSubmitState("error");
    }
  }

  return (
    <section
      id="contact"
      className="relative isolate overflow-hidden bg-[#061522] px-4 py-14 text-[#181B25] sm:py-16 lg:py-24"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(178,184,255,0.32),transparent_34%),linear-gradient(180deg,#061522_0%,#132441_52%,#727cda_100%)]" />

      <div className="container relative z-20 mx-auto lg:min-h-[720px]">
        <div className="relative z-20 w-full max-w-[690px] rounded-[22px] bg-[#FAFAFC] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.28)] sm:p-10 lg:ml-8 lg:p-12">
          <h2 className="text-center text-2xl font-bold leading-tight sm:text-3xl">
            {title}
          </h2>

          <form ref={formRef} onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <input
                name="firstName"
                required
                placeholder={fields.firstName}
                className="h-12 rounded-lg border border-[#CDD4E1] bg-white px-4 text-sm outline-none transition placeholder:text-[#6F717A] focus:border-[#6D52F0] focus:ring-2 focus:ring-[#6D52F0]/20 sm:text-base"
              />
              <input
                name="lastName"
                required
                placeholder={fields.lastName}
                className="h-12 rounded-lg border border-[#CDD4E1] bg-white px-4 text-sm outline-none transition placeholder:text-[#6F717A] focus:border-[#6D52F0] focus:ring-2 focus:ring-[#6D52F0]/20 sm:text-base"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <PhoneInput
                name="phone"
                value={phoneValue}
                onChange={setPhoneValue}
                defaultCountry="MK"
                international
                countryCallingCodeEditable={false}
                labels={phoneLabels}
                countrySelectComponent={ContactCountrySelect}
                placeholder={fields.phone}
                className="contact-phone-input h-12 rounded-lg border border-[#CDD4E1] bg-white px-4 text-sm transition focus-within:border-[#6D52F0] focus-within:ring-2 focus-within:ring-[#6D52F0]/20 sm:text-base"
              />
              <input
                name="email"
                type="email"
                required
                placeholder={fields.email}
                className="h-12 rounded-lg border border-[#CDD4E1] bg-white px-4 text-sm outline-none transition placeholder:text-[#6F717A] focus:border-[#6D52F0] focus:ring-2 focus:ring-[#6D52F0]/20 sm:text-base"
              />
            </div>

            <input
              name="restaurantName"
              required
              placeholder={fields.restaurantName}
              className="h-12 w-full rounded-lg border border-[#CDD4E1] bg-white px-4 text-sm outline-none transition placeholder:text-[#6F717A] focus:border-[#6D52F0] focus:ring-2 focus:ring-[#6D52F0]/20 sm:text-base"
            />

            <textarea
              name="message"
              placeholder={fields.message}
              rows={4}
              className="min-h-28 w-full resize-none rounded-lg border border-[#CDD4E1] bg-white px-4 py-3 text-sm outline-none transition placeholder:text-[#6F717A] focus:border-[#6D52F0] focus:ring-2 focus:ring-[#6D52F0]/20 sm:text-base"
            />

            <button
              type="submit"
              disabled={submitState === "submitting"}
              className="inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#6749EA] px-8 text-base font-bold text-white shadow-[0_18px_45px_rgba(103,73,234,0.34)] transition hover:bg-[#563AD8] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#6749EA]"
            >
              {submitState === "submitting" ? submittingLabel : submitLabel}
              <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
            </button>

            {submitState === "success" ? (
              <p className="text-center text-sm font-medium text-emerald-600">
                {successMessage}
              </p>
            ) : null}

            {submitState === "error" ? (
              <p className="text-center text-sm font-medium text-red-600">
                {errorMessage}
              </p>
            ) : null}
          </form>
        </div>
      </div>

      <div
        ref={imageRef}
        className={`${isImageVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"} pointer-events-none relative z-10 mx-auto h-[300px] max-w-[620px] px-4 transition-all duration-700 ease-out sm:h-[390px] lg:absolute lg:right-0 lg:top-24 lg:mx-0 lg:mt-0 lg:h-[760px] lg:max-w-none lg:px-0 xl:h-[800px]`}
      >
        <Image
          src={smartMenuContactScreen}
          alt={imageAlt}
          className="h-full w-full object-contain object-bottom"
          unoptimized
          quality={100}
          sizes="(min-width: 1280px) 1000px, (min-width: 1024px) 950px, 92vw"
        />
      </div>
    </section>
  );
}
