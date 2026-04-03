import React from 'react';
import { useKitchenPlansMock } from '../../hooks/adminHook/kitchenStoreHook';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';

/** @feature kitchen-store — STORE_MANAGER: approve draft kitchen plans. */
const StoreManagerPlanApprovalPage = () => {
  const { plans, approvePlan } = useKitchenPlansMock();

  return (
    <StorePageShell>
      <StorePageHeader
        title="Plan Approval"
        description="Review generated kitchen plans and approve them for issue."
      />
      {plans.map((plan) => (
        <StoreSection
          key={plan.id}
          title={plan.id}
          description={`Date: ${plan.plan_date || '-'} | Meal slot: ${plan.meal_slot || 'ALL'}`}
          headerActions={
            <div className="flex items-center gap-2">
              <Badge variant={plan.status === 'DRAFT' ? 'secondary' : 'success'}>{plan.status}</Badge>
              <Button
                type="button"
                disabled={plan.status !== 'DRAFT'}
                onClick={() => approvePlan(plan.id)}
              >
                {plan.status === 'DRAFT' ? 'Approve Plan' : 'Already Approved'}
              </Button>
            </div>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Required</TableHead>
                <TableHead>Planned Issue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plan.lines.map((line) => (
                <TableRow key={line.item}>
                  <TableCell className="font-medium">{line.item}</TableCell>
                  <TableCell>{line.required_quantity} {line.unit}</TableCell>
                  <TableCell>{line.planned_issue_quantity} {line.unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </StoreSection>
      ))}
    </StorePageShell>
  );
};

export default StoreManagerPlanApprovalPage;
