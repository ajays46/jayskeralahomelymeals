import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';

const toNum = (value) => Number(Number(value || 0).toFixed(4));

const normalizeItems = (itemsRaw) => {
  const arr = Array.isArray(itemsRaw) ? itemsRaw : [];
  return arr.map((i) => ({
    id: String(i.id),
    name: i.name,
    unit: i.unit,
    category: i.category ?? '',
    min_quantity: toNum(i.min_quantity ?? 0),
    current_quantity: toNum(i.current_quantity ?? 0)
  }));
};

/** Low-stock / shopping-list rows may omit `id`; synthesize stable keys for UI state. */
const normalizeAlertListItems = (itemsRaw) => {
  const arr = Array.isArray(itemsRaw) ? itemsRaw : [];
  return arr.map((i, idx) => ({
    id:
      i.id != null && i.id !== ''
        ? String(i.id)
        : `alert-${idx}-${String(i.name || 'item')
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .slice(0, 32) || 'row'}`,
    name: i.name,
    unit: i.unit,
    category: i.category ?? '',
    min_quantity: toNum(i.min_quantity ?? 0),
    current_quantity: toNum(i.current_quantity ?? 0)
  }));
};

const normalizeMovement = (m, itemNameMap) => ({
  id: String(m.id ?? `m-${Date.now()}`),
  item_id: m.item_id != null && m.item_id !== '' ? String(m.item_id) : '',
  item_name: m.item_name || (m.item_id != null ? itemNameMap[String(m.item_id)] : '') || '',
  movement_type: m.movement_type,
  quantity: toNum(m.quantity ?? 0),
  delta: toNum(m.delta ?? (m.movement_type === 'ADD' ? m.quantity : -m.quantity)),
  occurred_at: m.occurred_at || m.created_at || new Date().toISOString(),
  note: m.note || ''
});

const normalizeRecipeLines = (linesRaw) => {
  const arr = Array.isArray(linesRaw) ? linesRaw : [];
  return arr.map((l) => ({
    id: String(l.id ?? `r-${Date.now()}`),
    menu_item_id: String(l.menu_item_id ?? ''),
    menu_item_name: l.menu_item_name || '',
    inventory_item_id: String(l.inventory_item_id ?? ''),
    inventory_item_name: l.inventory_item_name || l.item_name || '',
    quantity_per_unit: toNum(l.quantity_per_unit ?? 0),
    unit: l.unit || ''
  }));
};

const normalizePlanDetail = (planRaw, itemNameMap) => {
  if (!planRaw) return null;

  const planId = String(planRaw.plan_id ?? planRaw.id ?? '');
  const status = planRaw.status || 'DRAFT';
  const plan_date = planRaw.plan_date || '';
  const meal_slot = planRaw.meal_slot || planRaw.mealSlot || '';

  const rawLines = planRaw.lines || planRaw.plan_lines || planRaw.kitchen_daily_plan_lines || [];
  const linesArr = Array.isArray(rawLines) ? rawLines : [];

  const lines = linesArr.map((line) => ({
    inventory_item_id: String(line.inventory_item_id ?? line.item_id ?? ''),
    item:
      line.inventory_item_name ||
      line.item_name ||
      itemNameMap[String(line.inventory_item_id ?? line.item_id ?? '')] ||
      '',
    required_quantity: toNum(line.required_quantity ?? 0),
    planned_issue_quantity: toNum(line.planned_issue_quantity ?? line.required_quantity ?? 0),
    issued_quantity: toNum(line.issued_quantity ?? 0),
    unit: line.unit || ''
  }));

  return {
    id: planId || 'unknown',
    plan_date,
    meal_slot,
    status,
    lines
  };
};

function useKitchenStoreData() {
  const [items, setItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [plans, setPlans] = useState([]);
  const [recipeLines, setRecipeLines] = useState([]);

  const [pipelineRuns, setPipelineRuns] = useState([]);
  const [demandForecasts, setDemandForecasts] = useState([]);
  const [financialForecasts, setFinancialForecasts] = useState([]);
  const [purchaseSuggestions, setPurchaseSuggestions] = useState([]);

  const [apiAvailable, setApiAvailable] = useState(false);

  const itemNameMap = useMemo(() => {
    const map = {};
    items.forEach((it) => {
      map[it.id] = it.name;
    });
    return map;
  }, [items]);

  const refreshItems = async () => {
    const itemsRes = await api.get('/kitchen-store/v1/items', {
      params: { page: 1, page_size: 50 }
    });
    const itemsData = itemsRes.data?.data || {};
    const fetchedItems = normalizeItems(itemsData.items || itemsData || []);
    setItems(fetchedItems);
    return fetchedItems;
  };

  // Bootstrap UI state from kitchen-store proxy APIs
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        // 1) Items
        const fetchedItems = await refreshItems();
        if (fetchedItems.length > 0) {
          if (cancelled) return;
          setItems(fetchedItems);
        }

        // 2) Low stock
        try {
          const lowRes = await api.get('/kitchen-store/v1/alerts/low-stock');
          const lowData = lowRes.data?.data || {};
          const lowItems = normalizeAlertListItems(lowData.items || []);
          if (!cancelled) setLowStockItems(lowItems);
        } catch {
          // Low-stock can be computed from items if endpoint isn't ready
          if (!cancelled) {
            setLowStockItems(
              fetchedItems.length
                ? fetchedItems.filter((it) => it.current_quantity <= it.min_quantity)
                : []
            );
          }
        }

        // 3) Movements (combined timeline by fetching movements for each item)
        const currentItems = fetchedItems;
        const localItemNameMap = {};
        currentItems.forEach((it) => {
          localItemNameMap[it.id] = it.name;
        });
        const movementLists = await Promise.all(
          currentItems.map(async (it) => {
            const movRes = await api.get(`/kitchen-store/v1/items/${it.id}/movements`, {
              params: { page: 1, page_size: 50 }
            });
            const movRaw = movRes.data?.data || [];
            const arr = Array.isArray(movRaw) ? movRaw : movRaw.movements || [];
            return arr.map((m) => normalizeMovement(m, localItemNameMap));
          })
        );
        const flatMovements = movementLists.flat();
        flatMovements.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
        if (!cancelled) setMovements(flatMovements);

        // 4) Recipes
        try {
          const rRes = await api.get('/kitchen-store/v2/recipes/lines');
          const rData = rRes.data?.data;
          const rawLines = Array.isArray(rData) ? rData : rData?.lines || [];
          const normalizedLines = normalizeRecipeLines(rawLines);
          if (!cancelled && normalizedLines.length > 0) setRecipeLines(normalizedLines);
        } catch {
          // keep mock
        }

        // 5) Plans: load from localStorage; if missing, generate a new plan for today
        try {
          let planId = localStorage.getItem('kitchen_store_latest_plan_id');
          let planLoaded = false;
          if (planId) {
            const today = new Date().toISOString().slice(0, 10);
            try {
              const pRes = await api.get(`/kitchen-store/v2/plans/${planId}`);
              const pData = pRes.data?.data;
              const mapped = normalizePlanDetail(pData, localItemNameMap);
              if (!cancelled && mapped) {
                setPlans([mapped]);
                planLoaded = true;
              } else {
                planId = null;
              }
            } catch {
              planId = null;
            }
          }

          // If still no plan, generate one
          if (!planLoaded && !cancelled) {
            const today = new Date().toISOString().slice(0, 10);
            try {
              const genRes = await api.post('/kitchen-store/v2/plans/generate', {
                plan_date: today,
                meal_slot: 'ALL',
                overwrite_existing: false
              });
              const genData = genRes.data?.data || {};
              const newPlanId = String(genData.plan_id || genData.planId || '');
              if (newPlanId) {
                localStorage.setItem('kitchen_store_latest_plan_id', newPlanId);
                const pRes = await api.get(`/kitchen-store/v2/plans/${newPlanId}`);
                const pData = pRes.data?.data;
                const mapped = normalizePlanDetail(pData, localItemNameMap);
                if (!cancelled && mapped) setPlans([mapped]);
              }
            } catch {
              // keep mock plans
            }
          }
        } catch {
          // keep mock plans
        }

        // 6) Forecasts + purchase recommendations
        try {
          const invRes = await api.get('/kitchen-store/v2/forecasts/inventory');
          const invData = invRes.data?.data || {};
          const invArr = invData || [];
          const mapped = (Array.isArray(invArr) ? invArr : invData?.forecasts || []).map((row) => ({
            forecast_date: row.forecast_date,
            meal_slot: row.meal_slot,
            item: row.item || row.inventory_item_name || row.inventory_item || '',
            forecast_quantity: toNum(row.forecast_quantity),
            unit: row.unit || row.inventory_unit || ''
          }));
          if (!cancelled && mapped.length > 0) setDemandForecasts(mapped);
        } catch {
          // keep mock
        }

        try {
          const finRes = await api.get('/kitchen-store/v2/forecasts/financial');
          const finData = finRes.data?.data || {};
          const finArr = finData || [];
          const mapped = (Array.isArray(finArr) ? finArr : finData?.forecasts || []).map((row) => ({
            forecast_date: row.forecast_date,
            forecast_revenue: toNum(row.forecast_revenue),
            forecast_ingredient_cost: toNum(row.forecast_ingredient_cost),
            forecast_gross_margin: toNum(row.forecast_gross_margin)
          }));
          if (!cancelled && mapped.length > 0) setFinancialForecasts(mapped);
        } catch {
          // keep mock
        }

        try {
          const recRes = await api.get('/kitchen-store/v2/purchases/recommendations');
          const recData = recRes.data?.data || {};
          const recArr = recData || [];
          const mapped = (Array.isArray(recArr) ? recArr : recData?.recommendations || []).map((row) => ({
            forecast_date: row.forecast_date,
            meal_slot: row.meal_slot || 'ALL',
            item: row.item || row.inventory_item_name || row.inventory_item || '',
            forecast_quantity: toNum(row.forecast_quantity),
            current_quantity: toNum(row.current_quantity),
            safety_buffer: toNum(row.safety_buffer),
            recommended_purchase_quantity: toNum(row.recommended_purchase_quantity)
          }));
          if (!cancelled && mapped.length > 0) setPurchaseSuggestions(mapped);
        } catch {
          // keep mock
        }

        if (!cancelled) setApiAvailable(true);
      } catch (e) {
        if (!cancelled) setApiAvailable(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mutations (inventory movement)
  const addMovementViaApi = async (itemId, movementType, quantity, note) => {
    const qty = toNum(quantity);
    if (!qty || qty <= 0) return;

    const payload = {
      movement_type: movementType,
      quantity: qty,
      note: note || ''
    };

    const res = await api.post(`/kitchen-store/v1/items/${itemId}/movements`, payload);
    return res.data?.data;
  };

  const extractCreatedItemId = (raw) => {
    if (!raw || typeof raw !== 'object') return null;
    const id = raw.id ?? raw.item_id;
    if (id) return String(id);
    const inner = raw.data;
    if (inner && typeof inner === 'object' && (inner.id || inner.item_id)) {
      return String(inner.id ?? inner.item_id);
    }
    return null;
  };

  const createItem = async (payload) => {
    if (!apiAvailable) return { ok: false, message: 'Kitchen Store API unavailable' };
    try {
      const res = await api.post('/kitchen-store/v1/items', payload);
      const raw = res.data?.data;
      const itemId = extractCreatedItemId(raw);
      await refreshItems();
      try {
        const lowRes = await api.get('/kitchen-store/v1/alerts/low-stock');
        const lowData = lowRes.data?.data || {};
        setLowStockItems(normalizeItems(lowData.items || []));
      } catch {
        // ignore low stock refresh failure
      }
      return { ok: true, itemId };
    } catch (e) {
      return {
        ok: false,
        message: e?.response?.data?.detail || e?.response?.data?.message || e.message || 'Failed to create item'
      };
    }
  };

  const listItemImages = async (itemId) => {
    if (!apiAvailable) return [];
    try {
      const res = await api.get(`/kitchen-store/v1/items/${itemId}/images`);
      const data = res.data?.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };

  const uploadItemImage = async (itemId, file, { isPrimary = false, sortOrder = null } = {}) => {
    if (!apiAvailable) return { ok: false, message: 'Kitchen Store API unavailable' };
    if (!file) return { ok: false, message: 'No file selected' };
    try {
      const fd = new FormData();
      fd.append('image', file);
      if (isPrimary) fd.append('is_primary', 'true');
      if (sortOrder != null && sortOrder !== '') fd.append('sort_order', String(sortOrder));
      await api.post(`/kitchen-store/v1/items/${itemId}/images`, fd);
      return { ok: true };
    } catch (e) {
      return {
        ok: false,
        message: e?.response?.data?.message || e?.response?.data?.detail || e.message || 'Image upload failed'
      };
    }
  };

  const getItemDetail = async (itemId) => {
    if (!apiAvailable) return null;
    const res = await api.get(`/kitchen-store/v1/items/${itemId}`);
    return res.data?.data || null;
  };

  const refreshItemMovements = async (itemId) => {
    const movRes = await api.get(`/kitchen-store/v1/items/${itemId}/movements`, {
      params: { page: 1, page_size: 50 }
    });
    const movRaw = movRes.data?.data || [];
    const arr = Array.isArray(movRaw) ? movRaw : movRaw.movements || [];
    const list = arr.map((m) => normalizeMovement(m, itemNameMap));
    list.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
    setMovements((prev) => [...list.filter((x) => x.item_id === itemId), ...prev.filter((x) => x.item_id !== itemId)]);
  };

  const addStock = async (itemId, quantity, note = 'Manual stock add') => {
    if (!apiAvailable) {
      return { ok: false, message: 'Kitchen Store API unavailable' };
    }

    try {
      const out = await addMovementViaApi(itemId, 'ADD', quantity, note);
      if (out?.new_current_quantity != null) {
        setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, current_quantity: toNum(out.new_current_quantity) } : it)));
      }
      await refreshItemMovements(itemId);
    } catch {
      // keep UI stable
    }
  };

  const removeStock = async (itemId, quantity, note = 'Manual adjustment') => {
    if (!apiAvailable) {
      return { ok: false, message: 'Kitchen Store API unavailable' };
    }

    try {
      const out = await addMovementViaApi(itemId, 'REMOVE', quantity, note);
      if (out?.new_current_quantity != null) {
        setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, current_quantity: toNum(out.new_current_quantity) } : it)));
      }
      await refreshItemMovements(itemId);
    } catch {
      // keep UI stable
    }
  };

  const expireStock = async (itemId, quantity, note = 'Expired stock') => {
    if (!apiAvailable) {
      return { ok: false, message: 'Kitchen Store API unavailable' };
    }

    try {
      const out = await addMovementViaApi(itemId, 'EXPIRE', quantity, note);
      if (out?.new_current_quantity != null) {
        setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, current_quantity: toNum(out.new_current_quantity) } : it)));
      }
      await refreshItemMovements(itemId);
    } catch {
      // keep UI stable
    }
  };

  // Mutations (plans)
  const refreshPlan = async (planId) => {
    const pRes = await api.get(`/kitchen-store/v2/plans/${planId}`);
    const pData = pRes.data?.data;
    const mapped = normalizePlanDetail(pData, itemNameMap);
    if (mapped) setPlans([mapped]);
  };

  const approvePlan = async (planId, approver = 'Store Manager') => {
    if (!apiAvailable) {
      return { ok: false, message: 'Kitchen Store API unavailable' };
    }

    try {
      await api.post(`/kitchen-store/v2/plans/${planId}/approve`, { note: `Approved by ${approver}` });
      await refreshPlan(planId);
    } catch {
      // fallback: keep UX flow
      setPlans((prev) => prev.map((p) => (p.id === planId && p.status === 'DRAFT' ? { ...p, status: 'APPROVED', approved_by: approver } : p)));
    }
  };

  const issuePlan = async (planId, operator = 'Store Operator') => {
    if (!apiAvailable) {
      return { ok: false, message: 'Kitchen Store API unavailable' };
    }

    try {
      await api.post(`/kitchen-store/v2/plans/${planId}/issue`, { note: `Issued by ${operator}` });
      // refresh plan and items
      await refreshPlan(planId);
      try {
        const itemsRes = await api.get('/kitchen-store/v1/items', { params: { page: 1, page_size: 50 } });
        const itemsData = itemsRes.data?.data || {};
        const fetchedItems = normalizeItems(itemsData.items || itemsData || []);
        if (fetchedItems.length) setItems(fetchedItems);
      } catch {
        // ignore
      }
    } catch (e) {
      const detail = e?.response?.data?.detail || e?.response?.data?.message || '';
      const mightBeApprovalIssue = (detail || '').toLowerCase().includes('approve') || (detail || '').toLowerCase().includes('approved');

      if (mightBeApprovalIssue) {
        try {
          // Try to keep the Plan -> Approve -> Issue UX working even if the approval endpoint exists
          await api.post(`/kitchen-store/v2/plans/${planId}/approve`, { note: `Auto-approved by ${operator} (retry)` });
          await api.post(`/kitchen-store/v2/plans/${planId}/issue`, { note: `Issued by ${operator}` });
          await refreshPlan(planId);
          return { ok: true, message: `Plan ${planId} issued after approval retry.` };
        } catch {
          // fallthrough
        }
      }

      return { ok: false, message: detail || e?.message || 'Issue failed' };
    }
  };

  // Recipe lines
  const upsertRecipeLine = async (line) => {
    if (!apiAvailable) {
      return { ok: false, message: 'Kitchen Store API unavailable' };
    }

    const payload = {
      menu_item_id: line.menu_item_id,
      inventory_item_id: line.inventory_item_id,
      quantity_per_unit: line.quantity_per_unit,
      unit: line.unit
    };

    try {
      await api.post('/kitchen-store/v2/recipes/lines', payload);
      const rRes = await api.get('/kitchen-store/v2/recipes/lines');
      const rData = rRes.data?.data;
      const rawLines = Array.isArray(rData) ? rData : rData?.lines || [];
      const normalizedLines = normalizeRecipeLines(rawLines);
      if (normalizedLines.length) setRecipeLines(normalizedLines);
    } catch {
      // keep stable
    }
  };

  const deleteRecipeLine = (id) => {
    // External API doesn't expose delete in this v0.1 guide.
    // No-op to avoid local dummy state diverging from backend.
    console.warn('Delete recipe lines is not supported by kitchen-store API v0.1.');
    return { ok: false, message: 'Delete not supported yet' };
  };

  // Exposed hooks/shape (keep existing component contracts)
  return {
    items,
    lowStockItems:
      lowStockItems.length > 0 ? lowStockItems : items.filter((it) => it.current_quantity <= it.min_quantity),
    movements,
    plans,
    recipeLines,
    addStock,
    removeStock,
    expireStock,
    approvePlan,
    issuePlan,
    addRecipeLine: upsertRecipeLine,
    deleteRecipeLine,
    createItem,
    getItemDetail,
    listItemImages,
    uploadItemImage,
    refreshItems,
    // Forecast UI contracts
    pipelineRuns,
    demandForecasts,
    financialForecasts,
    purchaseSuggestions
  };
}

export const useKitchenInventoryMock = () => {
  const data = useKitchenStoreData();
  return {
    items: data.items,
    lowStockItems: data.lowStockItems,
    movements: data.movements,
    createItem: data.createItem,
    getItemDetail: data.getItemDetail,
    listItemImages: data.listItemImages,
    uploadItemImage: data.uploadItemImage,
    refreshItems: data.refreshItems,
    addStock: data.addStock,
    removeStock: data.removeStock,
    expireStock: data.expireStock
  };
};

export const useKitchenPlansMock = () => {
  const data = useKitchenStoreData();
  return { plans: data.plans, approvePlan: data.approvePlan };
};

export const useKitchenIssueMock = () => {
  const data = useKitchenStoreData();
  return { plans: data.plans, issued: data.plans?.some((p) => p.status === 'ISSUED'), issuedBy: data.plans?.find((p) => p.status === 'ISSUED')?.issued_by, issuePlan: data.issuePlan };
};

export const useKitchenReportsMock = () => {
  const data = useKitchenStoreData();
  const { items, movements } = data;

  const usageMap = movements
    .filter((m) => m.movement_type === 'USAGE')
    .reduce((acc, row) => {
      acc[row.item_id] = toNum((acc[row.item_id] || 0) + toNum(row.quantity));
      return acc;
    }, {});

  const addMap = movements
    .filter((m) => m.movement_type === 'ADD')
    .reduce((acc, row) => {
      acc[row.item_id] = toNum((acc[row.item_id] || 0) + toNum(row.quantity));
      return acc;
    }, {});

  const orderSummary = [];
  const totalRevenue = 0;

  const consumptionSummary = items
    .map((item) => ({
      item: item.name,
      used: toNum(usageMap[item.id] || 0),
      unit: item.unit
    }))
    .filter((row) => row.used > 0);

  const purchaseVsUsage = items.map((item) => ({
    item: item.name,
    purchased: toNum(addMap[item.id] || 0),
    used: toNum(usageMap[item.id] || 0),
    remaining: toNum(item.current_quantity),
    unit: item.unit
  }));

  return { orderSummary, totalRevenue, consumptionSummary, purchaseVsUsage, movements };
};

export const useKitchenRecipeMock = () => {
  const data = useKitchenStoreData();
  return {
    recipeLines: data.recipeLines,
    addRecipeLine: data.addRecipeLine,
    deleteRecipeLine: data.deleteRecipeLine
  };
};

export const useKitchenForecastMock = () => {
  const data = useKitchenStoreData();
  return {
    pipelineRuns: data.pipelineRuns,
    demandForecasts: data.demandForecasts,
    financialForecasts: data.financialForecasts
  };
};

export const useKitchenPurchaseSuggestionsMock = () => {
  const data = useKitchenStoreData();
  return { suggestions: data.purchaseSuggestions };
};

export const useKitchenShoppingListMock = () => {
  const data = useKitchenStoreData();
  return {
    shoppingList: data.lowStockItems.map((item) => ({
      id: item.id,
      name: item.name,
      unit: item.unit,
      category: item.category,
      target_quantity: item.min_quantity,
      needed_quantity: toNum(item.min_quantity - item.current_quantity)
    }))
  };
};

function getApiErrorMessage(error, fallback) {
  const detail = error?.response?.data?.detail;
  const message = error?.response?.data?.message;
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (Array.isArray(detail) && detail.length) {
    const parts = detail
      .map((x) => (typeof x === 'string' ? x : x?.msg || x?.message || JSON.stringify(x)))
      .filter(Boolean);
    if (parts.length) return parts.join('; ');
  }
  if (detail && typeof detail === 'object') {
    if (typeof detail.msg === 'string') return detail.msg;
    try {
      return JSON.stringify(detail);
    } catch {
      return message || error?.message || fallback;
    }
  }
  return message || error?.message || fallback;
}

/** Use in UI catch blocks for kitchen-store proxy errors (handles FastAPI `detail` shapes). */
export function formatKitchenStoreApiError(error, fallback = '') {
  return getApiErrorMessage(error, fallback);
}

const ITEMS_PAGE_SIZE_CATALOG = 50;
const MAX_CATALOG_PAGES = 40;

async function buildKitchenCatalogNameToIdMap() {
  const nameToId = new Map();
  for (let page = 1; page <= MAX_CATALOG_PAGES; page += 1) {
    const itemsRes = await api.get('/kitchen-store/v1/items', {
      params: { page, page_size: ITEMS_PAGE_SIZE_CATALOG }
    });
    const itemsData = itemsRes.data?.data || {};
    const batch = Array.isArray(itemsData.items)
      ? itemsData.items
      : Array.isArray(itemsData)
        ? itemsData
        : [];
    batch.forEach((it) => {
      const n = String(it?.name || '').trim().toLowerCase();
      if (n && it?.id != null && it.id !== '') nameToId.set(n, String(it.id));
    });
    if (batch.length < ITEMS_PAGE_SIZE_CATALOG) break;
  }
  return nameToId;
}

function enrichPurchaseRequestLinesByCatalogName(lines, nameToId) {
  return lines.map((line) => {
    if (line.resolved_inventory_item_id || line.inventory_item_id) return line;
    const k = String(line.inventory_item_name || line.requested_item_name || '').trim().toLowerCase();
    const matched = k ? nameToId.get(k) : undefined;
    if (!matched) return line;
    return {
      ...line,
      resolved_inventory_item_id: matched,
      inventory_item_id: line.inventory_item_id || matched
    };
  });
}

/** ISO or date string → locale date + time for store purchase flows */
/** Formats an ISO or date string for display (calendar date only, no time). */
export const formatKitchenDateTime = (value) => {
  if (value == null || value === '') return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
};

const normalizePurchaseSourceItem = (raw, index = 0, source = 'UNKNOWN') => {
  const inventoryItemId =
    raw?.inventory_item_id ?? raw?.item_id ?? raw?.inventoryItemId ?? raw?.inventoryId ?? '';
  const name = raw?.requested_item_name || raw?.name || raw?.item || raw?.inventory_item_name || raw?.inventory_item || '';
  const unit = raw?.requested_unit || raw?.unit || raw?.inventory_unit || raw?.base_unit || '';
  const suggestedQuantity =
    raw?.recommended_purchase_quantity ??
    raw?.needed_quantity ??
    raw?.requested_quantity ??
    raw?.forecast_quantity ??
    raw?.quantity ??
    raw?.target_quantity ??
    0;

  return {
    id: String(raw?.id ?? raw?.line_id ?? `${source}-${index}-${name || 'row'}`),
    inventory_item_id: inventoryItemId ? String(inventoryItemId) : '',
    name,
    unit,
    category: raw?.category || '',
    current_quantity: toNum(raw?.current_quantity ?? 0),
    min_quantity: toNum(raw?.min_quantity ?? raw?.target_quantity ?? 0),
    suggested_quantity: toNum(suggestedQuantity),
    safety_buffer: toNum(raw?.safety_buffer ?? 0),
    source,
    note: raw?.operator_note || raw?.note || ''
  };
};

const normalizePurchaseRequestLine = (raw, index = 0) => {
  const rawInv =
    raw?.inventory_item_id ?? raw?.item_id ?? raw?.inventory_item_uuid ?? raw?.inventoryItemId ?? '';
  const rawResolved =
    raw?.resolved_inventory_item_id ??
    raw?.resolved_item_id ??
    raw?.catalog_inventory_item_id ??
    raw?.linked_inventory_item_id ??
    '';
  const invId = rawInv ? String(rawInv) : '';
  const resolvedExplicit = rawResolved ? String(rawResolved) : '';
  return {
  id: String(raw?.id ?? raw?.line_id ?? `line-${index}`),
  inventory_item_id: invId,
  inventory_item_name:
    raw?.inventory_item_name || raw?.requested_item_name || raw?.item_name || '',
  requested_item_name:
    raw?.requested_item_name || raw?.inventory_item_name || raw?.item_name || '',
  requested_unit: raw?.requested_unit || raw?.unit || raw?.inventory_unit || '',
  requested_quantity: toNum(raw?.requested_quantity ?? raw?.quantity ?? 0),
  approved_quantity: toNum(raw?.approved_quantity ?? raw?.requested_quantity ?? raw?.quantity ?? 0),
  purchased_quantity: toNum(raw?.purchased_quantity ?? raw?.purchased_qty ?? 0),
  remaining_quantity: toNum(
    raw?.remaining_quantity ??
      (raw?.approved_quantity != null
        ? Number(raw.approved_quantity) - Number(raw?.purchased_quantity ?? raw?.purchased_qty ?? 0)
        : 0)
  ),
  is_new_item: Boolean(raw?.is_new_item),
  operator_note: raw?.operator_note || '',
  manager_note: raw?.manager_note || '',
  // Backend often sends line_status; older payloads used status
  status: raw?.line_status || raw?.status || 'DRAFT',
  fulfillment_status: raw?.fulfillment_status || '',
  comparison_status: raw?.comparison_status || '',
  manager_review_status: raw?.manager_review_status || '',
  resolved_inventory_item_id: resolvedExplicit || invId || ''
  };
};

const normalizePurchaseRequestHeader = (raw, index = 0) => {
  const lines = Array.isArray(raw?.lines) ? raw.lines.map((line, lineIndex) => normalizePurchaseRequestLine(line, lineIndex)) : [];
  const requestedById = raw?.requested_by ? String(raw.requested_by) : '';
  return {
    id: String(raw?.id ?? raw?.request_id ?? raw?.purchase_request_id ?? `request-${index}`),
    status: raw?.status || 'DRAFT',
    requested_note: raw?.requested_note || '',
    approval_note: raw?.approval_note || '',
    created_at: raw?.created_at || '',
    submitted_at: raw?.submitted_at || raw?.updated_at || '',
    approved_at: raw?.approved_at || '',
    updated_at: raw?.updated_at || '',
    requested_by_id: requestedById,
    operator_name:
      raw?.operator_name || raw?.requested_by_name || raw?.created_by_name || '',
    manager_name: raw?.manager_name || raw?.approved_by_name || raw?.approved_by || '',
    total_lines: Number(raw?.total_lines ?? raw?.lines_count ?? lines.length ?? 0),
    approved_lines: Number(raw?.approved_lines ?? lines.filter((line) => line.status === 'APPROVED').length),
    rejected_lines: Number(raw?.rejected_lines ?? lines.filter((line) => line.status === 'REJECTED').length),
    lines
  };
};

const normalizePurchaseReceiptLine = (raw, index = 0) => ({
  id: String(raw?.receipt_line_id ?? raw?.id ?? raw?.line_id ?? `receipt-line-${index}`),
  receipt_id: String(raw?.receipt_id ?? raw?.purchase_receipt_id ?? ''),
  inventory_item_id: raw?.inventory_item_id ? String(raw.inventory_item_id) : '',
  inventory_item_name: raw?.inventory_item_name || raw?.item_name || '',
  purchase_request_line_id: raw?.purchase_request_line_id ? String(raw.purchase_request_line_id) : '',
  purchased_qty: toNum(raw?.purchased_qty ?? raw?.purchased_quantity ?? 0),
  purchase_unit: raw?.purchase_unit || raw?.unit || '',
  received_qty_in_base_unit: toNum(raw?.received_qty_in_base_unit ?? 0),
  unit_price_in_base: toNum(raw?.unit_price_in_base ?? 0),
  line_total: toNum(raw?.line_total ?? 0),
  note: raw?.note || '',
  off_list_purchase_reason: raw?.off_list_purchase_reason || '',
  comparison_status: raw?.comparison_status || '',
  manager_review_status: raw?.manager_review_status || '',
  manager_action: raw?.manager_action || '',
  manager_action_note: raw?.manager_action_note || '',
  stock_applied: Boolean(raw?.stock_applied),
  purchase_date: raw?.purchase_date || ''
});

const normalizePurchaseReceiptHeader = (raw, index = 0) => ({
  id: String(raw?.id ?? raw?.receipt_id ?? `receipt-${index}`),
  receipt_id: String(raw?.receipt_id ?? raw?.id ?? `receipt-${index}`),
  purchase_request_id: raw?.purchase_request_id ? String(raw.purchase_request_id) : '',
  reference_invoice: raw?.reference_invoice || '',
  invoice_s3_key: raw?.invoice_s3_key || '',
  invoice_s3_url: raw?.invoice_s3_url || '',
  invoice_uploaded_at: raw?.invoice_uploaded_at || '',
  received_at: raw?.received_at || '',
  created_by: raw?.created_by || '',
  created_at: raw?.created_at || ''
});

const normalizePurchaseComparisonRow = (raw, index = 0) => ({
  id: String(raw?.id ?? raw?.line_id ?? `comparison-${index}`),
  inventory_item_name: raw?.inventory_item_name || raw?.requested_item_name || raw?.item_name || '',
  requested_unit: raw?.requested_unit || raw?.purchase_unit || raw?.unit || '',
  requested_quantity: toNum(raw?.requested_quantity ?? 0),
  approved_quantity: toNum(raw?.approved_quantity ?? raw?.requested_quantity ?? 0),
  purchased_quantity: toNum(raw?.purchased_quantity ?? raw?.purchased_qty ?? 0),
  remaining_quantity: toNum(
    raw?.remaining_quantity ??
      Number(raw?.approved_quantity ?? raw?.requested_quantity ?? 0) -
        Number(raw?.purchased_quantity ?? raw?.purchased_qty ?? 0)
  ),
  fulfillment_status: raw?.fulfillment_status || '',
  comparison_status: raw?.comparison_status || '',
  manager_review_status: raw?.manager_review_status || '',
  manager_note: raw?.manager_note || '',
  operator_note: raw?.operator_note || ''
});

const normalizePurchaseExceptionRow = (raw, index = 0) => ({
  id: String(raw?.receipt_line_id ?? raw?.line_id ?? raw?.id ?? `exception-${index}`),
  receipt_id: String(raw?.receipt_id ?? raw?.purchase_receipt_id ?? ''),
  purchase_request_line_id: raw?.purchase_request_line_id ? String(raw.purchase_request_line_id) : '',
  inventory_item_id: raw?.inventory_item_id ? String(raw.inventory_item_id) : '',
  inventory_item_name: raw?.inventory_item_name || raw?.item_name || raw?.requested_item_name || '',
  purchased_qty: toNum(raw?.purchased_qty ?? 0),
  purchase_unit: raw?.purchase_unit || raw?.unit || '',
  line_total: toNum(raw?.line_total ?? 0),
  off_list_purchase_reason: raw?.off_list_purchase_reason || '',
  comparison_status: raw?.comparison_status || '',
  manager_review_status: raw?.manager_review_status || '',
  manager_action: raw?.manager_action || '',
  manager_action_note: raw?.manager_action_note || '',
  stock_applied: Boolean(raw?.stock_applied),
  note: raw?.note || '',
  purchase_date: raw?.purchase_date || '',
  invoice_s3_key: raw?.invoice_s3_key || '',
  invoice_s3_url: raw?.invoice_s3_url || '',
  invoice_uploaded_at: raw?.invoice_uploaded_at || ''
});

/** True when list/detail row indicates an invoice file exists (use presigned GET to open; do not link to invoice_s3_url). */
export const purchaseReceiptHasInvoice = (row) =>
  Boolean(row?.invoice_s3_key || row?.invoice_s3_url || row?.invoice_uploaded_at);

const parseFilenameFromDisposition = (contentDisposition, fallback) => {
  const match = /filename\*?=(?:UTF-8''|")?([^";\n]+)/i.exec(contentDisposition || '');
  if (!match?.[1]) return fallback;
  try {
    return decodeURIComponent(match[1].replace(/"/g, '').trim());
  } catch {
    return match[1].replace(/"/g, '').trim();
  }
};

const extractCreatedItemIdFromResponse = (raw) => {
  if (!raw || typeof raw !== 'object') return '';
  if (raw.id || raw.item_id) return String(raw.id ?? raw.item_id);
  if (raw.data && typeof raw.data === 'object' && (raw.data.id || raw.data.item_id)) {
    return String(raw.data.id ?? raw.data.item_id);
  }
  return '';
};

export const useKitchenPurchaseRequestOperatorApi = () => {
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState('');
  const [lowStockItems, setLowStockItems] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [approvedLines, setApprovedLines] = useState([]);

  const loadRequestSources = useCallback(async () => {
    setBootstrapLoading(true);
    setError('');
    const [lowStockRes, shoppingRes] = await Promise.allSettled([
      api.get('/kitchen-store/v1/alerts/low-stock'),
      api.get('/kitchen-store/v1/shopping-list')
    ]);

    const nextErrors = [];

    if (lowStockRes.status === 'fulfilled') {
      const raw = lowStockRes.value.data?.data;
      const list = Array.isArray(raw) ? raw : raw?.items || [];
      setLowStockItems(list.map((item, index) => normalizePurchaseSourceItem(item, index, 'LOW_STOCK')));
    } else {
      nextErrors.push('Low stock');
      setLowStockItems([]);
    }

    if (shoppingRes.status === 'fulfilled') {
      const raw = shoppingRes.value.data?.data;
      const list = Array.isArray(raw) ? raw : raw?.items || raw?.shopping_list || [];
      setShoppingList(list.map((item, index) => normalizePurchaseSourceItem(item, index, 'SHOPPING_LIST')));
    } else {
      nextErrors.push('Shopping list');
      setShoppingList([]);
    }

    if (nextErrors.length === 2) {
      setError('Could not load any purchase request source data.');
    } else if (nextErrors.length > 0) {
      setError(`Some sources failed to load: ${nextErrors.join(', ')}.`);
    }

    try {
      const nameToId = await buildKitchenCatalogNameToIdMap();
      const enrichByName = (rows) =>
        rows.map((row) => {
          if (row.inventory_item_id) return row;
          const k = String(row.name || '').trim().toLowerCase();
          const matched = nameToId.get(k);
          return matched ? { ...row, inventory_item_id: matched } : row;
        });
      setLowStockItems((prev) => enrichByName(prev));
      setShoppingList((prev) => enrichByName(prev));
    } catch {
      // Catalog lookup is optional; rows without id stay unusable for "existing item" lines until resolved
    }

    setBootstrapLoading(false);
  }, []);

  const createPurchaseRequest = useCallback(async (payload) => {
    const res = await api.post('/kitchen-store/v2/purchase-requests', payload);
    return res.data?.data || {};
  }, []);

  const addPurchaseRequestLine = useCallback(async (requestId, line) => {
    const res = await api.post(`/kitchen-store/v2/purchase-requests/${requestId}/lines`, line);
    return res.data?.data || {};
  }, []);

  const submitPurchaseRequest = useCallback(async (requestId) => {
    const res = await api.post(`/kitchen-store/v2/purchase-requests/${requestId}/submit`);
    return res.data?.data || {};
  }, []);

  const createAndSubmitPurchaseRequest = useCallback(async ({ requested_note, lines }) => {
    setSubmitLoading(true);
    setError('');
    try {
      const created = await createPurchaseRequest({ requested_note });
      const requestId = String(created?.id ?? created?.request_id ?? created?.purchase_request_id ?? '');
      if (!requestId) {
        throw new Error('Purchase request id was not returned by the API.');
      }

      for (const line of lines) {
        await addPurchaseRequestLine(requestId, {
          inventory_item_id: line.inventory_item_id || undefined,
          requested_item_name: line.requested_item_name,
          requested_unit: line.requested_unit,
          requested_quantity: Number(line.requested_quantity),
          is_new_item: Boolean(line.is_new_item),
          operator_note: line.operator_note || ''
        });
      }

      await submitPurchaseRequest(requestId);
      setSubmitLoading(false);
      return { ok: true, requestId };
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to submit purchase request.');
      setError(message);
      setSubmitLoading(false);
      return { ok: false, message };
    }
  }, [addPurchaseRequestLine, createPurchaseRequest, submitPurchaseRequest]);

  const listApprovedRequests = useCallback(async (options = {}) => {
    const mine = options?.mine ?? true;
    setBootstrapLoading(true);
    setError('');
    const normalizeList = (raw) => {
      const list = Array.isArray(raw) ? raw : raw?.requests || raw?.items || [];
      return list.map((request, index) => normalizePurchaseRequestHeader(request, index));
    };
    try {
      const [approvedSettled, rejectedSettled] = await Promise.allSettled([
        api.get('/kitchen-store/v2/purchase-requests', { params: { status: 'APPROVED', mine } }),
        api.get('/kitchen-store/v2/purchase-requests', { params: { status: 'REJECTED', mine } })
      ]);
      const byId = new Map();
      if (approvedSettled.status === 'fulfilled') {
        normalizeList(approvedSettled.value.data?.data).forEach((r) => byId.set(r.id, r));
      }
      if (rejectedSettled.status === 'fulfilled') {
        normalizeList(rejectedSettled.value.data?.data).forEach((r) => byId.set(r.id, r));
      }
      const merged = [...byId.values()].sort((a, b) => {
        const sa = String(a.submitted_at || a.updated_at || '');
        const sb = String(b.submitted_at || b.updated_at || '');
        return sb.localeCompare(sa);
      });
      setApprovedRequests(merged);
      setBootstrapLoading(false);
      if (approvedSettled.status === 'rejected' && rejectedSettled.status === 'rejected') {
        const err = approvedSettled.reason;
        const message = getApiErrorMessage(err, 'Failed to load purchase requests.');
        setError(message);
        setApprovedRequests([]);
        return [];
      }
      setError('');
      return merged;
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to load purchase requests.');
      setError(message);
      setApprovedRequests([]);
      setBootstrapLoading(false);
      return [];
    }
  }, []);

  const fetchApprovedLines = useCallback(async (requestId) => {
    setBootstrapLoading(true);
    setError('');
    try {
      const res = await api.get(`/kitchen-store/v2/purchase-requests/${requestId}/approved-lines`);
      const raw = res.data?.data;
      const list = Array.isArray(raw) ? raw : raw?.lines || raw?.items || [];
      let normalized = list.map((line, index) => normalizePurchaseRequestLine(line, index));
      try {
        const nameToId = await buildKitchenCatalogNameToIdMap();
        normalized = enrichPurchaseRequestLinesByCatalogName(normalized, nameToId);
      } catch {
        // Catalog fetch failed; lines without API ids stay as-is (Add item will show resolve error)
      }
      setApprovedLines(normalized);
      setBootstrapLoading(false);
      return normalized;
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to load approved request lines.');
      setError(message);
      setApprovedLines([]);
      setBootstrapLoading(false);
      return [];
    }
  }, []);

  const fetchRequestDetail = useCallback(async (requestId) => {
    setBootstrapLoading(true);
    setError('');
    try {
      const res = await api.get(`/kitchen-store/v2/purchase-requests/${requestId}`);
      const normalized = normalizePurchaseRequestHeader(res.data?.data || {}, 0);
      setBootstrapLoading(false);
      return normalized;
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to load purchase request detail.');
      setError(message);
      setBootstrapLoading(false);
      return null;
    }
  }, []);

  const downloadApprovedLinesPdf = useCallback(async (requestId) => {
    setDownloadLoading(true);
    setError('');
    try {
      const res = await api.get(`/kitchen-store/v2/purchase-requests/${requestId}/approved-lines.txt`, {
        responseType: 'blob'
      });
      const filename = parseFilenameFromDisposition(
        res.headers?.['content-disposition'],
        `approved-items-${requestId}.pdf`
      );
      const blob = new Blob([res.data], { type: res.headers?.['content-type'] || 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      setDownloadLoading(false);
      return { ok: true };
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to download approved items PDF.');
      setError(message);
      setDownloadLoading(false);
      return { ok: false, message };
    }
  }, []);

  return {
    bootstrapLoading,
    submitLoading,
    downloadLoading,
    error,
    lowStockItems,
    shoppingList,
    approvedRequests,
    approvedLines,
    loadRequestSources,
    createAndSubmitPurchaseRequest,
    listApprovedRequests,
    fetchApprovedLines,
    fetchRequestDetail,
    downloadApprovedLinesPdf
  };
};

export const useKitchenPurchaseRequestManagerApi = () => {
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedRequests, setSubmittedRequests] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);

  const listSubmittedRequests = useCallback(async () => {
    setListLoading(true);
    setError('');
    try {
      const res = await api.get('/kitchen-store/v2/purchase-requests', {
        params: { status: 'SUBMITTED' }
      });
      const raw = res.data?.data;
      const list = Array.isArray(raw) ? raw : raw?.requests || raw?.items || [];
      const normalized = list.map((request, index) => normalizePurchaseRequestHeader(request, index));
      setSubmittedRequests(normalized);
      setListLoading(false);
      return normalized;
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to load submitted purchase requests.');
      setError(message);
      setSubmittedRequests([]);
      setListLoading(false);
      return [];
    }
  }, []);

  const getPurchaseRequestDetail = useCallback(async (requestId) => {
    setDetailLoading(true);
    setError('');
    try {
      const res = await api.get(`/kitchen-store/v2/purchase-requests/${requestId}`);
      const normalized = normalizePurchaseRequestHeader(res.data?.data || {}, 0);
      setActiveRequest(normalized);
      setDetailLoading(false);
      return normalized;
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to load purchase request detail.');
      setError(message);
      setActiveRequest(null);
      setDetailLoading(false);
      return null;
    }
  }, []);

  const createInventoryItem = useCallback(async (payload) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await api.post('/kitchen-store/v1/items', payload);
      const created = res.data?.data || {};
      const itemId = extractCreatedItemIdFromResponse(created);
      setActionLoading(false);
      return { ok: true, itemId, data: created };
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to create inventory item.');
      setError(message);
      setActionLoading(false);
      return { ok: false, message };
    }
  }, []);

  const resolveRequestLineItem = useCallback(async (requestId, lineId, payload) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await api.post(
        `/kitchen-store/v2/purchase-requests/${requestId}/lines/${lineId}/resolve-item`,
        payload
      );
      setActionLoading(false);
      return { ok: true, data: res.data?.data || {} };
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to resolve request line.');
      setError(message);
      setActionLoading(false);
      return { ok: false, message };
    }
  }, []);

  const updateRequestLineManager = useCallback(async (requestId, lineId, payload) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await api.post(
        `/kitchen-store/v2/purchase-requests/${requestId}/lines/${lineId}/manager-update`,
        payload
      );
      setActionLoading(false);
      return { ok: true, data: res.data?.data || {} };
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to update purchase request line.');
      setError(message);
      setActionLoading(false);
      return { ok: false, message };
    }
  }, []);

  const approveRequest = useCallback(async (requestId, payload) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await api.post(`/kitchen-store/v2/purchase-requests/${requestId}/approve`, payload);
      setActionLoading(false);
      return { ok: true, data: res.data?.data || {} };
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to approve purchase request.');
      setError(message);
      setActionLoading(false);
      return { ok: false, message };
    }
  }, []);

  const rejectRequest = useCallback(async (requestId, payload) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await api.post(`/kitchen-store/v2/purchase-requests/${requestId}/reject`, payload);
      setActionLoading(false);
      return { ok: true, data: res.data?.data || {} };
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to reject purchase request.');
      setError(message);
      setActionLoading(false);
      return { ok: false, message };
    }
  }, []);

  return {
    listLoading,
    detailLoading,
    actionLoading,
    error,
    submittedRequests,
    activeRequest,
    listSubmittedRequests,
    getPurchaseRequestDetail,
    createInventoryItem,
    resolveRequestLineItem,
    updateRequestLineManager,
    approveRequest,
    rejectRequest
  };
};

// v2: Purchase receipts (action-only hook; UI can be added later)
export const useKitchenReceiptsApi = () => {
  /** Presigned PUT to S3 from the browser — requires CORS on the target bucket. Prefer {@link uploadReceiptInvoice} when you already have a receipt id. */
  const getInvoiceUploadUrl = useCallback(async ({ filename, content_type, purchase_request_id }) => {
    const res = await api.post('/kitchen-store/v2/purchases/invoice-upload-url', {
      filename,
      content_type,
      purchase_request_id
    });
    return res.data?.data || {};
  }, []);

  /** Direct browser upload to S3 — needs bucket CORS. Prefer {@link uploadReceiptInvoice} to avoid that. */
  const uploadInvoiceToS3 = useCallback(async (uploadPayload, file) => {
    const uploadUrl = uploadPayload?.upload_url;
    const method = uploadPayload?.method || 'PUT';
    const headers = uploadPayload?.headers || {};
    if (!uploadUrl) throw new Error('upload_url is missing from invoice upload response.');
    const response = await fetch(uploadUrl, {
      method,
      headers,
      body: file
    });
    if (!response.ok) {
      throw new Error(`Invoice upload failed with status ${response.status}.`);
    }
    return true;
  }, []);

  /** Multipart upload to kitchen store via this app’s API (no browser → S3). */
  const uploadReceiptInvoice = useCallback(async (receiptId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(
      `/kitchen-store/v2/purchases/receipts/${receiptId}/invoice/upload`,
      formData
    );
    return res.data?.data || {};
  }, []);

  const createReceipt = useCallback(async (payload) => {
    const body = payload && typeof payload === 'object' ? payload : { reference_invoice: payload };
    if (!body?.purchase_request_id) {
      throw new Error('purchase_request_id is required to create a receipt.');
    }
    const res = await api.post('/kitchen-store/v2/purchases/receipts', body);
    return res.data?.data;
  }, []);

  const addReceiptLine = useCallback(async (receipt_id, line) => {
    // `line` should match the backend schema (purchased_qty, purchase_unit, conversion_to_base, line_total, purchase_date, note...)
    const res = await api.post(`/kitchen-store/v2/purchases/receipts/${receipt_id}/lines`, line);
    return res.data?.data;
  }, []);

  const listReceipts = useCallback(async (from_date, to_date) => {
    const res = await api.get('/kitchen-store/v2/purchases/receipts', {
      params: { from_date, to_date }
    });
    const raw = res.data?.data;
    const rows = Array.isArray(raw) ? raw : raw?.receipts || raw?.items || [];
    return rows.map((row, index) => normalizePurchaseReceiptHeader(row, index));
  }, []);

  const listReceiptLines = useCallback(async (receipt_id) => {
    const res = await api.get(`/kitchen-store/v2/purchases/receipts/${receipt_id}/lines`);
    const raw = res.data?.data;
    const rows = Array.isArray(raw) ? raw : raw?.lines || raw?.items || [];
    return rows.map((row, index) => normalizePurchaseReceiptLine(row, index));
  }, []);

  const getReceiptInvoiceViewUrl = useCallback(async (receiptId) => {
    const res = await api.get(
      `/kitchen-store/v2/purchases/receipts/${encodeURIComponent(receiptId)}/invoice/url`
    );
    const raw = res.data?.data ?? res.data;
    const url = raw?.url;
    if (!url || typeof url !== 'string') {
      throw new Error(raw?.detail || raw?.message || 'No invoice view URL returned.');
    }
    return { url, expires_in_seconds: raw?.expires_in_seconds };
  }, []);

  /**
   * Opens invoice in a new tab via proxied GET (correct Content-Type for S3 presigned URLs).
   */
  const viewReceiptInvoiceInNewTab = useCallback(async (receiptId) => {
    const res = await api.get(
      `/kitchen-store/v2/purchases/receipts/${encodeURIComponent(receiptId)}/invoice/view`,
      { responseType: 'blob', validateStatus: () => true }
    );
    if (res.status !== 200) {
      let msg = 'Could not open invoice.';
      if (res.data instanceof Blob) {
        try {
          const text = await res.data.text();
          const j = JSON.parse(text);
          if (typeof j?.message === 'string' && j.message.trim()) msg = j.message;
          else if (typeof j?.detail === 'string' && j.detail.trim()) msg = j.detail;
        } catch {
          /* keep default */
        }
      }
      const err = new Error(msg);
      err.response = { status: res.status, data: { message: msg } };
      throw err;
    }
    const blob = res.data;
    if (!(blob instanceof Blob) || blob.size === 0) {
      throw new Error('Empty invoice file.');
    }
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      URL.revokeObjectURL(blobUrl);
      throw new Error('Popup blocked. Allow popups to view the invoice.');
    }
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
  }, []);

  const getPurchaseComparison = useCallback(async (requestId) => {
    const res = await api.get(`/kitchen-store/v2/purchase-requests/${requestId}/purchase-comparison`);
    const raw = res.data?.data;
    let rows = [];
    if (Array.isArray(raw)) {
      rows = raw;
    } else if (raw && typeof raw === 'object') {
      const lines = raw.lines || raw.items || raw.comparison_lines || [];
      const exceptions = raw.exceptions || [];
      rows = [
        ...(Array.isArray(lines) ? lines : []),
        ...(Array.isArray(exceptions) ? exceptions : [])
      ];
    }
    const summary =
      raw && typeof raw === 'object' && !Array.isArray(raw)
        ? {
            submitted_at: raw.submitted_at,
            approved_at: raw.approved_at
          }
        : {};
    return {
      lines: rows.map((row, index) => normalizePurchaseComparisonRow(row, index)),
      summary
    };
  }, []);

  return {
    getInvoiceUploadUrl,
    uploadInvoiceToS3,
    uploadReceiptInvoice,
    createReceipt,
    addReceiptLine,
    listReceipts,
    listReceiptLines,
    getReceiptInvoiceViewUrl,
    viewReceiptInvoiceInNewTab,
    getPurchaseComparison
  };
};

export const useKitchenPurchaseExceptionManagerApi = () => {
  const [listLoading, setListLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingExceptions, setPendingExceptions] = useState([]);

  const listPendingExceptions = useCallback(async (options = {}) => {
    const opts = typeof options === 'string' ? { status: options } : options || {};
    const status = opts.status ?? 'PENDING';
    const pending_scope = opts.pending_scope ?? 'all';
    setListLoading(true);
    setError('');
    try {
      const res = await api.get('/kitchen-store/v2/purchases/off-list-review', {
        params: { status, pending_scope }
      });
      const raw = res.data?.data;
      const rows = Array.isArray(raw) ? raw : raw?.items || raw?.lines || [];
      const normalized = rows.map((row, index) => normalizePurchaseExceptionRow(row, index));
      setPendingExceptions(normalized);
      setListLoading(false);
      return normalized;
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to load pending purchase exceptions.');
      setError(message);
      setPendingExceptions([]);
      setListLoading(false);
      return [];
    }
  }, []);

  const submitManagerReview = useCallback(async (receiptId, lineId, payload) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await api.post(
        `/kitchen-store/v2/purchases/receipts/${receiptId}/lines/${lineId}/manager-review`,
        payload
      );
      setActionLoading(false);
      return { ok: true, data: res.data?.data || {} };
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to review purchase exception.');
      setError(message);
      setActionLoading(false);
      return { ok: false, message };
    }
  }, []);

  const submitManagerReviewBulk = useCallback(async (receiptId, payload) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await api.post(
        `/kitchen-store/v2/purchases/receipts/${receiptId}/lines/manager-review-bulk`,
        payload
      );
      setActionLoading(false);
      return { ok: true, data: res.data?.data || {} };
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to submit bulk manager review.');
      setError(message);
      setActionLoading(false);
      return { ok: false, message };
    }
  }, []);

  return {
    listLoading,
    actionLoading,
    error,
    pendingExceptions,
    listPendingExceptions,
    submitManagerReview,
    submitManagerReviewBulk
  };
};

export const useKitchenMealReportApi = () => {
  const getMealReport = async (date) => {
    const res = await api.get('/kitchen-store/meal-report', {
      params: { date }
    });
    return res.data?.data?.data || res.data?.data || res.data || {};
  };

  return { getMealReport };
};

