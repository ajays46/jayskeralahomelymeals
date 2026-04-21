import React from 'react';
import InventoryItemMasterView from '@/components/store/InventoryItemMasterView';

/** @feature kitchen-store — STORE_OPERATOR: item master (shared view). */
const StoreOperatorItemMasterPage = () => (
  <InventoryItemMasterView idPrefix="item-master" hideDevCopy />
);

export default StoreOperatorItemMasterPage;
