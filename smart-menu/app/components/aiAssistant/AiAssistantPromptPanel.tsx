"use client";

import { useState } from "react";
import Image from "next/image";
import { Info, Send } from "lucide-react";

type Suggestion = {
  id: string;
  label: string;
  icon: string;
};

type Props = {
  suggestionPrompts: Suggestion[];
};

export default function AiAssistantPromptPanel({ suggestionPrompts }: Props) {
  const [message, setMessage] = useState("");

  const handleSuggestionClick = (label: string) => {
    setMessage(label);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) return;
    // Placeholder: integrate with AI assistant action
    console.log("AI prompt:", message.trim());
  };

  return (
    <div>
      <div className="mt-8 flex flex-wrap justify-center gap-3 rounded-3xl bg-white/60 p-2 shadow-[0_0_12px_-4px_rgba(63,93,80,0.35)]">
        {suggestionPrompts.map((prompt) => (
          <button
            key={prompt.id}
            type="button"
            onClick={() => handleSuggestionClick(prompt.label)}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-2 py-1 text-[10px] font-medium tracking-wide text-[#656C73] shadow-sm transition hover:border-black/40 hover:text-[#1E1F24]"
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

      <form
        className="mt-4 flex items-center gap-3 rounded-2xl bg-white/60 p-1 text-left shadow-[0_0_12px_-4px_rgba(63,93,80,0.35)]"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          placeholder="Напиши што ти се јаде..."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="flex-1 bg-transparent px-2 text-xs text-[#1E1F24] placeholder:text-[#7B7E86] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!message.trim()}
          className={
            message.trim()
              ? "inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#8E908F] text-white transition hover:bg-[#7b7d7c]"
              : "inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#8E908F80] text-[#8E908F] transition"
          }
          aria-label="Испрати барање"
        >
          <Send size={16} color={message.trim() ? "#FFFFFF" : "#8E908F"} />
        </button>
      </form>

      <p className="mx-auto mt-4 flex w-fit items-center gap-1 text-[11px] text-[#7B7E86] italic">
        <Info size={18} />
        Препораките се базирани на менито на Бакал
      </p>
    </div>
  );
}
