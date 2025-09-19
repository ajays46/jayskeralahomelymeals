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
  isCreating,

  getTotalItems,
  getTotalPrice,
  getAddressDisplayName,
  isWeekdayMenu,
  isWeekday,
  formatDateForDisplay,
  onDeliveryLocationChange,
  onCancel,
  onSaveOrder,
  formatPrice,
  skipMeals,
  orderMode,
  dateMenuSelections,
  onDateMenuSelection,
  onRemoveDateMenuSelection,
  // New props for seller-selected users
  addresses = null,
  onAddressCreate = null,
  selectedUserId = null,
  // New prop for product quantities
  productQuantities = null
}) => {
  return (
    <div className="lg:col-span-1">
      <div className="lg:sticky lg:top-6 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Primary Delivery Location - Optional when using meal-specific addresses */}
        {(!deliveryLocations.breakfast && !deliveryLocations.lunch && !deliveryLocations.dinner) && (
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg sm:shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <MdLocationOn className="text-white text-lg sm:text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-gray-800 text-base sm:text-lg lg:text-xl flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="truncate">Primary Delivery Address</span>
                    <span className="text-blue-500 text-xs bg-blue-100 px-2 sm:px-3 py-1 rounded-full font-semibold border border-blue-200 whitespace-nowrap">Optional</span>
                  </h4>
                  <p className="text-gray-600 text-xs sm:text-sm mt-1 hidden sm:block">Fallback address for meal deliveries</p>
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
                placeholder="Select primary delivery address (optional fallback)..."
                className="text-xs sm:text-sm lg:text-base"
                mealType="full"
                showMap={true}
                // Pass addresses for seller-selected users
                addresses={addresses}
                onAddressCreate={onAddressCreate}
                selectedUserId={selectedUserId}
              />
            </div>
          </div>
        )}

        {/* Order Summary */}
        {selectedMenu ? (
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg sm:shadow-xl border border-blue-100">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <MdSchedule className="text-white text-lg sm:text-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-gray-800 text-base sm:text-lg lg:text-xl">Order Summary</h4>
                <p className="text-gray-600 text-xs sm:text-sm hidden sm:block">Review your meal booking details</p>
              </div>
            </div>
            
            {/* Selected Menu */}
            {selectedMenu && (
              <div className="mb-3 p-2 sm:p-3 bg-blue-50 rounded border border-blue-200">
                <h5 className="font-semibold text-blue-800 text-xs sm:text-sm mb-1">Selected Menu:</h5>
                <p className="text-blue-700 text-xs sm:text-sm font-medium break-words">{selectedMenu.name}</p>
a                {selectedMenu.price > 0 && (
                  <p className="text-blue-600 text-xs sm:text-sm">₹{selectedMenu.price}</p>
                )}
                <p className="text-blue-600 text-xs sm:text-sm capitalize">
                  {(() => {
                    const itemName = selectedMenu.name?.toLowerCase() || '';
                    if (itemName.includes('weekday') || itemName.includes('week day') || itemName.includes('monday') || itemName.includes('tuesday') || itemName.includes('wednesday') || itemName.includes('thursday') || itemName.includes('friday')) return 'Weekday';
                    if (itemName.includes('weekend') || itemName.includes('saturday') || itemName.includes('sunday')) return 'Weekend';
                    return 'Menu';
                  })()}
                </p>
                <p className="text-blue-500 text-xs sm:text-sm break-words">From: {selectedMenu.menuName}</p>
                
                {/* Stock Status Indicator */}
                {(() => {
                  // Check if menu item has a product with an ID
                  let productId = null;
                  if (selectedMenu.product && selectedMenu.product.id) {
                    productId = selectedMenu.product.id;
                  } else if (selectedMenu.productId) {
                    productId = selectedMenu.productId;
                  }
                  
                  if (!productId || !productQuantities || !productQuantities[productId]) return null;
                  
                  const productQuantity = productQuantities[productId];
                  
                  return (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      {(() => {
                        if (productQuantity.quantity === 0) {
                          return (
                            <div className="flex items-center gap-2 text-red-600 text-xs">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="font-semibold">Cannot Purchase</span>
                              <span className="text-red-500">(Available: {productQuantity.quantity})</span>
                            </div>
                          );
                        } else if (productQuantity.quantity < 5) {
                          return (
                            <div className="flex items-center gap-2 text-red-600 text-xs">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="font-semibold">Out of Stock Warning</span>
                              <span className="text-red-500">(Available: {productQuantity.quantity})</span>
                            </div>
                          );
                        } else if (productQuantity.quantity < 10) {
                          return (
                            <div className="flex items-center gap-2 text-orange-600 text-xs">
                              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                              <span className="font-semibold">Low Stock</span>
                              <span className="text-red-500">(Available: {productQuantity.quantity})</span>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex items-center gap-2 text-green-600 text-xs">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="font-semibold">In Stock</span>
                              <span className="text-green-500">(Available: {productQuantity.quantity})</span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Selected Dates */}
            {selectedDates.length > 0 && (
              <div className="mb-3 p-2 sm:p-3 bg-green-50 rounded border border-green-200">
                <h5 className="font-semibold text-green-800 text-xs sm:text-sm mb-2">Selected Dates:</h5>
                
                {selectedDates.length > 10 ? (
                  // For large date selections, show summary
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-green-600 text-xs sm:text-sm font-medium">
                        {selectedDates.length} days selected
                      </span>
                      <span className="text-green-500 text-xs">
                        ({formatDateForDisplay(selectedDates[0])} to {formatDateForDisplay(selectedDates[selectedDates.length - 1])})
                      </span>
                    </div>
                    
                    {/* Show first few and last few dates */}
                    <div className="flex flex-wrap gap-1">
                      {/* First 3 dates */}
                      {selectedDates.slice(0, 3).map((date, index) => (
                        <span
                          key={`first-${index}`}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 border border-green-200"
                        >
                          {formatDateForDisplay(date)}
                        </span>
                      ))}
                      
                      {/* Ellipsis for middle dates */}
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-500">
                        ...
                      </span>
                      
                      {/* Last 3 dates */}
                      {selectedDates.slice(-3).map((date, index) => (
                        <span
                          key={`last-${index}`}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 border border-green-200"
                        >
                          {formatDateForDisplay(date)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  // For smaller selections, show all dates
                  <div className="flex flex-wrap gap-1">
                    {selectedDates.map((date, index) => {
                      const dateStr = date.toISOString().split('T')[0];
                      const skippedMealsForDate = skipMeals[dateStr] || {};
                      const skippedCount = Object.keys(skippedMealsForDate).length;
                      
                      return (
                        <span
                          key={index}
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
                            isWeekdayMenu(selectedMenu) && !isWeekday(date)
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : skippedCount > 0
                              ? 'bg-orange-100 text-orange-700 border border-orange-200'
                              : 'bg-green-100 text-green-700 border border-green-200'
                          }`}
                        >
                          <span className="hidden sm:inline">{formatDateForDisplay(date)}</span>
                          <span className="sm:hidden">{date.getDate()}</span>

                          {skippedCount > 0 && (
                            <span className="text-orange-600 text-xs">({skippedCount} skipped)</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}

                {Object.keys(skipMeals).length > 0 && (
                  <p className="text-orange-600 text-xs mt-2">
                    <span className="font-medium">Note:</span> Some meals have been skipped - price adjusted accordingly
                  </p>
                )}
              </div>
            )}

            {/* Daily Flexible Menu Selections */}
            {orderMode === 'daily-flexible' && selectedDates.length > 0 && (
              <div className="mb-3 p-2 sm:p-3 bg-indigo-50 rounded border border-indigo-200">
                <h5 className="font-semibold text-indigo-800 text-xs sm:text-sm mb-2">Daily Menu Selections:</h5>
                <div className="space-y-2">
                  {selectedDates.map((date, index) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const selectedMenuForDate = dateMenuSelections[dateStr];
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-indigo-100">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-indigo-600 text-xs font-medium whitespace-nowrap">
                            {formatDateForDisplay(date)}:
                          </span>
                          {selectedMenuForDate ? (
                            <span className="text-indigo-700 text-xs break-words">
                              {selectedMenuForDate.name}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs italic">
                              No menu selected
                            </span>
                          )}
                        </div>
                        {selectedMenuForDate && (
                          <button
                            onClick={() => onRemoveDateMenuSelection(date)}
                            className="text-red-500 hover:text-red-700 text-xs p-1 rounded hover:bg-red-50 ml-2 flex-shrink-0"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {Object.keys(dateMenuSelections).length < selectedDates.length && (
                  <p className="text-indigo-600 text-xs mt-2">
                    <span className="font-medium">Note:</span> Select menus for remaining dates from the menu list
                  </p>
                )}
              </div>
            )}

            {/* Delivery Addresses - Show primary address and any specific addresses */}
            {(deliveryLocations.full || deliveryLocations.breakfast || deliveryLocations.lunch || deliveryLocations.dinner) && (
              <div className="mb-3 p-2 sm:p-3 bg-purple-50 rounded border border-purple-200">
                <h5 className="font-semibold text-purple-800 text-xs sm:text-sm mb-2">Delivery Addresses:</h5>
                <div className="space-y-1">
                  {/* Primary Address */}
                  {deliveryLocations.full && (
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500 text-xs">📍</span>
                      <span className="text-purple-700 text-xs font-medium break-words">
                        Primary: {deliveryLocationNames.full || 'Selected'}
                      </span>
                      <span className="text-xs text-green-600 bg-green-100 px-1 rounded flex-shrink-0">Required</span>
                    </div>
                  )}
                  
                  {/* Breakfast Address */}
                  {deliveryLocations.breakfast && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 text-xs">🍳</span>
                      <span className="text-purple-700 text-xs break-words">
                        Breakfast: {deliveryLocationNames.breakfast || 'Specific Address Selected'}
                      </span>
                    </div>
                  )}
                  
                  {/* Lunch Address */}
                  {deliveryLocations.lunch && (
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500 text-xs">🍽️</span>
                      <span className="text-purple-700 text-xs break-words">
                        Lunch: {deliveryLocationNames.lunch || 'Specific Address Selected'}
                      </span>
                    </div>
                  )}
                  
                  {/* Dinner Address */}
                  {deliveryLocations.dinner && (
                    <div className="flex items-center gap-2">
                      <span className="text-pink-500 text-xs">🌙</span>
                      <span className="text-purple-700 text-xs break-words">
                        Dinner: {deliveryLocationNames.dinner || 'Specific Address Selected'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          // No menu selected message
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg sm:shadow-xl border border-blue-100">
            <div className="text-center py-6 sm:py-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <MdSchedule className="text-white text-xl sm:text-2xl" />
              </div>
              <h4 className="font-bold text-gray-800 text-base sm:text-lg mb-2">Ready to Order?</h4>
              <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4">Select a menu from the left to start your meal booking</p>
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200">
                <p className="text-blue-700 text-xs sm:text-sm">
                  <span className="font-semibold">💡 Tip:</span> Choose from our delicious meal plans including breakfast, lunch, and dinner options
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {selectedMenu && (
          <div className="bg-gradient-to-br from-white to-orange-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-lg sm:shadow-xl border border-orange-100">
            {/* Action Buttons */}
            <div className="space-y-3 sm:space-y-4">
              {/* Cancel Button */}
              <button
                onClick={onCancel}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base lg:text-lg"
              >
                Cancel
              </button>
              
              {/* Save Order Button */}
              <button
                onClick={onSaveOrder}
                disabled={getTotalItems() === 0 || isCreating || selectedDates.length === 0 || (!deliveryLocations.full && !deliveryLocations.breakfast && !deliveryLocations.lunch && !deliveryLocations.dinner)}
                className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base lg:text-lg flex items-center justify-center gap-2 sm:gap-3 ${
                  getTotalItems() === 0 || isCreating || selectedDates.length === 0 || (!deliveryLocations.full && !deliveryLocations.breakfast && !deliveryLocations.lunch && !deliveryLocations.dinner)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed transform-none shadow-md'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                }`}
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                    <span className="hidden sm:inline">Creating Order...</span>
                    <span className="sm:hidden">Creating...</span>
                  </>
                ) : (
                  <>
                    <MdShoppingCart className="text-lg sm:text-xl lg:text-2xl flex-shrink-0" />
                    <span className="hidden sm:inline">Save Order & Proceed to Payment</span>
                    <span className="sm:hidden">Save Order & Pay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSummary; 