import adminCreateUsers from './golden/admin-create-users.json';
import sellerCreateCustomer from './golden/seller-create-customer.json';
import placeOrderAddress from './golden/place-order-address.json';
import personPool from './golden/person-pool.json';
import addressPool from './golden/address-pool.json';

const ADMIN_SCENARIOS = Object.fromEntries(
  (adminCreateUsers.scenarios || []).map((s) => [s.id, s])
);

const SCENARIOS = {
  ...ADMIN_SCENARIOS,
  'seller-create-customer': sellerCreateCustomer,
  'place-order-address': placeOrderAddress,
};

const PEOPLE = personPool.people || [];
const ADDRESSES = addressPool.addresses || [];
const DEMO_PASSWORD = adminCreateUsers.defaultPassword || 'Demo@1234';

export const DEFAULT_ADMIN_USER_SCENARIO = 'admin-role-store-manager';

export function getAdminUserGoldenScenarios() {
  return adminCreateUsers.scenarios || [];
}

function pickFromPool(pool, variantIndex) {
  if (!pool.length) return null;
  const index = ((variantIndex ?? 0) % pool.length + pool.length) % pool.length;
  return { item: pool[index], index, total: pool.length };
}

function applyCompanyId(form, resolveConfig, companyId) {
  if (resolveConfig?.companyId === 'tenantCompanyId' && companyId) {
    form.companyId = companyId;
  }
  return form;
}

function buildAdminFormState(scenarioId, variantIndex, companyId) {
  const scenario = ADMIN_SCENARIOS[scenarioId];
  if (!scenario?.formState?.roles) return null;

  const { item: person } = pickFromPool(PEOPLE, variantIndex);
  if (!person) return null;

  const form = {
    email: person.email,
    phone: person.phone,
    password: DEMO_PASSWORD,
    confirmPassword: DEMO_PASSWORD,
    role: '',
    roles: [...scenario.formState.roles],
    companyId: '',
    firstName: person.firstName,
    lastName: person.lastName,
  };

  return applyCompanyId(form, adminCreateUsers.resolveAtRuntime, companyId);
}

function buildSellerFormState(variantIndex) {
  const { item: person } = pickFromPool(PEOPLE, variantIndex);
  const { item: address } = pickFromPool(ADDRESSES, variantIndex);
  if (!person || !address) return null;

  return {
    firstName: person.firstName,
    lastName: person.lastName,
    phoneNumber: person.phone,
    street: address.street,
    housename: address.housename,
    city: address.city,
    pincode: address.pincode,
  };
}

function buildAddressFormState(variantIndex) {
  const { item: address } = pickFromPool(ADDRESSES, variantIndex);
  if (!address) return null;

  return {
    street: address.street,
    housename: address.housename,
    city: address.city,
    pincode: address.pincode,
    geoLocation: '',
    googleMapsUrl: '',
    addressType: address.addressType || 'HOME',
  };
}

/**
 * How many unique records rotate for a scenario (wraps after this count).
 */
export function getGoldenVariantCount(scenarioId) {
  if (ADMIN_SCENARIOS[scenarioId]) return PEOPLE.length;
  if (scenarioId === 'seller-create-customer') return PEOPLE.length;
  if (scenarioId === 'place-order-address') return ADDRESSES.length;
  return 1;
}

/**
 * Human-readable label for the variant about to load (1-based display).
 */
export function getGoldenVariantLabel(scenarioId, variantIndex) {
  const total = getGoldenVariantCount(scenarioId);
  const displayIndex = ((variantIndex ?? 0) % total) + 1;
  return `${displayIndex} of ${total}`;
}

/**
 * Returns form state for a golden-data scenario.
 * @param {string} scenarioId
 * @param {{ companyId?: string, variantIndex?: number }} runtime
 */
export function getGoldenFormState(scenarioId, runtime = {}) {
  const { companyId, variantIndex = 0 } = runtime;

  if (ADMIN_SCENARIOS[scenarioId]) {
    return buildAdminFormState(scenarioId, variantIndex, companyId);
  }

  if (scenarioId === 'seller-create-customer') {
    return buildSellerFormState(variantIndex);
  }

  if (scenarioId === 'place-order-address') {
    return buildAddressFormState(variantIndex);
  }

  const scenario = SCENARIOS[scenarioId];
  if (!scenario?.formState) return null;

  const form = { ...scenario.formState };
  return applyCompanyId(
    form,
    scenario.resolveAtRuntime || adminCreateUsers.resolveAtRuntime,
    companyId
  );
}

export function getGoldenScenario(scenarioId) {
  return SCENARIOS[scenarioId] ?? null;
}
