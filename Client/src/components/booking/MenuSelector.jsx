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
    <div className="mb-8">
      <div 
        className="group relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-3xl cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]"
        onClick={() => onToggleSection('menus')}
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white shadow-lg border border-white/20">
                <MdRestaurant className="text-3xl" />
              </div>
              <div>
                <h2 className="text-white font-bold text-2xl lg:text-3xl mb-2">Available Menu Plans</h2>
                <p className="text-blue-100 text-lg">Select from our curated menu options</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/20">
                <span className="text-white font-semibold text-lg">
                  {menus.length} {menus.length === 1 ? 'Menu' : 'Menus'} Available
                </span>
              </div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                {expandedSections.menus ? (
                  <MdExpandLess className="text-white text-2xl" />
                ) : (
                  <MdExpandMore className="text-white text-2xl" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {expandedSections.menus && (
        <div className="bg-white rounded-xl p-6 mt-4 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-gray-800">Select a Menu Plan</h3>
              {menusLoading && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {orderMode === 'daily-flexible' 
                ? 'Click on a menu to assign it to selected dates'
                : 'Click on a menu to view details'
              }
            </div>
          </div>

          {/* Loading State */}
          {menusLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500 text-lg">Loading available menus...</p>
              <p className="text-gray-400 text-sm mt-2">Please wait while we fetch the latest menu options</p>
            </div>
          )}

          {/* Error State */}
          {menusError && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-500 text-lg font-semibold">Error loading menus</p>
              <p className="text-gray-500 text-sm mt-2">Please try again later or contact support</p>
            </div>
          )}

          {/* Menu Cards */}
          {!menusLoading && !menusError && (
            <div>
              {/* Dietary Preference Filter */}
              <div className="mb-8">
                <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
                  Choose Your Preference
                </h4>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => onDietaryPreferenceChange('veg')}
                    className={`group relative overflow-hidden px-8 py-4 rounded-2xl border-2 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
                      dietaryPreference === 'veg'
                        ? 'border-green-500 bg-gradient-to-r from-green-500 to-emerald-600 text-white transform scale-105 shadow-green-200'
                        : 'border-green-300 bg-white text-green-700 hover:bg-green-50 hover:border-green-400 hover:scale-105'
                    }`}
                  >
                    <span className="text-2xl mr-2">🥬</span>
                    Vegetarian
                  </button>
                  <button 
                    onClick={() => onDietaryPreferenceChange('non-veg')}
                    className={`group relative overflow-hidden px-8 py-4 rounded-2xl border-2 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl ${
                      dietaryPreference === 'non-veg'
                        ? 'border-red-500 bg-gradient-to-r from-red-500 to-pink-600 text-white transform scale-105 shadow-red-200'
                        : 'border-red-300 bg-white text-red-700 hover:bg-red-50 hover:border-red-400 hover:scale-105'
                    }`}
                  >
                    <span className="text-2xl mr-2">🍖</span>
                    Non-Vegetarian
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {getFilteredMenus().map((menu) => (
                  <div 
                    key={menu.id}
                    className={`group relative overflow-hidden transition-all duration-500 hover:shadow-2xl rounded-3xl ${
                      selectedMenu?.id === menu.id 
                        ? 'border-2 border-blue-500 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-xl transform scale-105' 
                        : 'border-2 border-gray-200 hover:border-blue-300 hover:scale-105'
                    }`}
                    onClick={() => onMenuSelection(menu)}
                  >
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative p-6">
                      {/* 1. Menu Name (First) */}
                      <div className="mb-4">
                        <h4 className="font-bold text-xl text-gray-800">{menu.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            isWeekdayMenu(menu) ? 'bg-blue-500' : 
                            menu.dayOfWeek?.toLowerCase().includes('weekend') ? 'bg-purple-500' : 'bg-green-500'
                          }`}></span>
                          <span className="text-xs font-medium text-gray-600 capitalize">
                            {menu.dayOfWeek || 'Menu'}
                          </span>
                        </div>
                      </div>
                      
                      
                      
                      {/* 3. Menu Category Names (Third) */}
                      <div className="mb-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Categories:</h5>
                        <div className="flex flex-wrap gap-2">
                          {menu.categories && menu.categories.length > 0 ? (
                            menu.categories.map((category) => (
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
                           {menu.hasBreakfast && (
                             <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full border border-green-200">
                               🍳 Breakfast
                             </span>
                           )}
                           {menu.hasLunch && (
                             <span className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 text-xs font-medium px-3 py-1.5 rounded-full border border-yellow-200">
                               🍽️ Lunch
                             </span>
                           )}
                           {menu.hasDinner && (
                             <span className="bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 text-xs font-medium px-3 py-1.5 rounded-full border border-pink-200">
                               🌙 Dinner
                             </span>
                           )}
                                                   </div>   
                       </div>

                      {/* Selection indicator */}
                      <div className={`absolute bottom-4 right-4 transition-all duration-300 ${
                        selectedMenu?.id === menu.id 
                          ? 'opacity-100 scale-100' 
                          : 'opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100'
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

              {!menusLoading && !menusError && getFilteredMenus().length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg font-semibold">
                    {dietaryPreference === 'veg' 
                      ? 'No vegetarian menus available' 
                      : dietaryPreference === 'non-veg'
                      ? 'No non-vegetarian menus available'
                      : 'No menus available'
                    }
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
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