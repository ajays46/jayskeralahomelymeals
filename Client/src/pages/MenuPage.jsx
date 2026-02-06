/**
 * Copyright (c) 2025 JAYS KERALA INNOVATIONS PRIVATE LIMITED. All rights reserved.
 */

import React, { useState, useEffect } from 'react'
import Navbar from '../components/Navbar';
import AuthSlider from '../components/AuthSlider';
import { useTenant } from '../context/TenantContext';
import { getThemeForCompany } from '../config/tenantThemes';
import vegBreakfastData from '../data/veg-breakfast.json';
import vegLunchData from '../data/veg-lunch.json';
import vegDinnerData from '../data/veg-dinner.json';
import nonVegBreakfastData from '../data/non-veg-breakfast.json';
import nonVegLunchData from '../data/non-veg-lunch.json';
import nonVegDinnerData from '../data/non-veg-dinner.json';
import { FiChevronRight, FiX, FiGrid, FiHeart, FiZap } from 'react-icons/fi';
import CategoryGridModal from '../components/CategoryGridModal';

const MenuPage = () => {
  const [authSliderOpen, setAuthSliderOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMealType, setSelectedMealType] = useState('All');
  const [showCategoryGrid, setShowCategoryGrid] = useState(false);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [itemsToShow, setItemsToShow] = useState(8);

  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(tenant?.companyPath, tenant?.companyName);
  const accent = theme.accentColor || theme.primaryColor || '#FE8C00';
  const gradient = theme.homeGradient || 'from-orange-50 via-white to-orange-50';
  const isJlgMenu = theme.featuredProducts?.length > 0;

  const handleOpenAuthSlider = () => setAuthSliderOpen(true);
  const handleCloseAuthSlider = () => setAuthSliderOpen(false);

  // Define meal types
  const mealTypes = [
    { key: 'All', label: 'All Meals', icon: FiGrid },
    { key: 'breakfast', label: 'Breakfast', icon: FiZap },
    { key: 'lunch', label: 'Lunch', icon: FiHeart },
    { key: 'dinner', label: 'Dinner', icon: FiGrid }
  ];

  // Filter data based on selected category and meal type
  const getCategoryData = (category, mealType = 'All') => {
    let data = [];
    
    switch (category) {
      case 'All':
        // Combine all meal-specific data for 'All' category
        data = [
          ...vegBreakfastData, 
          ...vegLunchData, 
          ...vegDinnerData,
          ...nonVegBreakfastData,
          ...nonVegLunchData,
          ...nonVegDinnerData
        ];
        break;
      case 'Veg':
        if (mealType === 'breakfast') {
          data = vegBreakfastData;
        } else if (mealType === 'lunch') {
          data = vegLunchData;
        } else if (mealType === 'dinner') {
          data = vegDinnerData;
        } else {
          // For 'All' meal type, combine all veg meal data
          data = [...vegBreakfastData, ...vegLunchData, ...vegDinnerData];
        }
        break;
      case 'Non-veg':
        if (mealType === 'breakfast') {
          data = nonVegBreakfastData;
        } else if (mealType === 'lunch') {
          data = nonVegLunchData;
        } else if (mealType === 'dinner') {
          data = nonVegDinnerData;
        } else {
          // For 'All' meal type, combine all non-veg meal data
          data = [...nonVegBreakfastData, ...nonVegLunchData, ...nonVegDinnerData];
        }
        break;
      default:
        data = [];
    }

    return data;
  };

  // Update displayed items when category or meal type changes
  useEffect(() => {
    const filteredData = getCategoryData(selectedCategory, selectedMealType);
    setDisplayedItems(filteredData.slice(0, itemsToShow));
  }, [selectedCategory, selectedMealType, itemsToShow]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedMealType('All');
    setItemsToShow(8); // Reset to initial load
  };

  const handleMealTypeChange = (mealType) => {
    setSelectedMealType(mealType);
    setItemsToShow(8); // Reset to initial load
  };

  const loadMore = () => {
    setItemsToShow(prev => prev + 8);
  };

  const filteredItems = getCategoryData(selectedCategory, selectedMealType);
  const hasMoreItems = displayedItems.length < filteredItems.length;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradient}`}>
      <Navbar onSignInClick={handleOpenAuthSlider} />
      <AuthSlider isOpen={authSliderOpen} onClose={handleCloseAuthSlider} />
      
      {/* Hero Section - theme-driven */}
      <div className="relative overflow-hidden">
        <div
          className="bg-cover bg-center bg-no-repeat h-64 sm:h-56 md:h-64 lg:h-72 xl:h-80 flex items-center justify-center pt-16 sm:pt-18 md:pt-20 lg:pt-22"
          style={{ backgroundImage: `url('${theme.heroImage || '/banner_one.jpg'}')` }}
        >
          <div className="absolute inset-0 bg-black/50 sm:bg-black/35 md:bg-black/30"></div>
          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 md:py-20 lg:py-24 xl:py-28">
            <div className="text-left sm:text-center max-w-3xl sm:max-w-4xl lg:max-w-5xl mx-auto pt-14 sm:pt-12 md:pt-16 lg:pt-28 pb-8 sm:pb-12 md:pb-16 lg:pb-20">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl lg:pt-2 xl:text-6xl font-bold text-white mb-4 sm:mb-6 pl-2 leading-tight">
                {theme.heroTitle || 'Discover Authentic'}
                <span className="block mt-1 sm:mt-2" style={{ color: accent }}>{theme.heroSubtitle || 'Kerala Cuisine'}</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-6 sm:mb-8 leading-relaxed px-2 sm:px-4">
                {theme.heroDescription || "Experience the rich flavors and traditional recipes from God's Own Country. From spicy curries to aromatic rice dishes, every bite tells a story."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* JLG: single product grid. JKHM: Find by Category + meal types */}
      {isJlgMenu ? (
        <section className="py-10 lg:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {theme.featuredSectionTitle || 'Our Fresh Selection'}
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                {theme.featuredSectionSubtitle || 'Explore our carefully curated selection of fresh micro greens and leafy options.'}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
              {theme.featuredProducts.map((product, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group"
                >
                  <div className="relative overflow-hidden aspect-square">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3 sm:p-4 text-center">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm sm:text-base">{product.name}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
      <>
      {/* Find by Category Section */}
      <section className="py-10 lg:py-20 bg-white">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-left sm:text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Find by Category
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl sm:mx-auto">
              Choose your preference and discover our carefully curated selection of traditional Kerala dishes
            </p>
          </div>

          {/* Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 max-w-5xl mx-auto mb-12">
            {/* All Items Card */}
            <div 
              onClick={() => handleCategoryChange('All')}
              className="relative group cursor-pointer transition-all duration-300 transform hover:scale-105"
            >
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 h-40 md:h-48 flex flex-col justify-between text-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <FiGrid className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-xl md:text-2xl font-bold">{vegBreakfastData.length + vegLunchData.length + vegDinnerData.length + nonVegBreakfastData.length + nonVegLunchData.length + nonVegDinnerData.length}</div>
                    <div className="text-xs md:text-sm opacity-90">Total Items</div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold mb-2">All Items</h3>
                  <p className="text-xs md:text-sm opacity-90">Explore our complete menu with all available dishes</p>
                </div>
                {selectedCategory === 'All' && (
                  <div className="absolute top-3 right-3 w-5 h-5 md:w-6 md:h-6 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 md:w-4 md:h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Veg Items Card */}
            <div 
              onClick={() => handleCategoryChange('Veg')}
              className="relative group cursor-pointer transition-all duration-300 transform hover:scale-105"
            >
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 h-40 md:h-48 flex flex-col justify-between text-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <FiHeart className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-xl md:text-2xl font-bold">{vegBreakfastData.length + vegLunchData.length + vegDinnerData.length}</div>
                    <div className="text-xs md:text-sm opacity-90">Veg Items</div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold mb-2">Vegetarian</h3>
                  <p className="text-xs md:text-sm opacity-90">Fresh vegetables and traditional vegetarian delicacies</p>
                </div>
                {selectedCategory === 'Veg' && (
                  <div className="absolute top-3 right-3 w-5 h-5 md:w-6 md:h-6 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 md:w-4 md:h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Non-Veg Items Card */}
            <div 
              onClick={() => handleCategoryChange('Non-veg')}
              className="relative group cursor-pointer transition-all duration-300 transform hover:scale-105"
            >
              <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 h-40 md:h-48 flex flex-col justify-between text-white shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <FiZap className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="text-right">
                    <div className="text-xl md:text-2xl font-bold">{nonVegBreakfastData.length + nonVegLunchData.length + nonVegDinnerData.length}</div>
                    <div className="text-xs md:text-sm opacity-90">Non-Veg Items</div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold mb-2">Non-Vegetarian</h3>
                  <p className="text-xs md:text-sm opacity-90">Spicy meat and seafood dishes with authentic flavors</p>
                </div>
                {selectedCategory === 'Non-veg' && (
                  <div className="absolute top-3 right-3 w-5 h-5 md:w-6 md:h-6 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 md:w-4 md:h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Meal Type Selector - Only show for Veg and Non-veg */}
          {(selectedCategory === 'Veg' || selectedCategory === 'Non-veg') && (
            <div className="max-w-4xl mx-auto mb-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose Meal Type</h3>
                <p className="text-gray-600">Select your preferred meal time</p>
              </div>
              
              {/* Desktop Tabs */}
              <div className="hidden md:flex justify-center">
                <div className="bg-gray-100 rounded-full p-1 flex">
                  {mealTypes.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <button
                        key={type.key}
                        onClick={() => handleMealTypeChange(type.key)}
                        className={`px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                          selectedMealType === type.key
                            ? 'bg-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        style={selectedMealType === type.key ? { color: accent } : undefined}
                      >
                        <IconComponent className="w-4 h-4" />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Dropdown */}
              <div className="md:hidden">
                <select
                  value={selectedMealType}
                  onChange={(e) => handleMealTypeChange(e.target.value)}
                  className="w-full max-w-xs mx-auto block px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  {mealTypes.map((type) => (
                    <option key={type.key} value={type.key}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 max-w-6xl mx-auto">
            {displayedItems.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg sm:rounded-xl shadow-sm sm:shadow-md hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.product_name}
                    className="w-full h-32 sm:h-40 lg:h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                    <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-semibold ${
                      item.category.includes('Non-veg') 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="p-2 sm:p-3 lg:p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 line-clamp-2 text-xs sm:text-sm lg:text-base">{item.product_name}</h3>
                  {item.malayalam_name && (
                    <p className="text-gray-500 text-xs mb-1 sm:mb-2 italic">{item.malayalam_name}</p>
                  )}

                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMoreItems && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                className="text-white px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                style={{ backgroundColor: accent }}
              >
                Load More Items
              </button>
            </div>
          )}

          {/* No Items Message */}
          {displayedItems.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 md:w-12 md:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-600">Try selecting a different category or meal type</p>
            </div>
          )}
        </div>
      </section>
      </>
      )}
    </div>
  );
};

export default MenuPage; 