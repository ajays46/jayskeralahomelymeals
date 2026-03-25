import React from 'react';
import { useKitchenForecastMock } from '../../hooks/adminHook/kitchenStoreHook';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StorePageHeader, StorePageShell, StoreSection, StoreStatCard, StoreStatGrid } from '@/components/store/StorePageShell';

const StoreManagerForecastDashboardPage = () => {
  const { pipelineRuns, demandForecasts, financialForecasts } = useKitchenForecastMock();

  return (
    <StorePageShell>
      <StorePageHeader
        title="Forecast Dashboard"
        description="Inventory demand and financial forecasts from the kitchen planning pipeline."
      />
      <StoreStatGrid>
        <StoreStatCard label="Pipeline Runs" value={pipelineRuns.length} />
        <StoreStatCard label="Demand Rows" value={demandForecasts.length} />
        <StoreStatCard label="Financial Rows" value={financialForecasts.length} />
      </StoreStatGrid>
      <StoreSection title="Pipeline Runs">
        <div className="space-y-2 text-sm text-slate-700">
          {pipelineRuns.length === 0 ? (
            <p className="text-muted-foreground">No pipeline runs available.</p>
          ) : (
            pipelineRuns.map((run) => (
              <div key={run.id} className="rounded-md border px-3 py-2">
                {run.pipeline_name} - {run.status} ({run.processed_rows} rows)
              </div>
            ))
          )}
        </div>
      </StoreSection>
      <StoreSection title="Demand Forecast">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Meal Slot</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Forecast Qty</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demandForecasts.map((row, idx) => (
              <TableRow key={`${row.item}-${idx}`}>
                <TableCell>{row.forecast_date}</TableCell>
                <TableCell>{row.meal_slot}</TableCell>
                <TableCell className="font-medium">{row.item}</TableCell>
                <TableCell>{row.forecast_quantity} {row.unit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StoreSection>
      <StoreSection title="Financial Forecast">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Revenue</TableHead>
              <TableHead>Ingredient Cost</TableHead>
              <TableHead>Gross Margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {financialForecasts.map((row) => (
              <TableRow key={row.forecast_date}>
                <TableCell>{row.forecast_date}</TableCell>
                <TableCell>INR {row.forecast_revenue}</TableCell>
                <TableCell>INR {row.forecast_ingredient_cost}</TableCell>
                <TableCell>INR {row.forecast_gross_margin}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerForecastDashboardPage;

