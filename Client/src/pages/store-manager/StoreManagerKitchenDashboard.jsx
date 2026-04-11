import React from 'react';
import { useCompanyBasePath } from '../../context/TenantContext';
import { Link } from 'react-router-dom';
import { useKitchenInventoryMock, useKitchenPlansMock, useKitchenReportsMock } from '../../hooks/adminHook/kitchenStoreHook';
import { Button } from '@/components/ui/button';
import { StorePageShell, StoreSection, StoreStatCard, StoreStatGrid } from '@/components/store/StorePageShell';

/** @feature kitchen-store — STORE_MANAGER: kitchen dashboard (inventory snapshot, plans, reports). */
const StoreManagerKitchenDashboard = () => {
  const basePath = useCompanyBasePath();
  const { lowStockItems } = useKitchenInventoryMock();
  const { plans } = useKitchenPlansMock();
  const { totalRevenue, orderSummary } = useKitchenReportsMock();
  const pendingPlans = plans.filter((p) => p.status === 'DRAFT').length;
  const totalOrders = orderSummary.reduce((sum, row) => sum + row.orders, 0);

  return (
    <StorePageShell>
      <StoreStatGrid>
        <StoreStatCard label="Pending Plans" value={pendingPlans} tone="sky" />
        <StoreStatCard label="Low Stock Alerts" value={lowStockItems.length} tone="amber" />
        <StoreStatCard label="Daily Revenue" value={`INR ${totalRevenue}`} tone="emerald" />
      </StoreStatGrid>
      <StoreSection title="Order Snapshot">
        <p className="text-sm text-slate-600">Total orders for day: {totalOrders}</p>
      </StoreSection>
      <StoreSection title="Low Stock Alerts">
          {lowStockItems.length === 0 ? (
            <p className="text-sm text-gray-500 mt-2">No low stock alerts.</p>
          ) : (
            <ul className="mt-2 text-sm text-gray-700 space-y-1 max-h-60 overflow-y-auto pr-1">
              {lowStockItems.map((item) => (
                <li key={item.id}>
                  {item.name}: {item.current_quantity} {item.unit} (min {item.min_quantity})
                </li>
              ))}
            </ul>
          )}
      </StoreSection>
      <StoreSection title="Quick Actions">
          <div className="flex flex-wrap gap-3">
            <Button asChild><Link to={`${basePath}/store-manager/purchase-requests`}>Purchase Request Inbox</Link></Button>
            <Button asChild variant="secondary"><Link to={`${basePath}/store-manager/plan-approval`}>Plan Approval</Link></Button>
            <Button asChild variant="outline"><Link to={`${basePath}/store-manager/plan-list`}>Plan List</Link></Button>
            <Button asChild variant="outline"><Link to={`${basePath}/store-operator/inventory`}>View Inventory</Link></Button>
            <Button asChild variant="outline"><Link to={`${basePath}/store-manager/inventory`}>Inventory Table</Link></Button>
            <Button asChild variant="outline"><Link to={`${basePath}/store-manager/stock-logs`}>Stock Logs</Link></Button>
            <Button asChild variant="outline"><Link to={`${basePath}/store-manager/recipe-bom`}>Recipe/BOM</Link></Button>
            <Button asChild variant="outline"><Link to={`${basePath}/store-manager/reports`}>Reports</Link></Button>
            <Button asChild variant="outline"><Link to={`${basePath}/store-manager/forecast`}>Forecast Dashboard</Link></Button>
            <Button asChild variant="outline"><Link to={`${basePath}/store-manager/purchase-suggestions`}>Purchase Suggestions</Link></Button>
            <Button asChild variant="outline"><Link to={`${basePath}/store-operator/purchases`}>Purchase Receipts</Link></Button>
          </div>
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerKitchenDashboard;
