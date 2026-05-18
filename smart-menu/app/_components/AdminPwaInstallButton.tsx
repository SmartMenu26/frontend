"use client";

import { Download, Info, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type AdminPwaInstallButtonProps = {
  labels: {
    install: string;
    iosHelp: string;
    browserHelp: string;
    close: string;
  };
};

const isRunningStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

const isIOSDevice = () =>
  /iPad|iPhone|iPod/.test(window.navigator.userAgent) &&
  !("MSStream" in window);

const subscribeToStandaloneMode = (onStoreChange: () => void) => {
  if (typeof window === "undefined") return () => {};

  const displayModeQuery = window.matchMedia("(display-mode: standalone)");
  displayModeQuery.addEventListener("change", onStoreChange);

  return () => {
    displayModeQuery.removeEventListener("change", onStoreChange);
  };
};

const getStandaloneSnapshot = () =>
  typeof window !== "undefined" ? isRunningStandalone() : false;

export default function AdminPwaInstallButton({
  labels,
}: AdminPwaInstallButtonProps) {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const isStandalone = useSyncExternalStore(
    subscribeToStandaloneMode,
    getStandaloneSnapshot,
    () => false
  );

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setShowHelp(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone) return null;

  const handleClick = async () => {
    if (!promptEvent) {
      setShowHelp((current) => !current);
      return;
    }

    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
      >
        <Download className="h-4 w-4" />
        {labels.install}
      </button>

      {showHelp ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-72 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-xl shadow-slate-950/10">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            <p className="leading-5">
              {isIOSDevice() ? labels.iosHelp : labels.browserHelp}
            </p>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              aria-label={labels.close}
              className="-mr-1 -mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
