import React, { useState } from 'react';
import { useCompanyBasePath } from '../../context/TenantContext';
import { Link } from 'react-router-dom';
import { useKitchenInventoryMock } from '../../hooks/adminHook/kitchenStoreHook';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StoreNotice, StorePageHeader, StorePageShell, StoreSection, StoreStatCard, StoreStatGrid } from '@/components/store/StorePageShell';

const StoreOperatorInventoryPage = () => {
  const basePath = useCompanyBasePath();
  const { items, lowStockItems, addStock, movements } = useKitchenInventoryMock();
  const [stockInputs, setStockInputs] = useState({});
  const [status, setStatus] = useState('');

  const updateStockInput = (itemId, patch) => {
    setStockInputs((prev) => ({
      ...prev,
      [itemId]: {
        quantity: prev[itemId]?.quantity || '',
        ...patch
      }
    }));
  };

  const onAddStock = async (item) => {
    const rowState = stockInputs[item.id] || {};
    const convertedQuantity = Number(rowState.quantity);

    if (!Number.isFinite(convertedQuantity) || convertedQuantity <= 0) {
      setStatus('Enter a valid quantity before adding stock.');
      return;
    }

    const note = `Manual stock add: ${rowState.quantity}`;
    await addStock(item.id, convertedQuantity, note);
    setStatus(`Added ${rowState.quantity} to ${item.name}.`);
    setStockInputs((prev) => ({
      ...prev,
      [item.id]: {
        quantity: ''
      }
    }));
  };

  return (
    <StorePageShell>
      <StorePageHeader
        title="Store Operator Inventory"
        description="View stock, perform quick stock additions, and navigate to store actions."
        actions={[
          <Button key="request" asChild><Link to={`${basePath}/store-operator/purchase-requests`}>Create Purchase Request</Link></Button>,
          <Button key="approved" asChild variant="secondary"><Link to={`${basePath}/store-operator/approved-requests`}>Approved Requests</Link></Button>,
          <Button key="receipts" asChild variant="outline"><Link to={`${basePath}/store-operator/purchases`}>Purchase Receipts</Link></Button>,
          <Button key="issue" asChild variant="outline"><Link to={`${basePath}/store-operator/issue`}>Issue Items</Link></Button>,
          <Button key="adjustments" asChild variant="outline"><Link to={`${basePath}/store-operator/adjustments`}>Stock Adjustments</Link></Button>,
        ]}
      />
      <StoreStatGrid>
        <StoreStatCard label="Items" value={items.length} />
        <StoreStatCard label="Low Stock Alerts" value={lowStockItems.length} />
        <StoreStatCard label="Recent Movements" value={movements.slice(0, 8).length} />
      </StoreStatGrid>
      {status ? <StoreNotice tone="sky">{status}</StoreNotice> : null}
      <StoreSection title="Current Stock">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-center">Current Qty</TableHead>
              <TableHead className="text-center">Min Qty</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-[220px]">Add Stock</TableHead>
              <TableHead className="text-right">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const isLow = Number(item.current_quantity) <= Number(item.min_quantity);
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell className="text-center font-medium">{item.current_quantity}</TableCell>
                  <TableCell className="text-center">{item.min_quantity}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={isLow ? 'warning' : 'secondary'}>{isLow ? 'Low' : 'OK'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 shadow-sm">
                      <input
                        className="h-9 w-24 rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                        type="number"
                        min="0"
                        step="0.01"
                        value={stockInputs[item.id]?.quantity || ''}
                        onChange={(e) => updateStockInput(item.id, { quantity: e.target.value })}
                        placeholder="Qty"
                      />
                      <Button type="button" size="sm" variant="success" className="min-w-16" onClick={() => onAddStock(item)}>
                        Add
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`${basePath}/store-operator/item/${item.id}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </StoreSection>
      <StoreSection title="Low Stock Alerts">
        {lowStockItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">No low stock alerts.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Min</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.current_quantity} {item.unit}</TableCell>
                  <TableCell>{item.min_quantity} {item.unit}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </StoreSection>
      <StoreSection title="Recent Stock Movement Log">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Delta</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.slice(0, 8).map((row) => (
              <TableRow key={row.id}>
                <TableCell><Badge variant="outline">{row.movement_type}</Badge></TableCell>
                <TableCell className="font-medium">{row.item_name}</TableCell>
                <TableCell>{row.quantity}</TableCell>
                <TableCell className={row.delta >= 0 ? 'text-emerald-600' : 'text-red-600'}>{row.delta}</TableCell>
                <TableCell>{row.note || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreOperatorInventoryPage;
