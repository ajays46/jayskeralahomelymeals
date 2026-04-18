import React, { useState } from 'react';
import { useKitchenForecastDashboardApi } from '../../hooks/adminHook/kitchenStoreHook';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  StoreNotice,
  StorePageHeader,
  StorePageShell,
  StoreSection,
  StoreStatCard,
  StoreStatGrid
} from '@/components/store/StorePageShell';

function shortIso(s) {
  if (!s || typeof s !== 'string') return '—';
  const day = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  return s.length > 19 ? `${s.slice(0, 19)}…` : s;
}

function formatInr(n) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(Number(n));
}

/** @feature kitchen-store — STORE_MANAGER: demand and financial forecast dashboards (inventory DB). */
const StoreManagerForecastDashboardPage = () => {
  const [draftForecastDate, setDraftForecastDate] = useState('');
  const [draftMealSlot, setDraftMealSlot] = useState('');
  const [draftTop, setDraftTop] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({ forecast_date: '', meal_slot: '', top: '' });

  const {
    inventoryRows,
    inventoryForecastDate,
    financialRows,
    financialForecastDate,
    loading,
    inventoryError,
    financialError,
    refresh
  } = useKitchenForecastDashboardApi(appliedFilters);

  const onApplyFilters = () => {
    setAppliedFilters({
      forecast_date: draftForecastDate.trim(),
      meal_slot: draftMealSlot.trim(),
      top: draftTop.trim()
    });
  };

  return (
    <StorePageShell>
      <StorePageHeader title="Forecast Dashboard" />
      <StoreStatGrid>
        <StoreStatCard label="Demand rows" value={inventoryRows.length} />
        <StoreStatCard label="Financial rows" value={financialRows.length} />
        <StoreStatCard
          label="Demand batch date"
          value={inventoryForecastDate || '—'}
        />
        <StoreStatCard
          label="Financial batch date"
          value={financialForecastDate || '—'}
        />
      </StoreStatGrid>

      {inventoryError ? (
        <StoreNotice tone="rose" className="mb-4">
          {inventoryError}
        </StoreNotice>
      ) : null}
      {financialError ? (
        <StoreNotice tone="rose" className="mb-4">
          {financialError}
        </StoreNotice>
      ) : null}

      <StoreSection title="Inventory demand forecasts">
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">forecast_date (optional)</label>
            <Input
              type="date"
              value={draftForecastDate}
              onChange={(e) => setDraftForecastDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">meal_slot (optional)</label>
            <Input
              value={draftMealSlot}
              onChange={(e) => setDraftMealSlot(e.target.value)}
              placeholder="e.g. LUNCH"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">top (optional, max 20000)</label>
            <Input
              value={draftTop}
              onChange={(e) => setDraftTop(e.target.value)}
              placeholder="server default if empty"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onApplyFilters}>
              Apply filters
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => void refresh()}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>
        </div>
        {loading && inventoryRows.length === 0 ? (
          <p className="text-sm text-slate-600">Loading inventory demand forecasts…</p>
        ) : null}
        {!loading && inventoryRows.length === 0 && !inventoryError ? (
          <p className="text-sm text-slate-600">No demand forecast rows for these filters.</p>
        ) : null}
        {inventoryRows.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Meal slot</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Forecast qty</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryRows.map((row, idx) => (
                  <TableRow
                    key={`${row.inventory_item_name}-${row.meal_slot}-${row.created_at}-${idx}`}
                  >
                    <TableCell>{row.forecast_date || inventoryForecastDate || '—'}</TableCell>
                    <TableCell>{row.meal_slot || '—'}</TableCell>
                    <TableCell className="font-medium">{row.inventory_item_name || '—'}</TableCell>
                    <TableCell>{row.forecast_quantity}</TableCell>
                    <TableCell
                      className="max-w-[160px] truncate text-xs text-slate-600"
                      title={row.model_name || ''}
                    >
                      {row.model_name || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                      {shortIso(row.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </StoreSection>

      <StoreSection title="Financial forecasts">
        {loading && financialRows.length === 0 && !financialError ? (
          <p className="text-sm text-slate-600">Loading financial forecasts…</p>
        ) : null}
        {!loading && financialRows.length === 0 && !financialError ? (
          <p className="text-sm text-slate-600">No financial forecast rows for these filters.</p>
        ) : null}
        {financialRows.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Ingredient cost</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {financialRows.map((row, idx) => (
                  <TableRow key={`${row.forecast_date}-${row.model_name}-${row.created_at}-${idx}`}>
                    <TableCell>{row.forecast_date || financialForecastDate || '—'}</TableCell>
                    <TableCell>INR {formatInr(row.forecast_revenue)}</TableCell>
                    <TableCell>INR {formatInr(row.forecast_ingredient_cost)}</TableCell>
                    <TableCell>INR {formatInr(row.forecast_gross_margin)}</TableCell>
                    <TableCell
                      className="max-w-[160px] truncate text-xs text-slate-600"
                      title={row.model_name || ''}
                    >
                      {row.model_name || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                      {shortIso(row.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerForecastDashboardPage;
