import React from 'react';
import { useKitchenPlansMock } from '../../hooks/adminHook/kitchenStoreHook';

const StoreManagerPlanListPage = () => {
  const { plans } = useKitchenPlansMock();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-lg border p-6">
        <h1 className="text-2xl font-bold text-gray-900">Kitchen Plan List</h1>
        <p className="text-gray-600 mt-2">Table source: `kitchen_daily_plans`</p>

        <table className="w-full mt-4 text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Plan ID</th>
              <th className="py-2">Date</th>
              <th className="py-2">Meal Slot</th>
              <th className="py-2">Status</th>
              <th className="py-2">Lines</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-2">{p.id}</td>
                <td className="py-2">{p.plan_date}</td>
                <td className="py-2">{p.meal_slot}</td>
                <td className="py-2">{p.status}</td>
                <td className="py-2">{p.lines.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StoreManagerPlanListPage;

