import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StoreNotice, StoreSection, StoreStatCard, StoreStatGrid } from '@/components/store/StorePageShell';
import { PURCHASE_KIND } from '@/components/store/purchaseRequestShared';
import { formatKitchenDateTime, useKitchenPurchaseRhythmApi } from '../../hooks/adminHook/kitchenStoreHook';

/** @feature kitchen-store — Weekly/daily rhythm panels (embedded in purchase-requests inbox). */

function operatorDisplayLabel(request) {
  if (request.operator_name?.trim()) return request.operator_name;
  if (request.requested_by_id) return '—';
  return '-';
}

function collectRowKeys(rows, maxCols) {
  const keys = [];
  const seen = new Set();
  const cap = maxCols ?? 8;
  for (const row of rows.slice(0, 40)) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    for (const k of Object.keys(row)) {
      if (seen.has(k)) continue;
      seen.add(k);
      keys.push(k);
      if (keys.length >= cap) return keys;
    }
  }
  return keys;
}

function stringifyCell(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

const DynamicObjectTable = ({ rows, emptyMessage }) => {
  const keys = useMemo(() => collectRowKeys(rows || [], 10), [rows]);
  const list = Array.isArray(rows) ? rows : [];

  if (!list.length) {
    return <StoreNotice tone="amber">{emptyMessage || 'No rows returned.'}</StoreNotice>;
  }

  return (
    <div className="max-h-[20rem] overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {keys.map((k) => (
              <TableHead key={k} className="whitespace-nowrap">
                {k}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((row, idx) => (
            <TableRow key={idx}>
              {keys.map((k) => (
                <TableCell key={k} className="max-w-[14rem] truncate text-sm" title={stringifyCell(row?.[k])}>
                  {stringifyCell(row?.[k])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

function primitiveDashboardEntries(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return [];
  return Object.entries(data).filter(([, v]) => {
    const t = typeof v;
    return t === 'string' || t === 'number' || t === 'boolean';
  });
}

const DashboardPanel = ({ title, data }) => {
  const pairs = primitiveDashboardEntries(data);
  if (!pairs.length) {
    if (data == null) {
      return <StoreNotice tone="amber">No dashboard payload returned.</StoreNotice>;
    }
    return (
      <StoreSection title={title} tone="sky">
        <pre className="max-h-48 overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
          {JSON.stringify(data, null, 2)}
        </pre>
      </StoreSection>
    );
  }
  return (
    <StoreSection title={title} tone="sky">
      <StoreStatGrid className="sm:grid-cols-2 lg:grid-cols-3">
        {pairs.map(([label, value]) => (
          <StoreStatCard key={label} label={label} value={String(value)} tone="emerald" />
        ))}
      </StoreStatGrid>
    </StoreSection>
  );
};

const RequestTable = ({ requests, basePath, emptyMessage }) => {
  if (!requests.length) {
    return <StoreNotice tone="amber">{emptyMessage}</StoreNotice>;
  }
  return (
    <div className="max-h-[18rem] overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Operator</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Note</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">{operatorDisplayLabel(request)}</TableCell>
              <TableCell>
                <Badge variant={request.status === 'SUBMITTED' ? 'warning' : 'secondary'}>
                  {request.status || '-'}
                </Badge>
              </TableCell>
              <TableCell>{request.purchase_type || '-'}</TableCell>
              <TableCell>
                {formatKitchenDateTime(request.submitted_at || request.created_at) ||
                  request.submitted_at ||
                  request.created_at ||
                  '-'}
              </TableCell>
              <TableCell className="max-w-xs truncate text-sm">{request.requested_note || '-'}</TableCell>
              <TableCell className="text-right">
                <Button asChild variant="outline" size="sm">
                  <Link to={`${basePath}/store-manager/purchase-requests/${request.id}`}>Open</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

function extractPurchaseRhythmListLocal(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== 'object') return [];
  const keys = ['items', 'requests', 'results', 'queue', 'rows', 'lines', 'receipts'];
  for (const k of keys) {
    const arr = raw[k];
    if (Array.isArray(arr)) return arr;
  }
  return [];
}

/** @param {{ basePath: string }} props */
const StoreManagerPurchaseRhythmContent = ({ basePath }) => {
  const [tab, setTab] = useState(PURCHASE_KIND.WEEKLY);
  const {
    loadingWeekly,
    loadingDaily,
    error,
    weeklyRequests,
    weeklyQueue,
    weeklyDashboard,
    dailyRequests,
    dailyQueue,
    dailyDashboard,
    dailyShortage,
    dailyReceiptsToday,
    refreshWeekly,
    refreshDaily
  } = useKitchenPurchaseRhythmApi();

  useEffect(() => {
    refreshWeekly();
    refreshDaily();
  }, [refreshWeekly, refreshDaily]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => refreshWeekly()} disabled={loadingWeekly}>
          {loadingWeekly ? 'Refreshing weekly…' : 'Refresh weekly data'}
        </Button>
        <Button type="button" variant="outline" onClick={() => refreshDaily()} disabled={loadingDaily}>
          {loadingDaily ? 'Refreshing daily…' : 'Refresh daily data'}
        </Button>
      </div>

      {error ? <StoreNotice tone="rose">{error}</StoreNotice> : null}

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4 grid h-auto w-full max-w-xl grid-cols-2 gap-1 p-1 sm:inline-flex sm:w-auto">
          <TabsTrigger value={PURCHASE_KIND.WEEKLY}>Weekly rhythm</TabsTrigger>
          <TabsTrigger value={PURCHASE_KIND.DAILY}>Daily rhythm</TabsTrigger>
        </TabsList>

        <TabsContent value={PURCHASE_KIND.WEEKLY} className="space-y-6 focus-visible:ring-offset-0">
          <DashboardPanel title="Weekly dashboard" data={weeklyDashboard} />
          <StoreSection
            title="Weekly approval queue"
            description="Items waiting for store manager approval in the weekly cycle."
            tone="amber"
          >
            {loadingWeekly ? (
              <StoreNotice tone="sky">Loading…</StoreNotice>
            ) : (
              <DynamicObjectTable rows={weeklyQueue} emptyMessage="No weekly approval queue rows returned." />
            )}
          </StoreSection>
          <StoreSection title="Weekly purchase requests" tone="violet">
            {loadingWeekly ? (
              <StoreNotice tone="sky">Loading…</StoreNotice>
            ) : (
              <RequestTable
                requests={weeklyRequests}
                basePath={basePath}
                emptyMessage="No weekly purchase requests returned."
              />
            )}
          </StoreSection>
        </TabsContent>

        <TabsContent value={PURCHASE_KIND.DAILY} className="space-y-6 focus-visible:ring-offset-0">
          <DashboardPanel title="Daily dashboard" data={dailyDashboard} />
          <StoreSection
            title="Daily approval queue"
            description="Items waiting for store manager approval in the daily cycle."
            tone="amber"
          >
            {loadingDaily ? (
              <StoreNotice tone="sky">Loading…</StoreNotice>
            ) : (
              <DynamicObjectTable rows={dailyQueue} emptyMessage="No daily approval queue rows returned." />
            )}
          </StoreSection>
          <StoreSection title="Daily purchase requests" tone="violet">
            {loadingDaily ? (
              <StoreNotice tone="sky">Loading…</StoreNotice>
            ) : (
              <RequestTable
                requests={dailyRequests}
                basePath={basePath}
                emptyMessage="No daily purchase requests returned."
              />
            )}
          </StoreSection>
          <StoreSection title="Shortage detection" tone="rose">
            {loadingDaily ? (
              <StoreNotice tone="sky">Loading…</StoreNotice>
            ) : Array.isArray(dailyShortage) ? (
              <DynamicObjectTable rows={dailyShortage} emptyMessage="No shortage rows returned." />
            ) : dailyShortage && typeof dailyShortage === 'object' ? (
              <DynamicObjectTable rows={extractPurchaseRhythmListLocal(dailyShortage)} emptyMessage="No shortage rows returned." />
            ) : (
              <StoreNotice tone="amber">No shortage data returned.</StoreNotice>
            )}
          </StoreSection>
          <StoreSection title="Stock receipt today" tone="sky">
            {loadingDaily ? (
              <StoreNotice tone="sky">Loading…</StoreNotice>
            ) : Array.isArray(dailyReceiptsToday) ? (
              <DynamicObjectTable rows={dailyReceiptsToday} emptyMessage="No receipt rows for today." />
            ) : dailyReceiptsToday && typeof dailyReceiptsToday === 'object' ? (
              <DynamicObjectTable
                rows={extractPurchaseRhythmListLocal(dailyReceiptsToday)}
                emptyMessage="No receipt rows for today."
              />
            ) : (
              <StoreNotice tone="amber">No stock receipt data returned.</StoreNotice>
            )}
          </StoreSection>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StoreManagerPurchaseRhythmContent;
