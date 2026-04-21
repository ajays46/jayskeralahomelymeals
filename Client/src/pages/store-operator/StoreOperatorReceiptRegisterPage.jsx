import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCompanyBasePath } from '../../context/TenantContext';
import { Button } from '@/components/ui/button';
import { StorePageHeader, StorePageShell } from '@/components/store/StorePageShell';
import { OperatorReceiptRegisterSections } from '@/components/store/OperatorReceiptRegisterSections';

/** @feature kitchen-store — STORE_OPERATOR: receipt register & received lines (standalone). */

const StoreOperatorReceiptRegisterPage = () => {
  const basePath = useCompanyBasePath();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId')?.trim() || '';

  const purchasesHref =
    `${basePath}/store-operator/purchases` + (requestId ? `?requestId=${encodeURIComponent(requestId)}` : '');

  return (
    <StorePageShell>
      <StorePageHeader
        title="Receipt register & received items"
        description="Browse purchase receipts and open a receipt to review received lines. Optional filter: append ?requestId= to match a specific approved request."
        tone="sky"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to={purchasesHref}>Back to purchase receipts</Link>
          </Button>
        }
      />
      <OperatorReceiptRegisterSections
        purchaseRequestId={requestId}
        emptyHistoryHint="No receipts yet. Use Purchase receipts to create one."
      />
    </StorePageShell>
  );
};

export default StoreOperatorReceiptRegisterPage;
