import React, { useEffect, useState } from 'react';
import { useKitchenInventoryMock, useKitchenRecipeMock } from '../../hooks/adminHook/kitchenStoreHook';
import api from '../../api/axios';

const StoreManagerRecipeBomPage = () => {
  const { items } = useKitchenInventoryMock();
  const { recipeLines, addRecipeLine, deleteRecipeLine } = useKitchenRecipeMock();
  const [menuItems, setMenuItems] = useState([]);
  const [menuItemId, setMenuItemId] = useState('');
  const [itemId, setItemId] = useState(items[0]?.id || '');
  const [qty, setQty] = useState('0.1');
  const [unit, setUnit] = useState(items[0]?.unit || 'kg');

  useEffect(() => {
    if (items.length === 0) return;
    if (!itemId) setItemId(items[0]?.id || '');
    if (!unit) setUnit(items[0]?.unit || 'kg');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    let mounted = true;
    api
      .get('/admin/menu-item-list')
      .then((res) => {
        if (!mounted) return;
        const list = res.data?.data || [];
        setMenuItems(list);
        if (!menuItemId && list[0]?.id) setMenuItemId(list[0].id);
      })
      .catch(() => {
        // keep empty menu list; form will show disabled state
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAdd = (e) => {
    e.preventDefault();
    const item = items.find((x) => x.id === itemId);
    if (!item) return;
    const menuItem = menuItems.find((m) => m.id === menuItemId);
    if (!menuItem) return;
    addRecipeLine({
      menu_item_id: menuItem.id,
      menu_item_name: menuItem.name || '',
      inventory_item_id: item.id,
      inventory_item_name: item.name,
      quantity_per_unit: Number(qty),
      unit
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-lg border p-6">
        <h1 className="text-2xl font-bold text-gray-900">Recipe / BOM</h1>
        <p className="text-gray-600 mt-2">Table source: `kitchen_recipe_lines`</p>

        <form onSubmit={onAdd} className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4">
          <select
            className="border rounded px-3 py-2"
            value={menuItemId}
            onChange={(e) => setMenuItemId(e.target.value)}
            disabled={menuItems.length === 0}
          >
            {menuItems.length === 0 ? <option value="">Loading menu items...</option> : null}
            {menuItems.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select className="border rounded px-3 py-2" value={itemId} onChange={(e) => setItemId(e.target.value)}>
            {items.map((it) => <option key={it.id} value={it.id}>{it.name}</option>)}
          </select>
          <input className="border rounded px-3 py-2" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qty per unit" />
          <input className="border rounded px-3 py-2" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit" />
          <button className="bg-blue-600 text-white rounded px-3 py-2" type="submit">Add Line</button>
        </form>

        <table className="w-full mt-4 text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Menu</th>
              <th className="py-2">Item</th>
              <th className="py-2">Qty / Unit</th>
              <th className="py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {recipeLines.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="py-2">{row.menu_item_name}</td>
                <td className="py-2">{row.inventory_item_name}</td>
                <td className="py-2">{row.quantity_per_unit} {row.unit}</td>
                <td className="py-2">
                  <button className="text-red-600 underline" type="button" onClick={() => deleteRecipeLine(row.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreManagerRecipeBomPage;

