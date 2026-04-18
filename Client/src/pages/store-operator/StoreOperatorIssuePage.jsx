import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  demandPayloadHasStoreShortfall,
  kitchenNextServiceDateIso,
  KITCHEN_DEMAND_MEAL_SLOTS,
  useKitchenIssueMock,
  useKitchenPlansMock
} from '../../hooks/adminHook/kitchenStoreHook';
import { kitchenPlanRequireApproval } from '../../config/kitchenFeatureFlags.js';
import { useCompanyBasePath } from '../../context/TenantContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import { showStoreError, showStoreSuccess, showStoreWarning } from '../../utils/toastConfig.jsx';

const statusUpper = (s) => String(s || '').toUpperCase();

/** Submit is a DRAFT-only action (POST …/submit). Visibility does not depend on env; env only enables the click. */
function isDraftPlan(plan) {
  return Boolean(plan && statusUpper(plan.status) === 'DRAFT');
}

function canIssuePlan(plan, requireApproval) {
  if (!plan) return false;
  const st = statusUpper(plan.status);
  if (st === 'ISSUED') return false;
  if (requireApproval) return st === 'APPROVED';
  return st === 'DRAFT' || st === 'APPROVED';
}

/** Max height for plan line tables: ~10 visible rows, remainder scrolls. */
const PLAN_TABLE_SCROLL_CLASS = 'max-h-[440px] overflow-y-auto rounded-md border border-slate-200';

/** @feature kitchen-store — STORE_OPERATOR: POST generate → GET plan + demand-vs-store → submit (if approval) → manager approves → POST issue (catalog §kitchen/plans). */
const StoreOperatorIssuePage = () => {
  const basePath = useCompanyBasePath();
  const requireApproval = kitchenPlanRequireApproval();
  const {
    plans,
    issuePlan,
    submitPlan,
    fetchPlanDemandVsStore,
    refreshPlan,
    kitchenHoldingItems,
    refreshKitchenHolding
  } = useKitchenIssueMock();
  const { generatePlanForSlot } = useKitchenPlansMock();

  const defaultDate = useMemo(() => kitchenNextServiceDateIso(), []);
  const [planDate, setPlanDate] = useState(defaultDate);
  const [mealSlot, setMealSlot] = useState('');
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [generateBusy, setGenerateBusy] = useState(false);

  const [activePlanId, setActivePlanId] = useState('');
  const [demandByPlanId, setDemandByPlanId] = useState({});
  const [demandBusy, setDemandBusy] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [issueBusy, setIssueBusy] = useState(false);

  useEffect(() => {
    void refreshKitchenHolding();
  }, [refreshKitchenHolding]);

  useEffect(() => {
    try {
      const id = typeof localStorage !== 'undefined' ? localStorage.getItem('kitchen_store_latest_plan_id') : '';
      const trimmed = id && String(id).trim();
      if (!trimmed) return;
      void (async () => {
        try {
          await refreshPlan(trimmed);
          setActivePlanId(trimmed);
        } catch {
          /* optional bootstrap */
        }
      })();
    } catch {
      /* ignore */
    }
  }, [refreshPlan]);

  const activePlan = useMemo(
    () => (activePlanId ? plans.find((p) => String(p.id) === String(activePlanId)) : null),
    [plans, activePlanId]
  );

  const sortedPlans = useMemo(() => {
    const slotOrder = { BREAKFAST: 1, LUNCH: 2, DINNER: 3 };
    return [...plans].sort((a, b) => {
      const da = String(a.plan_date || '');
      const db = String(b.plan_date || '');
      if (da !== db) return da.localeCompare(db);
      const sa = String(a.meal_slot || '').toUpperCase();
      const sb = String(b.meal_slot || '').toUpperCase();
      return (slotOrder[sa] ?? 99) - (slotOrder[sb] ?? 99);
    });
  }, [plans]);

  const demand = activePlanId ? demandByPlanId[activePlanId] : null;
  const shortfall = demand ? demandPayloadHasStoreShortfall(demand) : false;
  const demandLines = useMemo(() => (Array.isArray(demand?.lines) ? demand.lines : []), [demand]);

  const onGenerate = async () => {
    const pd = planDate.trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pd)) {
      showStoreError('Choose a valid plan date (YYYY-MM-DD).');
      return;
    }
    setGenerateBusy(true);
    try {
      const out = await generatePlanForSlot({
        plan_date: pd,
        meal_slot: mealSlot || undefined,
        overwrite_existing: overwriteExisting
      });
      if (!out.ok) {
        const msg = out.message || 'Generate failed.';
        showStoreError(
          /already exists|overwrite_existing/i.test(msg)
            ? `${msg} Turn on "Replace existing plan" below and try again, or pick the plan from "Plans loaded in this session" if it is already listed.`
            : msg
        );
        return;
      }
      const lc = out.data?.line_count;
      const st = out.data?.status;
      const extra = lc != null && lc !== '' ? ` · ${lc} line(s)` : '';
      showStoreSuccess(`Plan ${out.planId}${st ? ` (${st})` : ''}${extra}.`, 'Kitchen plan generated');
      if (out.planId) {
        setActivePlanId(out.planId);
      }
    } finally {
      setGenerateBusy(false);
    }
  };

  const onLoadDemand = async () => {
    if (!activePlanId) {
      showStoreError('Load a plan first.');
      return;
    }
    setDemandBusy(true);
    try {
      const out = await fetchPlanDemandVsStore(activePlanId);
      if (!out.ok) {
        showStoreError(out.message || 'Could not load demand vs store.');
        return;
      }
      setDemandByPlanId((prev) => ({ ...prev, [activePlanId]: out.data }));
      if (demandPayloadHasStoreShortfall(out.data)) {
        showStoreWarning('Store shortfall for this plan — resolve stock before issuing.', 'Shortfall');
      } else {
        showStoreSuccess('Store vs demand loaded.', 'Demand');
      }
    } finally {
      setDemandBusy(false);
    }
  };

  const onSubmit = async () => {
    if (!activePlan || !isDraftPlan(activePlan) || !requireApproval) return;
    setSubmitBusy(true);
    try {
      const out = await submitPlan(activePlan.id, '');
      if (!out?.ok) {
        showStoreError(out?.message || 'Submit failed.');
        return;
      }
      showStoreSuccess('Plan submitted for manager approval.', 'Submitted');
    } finally {
      setSubmitBusy(false);
    }
  };

  const onIssue = async () => {
    if (!activePlan || !canIssuePlan(activePlan, requireApproval)) return;
    if (!demand) {
      showStoreError('Load demand vs store first so shortfalls can be checked before issue.');
      return;
    }
    if (shortfall) {
      showStoreError('Shortfall blocks issue until stock is sufficient.');
      return;
    }
    setIssueBusy(true);
    try {
      const out = await issuePlan(activePlan.id);
      if (!out?.ok) {
        showStoreError(out?.message || 'Issue failed.');
        return;
      }
      showStoreSuccess('Plan issued to kitchen.', 'Issued');
      void refreshKitchenHolding();
    } finally {
      setIssueBusy(false);
    }
  };

  const onPickSessionPlan = (id) => {
    const s = String(id || '').trim();
    setActivePlanId(s);
    if (typeof localStorage !== 'undefined' && s) {
      localStorage.setItem('kitchen_store_latest_plan_id', s);
    }
  };

  const planStatus = activePlan ? statusUpper(activePlan.status) : '';

  return (
    <StorePageShell>
      <StorePageHeader
        title="Issue to kitchen"
        description={
          requireApproval
            ? 'Generate the daily ingredient plan, check demand vs store, submit for manager approval, then issue after approval (moves stock to kitchen holding).'
            : 'Generate the daily plan, check demand vs store, then issue when stock covers the pick list (moves stock to kitchen holding).'
        }
      />

      <StoreSection title="Generate kitchen plan" tone="sky">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            plan_date
            <input
              type="date"
              className="h-9 rounded-lg border border-slate-200 px-2 text-sm"
              value={planDate}
              onChange={(e) => setPlanDate(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            meal_slot (optional)
            <select
              className="h-9 min-w-[160px] rounded-lg border border-slate-200 bg-white px-2 text-sm"
              value={mealSlot}
              onChange={(e) => setMealSlot(e.target.value)}
            >
              <option value="">All sessions (whole day)</option>
              {KITCHEN_DEMAND_MEAL_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <Button type="button" disabled={generateBusy} onClick={() => void onGenerate()}>
            {generateBusy ? 'Generating…' : 'Generate plan'}
          </Button>
        </div>
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-slate-700 max-w-xl">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300"
            checked={overwriteExisting}
            onChange={(e) => setOverwriteExisting(e.target.checked)}
          />
          <span>
            Replace existing plan for this date and meal slot. Turn on if you see “plan already exists” and want to
            regenerate lines.
          </span>
        </label>
      </StoreSection>

      <StoreSection
        title="Plans loaded in this session"
        tone="emerald"
        description="Click a row to open that plan’s pick list and actions."
      >
        {sortedPlans.length === 0 ? (
          <p className="text-sm text-muted-foreground">No plans in memory yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Meal slot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlans.map((plan) => {
                const selected = String(plan.id) === String(activePlanId);
                return (
                  <TableRow
                    key={plan.id}
                    role="button"
                    tabIndex={0}
                    className={`cursor-pointer ${selected ? 'bg-emerald-50/80 hover:bg-emerald-50' : 'hover:bg-slate-50'}`}
                    onClick={() => onPickSessionPlan(plan.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onPickSessionPlan(plan.id);
                      }
                    }}
                  >
                    <TableCell className="font-medium">{plan.plan_date || '—'}</TableCell>
                    <TableCell>
                      {plan.meal_slot ? plan.meal_slot : <span className="text-muted-foreground">Full day</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.status === 'APPROVED' ? 'success' : 'secondary'}>{plan.status}</Badge>
                    </TableCell>
                    <TableCell>{Array.isArray(plan.lines) ? plan.lines.length : 0}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </StoreSection>

      {activePlan ? (
        <>
          <StoreSection
            title="Plan pick list"
            tone="emerald"
            description={`${activePlan.plan_date || '—'} · ${activePlan.meal_slot || 'Full day'}`}
            headerActions={<Badge variant="secondary">{activePlan.status}</Badge>}
          >
            {requireApproval && planStatus === 'SUBMITTED' ? (
              <StoreNotice tone="amber" className="mb-4">
                Waiting for a store manager to approve this plan on{' '}
                <Link
                  to={`${basePath}/store-manager/plan-approval${activePlanId ? `?planId=${encodeURIComponent(activePlanId)}` : ''}`}
                  className="font-medium text-amber-950 underline"
                >
                  Plan Approval
                </Link>
                . Issue to kitchen stays disabled until the status is APPROVED.
              </StoreNotice>
            ) : null}
            {requireApproval && planStatus === 'APPROVED' ? (
              <StoreNotice tone="emerald" className="mb-4">
                Plan approved — load demand vs store if you have not already, then use Issue to kitchen when there is no
                shortfall.
              </StoreNotice>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Button type="button" variant="outline" size="sm" disabled={demandBusy} onClick={() => void onLoadDemand()}>
                {demandBusy ? 'Loading…' : 'Load demand vs store'}
              </Button>
              {isDraftPlan(activePlan) ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={submitBusy || !requireApproval}
                  title={
                    !requireApproval
                      ? 'Approval workflow is off (VITE_KITCHEN_PLAN_REQUIRE_APPROVAL=false). Issue from DRAFT without submitting, or set the flag to true and restart Vite.'
                      : undefined
                  }
                  onClick={() => void onSubmit()}
                >
                  {submitBusy ? 'Submitting…' : 'Submit for approval'}
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                disabled={issueBusy || !demand || shortfall || !canIssuePlan(activePlan, requireApproval)}
                title={
                  !demand
                    ? 'Load demand vs store first'
                    : shortfall
                      ? 'Resolve shortfall before issue'
                      : !canIssuePlan(activePlan, requireApproval)
                        ? 'Plan must be approved (or eligible to issue)'
                        : undefined
                }
                onClick={() => void onIssue()}
              >
                {issueBusy ? 'Issuing…' : 'Issue to kitchen'}
              </Button>
            </div>
            {isDraftPlan(activePlan) && !requireApproval ? (
              <p className="text-xs text-slate-600 mb-4 max-w-2xl">
                <strong>Submit for approval</strong> is disabled because{' '}
                <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">VITE_KITCHEN_PLAN_REQUIRE_APPROVAL</code> is
                false. Remove it or set it to <code className="rounded bg-slate-100 px-1 text-[11px]">true</code> and restart
                the dev server. While it is off, use <strong>Issue to kitchen</strong> directly from DRAFT when stock allows.
              </p>
            ) : null}
            {demand && typeof demand.any_store_shortfall_for_issue === 'boolean' ? (
              <p className="text-sm text-slate-700 mb-2">
                Any store shortfall:{' '}
                <span className="font-medium">{demand.any_store_shortfall_for_issue ? 'Yes' : 'No'}</span>
              </p>
            ) : null}
            {shortfall ? (
              <StoreNotice tone="amber" className="mb-4">
                Store cannot fully cover remaining issue for this plan. Add stock or adjust the plan before issuing.
              </StoreNotice>
            ) : null}

            <div className={PLAN_TABLE_SCROLL_CLASS}>
              <Table wrapperClassName="relative w-full">
                <TableHeader className="sticky top-0 z-[1] bg-white shadow-[0_1px_0_0_rgb(226_232_240)]">
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Required</TableHead>
                    <TableHead className="text-right">Planned issue</TableHead>
                    <TableHead className="text-right">Issued</TableHead>
                    <TableHead>Unit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(activePlan.lines || []).map((line) => (
                    <TableRow key={line.line_id || line.inventory_item_id}>
                      <TableCell className="font-medium">{line.item || line.inventory_item_id || '—'}</TableCell>
                      <TableCell className="text-right">{line.required_quantity}</TableCell>
                      <TableCell className="text-right">{line.planned_issue_quantity}</TableCell>
                      <TableCell className="text-right">{line.issued_quantity}</TableCell>
                      <TableCell className="text-muted-foreground">{line.unit || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {demandLines.length > 0 ? (
              <div className="mt-6">
                <p className="text-sm font-medium text-slate-800 mb-2">Demand vs store (server)</p>
                <div className={PLAN_TABLE_SCROLL_CLASS}>
                  <Table wrapperClassName="relative w-full">
                    <TableHeader className="sticky top-0 z-[1] bg-white shadow-[0_1px_0_0_rgb(226_232_240)]">
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Remaining to issue</TableHead>
                        <TableHead className="text-right">Store on hand</TableHead>
                        <TableHead>OK</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {demandLines.map((row, idx) => (
                        <TableRow key={String(row.plan_line_id ?? row.inventory_item_id ?? idx)}>
                          <TableCell className="font-medium">{row.inventory_item_name || row.inventory_item_id || '—'}</TableCell>
                          <TableCell className="text-right">{row.remaining_to_issue_from_store ?? row.remaining_to_issue ?? '—'}</TableCell>
                          <TableCell className="text-right">{row.store_current_quantity ?? row.store_quantity ?? '—'}</TableCell>
                          <TableCell>
                            {row.store_can_cover_remaining_issue === false ? (
                              <Badge variant="destructive">Short</Badge>
                            ) : (
                              <Badge variant="success">OK</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : null}
          </StoreSection>
        </>
      ) : null}

      <StoreSection title="Kitchen holding" tone="sky">
        <div className="mb-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void refreshKitchenHolding()}>
            Refresh
          </Button>
        </div>
        {kitchenHoldingItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rows yet, or holding is empty.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kitchenHoldingItems.map((row) => (
                <TableRow key={row.key}>
                  <TableCell className="font-medium">{row.inventory_item_name || row.inventory_item_id}</TableCell>
                  <TableCell className="text-right">{row.quantity}</TableCell>
                  <TableCell className="text-xs text-slate-600">{row.updated_at || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreOperatorIssuePage;
