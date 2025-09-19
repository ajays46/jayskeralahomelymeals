import React, { memo } from 'react';
import { MdReceipt } from 'react-icons/md';

const ResultsSummary = memo(({ 
  sortBy, 
  sortedCustomers, 
  filteredCustomers, 
  sellerUsers, 
  filters 
}) => {
  const getSummaryText = () => {
    if (sortBy === 'hasDraft') {
      return (
        <>
          Showing <span className="font-semibold">{sortedCustomers.length}</span> customers with draft orders
        </>
      );
    } else if (sortBy === 'pendingPayments') {
      return (
        <>
          Showing <span className="font-semibold">{sortedCustomers.length}</span> customers with pending payment receipts
        </>
      );
    } else if (filters.pendingPayments) {
      return (
        <>
          Showing <span className="font-semibold">{filteredCustomers.length}</span> customers with pending payment receipts
        </>
      );
    } else {
      return (
        <>
          Showing <span className="font-semibold">{filteredCustomers.length}</span> of{' '}
          <span className="font-semibold">{sellerUsers.length}</span> customers
        </>
      );
    }
  };

  const getEmptyStateMessage = () => {
    if (sortBy === 'hasDraft' && sortedCustomers.length === 0) {
      return (
        <p className="text-sm text-orange-600 font-medium">
          No customers with draft orders found
        </p>
      );
    } else if (sortBy === 'pendingPayments' && sortedCustomers.length === 0) {
      return (
        <p className="text-sm text-orange-600 font-medium flex items-center gap-2">
          <MdReceipt className="w-4 h-4" />
          No customers with pending payment receipts found
        </p>
      );
    } else if (filters.pendingPayments && filteredCustomers.length === 0) {
      return (
        <p className="text-sm text-orange-600 font-medium flex items-center gap-2">
          <MdReceipt className="w-4 h-4" />
          No customers with pending payment receipts found
        </p>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 mb-4">
      <div className="flex flex-col gap-2 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4">
          <p className="text-xs sm:text-sm text-gray-600">
            {getSummaryText()}
          </p>
        </div>
        <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
          {getEmptyStateMessage()}
        </div>
      </div>
    </div>
  );
});

ResultsSummary.displayName = 'ResultsSummary';

export default ResultsSummary;
