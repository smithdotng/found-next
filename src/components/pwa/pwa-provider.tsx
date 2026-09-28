"use client";

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PwaState {
  canInstall: boolean;
  isStandalone: boolean;
  isIos: boolean;
  offline: boolean;
  install: () => Promise<void>;
}

const PwaContext = createContext<PwaState>({
  canInstall: false,
  isStandalone: false,
  isIos: false,
  offline: false,
  install: async () => {},
});

export const usePwa = () => useContext(PwaContext);

const noop = () => () => {};
const subscribeOnline = (cb: () => void) => {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
};
const subscribeDisplay = (cb: () => void) => {
  const mq = window.matchMedia("(display-mode: standalone)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const offline = useSyncExternalStore(subscribeOnline, () => !navigator.onLine, () => false);
  const standalone = useSyncExternalStore(
    subscribeDisplay,
    () => window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true,
    () => false,
  );
  const isIos = useSyncExternalStore(noop, () => /iphone|ipad|ipod/i.test(navigator.userAgent), () => false);
  const isStandalone = standalone || installed;

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setInstalled(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => null);
    setDeferred(null);
  }, [deferred]);

  return (
    <PwaContext.Provider value={{ canInstall: !!deferred, isStandalone, isIos, offline, install }}>
      {offline ? (
        <div
          role="status"
          className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-ink px-4 py-2 text-xs font-medium text-white animate-fade-in"
        >
          <WifiOff className="size-3.5" aria-hidden />
          You&apos;re offline. Pages you&apos;ve visited are still available.
        </div>
      ) : null}
      {children}
    </PwaContext.Provider>
  );
}
