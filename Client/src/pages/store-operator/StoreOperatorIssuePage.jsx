import React from 'react';
import { useKitchenIssueMock } from '../../hooks/adminHook/kitchenStoreHook';

const StoreOperatorIssuePage = () => {
  const { plans, issuePlan } = useKitchenIssueMock();
  const approvedPlans = plans.filter((plan) => plan.status === 'APPROVED');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white border rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Issue Items to Kitchen</h1>
        <p className="text-gray-600 mt-2">
          Issue is allowed only for APPROVED plans.
        </p>

        {approvedPlans.length === 0 ? (
          <div className="mt-6 border rounded-md p-4 bg-gray-50 text-sm text-gray-600">
            No APPROVED plans available to issue.
          </div>
        ) : (
          approvedPlans.map((plan) => (
            <div key={plan.id} className="mt-6 border rounded-md p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Plan</p>
                  <p className="font-semibold text-gray-900">
                    {plan.id} - {plan.plan_date}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => issuePlan(plan.id)}
                  className="px-4 py-2 rounded-md text-white bg-blue-600"
                >
                  Issue Plan
                </button>
              </div>

              <table className="w-full mt-4 text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2">Item</th>
                    <th className="py-2">Planned Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.lines.map((line) => (
                    <tr key={line.item} className="border-b last:border-0">
                      <td className="py-2">{line.item}</td>
                      <td className="py-2">
                        {line.planned_issue_quantity} {line.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StoreOperatorIssuePage;
