"use client";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const INSTALL_NUDGE_STORAGE_KEY = "install-nudge-dismissed-v1";

export default function InstallAppButton() {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(true);
  const [showNudge, setShowNudge] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const ios =
      /iPad|iPhone|iPod/.test(window.navigator.userAgent) &&
      !(window as any).MSStream;

    setIsStandalone(standalone);
    setIsIOS(ios);

    let dismissed = false;
    try {
      dismissed =
        window.localStorage.getItem(INSTALL_NUDGE_STORAGE_KEY) === "true";
    } catch {
      dismissed = false;
    }
    setNudgeDismissed(dismissed);

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (nudgeDismissed || isStandalone) {
      setShowNudge(false);
      return;
    }

    setShowNudge(true);
  }, [nudgeDismissed, isStandalone]);

  const dismissNudge = () => {
    setShowNudge(false);
    setNudgeDismissed(true);
    try {
      window.localStorage.setItem(INSTALL_NUDGE_STORAGE_KEY, "true");
    } catch {
      // ignore storage errors (private mode blocks localStorage)
    }
  };

  const onClick = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
    dismissNudge();
  };

  return (
    <>
      {showNudge && (
        <div
          className="flex justify-center fixed left-1/2 top-4 z-[70] w-[calc(100%-24px)] max-w-[640px] -translate-x-1/2"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
          aria-live="polite"
        >
          <div className="w-fit flex items-center justify-between gap-4 rounded-2xl bg-[#363638] px-3 py-2 text-white shadow-[0_15px_35px_rgba(0,0,0,0.45)]">
            {/* message */}
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium leading-snug text-white/90">
                Download Smart Menu
              </p>
            </div>

            {/* action */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={promptEvent ? onClick : dismissNudge}
                className="text-[16px] font-normal text-[#8AB4F8] active:opacity-70 ml-2 mr-1"
              >
                {promptEvent ? "Install" : "OK"}
              </button>

              <button
                type="button"
                onClick={dismissNudge}
                aria-label="Dismiss"
                className="grid h-7 w-7 place-items-center rounded-full text-white/70 active:bg-white/10"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
