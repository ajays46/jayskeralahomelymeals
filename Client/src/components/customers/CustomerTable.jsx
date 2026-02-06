import React, { memo } from 'react';
import { MdPeople } from 'react-icons/md';
import CustomerCard from './CustomerCard';

const CustomerTable = memo(({ 
  sellerUsersLoading, 
  sellerUsers, 
  sortedCustomers, 
  selectedCustomer, 
  editingUsers, 
  deletingUsers, 
  generatingLinks,
  onEditUser, 
  onDeleteUser, 
  onResumeOrder, 
  onUploadReceipt, 
  onBookOrder, 
  onViewOrders, 
  onGenerateLink,
  formatPrice, 
  formatDate, 
  getDraftForCustomer, 
  getPendingPayment, 
  hasPendingPayments, 
  clearFilters, 
  filters, 
  sortBy, 
  navigate,
  basePath = '/jkhm'
}) => {
  if (sellerUsersLoading) {
    return (
      <div className="p-8 text-center bg-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
        <p className="text-blue-700 font-medium text-lg">Loading customers...</p>
        <p className="text-blue-500 text-sm mt-2">Please wait while we fetch your customer data</p>
      </div>
    );
  }
  
  if (!sellerUsers || sellerUsers.length === 0) {
    return (
      <div className="p-8 text-center">
        <MdPeople className="text-4xl text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No customers found</p>
        <p className="text-sm text-gray-400 mt-2">Start by adding your first customer</p>
        <button
          onClick={() => navigate(`${basePath}/create-user`)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Customer
        </button>
      </div>
    );
  }
  
  if (sortedCustomers.length === 0) {
    return (
      <div className="p-8 text-center">
        <MdPeople className="text-4xl text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No customers found matching your criteria</p>
        {Object.values(filters).some(Boolean) && (
          <button
            onClick={clearFilters}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            Clear filters to see all customers
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Table Header - Desktop Only */}
      <div className="hidden sm:block bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="grid grid-cols-12 gap-4 items-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
          <div className="col-span-3">Customer Details</div>
          <div className="col-span-2">Contact Info</div>
          <div className="col-span-3">Location</div>
          <div className="col-span-2">Orders & Revenue</div>
          <div className="col-span-2">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-100">
        {sortedCustomers.map((customer) => {
          const customerDraft = getDraftForCustomer(customer.id);
          const hasDraft = !!customerDraft;
          const hasPending = hasPendingPayments(customer);
          
          return (
            <CustomerCard
              key={customer.id}
              customer={customer}
              isSelected={selectedCustomer?.id === customer.id}
              hasDraft={hasDraft}
              hasPendingPayments={hasPending}
              onEdit={onEditUser}
              onDelete={onDeleteUser}
              onResumeOrder={onResumeOrder}
              onUploadReceipt={onUploadReceipt}
              onBookOrder={onBookOrder}
              onViewOrders={onViewOrders}
              onGenerateLink={onGenerateLink}
              isEditing={editingUsers.has(customer.id)}
              isDeleting={deletingUsers.has(customer.id)}
              isGeneratingLink={generatingLinks.has(customer.id)}
              formatPrice={formatPrice}
              formatDate={formatDate}
              getDraftForCustomer={getDraftForCustomer}
              getPendingPayment={getPendingPayment}
            />
          );
        })}
      </div>
    </>
  );
});

CustomerTable.displayName = 'CustomerTable';

export default CustomerTable;
