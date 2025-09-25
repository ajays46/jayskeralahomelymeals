import React from 'react';
import { MdClose, MdLocationOn, MdHome, MdBusiness } from 'react-icons/md';

const AddressModal = ({ isOpen, onClose, addresses, customerName }) => {
  if (!isOpen || !addresses || addresses.length === 0) return null;

  const getAddressIcon = (index) => {
    if (index === 0) return <MdHome className="w-5 h-5 text-blue-600" />;
    return <MdBusiness className="w-5 h-5 text-gray-600" />;
  };

  const getAddressType = (index) => {
    if (index === 0) return 'Primary Address';
    return `Address ${index + 1}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <MdLocationOn className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {customerName}'s Addresses
                </h3>
                <p className="text-sm text-gray-600">
                  {addresses.length} address{addresses.length !== 1 ? 'es' : ''} found
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              {addresses.map((address, index) => (
                <div
                  key={address.id || index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {getAddressIcon(index)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {getAddressType(index)}
                        </span>
                        {index === 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        {address.housename && (
                          <div className="font-medium text-gray-900">
                            {address.housename}
                          </div>
                        )}
                        {address.street && (
                          <div>{address.street}</div>
                        )}
                        <div className="flex items-center gap-2">
                          <span>{address.city}</span>
                          {address.pincode && (
                            <>
                              <span className="text-gray-400">-</span>
                              <span className="font-medium">{address.pincode}</span>
                            </>
                          )}
                        </div>
                        {address.state && (
                          <div>{address.state}</div>
                        )}
                        {address.landmark && (
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Landmark:</span> {address.landmark}
                          </div>
                        )}
                        {address.googleMapsUrl && (
                          <div className="mt-2">
                            <a
                              href={address.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium hover:text-blue-800 hover:underline transition-colors"
                            >
                              <MdLocationOn className="w-3 h-3" />
                              View on Google Maps
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressModal;
