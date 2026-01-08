"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // iOS detection (Safari + iOS)
    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    // installed detection
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    // Chrome/Edge install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone) return null;

  // ✅ Only show UI if:
  // - iOS (instructions)
  // - or Chrome prompt is available (real install)
  const shouldShow = isIOS || !!promptEvent;
  if (!shouldShow) return null;

  const onInstallClick = async () => {
    if (!promptEvent) return; // iOS has no prompt
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  return (
    <div className="fixed left-4 top-4 z-50 rounded-xl bg-black/80 p-4 text-white backdrop-blur">
      <div className="font-semibold">Install App</div>

      {promptEvent ? (
        <button
          onClick={onInstallClick}
          className="mt-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black"
        >
          Install
        </button>
      ) : null}

      {isIOS ? (
        <p className="mt-2 text-sm opacity-90">
          On iPhone/iPad: tap <b>Share</b> (⎋) then <b>Add to Home Screen</b> (➕).
        </p>
      ) : null}
    </div>
  );
}
