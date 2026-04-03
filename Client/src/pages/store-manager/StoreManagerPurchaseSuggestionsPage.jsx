import React from 'react';
import { useKitchenPurchaseSuggestionsMock } from '../../hooks/adminHook/kitchenStoreHook';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StorePageHeader, StorePageShell, StoreSection } from '@/components/store/StorePageShell';

/** @feature kitchen-store — STORE_MANAGER: purchase recommendations from forecasts. */
const StoreManagerPurchaseSuggestionsPage = () => {
  const { suggestions } = useKitchenPurchaseSuggestionsMock();

  return (
    <StorePageShell>
      <StorePageHeader
        title="Purchase Suggestions"
        description="Forecast-based buying recommendations for kitchen inventory."
      />
      <StoreSection title="Recommendations">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Forecast Qty</TableHead>
              <TableHead>Current Qty</TableHead>
              <TableHead>Safety Buffer</TableHead>
              <TableHead>Recommended Buy</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suggestions.map((row, idx) => (
              <TableRow key={`${row.item}-${idx}`}>
                <TableCell>{row.forecast_date || '-'}</TableCell>
                <TableCell className="font-medium">{row.item}</TableCell>
                <TableCell>{row.forecast_quantity}</TableCell>
                <TableCell>{row.current_quantity}</TableCell>
                <TableCell>{row.safety_buffer}</TableCell>
                <TableCell className="font-semibold">{row.recommended_purchase_quantity}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StoreSection>
    </StorePageShell>
  );
};

export default StoreManagerPurchaseSuggestionsPage;

