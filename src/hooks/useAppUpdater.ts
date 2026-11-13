import { useCallback, useEffect, useState } from 'react';

declare const __APP_VERSION__: string;

export type UpdateStatus = 'idle' | 'checking' | 'updating' | 'up-to-date';

export function useAppUpdater() {
  const [hasUpdateAvailable, setHasUpdateAvailable] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [updateMessage, setUpdateMessage] = useState('');

  const currentVersion =
    typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

  const checkRemoteVersion = useCallback(async (): Promise<boolean> => {
    try {
      // 1. Check /version.json bypassing all caches
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.version && data.version !== currentVersion) {
          return true;
        }
      }
    } catch {
      // Offline or transient network error — fallback to SW check below
    }

    // 2. Check Service Worker registration waiting / updatefound state
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update().catch(() => {});
          if (reg.waiting) {
            return true;
          }
        }
      }
    } catch {
      // ignore
    }

    return false;
  }, [currentVersion]);

  // Background check on mount, window focus, visibilitychange, and every 60s
  useEffect(() => {
    let isMounted = true;

    const runBackgroundCheck = async () => {
      const found = await checkRemoteVersion();
      if (found && isMounted) {
        setHasUpdateAvailable(true);
      }
    };

    // Listen to Service Worker waiting/installing lifecycle
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        if (reg.waiting && navigator.serviceWorker.controller) {
          if (isMounted) setHasUpdateAvailable(true);
        }
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller &&
              isMounted
            ) {
              setHasUpdateAvailable(true);
            }
          });
        });
      }).catch(() => {});
    }

    // Delay first check slightly so initial load finishes smoothly
    const initTimer = setTimeout(runBackgroundCheck, 2500);
    const intervalId = setInterval(runBackgroundCheck, 60 * 1000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runBackgroundCheck();
      }
    };
    const onFocus = () => runBackgroundCheck();

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);

    return () => {
      isMounted = false;
      clearTimeout(initTimer);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
    };
  }, [checkRemoteVersion]);

  const applyUpdateReload = useCallback(async () => {
    setUpdateStatus('updating');
    setUpdateMessage('فيه تحديث جديد، جاري تحديث التطبيق...');

    try {
      // Clear all old caches so fresh bundle & index.html load cleanly
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }

      // Activate waiting Service Worker if present
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    } catch (err) {
      console.warn('Cache/SW cleanup warning during update:', err);
    }

    setTimeout(() => {
      window.location.reload();
    }, 900);
  }, []);

  const checkAndUpdateNow = useCallback(async () => {
    setUpdateStatus('checking');
    setUpdateMessage('جاري فحص التحديثات...');

    const found = await checkRemoteVersion();
    if (found || hasUpdateAvailable) {
      await applyUpdateReload();
    } else {
      setUpdateStatus('up-to-date');
      setUpdateMessage('التطبيق محدث لآخر نسخة');
    }
  }, [checkRemoteVersion, hasUpdateAvailable, applyUpdateReload]);

  const dismissUpdateMessage = useCallback(() => {
    setUpdateStatus('idle');
    setUpdateMessage('');
  }, []);

  return {
    hasUpdateAvailable,
    updateStatus,
    updateMessage,
    checkAndUpdateNow,
    applyUpdateReload,
    dismissUpdateMessage,
    currentVersion,
  };
}
