import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCompanyBasePath } from '../../context/TenantContext';
import {
  useKitchenPurchaseRecommendationsApi,
  useKitchenPurchaseRequestManagerApi
} from '../../hooks/adminHook/kitchenStoreHook';
import { showStoreError, showStoreSuccess, showStoreWarning } from '../../utils/toastConfig.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StoreNotice, StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';

function shortIso(s) {
  if (!s || typeof s !== 'string') return '-';
  const day = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(day)) return day;
  return s.length > 19 ? `${s.slice(0, 19)}…` : s;
}

/** @feature kitchen-store — STORE_MANAGER: purchase recommendations + PR from count variance (catalog purchase APIs). */
const StoreManagerPurchaseSuggestionsPage = () => {
  const basePath = useCompanyBasePath();
  const [searchParams] = useSearchParams();
  const [draftForecastDate, setDraftForecastDate] = useState('');
  const [draftMealSlot, setDraftMealSlot] = useState('');
  const [draftTop, setDraftTop] = useState('');
  const [appliedRecFilters, setAppliedRecFilters] = useState({ forecast_date: '', meal_slot: '', top: '' });

  const { suggestions, batchForecastDate, loading, error: recError, refresh } =
    useKitchenPurchaseRecommendationsApi(appliedRecFilters);

  const {
    autoPurchaseFromCountVariance,
    actionLoading: varianceActionLoading,
    error: varianceHookError
  } = useKitchenPurchaseRequestManagerApi();

  const [varianceSessionId, setVarianceSessionId] = useState('');

  useEffect(() => {
    const fromQuery =
      searchParams.get('finalized_session_id')?.trim() ||
      searchParams.get('session')?.trim() ||
      '';
    if (fromQuery) setVarianceSessionId(fromQuery);
  }, [searchParams]);

  const onApplyRecFilters = () => {
    setAppliedRecFilters({
      forecast_date: draftForecastDate.trim(),
      meal_slot: draftMealSlot.trim(),
      top: draftTop.trim()
    });
  };

  const onCreatePrFromVariance = async () => {
    const id = varianceSessionId.trim();
    const payload = id ? { finalized_session_id: id } : {};
    const out = await autoPurchaseFromCountVariance(payload);
    if (!out.ok) {
      showStoreError(out.message || 'Could not create purchase request from variance.');
      return;
    }
    const data = out.data && typeof out.data === 'object' ? out.data : {};
    const requestId =
      data.request_id != null && String(data.request_id).trim() !== ''
        ? String(data.request_id).trim()
        : data.purchase_request_id != null
          ? String(data.purchase_request_id)
          : data.purchase_request?.id != null
            ? String(data.purchase_request.id)
            : data.id != null
              ? String(data.id)
              : '';
    const linesCreated = Number(data.lines_created ?? 0);
    const message = typeof data.message === 'string' ? data.message.trim() : '';

    if (!requestId) {
      showStoreWarning(
        message || 'No draft was created. There may be no shortfall to reorder for this count.',
        'No purchase request'
      );
      return;
    }
    showStoreSuccess(
      `Draft purchase request ${requestId} created (${linesCreated} line${linesCreated === 1 ? '' : 's'}).`,
      'Purchase request'
    );
  };

  return (
    <StorePageShell>
      <StorePageHeader
        title="Purchase Suggestions"
        description="Suggested order quantities from forecasts, and a way to start a purchase request from a completed stock count when counts are below what the books show."
      />
      {recError ? (
        <StoreNotice tone="rose" className="mb-4">
          {recError}
        </StoreNotice>
      ) : null}

      <StoreSection
        title="Suggested order lines"
        description={
          batchForecastDate
            ? `Using forecast batch dated ${batchForecastDate}. Leave filters blank to match the latest batch; narrow by date, meal slot, or how many rows to show.`
            : 'Leave filters blank to use the latest recommendation batch for your store. You can narrow by date, meal slot, or row limit.'
        }
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Forecast date (optional)</label>
            <Input
              type="date"
              value={draftForecastDate}
              onChange={(e) => setDraftForecastDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Meal slot (optional)</label>
            <Input
              value={draftMealSlot}
              onChange={(e) => setDraftMealSlot(e.target.value)}
              placeholder="e.g. LUNCH"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Row limit (optional)</label>
            <Input
              value={draftTop}
              onChange={(e) => setDraftTop(e.target.value)}
              placeholder="Leave blank for default"
              inputMode="numeric"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onApplyRecFilters}>
              Apply filters
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => void refresh()}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>
        </div>
        {loading && suggestions.length === 0 ? (
          <p className="text-sm text-slate-600">Loading recommendations…</p>
        ) : null}
        {!loading && suggestions.length === 0 ? (
          <p className="text-sm text-slate-600">No suggestions for these filters yet. Try clearing filters or refreshing.</p>
        ) : null}
        {suggestions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Slot</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Forecast</TableHead>
                <TableHead>On hand</TableHead>
                <TableHead>Buffer</TableHead>
                <TableHead>Buy qty</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.map((row, idx) => (
                <TableRow key={`${row.item}-${row.meal_slot}-${row.created_at}-${idx}`}>
                  <TableCell>{row.forecast_date || batchForecastDate || '-'}</TableCell>
                  <TableCell>{row.meal_slot || '-'}</TableCell>
                  <TableCell className="font-medium">{row.item}</TableCell>
                  <TableCell>{row.forecast_quantity}</TableCell>
                  <TableCell>{row.current_quantity}</TableCell>
                  <TableCell>{row.safety_buffer}</TableCell>
                  <TableCell className="font-semibold">{row.recommended_purchase_quantity}</TableCell>
                  <TableCell className="max-w-[140px] truncate text-xs text-slate-600" title={row.model_name || ''}>
                    {row.model_name || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 whitespace-nowrap">{shortIso(row.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </StoreSection>

      <StoreSection
        title="Purchase request from stocktake"
        description="Builds a draft purchase request from items where recorded stock was higher than what was counted, so you can reorder the shortfall."
      >
        <p className="text-sm text-slate-600 mb-3">
          Complete and finalize a count on{' '}
          <Link className="text-teal-700 underline font-medium" to={`${basePath}/store-manager/stock-reconciliation`}>
            Stock reconciliation
          </Link>
          . Leave the field below empty to use your latest finalized count, or paste a specific count session id if you
          need an older stocktake.
        </p>
        {varianceHookError ? (
          <StoreNotice tone="rose" className="mb-3">
            {varianceHookError}
          </StoreNotice>
        ) : null}
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Specific count session <span className="font-normal text-slate-500">(optional)</span>
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            className="sm:max-w-md"
            value={varianceSessionId}
            onChange={(e) => setVarianceSessionId(e.target.value)}
            placeholder="Leave empty for latest finalized count"
            autoComplete="off"
          />
          <Button type="button" disabled={varianceActionLoading} onClick={() => void onCreatePrFromVariance()}>
            {varianceActionLoading ? 'Creating…' : 'Create draft purchase request'}
          </Button>
        </div>
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerPurchaseSuggestionsPage;
