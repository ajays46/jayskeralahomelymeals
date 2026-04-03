import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompanyBasePath } from '../../context/TenantContext';
import { useKitchenInventoryMock } from '../../hooks/adminHook/kitchenStoreHook';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StorePageShell, StoreSection, StoreStatCard, StoreStatGrid } from '@/components/store/StorePageShell';

/** @feature kitchen-store — STORE_MANAGER: read-only inventory view by category. */

const UNCATEGORIZED = '__uncategorized__';

const controlClass =
  'h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100';

const isLowStock = (item) => Number(item.current_quantity) <= Number(item.min_quantity);

const InventoryBrandCell = ({ item }) => {
  const logoSrc = (item.brand_logo_s3_url || '').trim();
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

const StoreManagerInventoryViewPage = () => {
  const basePath = useCompanyBasePath();
  const { items, lowStockItems } = useKitchenInventoryMock();
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
        if (!inName && !inBrand) return false;
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
        if (statusFilter === 'healthy' && low) return false;
      }
      return true;
    });
  }, [items, search, categoryFilter, unitFilter, statusFilter]);

  const filtersActive =
    search.trim() !== '' || categoryFilter !== 'all' || unitFilter !== 'all' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setUnitFilter('all');
    setStatusFilter('all');
  };

  const tableDescription = filtersActive
    ? `Showing ${filteredItems.length} of ${items.length} items.`
    : 'Live inventory item list.';

  return (
    <StorePageShell>
      <StoreStatGrid>
        <StoreStatCard label="Inventory Items" value={items.length} />
        <StoreStatCard label="Low Stock Items" value={lowStockItems.length} />
        <StoreStatCard label="Units Tracked" value={new Set(items.map((item) => item.unit)).size} />
      </StoreStatGrid>
      <StoreSection title="Inventory Table" description={tableDescription}>
        <div className="mb-3 flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
            <label htmlFor="inv-filter-search" className="text-xs font-medium text-slate-600">
              Search name
            </label>
            <input
              id="inv-filter-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by item or brand name…"
              className={`${controlClass} w-full min-w-0`}
              autoComplete="off"
            />
          </div>
          <div className="flex min-w-[9rem] flex-col gap-1">
            <label htmlFor="inv-filter-category" className="text-xs font-medium text-slate-600">
              Category
            </label>
            <select
              id="inv-filter-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`${controlClass} w-full sm:w-auto`}
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
            <label htmlFor="inv-filter-unit" className="text-xs font-medium text-slate-600">
              Unit
            </label>
            <select
              id="inv-filter-unit"
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className={`${controlClass} w-full sm:w-auto`}
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
            <label htmlFor="inv-filter-status" className="text-xs font-medium text-slate-600">
              Stock status
            </label>
            <select
              id="inv-filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`${controlClass} w-full sm:w-auto`}
            >
              <option value="all">All</option>
              <option value="low">Low stock</option>
              <option value="healthy">Healthy</option>
            </select>
          </div>
          {filtersActive ? (
            <Button type="button" variant="outline" size="sm" className="h-9 shrink-0" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
        <div className="max-h-[22rem] overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Min</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-sm text-slate-500">
                    No items match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const isLow = isLowStock(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <InventoryBrandCell item={item} />
                      </TableCell>
                      <TableCell>{item.category || '-'}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.current_quantity}</TableCell>
                      <TableCell>{item.min_quantity}</TableCell>
                      <TableCell>
                        <Badge variant={isLow ? 'warning' : 'secondary'}>
                          {isLow ? 'Low stock' : 'Healthy'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link to={`${basePath}/store-operator/item/${item.id}`}>View Timeline</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerInventoryViewPage;

