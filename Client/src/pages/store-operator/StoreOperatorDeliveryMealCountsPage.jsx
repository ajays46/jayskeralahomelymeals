import React, { useMemo, useState } from 'react';
import { fetchKitchenDeliveryMealCounts, kitchenNextServiceDateIso, KITCHEN_DEMAND_MEAL_SLOTS } from '../../hooks/adminHook/kitchenStoreHook';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import { showStoreError } from '../../utils/toastConfig.jsx';

/** @feature kitchen-store — GET /kitchen/orders/delivery-meal-counts (guide step A). */
const StoreOperatorDeliveryMealCountsPage = () => {
  const defaultDate = useMemo(() => kitchenNextServiceDateIso(), []);
  const [planDate, setPlanDate] = useState(defaultDate);
  const [mealSlot, setMealSlot] = useState('');
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState(null);

  const lines = useMemo(() => {
    if (!payload || typeof payload !== 'object') return [];
    const raw = Array.isArray(payload.lines) ? payload.lines : [];
    return raw;
  }, [payload]);

  const onLoad = async () => {
    if (!planDate.trim()) {
      showStoreError('Choose a plan date (YYYY-MM-DD).');
      return;
    }
    setLoading(true);
    setPayload(null);
    try {
      const out = await fetchKitchenDeliveryMealCounts({
        plan_date: planDate.trim(),
        ...(mealSlot ? { meal_slot: mealSlot } : {})
      });
      if (!out.ok) {
        showStoreError(out.message || 'Request failed.');
        return;
      }
      setPayload(out.data || {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <StorePageShell>
      <StorePageHeader title="Delivery meal counts"/>

      <StoreSection title="" tone="sky">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            plan_date (required)
            <input
              type="date"
              className="h-9 rounded-lg border border-slate-200 px-2 text-sm"
              value={planDate}
              onChange={(e) => setPlanDate(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            meal_slot (optional)
            <select
              className="h-9 min-w-[140px] rounded-lg border border-slate-200 bg-white px-2 text-sm"
              value={mealSlot}
              onChange={(e) => setMealSlot(e.target.value)}
            >
              <option value="">All sessions</option>
              {KITCHEN_DEMAND_MEAL_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" disabled={loading} onClick={() => void onLoad()}>
            {loading ? 'Loading…' : 'Load counts'}
          </Button>
        </div>
      </StoreSection>

      {payload ? (
        <StoreSection title="Results" tone="emerald">
          <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
            {payload.plan_date != null ? (
              <span>
                <span className="font-medium">Date:</span> {String(payload.plan_date)}
              </span>
            ) : null}
            {payload.meal_slot != null && String(payload.meal_slot).trim() !== '' ? (
              <span>
                <span className="font-medium">Slot:</span> {String(payload.meal_slot)}
              </span>
            ) : mealSlot ? (
              <span>
                <span className="font-medium">Slot:</span> {mealSlot}
              </span>
            ) : (
              <span className="text-muted-foreground">Slot: All sessions</span>
            )}
          </div>
          {lines.length === 0 ? (
            <StoreNotice tone="amber">No line rows returned. There may be no delivery items for this date or slot.</StoreNotice>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Menu item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((row, idx) => (
                  <TableRow key={String(row.menu_item_id ?? row.menuItemId ?? idx)}>
                    <TableCell>
                      {row.menu_item_name || row.menuItemName || '—'}
                    </TableCell>
                    <TableCell className="text-right">{row.total_quantity ?? row.quantity ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </StoreSection>
      ) : null}
    </StorePageShell>
  );
};

export default StoreOperatorDeliveryMealCountsPage;
