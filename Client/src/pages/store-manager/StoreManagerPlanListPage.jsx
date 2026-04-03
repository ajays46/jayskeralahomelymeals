import React from 'react';
import { useKitchenPlansMock } from '../../hooks/adminHook/kitchenStoreHook';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';

/** @feature kitchen-store — STORE_MANAGER: list generated kitchen plans. */
const StoreManagerPlanListPage = () => {
  const { plans } = useKitchenPlansMock();

  return (
    <StorePageShell>
      <StorePageHeader
        title="Kitchen Plan List"
        description="Generated plans available for approval and issue."
      />
      <StoreSection title="Plans">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Meal Slot</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Lines</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.id}</TableCell>
                <TableCell>{plan.plan_date || '-'}</TableCell>
                <TableCell>{plan.meal_slot || '-'}</TableCell>
                <TableCell>
                  <Badge variant={plan.status === 'APPROVED' ? 'success' : 'secondary'}>{plan.status}</Badge>
                </TableCell>
                <TableCell>{plan.lines.length}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerPlanListPage;

