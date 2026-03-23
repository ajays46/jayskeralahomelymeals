import React from 'react';
import { useKitchenPlansMock } from '../../hooks/adminHook/kitchenStoreHook';

const StoreManagerPlanApprovalPage = () => {
  const { plans, approvePlan } = useKitchenPlansMock();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white border rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Plan Approval</h1>
        <p className="text-gray-600 mt-2">
          Review generated kitchen plans and approve them for issue.
        </p>

        {plans.map((plan) => (
          <div key={plan.id} className="mt-6 border rounded-md p-4 bg-gray-50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm text-gray-500">Plan ID</p>
                <p className="font-semibold text-gray-900">{plan.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-semibold text-gray-900">{plan.plan_date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-semibold text-gray-900">{plan.status}</p>
              </div>
            </div>

            <table className="w-full mt-4 text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2">Item</th>
                  <th className="py-2">Required</th>
                  <th className="py-2">Planned Issue</th>
                </tr>
              </thead>
              <tbody>
                {plan.lines.map((line) => (
                  <tr key={line.item} className="border-b last:border-0">
                    <td className="py-2 text-gray-900">{line.item}</td>
                    <td className="py-2 text-gray-700">
                      {line.required_quantity} {line.unit}
                    </td>
                    <td className="py-2 text-gray-700">
                      {line.planned_issue_quantity} {line.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4">
              <button
                type="button"
                disabled={plan.status !== 'DRAFT'}
                onClick={() => approvePlan(plan.id)}
                className="px-4 py-2 rounded-md text-white bg-blue-600 disabled:bg-gray-400"
              >
                {plan.status === 'DRAFT' ? 'Approve Plan' : 'Already Approved'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoreManagerPlanApprovalPage;
