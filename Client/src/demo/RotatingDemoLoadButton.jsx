import { useState } from 'react';
import { isDemoMode } from './isDemoMode';
import DemoLoadButton from './DemoLoadButton';
import {
  getGoldenFormState,
} from './goldenData';

/**
 * Rotating demo load button — each click loads the next variant from the pool.
 */
export default function RotatingDemoLoadButton({
  scenarioId,
  onLoad,
  variant = 'default',
  className = '',
}) {
  const [variantIndex, setVariantIndex] = useState(0);

  if (!isDemoMode()) return null;

  const handleLoad = () => {
    const form = getGoldenFormState(scenarioId, { variantIndex });
    if (form) {
      onLoad(form, variantIndex);
      setVariantIndex((i) => i + 1);
    }
  };

  return (
    <DemoLoadButton
      variant={variant}
      label="Load demo data"
      onClick={handleLoad}
      className={className}
    />
  );
}
