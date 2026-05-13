/**
 * Real-user metrics for the first load (and later interactions) in milliseconds
 * where applicable. Enable in dev automatically, or in production with
 * VITE_REPORT_WEB_VITALS=true (logs to console; wire to analytics if needed).
 *
 * Reference targets (Google Core Web Vitals — "good" thresholds):
 * - TTFB:  < 800 ms
 * - FCP:   < 1800 ms
 * - LCP:   < 2500 ms  (stricter "sub-second" LCP is ~< 1000 ms, uncommon for heavy SPAs)
 * - INP:   < 200 ms
 * - CLS:   < 0.1 (unitless score, not ms)
 */
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

const enabled =
  import.meta.env.DEV || import.meta.env.VITE_REPORT_WEB_VITALS === 'true';

function logMetric(metric) {
  if (metric.name === 'CLS') {
    console.info(
      `[Web Vitals] ${metric.name}: ${metric.value.toFixed(4)} (${metric.rating})`,
    );
    return;
  }
  console.info(
    `[Web Vitals] ${metric.name}: ${metric.value.toFixed(1)} ms (${metric.rating})`,
  );
}

function logNavigationSummary() {
  const nav = performance.getEntriesByType('navigation')[0];
  if (!nav) return;
  const n = /** @type {PerformanceNavigationTiming} */ (nav);
  const ms = (t) => Math.max(0, Math.round(t));
  console.info('[Web Vitals] Navigation timing (ms from fetch start):', {
    TTFB: ms(n.responseStart - n.fetchStart),
    domInteractive: ms(n.domInteractive - n.fetchStart),
    domContentLoaded: ms(n.domContentLoadedEventEnd - n.fetchStart),
    loadComplete: ms(n.loadEventEnd - n.fetchStart),
  });
}

export function reportWebVitals() {
  if (!enabled || typeof window === 'undefined') return;

  onTTFB(logMetric);
  onFCP(logMetric);
  onLCP(logMetric);
  onCLS(logMetric);
  onINP(logMetric);

  window.addEventListener('load', logNavigationSummary, { once: true });
}
