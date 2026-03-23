import React from 'react';
import { useParams } from 'react-router-dom';
import { useKitchenInventoryMock } from '../../hooks/adminHook/kitchenStoreHook';

const StoreOperatorItemDetailPage = () => {
  const { itemId } = useParams();
  const { items, movements } = useKitchenInventoryMock();
  const item = items.find((it) => it.id === itemId);
  const itemMovements = movements.filter((m) => m.item_id === itemId);

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white border rounded-lg p-6">Item not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white border rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Item Detail: {item.name}</h1>
        <p className="text-gray-600 mt-2">
          Sources: `inventory_items`, `inventory_stock_movements`
        </p>

        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div><span className="text-gray-500">Current Quantity:</span> {item.current_quantity} {item.unit}</div>
          <div><span className="text-gray-500">Min Quantity:</span> {item.min_quantity} {item.unit}</div>
        </div>

        <h2 className="font-semibold text-gray-900 mt-6">Movement Timeline</h2>
        <table className="w-full mt-2 text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Time</th>
              <th className="py-2">Type</th>
              <th className="py-2">Quantity</th>
              <th className="py-2">Delta</th>
              <th className="py-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {itemMovements.map((m) => (
              <tr key={m.id} className="border-b last:border-0">
                <td className="py-2">{new Date(m.occurred_at).toLocaleString()}</td>
                <td className="py-2">{m.movement_type}</td>
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

export default StoreOperatorItemDetailPage;

