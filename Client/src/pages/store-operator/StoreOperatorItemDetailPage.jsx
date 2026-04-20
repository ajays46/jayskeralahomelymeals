import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useKitchenInventoryMock } from '../../hooks/adminHook/kitchenStoreHook';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StorePageHeader, StorePageShell, StoreSection, StoreStatCard, StoreStatGrid } from '@/components/store/StorePageShell';

/** @feature kitchen-store — STORE_OPERATOR: single item summary + movement timeline (extended batch/FEFO UI reserved for later). */
const StoreOperatorItemDetailPage = () => {
  const { itemId } = useParams();
  const { items, movements } = useKitchenInventoryMock();
  const item = items.find((it) => it.id === itemId);

  const itemMovements = useMemo(
    () =>
      movements.filter(
        (m) => m.item_id === itemId || (!m.item_id && m.item_name && item?.name && m.item_name === item.name)
      ),
    [movements, itemId, item?.name]
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
        description="Movement history, batch list, and FEFO suggestion/consume for this SKU."
      />
      <div className="mb-4 space-y-1 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">No photo</p>
        <p className="text-sm text-slate-600">
          Unit <span className="font-medium text-slate-900">{item.unit}</span>
          {item.category ? (
            <>
              {' '}
              · Category <span className="font-medium text-slate-900">{item.category}</span>
            </>
          ) : null}
        </p>
      </div>
      <StoreStatGrid>
        <StoreStatCard label="Current Quantity" value={`${item.current_quantity} ${item.unit}`} />
        <StoreStatCard label="Min Quantity" value={`${item.min_quantity} ${item.unit}`} />
        <StoreStatCard label="Movements" value={itemMovements.length} />
      </StoreStatGrid>

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
            {itemMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                  No movements recorded for this item.
                </TableCell>
              </TableRow>
            ) : (
              itemMovements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>{new Date(movement.occurred_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{movement.movement_type}</Badge>
                  </TableCell>
                  <TableCell>{movement.quantity}</TableCell>
                  <TableCell className={movement.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}>{movement.delta}</TableCell>
                  <TableCell>{movement.note || '-'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreOperatorItemDetailPage;
