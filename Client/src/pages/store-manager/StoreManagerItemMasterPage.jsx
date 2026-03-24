import React, { useMemo, useState } from 'react';
import { useKitchenInventoryMock } from '../../hooks/adminHook/kitchenStoreHook';

const StoreManagerItemMasterPage = () => {
  const { items, createItem, getItemDetail } = useKitchenInventoryMock();
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('kg');
  const [category, setCategory] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [itemDetail, setItemDetail] = useState(null);
  const [status, setStatus] = useState('');

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      `${it.name} ${it.category} ${it.unit}`.toLowerCase().includes(q)
    );
  }, [items, query]);

  const onCreate = async (e) => {
    e.preventDefault();
    setStatus('');
    const payload = {
      name: name.trim(),
      unit: unit.trim(),
      category: category.trim() || null,
      min_quantity: minQuantity === '' ? null : Number(minQuantity)
    };
    const out = await createItem(payload);
    if (out?.ok) {
      setStatus('Item created successfully.');
      setName('');
      setCategory('');
      setMinQuantity('');
    } else {
      setStatus(out?.message || 'Failed to create item.');
    }
  };

  const onLoadDetail = async (itemId) => {
    setSelectedId(itemId);
    const detail = await getItemDetail(itemId);
    setItemDetail(detail);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-white rounded-lg border p-6">
          <h1 className="text-2xl font-bold text-gray-900">Item Master</h1>
          <p className="text-gray-600 mt-2">
            Manager APIs: `POST /v1/items`, `GET /v1/items`, `GET /v1/items/{'{item_id}'}`
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900">Create Inventory Item</h2>
          <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4">
            <input className="border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" required />
            <input className="border rounded px-3 py-2" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit (kg, liter...)" required />
            <input className="border rounded px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
            <input className="border rounded px-3 py-2" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} placeholder="Min quantity" />
            <button type="submit" className="bg-blue-600 text-white rounded px-3 py-2">Create</button>
          </form>
          {status ? <p className="text-sm mt-3 text-gray-700">{status}</p> : null}
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Items</h2>
            <input
              className="border rounded px-3 py-2 w-full max-w-xs"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search item/category/unit"
            />
          </div>
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
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2">{item.name}</td>
                  <td className="py-2">{item.category || '-'}</td>
                  <td className="py-2">{item.unit}</td>
                  <td className="py-2">{item.current_quantity}</td>
                  <td className="py-2">{item.min_quantity}</td>
                  <td className="py-2">
                    <button className="text-blue-600 underline" type="button" onClick={() => onLoadDetail(item.id)}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900">Item Detail</h2>
          {!selectedId ? (
            <p className="text-sm text-gray-500 mt-2">Select an item to load detail.</p>
          ) : itemDetail ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm">
              <div><span className="text-gray-500">ID:</span> {itemDetail.id}</div>
              <div><span className="text-gray-500">Name:</span> {itemDetail.name}</div>
              <div><span className="text-gray-500">Category:</span> {itemDetail.category || '-'}</div>
              <div><span className="text-gray-500">Unit:</span> {itemDetail.unit}</div>
              <div><span className="text-gray-500">Current:</span> {itemDetail.current_quantity}</div>
              <div><span className="text-gray-500">Min:</span> {itemDetail.min_quantity}</div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-2">Loading detail...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreManagerItemMasterPage;

