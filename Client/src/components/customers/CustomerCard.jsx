import React, { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MdPhone, 
  MdEmail, 
  MdLocationOn, 
  MdCalendarToday, 
  MdShoppingCart, 
  MdAttachMoney, 
  MdVisibility, 
  MdEdit, 
  MdDelete,
  MdLink,
  MdContentCopy,
  MdClose
} from 'react-icons/md';
import AddressModal from './AddressModal';

const CustomerCard = memo(({ 
  customer, 
  isSelected, 
  hasDraft, 
  hasPendingPayments, 
  onEdit, 
  onDelete, 
  onResumeOrder, 
  onUploadReceipt, 
  onBookOrder, 
  onViewOrders,
  onGenerateLink,
  isEditing, 
  isDeleting, 
  isGeneratingLink,
  formatPrice, 
  formatDate, 
  getDraftForCustomer, 
  getPendingPayment 
}) => {
  const navigate = useNavigate();
  const customerDraft = getDraftForCustomer(customer.id);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState(null);

  const handleResumeOrder = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onResumeOrder(customerDraft);
  };

  const handleEditDates = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onResumeOrder(customerDraft, 'edit');
  };

  const handleUploadReceipt = () => {
    const pendingPayment = getPendingPayment(customer);
    if (pendingPayment) {
      navigate('/jkhm/process-payment', {
        state: {
          paymentId: pendingPayment.id,
          goToReceiptUpload: true,
          customer: customer
        }
      });
    }
  };

  const handleBookOrder = () => {
    navigate('/jkhm/place-order', { 
      state: { 
        selectedUser: customer,
        skipToMenuSelection: true
      } 
    });
  };

  const handleViewOrders = () => {
    navigate('/jkhm/customer-orders', { 
      state: { 
        customer: customer
      } 
    });
  };

  const handleShowAddresses = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAddressModal(true);
  };

  const handleCloseAddressModal = () => {
    setShowAddressModal(false);
  };

  const handleGenerateLink = async () => {
    try {
      const result = await onGenerateLink(customer.id);
      if (result && result.customerPortalUrl) {
        setGeneratedLink(result.customerPortalUrl);
      }
    } catch (error) {
      console.error('Error generating link:', error);
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      // You could add a toast notification here
    }
  };

  const handleCloseLink = () => {
    setGeneratedLink(null);
  };

  return (
    <div
      className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-r-4 border-blue-500' : ''
      } ${hasDraft ? 'bg-orange-50 border-l-4 border-orange-400' : ''}`}
    >
      {/* Mobile Layout */}
      <div className="block sm:hidden">
        <div className="space-y-3">
          {/* Customer Header - Mobile */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {customer.contacts?.[0]?.firstName?.charAt(0) || 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold text-gray-900 truncate">
                {customer.contacts?.[0]?.firstName}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MdPhone className="w-4 h-4 text-blue-600" />
                <span className="truncate">
                  {customer.contacts?.[0]?.phoneNumbers?.[0]?.number || 'No phone'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  ID: {customer.id.slice(-6)}
                </span>
                {hasDraft && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                    Draft Available
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact & Location Info - Mobile */}
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MdEmail className="w-4 h-4 text-gray-500" />
              <span className="truncate">
                {customer.auth?.email || 'No email'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MdCalendarToday className="w-4 h-4 text-gray-500" />
              <span>{formatDate(customer.createdAt)}</span>
            </div>
            {customer.addresses && customer.addresses.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MdLocationOn className="w-4 h-4 text-gray-500 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-700">{customer.addresses[0].city}</div>
                  <div className="text-gray-500 truncate">
                    {customer.addresses[0].street}{customer.addresses[0].pincode && customer.addresses[0].pincode !== 0 ? `, ${customer.addresses[0].pincode}` : ''}
                  </div>
                  {(customer.addresses[0].googleMapsUrl || (customer.addresses[0].street && customer.addresses[0].city)) && (
                    <a
                      href={customer.addresses[0].googleMapsUrl || 
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${customer.addresses[0].street || ''}, ${customer.addresses[0].city || ''}, ${customer.addresses[0].pincode || ''}`
                        )}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 font-medium mt-1 hover:text-blue-800 hover:underline transition-colors inline-block"
                    >
                      View on Google Maps
                    </a>
                  )}
                  {customer.addresses.length > 1 && (
                    <button
                      onClick={handleShowAddresses}
                      className="text-xs text-blue-600 font-medium mt-1 hover:text-blue-800 hover:underline transition-colors"
                    >
                      +{customer.addresses.length - 1} more location{customer.addresses.length > 2 ? 's' : ''}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Orders & Revenue - Mobile */}
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <MdShoppingCart className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700">
                {customer.orders?.length || 0} orders
              </span>
            </div>
            {customer.orders && customer.orders.length > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <MdAttachMoney className="w-4 h-4 text-green-500" />
                <span className="font-bold text-green-600">
                  {formatPrice(customer.orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0))}
                </span>
              </div>
            )}
          </div>

          {/* Actions - Mobile */}
          <div className="flex flex-wrap gap-2">
            {/* Primary Action Button */}
            {hasDraft ? (
              <>
                <button
                  onClick={handleResumeOrder}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Resume Order
                </button>
                <button
                  onClick={handleEditDates}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Edit dates and other details in the booking wizard"
                >
                  Edit Dates
                </button>
              </>
            ) : hasPendingPayments ? (
              <button
                onClick={handleUploadReceipt}
                className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload Receipt
              </button>
            ) : (
              <button
                onClick={handleBookOrder}
                className="flex-1 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Book Order
              </button>
            )}
            
            {/* Secondary Actions */}
            <div className="flex gap-1">
              <button
                onClick={handleViewOrders}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="View Orders"
              >
                <MdVisibility className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleGenerateLink}
                disabled={isGeneratingLink}
                className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
                title="Generate Customer Link"
              >
                {isGeneratingLink ? (
                  <div className="animate-spin rounded-full w-5 h-5 border-2 border-purple-600 border-t-transparent"></div>
                ) : (
                  <MdLink className="w-5 h-5" />
                )}
              </button>
              
                <button
                onClick={() => onEdit(customer)}
                disabled={isEditing}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                title="Edit Customer"
              >
                {isEditing ? (
                  <div className="animate-spin rounded-full w-5 h-5 border-2 border-blue-600 border-t-transparent"></div>
                ) : (
                  <MdEdit className="w-5 h-5" />
                )}
              </button>
              
              <button
                onClick={() => onDelete(customer)}
                disabled={isDeleting || (customer.orders && customer.orders.length > 0)}
                className={`p-2 rounded-lg transition-colors ${
                  (customer.orders && customer.orders.length > 0) || isDeleting
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-red-600 hover:text-red-800 hover:bg-red-100'
                }`}
                title={
                  customer.orders && customer.orders.length > 0
                    ? "Cannot delete customer with orders"
                    : "Delete Customer"
                }
              >
                <MdDelete className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:grid grid-cols-12 gap-4 items-center">
        {/* Customer Details Column */}
        <div className="col-span-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-lg">
              {customer.contacts?.[0]?.firstName?.charAt(0) || 'C'}
            </div>
            <div className="min-w-0">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs">
                  <MdPhone className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md truncate">
                    {customer.contacts?.[0]?.phoneNumbers?.[0]?.number || 'No phone'}
                  </span>
                </div>
                <div className="text-xs font-bold text-gray-900 truncate">
                  {customer.contacts?.[0]?.firstName}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full w-fit">
                    ID: {customer.id.slice(-6)}
                  </span>
                  {hasDraft && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                      Draft Available
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info Column */}
        <div className="col-span-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <MdEmail className="w-3.5 h-3.5 text-gray-500" />
              <span className="font-medium truncate">
                {customer.auth?.email || 'No email'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <MdCalendarToday className="w-3.5 h-3.5 text-gray-500" />
              <span className="font-medium">
                {formatDate(customer.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Location Column */}
        <div className="col-span-3">
          {customer.addresses && customer.addresses.length > 0 ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                <MdLocationOn className="w-3.5 h-3.5 text-gray-500" />
                <span className="font-medium">
                  {customer.addresses.length} address{customer.addresses.length !== 1 ? 'es' : ''}
                </span>
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                <div className="font-medium text-gray-700">{customer.addresses[0].city}</div>
                <div className="text-gray-500 truncate">
                  {customer.addresses[0].street}{customer.addresses[0].pincode && customer.addresses[0].pincode !== 0 ? `, ${customer.addresses[0].pincode}` : ''}
                </div>
                {(customer.addresses[0].googleMapsUrl || (customer.addresses[0].street && customer.addresses[0].city)) && (
                  <a
                    href={customer.addresses[0].googleMapsUrl || 
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${customer.addresses[0].street || ''}, ${customer.addresses[0].city || ''}, ${customer.addresses[0].pincode || ''}`
                      )}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 font-medium mt-1 hover:text-blue-800 hover:underline transition-colors inline-block"
                  >
                    View on Google Maps
                  </a>
                )}
              </div>
              {customer.addresses.length > 1 && (
                <button
                  onClick={handleShowAddresses}
                  className="text-xs text-blue-600 font-medium hover:text-blue-800 hover:underline transition-colors"
                >
                  +{customer.addresses.length - 1} more location{customer.addresses.length > 2 ? 's' : ''}
                </button>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic">No addresses</div>
          )}
        </div>

        {/* Orders & Revenue Column */}
        <div className="col-span-2">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-sm">
              <MdShoppingCart className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700">
                {customer.orders?.length || 0} orders
              </span>
            </div>
            {customer.orders && customer.orders.length > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <MdAttachMoney className="w-4 h-4 text-green-500" />
                <span className="font-bold text-green-600">
                  {formatPrice(customer.orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0))}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions Column */}
        <div className="col-span-2">
          <div className="flex items-center gap-1.5">
            {/* Show appropriate button based on customer status */}
            {hasDraft ? (
              <>
                <button
                  onClick={handleResumeOrder}
                  className="px-2.5 py-1.5 text-xs font-medium bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                  title="Resume Draft Order"
                >
                  Resume Order
                </button>
                <button
                  onClick={handleEditDates}
                  className="px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  title="Edit dates and other details in the booking wizard"
                >
                  Edit Dates
                </button>
              </>
            ) : hasPendingPayments ? (
              <button
                onClick={handleUploadReceipt}
                className="px-2.5 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                title="Upload Payment Receipt"
              >
                Upload Receipt
              </button>
            ) : (
              <button
                onClick={handleBookOrder}
                className="px-2.5 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                title="Book Order"
              >
                Book Order
              </button>
            )}
            
            <button
              onClick={handleViewOrders}
              className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors border border-gray-200 hover:border-gray-300"
              title="View Orders"
            >
              <MdVisibility className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleGenerateLink}
              disabled={isGeneratingLink}
              className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-md transition-colors border border-purple-200 hover:border-purple-300 disabled:opacity-50"
              title="Generate Customer Link"
            >
              {isGeneratingLink ? (
                <div className="animate-spin rounded-full w-4 h-4 border-2 border-purple-600 border-t-transparent"></div>
              ) : (
                <MdLink className="w-4 h-4" />
              )}
            </button>
            
            <button
              onClick={() => onEdit(customer)}
              disabled={isEditing}
              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors border border-blue-200 hover:border-blue-300 disabled:opacity-50"
              title="Edit Customer"
            >
              {isEditing ? (
                <div className="animate-spin rounded-full w-4 h-4 border-2 border-blue-600 border-t-transparent"></div>
              ) : (
                <MdEdit className="w-4 h-4" />
              )}
            </button>
            
            {/* Delete button - disabled for customers with orders */}
            <button
              onClick={() => onDelete(customer)}
              disabled={isDeleting || (customer.orders && customer.orders.length > 0)}
              className={`p-1.5 rounded-md transition-colors border ${
                (customer.orders && customer.orders.length > 0) || isDeleting
                  ? 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
                  : 'text-red-600 hover:text-red-800 hover:bg-red-100 border-red-200 hover:border-red-300'
              }`}
              title={
                customer.orders && customer.orders.length > 0
                  ? "Cannot delete customer with orders"
                  : "Delete Customer"
              }
            >
              <MdDelete className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Generated Link Display */}
      {generatedLink && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MdLink className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Customer Portal Link Generated</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopyLink}
                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                title="Copy Link"
              >
                <MdContentCopy className="w-4 h-4" />
              </button>
              <button
                onClick={handleCloseLink}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Close"
              >
                <MdClose className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="mt-2 p-2 bg-white border border-green-200 rounded text-xs text-gray-600 break-all">
            {generatedLink}
          </div>
          <p className="mt-2 text-xs text-green-700">
            This link allows the customer to view their order status. It expires in 24 hours.
            <br />
            <span className="text-blue-600 font-medium">🔒 Token is automatically hidden from URL for security</span>
          </p>
        </div>
      )}

      {/* Address Modal */}
      <AddressModal
        isOpen={showAddressModal}
        onClose={handleCloseAddressModal}
        addresses={customer.addresses}
        customerName={customer.contacts?.[0]?.firstName || 'Customer'}
      />
    </div>
  );
});

CustomerCard.displayName = 'CustomerCard';

export default CustomerCard;
