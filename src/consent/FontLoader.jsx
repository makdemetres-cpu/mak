import { useEffect } from 'react';
import { useConsent } from './useConsent';

const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600;1,700&family=Inter:wght@300;400;500;600&display=swap";

// Loads Google Fonts only after consent, since the CDN request sends the
// visitor's IP address to Google. Every font already has a system-font
// fallback in index.css, so the site renders fine either way.
export function FontLoader() {
  const { consent } = useConsent();
  const allowed = Boolean(consent?.categories?.fonts);

  useEffect(() => {
    if (!allowed) return;

    const preconnectGoogleapis = document.createElement('link');
    preconnectGoogleapis.rel = 'preconnect';
    preconnectGoogleapis.href = 'https://fonts.googleapis.com';

    const preconnectGstatic = document.createElement('link');
    preconnectGstatic.rel = 'preconnect';
    preconnectGstatic.href = 'https://fonts.gstatic.com';
    preconnectGstatic.crossOrigin = 'anonymous';

    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = FONTS_HREF;

    document.head.append(preconnectGoogleapis, preconnectGstatic, stylesheet);

    return () => {
      preconnectGoogleapis.remove();
      preconnectGstatic.remove();
      stylesheet.remove();
    };
  }, [allowed]);

  return null;
}
