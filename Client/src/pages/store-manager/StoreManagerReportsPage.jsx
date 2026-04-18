import React, { useEffect, useMemo, useState } from 'react';
import { useKitchenReportsMock, usePurchaseGovernanceReports } from '../../hooks/adminHook/kitchenStoreHook';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  StoreNotice,
  StorePageHeader,
  StorePageShell,
  StoreSection,
  StoreStatCard,
  StoreStatGrid
} from '@/components/store/StorePageShell';

const normKey = (s) => String(s || '').toLowerCase().replace(/-/g, '_');

/** Normalize API column names so `createdAt` matches `created_at` for filters and IST formatting. */
const normColumnKey = (s) =>
  String(s ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/-/g, '_')
    .toLowerCase();

/** Display timestamps in India Standard Time (Asia/Kolkata). */
const formatIstDateTime = (raw) => {
  if (raw == null || raw === '') return '—';
  const d = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(d);
  } catch {
    return String(raw);
  }
};

const columnMatchesAny = (col, patterns) => {
  const n = normColumnKey(col);
  return patterns.some((p) => normColumnKey(p) === n);
};

const filterVisibleColumns = (allKeys, hiddenPatterns) => {
  if (!hiddenPatterns?.length) return allKeys;
  return allKeys.filter((col) => !columnMatchesAny(col, hiddenPatterns));
};

/** Purchase requests: no id / requested-by; dates in IST. */
const REPORT_PR_HIDDEN = Object.freeze(['id', 'requested_by', 'requestedBy']);
const REPORT_PR_IST_DATES = Object.freeze(['created_at', 'createdAt']);

/** Kitchen daily plans: no id. */
const REPORT_KDP_HIDDEN = Object.freeze(['id']);

/** Physical count sessions: no id; timestamps in IST. */
const REPORT_PCS_HIDDEN = Object.freeze(['id']);
const REPORT_PCS_IST_DATES = Object.freeze(['created_at', 'createdAt', 'finalized_at', 'finalizedAt']);

const purchaseTypeSummaryRows = (data) => {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (data.rows && Array.isArray(data.rows)) return data.rows;
  if (data.items && Array.isArray(data.items)) return data.items;
  if (data.summary && Array.isArray(data.summary)) return data.summary;
  const byType = data.by_purchase_type ?? data.by_type;
  if (byType && typeof byType === 'object' && !Array.isArray(byType)) {
    return Object.entries(byType).map(([purchase_type, v]) =>
      typeof v === 'object' && v !== null && !Array.isArray(v)
        ? { purchase_type, ...v }
        : { purchase_type, value: v }
    );
  }
  return [];
};

const countMapEntries = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  return Object.entries(obj).map(([k, v]) => ({ key: k, value: v }));
};

const isPlainCountMap = (v) => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const vals = Object.values(v);
  if (vals.length === 0) return true;
  return vals.every((x) => typeof x === 'number' || (typeof x === 'string' && String(x).trim() !== '' && !Number.isNaN(Number(x))));
};

const partitionWeeklyGovernance = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { scalars: [], countMaps: [], arrays: [] };
  }
  const scalars = [];
  const countMaps = [];
  const arrays = [];
  for (const [k, v] of Object.entries(data)) {
    if (v == null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      scalars.push([k, v]);
      continue;
    }
    if (Array.isArray(v)) {
      arrays.push([k, v]);
      continue;
    }
    if (typeof v === 'object' && isPlainCountMap(v)) {
      countMaps.push([k, v]);
    }
  }
  return { scalars, countMaps, arrays };
};

const rowKeysForObjectRows = (rows) => {
  const keys = new Set();
  rows.forEach((r) => {
    if (r && typeof r === 'object' && !Array.isArray(r)) Object.keys(r).forEach((k) => keys.add(k));
  });
  return Array.from(keys);
};

const rowKeysForTable = (rows) => {
  const keys = new Set();
  rows.forEach((r) => {
    if (r && typeof r === 'object' && !Array.isArray(r)) Object.keys(r).forEach((k) => keys.add(k));
  });
  return Array.from(keys);
};

const governanceMetaLines = (data) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return [];
  const prefer = ['week_start', 'week_end', 'week_label', 'as_of', 'generated_at', 'company_id', 'period'];
  const lines = [];
  for (const k of prefer) {
    if (data[k] != null && data[k] !== '') lines.push({ key: k, value: String(data[k]) });
  }
  return lines;
};

/** Pick [key, map] from governance countMaps by normalized key aliases (first match wins). */
const pickCountMap = (countMaps, ...aliases) => {
  const want = new Set(aliases.map(normKey));
  for (const entry of countMaps) {
    const [k] = entry;
    if (want.has(normKey(k))) return entry;
  }
  return null;
};

/**
 * Assign each governance array to at most one slot (exact key match first, then substring), so
 * fuzzy matching does not attach the same payload to two tables.
 */
const assignGovernanceArrayTables = (arrays) => {
  const list = Array.isArray(arrays) ? [...arrays] : [];
  const usedKeys = new Set();

  const take = (aliases, fuzzy) => {
    const want = aliases.map(normKey);
    for (const entry of list) {
      const [k, v] = entry;
      if (usedKeys.has(k) || !Array.isArray(v)) continue;
      const nk = normKey(k);
      if (want.some((w) => nk === w)) {
        usedKeys.add(k);
        return v;
      }
    }
    if (!fuzzy) return undefined;
    for (const entry of list) {
      const [k, v] = entry;
      if (usedKeys.has(k) || !Array.isArray(v)) continue;
      const nk = normKey(k);
      if (want.some((w) => nk.includes(w))) {
        usedKeys.add(k);
        return v;
      }
    }
    return undefined;
  };

  return {
    purchaseRequests: take(['purchase_requests'], true),
    kitchenDailyPlans: take(['kitchen_daily_plans', 'daily_plans'], true),
    physicalCountSessions: take(['physical_count_sessions', 'physical_counts', 'count_sessions'], true)
  };
};

const ReportPanel = ({ title, className, children }) => (
  <div
    className={cn(
      'rounded-lg border border-slate-200/90 bg-white p-4 shadow-sm',
      className
    )}
  >
    <h4 className="mb-3 text-sm font-semibold text-slate-800">{title}</h4>
    <div className="[&_th]:text-xs [&_td]:text-sm">{children}</div>
  </div>
);

const CountMapTable = ({ mapObj, loading, embed }) => {
  const rows = countMapEntries(mapObj);
  const table = (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Key</TableHead>
          <TableHead className="text-right">Count</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={2} className="text-muted-foreground">
              Loading…
            </TableCell>
          </TableRow>
        ) : rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={2} className="text-muted-foreground">
              No data
            </TableCell>
          </TableRow>
        ) : (
          rows.map(({ key, value }) => (
            <TableRow key={key}>
              <TableCell className="font-medium">{key.replace(/_/g, ' ')}</TableCell>
              <TableCell className="text-right tabular-nums">{String(value)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
  if (embed) return table;
  return (
    <div className="mt-6">
      <h4 className="mb-2 text-sm font-semibold text-slate-800">Breakdown</h4>
      {table}
    </div>
  );
};

const ScalarTwoColTable = ({ pairs, loading, embed }) => {
  const table = (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Field</TableHead>
          <TableHead>Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={2} className="text-muted-foreground">
              Loading…
            </TableCell>
          </TableRow>
        ) : pairs.length === 0 ? (
          <TableRow>
            <TableCell colSpan={2} className="text-muted-foreground">
              No scalar fields
            </TableCell>
          </TableRow>
        ) : (
          pairs.map(([k, v]) => (
            <TableRow key={k}>
              <TableCell className="font-medium text-slate-700">{k.replace(/_/g, ' ')}</TableCell>
              <TableCell className="tabular-nums text-slate-800">{v == null || v === '' ? '—' : String(v)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
  if (embed) return table;
  return (
    <div className="mt-6">
      <h4 className="mb-2 text-sm font-semibold text-slate-800">Scalars</h4>
      {table}
    </div>
  );
};

const ObjectListTable = ({ rows, loading, embed, hiddenColumns = [], istDateColumns = [] }) => {
  const columns = useMemo(() => {
    const keys = rowKeysForObjectRows(rows || []);
    return filterVisibleColumns(keys, hiddenColumns);
  }, [rows, hiddenColumns]);

  const formatCell = (col, value) => {
    if (value == null || value === '') return '—';
    if (istDateColumns.length && columnMatchesAny(col, istDateColumns)) {
      return formatIstDateTime(value);
    }
    return String(value);
  };

  const table = (
    <div
      className={
        (rows?.length || 0) > 8
          ? 'relative max-h-[min(22rem,55vh)] overflow-auto rounded-md border border-slate-200'
          : undefined
      }
    >
      <Table>
        <TableHeader
          className={
            (rows?.length || 0) > 8 ? 'sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgb(226_232_240)]' : undefined
          }
        >
          <TableRow>
            {columns.length === 0 ? (
              <TableHead>Row</TableHead>
            ) : (
              columns.map((col) => (
                <TableHead key={col} className="capitalize whitespace-nowrap">
                  {col.replace(/_/g, ' ')}
                </TableHead>
              ))
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={Math.max(1, columns.length)} className="text-muted-foreground">
                Loading…
              </TableCell>
            </TableRow>
          ) : !rows || rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={Math.max(1, columns.length)} className="text-muted-foreground">
                No rows
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => (
              <TableRow key={row?.id ?? idx}>
                {columns.map((col) => (
                  <TableCell key={col} className="max-w-[14rem] truncate text-sm" title={formatCell(col, row[col])}>
                    {formatCell(col, row[col])}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
  if (embed) return table;
  return (
    <div className="mt-6">
      <h4 className="mb-2 text-sm font-semibold text-slate-800">Rows</h4>
      {table}
    </div>
  );
};

/** @feature kitchen-store — STORE_MANAGER: purchase governance reports and movement preview. */
const StoreManagerReportsPage = () => {
  const { orderSummary, consumptionSummary, purchaseVsUsage, totalRevenue } = useKitchenReportsMock();
  const { purchaseTypeSummary, weeklyGovernance, loading, error, loadReports } = usePurchaseGovernanceReports();

  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');

  const reportParams = useMemo(() => {
    const p = {};
    if (weekStart.trim()) p.week_start = weekStart.trim();
    if (weekEnd.trim()) p.week_end = weekEnd.trim();
    return p;
  }, [weekStart, weekEnd]);

  useEffect(() => {
    loadReports({});
  }, [loadReports]);

  const summaryRows = useMemo(() => purchaseTypeSummaryRows(purchaseTypeSummary), [purchaseTypeSummary]);
  const summaryColumns = useMemo(() => rowKeysForTable(summaryRows), [summaryRows]);
  const metaLines = useMemo(() => governanceMetaLines(weeklyGovernance), [weeklyGovernance]);
  const governanceParts = useMemo(() => partitionWeeklyGovernance(weeklyGovernance), [weeklyGovernance]);
  const governanceWindowScalarPairs = useMemo(() => {
    const metaKeys = new Set(metaLines.map((m) => m.key));
    return governanceParts.scalars.filter(([k]) => !metaKeys.has(k));
  }, [governanceParts.scalars, metaLines]);

  const purchaseReqByTypeMap = useMemo(
    () => pickCountMap(governanceParts.countMaps, 'purchase_requests_by_type'),
    [governanceParts.countMaps]
  );
  const purchaseReqByStatusMap = useMemo(
    () => pickCountMap(governanceParts.countMaps, 'purchase_requests_by_status'),
    [governanceParts.countMaps]
  );
  const kitchenPlansByStatusMap = useMemo(
    () =>
      pickCountMap(
        governanceParts.countMaps,
        'kitchen_daily_plans_by_status',
        'daily_plans_by_status',
        'kitchen_plans_by_status'
      ),
    [governanceParts.countMaps]
  );

  const { purchaseRequests, kitchenDailyPlans, physicalCountSessions } = useMemo(
    () => assignGovernanceArrayTables(governanceParts.arrays),
    [governanceParts.arrays]
  );

  const hasAggregatePurchaseSummary = Boolean(
    purchaseTypeSummary &&
      typeof purchaseTypeSummary === 'object' &&
      !Array.isArray(purchaseTypeSummary) &&
      (purchaseTypeSummary.by_purchase_type ||
        purchaseTypeSummary.by_type ||
        purchaseTypeSummary.by_status)
  );

  const onRefreshApi = () => loadReports(reportParams);

  return (
    <StorePageShell>
      <StorePageHeader title="Store Manager Reports" />

      <StoreSection title="Purchase reports & governance">
        {error ? <StoreNotice tone="rose">{error}</StoreNotice> : null}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="grid gap-2 sm:w-44">
            <label htmlFor="report-week-start" className="text-sm font-medium text-slate-700">
              Week start (optional)
            </label>
            <Input
              id="report-week-start"
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
            />
          </div>
          <div className="grid gap-2 sm:w-44">
            <label htmlFor="report-week-end" className="text-sm font-medium text-slate-700">
              Week end (optional)
            </label>
            <Input id="report-week-end" type="date" value={weekEnd} onChange={(e) => setWeekEnd(e.target.value)} />
          </div>
          <Button type="button" onClick={onRefreshApi} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh reports'}
          </Button>
        </div>

        {metaLines.length > 0 ? (
          <ul className="mb-6 flex flex-wrap gap-3 text-sm text-slate-600">
            {metaLines.map(({ key, value }) => (
              <li key={key}>
                <span className="font-medium text-slate-800">{key.replace(/_/g, ' ')}:</span> {value}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {hasAggregatePurchaseSummary ? (
            <>
              {(purchaseTypeSummary.by_purchase_type || purchaseTypeSummary.by_type) && (
                <ReportPanel title="By purchase type">
                  <CountMapTable
                    embed
                    mapObj={purchaseTypeSummary.by_purchase_type ?? purchaseTypeSummary.by_type}
                    loading={loading}
                  />
                </ReportPanel>
              )}
              {purchaseTypeSummary.by_status ? (
                <ReportPanel title="By status">
                  <CountMapTable embed mapObj={purchaseTypeSummary.by_status} loading={loading} />
                </ReportPanel>
              ) : null}
            </>
          ) : null}

          {governanceWindowScalarPairs.length > 0 || loading ? (
            <ReportPanel title="Window metrics">
              <ScalarTwoColTable embed pairs={governanceWindowScalarPairs} loading={loading} />
            </ReportPanel>
          ) : null}

          {purchaseReqByTypeMap ? (
            <ReportPanel title="Purchase requests by type">
              <CountMapTable embed mapObj={purchaseReqByTypeMap[1]} loading={loading} />
            </ReportPanel>
          ) : null}
          {purchaseReqByStatusMap ? (
            <ReportPanel title="Purchase requests by status">
              <CountMapTable embed mapObj={purchaseReqByStatusMap[1]} loading={loading} />
            </ReportPanel>
          ) : null}
          {kitchenPlansByStatusMap ? (
            <ReportPanel title="Kitchen daily plans by status">
              <CountMapTable embed mapObj={kitchenPlansByStatusMap[1]} loading={loading} />
            </ReportPanel>
          ) : null}
        </div>

        {!hasAggregatePurchaseSummary ? (
          <div className="mt-8">
            <ReportPanel title="Purchase type mix (legacy row shape)">
              <Table>
                <TableHeader>
                  <TableRow>
                    {summaryColumns.length === 0 ? (
                      <TableHead>Data</TableHead>
                    ) : (
                      summaryColumns.map((col) => (
                        <TableHead key={col} className="capitalize">
                          {col.replace(/_/g, ' ')}
                        </TableHead>
                      ))
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={Math.max(1, summaryColumns.length)} className="text-muted-foreground">
                        Loading purchase-type summary…
                      </TableCell>
                    </TableRow>
                  ) : summaryRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={Math.max(1, summaryColumns.length)} className="text-muted-foreground">
                        No rows returned yet (empty list or upstream not configured). Try refresh or adjust week filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    summaryRows.map((row, idx) => (
                      <TableRow key={idx}>
                        {summaryColumns.map((col) => (
                          <TableCell key={col}>
                            {row[col] == null || row[col] === '' ? '—' : String(row[col])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ReportPanel>
          </div>
        ) : null}

        <div className="mt-10 space-y-10">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Purchase requests</h3>
            <ObjectListTable
              embed
              rows={purchaseRequests}
              loading={loading}
              hiddenColumns={REPORT_PR_HIDDEN}
              istDateColumns={REPORT_PR_IST_DATES}
            />
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Kitchen daily plans</h3>
            <ObjectListTable embed rows={kitchenDailyPlans} loading={loading} hiddenColumns={REPORT_KDP_HIDDEN} />
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Physical count sessions</h3>
            <ObjectListTable
              embed
              rows={physicalCountSessions}
              loading={loading}
              hiddenColumns={REPORT_PCS_HIDDEN}
              istDateColumns={REPORT_PCS_IST_DATES}
            />
          </div>
        </div>

        {!loading && weeklyGovernance == null ? (
          <p className="mt-8 text-sm text-muted-foreground">No governance data loaded.</p>
        ) : null}
        {!loading &&
        weeklyGovernance &&
        Object.keys(weeklyGovernance).length > 0 &&
        governanceWindowScalarPairs.length === 0 &&
        governanceParts.countMaps.length === 0 &&
        governanceParts.arrays.length === 0 &&
        metaLines.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">Governance payload is empty or uses an unexpected shape.</p>
        ) : null}
      </StoreSection>

      <StoreSection title="Movement preview (local demo)">
        <StoreStatGrid>
          <StoreStatCard label="Total Revenue" value={totalRevenue ? `INR ${totalRevenue}` : 'N/A'} />
          <StoreStatCard
            label="Total Orders"
            value={orderSummary.length === 0 ? 'N/A' : orderSummary.reduce((sum, row) => sum + row.orders, 0)}
          />
          <StoreStatCard label="Items Used" value={consumptionSummary.length} />
        </StoreStatGrid>
        <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-800">Session-wise orders and revenue</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderSummary.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground">
                  No order/revenue data available yet.
                </TableCell>
              </TableRow>
            ) : (
              orderSummary.map((row) => (
                <TableRow key={row.session}>
                  <TableCell className="font-medium">{row.session}</TableCell>
                  <TableCell>{row.orders}</TableCell>
                  <TableCell>INR {row.revenue}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-800">Consumption summary</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Used</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consumptionSummary.map((row) => (
              <TableRow key={row.item}>
                <TableCell className="font-medium">{row.item}</TableCell>
                <TableCell>
                  {row.used} {row.unit}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <h3 className="mb-2 mt-6 text-sm font-semibold text-slate-800">Purchase vs usage</h3>
        {purchaseVsUsage.length > 10 ? (
          <p className="mb-2 text-xs text-muted-foreground">
            {purchaseVsUsage.length} items — scroll to see more (about 10 rows visible).
          </p>
        ) : null}
        <Table
          wrapperClassName={
            purchaseVsUsage.length > 10
              ? 'relative w-full max-h-[min(28rem,70vh)] overflow-y-auto rounded-md border border-slate-200'
              : undefined
          }
        >
          <TableHeader
            className={
              purchaseVsUsage.length > 10
                ? 'sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgb(226_232_240)]'
                : undefined
            }
          >
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Purchased</TableHead>
              <TableHead>Used</TableHead>
              <TableHead>Remaining</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseVsUsage.map((row) => (
              <TableRow key={row.item}>
                <TableCell className="font-medium">{row.item}</TableCell>
                <TableCell>
                  {row.purchased} {row.unit}
                </TableCell>
                <TableCell>
                  {row.used} {row.unit}
                </TableCell>
                <TableCell>
                  {row.remaining} {row.unit}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerReportsPage;
