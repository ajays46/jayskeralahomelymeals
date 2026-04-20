import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreSection } from '@/components/store/StorePageShell';
import Skeleton from '../../components/Skeleton';
import { showStoreError, showStoreSuccess } from '../../utils/toastConfig.jsx';
import {
  kitchenAttachMealProgramMapping,
  kitchenCreateMealProgram,
  kitchenDeleteMealProgramMapping,
  kitchenDeleteMealProgramRecipeLine,
  kitchenGetMealProgramRecipeLines,
  kitchenListMealProgramMappings,
  kitchenListMealPrograms,
  kitchenUpsertMealProgramRecipeLine
} from '../../hooks/adminHook/kitchenStoreHook';

const LINE_ID_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const lineHasServerId = (line) => LINE_ID_UUID.test(String(line?.id || ''));

const qtyRoughlyEqual = (a, b) => Math.abs(Number(a || 0) - Number(b || 0)) < 1e-6;

/** Readable label for UI — prefers kitchen name; otherwise turns STANDARD_VEG_LUNCH into "Standard Veg Lunch". */
const formatKitchenMealSetLabel = (row) => {
  if (!row || typeof row !== 'object') return '—';
  const name = row.display_name != null ? String(row.display_name).trim() : '';
  if (name) return name;
  const code = row.code != null ? String(row.code).trim() : '';
  if (!code) return '—';
  return code
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
};

/** API `code` from a food-style name (letters/numbers → lowercase underscores). */
const mealSetCodeFromName = (name) => {
  const t = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return t;
};

const normalizeBomLines = (payload) => {
  if (!payload || typeof payload !== 'object') return [];
  const raw = Array.isArray(payload.items) ? payload.items : [];
  return raw.map((row) => ({
    id: row.line_id != null ? String(row.line_id) : '',
    inventory_item_id: row.inventory_item_id != null ? String(row.inventory_item_id) : '',
    inventory_item_name: row.inventory_item_name != null ? String(row.inventory_item_name) : '—',
    quantity_per_unit: row.quantity_per_unit,
    unit: row.unit != null ? String(row.unit) : ''
  }));
};

/**
 * Meal program BOM + dish→program mappings (BFF `/kitchen/meal-programs/…`).
 * `canEditBomLines`: operator + manager — ingredients + link/remove dishes. `canCreateMealSets`: manager only — add new meal set (API).
 * @param {{ canEditBomLines: boolean, canCreateMealSets: boolean, searchMenuCombos: (q: string, limit?: number) => Promise<{ id: string, name: string }[]>, searchInventoryItems: (q?: string) => Promise<{ id: string, name: string, unit?: string }[]> }} props
 */
const StoreOperatorMealProgramsSection = ({ canEditBomLines, canCreateMealSets, searchMenuCombos, searchInventoryItems }) => {
  const [programs, setPrograms] = useState([]);
  const [programsStatus, setProgramsStatus] = useState('idle');
  const [programsError, setProgramsError] = useState('');

  const [selectedProgramId, setSelectedProgramId] = useState('');

  const [bomPayload, setBomPayload] = useState(null);
  const [bomStatus, setBomStatus] = useState('idle');
  const [bomError, setBomError] = useState('');

  const [mappings, setMappings] = useState([]);
  const [mapStatus, setMapStatus] = useState('idle');
  const [mapError, setMapError] = useState('');

  const [newMealSetName, setNewMealSetName] = useState('');
  const [creating, setCreating] = useState(false);

  const [rowDrafts, setRowDrafts] = useState({});
  const bomLines = useMemo(() => normalizeBomLines(bomPayload), [bomPayload]);

  const [invOptions, setInvOptions] = useState([]);
  const [addInvId, setAddInvId] = useState('');
  const [addQty, setAddQty] = useState('0.1');
  const [addUnit, setAddUnit] = useState('kg');

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerResults, setPickerResults] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const reloadPrograms = useCallback(async () => {
    setProgramsStatus('loading');
    setProgramsError('');
    try {
      const items = await kitchenListMealPrograms();
      setPrograms(items);
      setProgramsStatus('ok');
      return items;
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.detail || e?.message || 'Could not load kitchen meal sets';
      setPrograms([]);
      setProgramsError(msg);
      setProgramsStatus('error');
      return [];
    }
  }, []);

  useEffect(() => {
    void reloadPrograms();
  }, [reloadPrograms]);

  const loadBomAndMappings = useCallback(async (programId) => {
    const pid = String(programId || '').trim();
    if (!pid) {
      setBomPayload(null);
      setMappings([]);
      setBomStatus('idle');
      setMapStatus('idle');
      return;
    }
    setBomStatus('loading');
    setBomError('');
    setMapStatus('loading');
    setMapError('');
    try {
      const [bomData, mapData] = await Promise.all([
        kitchenGetMealProgramRecipeLines(pid),
        kitchenListMealProgramMappings({ program_id: pid })
      ]);
      setBomPayload(bomData && typeof bomData === 'object' ? bomData : null);
      setBomStatus('ok');
      const mraw = mapData && typeof mapData === 'object' && Array.isArray(mapData.items) ? mapData.items : [];
      setMappings(mraw);
      setMapStatus('ok');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.detail || e?.message || 'Could not load this meal set';
      setBomPayload(null);
      setMappings([]);
      setBomError(msg);
      setMapError(msg);
      setBomStatus('error');
      setMapStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadBomAndMappings(selectedProgramId);
  }, [selectedProgramId, loadBomAndMappings]);

  useEffect(() => {
    const next = {};
    bomLines.forEach((l) => {
      next[l.id] = {
        quantity_per_unit: String(l.quantity_per_unit ?? ''),
        unit: l.unit || ''
      };
    });
    setRowDrafts(next);
  }, [bomLines]);

  useEffect(() => {
    let cancelled = false;
    if (!canEditBomLines) {
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
  }, [canEditBomLines, searchInventoryItems]);

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

  const onCreateProgram = async (e) => {
    e.preventDefault();
    if (!canCreateMealSets) return;
    const displayName = newMealSetName.trim();
    if (!displayName) {
      showStoreError('Enter a name for this kitchen meal set (e.g. Standard veg lunch thali).');
      return;
    }
    const code = mealSetCodeFromName(displayName);
    if (!code) {
      showStoreError('Use letters or numbers in the name (e.g. Veg lunch box 1).');
      return;
    }
    setCreating(true);
    try {
      const created = await kitchenCreateMealProgram({ code, display_name: displayName });
      showStoreSuccess('Kitchen meal set added.');
      setNewMealSetName('');
      await reloadPrograms();
      const pid = created && typeof created === 'object' ? created.program_id : null;
      if (pid) setSelectedProgramId(String(pid));
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.detail || e?.message || 'Could not add this meal set';
      showStoreError(msg);
    } finally {
      setCreating(false);
    }
  };

  const onSaveRow = async (line, options = {}) => {
    const { silent = false } = options;
    if (!canEditBomLines || !selectedProgramId) return;
    const draft = rowDrafts[line.id];
    if (!draft) return;
    const qty = Number(draft.quantity_per_unit);
    if (!Number.isFinite(qty) || qty <= 0) {
      if (!silent) showStoreError('Enter a valid quantity greater than zero.');
      return;
    }
    const unit = (draft.unit || '').trim() || line.unit || 'unit';
    if (
      lineHasServerId(line) &&
      qtyRoughlyEqual(qty, line.quantity_per_unit) &&
      String(unit).trim() === String(line.unit || '').trim()
    ) {
      return;
    }
    try {
      await kitchenUpsertMealProgramRecipeLine(selectedProgramId, {
        inventory_item_id: line.inventory_item_id,
        quantity_per_unit: qty,
        unit
      });
      if (!silent) showStoreSuccess('BOM line saved.');
      await loadBomAndMappings(selectedProgramId);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.detail || e?.message || 'Save failed';
      if (!silent) showStoreError(msg);
    }
  };

  const onDeleteRow = async (line) => {
    if (!canEditBomLines || !selectedProgramId) return;
    if (!lineHasServerId(line)) {
      showStoreError('This row does not have a line id yet — save it first.');
      return;
    }
    if (
      typeof window !== 'undefined' &&
      !window.confirm(`Remove ${line.inventory_item_name || 'this ingredient'} from this meal set’s ingredient list?`)
    )
      return;
    try {
      await kitchenDeleteMealProgramRecipeLine(selectedProgramId, line.id);
      showStoreSuccess('Ingredient removed.');
      await loadBomAndMappings(selectedProgramId);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.detail || e?.message || 'Delete failed';
      showStoreError(msg);
    }
  };

  const onAddLine = async (ev) => {
    ev.preventDefault();
    if (!canEditBomLines || !selectedProgramId) return;
    const item = invOptions.find((x) => x.id === addInvId);
    if (!item) {
      showStoreError('Pick an inventory item.');
      return;
    }
    const qty = Number(addQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      showStoreError('Enter a valid quantity greater than zero.');
      return;
    }
    try {
      await kitchenUpsertMealProgramRecipeLine(selectedProgramId, {
        inventory_item_id: item.id,
        quantity_per_unit: qty,
        unit: (addUnit || item.unit || '').trim() || 'unit'
      });
      showStoreSuccess('Ingredient added.');
      setAddQty('0.1');
      await loadBomAndMappings(selectedProgramId);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.detail || e?.message || 'Add failed';
      showStoreError(msg);
    }
  };

  const onAttachDish = async (combo) => {
    if (!canEditBomLines || !selectedProgramId || !combo?.id) return;
    try {
      await kitchenAttachMealProgramMapping({
        menu_item_id: combo.id,
        program_id: selectedProgramId
      });
      showStoreSuccess('Dish linked to this kitchen meal set.');
      setPickerOpen(false);
      await loadBomAndMappings(selectedProgramId);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.detail || e?.message || 'Could not attach dish';
      showStoreError(msg);
    }
  };

  const onDeleteMapping = async (mappingId) => {
    if (!canEditBomLines) return;
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        'Remove this dish from the meal set? Ordering will fall back to the usual recipe for that dish if one exists.'
      )
    )
      return;
    try {
      await kitchenDeleteMealProgramMapping(mappingId);
      showStoreSuccess('Dish unlinked from this meal set.');
      await loadBomAndMappings(selectedProgramId);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.detail || e?.message || 'Remove failed';
      showStoreError(msg);
    }
  };

  const programLabel = (p) => formatKitchenMealSetLabel(p);

  const bomTitleNameRaw =
    bomPayload && typeof bomPayload === 'object'
      ? formatKitchenMealSetLabel({
          display_name: bomPayload.display_name,
          code: bomPayload.code
        })
      : '';
  const bomTitleName = bomTitleNameRaw === '—' ? '' : bomTitleNameRaw;

  return (
    <div className="space-y-6">
      <StoreSection
        title="Menu item creation"
        description="A meal set is one shared ingredient list (per portion) for several menu dishes—like a fixed veg lunch or dinner combo. Pick a set below to edit ingredients or attach dishes."
      >
        {canEditBomLines && !canCreateMealSets ? (
          <p className="text-sm text-slate-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4 max-w-3xl">
            Only a store manager can add a new kitchen meal set. You can pick a set, edit ingredients, and link or unlink dishes.
          </p>
        ) : null}
        {programsStatus === 'loading' ? (
          <p className="text-sm text-slate-500">Loading meal sets…</p>
        ) : programsStatus === 'error' ? (
          <p className="text-sm text-red-600">{programsError}</p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end max-w-3xl">
            <label className="text-sm font-medium text-slate-700 flex-1 min-w-[200px]">
              Kitchen meal set
              <select
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white"
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
              >
                <option value="">Choose a meal set…</option>
                {programs.map((p) => {
                  const id = p.program_id != null ? String(p.program_id) : '';
                  if (!id) return null;
                  return (
                    <option key={id} value={id}>
                      {programLabel(p)}
                    </option>
                  );
                })}
              </select>
            </label>
            <Button type="button" variant="outline" size="sm" onClick={() => void reloadPrograms()}>
              Refresh list
            </Button>
          </div>
        )}

        {canCreateMealSets ? (
          <form
            onSubmit={onCreateProgram}
            className="mt-6 max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
          >
            <p className="text-sm font-medium text-slate-800">Add a kitchen meal set</p>
            <p className="text-sm text-slate-600 -mt-2">
              Name it like a menu offering (e.g. Standard veg lunch thali). That text is what staff see; a short id is stored
              automatically for the system.
            </p>
            <label className="text-sm font-medium text-slate-700 block max-w-lg">
              Meal set name
              <input
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                value={newMealSetName}
                onChange={(e) => setNewMealSetName(e.target.value)}
                placeholder="e.g. Standard veg lunch thali"
                autoComplete="off"
              />
            </label>
            <Button type="submit" disabled={creating} variant="secondary" className="min-h-[42px]">
              {creating ? 'Adding…' : 'Add meal set'}
            </Button>
          </form>
        ) : null}
      </StoreSection>

      {selectedProgramId ? (
        <>
          <StoreSection
            title={bomTitleName ? `Ingredients — ${bomTitleName}` : 'Ingredients (per portion)'}
            description="Amounts are for one portion of any menu dish linked to this meal set."
          >
            {bomStatus === 'loading' ? (
              <div className="space-y-2 py-1" aria-busy="true" aria-label="Loading ingredients">
                <Skeleton height="16px" width="min(100%, 360px)" rounded="sm" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} height="40px" width="100%" rounded="md" />
                ))}
              </div>
            ) : bomStatus === 'error' ? (
              <p className="text-sm text-red-600">{bomError}</p>
            ) : (
              <>
                <div className="max-h-[min(28rem,70vh)] overflow-y-auto overflow-x-auto rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader className="sticky top-0 z-[1] bg-slate-100 shadow-[0_1px_0_0_rgb(226_232_240)]">
                      <TableRow>
                        <TableHead>Ingredient</TableHead>
                        <TableHead>Qty / unit</TableHead>
                        {canEditBomLines ? <TableHead className="text-right">Actions</TableHead> : null}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bomLines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={canEditBomLines ? 3 : 2} className="text-slate-500 text-sm">
                            {canEditBomLines ? 'No ingredients yet. Add one below.' : 'No ingredients for this meal set yet.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        bomLines.map((line) => (
                          <TableRow key={line.id || line.inventory_item_id}>
                            <TableCell className="font-medium">{line.inventory_item_name}</TableCell>
                            <TableCell>
                              {canEditBomLines ? (
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
                                      if (lineHasServerId(line)) void onSaveRow(line, { silent: true });
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
                                      if (lineHasServerId(line)) void onSaveRow(line, { silent: true });
                                    }}
                                  />
                                </div>
                              ) : (
                                <span className="text-sm">
                                  {line.quantity_per_unit} {line.unit}
                                </span>
                              )}
                            </TableCell>
                            {canEditBomLines ? (
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2 flex-wrap">
                                  {!lineHasServerId(line) ? (
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

                {canEditBomLines ? (
                  <form
                    onSubmit={onAddLine}
                    className="mt-6 max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                  >
                    <div>
                      <label className="text-sm font-medium text-slate-700" htmlFor="mp-bom-add-item">
                        Item
                      </label>
                      <select
                        id="mp-bom-add-item"
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
                        <label className="text-sm font-medium text-slate-700" htmlFor="mp-bom-add-qty">
                          Quantity per unit
                        </label>
                        <input
                          id="mp-bom-add-qty"
                          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white"
                          value={addQty}
                          onChange={(e) => setAddQty(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700" htmlFor="mp-bom-add-unit">
                          Unit
                        </label>
                        <input
                          id="mp-bom-add-unit"
                          className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white"
                          value={addUnit}
                          onChange={(e) => setAddUnit(e.target.value)}
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

          <StoreSection
            title="Dishes using this meal set"
            description="These menu dishes use the ingredient list above when you plan or expand recipes. Remove a dish to use its normal recipe again."
          >
            {mapStatus === 'loading' ? (
              <p className="text-sm text-slate-500">Loading dishes…</p>
            ) : mapStatus === 'error' ? (
              <p className="text-sm text-red-600">{mapError}</p>
            ) : (
              <>
                {canEditBomLines ? (
                  <div className="mb-4">
                    <Button type="button" onClick={() => setPickerOpen(true)}>
                      Link a menu dish
                    </Button>
                  </div>
                ) : null}
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dish (id)</TableHead>
                        <TableHead>Meal set</TableHead>
                        {canEditBomLines ? <TableHead className="text-right w-[120px]">Actions</TableHead> : null}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mappings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={canEditBomLines ? 3 : 2} className="text-slate-500 text-sm">
                            No dishes linked to this program yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        mappings.map((row) => {
                          const mid = row.mapping_id != null ? String(row.mapping_id) : '';
                          return (
                            <TableRow key={mid || row.menu_item_id}>
                              <TableCell className="font-mono text-xs text-slate-800">
                                {row.menu_item_id != null ? String(row.menu_item_id) : '—'}
                              </TableCell>
                              <TableCell className="text-sm">
                                {row.program_code != null
                                  ? formatKitchenMealSetLabel({ code: row.program_code })
                                  : '—'}
                              </TableCell>
                              {canEditBomLines ? (
                                <TableCell className="text-right">
                                  {mid ? (
                                    <Button type="button" size="sm" variant="outline" onClick={() => onDeleteMapping(mid)}>
                                      Remove
                                    </Button>
                                  ) : null}
                                </TableCell>
                              ) : null}
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </StoreSection>
        </>
      ) : (
        <StoreSection title="Meal set details" description="Choose a kitchen meal set above to edit ingredients and dishes.">
          <p className="text-sm text-slate-500">No meal set selected.</p>
        </StoreSection>
      )}

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
              <h3 className="text-lg font-semibold text-slate-900">Pick a dish from the menu</h3>
              <input
                className="mt-3 w-full border rounded-lg px-3 py-2 text-sm"
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
                placeholder="Search dishes…"
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
                        onClick={() => onAttachDish(c)}
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
    </div>
  );
};

export default StoreOperatorMealProgramsSection;
