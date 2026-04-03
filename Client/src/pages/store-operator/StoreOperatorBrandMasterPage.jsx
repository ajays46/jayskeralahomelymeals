import React from 'react';
import { StorePageShell, StoreStatCard, StoreStatGrid } from '@/components/store/StorePageShell';
import { CreateBrandSection } from '@/components/store/CreateBrandSection';
import { useKitchenInventoryMock } from '../../hooks/adminHook/kitchenStoreHook';

/** @feature kitchen-store — STORE_OPERATOR: brand master (create brand, logo upload). */
const StoreOperatorBrandMasterPage = () => {
  const { brands, createBrand, uploadBrandLogo } = useKitchenInventoryMock();

  return (
    <StorePageShell>
      <StoreStatGrid>
        <StoreStatCard label="Total Brands" value={brands.length} tone="violet" />
      </StoreStatGrid>
      <CreateBrandSection
        idPrefix="brand-master"
        brands={brands}
        createBrand={createBrand}
        uploadBrandLogo={uploadBrandLogo}
      />
    </StorePageShell>
  );
};

export default StoreOperatorBrandMasterPage;

