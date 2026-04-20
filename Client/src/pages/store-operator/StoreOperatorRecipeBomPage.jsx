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
import StoreOperatorMealProgramsSection from './StoreOperatorMealProgramsSection.jsx';

/** @feature kitchen-store — By-kind weekly schedule + local day/session filter + recipe BOM. */
const MEAL_SLOTS = ['BREAKFAST', 'LUNCH', 'DINNER'];

const defaultDateStr = () => new Date().toISOString().slice(0, 10);

const weekdayLabel = (dow) => {
  const names = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return names[dow] || '';
};

const RECIPE_LINE_ID_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const recipeLineHasServerId = (line) => RECIPE_LINE_ID_UUID.test(String(line?.id || ''));

const qtyUnitRoughlyEqual = (a, b) => Math.abs(Number(a || 0) - Number(b || 0)) < 1e-6;

const StoreOperatorRecipeBomPage = () => {
  const { user } = useAuthStore();
  const roleString = String(user?.role || '').toUpperCase();
  const roles = (Array.isArray(user?.roles) ? user.roles : roleString ? [roleString] : []).map((r) =>
    String(r).toUpperCase()
  );
  /** Full recipe/BOM edit UI for both store roles (matches max_kitchen recipe routes). */
  const canEditRecipeBom =
    roles.includes('STORE_MANAGER') ||
    roleString === 'STORE_MANAGER' ||
    roles.includes('STORE_OPERATOR') ||
    roleString === 'STORE_OPERATOR';

  /** Meal programs: create program + dish→program mappings are manager-only (API). */
  const isStoreManager = roles.includes('STORE_MANAGER') || roleString === 'STORE_MANAGER';

  const [menuKind, setMenuKind] = useState(KITCHEN_MENU_KIND.VEG);
  const [dateStr, setDateStr] = useState(defaultDateStr);
  const [mealSlot, setMealSlot] = useState('DINNER');
  const [scheduleReloadKey, setScheduleReloadKey] = useState(0);
  const [vegMenuDraft, setVegMenuDraft] = useState(() => getConfiguredKitchenMenuIds().vegMenuId);
  const [nonVegMenuDraft, setNonVegMenuDraft] = useState(() => getConfiguredKitchenMenuIds().nonVegMenuId);
  /** `weekly` = legacy per–menu-item recipe + weekly slot; `meal-programs` = program BOM + dish mappings. */
  const [recipeBomTab, setRecipeBomTab] = useState('weekly');

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
    recipeLines,
    recipeStatus,
    recipeError,
    saveWeeklySlot,
    searchMenuCombos,
    fetchRecipeLinesForMenuItem,
    upsertRecipeLineForMenuItem,
    updateRecipeLineForMenuItem,
    deleteRecipeLineForMenuItem,
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
    if (!canEditRecipeBom) {
      setInvOptions([]);
      return () => {};
    }
    void (async () => {
      const list = await searchInventoryItems(undefined);
      if (!cancelled) setInvOptions(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [canEditRecipeBom, searchInventoryItems]);

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

  const onSaveRow = async (line, options = {}) => {
    const { silent = false } = options;
    if (!canEditRecipeBom || !menuItemId) return;
    const draft = rowDrafts[line.id];
    if (!draft) return;
    const qty = Number(draft.quantity_per_unit);
    if (!Number.isFinite(qty) || qty < 0) {
      if (!silent) showStoreError('Enter a valid quantity.');
      return;
    }
    const unit = (draft.unit || '').trim() || line.unit;
    const hasId = recipeLineHasServerId(line);
    if (
      hasId &&
      qtyUnitRoughlyEqual(qty, line.quantity_per_unit) &&
      String(unit).trim() === String(line.unit || '').trim()
    ) {
      return;
    }
    const out = hasId
      ? await updateRecipeLineForMenuItem({
          id: line.id,
          menu_item_id: menuItemId,
          quantity_per_unit: qty,
          unit
        })
      : await upsertRecipeLineForMenuItem({
          menu_item_id: menuItemId,
          inventory_item_id: line.inventory_item_id,
          quantity_per_unit: qty,
          unit
        });
    if (!out.ok) {
      showStoreError(out.message || 'Save failed');
      return;
    }
    if (!silent) showStoreSuccess('Recipe line saved.');
  };

  const onDeleteRow = async (line) => {
    if (!canEditRecipeBom || !menuItemId) return;
    if (!recipeLineHasServerId(line)) {
      showStoreError('Cannot remove this row until the server assigns a line id.');
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm(`Remove ${line.inventory_item_name || 'this ingredient'} from the recipe?`)) return;
    const out = await deleteRecipeLineForMenuItem(line.id, menuItemId);
    if (!out.ok) {
      showStoreError(out.message || 'Delete failed');
      return;
    }
    showStoreSuccess('Recipe line removed.');
  };

  const onAddLine = async (e) => {
    e.preventDefault();
    if (!canEditRecipeBom || !menuItemId) return;
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

  return (
    <StorePageShell>
      <StorePageHeader
        title={canEditRecipeBom ? 'Recipe / BOM by week & session' : 'Meals & ingredients by week'}
      />

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 mb-6">
        <button
          type="button"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            recipeBomTab === 'weekly'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          onClick={() => setRecipeBomTab('weekly')}
        >
          Weekly recipe / BOM
        </button>
        <button
          type="button"
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            recipeBomTab === 'meal-programs'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          onClick={() => setRecipeBomTab('meal-programs')}
        >
          Menu item creation
        </button>
      </div>

      {recipeBomTab === 'meal-programs' ? (
        <StoreOperatorMealProgramsSection
          canEditBomLines={canEditRecipeBom}
          canCreateMealSets={isStoreManager}
          searchMenuCombos={searchMenuCombos}
          searchInventoryItems={searchInventoryItems}
        />
      ) : null}

      {recipeBomTab === 'weekly' ? (
        <>
      {!canEditRecipeBom ? (
        <StoreSection
          title="What you can do"
          description="You need the store operator or store manager role to edit schedules and recipes here."
          compact
        >
          <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1.5 max-w-3xl">
            <li>Set which combo is planned for the chosen weekday and meal time (choose / change meal).</li>
            <li>View ingredient lines for the selected dish.</li>
            <li>
              Optional: select a company menu below so the schedule follows that menu; otherwise use veg / non-veg.
            </li>
          </ul>
        </StoreSection>
      ) : null}

      <StoreSection title="Company menus">
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
          </>
        )}
      </StoreSection>

      {canEditRecipeBom && rawRoutesEnv ? (
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
          canEditRecipeBom
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
            {canEditRecipeBom ? (
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
      </StoreSection>

      <StoreSection
        title="Meal for this slot"
        description={
          canEditRecipeBom
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

      <StoreSection title={comboLabel ? `Ingredients for: ${comboLabel}` : canEditRecipeBom ? 'Recipe (BOM)' : 'Ingredients'}>
        {!canEditRecipeBom ? (
          <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-3">
            Sign in with a store operator or store manager account to edit the BOM. You can still change which dish is scheduled
            above if your role allows it.
          </p>
        ) : null}
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
            {/* ~10 visible ingredient rows; scroll when there are more */}
            <div className="max-h-[min(28rem,70vh)] overflow-y-auto overflow-x-auto rounded-lg border border-slate-200">
              <Table>
                <TableHeader className="sticky top-0 z-[1] bg-slate-100 shadow-[0_1px_0_0_rgb(226_232_240)]">
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Qty / unit</TableHead>
                    {canEditRecipeBom ? <TableHead className="text-right">Actions</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipeLines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canEditRecipeBom ? 3 : 2} className="text-slate-500 text-sm">
                        {canEditRecipeBom
                          ? 'No ingredients yet. Add one below.'
                          : 'No ingredients listed for this combo yet.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    recipeLines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell className="font-medium">{line.inventory_item_name}</TableCell>
                        <TableCell>
                          {canEditRecipeBom ? (
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
                                onBlur={() => {
                                  if (recipeLineHasServerId(line)) void onSaveRow(line, { silent: true });
                                }}
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
                                onBlur={() => {
                                  if (recipeLineHasServerId(line)) void onSaveRow(line, { silent: true });
                                }}
                              />
                            </div>
                          ) : (
                            <span className="text-sm">
                              {line.quantity_per_unit} {line.unit}
                            </span>
                          )}
                        </TableCell>
                        {canEditRecipeBom ? (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2 flex-wrap">
                              {!recipeLineHasServerId(line) ? (
                                <Button type="button" size="sm" variant="secondary" onClick={() => onSaveRow(line)}>
                                  Save
                                </Button>
                              ) : null}
                              <Button type="button" size="sm" variant="outline" onClick={() => onDeleteRow(line)}>
                                Remove
                              </Button>
                            </div>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {canEditRecipeBom ? (
              <form
                onSubmit={onAddLine}
                className="mt-6 max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
              >
                <div>
                  <label className="text-sm font-medium text-slate-700" htmlFor="recipe-bom-add-item">
                    Item
                  </label>
                  <select
                    id="recipe-bom-add-item"
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white min-h-[42px]"
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
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700" htmlFor="recipe-bom-add-qty">
                      Quantity
                    </label>
                    <input
                      id="recipe-bom-add-qty"
                      className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white"
                      value={addQty}
                      onChange={(e) => setAddQty(e.target.value)}
                      placeholder="e.g. 500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700" htmlFor="recipe-bom-add-unit">
                      Unit
                    </label>
                    <input
                      id="recipe-bom-add-unit"
                      className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white"
                      value={addUnit}
                      onChange={(e) => setAddUnit(e.target.value)}
                      placeholder="e.g. gram"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full sm:w-auto min-h-[42px]">
                  Add ingredient
                </Button>
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
        </>
      ) : null}
    </StorePageShell>
  );
};

export default StoreOperatorRecipeBomPage;
