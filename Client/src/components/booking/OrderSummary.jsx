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
  onRemoveDateMenuSelection
}) => {
  return (
    <div className="lg:col-span-1">
      <div className="lg:sticky lg:top-6 space-y-6 sm:space-y-8">
        {/* Primary Delivery Location - Optional when using meal-specific addresses */}
        {(!deliveryLocations.breakfast && !deliveryLocations.lunch && !deliveryLocations.dinner) && (
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MdLocationOn className="text-white text-xl" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg sm:text-xl flex items-center gap-3">
                    Primary Delivery Address
                    <span className="text-blue-500 text-xs bg-blue-100 px-3 py-1 rounded-full font-semibold border border-blue-200">Optional</span>
                  </h4>
                  <p className="text-gray-600 text-sm mt-1">Fallback address for meal deliveries</p>
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
              />
            </div>
          </div>
        )}

        {/* Order Summary */}
        {selectedMenu ? (
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
                
                {selectedDates.length > 10 ? (
                  // For large date selections, show summary
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 text-sm font-medium">
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
                          {formatDateForDisplay(date)}

                          {skippedCount > 0 && (
                            <span className="text-orange-600">({skippedCount} skipped)</span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                )}

                {Object.keys(skipMeals).length > 0 && (
                  <p className="text-orange-600 text-xs mt-1">
                    <span className="font-medium">Note:</span> Some meals have been skipped - price adjusted accordingly
                  </p>
                )}
              </div>
            )}

            {/* Daily Flexible Menu Selections */}
            {orderMode === 'daily-flexible' && selectedDates.length > 0 && (
              <div className="mb-3 p-2 bg-indigo-50 rounded border border-indigo-200">
                <h5 className="font-semibold text-indigo-800 text-sm mb-2">Daily Menu Selections:</h5>
                <div className="space-y-2">
                  {selectedDates.map((date, index) => {
                    const dateStr = date.toISOString().split('T')[0];
                    const selectedMenuForDate = dateMenuSelections[dateStr];
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-indigo-100">
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-600 text-xs font-medium">
                            {formatDateForDisplay(date)}:
                          </span>
                          {selectedMenuForDate ? (
                            <span className="text-indigo-700 text-xs">
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
                            className="text-red-500 hover:text-red-700 text-xs p-1 rounded hover:bg-red-50"
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
              <div className="mb-3 p-2 bg-purple-50 rounded border border-purple-200">
                <h5 className="font-semibold text-purple-800 text-sm mb-1">Delivery Addresses:</h5>
                <div className="space-y-1">
                  {/* Primary Address */}
                  {deliveryLocations.full && (
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500 text-xs">📍</span>
                      <span className="text-purple-700 text-xs font-medium">
                        Primary: {deliveryLocationNames.full || 'Selected'}
                      </span>
                      <span className="text-xs text-green-600 bg-green-100 px-1 rounded">Required</span>
                    </div>
                  )}
                  
                  {/* Breakfast Address */}
                  {deliveryLocations.breakfast && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 text-xs">🍳</span>
                      <span className="text-purple-700 text-xs">
                        Breakfast: {deliveryLocationNames.breakfast || 'Specific Address Selected'}
                      </span>
                    </div>
                  )}
                  
                  {/* Lunch Address */}
                  {deliveryLocations.lunch && (
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500 text-xs">🍽️</span>
                      <span className="text-purple-700 text-xs">
                        Lunch: {deliveryLocationNames.lunch || 'Specific Address Selected'}
                      </span>
                    </div>
                  )}
                  
                  {/* Dinner Address */}
                  {deliveryLocations.dinner && (
                    <div className="flex items-center gap-2">
                      <span className="text-pink-500 text-xs">🌙</span>
                      <span className="text-purple-700 text-xs">
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
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-100">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <MdSchedule className="text-white text-2xl" />
              </div>
              <h4 className="font-bold text-gray-800 text-lg mb-2">Ready to Order?</h4>
              <p className="text-gray-600 text-sm mb-4">Select a menu from the left to start your meal booking</p>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-blue-700 text-xs">
                  <span className="font-semibold">💡 Tip:</span> Choose from our delicious meal plans including breakfast, lunch, and dinner options
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {selectedMenu && (
          <div className="bg-gradient-to-br from-white to-orange-50 rounded-3xl p-6 sm:p-8 shadow-xl border border-orange-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div>
                  {getTotalPrice() > 0 && (
                    <p className="text-orange-600 font-semibold text-lg sm:text-xl">Total: ₹{formatPrice ? formatPrice(getTotalPrice()) : getTotalPrice()}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pricing Breakdown */}
            {selectedMenu && getTotalPrice() > 0 && (
              <div className="mb-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                <h6 className="text-orange-800 font-semibold text-sm mb-2">Menu Pricing Breakdown:</h6>
                <div className="space-y-1">
                  {selectedMenu.mealPricing?.breakfast?.price > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-orange-700">🍳 Breakfast</span>
                      <span className="text-orange-800 font-semibold">
                        ₹{formatPrice ? formatPrice(selectedMenu.mealPricing.breakfast.price) : selectedMenu.mealPricing.breakfast.price}
                      </span>
                    </div>
                  )}
                  {selectedMenu.mealPricing?.lunch?.price > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-orange-700">🍽️ Lunch</span>
                      <span className="text-orange-800 font-semibold">
                        ₹{formatPrice ? formatPrice(selectedMenu.mealPricing.lunch.price) : selectedMenu.mealPricing.lunch.price}
                      </span>
                    </div>
                  )}
                  {selectedMenu.mealPricing?.dinner?.price > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-orange-700">🌙 Dinner</span>
                      <span className="text-orange-800 font-semibold">
                        ₹{formatPrice ? formatPrice(selectedMenu.mealPricing.dinner.price) : selectedMenu.mealPricing.dinner.price}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-orange-300 pt-1 mt-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-orange-800">Per Day Total</span>
                      <span className="text-orange-900">
                        ₹{formatPrice ? formatPrice(
                          (selectedMenu.mealPricing?.breakfast?.price || 0) + 
                          (selectedMenu.mealPricing?.lunch?.price || 0) + 
                          (selectedMenu.mealPricing?.dinner?.price || 0)
                        ) : (
                          (selectedMenu.mealPricing?.breakfast?.price || 0) + 
                          (selectedMenu.mealPricing?.lunch?.price || 0) + 
                          (selectedMenu.mealPricing?.dinner?.price || 0)
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {/* Skip Meals Adjustment */}
                  {Object.keys(skipMeals).length > 0 && (
                    <>
                      <div className="border-t border-orange-300 pt-1 mt-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-orange-700">× {selectedDates.length} days</span>
                          <span className="text-orange-800 font-semibold">
                            ₹{formatPrice ? formatPrice(
                              ((selectedMenu.mealPricing?.breakfast?.price || 0) + 
                               (selectedMenu.mealPricing?.lunch?.price || 0) + 
                               (selectedMenu.mealPricing?.dinner?.price || 0)) * selectedDates.length
                            ) : (
                              ((selectedMenu.mealPricing?.breakfast?.price || 0) + 
                               (selectedMenu.mealPricing?.lunch?.price || 0) + 
                               (selectedMenu.mealPricing?.dinner?.price || 0)) * selectedDates.length
                            )}
                          </span>
                        </div>
                      </div>
                      
                      {/* Skipped Meals Deduction */}
                      {(() => {
                        let totalSkipped = 0;
                        Object.entries(skipMeals).forEach(([dateStr, skippedMealsForDate]) => {
                          Object.keys(skippedMealsForDate).forEach(mealType => {
                            totalSkipped += selectedMenu.mealPricing?.[mealType]?.price || 0;
                          });
                        });
                        
                        return totalSkipped > 0 ? (
                          <div className="flex justify-between text-xs text-red-600">
                            <span>− Skipped meals</span>
                            <span className="font-semibold">−₹{formatPrice ? formatPrice(totalSkipped) : totalSkipped}</span>
                          </div>
                        ) : null;
                      })()}
                    </>
                  )}
                  
                  <div className="border-t border-orange-300 pt-1 mt-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-orange-800">Final Total</span>
                      <span className="text-orange-900">₹{formatPrice ? formatPrice(getTotalPrice()) : getTotalPrice()}</span>
                    </div>
                  </div>
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
                disabled={getTotalItems() === 0 || isCreating || selectedDates.length === 0 || (!deliveryLocations.full && !deliveryLocations.breakfast && !deliveryLocations.lunch && !deliveryLocations.dinner)}
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
        )}
      </div>
    </div>
  );
};

export default OrderSummary; 