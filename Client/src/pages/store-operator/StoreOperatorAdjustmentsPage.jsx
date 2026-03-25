import React from 'react';
import { useState } from 'react';
import { useKitchenInventoryMock } from '../../hooks/adminHook/kitchenStoreHook';
import { Button } from '@/components/ui/button';
import { StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';

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
    <StorePageShell>
      <StorePageHeader
        title="Stock Adjustments"
        description="Record wastage, damage, and manual corrections as stock adjustments."
      />
      <StoreSection title="Adjustment Form">
        <form onSubmit={onSubmit} className="rounded-md border bg-gray-50 p-4 space-y-3">
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
          <Button type="submit">
            Save Adjustment
          </Button>
        </form>

        {done && (
          <div className="mt-4 border border-emerald-300 rounded-md p-3 bg-emerald-50 text-sm text-emerald-800">
            {movementType} movement recorded successfully in `inventory_stock_movements`.
          </div>
        )}
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreOperatorAdjustmentsPage;
