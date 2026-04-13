import React from 'react';
import { useParams } from 'react-router-dom';
import { useKitchenInventoryMock } from '../../hooks/adminHook/kitchenStoreHook';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StorePageHeader, StorePageShell, StoreSection, StoreStatCard, StoreStatGrid } from '@/components/store/StorePageShell';
import { nearExpiryChipClassName, nearExpiryCountdownLabel, nearExpiryRowClassName } from '../../utils/nearExpiryUi.js';

/** @feature kitchen-store — STORE_OPERATOR: single item detail and movement history. */
const StoreOperatorItemDetailPage = () => {
  const { itemId } = useParams();
  const { items, movements, nearExpiryByItemId } = useKitchenInventoryMock();
  const item = items.find((it) => it.id === itemId);
  const exp = itemId ? nearExpiryByItemId[itemId] : null;
  const itemMovements = movements.filter(
    (m) =>
      m.item_id === itemId || (!m.item_id && m.item_name && item?.name && m.item_name === item.name)
  );

  if (!item) {
    return (
      <StorePageShell className="max-w-4xl">
        <StoreSection title="Item Detail">
          <p className="text-sm text-muted-foreground">Item not found.</p>
        </StoreSection>
      </StorePageShell>
    );
  }

  return (
    <StorePageShell className="max-w-4xl">
      <StorePageHeader
        title={`Item Detail: ${item.name}`}
        description="Inventory item movement history for the operator."
      />
      <StoreStatGrid>
        <StoreStatCard label="Current Quantity" value={`${item.current_quantity} ${item.unit}`} />
        <StoreStatCard label="Min Quantity" value={`${item.min_quantity} ${item.unit}`} />
        <StoreStatCard label="Movements" value={itemMovements.length} />
      </StoreStatGrid>
      {exp ? (
        <div className={`rounded-xl border border-slate-200/80 p-4 ${nearExpiryRowClassName(exp)}`}>
          <p className="text-sm font-semibold text-slate-900">Near-expiry</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${nearExpiryChipClassName(exp)}`}>
              {nearExpiryCountdownLabel(exp)}
            </span>
            {exp.expiry_date ? (
              <span className="text-xs text-slate-600">Earliest batch date: {exp.expiry_date}</span>
            ) : null}
            {exp.batch_count > 1 ? (
              <span className="text-xs text-slate-500">{exp.batch_count} batches in window</span>
            ) : null}
          </div>
        </div>
      ) : null}
      <StoreSection title="Movement Timeline">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Delta</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemMovements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell>{new Date(movement.occurred_at).toLocaleString()}</TableCell>
                <TableCell><Badge variant="outline">{movement.movement_type}</Badge></TableCell>
                <TableCell>{movement.quantity}</TableCell>
                <TableCell className={movement.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}>{movement.delta}</TableCell>
                <TableCell>{movement.note || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreOperatorItemDetailPage;

