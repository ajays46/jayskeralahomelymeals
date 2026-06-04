/** True when demo-only UI (e.g. Load demo data buttons) should appear. */
export function isDemoMode() {
  return import.meta.env.VITE_DEMO_MODE === 'true';
}
