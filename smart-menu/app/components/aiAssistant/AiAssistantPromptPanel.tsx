"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Info, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n";

export type AiAssistantRouterResponse<TCandidate = unknown> = {
  ok?: boolean;
  message?: string;
  error?: string;
  router?: {
    assistantText?: string;
    language?: Locale;
  };
  data?:
    | {
        router?: { assistantText?: string; language?: Locale };
        candidates?: TCandidate[];
      }
    | TCandidate[];
  candidates?: TCandidate[];
};

type Suggestion = {
  id: string;
  label: string;
  icon: string;
};

type Props<TCandidate = unknown> = {
  suggestionPrompts: Suggestion[];
  initialMessage?: string;
  restaurantId: string;
  restaurantName?: string;
  onStatusChange?: (status: "idle" | "loading" | "error" | "success") => void;
  onResult?: (payload: AiAssistantRouterResponse<TCandidate>) => void;
  onPromptPending?: (message: string) => void;
  onPromptSettled?: () => void;
};

export default function AiAssistantPromptPanel<TCandidate = unknown>({
  suggestionPrompts,
  initialMessage = "",
  restaurantId,
  restaurantName,
  onStatusChange,
  onResult,
  onPromptPending,
  onPromptSettled,
}: Props<TCandidate>) {
  const t = useTranslations("aiAssistantPromptPanel");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastAutoPromptRef = useRef<string | null>(null);
  const defaultErrorMessage = t("errors.generic");

  const submitPrompt = useCallback(
    async (payload: string) => {
      setStatus("loading");
      setErrorMessage(null);
      onPromptPending?.(payload);
      try {
        const res = await fetch("/api/ai/router", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            restaurantId,
            message: payload,
          }),
        });

        const json = (await res.json().catch(() => null)) as
          | AiAssistantRouterResponse<TCandidate>
          | null;

        if (!res.ok || !json || !json.ok) {
          throw new Error(json?.message ?? json?.error ?? defaultErrorMessage);
        }

        onResult?.(json);
        setStatus("success");
      } catch (err: unknown) {
        const fallbackError =
          err instanceof Error ? err.message : defaultErrorMessage;
        setErrorMessage(fallbackError);
        setStatus("error");
      } finally {
        onPromptSettled?.();
      }
    },
    [restaurantId, onResult, onPromptPending, onPromptSettled, defaultErrorMessage]
  );

  const sendPrompt = useCallback(
    async (overrideMessage?: string) => {
      const payload = (overrideMessage ?? message).trim();
      if (!payload) return;
      if (status === "loading" && !overrideMessage) return;
      setMessage("");
      await submitPrompt(payload);
    },
    [message, status, submitPrompt]
  );

  useEffect(() => {
    const trimmed = initialMessage.trim();
    if (!trimmed) {
      lastAutoPromptRef.current = null;
      return;
    }

    if (lastAutoPromptRef.current === trimmed) return;
    lastAutoPromptRef.current = trimmed;

    submitPrompt(trimmed)
      .catch(() => {})
      .finally(() => {
        setMessage("");
      });
  }, [initialMessage, submitPrompt]);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  const handleSuggestionClick = useCallback(
    (label: string) => {
      const trimmed = label.trim();
      if (trimmed) {
        sendPrompt(trimmed).catch(() => {});
      }
    },
    [sendPrompt]
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendPrompt().catch(() => {});
  };

  return (
    <div>
      {status === "idle" && (
        <div className="mt-8 flex flex-wrap justify-center gap-1.5 rounded-3xl bg-white/60 p-2 shadow-[0_0_12px_-4px_rgba(63,93,80,0.35)]">
          {suggestionPrompts.map((prompt) => (
            <button
              key={prompt.id}
              type="button"
              onClick={() => handleSuggestionClick(prompt.label)}
              className="cursor-pointer inline-flex items-center gap-1 rounded-full border border-black/30 bg-white px-2 py-1 text-[14px] font-medium tracking-wide text-[#656C73] shadow-sm transition hover:border-black/40 hover:text-[#1E1F24]"
            >
              <Image
                src={prompt.icon}
                alt=""
                width={14}
                height={14}
                sizes="14px"
                className="opacity-80"
                loading="lazy"
              />
              {prompt.label}
            </button>
          ))}
        </div>
      )}

      <form
        className="mt-4 flex items-center gap-3 rounded-2xl bg-white/60 p-3 text-left shadow-[0_0_12px_-4px_rgba(63,93,80,0.35)]"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          placeholder={t("input.placeholder")}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              sendPrompt().catch(() => {});
            }
          }}
          className="flex-1 bg-transparent px-2 text-[15px] text-[#1E1F24] placeholder:text-[#7B7E86] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!message.trim() || status === "loading"}
          className={
            message.trim()
              ? "inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#3F5D50] text-white transition hover:bg-[#2b3f35]"
              : "inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#8E908F80] text-[#8E908F] transition"
          }
          aria-label={t("input.sendAriaLabel")}
        >
          <Send
            size={20}
            color={message.trim() ? "#FFFFFF" : "#8E908F"}
            className={status === "loading" ? "animate-pulse" : ""}
          />
        </button>
      </form>

      {status === "error" && errorMessage ? (
        <p className="mt-2 text-center text-xs font-medium text-red-500">{errorMessage}</p>
      ) : null}

      <p className="mx-auto mt-4 flex w-fit items-center gap-1 text-[11px] text-[#7B7E86] italic text-center">
        <Info size={18} />
        {restaurantName
          ? t("info.withRestaurant", { restaurantName })
          : t("info.generic")}
      </p>
    </div>
  );
}
