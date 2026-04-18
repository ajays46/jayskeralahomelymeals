import React, { useMemo } from 'react';
import useAuthStore from '../../stores/Zustand.store';
import { dbDayOfWeekFromDate, KITCHEN_MENU_KIND, useKitchenWeeklyRecipeBom } from '../../hooks/adminHook/kitchenStoreHook';
import { StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import StoreOperatorMealProgramsSection from '../store-operator/StoreOperatorMealProgramsSection.jsx';

/**
 * STORE_MANAGER–focused meal programs: create programs, map dishes, edit program BOM.
 * Dish search uses default veg menu context (same hook as Recipe / BOM; adjust there if needed).
 */
const StoreManagerMealProgramsPage = () => {
  const { user } = useAuthStore();
  const roleString = String(user?.role || '').toUpperCase();
  const roles = (Array.isArray(user?.roles) ? user.roles : roleString ? [roleString] : []).map((r) =>
    String(r).toUpperCase()
  );
  const canUseStoreKitchen =
    roles.includes('STORE_MANAGER') ||
    roleString === 'STORE_MANAGER' ||
    roles.includes('STORE_OPERATOR') ||
    roleString === 'STORE_OPERATOR';
  const isStoreManager = roles.includes('STORE_MANAGER') || roleString === 'STORE_MANAGER';

  const dayOfWeek = useMemo(() => dbDayOfWeekFromDate(new Date()), []);

  const { searchMenuCombos, searchInventoryItems } = useKitchenWeeklyRecipeBom({
    menuKind: KITCHEN_MENU_KIND.VEG,
    dayOfWeek,
    mealSlot: 'DINNER',
    scheduleReloadKey: 0,
    selectedMenuId: ''
  });

  if (!canUseStoreKitchen) {
    return (
      <StorePageShell>
        <StorePageHeader title="Kitchen meal creation" />
        <StoreSection title="Access" compact>
          <p className="text-sm text-slate-600">You need a store operator or store manager role to use kitchen meal creation.</p>
        </StoreSection>
      </StorePageShell>
    );
  }

  return (
    <StorePageShell>
      <StorePageHeader title="Kitchen meal creation" />

      <StoreOperatorMealProgramsSection
        canEditBomLines={canUseStoreKitchen}
        canCreateMealSets={isStoreManager}
        searchMenuCombos={searchMenuCombos}
        searchInventoryItems={searchInventoryItems}
      />
    </StorePageShell>
  );
};

export default StoreManagerMealProgramsPage;
