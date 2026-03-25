import React from 'react';
import { Link } from 'react-router-dom';
import { useCompanyBasePath } from '../../context/TenantContext';
import { useKitchenInventoryMock } from '../../hooks/adminHook/kitchenStoreHook';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StorePageHeader, StorePageShell, StoreSection, StoreStatCard, StoreStatGrid } from '@/components/store/StorePageShell';

const StoreManagerInventoryViewPage = () => {
  const basePath = useCompanyBasePath();
  const { items, lowStockItems } = useKitchenInventoryMock();

  return (
    <StorePageShell>
      <StorePageHeader
        title="Inventory View"
        description="Current inventory levels and quick navigation to item movement detail."
      />
      <StoreStatGrid>
        <StoreStatCard label="Inventory Items" value={items.length} />
        <StoreStatCard label="Low Stock Items" value={lowStockItems.length} />
        <StoreStatCard label="Units Tracked" value={new Set(items.map((item) => item.unit)).size} />
      </StoreStatGrid>
      <StoreSection title="Inventory Table" description="Live inventory item list.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Current</TableHead>
              <TableHead>Min</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const isLow = Number(item.current_quantity) <= Number(item.min_quantity);
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category || '-'}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{item.current_quantity}</TableCell>
                  <TableCell>{item.min_quantity}</TableCell>
                  <TableCell>
                    <Badge variant={isLow ? 'warning' : 'secondary'}>
                      {isLow ? 'Low stock' : 'Healthy'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`${basePath}/store-operator/item/${item.id}`}>View Timeline</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerInventoryViewPage;

