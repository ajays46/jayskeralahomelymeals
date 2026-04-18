import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { kitchenNextServiceDateIso, useKitchenPlansMock } from '../../hooks/adminHook/kitchenStoreHook';
import { kitchenPlanRequireApproval } from '../../config/kitchenFeatureFlags.js';
import { useCompanyBasePath } from '../../context/TenantContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import { showStoreError, showStoreSuccess, showStoreWarning } from '../../utils/toastConfig.jsx';

const statusUpper = (s) => String(s || '').toUpperCase();

/** Short label for UI; full id on hover via `title`. */
const formatPlanIdShort = (id) => {
  const s = String(id || '');
  if (s.length <= 12) return s || '—';
  return `…${s.slice(-8)}`;
};

/** Server said approve needs SUBMITTED (e.g. upstream KITCHEN_PLAN_REQUIRE_APPROVAL while VITE flag was off). */
const isSubmittedOnlyApproveMessage = (msg) => {
  const m = String(msg || '').toLowerCase();
  return m.includes('submitted') && (m.includes('approv') || m.includes('only'));
};

/** Guide §9.5 — Plan detail from `GET /kitchen/plans/{plan_id}` (client: GET `${API.MAX_KITCHEN_KITCHEN}/plans/:id` via `refreshPlan`). */
/** @feature kitchen-store — STORE_MANAGER: kitchen plan approval, reject, and line edits (DRAFT / SUBMITTED). */
const StoreManagerPlanApprovalPage = () => {
  const basePath = useCompanyBasePath();
  const [searchParams, setSearchParams] = useSearchParams();
  const { plans, approvePlan, rejectPlan, patchPlanLine, refreshPlan, syncPlansFromServerForDate, listKitchenPlans } =
    useKitchenPlansMock();
  const requireApprovalFlow = kitchenPlanRequireApproval();
  const [syncDate, setSyncDate] = useState(() => kitchenNextServiceDateIso());
  /** `GET /kitchen/plans` — default SUBMITTED for post-submit manager approval inbox. */
  const [inboxStatus, setInboxStatus] = useState('SUBMITTED');
  const [inboxLimit, setInboxLimit] = useState('50');
  const [fetchListBusy, setFetchListBusy] = useState(false);
  /** Per plan_id: server rejected approve on DRAFT — treat like requireApprovalFlow for this plan. */
  const [submitRequiredByPlanId, setSubmitRequiredByPlanId] = useState({});
  const [rejectNote, setRejectNote] = useState('');
  const [lineDrafts, setLineDrafts] = useState({});
  const [planIndex, setPlanIndex] = useState(0);
  /** After loading a plan by id / URL, select that session in the dropdown (avoid staying on index 0). */
  const [pendingPlanFocusId, setPendingPlanFocusId] = useState(null);

  const plan = plans[planIndex] ?? plans[0];
  const planStatus = plan ? statusUpper(plan.status) : '';

  const submitRequiredForCurrent = Boolean(plan?.id && submitRequiredByPlanId[plan.id]);
  const requireSubmitBeforeApprove = requireApprovalFlow || submitRequiredForCurrent;

  useEffect(() => {
    if (!plan?.id) return;
    if (String(plan.status || '').toUpperCase() === 'SUBMITTED') {
      setSubmitRequiredByPlanId((prev) => {
        if (!prev[plan.id]) return prev;
        const next = { ...prev };
        delete next[plan.id];
        return next;
      });
    }
  }, [plan?.id, plan?.status]);

  React.useEffect(() => {
    if (plans.length === 0) {
      setPlanIndex(0);
      return;
    }
    if (planIndex >= plans.length) setPlanIndex(0);
  }, [plans.length, planIndex]);

  useEffect(() => {
    if (!pendingPlanFocusId) return;
    const idx = plans.findIndex((p) => String(p.id) === String(pendingPlanFocusId));
    if (idx >= 0) {
      setPlanIndex(idx);
      setPendingPlanFocusId(null);
    }
  }, [plans, pendingPlanFocusId]);

  const canEditLines = useMemo(() => {
    const s = String(plan?.status || '').toUpperCase();
    return s === 'DRAFT' || s === 'SUBMITTED';
  }, [plan?.status]);

  const syncDraftsFromPlan = (p) => {
    if (!p?.lines) return;
    const next = {};
    p.lines.forEach((ln) => {
      const lid = ln.line_id || '';
      if (!lid) return;
      next[lid] = {
        planned_issue_quantity: String(ln.planned_issue_quantity ?? ''),
        variance_note: ln.variance_note || ''
      };
    });
    setLineDrafts(next);
  };

  useEffect(() => {
    if (plan) syncDraftsFromPlan(plan);
  }, [plan]);

  /** Same browser as operator: pull plan IDs saved in localStorage for this service date. */
  useEffect(() => {
    void (async () => {
      try {
        await syncPlansFromServerForDate(kitchenNextServiceDateIso());
      } catch {
        /* optional */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount to hydrate queue
  }, []);

  const planIdFromUrl = searchParams.get('planId') || searchParams.get('plan_id');

  useEffect(() => {
    const raw = planIdFromUrl?.trim();
    if (!raw) return;
    let alive = true;
    void (async () => {
      try {
        await refreshPlan(raw);
        if (!alive) return;
        setPendingPlanFocusId(raw);
        showStoreSuccess('Plan loaded from link.', 'Plan');
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete('planId');
            next.delete('plan_id');
            return next;
          },
          { replace: true }
        );
      } catch (e) {
        if (!alive) return;
        const msg = e?.response?.data?.message || e?.response?.data?.detail || e?.message || 'Could not load plan.';
        showStoreError(msg);
      }
    })();
    return () => {
      alive = false;
    };
  }, [planIdFromUrl, refreshPlan, setSearchParams]);

  const onFetchPlansFromServerList = async () => {
    const pd = syncDate.trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pd)) {
      showStoreError('Choose a valid service date (YYYY-MM-DD).');
      return;
    }
    const lim = Number(String(inboxLimit).trim());
    const limit = Number.isFinite(lim) && lim >= 1 && lim <= 500 ? Math.floor(lim) : 50;
    setFetchListBusy(true);
    try {
      const out = await listKitchenPlans({
        plan_date: pd,
        status: inboxStatus,
        limit
      });
      if (!out.ok) {
        showStoreError(out.message || 'Could not list plans.');
        return;
      }
      if (!out.ids?.length) {
        showStoreWarning(
          `No plans with status ${inboxStatus} for ${pd}. Try another date or status.`,
          'No plans'
        );
        return;
      }
      let firstOk = null;
      let failed = 0;
      for (const id of out.ids) {
        try {
          await refreshPlan(id);
          if (!firstOk) firstOk = id;
        } catch {
          failed += 1;
        }
      }
      if (firstOk) setPendingPlanFocusId(firstOk);
      if (failed > 0) {
        showStoreWarning(`${failed} plan(s) could not be loaded in full; others are ready.`, 'Partial load');
      } else {
        showStoreSuccess(`Loaded ${out.ids.length} plan(s) from server.`, 'Plans');
      }
    } finally {
      setFetchListBusy(false);
    }
  };

  const onApprove = async () => {
    if (!plan?.id) return;
    const st = String(plan.status || '').toUpperCase();
    if (requireSubmitBeforeApprove && st !== 'SUBMITTED') {
      showStoreError(
        'Only SUBMITTED plans can be approved. Have a store operator open Issue to Kitchen and use Submit plan first.'
      );
      return;
    }
    if (!requireSubmitBeforeApprove && (st === 'APPROVED' || st === 'ISSUED')) {
      showStoreError('This plan is already approved or issued.');
      return;
    }
    const out = await approvePlan(plan.id);
    if (out?.ok === false) {
      const msg = out.message || 'Approve failed';
      if (isSubmittedOnlyApproveMessage(msg)) {
        setSubmitRequiredByPlanId((prev) => ({ ...prev, [plan.id]: true }));
      }
      const hint = isSubmittedOnlyApproveMessage(msg)
        ? ' Use Issue to Kitchen → Submit plan, then approve again.'
        : '';
      showStoreError(`${msg}${hint}`);
      return;
    }
    showStoreSuccess('Plan approved.');
    void refreshPlan(plan.id);
  };

  const onReject = async () => {
    if (!plan?.id) return;
    const out = await rejectPlan(plan.id, rejectNote.trim());
    if (out?.ok === false) {
      showStoreError(out.message || 'Reject failed');
      return;
    }
    showStoreSuccess('Plan returned to draft.');
    setRejectNote('');
    void refreshPlan(plan.id);
  };

  const onSaveLine = async (ln) => {
    const lid = ln.line_id || '';
    if (!plan?.id || !lid) {
      showStoreError('Missing plan or line id from server.');
      return;
    }
    const d = lineDrafts[lid];
    if (!d) return;
    const qty = Number(d.planned_issue_quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      showStoreError('Planned issue quantity must be a positive number.');
      return;
    }
    const body = {
      planned_issue_quantity: qty,
      ...(d.variance_note !== undefined ? { variance_note: d.variance_note } : {})
    };
    const out = await patchPlanLine(plan.id, lid, body);
    if (out?.ok === false) {
      showStoreError(out.message || 'Update failed');
      return;
    }
    showStoreSuccess('Plan line updated.');
    void refreshPlan(plan.id);
  };

  return (
    <StorePageShell>
      <StorePageHeader
        title="Plan approval"
        description={
          requireApprovalFlow
            ? 'Approve or reject submitted kitchen plans by meal session for the selected service date.'
            : `Review generated kitchen plans for the service day (${kitchenNextServiceDateIso()}).`
        }
      />

      <StoreSection title="Load plans for approval" tone="emerald">
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Service date
            <input
              type="date"
              className="h-9 rounded-lg border border-slate-200 px-2 text-sm"
              value={syncDate}
              onChange={(e) => setSyncDate(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            List status
            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm min-w-[9rem]"
              value={inboxStatus}
              onChange={(e) => setInboxStatus(e.target.value)}
            >
              <option value="SUBMITTED">SUBMITTED (approval inbox)</option>
              <option value="DRAFT">DRAFT</option>
              <option value="APPROVED">APPROVED</option>
              <option value="ISSUED">ISSUED</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Limit
            <input
              type="number"
              min={1}
              max={500}
              className="h-9 w-20 rounded-lg border border-slate-200 px-2 text-sm"
              value={inboxLimit}
              onChange={(e) => setInboxLimit(e.target.value)}
            />
          </label>
          <Button type="button" disabled={fetchListBusy} onClick={() => void onFetchPlansFromServerList()}>
            {fetchListBusy ? 'Fetching…' : 'Go'}
          </Button>
        </div>
      </StoreSection>

      {submitRequiredForCurrent && !requireApprovalFlow ? (
        <StoreNotice tone="amber">
          The server only allows <strong>approve</strong> after an operator has called <strong>Submit plan</strong>{' '}
          (<code className="text-xs">POST …/plans/:id/submit</code>), which requires a{' '}
          <strong>Store Operator</strong> login. Ask an operator to open the link below (it pre-fills the plan date),
          load plans for that date, then use <strong>Submit plan</strong> on each <strong>DRAFT</strong> plan. Optional: set{' '}
          <code className="text-xs">VITE_KITCHEN_PLAN_REQUIRE_APPROVAL=true</code> in the client <code className="text-xs">.env</code>{' '}
          so this wizard always shows the submit step before you approve.
          <div className="mt-3">
            <Button asChild variant="outline" size="sm">
              <Link
                to={`${basePath}/store-operator/issue?from=plan-approval${plan?.plan_date ? `&planDate=${encodeURIComponent(String(plan.plan_date).slice(0, 10))}` : ''}`}
              >
                Open Issue to Kitchen (operator submit)
              </Link>
            </Button>
          </div>
        </StoreNotice>
      ) : null}

      {!plan ? (
        <StoreSection title="No plan loaded">
          <p className="text-sm text-muted-foreground">
            No kitchen plans for the next service day yet. A <strong>store manager</strong> triggers generation
            (<code className="text-xs">POST /kitchen/plans/generate</code>) once per meal session. Plans need delivery
            order volume for that date and slot; otherwise the API returns 404. Until then, use the forecast dashboard and
            purchase recommendations.
          </p>
        </StoreSection>
      ) : (
        <StoreSection
          key={plan.id}
          title={
            <span className="font-semibold" title={String(plan.id)}>
              Plan {formatPlanIdShort(plan.id)}
            </span>
          }
          description={`Date: ${plan.plan_date || '-'} | Meal slot: ${plan.meal_slot || '—'}`}
          headerActions={
            <div className="flex flex-wrap items-center gap-2">
              {plans.length > 1 ? (
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="whitespace-nowrap">Session</span>
                  <select
                    className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
                    value={String(planIndex)}
                    onChange={(e) => setPlanIndex(Number(e.target.value) || 0)}
                  >
                    {plans.map((p, idx) => (
                      <option key={p.id || idx} value={idx} title={String(p.id)}>
                        {(p.meal_slot || 'Plan').toString()} · {formatPlanIdShort(p.id)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <Badge variant={plan.status === 'DRAFT' ? 'secondary' : plan.status === 'SUBMITTED' ? 'warning' : 'success'}>
                {plan.status}
              </Badge>
              <Button
                type="button"
                disabled={(() => {
                  const st = String(plan.status || '').toUpperCase();
                  if (st === 'ISSUED' || st === 'APPROVED') return true;
                  if (requireSubmitBeforeApprove && st !== 'SUBMITTED') return true;
                  return false;
                })()}
                onClick={onApprove}
              >
                Approve plan
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={String(plan.status || '').toUpperCase() !== 'SUBMITTED'}
                onClick={onReject}
              >
                Reject to draft
              </Button>
            </div>
          }
        >
          {requireApprovalFlow && planStatus === 'SUBMITTED' ? (
            <StoreNotice tone="amber" className="mb-4">
              Waiting for a store manager to approve this plan on{' '}
              <Link
                to={`${basePath}/store-manager/plan-approval${plan?.id ? `?planId=${encodeURIComponent(plan.id)}` : ''}`}
                className="font-medium text-amber-950 underline"
              >
                Plan Approval
              </Link>
              . Issue to kitchen stays disabled until the status is APPROVED.
            </StoreNotice>
          ) : null}
          {plan.status === 'SUBMITTED' ? (
            <div className="mb-4 max-w-xl space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="plan-reject-note">
                Rejection note (optional)
              </label>
              <textarea
                id="plan-reject-note"
                className="w-full min-h-[72px] rounded-md border px-3 py-2 text-sm"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Reason for sending back to operator"
              />
            </div>
          ) : null}

          <Table
            wrapperClassName="relative w-full max-h-[calc(3rem+2.625rem*10)] overflow-y-auto rounded-md border border-slate-200"
          >
            <TableHeader className="sticky top-0 z-10 bg-slate-100 shadow-sm [&_tr]:border-b-slate-200">
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Planned issue</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead title="Explain quantity changes or constraints for this line (saved with the row).">
                  Note <span className="text-muted-foreground font-normal">(add variance)</span>
                </TableHead>
                {canEditLines ? <TableHead className="text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {plan.lines.map((line) => {
                const lid = line.line_id || '';
                const draft = lineDrafts[lid] || {
                  planned_issue_quantity: String(line.planned_issue_quantity ?? ''),
                  variance_note: line.variance_note || ''
                };
                return (
                  <TableRow key={lid || line.inventory_item_id}>
                    <TableCell className="font-medium">{line.item}</TableCell>
                    <TableCell>
                      {line.required_quantity} {line.unit}
                    </TableCell>
                    <TableCell>
                      {canEditLines && lid ? (
                        <input
                          className="w-24 rounded border px-2 py-1 text-sm"
                          value={draft.planned_issue_quantity}
                          onChange={(e) =>
                            setLineDrafts((prev) => ({
                              ...prev,
                              [lid]: { ...draft, planned_issue_quantity: e.target.value }
                            }))
                          }
                        />
                      ) : (
                        `${line.planned_issue_quantity} ${line.unit}`
                      )}
                    </TableCell>
                    <TableCell>{line.issued_quantity}</TableCell>
                    <TableCell>
                      {canEditLines && lid ? (
                        <input
                          type="text"
                          className="w-full min-w-[8rem] max-w-xs rounded border px-2 py-1 text-sm"
                          value={draft.variance_note}
                          onChange={(e) =>
                            setLineDrafts((prev) => ({
                              ...prev,
                              [lid]: { ...draft, variance_note: e.target.value }
                            }))
                          }
                          placeholder="Add note (optional)"
                          aria-label="Variance note for this line"
                          title="Saved when you use Save line on this row."
                        />
                      ) : (
                        line.variance_note || '—'
                      )}
                    </TableCell>
                    {canEditLines ? (
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={!lid}
                          title={!lid ? 'Line id missing from server — refresh the plan.' : 'Save planned issue quantity and variance note for this row.'}
                          onClick={() => onSaveLine(line)}
                        >
                          Save line
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </StoreSection>
      )}
    </StorePageShell>
  );
};

export default StoreManagerPlanApprovalPage;
