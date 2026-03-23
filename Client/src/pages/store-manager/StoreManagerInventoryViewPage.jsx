import React from 'react';
import { Link } from 'react-router-dom';
import { useCompanyBasePath } from '../../context/TenantContext';
import { useKitchenInventoryMock } from '../../hooks/adminHook/kitchenStoreHook';

const StoreManagerInventoryViewPage = () => {
  const basePath = useCompanyBasePath();
  const { items, lowStockItems } = useKitchenInventoryMock();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-lg border p-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory View</h1>
        <p className="text-gray-600 mt-2">Table source: `inventory_items`</p>

        <table className="w-full mt-4 text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Name</th>
              <th className="py-2">Category</th>
              <th className="py-2">Unit</th>
              <th className="py-2">Current</th>
              <th className="py-2">Min</th>
              <th className="py-2">Detail</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="py-2">{item.name}</td>
                <td className="py-2">{item.category}</td>
                <td className="py-2">{item.unit}</td>
                <td className="py-2">{item.current_quantity}</td>
                <td className="py-2">{item.min_quantity}</td>
                <td className="py-2">
                  <Link className="text-blue-600 underline" to={`${basePath}/store-operator/item/${item.id}`}>
                    View timeline
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 text-sm text-gray-700">
          Low stock count: <span className="font-semibold">{lowStockItems.length}</span>
        </div>
      </div>
    </div>
  );
};

export default StoreManagerInventoryViewPage;

