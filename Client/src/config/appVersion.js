import pkg from '../../package.json';

/**
 * Release label shown in the footer (and anywhere else you import this).
 *
 * Resolution order:
 * 1. `VITE_APP_VERSION` — set in CI/CD or `.env.production` (recommended for GitHub deploys).
 * 2. `package.json` `"version"` — bump with `npm version patch` (or minor/major) before release.
 *
 * GitHub Actions example (build step env):
 *   VITE_APP_VERSION: ${{ github.ref_name }}-${{ github.run_number }}
 * Or pin to git SHA:
 *   VITE_APP_VERSION: ${{ github.sha }}
 */
export const APP_VERSION =
  (typeof import.meta.env.VITE_APP_VERSION === 'string' && import.meta.env.VITE_APP_VERSION.trim()) ||
  pkg.version ||
  '0.0.0';
