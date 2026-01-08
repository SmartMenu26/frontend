"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallAppButton() {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault(); // allow custom button
      setPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Only show button when browser says it's installable
  if (!promptEvent) return null;

  const onClick = async () => {
    await promptEvent.prompt();
    await promptEvent.userChoice; // optional: accepted/dismissed
    setPromptEvent(null); // hide after prompt
  };

  return (
    <button
      onClick={onClick}
      className="cursor-pointer rounded-xl bg-black px-4 py-2 font-semibold text-white"
    >
      Install App
    </button>
  );
}