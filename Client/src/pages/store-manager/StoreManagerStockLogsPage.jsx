import React from 'react';
import { useKitchenInventoryMock } from '../../hooks/adminHook/kitchenStoreHook';

const StoreManagerStockLogsPage = () => {
  const { movements } = useKitchenInventoryMock();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-lg border p-6">
        <h1 className="text-2xl font-bold text-gray-900">Stock Logs</h1>
        <p className="text-gray-600 mt-2">Table source: `inventory_stock_movements`</p>

        <table className="w-full mt-4 text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Time</th>
              <th className="py-2">Type</th>
              <th className="py-2">Item</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Delta</th>
              <th className="py-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id} className="border-b last:border-0">
                <td className="py-2">{new Date(m.occurred_at).toLocaleString()}</td>
                <td className="py-2">{m.movement_type}</td>
                <td className="py-2">{m.item_name}</td>
                <td className="py-2">{m.quantity}</td>
                <td className={`py-2 ${m.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{m.delta}</td>
                <td className="py-2">{m.note || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreManagerStockLogsPage;

