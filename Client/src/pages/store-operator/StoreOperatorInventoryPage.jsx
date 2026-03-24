import React from 'react';
import { useCompanyBasePath } from '../../context/TenantContext';
import { Link } from 'react-router-dom';
import { useKitchenInventoryMock } from '../../hooks/adminHook/kitchenStoreHook';

const StoreOperatorInventoryPage = () => {
  const basePath = useCompanyBasePath();
  const { items, lowStockItems, addStock, movements } = useKitchenInventoryMock();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">Store Operator Inventory</h1>
        <p className="text-gray-600 mt-2">View stock and perform movement actions.</p>

        <div className="mt-6 bg-white rounded-lg border p-5">
          <h2 className="text-lg font-semibold text-gray-900">Current Stock</h2>
          <table className="w-full mt-3 text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Item</th>
                <th className="py-2">Unit</th>
                <th className="py-2">Current Qty</th>
                <th className="py-2">Min Qty</th>
                <th className="py-2">Quick Add +10</th>
                <th className="py-2">Detail</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2">{item.name}</td>
                  <td className="py-2">{item.unit}</td>
                  <td className="py-2">{item.current_quantity}</td>
                  <td className="py-2">{item.min_quantity}</td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => addStock(item.id, 10)}
                      className="px-3 py-1 rounded-md bg-blue-600 text-white text-xs"
                    >
                      Add Stock
                    </button>
                  </td>
                  <td className="py-2">
                    <Link className="text-blue-600 underline" to={`${basePath}/store-operator/item/${item.id}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 bg-white rounded-lg border p-5">
          <h2 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
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
          <h2 className="text-lg font-semibold text-gray-900">Stock Movement Log</h2>
          <table className="w-full mt-3 text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Type</th>
                <th className="py-2">Item</th>
                <th className="py-2">Qty</th>
                <th className="py-2">Delta</th>
                <th className="py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {movements.slice(0, 8).map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="py-2">{row.movement_type}</td>
                  <td className="py-2">{row.item_name}</td>
                  <td className="py-2">{row.quantity}</td>
                  <td className={`py-2 ${row.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{row.delta}</td>
                  <td className="py-2">{row.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <Link to={`${basePath}/store-operator/purchases`} className="px-4 py-2 bg-emerald-700 text-white rounded-md">
            Purchase Receipts
          </Link>
          <Link to={`${basePath}/store-operator/issue`} className="px-4 py-2 bg-blue-600 text-white rounded-md">
            Issue Items
          </Link>
          <Link to={`${basePath}/store-operator/adjustments`} className="px-4 py-2 bg-gray-900 text-white rounded-md">
            Stock Adjustments
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StoreOperatorInventoryPage;
