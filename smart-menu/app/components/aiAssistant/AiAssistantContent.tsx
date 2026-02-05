"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import RestaurantHeader from "@/app/components/ui/RestaurantHeader";
import AiAssistantPromptPanel from "@/app/components/aiAssistant/AiAssistantPromptPanel";
import assistantIllustration from "@/public/images/ai-assistant-cook.png";
import assistantThinking from "@/public/images/ai-assistant-cook-thinking.png";
import menuItemPlaceholder from "@/public/images/menu-item-placeholder.png";

type Suggestion = {
  id: string;
  label: string;
  icon: string;
};

type Candidate = {
  _id?: string;
  name?: { mk?: string; sq?: string; en?: string } | string;
  description?: { mk?: string; sq?: string; en?: string } | string;
  image?: { url?: string };
};

type Props = {
  restaurantId: string;
  suggestionPrompts: Suggestion[];
  prompt: string;
  restaurantName?: string;
  assistantName?: string;
};

export default function AiAssistantContent({
  restaurantId,
  suggestionPrompts,
  prompt,
  restaurantName,
  assistantName,
}: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">(
    "idle"
  );
  const [assistantText, setAssistantText] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const handleResult = useCallback((payload?: any) => {
    const text =
      payload?.router?.assistantText ??
      payload?.data?.router?.assistantText ??
      "";
    const items =
      payload?.candidates ??
      payload?.data?.candidates ??
      payload?.data ??
      [];

    setAssistantText(text);
    setCandidates(Array.isArray(items) ? items : []);
  }, []);

  const assistantDisplayName = assistantName?.trim() || "Бакал";
  const restaurantDisplayName = restaurantName?.trim();
  const heroImage = status === "loading" ? assistantThinking : assistantIllustration;

  return (
    <div className="min-h-dvh bg-[#F5F5F5] text-[#1E1F24]">
      <RestaurantHeader showName={false} />
      <div className="mx-auto flex w-full max-w-md flex-col px-6">
        <header className="h-[10vh] flex items-center justify-between">
          <Link
            href={`/restaurant/${restaurantId}`}
            aria-label="Назад кон ресторанот"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#1E1F24] shadow-md transition hover:bg-[#f1f1f1]"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>

          <div className="h-10 w-10 rounded-full bg-transparent" />
        </header>

        <div className="pb-4 h-[95vh] text-center flex flex-col justify-around">
          {status === "idle" && (
            <p className="text-left text-[22px] leading-snug text-[#4B4F54]">
              Јас сум{" "}
              <span className="font-semibold text-[#1E1F24]">{assistantDisplayName}!</span>
              <br />
              Како можам да ви помогнам со изборот?
            </p>
          )}

          <div className="flex justify-center">
            <Image
              key={status === "loading" ? "thinking" : "regular"}
              src={heroImage}
              alt={`AI Асистент ${assistantDisplayName}`}
              priority
              className="h-auto w-60 max-w-full select-none transition-opacity duration-300"
            />
          </div>

          {status === "loading" && (
            <div className="mt-4 flex flex-col items-center gap-1 text-sm font-medium text-[#4B4F54]">
              <span className="text-md">Куварот размислува</span>
              <span className="flex items-center gap-1">
                {[0, 1, 2].map((idx) => (
                  <span
                    key={idx}
                    className="h-1.5 w-1.5 rounded-full bg-[#4B4F54] animate-bounce"
                    style={{ animationDelay: `${idx * 0.2}s` }}
                  />
                ))}
              </span>
            </div>
          )}

          {status !== "loading" && (assistantText || candidates.length) ? (
            <div className="mt-4 flex max-h-[40vh] flex-col gap-3 overflow-auto text-left">
              {assistantText ? (
                <p className="mt-6 rounded-2xl bg-[#F4F5F7] px-3 py-3 text-left text-sm text-[#4B4F54]">
                  {assistantText}
                </p>
              ) : null}

              {candidates.length > 0 ? (
                candidates.map((item) => {
                  const id = item?._id ?? "";
                  const title =
                    typeof item?.name === "string"
                      ? item.name
                      : item?.name?.mk ?? item?.name?.en ?? "Предлог";
                  const description =
                    typeof item?.description === "string"
                      ? item.description
                      : item?.description?.mk ??
                        item?.description?.en ??
                        "Пробај го овој специјалитет.";
                  const img = item?.image?.url ?? menuItemPlaceholder.src;

                  return (
                    <Link
                      key={id + title}
                      href={
                        id
                          ? `/restaurant/${restaurantId}/menuItem/${id}`
                          : `/restaurant/${restaurantId}`
                      }
                      className="flex items-center gap-3 rounded-[22px] border border-[#ECEFF5] bg-white px-3 py-3 text-[#1E1F24] shadow-sm transition hover:border-[#C2CADB]"
                    >
                      <Image
                        src={img}
                        alt={title}
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded-2xl object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#1E1F24]">
                          {title}
                        </p>
                        <p className="mt-1 text-xs text-[#6B7280] line-clamp-2">
                          {description}
                        </p>
                      </div>
                      <svg
                        className="h-4 w-4 text-[#4B4F54]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="7" y1="17" x2="17" y2="7" />
                        <polyline points="7 7 17 7 17 17" />
                      </svg>
                    </Link>
                  );
                })
              ) : (
                <p className="rounded-2xl border border-dashed border-[#C8CED8] bg-white/70 px-4 py-4 text-sm text-[#6B7280]">
                  Нема препораки за ова барање. Пробај да побараш конкретна храна или пијалок.
                </p>
              )}
            </div>
          ) : null}

          <AiAssistantPromptPanel
            suggestionPrompts={suggestionPrompts}
            initialMessage={prompt}
            restaurantId={restaurantId}
            restaurantName={restaurantDisplayName}
            onStatusChange={setStatus}
            onResult={handleResult}
          />
        </div>
      </div>
    </div>
  );
}
