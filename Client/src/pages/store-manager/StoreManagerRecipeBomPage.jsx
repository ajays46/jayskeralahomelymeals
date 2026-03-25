import React, { useEffect, useState } from 'react';
import { useKitchenInventoryMock, useKitchenRecipeMock } from '../../hooks/adminHook/kitchenStoreHook';
import api from '../../api/axios';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';

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
    <StorePageShell>
      <StorePageHeader
        title="Recipe / BOM"
        description="Map menu items to inventory ingredients and quantity-per-unit rules."
      />
      <StoreSection title="Add Recipe Line">
        <form onSubmit={onAdd} className="grid grid-cols-1 md:grid-cols-5 gap-3">
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
          <Button className="md:self-end" type="submit">Add Line</Button>
        </form>
      </StoreSection>
      <StoreSection title="Recipe Lines">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Menu</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Qty / Unit</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipeLines.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.menu_item_name}</TableCell>
                <TableCell>{row.inventory_item_name}</TableCell>
                <TableCell>{row.quantity_per_unit} {row.unit}</TableCell>
                <TableCell className="text-right">
                  <Button variant="link" type="button" onClick={() => deleteRecipeLine(row.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerRecipeBomPage;

