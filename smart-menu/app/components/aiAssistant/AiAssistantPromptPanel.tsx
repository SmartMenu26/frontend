"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Info, Send } from "lucide-react";

type Suggestion = {
  id: string;
  label: string;
  icon: string;
};

type Props = {
  suggestionPrompts: Suggestion[];
  initialMessage?: string;
  restaurantId: string;
  restaurantName?: string;
  onStatusChange?: (status: "idle" | "loading" | "error" | "success") => void;
  onResult?: (payload: any) => void;
};

export default function AiAssistantPromptPanel({
  suggestionPrompts,
  initialMessage = "",
  restaurantId,
  restaurantName,
  onStatusChange,
  onResult,
}: Props) {
  const [message, setMessage] = useState(initialMessage);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastAutoPromptRef = useRef<string | null>(null);

  const submitPrompt = useCallback(
    async (payload: string) => {
      setStatus("loading");
      setErrorMessage(null);
      try {
        const res = await fetch("/api/ai/router", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            restaurantId,
            message: payload,
          }),
        });

        const json = await res.json().catch(() => null);

        if (!res.ok || !json?.ok) {
          throw new Error(json?.message ?? json?.error ?? "Не можам да одговорам сега.");
        }

        onResult?.(json);
        setStatus("success");
      } catch (err: any) {
        setErrorMessage(err?.message ?? "Не можам да одговорам сега.");
        setStatus("error");
      }
    },
    [restaurantId, onResult]
  );

  const sendPrompt = useCallback(
    async (overrideMessage?: string) => {
      const payload = (overrideMessage ?? message).trim();
      if (!payload) return;
      if (status === "loading" && !overrideMessage) return;
      await submitPrompt(payload);
      setMessage("");
    },
    [message, status, submitPrompt]
  );

  useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  useEffect(() => {
    const trimmed = initialMessage.trim();
    if (!trimmed) {
      lastAutoPromptRef.current = null;
      return;
    }

    if (lastAutoPromptRef.current === trimmed) return;
    lastAutoPromptRef.current = trimmed;

    setMessage(trimmed);
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
      setMessage(trimmed);
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
              className="cursor-pointer inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-2 py-1 text-[14px] font-medium tracking-wide text-[#656C73] shadow-sm transition hover:border-black/40 hover:text-[#1E1F24]"
            >
              <Image
                src={prompt.icon}
                alt=""
                width={14}
                height={14}
                className="opacity-80"
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
          placeholder="Напиши што ти се јаде..."
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
          aria-label="Испрати барање"
        >
          <Send
            size={20}
            color={message.trim() ? "#FFFFFF" : "#8E908F"}
            className={status === "loading" ? "animate-pulse" : ""}
          />
        </button>
      </form>

      <p className="mx-auto mt-4 flex w-fit items-center gap-1 text-[11px] text-[#7B7E86] italic text-center">
        <Info size={18} />
        {restaurantName
          ? `Препораките се базирани на менито на ${restaurantName}`
          : "Препораките се базирани на дигиталното мени."}
      </p>
    </div>
  );
}
