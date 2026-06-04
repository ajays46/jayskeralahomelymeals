import { isDemoMode } from './isDemoMode';

/**
 * Demo-only button that loads golden data into a form. Hidden unless VITE_DEMO_MODE=true.
 */
export default function DemoLoadButton({
  label = 'Load demo data',
  onClick,
  className = '',
  variant = 'default',
}) {
  if (!isDemoMode()) return null;

  const base =
    variant === 'dark'
      ? 'border-amber-500/60 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
      : 'border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm ${base} ${className}`}
    >
      {label}
    </button>
  );
}
