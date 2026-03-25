import React from 'react';
import { useKitchenReportsMock } from '../../hooks/adminHook/kitchenStoreHook';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StorePageHeader, StorePageShell, StoreSection, StoreStatCard, StoreStatGrid } from '@/components/store/StorePageShell';

const StoreManagerReportsPage = () => {
  const { orderSummary, consumptionSummary, purchaseVsUsage, totalRevenue } = useKitchenReportsMock();

  return (
    <StorePageShell>
      <StorePageHeader
        title="Store Manager Reports"
        description="Ingredient consumption and stock usage based on kitchen movements."
      />
      <StoreStatGrid>
        <StoreStatCard label="Total Revenue" value={totalRevenue ? `INR ${totalRevenue}` : 'N/A'} />
        <StoreStatCard
          label="Total Orders"
          value={orderSummary.length === 0 ? 'N/A' : orderSummary.reduce((sum, row) => sum + row.orders, 0)}
        />
        <StoreStatCard label="Items Used" value={consumptionSummary.length} />
      </StoreStatGrid>
      <StoreSection title="Session-wise Orders and Revenue">
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
                <TableCell colSpan={3} className="text-muted-foreground">No order/revenue data available yet.</TableCell>
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
      </StoreSection>
      <StoreSection title="Consumption Summary">
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
                <TableCell>{row.used} {row.unit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StoreSection>
      <StoreSection title="Purchase vs Usage">
        <Table>
          <TableHeader>
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
                <TableCell>{row.purchased} {row.unit}</TableCell>
                <TableCell>{row.used} {row.unit}</TableCell>
                <TableCell>{row.remaining} {row.unit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerReportsPage;
