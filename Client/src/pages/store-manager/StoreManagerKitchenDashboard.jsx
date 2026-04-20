import React, { useEffect, useState } from 'react';
import { useCompanyBasePath } from '../../context/TenantContext';
import { Link } from 'react-router-dom';
import {
  useKitchenInventoryMock,
  useKitchenPlansMock,
  useKitchenReconciliationApi,
  useKitchenReportsMock
} from '../../hooks/adminHook/kitchenStoreHook';
import { Button } from '@/components/ui/button';
import { nearExpiryRowClassName } from '../../utils/nearExpiryUi.js';
import { StorePageShell, StoreSection, StoreStatCard, StoreStatGrid } from '@/components/store/StorePageShell';

/** @feature kitchen-store — STORE_MANAGER: kitchen dashboard (inventory snapshot, plans, reports). */
const StoreManagerKitchenDashboard = () => {
  const basePath = useCompanyBasePath();
  const { lowStockItems, nearExpiryBatches, nearExpiryMeta, refreshNearExpiry } = useKitchenInventoryMock();
  const { plans } = useKitchenPlansMock();
  const { totalRevenue, orderSummary } = useKitchenReportsMock();
  const { loading: readinessLoading, error: readinessError, readiness, fetchNextDayReadiness } = useKitchenReconciliationApi();
  const [mealSlot, setMealSlot] = useState('LUNCH');
  const pendingPlans = plans.filter((p) => p.status === 'DRAFT').length;
  const totalOrders = orderSummary.reduce((sum, row) => sum + row.orders, 0);

  useEffect(() => {
    void refreshNearExpiry();
  }, [refreshNearExpiry]);

  useEffect(() => {
    void fetchNextDayReadiness({ meal_slot: mealSlot, include_details: true });
  }, [fetchNextDayReadiness, mealSlot]);

  return (
    <StorePageShell>
      <StoreStatGrid>
        <StoreStatCard label="Pending Plans" value={pendingPlans} tone="sky" />
        <StoreStatCard label="Low Stock Alerts" value={lowStockItems.length} tone="amber" />
        <StoreStatCard label="Near expiry" value={nearExpiryMeta.total_count} tone="rose" />
        <StoreStatCard label="Daily Revenue" value={`INR ${totalRevenue}`} tone="emerald" />
      </StoreStatGrid>

      <StoreSection
        title="Next-day readiness"
        description="Single-call snapshot from reconciliation: score, status, and shortage signals for tomorrow’s service."
        headerActions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
              value={mealSlot}
              onChange={(e) => setMealSlot(e.target.value)}
            >
              <option value="BREAKFAST">Breakfast</option>
              <option value="LUNCH">Lunch</option>
              <option value="DINNER">Dinner</option>
            </select>
            <Button type="button" variant="outline" size="sm" onClick={() => void fetchNextDayReadiness({ meal_slot: mealSlot, include_details: true })}>
              Refresh
            </Button>
          </div>
        }
      >
        {readinessLoading ? (
          <p className="text-sm text-slate-500">Loading readiness…</p>
        ) : readinessError ? (
          <p className="text-sm text-red-600">{readinessError}</p>
        ) : readiness && typeof readiness === 'object' ? (
          <div className="text-sm text-slate-700 space-y-2">
            {readiness.summary ? (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 space-y-1">
                <p>
                  <span className="font-medium text-slate-900">Readiness score:</span>{' '}
                  {readiness.summary.readiness_score ?? '—'} / 100
                </p>
                <p>
                  <span className="font-medium text-slate-900">Status:</span>{' '}
                  {readiness.summary.readiness_status || '—'}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Shortage lines:</span>{' '}
                  {readiness.summary.shortage_line_count ?? '—'}
                </p>
              </div>
            ) : (
              <pre className="text-xs overflow-auto max-h-48 bg-slate-50 rounded-md p-2 border">{JSON.stringify(readiness, null, 2)}</pre>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No readiness data.</p>
        )}
      </StoreSection>

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
        {nearExpiryBatches.length === 0 ? (
          <p className="text-sm text-gray-500 mt-2">No near-expiry batches.</p>
        ) : (
          <ul className="mt-2 max-h-60 space-y-2 overflow-y-auto pr-1">
            {nearExpiryBatches.slice(0, 12).map((row) => (
              <li
                key={row.batch_id || `${row.inventory_item_id}-${row.expiry_date}`}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/80 px-3 py-2 text-sm ${nearExpiryRowClassName(row)}`}
              >
                <div className="min-w-0 flex-1">
                  {row.inventory_item_id ? (
                    <Link
                      to={`${basePath}/store-operator/item/${row.inventory_item_id}`}
                      className="block truncate font-medium text-slate-900 hover:underline"
                    >
                      {row.item_name}
                    </Link>
                  ) : (
                    <span className="block truncate font-medium text-slate-900">{row.item_name}</span>
                  )}
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-600">
                    <span>Qty {row.remaining_quantity || '—'}</span>
                    <span>
                      {row.days_until_expiry != null ? `${row.days_until_expiry} days` : '—'}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {nearExpiryBatches.length > 12 ? (
          <p className="mt-2 text-xs text-slate-500">
            Showing 12 of {nearExpiryBatches.length}. See the inventory table for the full list.
          </p>
        ) : null}
      </StoreSection>
      <StoreSection title="Quick Actions">
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to={`${basePath}/store-manager/purchase-requests`}>Purchase Request Inbox</Link>
            </Button>
            <Button asChild variant="secondary"><Link to={`${basePath}/store-manager/plan-approval`}>Plan Approval</Link></Button>
            <Button asChild variant="outline"><Link to={`${basePath}/store-operator/issue`}>Plan list and issue</Link></Button>
            <Button asChild variant="outline"><Link to={`${basePath}/store-operator/inventory`}>View Inventory</Link></Button>
            <Button asChild variant="outline"><Link to={`${basePath}/store-manager/inventory`}>Inventory Table</Link></Button>
            <Button asChild variant="outline"><Link to={`${basePath}/store-manager/stock-logs`}>Stock Logs</Link></Button>
            <Button asChild variant="outline"><Link to={`${basePath}/store-operator/recipe-bom`}>Recipe/BOM</Link></Button>
            <Button asChild variant="outline"><Link to={`${basePath}/store-manager/meal-programs`}>Menu item creation</Link></Button>
            <Button asChild variant="outline"><Link to={`${basePath}/store-manager/reports`}>Reports</Link></Button>
            <Button asChild variant="outline"><Link to={`${basePath}/store-manager/stock-reconciliation`}>Stock count & readiness</Link></Button>
            <Button asChild variant="outline"><Link to={`${basePath}/store-manager/forecast`}>Forecast Dashboard</Link></Button>
            <Button asChild variant="outline"><Link to={`${basePath}/store-manager/purchase-suggestions`}>Purchase Suggestions</Link></Button>
            <Button asChild variant="outline"><Link to={`${basePath}/store-operator/purchases`}>Purchase Receipts</Link></Button>
          </div>
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerKitchenDashboard;
