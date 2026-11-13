import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    deferredPrompt: BeforeInstallPromptEvent | null;
  }
}

export type PlatformType = 'android' | 'ios' | 'desktop';
export type InstallOutcome =
  | 'accepted'
  | 'dismissed'
  | 'in-app-browser'
  | 'iframe-preview'
  | 'ios-manual'
  | 'desktop-android-manual'
  | 'already-installed';

export function detectPWAPlatform() {
  if (typeof navigator === 'undefined') {
    return { platform: 'desktop' as PlatformType, isIOS: false, isAndroid: false, isInAppBrowser: false };
  }
  const ua = navigator.userAgent || '';
  const isInAppBrowser = /WhatsApp|FBAN|FBAV|FB_IAB|Instagram|Messenger|Line|MicroMessenger|wv\)/i.test(ua);
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || isIPadOS;
  const isAndroid = /Android/i.test(ua);
  const platform: PlatformType = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';
  return { platform, isIOS, isAndroid, isInAppBrowser };
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.deferredPrompt) {
      return window.deferredPrompt;
    }
    return null;
  });

  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<PlatformType>(() => detectPWAPlatform().platform);
  const [isInAppBrowser, setIsInAppBrowser] = useState<boolean>(() => detectPWAPlatform().isInAppBrowser);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const detected = detectPWAPlatform();
    setPlatform(detected.platform);
    setIsInAppBrowser(detected.isInAppBrowser);

    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
    }

    const handlePromptReady = () => {
      if (window.deferredPrompt) {
        setDeferredPrompt(window.deferredPrompt);
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      // Save beforeinstallprompt and prevent its automatic mini-infobar
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.deferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-ready', handlePromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-installed', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-installed', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<InstallOutcome> => {
    const { isIOS, isInAppBrowser: inAppNow } = detectPWAPlatform();

    if (isInstalled) {
      return 'already-installed';
    }

    // 1. If opened inside WhatsApp / Facebook in-app browser, prompt to open in Chrome
    if (inAppNow) {
      return 'in-app-browser';
    }

    // 2. If native beforeinstallprompt is ready (Desktop Chrome/Edge & Android Chrome), execute prompt() directly!
    const promptEvent =
      deferredPrompt || (typeof window !== 'undefined' ? window.deferredPrompt : null);

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        setDeferredPrompt(null);
        if (typeof window !== 'undefined') {
          window.deferredPrompt = null;
        }
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          return 'accepted';
        }
        return 'dismissed';
      } catch (err) {
        console.warn('PWA install prompt error:', err);
      }
    }

    // 3. ONLY show iPhone Share instruction if device is ACTUALLY iPhone/iPad!
    if (isIOS) {
      return 'ios-manual';
    }

    // 4. If running inside an embedded preview iframe, tell user to open the standalone published link directly
    const isInIframe =
      typeof window !== 'undefined' &&
      (() => {
        try {
          return window.self !== window.top;
        } catch {
          return true;
        }
      })();
    if (isInIframe) {
      return 'iframe-preview';
    }

    // 5. Laptop/Desktop or Android when prompt is unavailable (never show iPhone message!)
    return 'desktop-android-manual';
  };

  return {
    isInstallable: Boolean(deferredPrompt || (typeof window !== 'undefined' && window.deferredPrompt)),
    isInstalled,
    isIOS: platform === 'ios',
    isAndroid: platform === 'android',
    isInAppBrowser,
    platform,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
