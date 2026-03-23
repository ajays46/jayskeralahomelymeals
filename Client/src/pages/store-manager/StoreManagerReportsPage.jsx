import React from 'react';
import { useKitchenReportsMock } from '../../hooks/adminHook/kitchenStoreHook';

const StoreManagerReportsPage = () => {
  const { orderSummary, consumptionSummary, purchaseVsUsage, totalRevenue } = useKitchenReportsMock();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Store Manager Reports</h1>
        <p className="text-gray-600 mt-2">
          Ingredient consumption and stock usage based on kitchen movements.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white border rounded-lg p-5">
            <h2 className="text-lg font-semibold text-gray-900">Total Revenue</h2>
            <p className="text-xl font-bold text-gray-900 mt-2">{totalRevenue ? `INR ${totalRevenue}` : 'N/A'}</p>
          </div>
          <div className="bg-white border rounded-lg p-5">
            <h2 className="text-lg font-semibold text-gray-900">Total Orders</h2>
            <p className="text-xl font-bold text-gray-900 mt-2">
              {orderSummary.length === 0 ? 'N/A' : orderSummary.reduce((sum, row) => sum + row.orders, 0)}
            </p>
          </div>
          <div className="bg-white border rounded-lg p-5">
            <h2 className="text-lg font-semibold text-gray-900">Total Items Used</h2>
            <p className="text-xl font-bold text-gray-900 mt-2">{consumptionSummary.length}</p>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-5 mt-4">
          <h2 className="text-lg font-semibold text-gray-900">Session-wise Orders and Revenue</h2>
          <table className="w-full mt-3 text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Session</th>
                <th className="py-2">Orders</th>
                <th className="py-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {orderSummary.length === 0 ? (
                <tr>
                  <td className="py-2 text-sm text-gray-500" colSpan={3}>No order/revenue data available yet.</td>
                </tr>
              ) : (
                orderSummary.map((row) => (
                  <tr key={row.session} className="border-b last:border-0">
                    <td className="py-2">{row.session}</td>
                    <td className="py-2">{row.orders}</td>
                    <td className="py-2">INR {row.revenue}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-white border rounded-lg p-5 mt-4">
          <h2 className="text-lg font-semibold text-gray-900">Consumption Summary</h2>
          <table className="w-full mt-3 text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Item</th>
                <th className="py-2">Used</th>
              </tr>
            </thead>
            <tbody>
              {consumptionSummary.map((row) => (
                <tr key={row.item} className="border-b last:border-0">
                  <td className="py-2">{row.item}</td>
                  <td className="py-2">
                    {row.used} {row.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border rounded-lg p-5 mt-4">
          <h2 className="text-lg font-semibold text-gray-900">Purchase vs Usage</h2>
          <table className="w-full mt-3 text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Item</th>
                <th className="py-2">Purchased</th>
                <th className="py-2">Used</th>
                <th className="py-2">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {purchaseVsUsage.map((row) => (
                <tr key={row.item} className="border-b last:border-0">
                  <td className="py-2">{row.item}</td>
                  <td className="py-2">
                    {row.purchased} {row.unit}
                  </td>
                  <td className="py-2">
                    {row.used} {row.unit}
                  </td>
                  <td className="py-2">
                    {row.remaining} {row.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StoreManagerReportsPage;
