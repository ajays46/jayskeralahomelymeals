import React from 'react';
import { MdRestaurant, MdExpandMore, MdExpandLess } from 'react-icons/md';

const MenuSelector = ({
  menus,
  selectedMenu,
  dietaryPreference,
  expandedSections,
  menusLoading,
  menusError,
  onMenuSelection,
  onDietaryPreferenceChange,
  onToggleSection,
  getFilteredMenus,
  getCleanMenuItemName,
  isWeekdayMenu,
  orderMode,
  productQuantities, // Add this prop
  productQuantitiesLoading // Add this prop
}) => {
  // Helper function to check if menu item should show out of stock label
  const shouldShowOutOfStockLabel = (menuItem) => {
    if (!productQuantities || productQuantitiesLoading) return false;
    
    // Check if menu item has a product with an ID
    let productId = null;
    if (menuItem.product && menuItem.product.id) {
      productId = menuItem.product.id;
    } else if (menuItem.productId) {
      productId = menuItem.productId;
    }
    
    if (!productId) return false;
    
    const productQuantity = productQuantities[productId];
    if (!productQuantity) return false;
    
    return productQuantity.quantity < 5;
  };

  // Helper function to check if menu item is completely out of stock (cannot be purchased)
  const isCompletelyOutOfStock = (menuItem) => {
    if (!productQuantities || productQuantitiesLoading) return false;
    
    // Check if menu item has a product with an ID
    let productId = null;
    if (menuItem.product && menuItem.product.id) {
      productId = menuItem.product.id;
    } else if (menuItem.productId) {
      productId = menuItem.productId;
    }
    
    if (!productId) return false;
    
    const productQuantity = productQuantities[productId];
    if (!productQuantity) return false;
    
    return productQuantity.quantity === 0;
  };

  // Helper function to get stock status text
  const getStockStatus = (menuItem) => {
    if (!productQuantities || productQuantitiesLoading) return null;
    
    // Check if menu item has a product with an ID
    let productId = null;
    if (menuItem.product && menuItem.product.id) {
      productId = menuItem.product.id;
    } else if (menuItem.productId) {
      productId = menuItem.productId;
    }
    
    if (!productId) return null;
    
    const productQuantity = productQuantities[productId];
    if (!productQuantity) return null;
    
    if (productQuantity.quantity === 0) {
      return {
        text: 'Out of Stock',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200'
      };
    } else if (productQuantity.quantity < 5) {
      return {
        text: 'Out of Stock',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200'
      };
    } else if (productQuantity.quantity < 10) {
      return {
        text: `Low Stock (${productQuantity.quantity})`,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        borderColor: 'border-orange-200'
      };
    } else {
      return {
        text: `In Stock (${productQuantity.quantity})`,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200'
      };
    }
  };

  // Helper function to get auto-selection info
  const getAutoSelectionInfo = (menuItem) => {
    const itemName = menuItem.name?.toLowerCase() || '';
    
    // Monthly menu - 30 days
    if (itemName.includes('monthly') || itemName.includes('month')) {
      return {
        text: 'Auto-selects 30 days',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200',
        icon: '📅'
      };
    }
    
    // Full week menu - 7 days
    if (itemName.includes('full week')) {
      return {
        text: 'Auto-selects 7 days',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        borderColor: 'border-indigo-200',
        icon: '📅'
      };
    }
    
    // Weekly menu - 7 days
    if (itemName.includes('weekly') || itemName.includes('week')) {
      return {
        text: 'Auto-selects 7 days',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        icon: '📆'
      };
    }
    
    // Week-day plan - 5 days
    if (itemName.includes('week-day') || itemName.includes('weekday')) {
      return {
        text: 'Auto-selects 5 weekdays',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-200',
        icon: '🗓️'
      };
    }
    
    // General weekday menu - 5 days (Monday to Friday)
    if (itemName.includes('monday') || itemName.includes('tuesday') || itemName.includes('wednesday') || itemName.includes('thursday') || itemName.includes('friday')) {
      return {
        text: 'Auto-selects 5 weekdays',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-200',
        icon: '🗓️'
      };
    }
    
    // Daily rates - no auto-selection
    if (itemName.includes('daily rates') || itemName.includes('daily rate')) {
      return {
        text: 'Manual date selection',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-200',
        icon: '✋'
      };
    }
    
    return null;
  };



  return (
    <div className="mb-6 sm:mb-8">
      {/* Custom CSS for hiding scrollbar */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* Internet Explorer 10+ */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;  /* Safari and Chrome */
        }
        
        /* Ensure proper horizontal scrolling */
        .overflow-x-auto {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x mandatory;
        }
        
        /* Card snap points for better scrolling */
        .flex-shrink-0 {
          scroll-snap-align: start;
        }
        
        /* Ensure cards don't get cut off */
        .w-72 {
          min-width: 288px;
          max-width: 288px;
        }
      `}</style>
      
      <div 
        className="group relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl sm:rounded-3xl cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]"
        onClick={() => onToggleSection('menus')}
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg border border-white/20 flex-shrink-0">
                <MdRestaurant className="text-2xl sm:text-3xl" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-white font-bold text-lg sm:text-2xl lg:text-3xl mb-1 sm:mb-2 truncate">Available Menu Plans</h2>
                <p className="text-blue-100 text-sm sm:text-lg hidden sm:block">Select from our curated menu options</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 border border-white/20">
                <span className="text-white font-semibold text-sm sm:text-lg whitespace-nowrap">
                  {menus.length} {menus.length === 1 ? 'Menu' : 'Menus'} Available
                </span>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                {expandedSections.menus ? (
                  <MdExpandLess className="text-white text-xl sm:text-2xl" />
                ) : (
                  <MdExpandMore className="text-white text-xl sm:text-2xl" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {expandedSections.menus && (
        <div className="bg-white rounded-xl p-4 sm:p-6 mt-3 sm:mt-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Select a Menu Plan</h3>
              {menusLoading && (
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-500"></div>
              )}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">
              {orderMode === 'daily-flexible' 
                ? 'Click on a menu to assign it to selected dates'
                : 'Click on a menu to view details'
              }
            </div>
          </div>

          {/* Stock Status Loading Indicator */}
          {productQuantitiesLoading && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-2 text-blue-700">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm font-medium">Loading stock information...</span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {menusLoading && (
            <div className="text-center py-8 sm:py-12">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-500 mx-auto mb-3 sm:mb-4"></div>
              <p className="text-gray-500 text-base sm:text-lg">Loading available menus...</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-2">Please wait while we fetch the latest menu options</p>
            </div>
          )}

          {/* Error State */}
          {menusError && (
            <div className="text-center py-8 sm:py-12">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-500 text-base sm:text-lg font-semibold">Error loading menus</p>
              <p className="text-gray-500 text-xs sm:text-sm mt-2">Please try again later or contact support</p>
            </div>
          )}

          {/* Menu Cards */}
          {!menusLoading && !menusError && (
            <div>

              
              {/* Dietary Preference Filter */}
              <div className="mb-6 sm:mb-8">
                <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
                  Choose Your Preference
                </h4>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button 
                    onClick={() => onDietaryPreferenceChange('all')}
                    className={`group relative overflow-hidden px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
                      dietaryPreference === 'all'
                        ? 'border-blue-500 bg-gradient-to-r from-blue-500 to-indigo-600 text-white transform scale-105 shadow-blue-200'
                        : 'border-blue-300 bg-white text-blue-700 hover:bg-blue-50 hover:border-blue-400 hover:scale-105'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl mr-2">🍽️</span>
                    Show All
                  </button>
                  <button 
                    onClick={() => onDietaryPreferenceChange('veg')}
                    className={`group relative overflow-hidden px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
                      dietaryPreference === 'veg'
                        ? 'border-green-500 bg-gradient-to-r from-green-500 to-emerald-600 text-white transform scale-105 shadow-green-200'
                        : 'border-green-300 bg-white text-green-700 hover:bg-green-50 hover:border-green-400 hover:scale-105'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl mr-2">🥬</span>
                    Vegetarian
                  </button>
                  <button 
                    onClick={() => onDietaryPreferenceChange('non-veg')}
                    className={`group relative overflow-hidden px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
                      dietaryPreference === 'non-veg'
                        ? 'border-red-500 bg-gradient-to-r from-red-500 to-pink-600 text-white transform scale-105 shadow-red-200'
                        : 'border-red-300 bg-white text-red-700 hover:bg-red-50 hover:border-red-400 hover:scale-105'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl mr-2">🍖</span>
                    Non-Vegetarian
                  </button>
                </div>
              </div>

              {/* Mobile: Horizontal scrolling, Desktop: Grid layout */}
              <div className="block lg:hidden">
                {/* Mobile horizontal scroll container */}
                <div className="overflow-x-auto scrollbar-hide pb-4">
                  <div className="flex gap-3 min-w-max pl-4 pr-4">
                    {getFilteredMenus().map((menuItem) => {
                      const stockStatus = getStockStatus(menuItem);
                      const showOutOfStockLabel = shouldShowOutOfStockLabel(menuItem);
                      const completelyOutOfStock = isCompletelyOutOfStock(menuItem);
                      const autoSelectionInfo = getAutoSelectionInfo(menuItem);
                      
                      return (
                        <div 
                          key={menuItem.id}
                          className={`group relative overflow-hidden transition-all duration-500 hover:shadow-lg rounded-lg w-56 flex-shrink-0 ${
                            selectedMenu?.id === menuItem.id 
                              ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-lg' 
                              : showOutOfStockLabel
                              ? 'border-2 border-red-300 bg-white'
                              : 'border border-gray-200 hover:border-blue-300'
                          }`}
                          onClick={() => onMenuSelection(menuItem)}
                        >
                          {/* Gradient overlay on hover */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          <div className="relative p-3">
                            {/* Stock Status Badge - Moved below the header */}
                            {stockStatus && (
                              <div className={`mb-2 px-2 py-1 rounded-full text-xs font-semibold ${stockStatus.bgColor} ${stockStatus.color} ${stockStatus.borderColor} border inline-block`}>
                                {stockStatus.text}
                              </div>
                            )}
                            
                            {/* Auto-Selection Info Badge */}
                            {autoSelectionInfo && (
                              <div className={`mb-2 px-2 py-1 rounded-full text-xs font-semibold ${autoSelectionInfo.bgColor} ${autoSelectionInfo.color} ${autoSelectionInfo.borderColor} border inline-block`}>
                                <span className="mr-1">{autoSelectionInfo.icon}</span>
                                {autoSelectionInfo.text}
                              </div>
                            )}
                            
                            {/* 1. Menu Item Name and Price */}
                            <div className="mb-2">
                              <h4 className="font-bold text-sm text-gray-800 break-words leading-tight">{menuItem.name}</h4>
                              {menuItem.price > 0 && (
                                <p className="text-sm font-semibold text-green-600 mt-1">
                                  ₹{menuItem.price}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-block w-2 h-2 rounded-full ${
                                  isWeekdayMenu(menuItem) ? 'bg-blue-500' : 
                                  (menuItem.name?.toLowerCase().includes('weekend') || menuItem.name?.toLowerCase().includes('saturday') || menuItem.name?.toLowerCase().includes('sunday')) ? 'bg-purple-500' : 'bg-green-500'
                                }`}></span>
                                <span className="text-xs font-medium text-gray-600 capitalize">
                                  {(() => {
                                    const itemName = menuItem.name?.toLowerCase() || '';
                                    if (isWeekdayMenu(menuItem)) return 'Weekday';
                                    if (itemName.includes('weekend') || itemName.includes('saturday') || itemName.includes('sunday')) return 'Weekend';
                                    return 'Menu';
                                  })()}
                                </span>
                              </div>
                              {/* Show parent menu name */}
                              <p className="text-xs text-gray-500 mt-1 break-words">
                                From: {menuItem.menuName}
                              </p>
                            </div>
                            
                            {/* 3. Menu Category Names */}
                            <div className="mb-2">
                              {menuItem.categories && menuItem.categories.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {menuItem.categories.slice(0, 2).map((category) => (
                                    <span 
                                      key={category.id} 
                                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md border border-gray-200"
                                    >
                                      {category.name}
                                    </span>
                                  ))}
                                  {menuItem.categories.length > 2 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md border border-gray-200">
                                      +{menuItem.categories.length - 2} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Selection indicator */}
                            <div className={`absolute bottom-2 right-2 transition-all duration-300 ${
                              selectedMenu?.id === menuItem.id 
                                ? 'opacity-100' 
                                : 'opacity-0 group-hover:opacity-100'
                            }`}>
                              <div className="bg-blue-500 text-white rounded-full p-1 shadow-lg">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </div>

                            {/* Completely Out of Stock Warning */}
                            {completelyOutOfStock && (
                              <div className="absolute inset-0 bg-red-50/80 flex items-center justify-center rounded-lg">
                                <div className="text-center">
                                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                  </div>
                                  <p className="text-red-600 text-sm font-semibold">Cannot Purchase</p>
                                  <p className="text-red-500 text-xs">Zero stock available</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Desktop: Grid layout */}
              <div className="hidden lg:block">
                <div className="grid grid-cols-2 gap-4">
                {getFilteredMenus().map((menuItem) => {
                  const stockStatus = getStockStatus(menuItem);
                  const showOutOfStockLabel = shouldShowOutOfStockLabel(menuItem);
                  const completelyOutOfStock = isCompletelyOutOfStock(menuItem);
                  const autoSelectionInfo = getAutoSelectionInfo(menuItem);
                  
                  return (
                    <div 
                      key={menuItem.id}
                      className={`group relative overflow-hidden transition-all duration-500 hover:shadow-lg rounded-xl ${
                        selectedMenu?.id === menuItem.id 
                          ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-lg' 
                          : showOutOfStockLabel
                          ? 'border-2 border-red-300 bg-white'
                          : 'border border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => onMenuSelection(menuItem)}
                    >
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative p-4">
                        {/* Stock Status Badge - Moved below the header */}
                        {stockStatus && (
                          <div className={`mb-3 px-2 py-1 rounded-full text-xs font-semibold ${stockStatus.bgColor} ${stockStatus.color} ${stockStatus.borderColor} border inline-block`}>
                            {stockStatus.text}
                          </div>
                        )}
                        
                        {/* Auto-Selection Info Badge */}
                        {autoSelectionInfo && (
                          <div className={`mb-3 px-2 py-1 rounded-full text-xs font-semibold ${autoSelectionInfo.bgColor} ${autoSelectionInfo.color} ${autoSelectionInfo.borderColor} border inline-block`}>
                            <span className="mr-1">{autoSelectionInfo.icon}</span>
                            {autoSelectionInfo.text}
                          </div>
                        )}
                        
                        {/* 1. Menu Item Name and Price */}
                        <div className="mb-3">
                          <h4 className="font-bold text-base text-gray-800 break-words">{menuItem.name}</h4>
                          {menuItem.price > 0 && (
                            <p className="text-base font-semibold text-green-600 mt-1">
                              ₹{menuItem.price}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-block w-2 h-2 rounded-full ${
                              isWeekdayMenu(menuItem) ? 'bg-blue-500' : 
                              (menuItem.name?.toLowerCase().includes('weekend') || menuItem.name?.toLowerCase().includes('saturday') || menuItem.name?.toLowerCase().includes('sunday')) ? 'bg-purple-500' : 'bg-green-500'
                            }`}></span>
                            <span className="text-sm font-medium text-gray-600 capitalize">
                              {(() => {
                                const itemName = menuItem.name?.toLowerCase() || '';
                                if (isWeekdayMenu(menuItem)) return 'Weekday';
                                if (itemName.includes('weekend') || itemName.includes('saturday') || itemName.includes('sunday')) return 'Weekend';
                                return 'Menu';
                              })()}
                            </span>
                          </div>
                          {/* Show parent menu name */}
                          <p className="text-sm text-gray-500 mt-1 break-words">
                            From: {menuItem.menuName}
                          </p>
                        </div>
                        
                        {/* 3. Menu Category Names */}
                        <div className="mb-3">
                          {menuItem.categories && menuItem.categories.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {menuItem.categories.slice(0, 3).map((category) => (
                                <span 
                                  key={category.id} 
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md border border-gray-200"
                                >
                                  {category.name}
                                </span>
                              ))}
                              {menuItem.categories.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md border border-gray-200">
                                  +{menuItem.categories.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Selection indicator */}
                        <div className={`absolute bottom-3 right-3 transition-all duration-300 ${
                          selectedMenu?.id === menuItem.id 
                            ? 'opacity-100' 
                            : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          <div className="bg-blue-500 text-white rounded-full p-1.5 shadow-lg">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>

                        {/* Completely Out of Stock Warning */}
                        {completelyOutOfStock && (
                          <div className="absolute inset-0 bg-red-50/80 flex items-center justify-center rounded-xl">
                            <div className="text-center">
                              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                              </div>
                              <p className="text-red-600 text-base font-semibold">Cannot Purchase</p>
                              <p className="text-red-500 text-sm">Zero stock available</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>

              {!menusLoading && !menusError && getFilteredMenus().length === 0 && (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <svg className="w-6 h-6 sm:w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-base sm:text-lg font-semibold">
                    {dietaryPreference === 'veg' 
                      ? 'No vegetarian menus available' 
                      : dietaryPreference === 'non-veg'
                      ? 'No non-vegetarian menus available'
                      : 'No menus available'
                    }
                  </p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-2">
                    {dietaryPreference !== 'all' 
                      ? 'Try selecting a different preference or check back later'
                      : 'Please check back later for new menu options'
                    }
                  </p>
                  {/* Debug: Show why no menus are available */}
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl max-w-md mx-auto">
                    <p className="text-red-700 text-xs font-semibold">Debug: Why no menus?</p>
                    <p className="text-red-600 text-xs">Total menus: {menus.length}</p>
                    <p className="text-red-600 text-xs">Filtered menus: {getFilteredMenus().length}</p>
                    <p className="text-red-600 text-xs">Dietary preference: {dietaryPreference}</p>
                    {menus.length > 0 && (
                      <div className="mt-2">
                        <p className="text-red-600 text-xs font-semibold">Sample menu data:</p>
                        <pre className="text-red-500 text-xs bg-red-100 p-2 rounded overflow-auto">
                          {JSON.stringify(menus[0], null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MenuSelector; 