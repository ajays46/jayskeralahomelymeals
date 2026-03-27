import React, { useMemo, useState } from 'react';
import { useKitchenInventoryMock } from '../../hooks/adminHook/kitchenStoreHook';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StorePageShell, StoreSection } from '@/components/store/StorePageShell';

function movementDayKey(value) {
  if (value == null || value === '') return '';
  const s = String(value);
  const dayPart = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dayPart)) return dayPart;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

const movementFilterControlClass =
  'h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100';

const StoreManagerStockLogsPage = () => {
  const { movements } = useKitchenInventoryMock();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deltaFilter, setDeltaFilter] = useState('all');

  const typeOptions = useMemo(() => {
    const set = new Set(movements.map((m) => String(m.movement_type || '').trim()).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [movements]);

  const filteredMovements = useMemo(() => {
    const q = search.trim().toLowerCase();
    return movements.filter((movement) => {
      if (typeFilter !== 'all' && String(movement.movement_type || '') !== typeFilter) return false;
      const day = movementDayKey(movement.occurred_at);
      if (dateFrom && (!day || day < dateFrom)) return false;
      if (dateTo && (!day || day > dateTo)) return false;
      if (deltaFilter === 'in' && !(Number(movement.delta) >= 0)) return false;
      if (deltaFilter === 'out' && !(Number(movement.delta) < 0)) return false;
      if (q) {
        const name = (movement.item_name || '').toLowerCase();
        const note = (movement.note || '').toLowerCase();
        const itemId = String(movement.item_id || '').toLowerCase();
        if (!name.includes(q) && !note.includes(q) && !itemId.includes(q)) return false;
      }
      return true;
    });
  }, [movements, search, typeFilter, dateFrom, dateTo, deltaFilter]);

  const movementFiltersActive =
    search.trim() !== '' || typeFilter !== 'all' || dateFrom !== '' || dateTo !== '' || deltaFilter !== 'all';

  const clearMovementFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setDateFrom('');
    setDateTo('');
    setDeltaFilter('all');
  };

  return (
    <StorePageShell>
      <StoreSection
        title="Movement Log"
        description={
          movementFiltersActive ? `Showing ${filteredMovements.length} of ${movements.length} movements.` : undefined
        }
      >
        <div className="mb-3 flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
            <label htmlFor="mgr-mov-search" className="text-xs font-medium text-slate-600">
              Search
            </label>
            <input
              id="mgr-mov-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Item, note, or item id…"
              className={`${movementFilterControlClass} w-full min-w-0`}
              autoComplete="off"
            />
          </div>
          <div className="flex min-w-[9rem] flex-col gap-1">
            <label htmlFor="mgr-mov-type" className="text-xs font-medium text-slate-600">
              Type
            </label>
            <select
              id="mgr-mov-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={`${movementFilterControlClass} w-full sm:w-auto`}
            >
              <option value="all">All types</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-[9rem] flex-col gap-1">
            <label htmlFor="mgr-mov-delta" className="text-xs font-medium text-slate-600">
              Delta
            </label>
            <select
              id="mgr-mov-delta"
              value={deltaFilter}
              onChange={(e) => setDeltaFilter(e.target.value)}
              className={`${movementFilterControlClass} w-full sm:w-auto`}
            >
              <option value="all">Any</option>
              <option value="in">In / zero</option>
              <option value="out">Out</option>
            </select>
          </div>
          <div className="flex min-w-[9rem] flex-col gap-1">
            <label htmlFor="mgr-mov-from" className="text-xs font-medium text-slate-600">
              From date
            </label>
            <input
              id="mgr-mov-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`${movementFilterControlClass} w-full sm:w-auto`}
            />
          </div>
          <div className="flex min-w-[9rem] flex-col gap-1">
            <label htmlFor="mgr-mov-to" className="text-xs font-medium text-slate-600">
              To date
            </label>
            <input
              id="mgr-mov-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`${movementFilterControlClass} w-full sm:w-auto`}
            />
          </div>
          {movementFiltersActive ? (
            <Button type="button" variant="outline" size="sm" className="h-9 shrink-0" onClick={clearMovementFilters}>
              Clear filters
            </Button>
          ) : null}
        </div>
        <div className="max-h-[22rem] overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Delta</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
                    {movements.length === 0 ? 'No movements loaded.' : 'No movements match the current filters.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMovements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{new Date(movement.occurred_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{movement.movement_type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{movement.item_name}</TableCell>
                    <TableCell>{movement.quantity}</TableCell>
                    <TableCell className={movement.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {movement.delta}
                    </TableCell>
                    <TableCell>{movement.note || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerStockLogsPage;

