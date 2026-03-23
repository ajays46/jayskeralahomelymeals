import React from 'react';
import { useKitchenForecastMock } from '../../hooks/adminHook/kitchenStoreHook';

const StoreManagerForecastDashboardPage = () => {
  const { pipelineRuns, demandForecasts, financialForecasts } = useKitchenForecastMock();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Forecast Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Sources: `inventory_demand_forecasts`, `financial_forecasts`, `kitchen_pipeline_runs`
        </p>

        <div className="bg-white border rounded-lg p-5 mt-4">
          <h2 className="font-semibold text-gray-900">Pipeline Runs</h2>
          <ul className="mt-2 text-sm text-gray-700 space-y-1">
            {pipelineRuns.map((run) => (
              <li key={run.id}>
                {run.pipeline_name} - {run.status} ({run.processed_rows} rows)
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border rounded-lg p-5 mt-4">
          <h2 className="font-semibold text-gray-900">Demand Forecast</h2>
          <table className="w-full mt-3 text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Date</th>
                <th className="py-2">Meal Slot</th>
                <th className="py-2">Item</th>
                <th className="py-2">Forecast Qty</th>
              </tr>
            </thead>
            <tbody>
              {demandForecasts.map((row, idx) => (
                <tr key={`${row.item}-${idx}`} className="border-b last:border-0">
                  <td className="py-2">{row.forecast_date}</td>
                  <td className="py-2">{row.meal_slot}</td>
                  <td className="py-2">{row.item}</td>
                  <td className="py-2">{row.forecast_quantity} {row.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border rounded-lg p-5 mt-4">
          <h2 className="font-semibold text-gray-900">Financial Forecast</h2>
          <table className="w-full mt-3 text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Date</th>
                <th className="py-2">Revenue</th>
                <th className="py-2">Ingredient Cost</th>
                <th className="py-2">Gross Margin</th>
              </tr>
            </thead>
            <tbody>
              {financialForecasts.map((row) => (
                <tr key={row.forecast_date} className="border-b last:border-0">
                  <td className="py-2">{row.forecast_date}</td>
                  <td className="py-2">INR {row.forecast_revenue}</td>
                  <td className="py-2">INR {row.forecast_ingredient_cost}</td>
                  <td className="py-2">INR {row.forecast_gross_margin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StoreManagerForecastDashboardPage;

