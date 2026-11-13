/**
 * PWA Dynamic Icon & Branding Synchronizer
 * Ensures the app icon matches the inside academy logo uploaded in Settings,
 * or reverts to the gold 'ف' symbol in emerald circle.
 */

export const PUBLISHED_APP_URL = 'https://al-furqan-e11b7.web.app';

export function syncAppIcon(logoDataUrl?: string) {
  try {
    const faviconLink = document.getElementById('dynamic-favicon') as HTMLLinkElement | null;
    const appleIconLink = document.getElementById('dynamic-apple-icon') as HTMLLinkElement | null;

    if (logoDataUrl && logoDataUrl.startsWith('data:image')) {
      if (faviconLink) {
        faviconLink.href = logoDataUrl;
      }
      if (appleIconLink) {
        appleIconLink.href = logoDataUrl;
      }

      // Update manifest link dynamically so home screen install grabs the custom logo
      updateDynamicManifest(logoDataUrl);
    } else {
      // Revert to default gold 'ف' Academy emblem
      if (faviconLink) {
        faviconLink.href = '/icon-192.png';
      }
      if (appleIconLink) {
        appleIconLink.href = '/apple-touch-icon.png';
      }
      resetManifestToDefault();
    }
  } catch (err) {
    console.warn('Error synchronizing dynamic app icon:', err);
  }
}

function updateDynamicManifest(customIconDataUrl: string) {
  const startUrl = `${PUBLISHED_APP_URL}/`;

  const dynamicManifest = {
    id: startUrl,
    name: 'الأكاديمية',
    short_name: 'الأكاديمية',
    description: 'الأكاديمية - نظام الإدارة والمتابعة الشامل لتحفيظ القرآن الكريم',
    theme_color: '#0B3D2E',
    background_color: '#0B3D2E',
    display: 'standalone',
    dir: 'rtl',
    lang: 'ar',
    start_url: startUrl,
    scope: startUrl,
    icons: [
      {
        src: customIconDataUrl,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: customIconDataUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: customIconDataUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };

  const stringManifest = JSON.stringify(dynamicManifest);
  const blob = new Blob([stringManifest], { type: 'application/json' });
  const manifestURL = URL.createObjectURL(blob);

  let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
  if (!manifestLink) {
    manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    document.head.appendChild(manifestLink);
  }
  manifestLink.href = manifestURL;
}

function resetManifestToDefault() {
  const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
  if (manifestLink && manifestLink.getAttribute('href') !== '/manifest.json') {
    manifestLink.href = '/manifest.json';
  }
}
