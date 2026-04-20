import React from 'react';
import PurchaseRequestCreateTabs from '@/components/store/PurchaseRequestCreateTabs';
import { StorePageShell } from '@/components/store/StorePageShell';

/** @feature kitchen-store — STORE_OPERATOR: weekly vs daily purchase requests from low stock / shopping list. */

const StoreOperatorPurchaseRequestPage = () => (
  <StorePageShell className="max-w-7xl">
    <PurchaseRequestCreateTabs showOperatorHeader singleKind={null} showCreateInventoryItem={false} />
  </StorePageShell>
);

export default StoreOperatorPurchaseRequestPage;
