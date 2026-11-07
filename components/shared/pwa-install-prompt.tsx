"use client";

import { useEffect, useState } from "react";
import { Download, Bell, BellRing, Smartphone, X, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function getIsDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem("pwa_prompt_dismissed") === "true";
}

function getIsInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function getInitialNotificationPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "default";
  return Notification.permission;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(getIsInstalled);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(getInitialNotificationPermission);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [dismissed, setDismissed] = useState(getIsDismissed);
  const [swRegistered, setSwRegistered] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ("serviceWorker" in navigator && process.env.NODE_ENV !== "test") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          setSwRegistered(true);
          console.log("PWA Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("Service Worker registration notice:", err);
        });
    }

    // Listen for BeforeInstallPrompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If iOS or unsupported browser, show polite guidance
      alert(
        "To install on iOS/Safari: Tap the 'Share' icon at the bottom of Safari, then select 'Add to Home Screen' (+)."
      );
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn("Install prompt error:", err);
    }
  };

  const handleNotificationToggle = async () => {
    if (!("Notification" in window)) {
      alert("Push notifications are not supported on this browser.");
      return;
    }

    setIsSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === "granted") {
        // Send a celebratory initial notification via service worker
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification("Abeokuta Polo Festival 2026", {
            body: "Notifications enabled! You will receive countdown alerts, match announcements, and offline pass updates.",
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-192x192.png",
          });
        }
      }
    } catch (err) {
      console.warn("Notification permission request error:", err);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("pwa_prompt_dismissed", "true");
    }
  };

  // If already installed and notifications granted, or dismissed, hide
  if (dismissed || (isInstalled && notificationPermission === "granted")) {
    return null;
  }

  return (
    <aside
      aria-label="Festival App Installation and Notification Prompt"
      className="fixed bottom-3 left-3 right-3 sm:bottom-4 sm:right-auto sm:left-6 max-w-[calc(100vw-1.5rem)] sm:max-w-md z-40 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="rounded-2xl border-2 border-gold/60 bg-forest-deep/95 p-3.5 sm:p-5 text-ivory shadow-2xl backdrop-blur-xl relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-ivory/60 hover:text-ivory p-1 rounded-md transition cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/20 text-gold border border-gold/40">
            <Smartphone className="size-5" />
          </div>

          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-gold text-forest font-bold text-[9px] uppercase px-1.5 py-0">
                PWA &amp; Offline Wallet
              </Badge>
              {swRegistered && (
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-0.5">
                  <ShieldCheck className="size-3" /> Offline Ready
                </span>
              )}
            </div>

            <h4 className="font-display text-sm font-semibold text-ivory leading-snug">
              Install Abeokuta Polo Festival App
            </h4>
            <p className="text-[11px] text-ivory/70 leading-relaxed">
              Fast 1-tap gate access, offline wallet pass storage, and live match countdown alerts.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-3.5 pt-3 border-t border-ivory/10 grid grid-cols-2 gap-2">
          {/* 1. Install App Action */}
          {!isInstalled ? (
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="bg-gold text-forest font-bold hover:bg-gold/90 text-xs shadow cursor-pointer h-9"
            >
              <Download className="mr-1.5 size-3.5" />
              Install App
            </Button>
          ) : (
            <Button
              size="sm"
              disabled
              variant="outline"
              className="border-emerald-500/50 text-emerald-400 text-xs h-9"
            >
              <Check className="mr-1.5 size-3.5" />
              App Installed
            </Button>
          )}

          {/* 2. Notification Toggle */}
          {notificationPermission === "granted" ? (
            <Button
              size="sm"
              disabled
              variant="outline"
              className="border-emerald-500/50 text-emerald-400 text-xs h-9"
            >
              <Check className="mr-1.5 size-3.5" />
              Alerts Active
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleNotificationToggle}
              disabled={isSubscribing}
              variant="outline"
              className="border-gold/40 bg-white/10 text-ivory hover:bg-white/20 text-xs cursor-pointer h-9 font-medium"
            >
              {notificationPermission === "denied" ? (
                <>
                  <Bell className="mr-1.5 size-3.5 text-muted-brand" />
                  Alerts Blocked
                </>
              ) : (
                <>
                  <BellRing className="mr-1.5 size-3.5 text-gold" />
                  Enable Alerts
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
