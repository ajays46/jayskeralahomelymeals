import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCompanyBasePath, useTenant } from '../../context/TenantContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';
import { showStoreSuccess } from '../../utils/toastConfig.jsx';
import {
  PURCHASE_KIND_META,
  clearPurchaseRequestDraftFromStorage,
  getPurchaseRequestDraftStorageKey,
  readPurchaseRequestDraftInboxView,
  stripPurchaseRequestDraftKindFromStorage
} from '@/components/store/purchaseRequestShared';

/** @feature kitchen-store — STORE_OPERATOR: inbox view for browser-stored purchase request drafts (weekly + daily). */

const formatSavedAt = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return String(iso);
  }
};

const StoreOperatorPurchaseRequestDraftInboxPage = () => {
  const basePath = useCompanyBasePath();
  const { companyPath } = useTenant() || {};
  const [view, setView] = useState(() => readPurchaseRequestDraftInboxView(companyPath));

  const reload = useCallback(() => {
    setView(readPurchaseRequestDraftInboxView(companyPath));
  }, [companyPath]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!companyPath || typeof window === 'undefined') return undefined;
    const key = getPurchaseRequestDraftStorageKey(companyPath);
    const onStorage = (e) => {
      if (e.key === key) reload();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [companyPath, reload]);

  const discardKind = (kind) => {
    if (!companyPath) return;
    stripPurchaseRequestDraftKindFromStorage(companyPath, kind);
    reload();
    showStoreSuccess(
      `${PURCHASE_KIND_META[kind]?.label || 'This tab'} draft removed from this browser.`,
      'Draft discarded'
    );
  };

  const discardAll = () => {
    if (!companyPath) return;
    clearPurchaseRequestDraftFromStorage(companyPath);
    reload();
    showStoreSuccess('All purchase request drafts removed from this browser.', 'Drafts cleared');
  };

  /** Only list kinds you actually drafted (lines or manager note). Omit empty tabs so daily-only saves do not show a weekly row. */
  const rows = [view.weekly, view.daily].filter((row) => row.hasContent);

  return (
    <StorePageShell className="max-w-5xl">
      <StorePageHeader
        title="Purchase request draft inbox"
        description="Only purchase types where you saved lines or a note appear here. Drafts stay on this device until you submit from Create Purchase Request."
        actions={[
          <Button key="composer" asChild>
            <Link to={`${basePath}/store-operator/purchase-requests`}>Create / edit requests</Link>
          </Button>,
          <Button key="approved" asChild variant="outline">
            <Link to={`${basePath}/store-operator/approved-requests`}>Approved requests</Link>
          </Button>
        ]}
        tone="amber"
      />

      {!companyPath ? <StoreNotice tone="sky">Loading company context…</StoreNotice> : null}

      {!view.exists ? (
        <StoreSection title="No draft file" tone="amber">
          <StoreNotice tone="amber">
            There is no saved purchase request draft for this location in this browser yet. Use{' '}
            <Link to={`${basePath}/store-operator/purchase-requests`} className="font-medium underline underline-offset-2">
              Create Purchase Request
            </Link>{' '}
            and choose <span className="font-medium">Save draft</span> to store your work here.
          </StoreNotice>
        </StoreSection>
      ) : !view.hasAny ? (
        <StoreSection title="Draft file is empty" tone="amber">
          <p className="mb-3 text-sm text-slate-600">
            A draft entry exists for this location but neither weekly nor daily has lines or a manager note. You can
            clear it below.
          </p>
          <Button type="button" variant="outline" onClick={discardAll}>
            Remove empty draft record
          </Button>
        </StoreSection>
      ) : (
        <StoreSection
          title="Saved on this device"
          description={`${rows.length} type${rows.length === 1 ? '' : 's'} with a draft · Last saved: ${formatSavedAt(view.savedAt)}`}
          tone="amber"
          headerActions={[
            <Button key="refresh" type="button" variant="outline" size="sm" onClick={reload}>
              Refresh
            </Button>,
            <Button key="clear" type="button" variant="outline" size="sm" onClick={discardAll}>
              Discard all
            </Button>
          ]}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead>For date</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const meta = PURCHASE_KIND_META[row.kind];
                return (
                  <TableRow key={row.kind}>
                    <TableCell className="font-medium text-slate-900">{meta?.label || row.kind}</TableCell>
                    <TableCell>
                      {row.hasContent ? (
                        <Badge className="bg-amber-100 font-medium text-amber-950 hover:bg-amber-100">In progress</Badge>
                      ) : (
                        <span className="text-sm text-slate-500">Empty</span>
                      )}
                    </TableCell>
                    <TableCell>{row.lineCount}</TableCell>
                    <TableCell className="text-sm text-slate-700">{row.forDate || '—'}</TableCell>
                    <TableCell className="text-sm text-slate-700">{row.urgency}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                        {row.hasContent ? (
                          <Button type="button" size="sm" variant="secondary" asChild>
                            <Link
                              to={`${basePath}/store-operator/purchase-requests?tab=${encodeURIComponent(row.kind)}`}
                            >
                              Continue
                            </Link>
                          </Button>
                        ) : (
                          <span className="max-w-[9rem] text-right text-xs text-slate-400">Nothing saved for this tab</span>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => discardKind(row.kind)}
                          disabled={!row.hasContent}
                        >
                          Discard
                        </Button>
                      </div>
                    </TableCell>
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

export default StoreOperatorPurchaseRequestDraftInboxPage;
