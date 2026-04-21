/**
 * Mirrors backend env toggles from the Max Kitchen integration guide.
 * Set in `.env` (Vite): `VITE_INVENTORY_REQUIRE_ITEM_IMAGE`, `VITE_KITCHEN_PLAN_REQUIRE_APPROVAL`.
 */
export function kitchenInventoryRequireItemImage() {
  return String(import.meta.env.VITE_INVENTORY_REQUIRE_ITEM_IMAGE || '').toLowerCase() === 'true';
}

/**
 * When true (default): operator submits plan → manager approves → operator issues.
 * Set `VITE_KITCHEN_PLAN_REQUIRE_APPROVAL=false` to skip that workflow and allow issue from DRAFT without submit.
 */
export function kitchenPlanRequireApproval() {
  const raw = import.meta.env.VITE_KITCHEN_PLAN_REQUIRE_APPROVAL;
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return true;
  }
  return String(raw).toLowerCase() === 'true';
}

/**
 * Item Master “Add category” block. Hidden unless explicitly enabled.
 * Set `VITE_KITCHEN_INVENTORY_SHOW_ADD_CATEGORY=true` in `.env` (Vite) to show again.
 */
export function kitchenInventoryShowAddCategorySection() {
  return String(import.meta.env.VITE_KITCHEN_INVENTORY_SHOW_ADD_CATEGORY || '').toLowerCase() === 'true';
}
