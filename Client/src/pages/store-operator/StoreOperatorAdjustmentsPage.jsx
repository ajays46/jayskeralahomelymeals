import React from 'react';
import { useState } from 'react';
import { useKitchenInventoryMock } from '../../hooks/adminHook/kitchenStoreHook';

const StoreOperatorAdjustmentsPage = () => {
  const { items, removeStock, expireStock } = useKitchenInventoryMock();
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || '');
  const [quantity, setQuantity] = useState('1');
  const [movementType, setMovementType] = useState('REMOVE');
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    if (movementType === 'EXPIRE') expireStock(selectedItemId, Number(quantity), note);
    else removeStock(selectedItemId, Number(quantity), note);
    setDone(true);
    setNote('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white border rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Stock Adjustments</h1>
        <p className="text-gray-600 mt-2">
          Record wastage, damage, and manual corrections as adjustments.
        </p>

        <form onSubmit={onSubmit} className="mt-6 border rounded-md p-4 bg-gray-50 space-y-3">
          <div>
            <label className="text-sm text-gray-600">Item</label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="mt-1 w-full border rounded-md px-3 py-2"
            >
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Movement Type</label>
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              className="mt-1 w-full border rounded-md px-3 py-2"
            >
              <option value="REMOVE">REMOVE (Wastage/Damage)</option>
              <option value="EXPIRE">EXPIRE</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Quantity</label>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1 w-full border rounded-md px-3 py-2"
              placeholder="1.5"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Note</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full border rounded-md px-3 py-2"
              placeholder="Wastage / damage reason"
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded-md text-white bg-blue-600">
            Save Adjustment
          </button>
        </form>

        {done && (
          <div className="mt-4 border border-emerald-300 rounded-md p-3 bg-emerald-50 text-sm text-emerald-800">
            {movementType} movement recorded in UI mock. Backend save will be connected to `inventory_stock_movements`.
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreOperatorAdjustmentsPage;
