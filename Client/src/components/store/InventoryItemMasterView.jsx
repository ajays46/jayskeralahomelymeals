import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageShell, StoreSection, StoreStatCard, StoreStatGrid } from '@/components/store/StorePageShell';
import { CreateInventoryItemSection } from '@/components/store/CreateInventoryItemSection';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import {
  fetchInventoryCategoriesList,
  fetchInventoryItemsPage,
  fetchInventoryUnitsList,
  useKitchenInventoryMock
} from '../../hooks/adminHook/kitchenStoreHook';
import { showStoreError, showStoreSuccess } from '../../utils/toastConfig.jsx';
import { kitchenInventoryShowAddCategorySection } from '../../config/kitchenFeatureFlags.js';
import { MaxUiComboBox, MaxUiField, MaxUiTextBox } from '@/components/max-ui';
import {
  inferPrimaryUnitTypeFromItemName,
  rankInventoryUnitsForItemName,
  unitInferenceHint
} from '../../utils/inventoryUnitInference.js';

/** @feature kitchen-store — Shared inventory item master (operator + manager routes). */

const UNCATEGORIZED = '__uncategorized__';
const NO_BRAND = '__no_brand__';
/** Align with `CreateInventoryItemSection` / inventory API (FRONTEND_INVENTORY_CATEGORIES_AND_ITEMS.md). */
const CAT_NONE = '__none__';
const CAT_OTHER = '__other__';

const isLowStock = (item) => Number(item.current_quantity) <= Number(item.min_quantity);

/**
 * Min / qty fields: avoid `<input type="number">` showing values like "1.00" and match list API numbers cleanly.
 * Does not change magnitude — if the API stores `1` vs `100`, that comes from the server.
 */
function formatQuantityInputString(raw) {
  if (raw === '' || raw == null) return '';
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/,/g, '').trim());
  if (!Number.isFinite(n)) return '';
  if (Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
  return String(n);
}

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
  category_pick: CAT_NONE,
  category_custom: '',
  min_quantity: '',
  brand_id: ''
});

/** Map item detail + category list → edit form category fields. */
function categoryFieldsFromDetail(itemDetail, categories) {
  if (!itemDetail) return { category_pick: CAT_NONE, category_custom: '' };
  const rawId = itemDetail.category_id ?? itemDetail.categoryId;
  const cid = rawId != null && String(rawId).trim() !== '' ? String(rawId).trim() : '';
  const catName = String(itemDetail.category ?? '').trim();
  const list = Array.isArray(categories) ? categories : [];
  if (cid && list.some((c) => c.id === cid)) {
    return { category_pick: cid, category_custom: '' };
  }
  if (cid && catName) {
    return { category_pick: cid, category_custom: '' };
  }
  const byName = catName ? list.find((c) => c.name === catName) : null;
  if (byName) {
    return { category_pick: byName.id, category_custom: '' };
  }
  if (catName) {
    return { category_pick: CAT_OTHER, category_custom: catName };
  }
  return { category_pick: CAT_NONE, category_custom: '' };
}

function buildCategoryUpdatePayload(category_pick, category_custom, categories) {
  const list = Array.isArray(categories) ? categories : [];
  if (category_pick === CAT_NONE) {
    return { category: '' };
  }
  if (category_pick === CAT_OTHER) {
    const t = String(category_custom ?? '').trim();
    return t ? { category: t } : { category: '' };
  }
  const row = list.find((c) => c.id === category_pick);
  if (row) {
    return { category_id: row.id, category: row.name };
  }
  /* `category_id` from item detail before categories list loaded, or unknown id */
  if (category_pick && category_pick !== CAT_NONE && category_pick !== CAT_OTHER) {
    return { category_id: category_pick };
  }
  return {};
}

export default function InventoryItemMasterView({
  idPrefix,
  focusEditSectionOnSelect = false,
  /** Operator route: strip API / implementation-oriented labels and hints. */
  hideDevCopy = false
}) {
  const ids = useMemo(
    () => ({
      newCategory: `${idPrefix}-new-category`,
      filterSearch: `${idPrefix}-filter-search`,
      filterCategory: `${idPrefix}-filter-category`,
      filterBrand: `${idPrefix}-filter-brand`,
      filterUnit: `${idPrefix}-filter-unit`,
      filterStock: `${idPrefix}-filter-stock`,
      pageSize: `${idPrefix}-page-size`,
      listPrev: `${idPrefix}-list-prev`,
      listNext: `${idPrefix}-list-next`,
      editName: `${idPrefix}-edit-name`,
      editUnit: `${idPrefix}-edit-unit`,
      editCategory: `${idPrefix}-edit-category`,
      editCategoryCustom: `${idPrefix}-edit-category-custom`,
      editCategoryFallback: `${idPrefix}-edit-category-fallback`,
      editMin: `${idPrefix}-edit-min`,
      editBrand: `${idPrefix}-edit-brand`
    }),
    [idPrefix]
  );
  const editSectionRef = useRef(null);
  const pendingEditFocusRef = useRef(false);
  const loadDetailTokenRef = useRef(0);
  /** Server snapshot for the loaded row — avoid replacing unit until name changes or user clears unit. */
  const baselineInventoryItemRef = useRef({ name: '', unit: '' });
  const prevSuggestedEditUnitRef = useRef('');
  /** WEIGHT/VOLUME/COUNT — when it changes while editing name, refresh unit even if abbrev matched before (rice kg → egg). */
  const prevInferredPrimaryEditRef = useRef(null);
  /** Skip one auto unit pass after `editForm` is reset from `itemDetail` (avoid stale closure vs server row). */
  const skipAutoUnitSuggestRef = useRef(false);

  const { items, getItemDetail, nearExpiryByItemId, updateItem, refreshItems, brands } = useKitchenInventoryMock();
  const [query, setQuery] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [unitFilter, setUnitFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [stockStatusFilter, setStockStatusFilter] = useState('all');
  /** Server-paginated rows for the table (`GET …/items?page&page_size&q&category`). */
  const [listItems, setListItems] = useState([]);
  const [listTotal, setListTotal] = useState(0);
  const [listPage, setListPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(20);
  const [listLoading, setListLoading] = useState(false);
  const [listRefreshTick, setListRefreshTick] = useState(0);
  const [selectedId, setSelectedId] = useState('');
  const [itemDetail, setItemDetail] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [status, setStatus] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [catalogUnits, setCatalogUnits] = useState([]);
  const [inventoryCategories, setInventoryCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);

  const loadInventoryCategories = async () => {
    const list = await fetchInventoryCategoriesList();
    setInventoryCategories(list);
    return list;
  };

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

  useEffect(() => {
    const t = window.setTimeout(() => setQDebounced(query.trim()), 350);
    return () => window.clearTimeout(t);
  }, [query]);

  useLayoutEffect(() => {
    setListPage(1);
  }, [qDebounced, categoryFilter, listPageSize]);

  useEffect(() => {
    let cancelled = false;
    setListLoading(true);
    void (async () => {
      try {
        const req = { page: listPage, page_size: listPageSize };
        if (qDebounced) req.q = qDebounced;
        if (categoryFilter === UNCATEGORIZED) {
          req.category = '';
        } else if (categoryFilter !== 'all') {
          req.category = categoryFilter;
        }
        const res = await fetchInventoryItemsPage(req);
        if (cancelled) return;
        setListItems(res.items);
        setListTotal(res.total);
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [listPage, listPageSize, qDebounced, categoryFilter, listRefreshTick]);

  const listPageCount = Math.max(1, Math.ceil((listTotal || 0) / listPageSize) || 1);

  useEffect(() => {
    if (listPage > listPageCount) setListPage(listPageCount);
  }, [listPage, listPageCount]);

  useEffect(() => {
    if (!itemDetail) {
      baselineInventoryItemRef.current = { name: '', unit: '' };
      prevSuggestedEditUnitRef.current = '';
      prevInferredPrimaryEditRef.current = null;
      return;
    }
    baselineInventoryItemRef.current = {
      name: String(itemDetail.name ?? '').trim(),
      unit: String(itemDetail.unit ?? '').trim()
    };
    prevSuggestedEditUnitRef.current = '';
    prevInferredPrimaryEditRef.current = null;
  }, [itemDetail?.id, itemDetail?.name, itemDetail?.unit]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await loadInventoryCategories();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { namedCategories, hasUncategorized, units, brandNames, hasNoBrandItem } = useMemo(() => {
    const catSet = new Set();
    inventoryCategories.forEach((c) => {
      if (c.name) catSet.add(c.name.trim());
    });
    let uncat = false;
    items.forEach((item) => {
      const c = (item.category || '').trim();
      if (!c) uncat = true;
      else catSet.add(c);
    });
    const unitList = catalogUnits
      .map((u) => u.abbreviation)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    const brandList = (brands || [])
      .map((b) => String(b.name || '').trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    const noBrand = items.some((it) => !(it.brand_name || '').trim());
    return {
      namedCategories: [...catSet].sort((a, b) => a.localeCompare(b)),
      hasUncategorized: uncat,
      units: unitList,
      brandNames: brandList,
      hasNoBrandItem: noBrand
    };
  }, [items, inventoryCategories, catalogUnits, brands]);

  /** Client-only refinements on the current server page (API does not filter by unit/brand/stock). */
  const visibleRows = useMemo(() => {
    return listItems.filter((it) => {
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
  }, [listItems, unitFilter, brandFilter, stockStatusFilter, nearExpiryByItemId]);

  const itemFiltersActive =
    query.trim() !== '' ||
    categoryFilter !== 'all' ||
    unitFilter !== 'all' ||
    brandFilter !== 'all' ||
    stockStatusFilter !== 'all';

  const clientOnlyFiltersActive =
    unitFilter !== 'all' || brandFilter !== 'all' || stockStatusFilter !== 'all';

  const clearItemFilters = () => {
    setQuery('');
    setCategoryFilter('all');
    setUnitFilter('all');
    setBrandFilter('all');
    setStockStatusFilter('all');
  };

  const editUnitRanking = useMemo(
    () => rankInventoryUnitsForItemName(editForm.name, catalogUnits),
    [editForm.name, catalogUnits]
  );
  const {
    orderedUnits: editOrderedUnits,
    suggestedGroup: editSuggestedGroup,
    otherGroup: editOtherGroup,
    primaryUnitType: editPrimaryUnitType
  } = editUnitRanking;
  const editUnitHint = unitInferenceHint(editPrimaryUnitType, editForm.name);

  useEffect(() => {
    if (!itemDetail) {
      setEditForm(emptyEditForm());
      return;
    }
    skipAutoUnitSuggestRef.current = true;
    const bid = itemDetail.brand_id ?? itemDetail.brandId;
    const cf = categoryFieldsFromDetail(itemDetail, inventoryCategories);
    setEditForm({
      name: String(itemDetail.name ?? ''),
      unit: String(itemDetail.unit ?? ''),
      category_pick: cf.category_pick,
      category_custom: cf.category_custom,
      min_quantity:
        itemDetail.min_quantity != null && itemDetail.min_quantity !== ''
          ? formatQuantityInputString(itemDetail.min_quantity)
          : '',
      brand_id: bid != null && String(bid).trim() !== '' ? String(bid) : ''
    });
  }, [itemDetail, inventoryCategories]);

  const onLoadDetail = async (itemId) => {
    const token = ++loadDetailTokenRef.current;
    setSelectedId(itemId);
    setItemDetail(null);
    const detail = await getItemDetail(itemId);
    if (token !== loadDetailTokenRef.current) return;
    setItemDetail(detail);
    if (detail) pendingEditFocusRef.current = true;
  };

  useEffect(() => {
    if (!pendingEditFocusRef.current || !itemDetail) return;
    const rid = itemDetail.id ?? itemDetail.itemId;
    if (rid == null || String(rid) !== String(selectedId)) {
      pendingEditFocusRef.current = false;
      return;
    }
    pendingEditFocusRef.current = false;
    const idName = `${idPrefix}-edit-name`;

    const focusNameField = () => {
      const input = document.getElementById(idName);
      if (!input || typeof input.focus !== 'function') return;
      input.focus({ preventScroll: true });
      if (typeof input.setSelectionRange === 'function') {
        try {
          const len = String(input.value ?? '').length;
          input.setSelectionRange(len, len);
        } catch {
          /* read-only or wrong input type */
        }
      }
    };

    let focusTimeoutId;
    let innerRafId = null;
    const scrollDelayMs = focusEditSectionOnSelect ? 480 : 400;

    const outerRafId = requestAnimationFrame(() => {
      innerRafId = requestAnimationFrame(() => {
        innerRafId = null;
        editSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        focusTimeoutId = window.setTimeout(focusNameField, scrollDelayMs);
      });
    });

    return () => {
      cancelAnimationFrame(outerRafId);
      if (innerRafId != null) cancelAnimationFrame(innerRafId);
      if (focusTimeoutId != null) window.clearTimeout(focusTimeoutId);
    };
  }, [itemDetail, selectedId, focusEditSectionOnSelect, idPrefix]);

  const syncEditFormFromDetail = () => {
    if (!itemDetail) return;
    prevSuggestedEditUnitRef.current = '';
    prevInferredPrimaryEditRef.current = null;
    skipAutoUnitSuggestRef.current = true;
    const bid = itemDetail.brand_id ?? itemDetail.brandId;
    const cf = categoryFieldsFromDetail(itemDetail, inventoryCategories);
    setEditForm({
      name: String(itemDetail.name ?? ''),
      unit: String(itemDetail.unit ?? ''),
      category_pick: cf.category_pick,
      category_custom: cf.category_custom,
      min_quantity:
        itemDetail.min_quantity != null && itemDetail.min_quantity !== ''
          ? formatQuantityInputString(itemDetail.min_quantity)
          : '',
      brand_id: bid != null && String(bid).trim() !== '' ? String(bid) : ''
    });
  };

  useEffect(() => {
    if (!itemDetail || !catalogUnits.length) return;
    if (skipAutoUnitSuggestRef.current) {
      skipAutoUnitSuggestRef.current = false;
      return;
    }
    const primary = inferPrimaryUnitTypeFromItemName(editForm.name);
    const primaryChanged = prevInferredPrimaryEditRef.current !== primary;
    prevInferredPrimaryEditRef.current = primary;
    if (!primary) return;
    const { suggestedAbbrev: next } = rankInventoryUnitsForItemName(editForm.name, catalogUnits);
    if (!next) return;

    const loadedName = baselineInventoryItemRef.current.name;
    const loadedUnit = baselineInventoryItemRef.current.unit;
    const nameNow = editForm.name.trim();
    const nameEdited = nameNow !== loadedName;

    setEditForm((f) => {
      const cur = f.unit.trim();
      if (!nameEdited && cur === loadedUnit && loadedUnit !== '') return f;

      const userOverrodeUnit = cur !== '' && cur !== prevSuggestedEditUnitRef.current;
      if (userOverrodeUnit && !primaryChanged) return f;

      const unitStillBaseline = cur === loadedUnit && loadedUnit !== '';
      const allowAuto =
        primaryChanged ||
        cur === '' ||
        cur === prevSuggestedEditUnitRef.current ||
        (nameEdited && unitStillBaseline);

      if (!allowAuto) return f;

      prevSuggestedEditUnitRef.current = next;
      return cur === next ? f : { ...f, unit: next };
    });
  }, [editForm.name, catalogUnits, itemDetail?.id]);

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

    const categoryPayload = buildCategoryUpdatePayload(
      editForm.category_pick,
      editForm.category_custom,
      inventoryCategories
    );

    const payload = {
      name,
      unit,
      ...categoryPayload,
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
      setListRefreshTick((t) => t + 1);
    } else {
      const msg = out.message || 'Update failed.';
      setStatus(msg);
      showStoreError(msg, 'Save failed');
    }
  };

  const onAddInventoryCategory = async (e) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) {
      showStoreError('Enter a category name.', 'Validation');
      return;
    }
    setCategorySaving(true);
    try {
      await api.post(`${API.MAX_KITCHEN_INVENTORY}/categories`, {
        name,
        display_order: inventoryCategories.length
      });
      setNewCategoryName('');
      showStoreSuccess('Category added.', 'Saved');
      await loadInventoryCategories();
    } catch (err) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail || err?.response?.data?.message;
      if (status === 409) {
        showStoreError('Category already exists for this company.', 'Conflict');
      } else {
        showStoreError(typeof detail === 'string' ? detail : 'Failed to create category.', 'Save failed');
      }
    } finally {
      setCategorySaving(false);
    }
  };

  return (
    <StorePageShell>
      {status ? <StoreNotice tone="sky">{status}</StoreNotice> : null}

      {hideDevCopy ? null : (
        <StoreStatGrid>
          <StoreStatCard label="Total in catalog" value={items.length} tone="violet" />
          <StoreStatCard label="Matches (name/category)" value={listTotal} tone="sky" />
        </StoreStatGrid>
      )}

      {kitchenInventoryShowAddCategorySection() ? (
        <StoreSection title="Add category" tone="violet">
          <form onSubmit={onAddInventoryCategory} className="flex max-w-xl flex-wrap items-end gap-2">
            <MaxUiTextBox
              label="New category name"
              id={ids.newCategory}
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., Beverages"
              autoComplete="off"
              fieldClassName="min-w-[12rem] flex-1"
            />
            <Button type="submit" size="sm" className="h-9 shrink-0" disabled={categorySaving}>
              {categorySaving ? 'Saving…' : 'Add category'}
            </Button>
          </form>
        </StoreSection>
      ) : null}

      <CreateInventoryItemSection
        idPrefix={idPrefix}
        description={hideDevCopy ? '' : undefined}
        onItemCreated={() => {
          void refreshItems();
          void loadInventoryCategories();
          setListRefreshTick((t) => t + 1);
        }}
        showPrimaryImage={false}
        inventoryCategories={inventoryCategories}
        suppressFieldHints={hideDevCopy}
      />

      <StoreSection
        title="Items"
        description={
          hideDevCopy
            ? undefined
            : itemFiltersActive
              ? `Server list: page ${listPage} of ${listPageCount} (${listTotal} matches). ${visibleRows.length} row(s) on this page after unit/brand/stock filters.`
              : `Paged list (${listPageSize} per page). Search matches item name; category filter is an exact category string. Use Edit to update SKU fields.`
        }
        tone="sky"
      >
        <div className="mb-3 flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 sm:flex-row sm:flex-wrap sm:items-end">
          <MaxUiTextBox
            label={hideDevCopy ? 'Search' : 'Search (item name)'}
            id={ids.filterSearch}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={hideDevCopy ? 'Search by item name' : 'Substring on item name (server)'}
            autoComplete="off"
            fieldClassName="min-w-[12rem] flex-1"
            controlClassName="min-w-0"
          />
          <MaxUiComboBox
            label="Category"
            id={ids.filterCategory}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            fieldClassName="min-w-[9rem]"
            controlClassName="w-full sm:w-auto"
          >
            <option value="all">All categories</option>
            {hasUncategorized ? <option value={UNCATEGORIZED}>No category</option> : null}
            {namedCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </MaxUiComboBox>
          <MaxUiComboBox
            label="Brand"
            id={ids.filterBrand}
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            fieldClassName="min-w-[9rem]"
            controlClassName="w-full sm:w-auto"
          >
            <option value="all">All brands</option>
            {hasNoBrandItem ? <option value={NO_BRAND}>No brand</option> : null}
            {brandNames.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </MaxUiComboBox>
          <MaxUiComboBox
            label="Unit"
            id={ids.filterUnit}
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            fieldClassName="min-w-[7rem]"
            controlClassName="w-full sm:w-auto"
          >
            <option value="all">All units</option>
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </MaxUiComboBox>
          <MaxUiComboBox
            label="Stock status"
            id={ids.filterStock}
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            fieldClassName="min-w-[9rem]"
            controlClassName="w-full sm:w-auto"
          >
            <option value="all">All</option>
            <option value="low">Low</option>
            <option value="ok">OK</option>
            <option value="near_expiry">Near expiry</option>
          </MaxUiComboBox>
          {itemFiltersActive ? (
            <Button type="button" variant="outline" size="sm" className="h-9 shrink-0" onClick={clearItemFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
        {clientOnlyFiltersActive && !hideDevCopy ? (
          <StoreNotice tone="sky">
            Unit, brand, and stock status narrow the rows on the current page only (the API does not accept those query
            parameters).
          </StoreNotice>
        ) : null}
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span>
              Page <span className="font-medium text-slate-800">{listPage}</span> of{' '}
              <span className="font-medium text-slate-800">{listPageCount}</span>
              {listLoading ? <span className="ml-2 text-slate-400">Loading…</span> : null}
            </span>
            <Button
              type="button"
              id={ids.listPrev}
              variant="outline"
              size="sm"
              className="h-8"
              disabled={listLoading || listPage <= 1}
              onClick={() => setListPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              id={ids.listNext}
              variant="outline"
              size="sm"
              className="h-8"
              disabled={listLoading || listPage >= listPageCount}
              onClick={() => setListPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
          <MaxUiComboBox
            label="Per page"
            id={ids.pageSize}
            value={String(listPageSize)}
            onChange={(e) => setListPageSize(Number(e.target.value) || 20)}
            fieldClassName="min-w-[6rem]"
            controlClassName="w-full sm:w-auto"
          >
            <option value="20">20</option>
            <option value="30">30</option>
            <option value="40">40</option>
          </MaxUiComboBox>
        </div>
        {listLoading && listItems.length === 0 ? (
          <StoreNotice tone="sky">Loading items…</StoreNotice>
        ) : !listLoading && listItems.length === 0 ? (
          <StoreNotice tone="amber">
            {hideDevCopy ? 'No items found.' : 'No items on this page (try another page or clear filters).'}
          </StoreNotice>
        ) : visibleRows.length === 0 ? (
          <StoreNotice tone="amber">
            {hideDevCopy ? 'No items match these filters.' : 'No rows match unit/brand/stock filters on this page.'}
          </StoreNotice>
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
                {visibleRows.map((item) => (
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

      <div
        ref={editSectionRef}
        className={focusEditSectionOnSelect ? 'scroll-mt-28' : 'scroll-mt-24'}
      >
        <StoreSection title="Edit item">
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
              <MaxUiTextBox
                label="Name"
                id={ids.editName}
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                required
                autoComplete="off"
                fieldClassName="sm:col-span-2"
              />
              {catalogUnits.length > 0 ? (
                <MaxUiComboBox
                  label="Unit"
                  id={ids.editUnit}
                  value={editForm.unit}
                  onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}
                  required
                  hint={hideDevCopy ? undefined : editUnitHint || undefined}
                >
                  <option value="">Select unit…</option>
                  {editForm.unit && !catalogUnits.some((u) => u.abbreviation === editForm.unit) ? (
                    <option value={editForm.unit}>
                      {hideDevCopy ? editForm.unit : `${editForm.unit} (current)`}
                    </option>
                  ) : null}
                  {editPrimaryUnitType && editOtherGroup.length > 0 ? (
                    <>
                      <optgroup
                        label={hideDevCopy ? 'Suggested' : `Likely (${editPrimaryUnitType.toLowerCase()})`}
                      >
                        {editSuggestedGroup.map((u) => (
                          <option key={`${u.id}-${u.abbreviation}`} value={u.abbreviation}>
                            {u.name} ({u.abbreviation})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label={hideDevCopy ? 'More units' : 'Other units'}>
                        {editOtherGroup.map((u) => (
                          <option key={`${u.id}-${u.abbreviation}`} value={u.abbreviation}>
                            {u.name} ({u.abbreviation})
                          </option>
                        ))}
                      </optgroup>
                    </>
                  ) : (
                    editOrderedUnits.map((u) => (
                      <option key={`${u.id}-${u.abbreviation}`} value={u.abbreviation}>
                        {u.name} ({u.abbreviation})
                      </option>
                    ))
                  )}
                </MaxUiComboBox>
              ) : (
                <MaxUiTextBox
                  label="Unit"
                  id={ids.editUnit}
                  type="text"
                  value={editForm.unit}
                  onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}
                  required
                  autoComplete="off"
                />
              )}
              {inventoryCategories.length > 0 ? (
                <MaxUiField label="Category" htmlFor={ids.editCategory} className="space-y-1 sm:col-span-2">
                  <MaxUiComboBox
                    id={ids.editCategory}
                    value={editForm.category_pick}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        category_pick: e.target.value,
                        category_custom: e.target.value === CAT_OTHER ? f.category_custom : ''
                      }))
                    }
                  >
                    <option value={CAT_NONE}>Select category…</option>
                    {[CAT_NONE, CAT_OTHER].includes(editForm.category_pick) ||
                    inventoryCategories.some((c) => c.id === editForm.category_pick) ? null : (
                      <option value={editForm.category_pick}>
                        {hideDevCopy
                          ? (itemDetail?.category || '').trim() || 'Current category'
                          : `${(itemDetail?.category || '').trim() || 'Current category'} (current id)`}
                      </option>
                    )}
                    {inventoryCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    <option value={CAT_OTHER}>{hideDevCopy ? 'Other (type name)' : 'Other — type a new name'}</option>
                  </MaxUiComboBox>
                  {editForm.category_pick === CAT_OTHER ? (
                    <MaxUiTextBox
                      id={ids.editCategoryCustom}
                      type="text"
                      value={editForm.category_custom}
                      onChange={(e) => setEditForm((f) => ({ ...f, category_custom: e.target.value }))}
                      placeholder={
                        hideDevCopy ? 'Category name' : 'Category name (ensured in inventory_categories on save)'
                      }
                      autoComplete="off"
                      className="mt-2 w-full"
                    />
                  ) : null}
                </MaxUiField>
              ) : (
                <MaxUiField
                  label="Category"
                  htmlFor={ids.editCategoryFallback}
                  className="space-y-1 sm:col-span-2"
                  hint={
                    hideDevCopy
                      ? undefined
                      : 'No categories from API yet — free text sends the category string on save (guide option B).'
                  }
                >
                  <MaxUiTextBox
                    id={ids.editCategoryFallback}
                    type="text"
                    value={editForm.category_pick === CAT_NONE ? '' : editForm.category_custom}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditForm((f) => ({
                        ...f,
                        category_pick: v.trim() === '' ? CAT_NONE : CAT_OTHER,
                        category_custom: v
                      }));
                    }}
                    placeholder="Leave empty for uncategorized, or type a category name"
                    autoComplete="off"
                  />
                </MaxUiField>
              )}
              <MaxUiTextBox
                label="Minimum quantity"
                id={ids.editMin}
                type="text"
                inputMode="decimal"
                value={editForm.min_quantity}
                onChange={(e) => setEditForm((f) => ({ ...f, min_quantity: e.target.value }))}
                placeholder="0"
                autoComplete="off"
              />
              <MaxUiComboBox
                label="Brand"
                id={ids.editBrand}
                value={editForm.brand_id}
                onChange={(e) => setEditForm((f) => ({ ...f, brand_id: e.target.value }))}
              >
                <option value="">No brand</option>
                {(brands || []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </MaxUiComboBox>
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
      </div>
    </StorePageShell>
  );
}
