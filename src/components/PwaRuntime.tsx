"use client";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaRuntime() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    let alive = true;
    let registration: ServiceWorkerRegistration | undefined;
    let installedWorker: ServiceWorker | null = null;
    const onStateChange = () => {
      if (alive && installedWorker?.state === "installed" && navigator.serviceWorker.controller) {
        setWaiting(installedWorker);
      }
    };
    const onUpdateFound = () => {
      installedWorker?.removeEventListener("statechange", onStateChange);
      installedWorker = registration?.installing ?? null;
      installedWorker?.addEventListener("statechange", onStateChange);
    };
    let refreshed = false;
    const onControllerChange = () => {
      if (!refreshed) {
        refreshed = true;
        window.location.reload();
      }
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
      navigator.serviceWorker.register("/sw.js").then((current) => {
        if (!alive) return;
        registration = current;
        if (current.waiting && navigator.serviceWorker.controller) setWaiting(current.waiting);
        current.addEventListener("updatefound", onUpdateFound);
      }).catch(() => {
        // The site remains functional without a service worker.
      });
    }
    return () => {
      alive = false;
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
      registration?.removeEventListener("updatefound", onUpdateFound);
      installedWorker?.removeEventListener("statechange", onStateChange);
    };
  }, []);

  if (!installPrompt && !waiting) return null;
  return (
    <div className="pwa-native-actions" role="status" aria-live="polite">
      {waiting ? (
        <>
          <span>A Carpur update is ready.</span>
          <button type="button" onClick={() => waiting.postMessage({ type: "SKIP_WAITING" })}>
            Update
          </button>
        </>
      ) : installPrompt ? (
        <>
          <span>Get the Carpur app experience.</span>
          <button type="button" onClick={() => {
            void installPrompt.prompt().then(() => installPrompt.userChoice).finally(() => setInstallPrompt(null));
          }}>
            Install
          </button>
        </>
      ) : null}
    </div>
  );
}
