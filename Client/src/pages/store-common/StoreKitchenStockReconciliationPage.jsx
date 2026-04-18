import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { API, readMaxKitchenClientEnvelope } from '../../api/endpoints';
import { useKitchenReconciliationApi, useKitchenReconciliationSessionsApi } from '../../hooks/adminHook/kitchenStoreHook';
import { Button } from '@/components/ui/button';
import { StoreNotice, StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import { showStoreError, showStoreSuccess } from '../../utils/toastConfig.jsx';

const MEAL_SLOTS = ['BREAKFAST', 'LUNCH', 'DINNER'];

function formatApiError(err, fallback) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.detail ||
    err?.message ||
    fallback ||
    'Request failed'
  );
}

/** ISO timestamp → display in India Standard Time (Asia/Kolkata). */
function formatDateTimeIST(iso) {
  if (iso == null || iso === '') return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

function formatReconQty(val) {
  if (val == null || val === '') return '—';
  const n = Number(String(val).replace(/,/g, ''));
  if (!Number.isFinite(n)) return String(val);
  return String(n);
}

function formatTextCell(val) {
  if (val == null) return '—';
  const s = String(val).trim();
  return s === '' ? '—' : s;
}

function extractSessionsList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.sessions)) return raw.sessions;
  if (Array.isArray(raw.items)) return raw.items;
  return [];
}

/**
 * Inventory GET may be `{ success, data: { items, page } }` (readMaxKitchenClientEnvelope unwraps once).
 * Handles occasional double-wrapping or alternate keys so catalog rows always populate when items exist.
 */
function extractInventoryItemsFromListResponse(res) {
  const tryPayload = (payload) => {
    if (payload == null) return [];
    if (Array.isArray(payload)) return payload;
    if (typeof payload !== 'object') return [];
    if (Array.isArray(payload.items)) return payload.items;
    if (payload.data && typeof payload.data === 'object' && Array.isArray(payload.data.items)) {
      return payload.data.items;
    }
    if (Array.isArray(payload.results)) return payload.results;
    return [];
  };

  const inner = readMaxKitchenClientEnvelope(res);
  const fromInner = tryPayload(inner);
  if (fromInner.length) return fromInner;

  const body = res?.data;
  if (body && typeof body === 'object') {
    if (Array.isArray(body.items)) return body.items;
    if (body.data && typeof body.data === 'object') {
      const nested = tryPayload(body.data);
      if (nested.length) return nested;
    }
  }
  return [];
}

function parseStockNumber(value) {
  if (value == null) return NaN;
  const s = String(value).replace(/,/g, '').trim();
  if (s === '') return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/** physical − system; null if either side missing. */
function rowVariancePhysicalMinusSystem(row) {
  const sys = parseStockNumber(row.systemBookQty);
  const phy = parseStockNumber(row.physicalQty);
  if (!Number.isFinite(sys) || !Number.isFinite(phy)) return null;
  return phy - sys;
}

/** Match FRONTEND_PHYSICAL_STOCKTAKE_AND_ADJUST.md — variance = physical − system; epsilon for float noise. */
const STOCKTAKE_QTY_EPS = 1e-9;

/**
 * Rows where physical ≠ system → one ledger movement each (ADD surplus, REMOVE shortage).
 * @returns {Array<{ row: object, movement_type: 'ADD' | 'REMOVE', quantity: number, variance: number }>}
 */
function buildStocktakeAdjustmentPlan(rows) {
  const out = [];
  for (const row of rows) {
    const sys = parseStockNumber(row.systemBookQty);
    const phy = parseStockNumber(row.physicalQty);
    if (!Number.isFinite(sys) || !Number.isFinite(phy)) continue;
    const variance = phy - sys;
    if (Math.abs(variance) < STOCKTAKE_QTY_EPS) continue;
    const movement_type = variance > 0 ? 'ADD' : 'REMOVE';
    out.push({ row, movement_type, quantity: Math.abs(variance), variance });
  }
  return out;
}

function pickReadinessNotes(data) {
  if (!data || typeof data !== 'object') return [];
  const candidates = ['readiness_notes', 'notes', 'summary_notes', 'messages', 'advisories'];
  const out = [];
  for (const k of candidates) {
    const v = data[k];
    if (v == null) continue;
    if (typeof v === 'string' && v.trim()) out.push({ label: k, text: v.trim() });
    else if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (typeof item === 'string' && item.trim()) out.push({ label: `${k}[${i}]`, text: item.trim() });
        else if (item && typeof item === 'object' && (item.text || item.message || item.note)) {
          out.push({
            label: `${k}[${i}]`,
            text: String(item.text || item.message || item.note || '').trim()
          });
        }
      });
    }
  }
  const nested = data.summary;
  if (nested && typeof nested === 'object') {
    for (const k of ['notes', 'readiness_notes', 'message']) {
      const v = nested[k];
      if (typeof v === 'string' && v.trim()) out.push({ label: `summary.${k}`, text: v.trim() });
    }
  }
  return out;
}

/** Normalize API list fields that may be missing or non-array. */
function asReadinessList(val) {
  if (val == null) return [];
  return Array.isArray(val) ? val : [];
}

function readinessQtyLabel(v) {
  if (v == null || v === '') return '—';
  return String(v);
}

/** @feature kitchen-store — Operator: inventory list, stocktake movements, reconciliation sessions/readiness; Manager: session list and read-only line table. */
const StoreKitchenStockReconciliationPage = () => {
  const location = useLocation();
  /** Same component serves `/store-operator/stock-reconciliation` vs `/store-manager/stock-reconciliation` with different API surfaces. */
  const isOperatorStockReconRoute = location.pathname.includes('/store-operator/stock-reconciliation');
  const isManagerStockReconRoute = location.pathname.includes('/store-manager/stock-reconciliation');

  const { loading: reconLoading, error: reconError, readiness, fetchNextDayReadiness } = useKitchenReconciliationApi();
  const {
    loading: sessionLoading,
    error: sessionHookError,
    sessionsList,
    sessionDetail,
    listSessions,
    createSession,
    getSession,
    putSessionLines,
    finalizeSession,
    managerReviewLine
  } = useKitchenReconciliationSessionsApi();

  const [mealSlot, setMealSlot] = useState('LUNCH');

  const [countRows, setCountRows] = useState([]);
  const [invSearch, setInvSearch] = useState('');
  const [invOptions, setInvOptions] = useState([]);
  const [invLoading, setInvLoading] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPageSize] = useState(100);
  const [catalogRows, setCatalogRows] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  /** Per count-row key: error message from last POST …/movements attempt. */
  const [applyRowErrors, setApplyRowErrors] = useState({});
  const [applyBusy, setApplyBusy] = useState(false);
  const [stocktakeMovementNotePrefix, setStocktakeMovementNotePrefix] = useState(() => {
    try {
      return `Physical stocktake ${new Date().toISOString().slice(0, 10)}`;
    } catch {
      return 'Physical stocktake';
    }
  });
  const [activeSessionId, setActiveSessionId] = useState('');
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionReadinessNote, setSessionReadinessNote] = useState('');
  const [sessionFinalizePct, setSessionFinalizePct] = useState('0.05');
  /** Manager session line id → draft text for PATCH manager_note. */
  const [managerLineNoteDrafts, setManagerLineNoteDrafts] = useState({});
  const [savingManagerLineId, setSavingManagerLineId] = useState(null);

  const managerSessionLinesSeed = useMemo(() => {
    if (!isManagerStockReconRoute || !Array.isArray(sessionDetail?.lines)) return '';
    try {
      return JSON.stringify(
        sessionDetail.lines.map((ln) => ({
          id: String(ln.id ?? ln.line_id),
          manager_note: ln.manager_note ?? null,
          manager_acknowledged: Boolean(ln.manager_acknowledged)
        }))
      );
    } catch {
      return '';
    }
  }, [isManagerStockReconRoute, sessionDetail?.lines]);

  useEffect(() => {
    if (!isManagerStockReconRoute || !sessionDetail?.lines || !Array.isArray(sessionDetail.lines)) {
      setManagerLineNoteDrafts({});
      return;
    }
    const next = {};
    for (const ln of sessionDetail.lines) {
      const lid = String(ln.id ?? ln.line_id);
      next[lid] = ln.manager_note != null ? String(ln.manager_note) : '';
    }
    setManagerLineNoteDrafts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync drafts only when server line state (seed) changes; sessionDetail identity may churn without data changes.
  }, [isManagerStockReconRoute, managerSessionLinesSeed]);

  useEffect(() => {
    if (!isOperatorStockReconRoute) return;
    void fetchNextDayReadiness({ meal_slot: mealSlot, include_details: true });
  }, [isOperatorStockReconRoute, fetchNextDayReadiness, mealSlot]);

  useEffect(() => {
    if (!isOperatorStockReconRoute) return;
    let cancelled = false;
    const q = invSearch.trim();
    if (q.length < 2) {
      setInvOptions([]);
      return undefined;
    }
    const t = setTimeout(async () => {
      setInvLoading(true);
      try {
        const res = await api.get(`${API.MAX_KITCHEN_INVENTORY}/items`, {
          params: { page: 1, page_size: 40, q }
        });
        const list = extractInventoryItemsFromListResponse(res);
        if (!cancelled) {
          setInvOptions(
            list.map((it) => ({
              id: String(it.id ?? ''),
              name: String(it.name ?? it.item_name ?? '—'),
              unit: String(it.unit ?? '').trim(),
              current_quantity: it.current_quantity
            }))
          );
        }
      } catch {
        if (!cancelled) setInvOptions([]);
      } finally {
        if (!cancelled) setInvLoading(false);
      }
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [invSearch, isOperatorStockReconRoute]);

  const readinessNotes = useMemo(() => pickReadinessNotes(readiness), [readiness]);

  const nextDayDeliveryLines = useMemo(
    () => asReadinessList(readiness?.delivery_meal_counts?.lines),
    [readiness]
  );
  const nextDayPrepItems = useMemo(() => asReadinessList(readiness?.prep_readiness?.items), [readiness]);
  const nextDayShortageRows = useMemo(
    () => asReadinessList(readiness?.shortage_detection?.shortages),
    [readiness]
  );

  const addCountRow = (item) => {
    if (!item?.id) return;
    const book =
      item.current_quantity != null && item.current_quantity !== ''
        ? String(item.current_quantity)
        : '';
    setCountRows((prev) => [
      ...prev,
      {
        key: globalThis.crypto?.randomUUID?.() || `row-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        inventoryItemId: item.id,
        name: item.name,
        unit: item.unit || '',
        physicalQty: book,
        systemBookQty: book,
        lineNote: ''
      }
    ]);
    setInvSearch('');
    setInvOptions([]);
  };

  const loadCatalogPage = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const res = await api.get(`${API.MAX_KITCHEN_INVENTORY}/items`, {
        params: { page: catalogPage, page_size: catalogPageSize }
      });
      const list = extractInventoryItemsFromListResponse(res);
      setCatalogRows(
        list.map((it) => ({
          id: String(it.id ?? ''),
          name: String(it.name ?? it.item_name ?? '—'),
          unit: String(it.unit ?? '').trim(),
          current_quantity: it.current_quantity
        }))
      );
    } catch {
      setCatalogRows([]);
    } finally {
      setCatalogLoading(false);
    }
  }, [catalogPage, catalogPageSize]);

  const catalogBootstrappedRef = useRef(false);
  useEffect(() => {
    if (!isOperatorStockReconRoute) {
      catalogBootstrappedRef.current = false;
      return;
    }
    if (catalogBootstrappedRef.current) return;
    catalogBootstrappedRef.current = true;
    void loadCatalogPage();
  }, [isOperatorStockReconRoute, loadCatalogPage]);

  useEffect(() => {
    if (!isManagerStockReconRoute) return;
    void listSessions();
  }, [isManagerStockReconRoute, listSessions]);

  const appendCatalogToCount = () => {
    const existing = new Set(countRows.map((r) => r.inventoryItemId));
    const additions = [];
    for (const it of catalogRows) {
      if (!it.id || existing.has(it.id)) continue;
      existing.add(it.id);
      const book =
        it.current_quantity != null && it.current_quantity !== '' ? String(it.current_quantity) : '';
      additions.push({
        key:
          globalThis.crypto?.randomUUID?.() ||
          `row-${Date.now()}-${Math.random().toString(16).slice(2)}-${additions.length}`,
        inventoryItemId: it.id,
        name: it.name,
        unit: it.unit || '',
        physicalQty: book,
        systemBookQty: book,
        lineNote: ''
      });
    }
    if (additions.length) setCountRows((prev) => [...prev, ...additions]);
  };

  const removeRow = (key) => {
    setCountRows((prev) => prev.filter((r) => r.key !== key));
  };

  const updateRow = (key, patch) => {
    setApplyRowErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setCountRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const buildLinesFromCountRows = () =>
    countRows
      .map((r) => ({
        inventory_item_id: r.inventoryItemId,
        physical_quantity: Number(String(r.physicalQty).replace(/,/g, '')),
        note: (r.lineNote || '').trim() || undefined
      }))
      .filter((r) => r.inventory_item_id && Number.isFinite(r.physical_quantity) && r.physical_quantity >= 0);

  const plannedAdjustments = useMemo(() => buildStocktakeAdjustmentPlan(countRows), [countRows]);

  const applyBookStockFromCounts = useCallback(async () => {
    const plan = buildStocktakeAdjustmentPlan(countRows);
    if (!plan.length) {
      showStoreError('No differences to post — physical matches system on all lines (or enter valid numbers).');
      return;
    }
    const lines = plan.map((p) => {
      const q = Number(p.quantity.toFixed(8));
      const v = Number(p.variance.toFixed(8));
      const u = p.row.unit ? ` ${p.row.unit}` : '';
      return `• ${p.row.name}: ${p.movement_type} ${q}${u} (var ${v >= 0 ? '+' : ''}${v}${u})`;
    });
    if (
      !window.confirm(
        `Post ${plan.length} stock adjustment(s) so the system matches your counted quantities?\n\n${lines.join('\n')}`
      )
    ) {
      return;
    }
    setApplyBusy(true);
    setApplyRowErrors({});
    const baseNote = stocktakeMovementNotePrefix.trim() || `Physical stocktake ${new Date().toISOString().slice(0, 10)}`;
    let okCount = 0;
    for (const step of plan) {
      const { row, movement_type, quantity } = step;
      const extra = (row.lineNote || '').trim();
      const note = extra ? `${baseNote} — ${extra}` : `${baseNote} — ${row.name}`;
      const qtyStr = Number.isFinite(quantity) ? Number(quantity.toFixed(10)).toString() : String(quantity);
      try {
        const res = await api.post(
          `${API.MAX_KITCHEN_INVENTORY}/items/${encodeURIComponent(row.inventoryItemId)}/movements`,
          {
            movement_type,
            quantity: qtyStr || String(quantity),
            note
          }
        );
        const data = readMaxKitchenClientEnvelope(res) || {};
        const newQty =
          data.new_current_quantity ??
          data.newCurrentQuantity ??
          data.current_quantity ??
          data?.item?.current_quantity;
        if (newQty != null && newQty !== '') {
          const s = String(newQty);
          setCountRows((prev) =>
            prev.map((r) => (r.key === row.key ? { ...r, systemBookQty: s, physicalQty: s } : r))
          );
          setCatalogRows((prev) =>
            prev.map((c) => (c.id === row.inventoryItemId ? { ...c, current_quantity: newQty } : c))
          );
        } else {
          const phy = String(row.physicalQty ?? '').trim();
          if (phy) {
            setCountRows((prev) =>
              prev.map((r) =>
                r.key === row.key ? { ...r, systemBookQty: phy, physicalQty: phy } : r
              )
            );
          }
        }
        setApplyRowErrors((prev) => {
          const next = { ...prev };
          delete next[row.key];
          return next;
        });
        okCount += 1;
      } catch (e) {
        const msg = formatApiError(e, 'Movement failed.');
        setApplyRowErrors((prev) => ({ ...prev, [row.key]: msg }));
      }
    }
    setApplyBusy(false);
    if (okCount === plan.length) {
      showStoreSuccess(`Posted ${okCount} stock adjustment(s).`);
    } else if (okCount > 0) {
      showStoreSuccess(`Posted ${okCount} of ${plan.length} adjustment(s). Retry failed rows after fixing the issue.`);
    } else {
      showStoreError('No adjustments were posted.');
    }
  }, [countRows, stocktakeMovementNotePrefix]);

  const onCreateCountSession = async () => {
    const out = await createSession({
      title: sessionTitle.trim() || undefined,
      readiness_note: sessionReadinessNote.trim() || undefined
    });
    if (!out.ok) {
      showStoreError(out.message || 'Could not create session.');
      return;
    }
    const id = out.data?.session_id ?? out.data?.id;
    if (id) setActiveSessionId(String(id));
    showStoreSuccess('Count session created.');
    void listSessions();
  };

  const onPushLinesToSession = async () => {
    if (!activeSessionId.trim()) {
      showStoreError('Set or create a session id first.');
      return;
    }
    const lines = buildLinesFromCountRows();
    if (!lines.length) {
      showStoreError('Add at least one counted line with a physical quantity.');
      return;
    }
    const out = await putSessionLines(activeSessionId.trim(), { lines });
    if (!out.ok) {
      showStoreError(out.message || 'Could not save session lines.');
      return;
    }
    showStoreSuccess('Session lines saved.');
    void getSession(activeSessionId.trim());
  };

  const onFinalizeSession = async () => {
    if (!activeSessionId.trim()) {
      showStoreError('Session id is required.');
      return;
    }
    const body = {};
    const pct = String(sessionFinalizePct ?? '').trim();
    if (pct !== '' && !Number.isNaN(Number(pct))) {
      body.variance_suspicious_pct = String(Number(pct));
    }
    const out = await finalizeSession(activeSessionId.trim(), body);
    if (!out.ok) {
      showStoreError(out.message || 'Finalize failed.');
      return;
    }
    showStoreSuccess('Session finalized.');
    void getSession(activeSessionId.trim());
    void listSessions();
  };

  const onLoadSessionDetail = async () => {
    if (!activeSessionId.trim()) {
      showStoreError('Enter a session id.');
      return;
    }
    const out = await getSession(activeSessionId.trim());
    if (!out.ok) showStoreError(out.message || 'Could not load session.');
  };

  const openManagerSession = useCallback(
    async (sid) => {
      const id = String(sid ?? '').trim();
      if (!id) return;
      setActiveSessionId(id);
      const out = await getSession(id);
      if (!out.ok) showStoreError(out.message || 'Could not load session detail.');
    },
    [getSession]
  );

  const onSaveManagerLineNote = async (lineId) => {
    const sid = activeSessionId.trim();
    const lid = String(lineId ?? '').trim();
    if (!sid || !lid) return;
    const note = String(managerLineNoteDrafts[lid] ?? '').trim();
    setSavingManagerLineId(lid);
    const out = await managerReviewLine(sid, lid, {
      manager_note: note || undefined
    });
    setSavingManagerLineId(null);
    if (!out.ok) {
      showStoreError(out.message || 'Could not save manager note.');
      return;
    }
    showStoreSuccess('Manager note saved.');
    void getSession(sid);
  };

  return (
    <StorePageShell>
      {isOperatorStockReconRoute ? (
        <>
          <StorePageHeader title="Stock reconciliation" />

      <StoreSection title="Physical count vs system">
            <p className="text-sm font-medium text-slate-800 mb-2">Inventory catalog (paginated)</p>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <label className="text-sm text-slate-700">
                Page{' '}
                <input
                  type="number"
                  min={1}
                  className="w-16 border rounded px-2 py-1 text-sm ml-1"
                  value={catalogPage}
                  onChange={(e) => setCatalogPage(Math.max(1, Number(e.target.value) || 1))}
                />
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={catalogLoading}
                onClick={() => void loadCatalogPage()}
              >
                {catalogLoading ? 'Loading…' : 'Load page'}
              </Button>
              <Button type="button" variant="secondary" size="sm" disabled={!catalogRows.length} onClick={appendCatalogToCount}>
                Add page to count sheet
              </Button>
            </div>
            {catalogRows.length > 0 ? (
              <>
                <div className="mb-4 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-left text-slate-700 z-10">
                      <tr>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2 w-20">Unit</th>
                        <th className="px-3 py-2 w-28">System qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catalogRows.map((it) => (
                        <tr key={it.id} className="border-t border-slate-100">
                          <td className="px-3 py-1.5 font-medium text-slate-900">{it.name}</td>
                          <td className="px-3 py-1.5 text-slate-600">{it.unit || '—'}</td>
                          <td className="px-3 py-1.5 text-slate-600 tabular-nums">
                            {it.current_quantity != null && it.current_quantity !== '' ? String(it.current_quantity) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : !catalogLoading ? (
              <p className="text-xs text-slate-500 mb-3">No catalog rows yet — click &quot;Load page&quot; or wait for auto-load.</p>
            ) : null}

            <p className="text-sm font-medium text-slate-800 mb-2">Add counted lines</p>
            <div className="flex flex-wrap gap-2 mb-2">
              <input
                className="min-w-[12rem] flex-1 border rounded-lg px-3 py-2 text-sm"
                value={invSearch}
                onChange={(e) => setInvSearch(e.target.value)}
                placeholder="Search inventory (type 2+ characters)"
              />
              {invLoading ? <span className="text-xs text-slate-500 self-center">Searching…</span> : null}
            </div>
            {invOptions.length > 0 ? (
              <ul className="mb-4 max-h-36 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                {invOptions.map((it) => (
                  <li key={it.id}>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-teal-50 text-slate-800"
                      onClick={() => addCountRow(it)}
                    >
                      {it.name}{' '}
                      <span className="text-slate-500">
                        ({it.id}
                        {it.current_quantity != null && it.current_quantity !== '' ? ` · system ${it.current_quantity}` : ''})
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {countRows.length === 0 ? (
              <StoreNotice tone="amber">No count lines yet. Search and add inventory items above.</StoreNotice>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 mb-4 max-h-[26rem] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50 text-left text-slate-700 shadow-[0_1px_0_0_rgb(226_232_240)]">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 w-28">System qty</th>
                      <th className="px-3 py-2 w-28">Physical qty</th>
                      <th className="px-3 py-2 w-24">Variance</th>
                      <th className="px-3 py-2">Line note</th>
                      <th className="px-3 py-2 w-24 text-right"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {countRows.map((row) => {
                      const v = rowVariancePhysicalMinusSystem(row);
                      const vClass =
                        v == null
                          ? 'text-slate-400'
                          : v < 0
                            ? 'text-amber-800 font-medium'
                            : v > 0
                              ? 'text-teal-800 font-medium'
                              : 'text-slate-600';
                      const vLabel =
                        v == null
                          ? '—'
                          : Math.abs(v) < 1e-9
                            ? '0'
                            : String(Number(v.toFixed(6)));
                      return (
                        <tr key={row.key} className="border-t border-slate-100">
                          <td className="px-3 py-2">
                            <div className="font-medium text-slate-900">{row.name}</div>
                            <div className="text-xs text-slate-500">{row.inventoryItemId}</div>
                          </td>
                          <td className="px-3 py-2 text-slate-600 text-sm">
                            {row.systemBookQty ? `${row.systemBookQty}${row.unit ? ` ${row.unit}` : ''}` : '—'}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className="w-full border rounded px-2 py-1 text-sm"
                              value={row.physicalQty}
                              onChange={(e) => updateRow(row.key, { physicalQty: e.target.value })}
                              placeholder={row.unit ? `e.g. 12 (${row.unit})` : 'Qty'}
                            />
                          </td>
                          <td className={`px-3 py-2 text-sm tabular-nums ${vClass}`}>
                            <div>
                              {vLabel}
                              {row.unit && v != null && Math.abs(v) >= 1e-9 ? (
                                <span className="text-xs text-slate-500"> {row.unit}</span>
                              ) : null}
                            </div>
                            {applyRowErrors[row.key] ? (
                              <p className="text-xs text-red-600 mt-1 max-w-[14rem] leading-snug">{applyRowErrors[row.key]}</p>
                            ) : null}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              className="w-full border rounded px-2 py-1 text-sm"
                              value={row.lineNote}
                              onChange={(e) => updateRow(row.key, { lineNote: e.target.value })}
                              placeholder="Variance / location note"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(row.key)}>
                              Remove
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

        <div className="rounded-lg border border-teal-200 bg-teal-50/30 p-3 mb-4 space-y-3">
          <div className="max-w-xl">
            <label className="block text-sm text-slate-700">
              Movement note prefix
              <input
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white"
                value={stocktakeMovementNotePrefix}
                onChange={(e) => setStocktakeMovementNotePrefix(e.target.value)}
                placeholder="e.g. Physical stocktake 2026-04-18"
              />
            </label>
          </div>
          {plannedAdjustments.length > 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700">
              <p className="font-medium text-slate-800 mb-1">Planned adjustments ({plannedAdjustments.length})</p>
              <ul className="list-disc list-inside space-y-0.5">
                {plannedAdjustments.map((p) => (
                  <li key={p.row.key}>
                    {p.row.name}: {p.movement_type} {Number(p.quantity.toFixed(8))}
                    {p.row.unit ? ` ${p.row.unit}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            disabled={applyBusy || plannedAdjustments.length === 0}
            onClick={() => void applyBookStockFromCounts()}
          >
            {applyBusy ? 'Posting movements…' : 'Confirm and post book stock adjustments'}
          </Button>
        </div>

      </StoreSection>

      <StoreSection
        title="Next-day readiness"
        headerActions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
              value={mealSlot}
              onChange={(e) => setMealSlot(e.target.value)}
            >
              {MEAL_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={reconLoading}
              onClick={() => void fetchNextDayReadiness({ meal_slot: mealSlot, include_details: true })}
            >
              Refresh
            </Button>
          </div>
        }
      >
        {reconLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : reconError ? (
          <p className="text-sm text-red-600">{reconError}</p>
        ) : readiness && typeof readiness === 'object' ? (
          <div className="space-y-4 text-sm text-slate-700">
            {readiness.summary ? (
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-100 bg-slate-50">
                  Summary
                </p>
                <div className="p-3 space-y-3">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {[
                      ['Target date', readiness.summary.target_date],
                      ['Meal slot', readiness.summary.meal_slot],
                      [
                        'Readiness score',
                        readiness.summary.readiness_score != null ? `${readiness.summary.readiness_score} / 100` : '—'
                      ],
                      ['Status', readiness.summary.readiness_status],
                      ['Delivery menu lines', readiness.summary.delivery_menu_line_count],
                      ['Total meals ordered', readiness.summary.total_meals_ordered],
                      ['Inventory demand lines', readiness.summary.inventory_demand_lines],
                      ['Inventory lines ready', readiness.summary.inventory_lines_ready],
                      ['Inventory lines not ready', readiness.summary.inventory_lines_not_ready],
                      ['Shortage lines', readiness.summary.shortage_line_count]
                    ].map(([label, val]) => (
                      <div
                        key={String(label)}
                        className="shrink-0 min-w-[7.5rem] max-w-[11rem] rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 leading-tight">{label}</p>
                        <p className="text-sm font-medium text-slate-900 mt-0.5 tabular-nums break-words">{val ?? '—'}</p>
                      </div>
                    ))}
                  </div>
                  {nextDayDeliveryLines.length > 0 ? (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Menu items (ordered)</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {nextDayDeliveryLines.map((line, idx) => (
                          <div
                            key={`${line.menu_item_id ?? idx}-sum-${idx}`}
                            className="shrink-0 max-w-[14rem] rounded-lg border border-teal-100 bg-teal-50/40 px-2.5 py-1.5"
                          >
                            <p className="text-xs font-medium text-slate-900 truncate" title={line.menu_item_name ?? ''}>
                              {line.menu_item_name ?? '—'}
                            </p>
                            <p className="text-[11px] text-slate-600 tabular-nums mt-0.5">
                              Qty {readinessQtyLabel(line.total_quantity)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {nextDayPrepItems.length > 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 border-b border-slate-100 bg-slate-50">
                  Prep readiness — ingredients ({readiness.prep_readiness?.ready_count ?? 0} ready ·{' '}
                  {readiness.prep_readiness?.not_ready_count ?? nextDayPrepItems.filter((r) => r.is_ready === false).length} not
                  ready)
                </p>
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-100 text-left text-slate-700 z-10">
                      <tr>
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2 w-24">Required</th>
                        <th className="px-3 py-2 w-24">On hand</th>
                        <th className="px-3 py-2 w-24">Deficit</th>
                        <th className="px-3 py-2 w-16">Unit</th>
                        <th className="px-3 py-2 w-20">Ready</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {nextDayPrepItems.map((row, idx) => (
                        <tr key={`${row.inventory_item_id ?? idx}-${idx}`}>
                          <td className="px-3 py-2">
                            <div className="font-medium text-slate-900">{row.item_name ?? '—'}</div>
                            {row.inventory_item_id ? (
                              <div className="text-xs text-slate-500 font-mono">{row.inventory_item_id}</div>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 tabular-nums">{readinessQtyLabel(row.required_quantity)}</td>
                          <td className="px-3 py-2 tabular-nums">{readinessQtyLabel(row.current_quantity)}</td>
                          <td className="px-3 py-2 tabular-nums text-amber-900">{readinessQtyLabel(row.deficit)}</td>
                          <td className="px-3 py-2">{row.unit ?? '—'}</td>
                          <td className="px-3 py-2">
                            {row.is_ready ? (
                              <span className="text-teal-800 font-medium">Yes</span>
                            ) : (
                              <span className="text-amber-800 font-medium">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {nextDayShortageRows.length > 0 ? (
              <div className="rounded-lg border border-amber-100 bg-amber-50/30 overflow-hidden">
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-amber-900 border-b border-amber-100 bg-amber-50/80">
                  Shortage detection ({readiness.shortage_detection?.shortage_count ?? nextDayShortageRows.length} lines)
                </p>
                <div className="max-h-96 overflow-auto bg-white">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-amber-50 text-left text-slate-700 z-10">
                      <tr>
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2 w-24">Required</th>
                        <th className="px-3 py-2 w-24">On hand</th>
                        <th className="px-3 py-2 w-24">Deficit</th>
                        <th className="px-3 py-2 w-16">Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {nextDayShortageRows.map((row, idx) => (
                        <tr key={`${row.inventory_item_id ?? idx}-short-${idx}`}>
                          <td className="px-3 py-2">
                            <div className="font-medium text-slate-900">{row.item_name ?? '—'}</div>
                            {row.inventory_item_id ? (
                              <div className="text-xs text-slate-500 font-mono">{row.inventory_item_id}</div>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{row.category ?? '—'}</td>
                          <td className="px-3 py-2 tabular-nums">{readinessQtyLabel(row.required_quantity)}</td>
                          <td className="px-3 py-2 tabular-nums">{readinessQtyLabel(row.current_quantity)}</td>
                          <td className="px-3 py-2 tabular-nums font-medium text-amber-900">{readinessQtyLabel(row.deficit)}</td>
                          <td className="px-3 py-2">{row.unit ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {readinessNotes.length > 0 ? (
              <div className="rounded-lg border border-teal-100 bg-teal-50/50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal-800 mb-2">Readiness notes</p>
                <ul className="space-y-2">
                  {readinessNotes.map((n) => (
                    <li key={n.label} className="text-sm text-slate-800">
                      <span className="text-xs text-slate-500">{n.label}: </span>
                      {n.text}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <StoreNotice tone="amber">No readiness data.</StoreNotice>
        )}
      </StoreSection>

      <StoreSection title="Optional count record for managers">
        {sessionHookError ? <p className="text-sm text-red-600 mb-2">{sessionHookError}</p> : null}
        <div className="grid gap-3 md:grid-cols-2 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title (optional)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="e.g. Evening freezer count"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Readiness note (optional)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={sessionReadinessNote}
              onChange={(e) => setSessionReadinessNote(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <Button type="button" variant="secondary" disabled={sessionLoading} onClick={() => void onCreateCountSession()}>
            Create session
          </Button>
        </div>
        <div className="flex flex-wrap items-end gap-2 mb-3">
          <div className="flex-1 min-w-[12rem]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Active session id</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm font-mono"
              value={activeSessionId}
              onChange={(e) => setActiveSessionId(e.target.value)}
              placeholder="Paste session UUID"
            />
          </div>
          <Button type="button" variant="outline" disabled={sessionLoading} onClick={() => void onLoadSessionDetail()}>
            Load detail
          </Button>
        </div>

        {extractSessionsList(sessionsList).length > 0 ? (
          <ul className="text-sm text-slate-700 mb-4 space-y-1 max-h-32 overflow-y-auto border rounded-lg p-2 bg-slate-50/80">
            {extractSessionsList(sessionsList).map((s) => {
              const sid = s.id ?? s.session_id;
              return (
                <li key={String(sid)}>
                  <button
                    type="button"
                    className="text-teal-700 hover:underline font-mono text-xs text-left"
                    onClick={() => setActiveSessionId(String(sid))}
                  >
                    {String(sid)} — {s.status ?? '—'}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : sessionsList != null ? (
          <details className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 mb-4">
            <summary className="cursor-pointer text-sm font-medium text-slate-800">Session list response</summary>
            <pre className="mt-2 max-h-40 overflow-auto text-xs">{JSON.stringify(sessionsList, null, 2)}</pre>
          </details>
        ) : null}

        <div className="flex flex-wrap gap-2 items-center mb-4">
          <Button type="button" disabled={sessionLoading} onClick={() => void onPushLinesToSession()}>
            Save count sheet to session
          </Button>
          <label className="text-sm text-slate-700 flex items-center gap-2">
            Finalize threshold
            <input
              className="w-20 border rounded px-2 py-1 text-sm"
              value={sessionFinalizePct}
              onChange={(e) => setSessionFinalizePct(e.target.value)}
            />
          </label>
          <Button type="button" variant="secondary" disabled={sessionLoading} onClick={() => void onFinalizeSession()}>
            Finalize session
          </Button>
        </div>

        {sessionDetail && typeof sessionDetail === 'object' ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-800">Session detail</p>
            <div className="text-sm text-slate-700">
              <span className="font-medium">Status:</span> {sessionDetail.status ?? '—'}{' '}
              {sessionDetail.finalized_at ? (
                <span className="text-slate-500">(finalized {String(sessionDetail.finalized_at)})</span>
              ) : null}
            </div>
            <details className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <summary className="cursor-pointer text-sm font-medium text-slate-800">Raw session JSON</summary>
              <pre className="mt-2 max-h-64 overflow-auto text-xs">{JSON.stringify(sessionDetail, null, 2)}</pre>
            </details>
          </div>
        ) : null}
      </StoreSection>
        </>
      ) : null}

      {isManagerStockReconRoute ? (
        <>
          <StorePageHeader title="Reconciliation sessions" />

          <StoreSection
            title="Reconciliation sessions "
            headerActions={
              <Button type="button" variant="outline" size="sm" disabled={sessionLoading} onClick={() => void listSessions()}>
                Refresh list
              </Button>
            }
          >
            {sessionHookError ? <p className="text-sm text-red-600 mb-2">{sessionHookError}</p> : null}
            <p className="text-xs text-slate-600 mb-3">
              Session list loads when you open this page. Open a row to load detail.
            </p>
            {sessionLoading && extractSessionsList(sessionsList).length === 0 ? (
              <p className="text-sm text-slate-500 mb-3">Loading sessions…</p>
            ) : null}
            {extractSessionsList(sessionsList).length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-slate-200 mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-700">
                    <tr>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 min-w-[8rem] max-w-[14rem]">Readiness note</th>
                      <th className="px-3 py-2 whitespace-nowrap">Finalized</th>
                      <th className="px-3 py-2 w-40 text-right"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractSessionsList(sessionsList).map((s) => {
                      const sid = s.id ?? s.session_id;
                      const note = s.readiness_note ?? s.readinessNote;
                      const finalized = s.finalized_at ?? s.finalizedAt;
                      return (
                        <tr key={String(sid)} className="border-t border-slate-100">
                          <td className="px-3 py-2">{s.status ?? '—'}</td>
                          <td className="px-3 py-2 text-slate-700 align-top break-words max-w-[14rem]">
                            {note != null && String(note).trim() !== '' ? String(note) : '—'}
                          </td>
                          <td className="px-3 py-2 text-slate-700 align-top">{formatDateTimeIST(finalized)}</td>
                          <td className="px-3 py-2 text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={sessionLoading}
                              onClick={() => void openManagerSession(sid)}
                            >
                              {String(activeSessionId) === String(sid) ? 'Reload detail' : 'Open detail'}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : !sessionLoading ? (
              <StoreNotice tone="amber" className="mb-3">
                No reconciliation sessions yet. Operators create guided sessions from <strong>Store operator → Stock reconciliation</strong>.
              </StoreNotice>
            ) : null}

            {sessionDetail && typeof sessionDetail === 'object' && activeSessionId.trim() ? (
              <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
                {Array.isArray(sessionDetail.lines) && sessionDetail.lines.length > 0 ? (
                  <div className="max-h-[28rem] overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-[1] bg-slate-100 text-left text-slate-700 shadow-sm">
                        <tr>
                          <th className="px-3 py-2 font-medium">Item</th>
                          <th className="px-3 py-2 font-medium text-right whitespace-nowrap">Physical</th>
                          <th className="px-3 py-2 font-medium text-right whitespace-nowrap">System</th>
                          <th className="px-3 py-2 font-medium text-right whitespace-nowrap">Variance</th>
                          <th className="px-3 py-2 font-medium min-w-[6rem]">Line note</th>
                          <th className="px-3 py-2 font-medium whitespace-nowrap">Suspicious</th>
                          <th className="px-3 py-2 font-medium whitespace-nowrap">Mgr ack</th>
                          <th className="px-3 py-2 font-medium min-w-[11rem]">Manager note</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-800">
                        {sessionDetail.lines.map((ln) => {
                          const lid = ln.id ?? ln.line_id;
                          const lidStr = String(lid);
                          const name = ln.inventory_item_name ?? ln.inventory_item_id ?? '—';
                          const serverNote = ln.manager_note != null ? String(ln.manager_note) : '';
                          const draft = managerLineNoteDrafts[lidStr] ?? '';
                          const noteDirty = draft.trim() !== serverNote.trim();
                          const rowSaving = savingManagerLineId === lidStr;
                          return (
                            <tr key={lidStr} className="border-t border-slate-100 hover:bg-slate-50/80">
                              <td className="px-3 py-2 align-top">{name}</td>
                              <td className="px-3 py-2 align-top text-right tabular-nums">
                                {formatReconQty(ln.physical_quantity)}
                              </td>
                              <td className="px-3 py-2 align-top text-right tabular-nums">
                                {formatReconQty(ln.system_quantity_snapshot ?? ln.system_quantity)}
                              </td>
                              <td className="px-3 py-2 align-top text-right tabular-nums">{formatReconQty(ln.variance)}</td>
                              <td className="px-3 py-2 align-top text-xs break-words max-w-[12rem]">{formatTextCell(ln.note)}</td>
                              <td className="px-3 py-2 align-top">{ln.suspicious ? 'Yes' : 'No'}</td>
                              <td className="px-3 py-2 align-top">{ln.manager_acknowledged ? 'Yes' : 'No'}</td>
                              <td className="px-3 py-2 align-top min-w-[11rem]">
                                <div className="flex flex-col gap-1.5">
                                  <input
                                    type="text"
                                    className="w-full min-w-[8rem] border border-slate-200 rounded-md px-2 py-1 text-xs"
                                    value={draft}
                                    onChange={(e) =>
                                      setManagerLineNoteDrafts((prev) => ({ ...prev, [lidStr]: e.target.value }))
                                    }
                                    placeholder="Add manager note…"
                                    disabled={sessionLoading || rowSaving}
                                    aria-label={`Manager note for ${name}`}
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="self-start"
                                    disabled={sessionLoading || rowSaving || !noteDirty}
                                    onClick={() => void onSaveManagerLineNote(lidStr)}
                                  >
                                    {rowSaving ? 'Saving…' : 'Save note'}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="px-3 py-4 text-sm text-slate-500">No lines on this session yet.</p>
                )}
              </div>
            ) : null}
          </StoreSection>
        </>
      ) : null}

      {!isOperatorStockReconRoute && !isManagerStockReconRoute ? (
        <StoreNotice tone="amber">Use the store-operator or store-manager navigation to open stock reconciliation.</StoreNotice>
      ) : null}
    </StorePageShell>
  );
};

export default StoreKitchenStockReconciliationPage;
