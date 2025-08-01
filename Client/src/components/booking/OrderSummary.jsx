import React from 'react';
import { MdLocationOn, MdSchedule, MdShoppingCart, MdCheck } from 'react-icons/md';
import AddressPicker from '../AddressPicker';

const OrderSummary = ({
  selectedMenu,
  selectedDates,
  orderedItems,
  deliveryLocations,
  deliveryLocationNames,
  savedOrder,
  isUpdating,
  isCreating,
  getTotalItems,
  getTotalPrice,
  getAddressDisplayName,
  isWeekdayMenu,
  isWeekday,
  formatDateForDisplay,
  onDeliveryLocationChange,
  onUpdateOrder,
  onResetOrder,
  onUpdateExistingOrder,
  onCancel,
  onSaveOrder
}) => {
  return (
    <div className="lg:col-span-1">
      <div className="lg:sticky lg:top-6 space-y-6 sm:space-y-8">
        {/* Primary Delivery Location */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <MdLocationOn className="text-white text-xl" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg sm:text-xl flex items-center gap-3">
                  Primary Delivery Address
                  <span className="text-red-500 text-xs bg-red-100 px-3 py-1 rounded-full font-semibold border border-red-200">Required</span>
                </h4>
                <p className="text-gray-600 text-sm mt-1">Main address for all meal deliveries</p>
              </div>
            </div>
          </div>
          <div className="relative z-10">
            <AddressPicker
              value={deliveryLocationNames.full || deliveryLocations.full}
              onChange={(e) => {
                const addressId = e.target.value;
                const displayName = e.target.displayName || getAddressDisplayName(addressId);
                onDeliveryLocationChange('full', addressId, displayName);
              }}
              placeholder="Select primary delivery address (required for all meals)..."
              className="text-xs sm:text-sm lg:text-base"
              mealType="full"
              showMap={true}
            />
          </div>
          {!deliveryLocations.full && (
            <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Primary address is required for order processing
            </div>
          )}
        </div>

        {/* Order Summary */}
        {(selectedMenu || selectedDates.length > 0 || getTotalItems() > 0) && (
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <MdSchedule className="text-white text-xl" />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-lg sm:text-xl">Order Summary</h4>
                <p className="text-gray-600 text-sm">Review your meal booking details</p>
              </div>
            </div>
            
            {/* Selected Menu */}
            {selectedMenu && (
              <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                <h5 className="font-semibold text-blue-800 text-sm mb-1">Selected Menu:</h5>
                <p className="text-blue-700 text-xs">{selectedMenu.name}</p>
                <p className="text-blue-600 text-xs capitalize">{selectedMenu.dayOfWeek}</p>
              </div>
            )}

            {/* Selected Dates */}
            {selectedDates.length > 0 && (
              <div className="mb-3 p-2 bg-green-50 rounded border border-green-200">
                <h5 className="font-semibold text-green-800 text-sm mb-1">Selected Dates:</h5>
                <div className="flex flex-wrap gap-1">
                  {selectedDates.map((date, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
                        isWeekdayMenu(selectedMenu) && !isWeekday(date)
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-green-100 text-green-700 border border-green-200'
                      }`}
                    >
                      {formatDateForDisplay(date)}
                      {isWeekdayMenu(selectedMenu) && !isWeekday(date) && (
                        <span className="text-red-500">⚠️</span>
                      )}
                    </span>
                  ))}
                </div>
                {selectedMenu && isWeekdayMenu(selectedMenu) && (
                  <p className="text-green-600 text-xs mt-1">
                    <span className="font-medium">Note:</span> Weekday menu - only Monday-Friday dates are valid
                  </p>
                )}
              </div>
            )}

            {/* Delivery Addresses */}
            <div className="mb-3 p-2 bg-purple-50 rounded border border-purple-200">
              <h5 className="font-semibold text-purple-800 text-sm mb-1">Delivery Addresses:</h5>
              <div className="space-y-1">
                {/* Breakfast Address */}
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-xs">🍳</span>
                  <span className="text-purple-700 text-xs">
                    Breakfast: {deliveryLocations.breakfast 
                      ? (deliveryLocationNames.breakfast || 'Specific Address Selected')
                      : (deliveryLocationNames.full || 'Primary Address (Default)')
                    }
                  </span>
                  {!deliveryLocations.breakfast && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-1 rounded">Default</span>
                  )}
                </div>
                
                {/* Lunch Address */}
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500 text-xs">🍽️</span>
                  <span className="text-purple-700 text-xs">
                    Lunch: {deliveryLocations.lunch 
                      ? (deliveryLocationNames.lunch || 'Specific Address Selected')
                      : (deliveryLocationNames.full || 'Primary Address (Default)')
                    }
                  </span>
                  {!deliveryLocations.lunch && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-1 rounded">Default</span>
                  )}
                </div>
                
                {/* Dinner Address */}
                <div className="flex items-center gap-2">
                  <span className="text-pink-500 text-xs">🌙</span>
                  <span className="text-purple-700 text-xs">
                    Dinner: {deliveryLocations.dinner 
                      ? (deliveryLocationNames.dinner || 'Specific Address Selected')
                      : (deliveryLocationNames.full || 'Primary Address (Default)')
                    }
                  </span>
                  {!deliveryLocations.dinner && (
                    <span className="text-xs text-blue-600 bg-blue-100 px-1 rounded">Default</span>
                  )}
                </div>
                
                {/* Primary Address */}
                {deliveryLocations.full && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-purple-200">
                    <span className="text-blue-500 text-xs">📍</span>
                    <span className="text-purple-700 text-xs font-medium">
                      Primary: {deliveryLocationNames.full || 'Selected'}
                    </span>
                    <span className="text-xs text-green-600 bg-green-100 px-1 rounded">Required</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-gradient-to-br from-white to-orange-50 rounded-3xl p-6 sm:p-8 shadow-xl border border-orange-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <MdShoppingCart className="text-white text-xl" />
              </div>
              <div>
                <span className="text-gray-800 font-bold text-lg sm:text-xl">Selected Items: {getTotalItems()}</span>
                {getTotalPrice() > 0 && (
                  <p className="text-orange-600 font-semibold text-lg sm:text-xl">Total: ₹{getTotalPrice()}</p>
                )}
              </div>
            </div>
          </div>

          {/* Update/Reset Buttons */}
          {savedOrder && (
            <div className="flex gap-2 sm:gap-3 mb-3">
              <button
                onClick={onUpdateOrder}
                disabled={isUpdating}
                className="flex-1 bg-blue-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <span className="text-sm">🔄</span>
                    Update Order
                  </>
                )}
              </button>
              <button
                onClick={onResetOrder}
                className="flex-1 bg-orange-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                <span className="text-sm">🔄</span>
                Reset Order
              </button>
            </div>
          )}

          {/* Date Selection Mode (when updating) */}
          {isUpdating && (
            <div className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <h5 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <span className="text-yellow-600">📅</span>
                Update Order Dates
              </h5>
              <p className="text-xs text-yellow-700 mb-2">
                Select new dates for your order. Current selection: {selectedDates.length} dates
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onUpdateExistingOrder}
                  disabled={selectedDates.length === 0}
                  className="flex-1 bg-yellow-500 text-white py-2 px-3 rounded text-xs font-medium hover:bg-yellow-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Confirm Update
                </button>
                <button
                  onClick={() => {
                    // This should be handled by parent component
                  }}
                  className="flex-1 bg-gray-500 text-white py-2 px-3 rounded text-xs font-medium hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-4 rounded-2xl font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-base sm:text-lg"
            >
              Cancel
            </button>
            <button
              onClick={onSaveOrder}
              disabled={getTotalItems() === 0 || isCreating || selectedDates.length === 0}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:transform-none text-base sm:text-lg flex items-center justify-center gap-3"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating Order...
                </>
              ) : (
                <>
                  <MdCheck className="text-xl" />
                  Save Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary; 