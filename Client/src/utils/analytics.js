const GA_MEASUREMENT_ID = String(import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();

let gaInitialized = false;
let gaScriptPromise = null;
let lastTrackedPage = '';

const hasWindow = typeof window !== 'undefined';

function canUseGa() {
  return hasWindow && Boolean(GA_MEASUREMENT_ID);
}

function getCurrentPagePath() {
  if (!hasWindow) return '/';
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function ensureGtagScript() {
  if (!canUseGa()) return Promise.resolve(false);
  if (window.gtag) return Promise.resolve(true);
  if (gaScriptPromise) return gaScriptPromise;

  const existing = document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`);
  if (existing) {
    gaScriptPromise = Promise.resolve(true);
    return gaScriptPromise;
  }

  gaScriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return gaScriptPromise;
}

export async function initGoogleAnalytics() {
  if (!canUseGa()) return false;
  if (gaInitialized && window.gtag) return true;

  const loaded = await ensureGtagScript();
  if (!loaded) return false;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer.push(arguments);
    };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
  });

  gaInitialized = true;
  return true;
}

export async function trackPageView(path = getCurrentPagePath()) {
  if (!canUseGa()) return;
  const normalizedPath = String(path || '/');
  if (normalizedPath === lastTrackedPage) return;

  const ready = await initGoogleAnalytics();
  if (!ready || !window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: normalizedPath,
    page_location: window.location.href,
    page_title: document.title,
  });
  lastTrackedPage = normalizedPath;
}

export function trackGaEvent(eventName, params = {}) {
  if (!canUseGa() || !window.gtag || !eventName) return;
  window.gtag('event', eventName, params);
}

export { GA_MEASUREMENT_ID };
