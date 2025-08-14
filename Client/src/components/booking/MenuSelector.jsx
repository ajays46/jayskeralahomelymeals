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
  orderMode
}) => {
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
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <div className="flex gap-4 min-w-max pl-4 pr-4">
                    {getFilteredMenus().map((menuItem) => (
                      <div 
                        key={menuItem.id}
                        className={`group relative overflow-hidden transition-all duration-500 hover:shadow-2xl rounded-xl w-72 flex-shrink-0 ${
                          selectedMenu?.id === menuItem.id 
                            ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-xl' 
                            : 'border-2 border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => onMenuSelection(menuItem)}
                      >
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <div className="relative p-4">
                          {/* 1. Menu Item Name and Price */}
                          <div className="mb-3">
                            <h4 className="font-bold text-base text-gray-800 break-words leading-tight">{menuItem.name}</h4>
                            {menuItem.price > 0 && (
                              <p className="text-sm font-semibold text-green-600 mt-1">
                                ₹{menuItem.price}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`inline-block w-2 h-2 rounded-full ${
                                isWeekdayMenu(menuItem) ? 'bg-blue-500' : 
                                menuItem.dayOfWeek?.toLowerCase().includes('weekend') ? 'bg-purple-500' : 'bg-green-500'
                              }`}></span>
                              <span className="text-xs font-medium text-gray-600 capitalize">
                                {menuItem.dayOfWeek || 'Menu'}
                              </span>
                            </div>
                            {/* Show parent menu name */}
                            <p className="text-xs text-gray-500 mt-2 break-words">
                              From: {menuItem.menuName}
                            </p>
                          </div>
                          
                          {/* 3. Menu Category Names */}
                          <div className="mb-3">
                            <h5 className="text-xs font-semibold text-gray-700 mb-2">Categories:</h5>
                            <div className="flex flex-wrap gap-1">
                              {menuItem.categories && menuItem.categories.length > 0 ? (
                                menuItem.categories.slice(0, 2).map((category) => (
                                  <span key={category.id} className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 text-xs font-medium px-2 py-1 rounded-full border border-purple-200">
                                    {category.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                  No categories
                                </span>
                              )}
                              {menuItem.categories && menuItem.categories.length > 2 && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                  +{menuItem.categories.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* 4. Meal Types Included */}
                          <div className="mb-3">
                            <h5 className="text-xs font-semibold text-gray-700 mb-2">Meal Types:</h5>
                            <div className="flex flex-wrap gap-1">
                              {menuItem.hasBreakfast && (
                                <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full border border-green-200">
                                  🍳
                                </span>
                              )}
                              {menuItem.hasLunch && (
                                <span className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 text-xs font-medium px-2 py-1 rounded-full border border-yellow-200">
                                  🍽️
                                </span>
                              )}
                              {menuItem.hasDinner && (
                                <span className="bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 text-xs font-medium px-2 py-1 rounded-full border border-pink-200">
                                  🌙
                                </span>
                              )}
                            </div>   
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop: Grid layout */}
              <div className="hidden lg:block">
                <div className="grid grid-cols-2 gap-6">
                {getFilteredMenus().map((menuItem) => (
                  <div 
                    key={menuItem.id}
                      className={`group relative overflow-hidden transition-all duration-500 hover:shadow-2xl rounded-3xl ${
                      selectedMenu?.id === menuItem.id 
                          ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-xl' 
                          : 'border-2 border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => onMenuSelection(menuItem)}
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                      <div className="relative p-6">
                      {/* 1. Menu Item Name and Price */}
                        <div className="mb-4">
                          <h4 className="font-bold text-xl text-gray-800 break-words">{menuItem.name}</h4>
                        {menuItem.price > 0 && (
                            <p className="text-lg font-semibold text-green-600 mt-1">
                            ₹{menuItem.price}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            isWeekdayMenu(menuItem) ? 'bg-blue-500' : 
                            menuItem.dayOfWeek?.toLowerCase().includes('weekend') ? 'bg-purple-500' : 'bg-green-500'
                          }`}></span>
                            <span className="text-sm font-medium text-gray-600 capitalize">
                            {menuItem.dayOfWeek || 'Menu'}
                          </span>
                        </div>
                        {/* Show parent menu name */}
                          <p className="text-sm text-gray-500 mt-1 break-words">
                          From: {menuItem.menuName}
                        </p>
                      </div>
                      
                        {/* 3. Menu Category Names */}
                        <div className="mb-4">
                          <h5 className="text-sm font-semibold text-gray-700 mb-2">Categories:</h5>
                          <div className="flex flex-wrap gap-2">
                          {menuItem.categories && menuItem.categories.length > 0 ? (
                            menuItem.categories.map((category) => (
                                <span key={category.id} className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 text-xs font-medium px-3 py-1.5 rounded-full border border-purple-200">
                                {category.name}
                              </span>
                            ))
                          ) : (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              No categories
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* 4. Meal Types Included */}
                        <div className="mb-4">
                          <h5 className="text-sm font-semibold text-gray-700 mb-2">Meal Types Included:</h5>
                          <div className="flex flex-wrap gap-2">
                          {menuItem.hasBreakfast && (
                              <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full border border-green-200">
                              🍳 Breakfast
                            </span>
                          )}
                          {menuItem.hasLunch && (
                              <span className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 text-xs font-medium px-3 py-1.5 rounded-full border border-yellow-200">
                              🍽️ Lunch
                            </span>
                          )}
                          {menuItem.hasDinner && (
                              <span className="bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 text-xs font-medium px-3 py-1.5 rounded-full border border-pink-200">
                              🌙 Dinner
                            </span>
                          )}
                        </div>   
                      </div>

                      {/* Selection indicator */}
                        <div className={`absolute bottom-4 right-4 transition-all duration-300 ${
                        selectedMenu?.id === menuItem.id 
                            ? 'opacity-100' 
                            : 'opacity-0 group-hover:opacity-100'
                      }`}>
                          <div className="bg-blue-500 text-white rounded-full p-2 shadow-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>

              {!menusLoading && !menusError && getFilteredMenus().length === 0 && (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <p className="text-gray-400 text-xs sm:text-sm mt-2">
                    {dietaryPreference !== 'all' 
                      ? 'Try selecting a different preference or check back later'
                      : 'Please check back later for new menu options'
                    }
                  </p>
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