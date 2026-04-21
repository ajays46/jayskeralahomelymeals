import React from 'react';
import InventoryItemMasterView from '@/components/store/InventoryItemMasterView';

/** @feature kitchen-store — STORE_MANAGER: item master with scroll/focus into edit on row Edit. */
const StoreManagerItemMasterPage = () => (
  <InventoryItemMasterView idPrefix="store-manager-item-master" focusEditSectionOnSelect />
);

export default StoreManagerItemMasterPage;
