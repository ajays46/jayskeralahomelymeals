import { useState } from 'react';
import { isDemoMode } from './isDemoMode';
import DemoLoadButton from './DemoLoadButton';
import { getAdminUserGoldenScenarios } from './goldenData';

/**
 * Role picker + load button for admin user creation demo.
 */
export default function AdminGoldenDataLoader({ onLoad, variant = 'dark' }) {
  const scenarios = getAdminUserGoldenScenarios();
  const [selectedId, setSelectedId] = useState(
    scenarios[0]?.id ?? 'admin-role-store-manager'
  );

  if (!isDemoMode() || scenarios.length === 0) return null;

  const handleLoad = () => {
    onLoad(selectedId);
  };

  const selectClass =
    variant === 'dark'
      ? 'bg-gray-700 border-gray-600 text-white text-xs sm:text-sm'
      : 'bg-white border-gray-300 text-gray-800 text-xs sm:text-sm';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className={`rounded-lg border px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-[140px] ${selectClass}`}
        aria-label="Select demo role"
      >
        {scenarios.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      <DemoLoadButton variant={variant} label="Load demo data" onClick={handleLoad} />
    </div>
  );
}
