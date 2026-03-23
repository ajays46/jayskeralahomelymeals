import React from 'react';
import { useCompanyBasePath } from '../../context/TenantContext';
import { Link } from 'react-router-dom';
import { useKitchenInventoryMock, useKitchenPlansMock, useKitchenReportsMock } from '../../hooks/adminHook/kitchenStoreHook';

const StoreManagerKitchenDashboard = () => {
  const basePath = useCompanyBasePath();
  const { lowStockItems } = useKitchenInventoryMock();
  const { plans } = useKitchenPlansMock();
  const { totalRevenue, orderSummary } = useKitchenReportsMock();
  const pendingPlans = plans.filter((p) => p.status === 'DRAFT').length;
  const totalOrders = orderSummary.reduce((sum, row) => sum + row.orders, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Store Manager Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Kitchen planning overview for manager approvals, alerts, and daily summaries.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Pending Plans</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{pendingPlans}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Low Stock Alerts</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{lowStockItems.length}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Daily Revenue</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">INR {totalRevenue}</p>
          </div>
        </div>

        <div className="mt-4 bg-white rounded-lg border p-5">
          <h2 className="text-lg font-semibold text-gray-900">Order Snapshot</h2>
          <p className="text-gray-600 mt-2 text-sm">Total orders for day: {totalOrders}</p>
        </div>

        <div className="mt-4 bg-white rounded-lg border p-5">
          <h2 className="text-lg font-semibold text-gray-900">Low Stock Items</h2>
          {lowStockItems.length === 0 ? (
            <p className="text-sm text-gray-500 mt-2">No low stock alerts.</p>
          ) : (
            <ul className="mt-2 text-sm text-gray-700 space-y-1">
              {lowStockItems.map((item) => (
                <li key={item.id}>
                  {item.name}: {item.current_quantity} {item.unit} (min {item.min_quantity})
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 bg-white rounded-lg border p-5">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link to={`${basePath}/store-manager/plan-approval`} className="px-4 py-2 bg-blue-600 text-white rounded-md">
              Plan Approval
            </Link>
            <Link to={`${basePath}/store-manager/plan-list`} className="px-4 py-2 bg-indigo-600 text-white rounded-md">
              Plan List
            </Link>
            <Link to={`${basePath}/store-operator/inventory`} className="px-4 py-2 bg-emerald-600 text-white rounded-md">
              View Inventory
            </Link>
            <Link to={`${basePath}/store-manager/inventory`} className="px-4 py-2 bg-emerald-700 text-white rounded-md">
              Inventory Table
            </Link>
            <Link to={`${basePath}/store-manager/stock-logs`} className="px-4 py-2 bg-orange-600 text-white rounded-md">
              Stock Logs
            </Link>
            <Link to={`${basePath}/store-manager/recipe-bom`} className="px-4 py-2 bg-pink-600 text-white rounded-md">
              Recipe/BOM
            </Link>
            <Link to={`${basePath}/store-manager/reports`} className="px-4 py-2 bg-gray-900 text-white rounded-md">
              Reports
            </Link>
            <Link to={`${basePath}/store-manager/forecast`} className="px-4 py-2 bg-teal-700 text-white rounded-md">
              Forecast Dashboard
            </Link>
            <Link to={`${basePath}/store-manager/purchase-suggestions`} className="px-4 py-2 bg-purple-700 text-white rounded-md">
              Purchase Suggestions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreManagerKitchenDashboard;
