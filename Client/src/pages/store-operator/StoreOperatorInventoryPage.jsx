import React, { useEffect, useMemo, useState } from 'react';
import { useCompanyBasePath } from '../../context/TenantContext';
import { Link } from 'react-router-dom';
import { useKitchenInventoryMock } from '../../hooks/adminHook/kitchenStoreHook';
import {
  expireMovementChipClassName,
  inventoryStockTableRowClassName,
  nearExpiryChipClassName,
  nearExpiryCountdownLabel,
  nearExpiryRowClassName
} from '../../utils/nearExpiryUi.js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  StoreNotice,
  StorePageHeader,
  StorePageShell,
  StoreSection,
  StoreStatCard,
  StoreStatGrid,
  StoreTableFrame
} from '@/components/store/StorePageShell';
import { showStoreError, showStoreSuccess } from '../../utils/toastConfig.jsx';

/** @feature kitchen-store — STORE_OPERATOR: inventory grid, low-stock, links to item detail. */
const UNCATEGORIZED = '__uncategorized__';

const stockFilterControlClass =
  'h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100';

const isLowStock = (item) => Number(item.current_quantity) <= Number(item.min_quantity);

/** ISO / API datetime → India Standard Time (en-IN, Asia/Kolkata), matching item master & purchase receipts. */
function formatDateTimeIST(iso) {
  if (iso == null || iso === '') return '—';
  const raw = String(iso).trim();
  if (!raw) return '—';
  let d = new Date(raw);
  if (Number.isNaN(d.getTime()) && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(raw)) {
    d = new Date(raw.replace(' ', 'T'));
  }
  if (Number.isNaN(d.getTime())) return '—';
  const datePart = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
  const timePart = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
  return `${datePart}, ${timePart}`;
}

const InventoryItemThumbName = ({ item }) => {
  const u = (item.primary_image_url || '').trim();
  return (
    <div className="flex min-w-0 items-center gap-2">
      {u ? (
        <img
          src={u}
          alt=""
          className="h-8 w-8 shrink-0 rounded-md border border-slate-200 bg-white object-cover"
        />
      ) : (
        <div className="h-8 w-8 shrink-0 rounded-md border border-dashed border-slate-200 bg-slate-50" aria-hidden />
      )}
      <span className="min-w-0 truncate font-medium text-slate-900">{item.name}</span>
    </div>
  );
};

/** Use `brand_logo_s3_url` from items API. */
const InventoryBrandCell = ({ item }) => {
  const logoSrc = (item.brand_logo_s3_url || '').trim();
  const brandLabel = (item.brand_name || '').trim();
  if (!brandLabel && !logoSrc) {
    return <span className="text-sm text-slate-400">—</span>;
  }
  return (
    <div className="flex min-w-0 max-w-[14rem] items-center gap-2">
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={brandLabel ? `${brandLabel} logo` : ''}
          className="h-8 w-8 shrink-0 rounded-md border border-slate-200 bg-white object-contain"
        />
      ) : (
        <div className="h-8 w-8 shrink-0 rounded-md border border-dashed border-slate-200 bg-slate-50" aria-hidden />
      )}
      <span className="truncate text-sm text-slate-800" title={brandLabel || undefined}>
        {brandLabel || '—'}
      </span>
    </div>
  );
};

const StoreOperatorInventoryPage = () => {
  const basePath = useCompanyBasePath();
  const {
    items,
    lowStockItems,
    addStock,
    movements,
    nearExpiryByItemId,
    nearExpiryBatches,
    nearExpiryMeta,
    refreshNearExpiry
  } = useKitchenInventoryMock();
  const [stockInputs, setStockInputs] = useState({});
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { namedCategories, hasUncategorized, units } = useMemo(() => {
    const catSet = new Set();
    let uncat = false;
    const unitSet = new Set();
    items.forEach((item) => {
      const c = (item.category || '').trim();
      if (!c) uncat = true;
      else catSet.add(c);
      if (item.unit) unitSet.add(item.unit);
    });
    return {
      namedCategories: [...catSet].sort((a, b) => a.localeCompare(b)),
      hasUncategorized: uncat,
      units: [...unitSet].sort((a, b) => a.localeCompare(b))
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (q) {
        const inName = item.name.toLowerCase().includes(q);
        const inBrand = (item.brand_name || '').toLowerCase().includes(q);
        const inCat = (item.category || '').toLowerCase().includes(q);
        if (!inName && !inBrand && !inCat) return false;
      }
      if (categoryFilter !== 'all') {
        if (categoryFilter === UNCATEGORIZED) {
          if ((item.category || '').trim()) return false;
        } else if (item.category !== categoryFilter) return false;
      }
      if (unitFilter !== 'all' && item.unit !== unitFilter) return false;
      if (statusFilter !== 'all') {
        const low = isLowStock(item);
        if (statusFilter === 'low' && !low) return false;
        if (statusFilter === 'ok' && low) return false;
        if (statusFilter === 'near_expiry' && !nearExpiryByItemId[item.id]) return false;
      }
      return true;
    });
  }, [items, search, categoryFilter, unitFilter, statusFilter, nearExpiryByItemId]);

  const stockFiltersActive =
    search.trim() !== '' ||
    categoryFilter !== 'all' ||
    unitFilter !== 'all' ||
    statusFilter !== 'all';

  const clearStockFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setUnitFilter('all');
    setStatusFilter('all');
  };

  useEffect(() => {
    void refreshNearExpiry();
  }, [refreshNearExpiry]);

  /** Items that have at least one EXPIRE movement (stock written off as expired). */
  const itemIdsWithExpireMovement = useMemo(() => {
    const set = new Set();
    for (const m of movements) {
      if (String(m.movement_type || '').toUpperCase() === 'EXPIRE' && m.item_id != null && m.item_id !== '') {
        set.add(String(m.item_id));
      }
    }
    return set;
  }, [movements]);

  const updateStockInput = (itemId, patch) => {
    setStockInputs((prev) => ({
      ...prev,
      [itemId]: {
        quantity: prev[itemId]?.quantity || '',
        ...patch
      }
    }));
  };

  const onAddStock = async (item) => {
    const rowState = stockInputs[item.id] || {};
    const convertedQuantity = Number(rowState.quantity);

    if (!Number.isFinite(convertedQuantity) || convertedQuantity <= 0) {
      const msg = 'Enter a valid quantity before adding stock.';
      setStatus(msg);
      showStoreError(msg, 'Invalid quantity');
      return;
    }

    const note = `Manual stock add: ${rowState.quantity}`;
    await addStock(item.id, convertedQuantity, note);
    const okMsg = `Added ${rowState.quantity} to ${item.name}.`;
    setStatus(okMsg);
    showStoreSuccess(okMsg, 'Stock updated');
    setStockInputs((prev) => ({
      ...prev,
      [item.id]: {
        quantity: ''
      }
    }));
  };

  return (
    <StorePageShell>
      <StorePageHeader
        title="Store Operator Inventory"
        description="View stock, perform quick stock additions, and navigate to store actions."
        actions={[
          <Button key="request" asChild><Link to={`${basePath}/store-operator/purchase-requests`}>Create Purchase Request</Link></Button>,
          <Button key="approved" asChild variant="secondary"><Link to={`${basePath}/store-operator/approved-requests`}>Approved Requests</Link></Button>,
          <Button key="receipts" asChild variant="outline"><Link to={`${basePath}/store-operator/purchases`}>Purchase Receipts</Link></Button>,
          <Button key="issue" asChild variant="outline"><Link to={`${basePath}/store-operator/issue`}>Issue Items</Link></Button>,
          <Button key="adjustments" asChild variant="outline"><Link to={`${basePath}/store-operator/adjustments`}>Stock Adjustments</Link></Button>,
        ]}
      />
      <StoreStatGrid>
        <StoreStatCard label="Items" value={items.length} tone="sky" />
        <StoreStatCard label="Low Stock Alerts" value={lowStockItems.length} tone="amber" />
        <StoreStatCard
          label="Near expiry"
          value={nearExpiryMeta.total_count}
          tone="rose"
        />
        <StoreStatCard label="Recent Movements" value={movements.slice(0, 8).length} tone="slate" />
      </StoreStatGrid>
      {status ? <StoreNotice tone="sky">{status}</StoreNotice> : null}
      <StoreSection title="Near expiry" tone="rose">
        {nearExpiryBatches.length === 0 ? (
          <p className="text-sm text-slate-500">No near-expiry batches.</p>
        ) : (
          <ul className="max-h-60 space-y-2 overflow-y-auto pr-1">
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
                    <span>Qty {row.remaining_quantity ?? '—'}</span>
                    <span>{row.days_until_expiry != null ? `${row.days_until_expiry} days` : '—'}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {nearExpiryBatches.length > 12 ? (
          <p className="mt-2 text-xs text-slate-500">
            Showing 12 of {nearExpiryBatches.length}. Use the current stock table below for the full list and filters.
          </p>
        ) : null}
      </StoreSection>
      <StoreSection
        title="Current Stock"
        description={stockFiltersActive ? `Showing ${filteredItems.length} of ${items.length} items.` : undefined}
        headerActions={
          <Button type="button" variant="outline" size="sm" onClick={() => void refreshNearExpiry()}>
            Refresh near-expiry
          </Button>
        }
      >
        <div className="mb-3 flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
            <label htmlFor="op-stock-filter-search" className="text-xs font-medium text-slate-600">
              Search name
            </label>
            <input
              id="op-stock-filter-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by item or brand name…"
              className={`${stockFilterControlClass} w-full min-w-0`}
              autoComplete="off"
            />
          </div>
          <div className="flex min-w-[9rem] flex-col gap-1">
            <label htmlFor="op-stock-filter-category" className="text-xs font-medium text-slate-600">
              Category
            </label>
            <select
              id="op-stock-filter-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`${stockFilterControlClass} w-full sm:w-auto`}
            >
              <option value="all">All categories</option>
              {hasUncategorized ? <option value={UNCATEGORIZED}>Uncategorized</option> : null}
              {namedCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-[7rem] flex-col gap-1">
            <label htmlFor="op-stock-filter-unit" className="text-xs font-medium text-slate-600">
              Unit
            </label>
            <select
              id="op-stock-filter-unit"
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className={`${stockFilterControlClass} w-full sm:w-auto`}
            >
              <option value="all">All units</option>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-[9rem] flex-col gap-1">
            <label htmlFor="op-stock-filter-status" className="text-xs font-medium text-slate-600">
              Stock status
            </label>
            <select
              id="op-stock-filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${stockFilterControlClass} w-full sm:w-auto`}
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="ok">OK</option>
              <option value="near_expiry">Near expiry</option>
            </select>
          </div>
          {stockFiltersActive ? (
            <Button type="button" variant="outline" size="sm" className="h-9 shrink-0" onClick={clearStockFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
        <StoreTableFrame className="max-h-[min(70vh,calc(2.5rem_+_6_*_3.75rem))] overflow-auto">
        <Table className="border-separate border-spacing-0" wrapperClassName="relative w-full overflow-visible">
          <TableHeader className="[&_tr]:border-b [&_tr]:hover:bg-transparent [&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:border-b [&_th]:border-slate-200 [&_th]:bg-white [&_th]:shadow-[0_1px_0_0_rgb(226,232,240)]">
            <TableRow className="hover:bg-transparent">
              <TableHead>Item</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-center">Current Qty</TableHead>
              <TableHead className="text-center">Min Qty</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="whitespace-nowrap">Created</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead className="w-[220px]">Add Stock</TableHead>
              <TableHead className="text-right">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-sm text-slate-500">
                  {items.length === 0 ? 'No inventory items loaded.' : 'No items match the current filters.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => {
                const isLow = isLowStock(item);
                const exp = nearExpiryByItemId[item.id];
                const hasExpireMovement = itemIdsWithExpireMovement.has(String(item.id));
                return (
                  <TableRow
                    key={item.id}
                    className={inventoryStockTableRowClassName(item.id, nearExpiryByItemId, hasExpireMovement)}
                  >
                    <TableCell>
                      <InventoryItemThumbName item={item} />
                    </TableCell>
                    <TableCell>
                      <InventoryBrandCell item={item} />
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-center font-medium">{item.current_quantity}</TableCell>
                    <TableCell className="text-center">{item.min_quantity}</TableCell>
                    <TableCell className="text-center">
                      {hasExpireMovement ? (
                        <span className="text-sm text-slate-400" title="Expiry write-off recorded — see Expiry column">
                          —
                        </span>
                      ) : (
                        <Badge variant={isLow ? 'warningSoft' : 'successSoft'}>{isLow ? 'Low' : 'OK'}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-slate-700">
                      {formatDateTimeIST(item.created_at)}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex max-w-[10rem] flex-col gap-0.5">
                        {hasExpireMovement ? (
                          <span
                            className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${expireMovementChipClassName}`}
                            title="Same as Recent Stock Movement Log — EXPIRE movement for this item"
                          >
                            EXPIRE
                          </span>
                        ) : null}
                        {exp ? (
                          <>
                            <span
                              className={`inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium ${nearExpiryChipClassName(exp)}`}
                            >
                              {nearExpiryCountdownLabel(exp)}
                            </span>
                            {exp.expiry_date ? (
                              <span className="text-[11px] leading-tight text-slate-500">{exp.expiry_date}</span>
                            ) : null}
                            {exp.batch_count > 1 ? (
                              <span className="text-[11px] text-slate-400">{exp.batch_count} batches</span>
                            ) : null}
                          </>
                        ) : null}
                        {!hasExpireMovement && !exp ? (
                          <span className="text-sm text-slate-400">—</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/90 px-2 py-1 shadow-sm">
                        <input
                          className="h-9 w-24 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                          type="number"
                          min="0"
                          step="0.01"
                          value={stockInputs[item.id]?.quantity || ''}
                          onChange={(e) => updateStockInput(item.id, { quantity: e.target.value })}
                          placeholder="Qty"
                        />
                        <Button type="button" size="sm" variant="success" className="min-w-16" onClick={() => onAddStock(item)}>
                          Add
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`${basePath}/store-operator/item/${item.id}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </StoreTableFrame>
      </StoreSection>
      <StoreSection title="Low Stock Alerts">
        {lowStockItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No low stock alerts.</p>
        ) : (
          <StoreTableFrame className="max-h-[22rem] overflow-y-auto">
            <Table wrapperClassName="relative w-full overflow-visible">
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Min</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <InventoryItemThumbName item={item} />
                    </TableCell>
                    <TableCell>
                      <InventoryBrandCell item={item} />
                    </TableCell>
                    <TableCell>{item.current_quantity} {item.unit}</TableCell>
                    <TableCell>{item.min_quantity} {item.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </StoreTableFrame>
        )}
      </StoreSection>
      <StoreSection title="Recent Stock Movement Log">
        <StoreTableFrame className="max-h-[22rem] overflow-y-auto">
          <Table wrapperClassName="relative w-full overflow-visible">
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead className="w-12"> </TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Delta</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((row) => (
                <TableRow key={row.id}>
                  <TableCell><Badge variant="outline">{row.movement_type}</Badge></TableCell>
                  <TableCell>
                    {(row.item_primary_image_url || '').trim() ? (
                      <img
                        src={row.item_primary_image_url}
                        alt=""
                        className="h-7 w-7 rounded border border-slate-200 bg-white object-cover"
                      />
                    ) : (
                      <span className="text-slate-300">·</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{row.item_name}</TableCell>
                  <TableCell>{row.quantity}</TableCell>
                  <TableCell className={row.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}>{row.delta}</TableCell>
                  <TableCell>{row.note || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </StoreTableFrame>
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreOperatorInventoryPage;
