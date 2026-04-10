import React, { useEffect, useMemo, useState } from 'react';
import useAuthStore from '../../stores/Zustand.store';
import {
  dbDayOfWeekFromDate,
  fetchKitchenCatalogMenus,
  getConfiguredKitchenMenuIds,
  KITCHEN_MENU_KIND,
  persistKitchenMenuIds,
  useKitchenWeeklyRecipeBom
} from '../../hooks/adminHook/kitchenStoreHook';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import Skeleton from '../../components/Skeleton';
import { showStoreError, showStoreSuccess } from '../../utils/toastConfig.jsx';

/** @feature kitchen-store — By-kind weekly schedule + local day/session filter + recipe BOM. */
const MEAL_SLOTS = ['BREAKFAST', 'LUNCH', 'DINNER'];

const defaultDateStr = () => new Date().toISOString().slice(0, 10);

const weekdayLabel = (dow) => {
  const names = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return names[dow] || '';
};

const StoreOperatorRecipeBomPage = () => {
  const { user } = useAuthStore();
  const roleString = String(user?.role || '').toUpperCase();
  const roles = (Array.isArray(user?.roles) ? user.roles : roleString ? [roleString] : []).map((r) =>
    String(r).toUpperCase()
  );
  const isStoreManager = roles.includes('STORE_MANAGER') || roleString === 'STORE_MANAGER';

  const [menuKind, setMenuKind] = useState(KITCHEN_MENU_KIND.VEG);
  const [dateStr, setDateStr] = useState(defaultDateStr);
  const [mealSlot, setMealSlot] = useState('DINNER');
  const [scheduleReloadKey, setScheduleReloadKey] = useState(0);
  const [vegMenuDraft, setVegMenuDraft] = useState(() => getConfiguredKitchenMenuIds().vegMenuId);
  const [nonVegMenuDraft, setNonVegMenuDraft] = useState(() => getConfiguredKitchenMenuIds().nonVegMenuId);

  const rawRoutesEnv =
    String(import.meta.env.VITE_KITCHEN_USE_RAW_MENU_ROUTES || '').toLowerCase() === 'true';

  const [catalogMenus, setCatalogMenus] = useState([]);
  const [catalogStatus, setCatalogStatus] = useState('idle');
  const [catalogError, setCatalogError] = useState('');
  const [selectedCatalogMenuId, setSelectedCatalogMenuId] = useState('');

  const dayOfWeek = useMemo(() => {
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dbDayOfWeekFromDate(new Date());
    return dbDayOfWeekFromDate(new Date(y, m - 1, d));
  }, [dateStr]);

  const {
    weeklySlot,
    slotStatus,
    scheduleStatus,
    scheduleError,
    schedulePayload,
    scheduleApiMode,
    recipeLines,
    recipeStatus,
    recipeError,
    saveWeeklySlot,
    searchMenuCombos,
    fetchRecipeLinesForMenuItem,
    upsertRecipeLineForMenuItem,
    searchInventoryItems
  } = useKitchenWeeklyRecipeBom({
    menuKind,
    dayOfWeek,
    mealSlot,
    scheduleReloadKey,
    selectedMenuId: selectedCatalogMenuId
  });

  useEffect(() => {
    let cancelled = false;
    setCatalogStatus('loading');
    setCatalogError('');
    fetchKitchenCatalogMenus()
      .then((items) => {
        if (!cancelled) {
          setCatalogMenus(items);
          setCatalogStatus('ok');
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setCatalogMenus([]);
          setCatalogError(
            e?.response?.data?.message || e?.response?.data?.detail || e?.message || 'Failed to load menus'
          );
          setCatalogStatus('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerResults, setPickerResults] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const [invSearch, setInvSearch] = useState('');
  const [invOptions, setInvOptions] = useState([]);
  const [addInvId, setAddInvId] = useState('');
  const [addQty, setAddQty] = useState('0.1');
  const [addUnit, setAddUnit] = useState('kg');

  const [rowDrafts, setRowDrafts] = useState({});

  const comboLabel =
    weeklySlot?.menu_item_display_name || weeklySlot?.menu_item_name || weeklySlot?.display_name || '';

  const menuItemId = weeklySlot?.menu_item_id ? String(weeklySlot.menu_item_id) : '';

  useEffect(() => {
    const next = {};
    recipeLines.forEach((l) => {
      next[l.id] = {
        quantity_per_unit: String(l.quantity_per_unit ?? ''),
        unit: l.unit || ''
      };
    });
    setRowDrafts(next);
  }, [recipeLines]);

  useEffect(() => {
    if (!menuItemId) {
      fetchRecipeLinesForMenuItem('');
      return;
    }
    fetchRecipeLinesForMenuItem(menuItemId);
  }, [menuItemId, fetchRecipeLinesForMenuItem]);

  useEffect(() => {
    if (!pickerOpen) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setPickerLoading(true);
      const items = await searchMenuCombos(pickerQuery, 200);
      if (!cancelled) {
        setPickerResults(items);
        setPickerLoading(false);
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [pickerOpen, pickerQuery, searchMenuCombos]);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      const list = await searchInventoryItems(invSearch.trim() || undefined);
      if (!cancelled) setInvOptions(list);
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [invSearch, searchInventoryItems]);

  const onAssignCombo = async (combo) => {
    if (!combo?.id) return;
    const out = await saveWeeklySlot({
      day_of_week: dayOfWeek,
      meal_slot: mealSlot,
      menu_item_id: combo.id
    });
    if (!out.ok) {
      showStoreError(out.message || 'Could not assign combo');
      return;
    }
    showStoreSuccess('Meal for this slot updated.');
    setPickerOpen(false);
    await fetchRecipeLinesForMenuItem(combo.id);
  };

  const onSaveRow = async (line) => {
    if (!isStoreManager || !menuItemId) return;
    const draft = rowDrafts[line.id];
    if (!draft) return;
    const qty = Number(draft.quantity_per_unit);
    if (!Number.isFinite(qty) || qty < 0) {
      showStoreError('Enter a valid quantity.');
      return;
    }
    const out = await upsertRecipeLineForMenuItem({
      menu_item_id: menuItemId,
      inventory_item_id: line.inventory_item_id,
      quantity_per_unit: qty,
      unit: (draft.unit || '').trim() || line.unit
    });
    if (!out.ok) {
      showStoreError(out.message || 'Save failed');
      return;
    }
    showStoreSuccess('Recipe line saved.');
  };

  const onAddLine = async (e) => {
    e.preventDefault();
    if (!isStoreManager || !menuItemId) return;
    const item = invOptions.find((x) => x.id === addInvId);
    if (!item) {
      showStoreError('Pick an inventory item.');
      return;
    }
    const qty = Number(addQty);
    if (!Number.isFinite(qty) || qty < 0) {
      showStoreError('Enter a valid quantity.');
      return;
    }
    const out = await upsertRecipeLineForMenuItem({
      menu_item_id: menuItemId,
      inventory_item_id: item.id,
      quantity_per_unit: qty,
      unit: (addUnit || item.unit || '').trim() || 'kg'
    });
    if (!out.ok) {
      showStoreError(out.message || 'Add failed');
      return;
    }
    showStoreSuccess('Ingredient added.');
  };

  const slotLoading = slotStatus === 'loading' || scheduleStatus === 'loading';
  const slotNotFound = slotStatus === 'not_found';
  const scheduleLoadError = scheduleStatus === 'error';
  const recipeLoading = recipeStatus === 'loading';

  const resolvedMenuLabel =
    schedulePayload?.menu_kind === 'NON_VEG' || schedulePayload?.menu_kind === 'NONVEG'
      ? 'Non-veg'
      : schedulePayload?.menu_kind === 'VEG'
        ? 'Veg'
        : '';

  return (
    <StorePageShell>
      <StorePageHeader
        title={isStoreManager ? 'Recipe / BOM by week & session' : 'Meals & ingredients by week'}
        description={
          isStoreManager
            ? 'Pick a menu from your company catalog (below), or use veg / non-veg by-kind mode. We load the weekly schedule for that menu, then match your date’s weekday and session to show the combo and recipe.'
            : 'Choose the date, meal time (breakfast, lunch, or dinner), and veg or non-veg if needed. You can set which dish is on the schedule for that slot. Ingredient amounts are view-only—ask a store manager to change quantities or add items.'
        }
      />

      {isStoreManager ? (
        <StoreSection
          title="How schedule and recipe work"
          description="Two separate things: the weekly slot (which combo) vs the BOM (ingredients) for that combo."
          compact
        >
          <details className="group rounded-lg border border-slate-200/80 bg-slate-50/60 px-3 py-2">
            <summary className="cursor-pointer list-none text-sm font-medium text-slate-800 [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2">
                <span
                  className="inline-block transition-transform group-open:rotate-90 text-slate-500"
                  aria-hidden
                >
                  ›
                </span>
                Full guide (roles, data flow, API routes)
              </span>
            </summary>
            <div className="mt-3 space-y-4 text-sm text-slate-600 border-t border-slate-200/80 pt-3">
              <p>
                <strong className="text-slate-800">Weekly schedule</strong> stores which{' '}
                <code className="text-xs bg-white px-1 rounded border border-slate-200/80">menu_item_id</code> (combo) is assigned
                for each weekday + session. <strong className="text-slate-800">Recipe lines</strong> are the BOM for that combo.
                Changing the meal only updates the schedule; each combo has its own ingredients.
              </p>
              <div>
                <p className="font-medium text-slate-800 mb-2">Roles</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <strong>Operator or manager:</strong> view recipe lines, read/update weekly schedule, pick a combo (
                    <code className="text-xs bg-white px-1 rounded border border-slate-200/80">GET/PUT …/weekly-slot</code>,{' '}
                    <code className="text-xs bg-white px-1 rounded border border-slate-200/80">GET …/menu-items</code>).
                  </li>
                  <li>
                    <strong>Manager only:</strong> create/update recipe lines (
                    <code className="text-xs bg-white px-1 rounded border border-slate-200/80">
                      POST /kitchen-store/v2/recipes/lines
                    </code>
                    ).
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-slate-800 mb-2">This app (kitchen-store proxy)</p>
                <ul className="list-disc pl-5 space-y-1 font-mono text-xs text-slate-700">
                  <li>GET /kitchen-store/v2/menus/by-kind/veg|non_veg/weekly-schedule — or GET …/menus/&#123;menu_id&#125;/weekly-schedule</li>
                  <li>PUT /kitchen-store/v2/menus/…/weekly-slot — body: day_of_week, meal_slot, menu_item_id</li>
                  <li>GET /kitchen-store/v2/menus/…/menu-items?q= — combo picker</li>
                  <li>GET /kitchen-store/v2/recipes/lines?menu_item_id=…</li>
                  <li>POST /kitchen-store/v2/recipes/lines — manager only</li>
                  <li>GET /kitchen-store/v1/items — search SKUs when adding an ingredient</li>
                </ul>
              </div>
              <p className="text-slate-600">
                <strong className="text-slate-800">Date → weekday:</strong> the schedule uses Monday = 1 … Sunday = 7 (same as
                the label under Date).
              </p>
              <p className="text-amber-900/90 bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-2">
                Removing a recipe row is not supported until a delete API exists; quantities and new lines use POST upsert only.
              </p>
            </div>
          </details>
        </StoreSection>
      ) : (
        <StoreSection
          title="What you can do"
          description="Operators update the scheduled dish; ingredient edits stay with managers."
          compact
        >
          <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1.5 max-w-3xl">
            <li>Set which combo is planned for the chosen weekday and meal time (choose / change meal).</li>
            <li>See the ingredient list for that dish (read-only).</li>
            <li>
              Optional: select a company menu below so the schedule follows that menu; otherwise use veg / non-veg.
            </li>
          </ul>
        </StoreSection>
      )}

      <StoreSection title="Company menus (this tenant)">
        <p className="text-sm text-slate-600 mb-3 max-w-3xl">
          {isStoreManager ? (
            <>
              Rows from your <code className="text-xs bg-slate-100 px-1 rounded">menus</code> table. Select one to drive kitchen
              inventory weekly schedule and combo search for that <code className="text-xs bg-slate-100 px-1 rounded">menu_id</code>.
              Clear the selection to use veg / non-veg by-kind instead.
            </>
          ) : (
            <>
              Optional: choose your company menu so schedules and the dish picker use that menu. Clear the selection to use the
              veg / non-veg options in filters instead.
            </>
          )}
        </p>
        {catalogStatus === 'loading' ? (
          <p className="text-sm text-slate-500">Loading menus…</p>
        ) : catalogStatus === 'error' ? (
          <p className="text-sm text-red-600">{catalogError}</p>
        ) : catalogMenus.length === 0 ? (
          <p className="text-sm text-slate-500">No menus found for this company.</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">ID</TableHead>
                    <TableHead className="text-right w-[140px]">Use for schedule</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalogMenus.map((m) => {
                    const id = String(m.id ?? '');
                    const selected = selectedCatalogMenuId === id;
                    return (
                      <TableRow key={id} className={selected ? 'bg-teal-50/80' : ''}>
                        <TableCell className="font-medium text-slate-900">{m.name || '—'}</TableCell>
                        <TableCell className="text-slate-600">{m.status ?? '—'}</TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs text-slate-500">{id}</TableCell>
                        <TableCell className="text-right">
                          {selected ? (
                            <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedCatalogMenuId('')}>
                              Clear
                            </Button>
                          ) : (
                            <Button type="button" size="sm" onClick={() => setSelectedCatalogMenuId(id)}>
                              Select
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {selectedCatalogMenuId ? (
              <p className="mt-3 text-sm text-teal-800">
                {isStoreManager
                  ? 'Schedule + combo picker use this menu’s UUID. Veg / non-veg toggles are ignored until you clear.'
                  : 'Schedule and dish picker use this menu. Veg / non-veg toggles stay off until you clear.'}
              </p>
            ) : null}
          </>
        )}
      </StoreSection>

      {isStoreManager && rawRoutesEnv ? (
        <StoreSection title="Raw menu UUIDs (this browser)">
          <p className="text-sm text-slate-600 mb-3 max-w-3xl">
            Used only when <code className="text-xs bg-slate-100 px-1 rounded">VITE_KITCHEN_USE_RAW_MENU_ROUTES</code> is enabled.
            Save here or use <code className="text-xs bg-slate-100 px-1 rounded">VITE_KITCHEN_VEG_MENU_ID</code> /{' '}
            <code className="text-xs bg-slate-100 px-1 rounded">VITE_KITCHEN_NONVEG_MENU_ID</code> (or{' '}
            <code className="text-xs bg-slate-100 px-1 rounded">VITE_KITCHEN_NON_VEG_MENU_ID</code>).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
            <label className="text-sm font-medium text-slate-700">
              Veg menu ID
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                value={vegMenuDraft}
                onChange={(e) => setVegMenuDraft(e.target.value)}
                placeholder="UUID"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Non-veg menu ID
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                value={nonVegMenuDraft}
                onChange={(e) => setNonVegMenuDraft(e.target.value)}
                placeholder="UUID"
              />
            </label>
          </div>
          <Button
            type="button"
            className="mt-3"
            variant="secondary"
            onClick={() => {
              persistKitchenMenuIds(vegMenuDraft, nonVegMenuDraft);
              setScheduleReloadKey((k) => k + 1);
              showStoreSuccess('Menu UUIDs saved. Reloading schedule…');
            }}
          >
            Save menu UUIDs & reload
          </Button>
        </StoreSection>
      ) : null}

      <StoreSection
        title="Pick date, menu & session"
        description={
          isStoreManager
            ? 'The calendar date sets weekday (1–7) for the schedule row; session is BREAKFAST, LUNCH, or DINNER.'
            : 'Pick the day, then breakfast, lunch, or dinner. We use that day’s weekday to find the right slot on the schedule.'
        }
      >
        <div className="flex flex-wrap gap-4 items-end">
          <label className="text-sm font-medium text-slate-700">
            Date
            <input
              type="date"
              className="mt-1 block border rounded-lg px-3 py-2 text-sm"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />
          </label>
          <p className="text-sm text-slate-600 pb-2">
            Weekday: <span className="font-medium text-slate-800">{weekdayLabel(dayOfWeek)}</span>
            {isStoreManager ? (
              <>
                {' '}
                (day {dayOfWeek} in DB)
              </>
            ) : null}
          </p>
          <div
            className={`flex rounded-lg border border-slate-200 overflow-hidden ${selectedCatalogMenuId ? 'opacity-50 pointer-events-none' : ''}`}
            title={selectedCatalogMenuId ? 'Clear menu selection above to use veg / non-veg by-kind' : undefined}
          >
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium ${menuKind === KITCHEN_MENU_KIND.VEG ? 'bg-teal-600 text-white' : 'bg-white text-slate-700'}`}
              onClick={() => setMenuKind(KITCHEN_MENU_KIND.VEG)}
            >
              Veg menu
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium ${menuKind === KITCHEN_MENU_KIND.NON_VEG ? 'bg-teal-600 text-white' : 'bg-white text-slate-700'}`}
              onClick={() => setMenuKind(KITCHEN_MENU_KIND.NON_VEG)}
            >
              Non-veg menu
            </button>
          </div>
          <label className="text-sm font-medium text-slate-700">
            Session
            <select
              className="mt-1 block border rounded-lg px-3 py-2 text-sm min-w-[140px]"
              value={mealSlot}
              onChange={(e) => setMealSlot(e.target.value)}
            >
              {MEAL_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        {scheduleStatus === 'ok' && (resolvedMenuLabel || scheduleApiMode === 'company_catalog') ? (
          <p className="mt-3 text-sm text-slate-600">
            {isStoreManager ? (
              <>
                <span className="font-medium text-slate-700">
                  {scheduleApiMode === 'company_catalog'
                    ? 'API mode: menu from company catalog'
                    : scheduleApiMode === 'raw_uuid'
                      ? 'API mode: stored menu UUID'
                      : 'API mode: by-kind'}
                </span>
                {' · '}
                Loaded schedule for <span className="font-medium">{resolvedMenuLabel}</span>
                {schedulePayload?.menu_id ? (
                  <>
                    {' '}
                    (menu <code className="text-xs bg-slate-50 px-1 rounded">{String(schedulePayload.menu_id).slice(0, 8)}…</code>)
                  </>
                ) : null}
                . Slots in cache: {schedulePayload?.items?.length ?? 0}.
              </>
            ) : resolvedMenuLabel ? (
              <>
                Schedule loaded for <span className="font-medium text-slate-800">{resolvedMenuLabel}</span> menu.
              </>
            ) : scheduleApiMode === 'company_catalog' ? (
              <>Schedule loaded for the selected company menu.</>
            ) : null}
          </p>
        ) : null}
      </StoreSection>

      <StoreSection
        title="Meal for this slot"
        description={
          isStoreManager
            ? 'Weekly schedule: which combo is assigned for the selected weekday and session.'
            : 'The dish planned for this weekday and meal time. Use choose / change meal to update it.'
        }
      >
        {scheduleLoadError ? (
          <p className="text-sm text-red-600">{scheduleError || 'Could not load weekly schedule.'}</p>
        ) : slotLoading ? (
          <div className="space-y-2 py-1" aria-busy="true" aria-label="Loading schedule">
            <Skeleton height="22px" width="min(100%, 320px)" rounded="sm" />
            <Skeleton height="18px" width="min(100%, 200px)" rounded="sm" />
          </div>
        ) : slotStatus === 'error' ? (
          <p className="text-sm text-red-600">{scheduleError || 'Schedule error.'}</p>
        ) : slotNotFound ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-700">No combo is assigned for this weekday and session yet.</p>
            <Button type="button" onClick={() => setPickerOpen(true)}>
              Choose combo
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-base font-medium text-slate-900">{comboLabel || '(unnamed combo)'}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              Change meal
            </Button>
          </div>
        )}
      </StoreSection>

      <StoreSection
        title={comboLabel ? `Ingredients for: ${comboLabel}` : isStoreManager ? 'Recipe (BOM)' : 'Ingredients'}
        description={
          isStoreManager
            ? 'BOM for the selected combo (kitchen_recipe_lines). Edits apply wherever this combo is used.'
            : 'Ingredient amounts for the selected dish. Ask a store manager to change quantities or add items.'
        }
      >
        {isStoreManager ? (
          <p className="text-sm text-slate-600 mb-3">
            Recipe quantity and add-ingredient changes use manager permissions.
          </p>
        ) : (
          <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-3">
            View-only for operators. You can still change which dish is scheduled above.
          </p>
        )}
        {scheduleLoadError || slotNotFound || !menuItemId ? (
          <p className="text-sm text-slate-500">Assign a combo for this slot to load its recipe.</p>
        ) : recipeLoading ? (
          <div className="space-y-2 rounded-lg border border-slate-200 p-4" aria-busy="true" aria-label="Loading recipe">
            <Skeleton height="16px" width="min(100%, 360px)" rounded="sm" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height="40px" width="100%" rounded="md" />
            ))}
          </div>
        ) : recipeStatus === 'error' ? (
          <p className="text-sm text-red-600">{recipeError}</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Qty / unit</TableHead>
                  {isStoreManager ? <TableHead className="text-right">Action</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipeLines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isStoreManager ? 3 : 2} className="text-slate-500 text-sm">
                      {isStoreManager
                        ? 'No ingredients yet. Add one below.'
                        : 'No ingredients listed for this combo yet.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  recipeLines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">{line.inventory_item_name}</TableCell>
                      <TableCell>
                        {isStoreManager ? (
                          <div className="flex flex-wrap gap-2 items-center">
                            <input
                              className="border rounded px-2 py-1 text-sm w-24"
                              value={rowDrafts[line.id]?.quantity_per_unit ?? ''}
                              onChange={(e) =>
                                setRowDrafts((prev) => ({
                                  ...prev,
                                  [line.id]: { ...prev[line.id], quantity_per_unit: e.target.value }
                                }))
                              }
                            />
                            <input
                              className="border rounded px-2 py-1 text-sm w-20"
                              value={rowDrafts[line.id]?.unit ?? ''}
                              onChange={(e) =>
                                setRowDrafts((prev) => ({
                                  ...prev,
                                  [line.id]: { ...prev[line.id], unit: e.target.value }
                                }))
                              }
                            />
                          </div>
                        ) : (
                          <span className="text-sm">
                            {line.quantity_per_unit} {line.unit}
                          </span>
                        )}
                      </TableCell>
                      {isStoreManager ? (
                        <TableCell className="text-right">
                          <Button type="button" size="sm" variant="secondary" onClick={() => onSaveRow(line)}>
                            Save
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {isStoreManager ? (
              <form onSubmit={onAddLine} className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <label className="text-sm font-medium text-slate-700 md:col-span-2">
                  Search inventory
                  <input
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                    value={invSearch}
                    onChange={(e) => setInvSearch(e.target.value)}
                    placeholder="Type to search SKUs"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Item
                  <select
                    className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
                    value={addInvId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setAddInvId(id);
                      const it = invOptions.find((x) => x.id === id);
                      if (it?.unit) setAddUnit(it.unit);
                    }}
                  >
                    <option value="">Select inventory item…</option>
                    {invOptions.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name}
                      </option>
                    ))}
                  </select>
                </label>
                <input
                  className="border rounded-lg px-3 py-2 text-sm"
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value)}
                  placeholder="Qty"
                />
                <div className="flex gap-2">
                  <input
                    className="border rounded-lg px-3 py-2 text-sm flex-1"
                    value={addUnit}
                    onChange={(e) => setAddUnit(e.target.value)}
                    placeholder="Unit"
                  />
                  <Button type="submit">Add</Button>
                </div>
              </form>
            ) : null}
          </>
        )}
      </StoreSection>

      {pickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close"
            onClick={() => setPickerOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col border border-slate-200">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-900">Choose combo</h3>
              <input
                className="mt-3 w-full border rounded-lg px-3 py-2 text-sm"
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
                placeholder="Search menu items…"
                autoFocus
              />
            </div>
            <div className="p-2 overflow-y-auto flex-1">
              {pickerLoading ? (
                <p className="text-sm text-slate-500 px-2 py-4">Searching…</p>
              ) : pickerResults.length === 0 ? (
                <p className="text-sm text-slate-500 px-2 py-4">No matches.</p>
              ) : (
                <ul className="space-y-1">
                  {pickerResults.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-teal-50 text-slate-800"
                        onClick={() => onAssignCombo(c)}
                      >
                        {c.name || c.id}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="p-3 border-t border-slate-100 flex justify-end">
              <Button type="button" variant="outline" onClick={() => setPickerOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </StorePageShell>
  );
};

export default StoreOperatorRecipeBomPage;
