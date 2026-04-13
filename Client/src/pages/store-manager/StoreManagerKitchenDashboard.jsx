import React, { useEffect, useMemo } from 'react';
import { useCompanyBasePath } from '../../context/TenantContext';
import { Link } from 'react-router-dom';
import { useKitchenInventoryMock, useKitchenPlansMock, useKitchenReportsMock } from '../../hooks/adminHook/kitchenStoreHook';
import {
  compareNearExpiryInfo,
  nearExpiryChipClassName,
  nearExpiryCountdownLabel,
  nearExpiryRowClassName
} from '../../utils/nearExpiryUi.js';
import { Button } from '@/components/ui/button';
import { StorePageShell, StoreSection, StoreStatCard, StoreStatGrid } from '@/components/store/StorePageShell';

/** @feature kitchen-store — STORE_MANAGER: kitchen dashboard (inventory snapshot, plans, reports). */
const StoreManagerKitchenDashboard = () => {
  const basePath = useCompanyBasePath();
  const { lowStockItems, items, nearExpiryByItemId, nearExpiryMeta, refreshNearExpiry } = useKitchenInventoryMock();
  const { plans } = useKitchenPlansMock();
  const { totalRevenue, orderSummary } = useKitchenReportsMock();
  const pendingPlans = plans.filter((p) => p.status === 'DRAFT').length;
  const totalOrders = orderSummary.reduce((sum, row) => sum + row.orders, 0);

  useEffect(() => {
    void refreshNearExpiry();
  }, [refreshNearExpiry]);

  const nearExpiryRows = useMemo(
    () =>
      Object.entries(nearExpiryByItemId)
        .map(([id, info]) => {
          const it = items.find((i) => i.id === id);
          return { id, name: it?.name || 'Unknown item', ...info };
        })
        .sort((a, b) => compareNearExpiryInfo(a, b)),
    [nearExpiryByItemId, items]
  );

  return (
    <StorePageShell>
      <StoreStatGrid>
        <StoreStatCard label="Pending Plans" value={pendingPlans} tone="sky" />
        <StoreStatCard label="Low Stock Alerts" value={lowStockItems.length} tone="amber" />
        <StoreStatCard
          label={`Near expiry (≤${nearExpiryMeta.days_threshold}d)`}
          value={nearExpiryMeta.total_count}
          tone="rose"
          helper="Inventory batches in the configured window"
        />
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
      <StoreSection
        title="Near expiry"
        description={`Worst-first batches expiring within ${nearExpiryMeta.days_threshold} days. Open the inventory table for filters and full columns.`}
        headerActions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void refreshNearExpiry()}>
              Refresh
            </Button>
            <Button asChild size="sm" variant="secondary">
              <Link to={`${basePath}/store-manager/inventory`}>Inventory table</Link>
            </Button>
          </div>
        }
      >
        {nearExpiryRows.length === 0 ? (
          <p className="text-sm text-gray-500 mt-2">No near-expiry batches in the current window.</p>
        ) : (
          <ul className="mt-2 max-h-60 space-y-2 overflow-y-auto pr-1">
            {nearExpiryRows.slice(0, 12).map((row) => (
              <li
                key={row.id}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200/80 px-3 py-2 text-sm ${nearExpiryRowClassName(row)}`}
              >
                <Link
                  to={`${basePath}/store-operator/item/${row.id}`}
                  className="min-w-0 flex-1 truncate font-medium text-slate-900 hover:underline"
                >
                  {row.name}
                </Link>
                <span
                  className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${nearExpiryChipClassName(row)}`}
                >
                  {nearExpiryCountdownLabel(row)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {nearExpiryRows.length > 12 ? (
          <p className="mt-2 text-xs text-slate-500">Showing 12 of {nearExpiryRows.length}. See the inventory table for the full list.</p>
        ) : null}
      </StoreSection>
      <StoreSection title="Quick Actions">
          <div className="flex flex-wrap gap-3">
            <Button asChild><Link to={`${basePath}/store-manager/purchase-requests`}>Purchase Request Inbox</Link></Button>
            <Button asChild variant="outline">
              <Link to={`${basePath}/store-manager/purchase-requests?view=rhythm`}>Weekly / daily rhythm</Link>
            </Button>
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
