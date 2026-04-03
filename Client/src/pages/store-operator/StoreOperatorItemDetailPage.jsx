import React from 'react';
import { useParams } from 'react-router-dom';
import { useKitchenInventoryMock } from '../../hooks/adminHook/kitchenStoreHook';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StorePageHeader, StorePageShell, StoreSection, StoreStatCard, StoreStatGrid } from '@/components/store/StorePageShell';

/** @feature kitchen-store — STORE_OPERATOR: single item detail and movement history. */
const StoreOperatorItemDetailPage = () => {
  const { itemId } = useParams();
  const { items, movements } = useKitchenInventoryMock();
  const item = items.find((it) => it.id === itemId);
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

