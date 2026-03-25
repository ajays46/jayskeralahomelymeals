import React from 'react';
import { useKitchenInventoryMock } from '../../hooks/adminHook/kitchenStoreHook';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';

const StoreManagerStockLogsPage = () => {
  const { movements } = useKitchenInventoryMock();

  return (
    <StorePageShell>
      <StorePageHeader
        title="Stock Logs"
        description="Inventory movement history across add, remove, usage, and expiry operations."
      />
      <StoreSection title="Movement Log">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Delta</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell>{new Date(movement.occurred_at).toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant="outline">{movement.movement_type}</Badge>
                </TableCell>
                <TableCell className="font-medium">{movement.item_name}</TableCell>
                <TableCell>{movement.quantity}</TableCell>
                <TableCell className={movement.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {movement.delta}
                </TableCell>
                <TableCell>{movement.note || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerStockLogsPage;

