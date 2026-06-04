import adminCreateUsers from './golden/admin-create-users.json';
import sellerCreateCustomer from './golden/seller-create-customer.json';
import placeOrderAddress from './golden/place-order-address.json';

const ADMIN_SCENARIOS = Object.fromEntries(
  (adminCreateUsers.scenarios || []).map((s) => [s.id, s])
);

const SCENARIOS = {
  ...ADMIN_SCENARIOS,
  'seller-create-customer': sellerCreateCustomer,
  'place-order-address': placeOrderAddress,
};

/** @deprecated use getAdminUserGoldenScenarios() */
export const DEFAULT_ADMIN_USER_SCENARIO = 'admin-role-store-manager';

/**
 * All admin user creation golden scenarios (one per role).
 */
export function getAdminUserGoldenScenarios() {
  return adminCreateUsers.scenarios || [];
}

/**
 * Returns form state for a golden-data scenario, with optional runtime overrides.
 * @param {string} scenarioId
 * @param {{ companyId?: string }} runtime
 */
export function getGoldenFormState(scenarioId, runtime = {}) {
  const scenario = SCENARIOS[scenarioId];
  if (!scenario?.formState) return null;

  const form = { ...scenario.formState };

  const resolveConfig = scenario.resolveAtRuntime || adminCreateUsers.resolveAtRuntime;
  if (
    resolveConfig?.companyId === 'tenantCompanyId' &&
    runtime.companyId
  ) {
    form.companyId = runtime.companyId;
  }

  return form;
}

export function getGoldenScenario(scenarioId) {
  return SCENARIOS[scenarioId] ?? null;
}
