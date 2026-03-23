import React from 'react';
import { useKitchenPurchaseSuggestionsMock } from '../../hooks/adminHook/kitchenStoreHook';

const StoreManagerPurchaseSuggestionsPage = () => {
  const { suggestions } = useKitchenPurchaseSuggestionsMock();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-lg border p-6">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Suggestions</h1>
        <p className="text-gray-600 mt-2">Table source: `inventory_purchase_recommendations`</p>

        <table className="w-full mt-4 text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Date</th>
              <th className="py-2">Item</th>
              <th className="py-2">Forecast Qty</th>
              <th className="py-2">Current Qty</th>
              <th className="py-2">Safety Buffer</th>
              <th className="py-2">Recommended Buy</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((row, idx) => (
              <tr key={`${row.item}-${idx}`} className="border-b last:border-0">
                <td className="py-2">{row.forecast_date}</td>
                <td className="py-2">{row.item}</td>
                <td className="py-2">{row.forecast_quantity}</td>
                <td className="py-2">{row.current_quantity}</td>
                <td className="py-2">{row.safety_buffer}</td>
                <td className="py-2 font-semibold">{row.recommended_purchase_quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreManagerPurchaseSuggestionsPage;

