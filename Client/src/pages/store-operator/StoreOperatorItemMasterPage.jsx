import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageShell, StoreSection, StoreStatCard, StoreStatGrid } from '@/components/store/StorePageShell';
import { CreateInventoryItemSection } from '@/components/store/CreateInventoryItemSection';
import { fetchInventoryUnitsList, useKitchenInventoryMock } from '../../hooks/adminHook/kitchenStoreHook';
import { showStoreError, showStoreSuccess } from '../../utils/toastConfig.jsx';

/** @feature kitchen-store — STORE_OPERATOR: item master list, create item, edit item (PUT …/inventory/items/:id). */

const UNCATEGORIZED = '__uncategorized__';
const NO_BRAND = '__no_brand__';

const itemFilterControlClass =
  'h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100';

const isLowStock = (item) => Number(item.current_quantity) <= Number(item.min_quantity);

/** ISO / API datetime → India Standard Time (en-IN, Asia/Kolkata), matching purchase receipts. */
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

const ItemCatalogThumb = ({ url, name }) => {
  const u = (url || '').trim();
  if (!u) {
    return (
      <div
        className="h-9 w-9 shrink-0 rounded-md border border-dashed border-slate-200 bg-slate-50"
        aria-label={name ? `No catalog photo for ${name}` : 'No catalog photo'}
      />
    );
  }
  return (
    <img
      src={u}
      alt={name ? `Catalog: ${name}` : ''}
      className="h-9 w-9 shrink-0 rounded-md border border-slate-200 bg-white object-cover"
    />
  );
};

const ItemBrandCell = ({ item }) => {
  /** Prefer presigned `brand_logo_view_url` for `<img src>`; fall back to `brand_logo_s3_url` if needed. */
  const logoSrc = (item.brand_logo_view_url || item.brand_logo_s3_url || '').trim();
  const brandLabel = (item.brand_name || '').trim();
  if (!brandLabel && !logoSrc) {
    return <span className="text-sm text-slate-400">-</span>;
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
        {brandLabel || '-'}
      </span>
    </div>
  );
};

const emptyEditForm = () => ({
  name: '',
  unit: '',
  category: '',
  min_quantity: '',
  brand_id: ''
});

const StoreOperatorItemMasterPage = () => {
  const { items, getItemDetail, nearExpiryByItemId, updateItem, refreshItems, brands } = useKitchenInventoryMock();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  const [selectedId, setSelectedId] = useState('');
  const [itemDetail, setItemDetail] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [status, setStatus] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [catalogUnits, setCatalogUnits] = useState([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const list = await fetchInventoryUnitsList();
      if (!cancelled) setCatalogUnits(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { namedCategories, hasUncategorized, units, brandNames, hasNoBrandItem } = useMemo(() => {
    const catSet = new Set();
    let uncat = false;
    const unitSet = new Set();
    const brandSet = new Set();
    let noBrand = false;
    items.forEach((item) => {
      const c = (item.category || '').trim();
      if (!c) uncat = true;
      else catSet.add(c);
      if (item.unit) unitSet.add(item.unit);
      const b = (item.brand_name || '').trim();
      if (!b) noBrand = true;
      else brandSet.add(b);
    });
    return {
      namedCategories: [...catSet].sort((a, b) => a.localeCompare(b)),
      hasUncategorized: uncat,
      units: [...unitSet].sort((a, b) => a.localeCompare(b)),
      brandNames: [...brandSet].sort((a, b) => a.localeCompare(b)),
      hasNoBrandItem: noBrand
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (q) {
        const hay = `${it.name} ${it.brand_name || ''} ${it.category} ${it.unit}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (categoryFilter !== 'all') {
        if (categoryFilter === UNCATEGORIZED) {
          if ((it.category || '').trim()) return false;
        } else if (it.category !== categoryFilter) return false;
      }
      if (unitFilter !== 'all' && it.unit !== unitFilter) return false;
      if (brandFilter !== 'all') {
        const b = (it.brand_name || '').trim();
        if (brandFilter === NO_BRAND) {
          if (b) return false;
        } else if (b !== brandFilter) return false;
      }
      if (stockStatusFilter !== 'all') {
        const low = isLowStock(it);
        if (stockStatusFilter === 'low' && !low) return false;
        if (stockStatusFilter === 'ok' && low) return false;
        if (stockStatusFilter === 'near_expiry' && !nearExpiryByItemId[it.id]) return false;
      }
      return true;
    });
  }, [items, query, categoryFilter, unitFilter, brandFilter, stockStatusFilter, nearExpiryByItemId]);

  const itemFiltersActive =
    query.trim() !== '' ||
    categoryFilter !== 'all' ||
    unitFilter !== 'all' ||
    brandFilter !== 'all' ||
    stockStatusFilter !== 'all';

  const clearItemFilters = () => {
    setQuery('');
    setCategoryFilter('all');
    setUnitFilter('all');
    setBrandFilter('all');
    setStockStatusFilter('all');
  };

  useEffect(() => {
    if (!itemDetail) {
      setEditForm(emptyEditForm());
      return;
    }
    const bid = itemDetail.brand_id ?? itemDetail.brandId;
    setEditForm({
      name: String(itemDetail.name ?? ''),
      unit: String(itemDetail.unit ?? ''),
      category: String(itemDetail.category ?? ''),
      min_quantity:
        itemDetail.min_quantity != null && itemDetail.min_quantity !== ''
          ? String(itemDetail.min_quantity)
          : '',
      brand_id: bid != null && String(bid).trim() !== '' ? String(bid) : ''
    });
  }, [itemDetail]);

  const onLoadDetail = async (itemId) => {
    setSelectedId(itemId);
    setItemDetail(null);
    const detail = await getItemDetail(itemId);
    setItemDetail(detail);
  };

  const syncEditFormFromDetail = () => {
    if (!itemDetail) return;
    const bid = itemDetail.brand_id ?? itemDetail.brandId;
    setEditForm({
      name: String(itemDetail.name ?? ''),
      unit: String(itemDetail.unit ?? ''),
      category: String(itemDetail.category ?? ''),
      min_quantity:
        itemDetail.min_quantity != null && itemDetail.min_quantity !== ''
          ? String(itemDetail.min_quantity)
          : '',
      brand_id: bid != null && String(bid).trim() !== '' ? String(bid) : ''
    });
  };

  const onSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    const name = editForm.name.trim();
    const unit = editForm.unit.trim();
    if (!name || !unit) {
      const msg = 'Name and unit are required.';
      setStatus(msg);
      showStoreError(msg, 'Validation');
      return;
    }
    let minQuantity = 0;
    if (editForm.min_quantity !== '') {
      const n = Number(editForm.min_quantity);
      if (!Number.isFinite(n) || n < 0) {
        const msg = 'Minimum quantity must be a non-negative number.';
        setStatus(msg);
        showStoreError(msg, 'Validation');
        return;
      }
      minQuantity = n;
    }

    const payload = {
      name,
      unit,
      category: editForm.category.trim(),
      min_quantity: minQuantity,
      brand_id: editForm.brand_id === '' ? null : editForm.brand_id
    };

    setStatus('');
    setEditSaving(true);
    const out = await updateItem(selectedId, payload);
    setEditSaving(false);
    if (out.ok) {
      setStatus('Item updated.');
      showStoreSuccess('Item updated.', 'Saved');
      const refreshed = await getItemDetail(selectedId);
      setItemDetail(refreshed);
    } else {
      const msg = out.message || 'Update failed.';
      setStatus(msg);
      showStoreError(msg, 'Save failed');
    }
  };

  return (
    <StorePageShell>
      {status ? <StoreNotice tone="sky">{status}</StoreNotice> : null}

      <StoreStatGrid>
        <StoreStatCard label="Total Items" value={items.length} tone="violet" />
        <StoreStatCard label="Filtered Items" value={filteredItems.length} tone="sky" />
      </StoreStatGrid>

      <CreateInventoryItemSection
        idPrefix="item-master"
        onItemCreated={() => void refreshItems()}
        showPrimaryImage={false}
      />

      <StoreSection
        title="Items"
        description={
          itemFiltersActive
            ? `Showing ${filteredItems.length} of ${items.length} items. Use filters and Edit to change an item.`
            : 'Search the list and use Edit to update SKU fields.'
        }
        tone="sky"
      >
        <div className="mb-3 flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
            <label htmlFor="item-master-filter-search" className="text-xs font-medium text-slate-600">
              Search
            </label>
            <input
              id="item-master-filter-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Item, brand, category, unit…"
              className={`${itemFilterControlClass} w-full min-w-0`}
              autoComplete="off"
            />
          </div>
          <div className="flex min-w-[9rem] flex-col gap-1">
            <label htmlFor="item-master-filter-category" className="text-xs font-medium text-slate-600">
              Category
            </label>
            <select
              id="item-master-filter-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`${itemFilterControlClass} w-full sm:w-auto`}
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
          <div className="flex min-w-[9rem] flex-col gap-1">
            <label htmlFor="item-master-filter-brand" className="text-xs font-medium text-slate-600">
              Brand
            </label>
            <select
              id="item-master-filter-brand"
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className={`${itemFilterControlClass} w-full sm:w-auto`}
            >
              <option value="all">All brands</option>
              {hasNoBrandItem ? <option value={NO_BRAND}>No brand</option> : null}
              {brandNames.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-[7rem] flex-col gap-1">
            <label htmlFor="item-master-filter-unit" className="text-xs font-medium text-slate-600">
              Unit
            </label>
            <select
              id="item-master-filter-unit"
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className={`${itemFilterControlClass} w-full sm:w-auto`}
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
            <label htmlFor="item-master-filter-stock" className="text-xs font-medium text-slate-600">
              Stock status
            </label>
            <select
              id="item-master-filter-stock"
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
              className={`${itemFilterControlClass} w-full sm:w-auto`}
            >
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="ok">OK</option>
              <option value="near_expiry">Near expiry</option>
            </select>
          </div>
          {itemFiltersActive ? (
            <Button type="button" variant="outline" size="sm" className="h-9 shrink-0" onClick={clearItemFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
        {filteredItems.length === 0 ? (
          <StoreNotice tone="amber">No items match the current filters.</StoreNotice>
        ) : (
          <div className="max-h-[22rem] overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Photo</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className={
                      selectedId === item.id
                        ? 'border-l-4 border-l-sky-500 bg-sky-50/90'
                        : 'hover:bg-muted/40'
                    }
                  >
                    <TableCell>
                      <ItemCatalogThumb url={item.primary_image_url} name={item.name} />
                    </TableCell>
                    <TableCell className="font-medium">
                      <span>{item.name}</span>
                    </TableCell>
                    <TableCell>
                      <ItemBrandCell item={item} />
                    </TableCell>
                    <TableCell>{item.category || '-'}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.current_quantity}</TableCell>
                    <TableCell>{item.min_quantity ?? '-'}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-slate-700" title={item.created_at || undefined}>
                      {formatDateTimeIST(item.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => onLoadDetail(item.id)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </StoreSection>

      <StoreSection
        title="Edit item"      >
        {!selectedId ? (
          <StoreNotice tone="amber">Select an item from the table above.</StoreNotice>
        ) : itemDetail ? (
          <form onSubmit={onSaveEdit} className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200/80 bg-slate-50/60 p-3">
              <ItemCatalogThumb
                url={itemDetail.primary_image_url || itemDetail.item_primary_image_url}
                name={itemDetail.name}
              />
             
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="item-edit-name" className="text-xs font-medium text-slate-600">
                  Name
                </label>
                <input
                  id="item-edit-name"
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className={`${itemFilterControlClass} w-full`}
                  required
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="item-edit-unit" className="text-xs font-medium text-slate-600">
                  Unit
                </label>
                {catalogUnits.length > 0 ? (
                  <select
                    id="item-edit-unit"
                    value={editForm.unit}
                    onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}
                    className={`${itemFilterControlClass} w-full`}
                    required
                  >
                    <option value="">Select unit…</option>
                    {editForm.unit && !catalogUnits.some((u) => u.abbreviation === editForm.unit) ? (
                      <option value={editForm.unit}>
                        {editForm.unit} (current)
                      </option>
                    ) : null}
                    {catalogUnits.map((u) => (
                      <option key={u.id || u.abbreviation} value={u.abbreviation}>
                        {u.name} ({u.abbreviation})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="item-edit-unit"
                    type="text"
                    value={editForm.unit}
                    onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}
                    className={`${itemFilterControlClass} w-full`}
                    required
                    autoComplete="off"
                  />
                )}
              </div>
              <div className="space-y-1">
                <label htmlFor="item-edit-category" className="text-xs font-medium text-slate-600">
                  Category
                </label>
                <input
                  id="item-edit-category"
                  type="text"
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                  className={`${itemFilterControlClass} w-full`}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="item-edit-min" className="text-xs font-medium text-slate-600">
                  Minimum quantity
                </label>
                <input
                  id="item-edit-min"
                  type="number"
                  min={0}
                  step="any"
                  value={editForm.min_quantity}
                  onChange={(e) => setEditForm((f) => ({ ...f, min_quantity: e.target.value }))}
                  className={`${itemFilterControlClass} w-full`}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="item-edit-brand" className="text-xs font-medium text-slate-600">
                  Brand
                </label>
                <select
                  id="item-edit-brand"
                  value={editForm.brand_id}
                  onChange={(e) => setEditForm((f) => ({ ...f, brand_id: e.target.value }))}
                  className={`${itemFilterControlClass} w-full`}
                >
                  <option value="">No brand</option>
                  {(brands || []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={editSaving}>
                {editSaving ? 'Saving…' : 'Save changes'}
              </Button>
              <Button type="button" variant="outline" disabled={editSaving} onClick={syncEditFormFromDetail}>
                Discard changes
              </Button>
            </div>
          </form>
        ) : (
          <StoreNotice tone="sky">Loading…</StoreNotice>
        )}
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreOperatorItemMasterPage;
