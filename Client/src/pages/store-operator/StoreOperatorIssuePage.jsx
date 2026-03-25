import React from 'react';
import { useKitchenIssueMock } from '../../hooks/adminHook/kitchenStoreHook';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';

const StoreOperatorIssuePage = () => {
  const { plans, issuePlan } = useKitchenIssueMock();
  const approvedPlans = plans.filter((plan) => plan.status === 'APPROVED');

  return (
    <StorePageShell>
      <StorePageHeader
        title="Issue Items to Kitchen"
        description="Only approved plans can be issued to the kitchen."
      />
      {approvedPlans.length === 0 ? (
        <StoreSection title="Approved Plans">
          <p className="text-sm text-muted-foreground">No approved plans available to issue.</p>
        </StoreSection>
      ) : (
        approvedPlans.map((plan) => (
          <StoreSection
            key={plan.id}
            title={`${plan.id} - ${plan.plan_date}`}
            description={`Meal slot: ${plan.meal_slot || 'ALL'}`}
            headerActions={
              <div className="flex items-center gap-2">
                <Badge variant="success">{plan.status}</Badge>
                <Button type="button" onClick={() => issuePlan(plan.id)}>Issue Plan</Button>
              </div>
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Planned Issue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plan.lines.map((line) => (
                  <TableRow key={line.item}>
                    <TableCell className="font-medium">{line.item}</TableCell>
                    <TableCell>{line.planned_issue_quantity} {line.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </StoreSection>
        ))
      )}
    </StorePageShell>
  );
};

export default StoreOperatorIssuePage;
