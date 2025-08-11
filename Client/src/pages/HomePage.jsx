import React, { useState, useEffect } from 'react'
import { useUsersList } from '../hooks/userHooks/useLogin';
import Navbar from '../components/Navbar';
import AuthSlider from '../components/AuthSlider';
import vegBreakfastData from '../data/veg-breakfast.json';
import vegLunchData from '../data/veg-lunch.json';
import vegDinnerData from '../data/veg-dinner.json';
import nonVegBreakfastData from '../data/non-veg-breakfast.json';
import nonVegLunchData from '../data/non-veg-lunch.json';
import nonVegDinnerData from '../data/non-veg-dinner.json';

const HomePage = () => {
  const { data } = useUsersList();
  const [authSliderOpen, setAuthSliderOpen] = useState(false);

  const handleOpenAuthSlider = () => setAuthSliderOpen(true);
  const handleCloseAuthSlider = () => setAuthSliderOpen(false);

  // Get sample items from each meal category
  const sampleVegBreakfast = vegBreakfastData.slice(0, 3);
  const sampleVegLunch = vegLunchData.slice(0, 3);
  const sampleVegDinner = vegDinnerData.slice(0, 3);
  const sampleNonVegBreakfast = nonVegBreakfastData.slice(0, 3);
  const sampleNonVegLunch = nonVegLunchData.slice(0, 3);
  const sampleNonVegDinner = nonVegDinnerData.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <Navbar onSignInClick={handleOpenAuthSlider} />
      <AuthSlider isOpen={authSliderOpen} onClose={handleCloseAuthSlider} />
      
            {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="bg-[url('/banner_one.jpg')] bg-cover bg-center bg-no-repeat h-64 sm:h-80 md:h-96 lg:h-[400px] xl:h-[500px] flex items-center justify-center pt-16 sm:pt-18 md:pt-20 lg:pt-22">
          <div className="absolute inset-0 bg-black/40 sm:bg-black/35 md:bg-black/30"></div>
          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24">
            <div className="text-left sm:text-center max-w-3xl sm:max-w-4xl lg:max-w-5xl mx-auto pl-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                Discover Authentic
                <span className="block text-yellow-300 mt-1 sm:mt-2">Kerala Cuisine</span>
              </h1>
              <p className="hidden sm:block text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-6 sm:mb-8 leading-relaxed px-2 sm:px-4">
                Experience the rich flavors and traditional recipes from God's Own Country. 
                From spicy curries to aromatic rice dishes, every bite tells a story.
              </p>
              <div className="flex flex-row gap-3 sm:gap-4 justify-start sm:justify-center items-start sm:items-center">
                <a href="/jkhm/menu" className="w-auto">
                  <button className="w-auto bg-white hover:bg-gray-100 text-orange-600 px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-full font-semibold text-xs sm:text-sm md:text-base transition-all duration-300 transform hover:scale-105 shadow-lg">
                    Explore Menu
                  </button>
                </a>
                <button className="w-auto border-2 border-white text-white hover:bg-white hover:text-orange-600 px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-full font-semibold text-xs sm:text-sm md:text-base transition-all duration-300">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Items Section */}
      <section className="py-16 lg:py-20 bg-white relative">
        <div className="absolute inset-0 bg-[url('/pattern.jpg')] bg-repeat opacity-5"></div>
        <div className="relative z-10">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Featured Dishes
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Explore our carefully curated selection of traditional Kerala dishes by meal type
            </p>
          </div>

          {/* Breakfast Section */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-yellow-600 mb-2">Breakfast Delights</h3>
              <p className="text-gray-600">Start your day with traditional Kerala breakfast items</p>
            </div>
            
            {/* Vegetarian Breakfast */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-green-700 mb-4 text-center">Vegetarian Breakfast</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 max-w-6xl mx-auto">
                {sampleVegBreakfast.map((item, index) => (
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
                        <span className="bg-green-100 text-green-800 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-semibold">
                          Veg
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
            </div>

            {/* Non-Vegetarian Breakfast */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-red-700 mb-4 text-center">Non-Vegetarian Breakfast</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 max-w-6xl mx-auto">
                {sampleNonVegBreakfast.map((item, index) => (
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
                        <span className="bg-red-100 text-red-800 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-semibold">
                          Non-Veg
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
            </div>
          </div>

          {/* Lunch Section */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-green-600 mb-2">Lunch Specials</h3>
              <p className="text-gray-600">Traditional Kerala lunch with rice, curries, and sides</p>
            </div>
            
            {/* Vegetarian Lunch */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-green-700 mb-4 text-center">Vegetarian Lunch</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 max-w-6xl mx-auto">
                {sampleVegLunch.map((item, index) => (
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
                        <span className="bg-green-100 text-green-800 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-semibold">
                          Veg
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
            </div>

            {/* Non-Vegetarian Lunch */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-red-700 mb-4 text-center">Non-Vegetarian Lunch</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 max-w-6xl mx-auto">
                {sampleNonVegLunch.map((item, index) => (
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
                        <span className="bg-red-100 text-red-800 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-semibold">
                          Non-Veg
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
            </div>
          </div>

          {/* Dinner Section */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-purple-600 mb-2">Dinner Favorites</h3>
              <p className="text-gray-600">Light and delicious dinner options with traditional flavors</p>
            </div>
            
            {/* Vegetarian Dinner */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-green-700 mb-4 text-center">Vegetarian Dinner</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 max-w-6xl mx-auto">
                {sampleVegDinner.map((item, index) => (
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
                        <span className="bg-green-100 text-green-800 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-semibold">
                          Veg
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
            </div>

            {/* Non-Vegetarian Dinner */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-red-700 mb-4 text-center">Non-Vegetarian Dinner</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 max-w-6xl mx-auto">
                {sampleNonVegDinner.map((item, index) => (
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
                        <span className="bg-red-100 text-red-800 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-semibold">
                          Non-Veg
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
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Featured Meals Advertisement Section */}
      <section className="py-16 lg:py-20 bg-gradient-to-br from-orange-50 to-yellow-50">
        <div className="container mx-auto px-4">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              JAY'S KERALA HOMELY MEALS
            </h2>
            <p className="text-xl font-semibold text-orange-600 mb-2">
              Homely Meals Network
            </p>
            <p className="text-lg font-semibold text-blue-600 mb-2">
              NEW BREAKFAST-LUNCH-DINNER RATES
            </p>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Premium Homely Meals Network • Popular Menu Rates 5.0 ⭐
            </p>
          </div>

          {/* Popular Meal Plans Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12">
            {/* Popular Monthly Rates */}
            <div className="relative group">
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border-2 border-yellow-200 h-full">
                <div className="relative h-48 bg-gradient-to-br from-yellow-500 to-orange-600">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold mb-1">Popular Monthly</h3>
                      <p className="text-sm opacity-90">Best Value Plan</p>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-white text-sm font-semibold">Popular</span>
                  </div>
                </div>
                <div className="p-6 flex flex-col h-64">
                  <div className="space-y-4 mb-6 flex-grow">
                    <div className="bg-yellow-50 rounded-lg p-3 border-l-4 border-yellow-400">
                      <h4 className="font-bold text-yellow-800 text-sm mb-2">POPULAR MONTHLY RATES</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-green-800 text-sm">Veg</span>
                          <span className="font-bold text-green-600">₹6,900</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-red-800 text-sm">Non-veg</span>
                          <span className="font-bold text-red-600">₹8,100</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg font-semibold transition-colors duration-200">
                    Choose Popular Monthly
                  </button>
                </div>
              </div>
            </div>

                         {/* Popular Weekly Rates */}
             <div className="relative group">
               <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border-2 border-yellow-200 h-full">
                 <div className="relative h-48 bg-gradient-to-br from-yellow-500 to-orange-600">
                   <div className="absolute inset-0 bg-black/20"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="text-center text-white">
                       <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                         <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                         </svg>
                       </div>
                       <h3 className="text-2xl font-bold mb-1">Popular Weekly</h3>
                       <p className="text-sm opacity-90">Flexible Week Plans</p>
                     </div>
                   </div>
                   <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                     <span className="text-white text-sm font-semibold">Popular</span>
                   </div>
                 </div>
                 <div className="p-6 flex flex-col h-80">
                   <div className="space-y-4 mb-6 flex-grow">
                     <div className="bg-yellow-50 rounded-lg p-3 border-l-4 border-yellow-400">
                       <h4 className="font-bold text-yellow-800 text-sm mb-2">POPULAR WEEKLY RATES</h4>
                       <div className="space-y-3">
                         <div className="border-b border-gray-200 pb-2">
                           <p className="text-xs text-gray-600 mb-2">Monday-Sunday Full Week Plan</p>
                           <div className="flex justify-between items-center">
                             <span className="font-medium text-gray-800 text-sm">Veg</span>
                             <span className="font-bold text-green-600">₹1,610</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="font-medium text-gray-800 text-sm">Non-veg</span>
                             <span className="font-bold text-red-600">₹1,890</span>
                           </div>
                         </div>
                         <div>
                           <p className="text-xs text-gray-600 mb-2">Monday-Friday Week-Day Plan</p>
                           <div className="flex justify-between items-center">
                             <span className="font-medium text-gray-800 text-sm">Veg</span>
                             <span className="font-bold text-green-600">₹1,150</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="font-medium text-gray-800 text-sm">Non-veg</span>
                             <span className="font-bold text-red-600">₹1,350</span>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                   <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg font-semibold transition-colors duration-200">
                     Choose Popular Weekly
                   </button>
                 </div>
               </div>
             </div>

            {/* Popular Daily Rates */}
            <div className="relative group">
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border-2 border-yellow-200 h-full">
                <div className="relative h-48 bg-gradient-to-br from-yellow-500 to-orange-600">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold mb-1">Popular Daily</h3>
                      <p className="text-sm opacity-90">Pay Per Day</p>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-white text-sm font-semibold">Popular</span>
                  </div>
                </div>
                <div className="p-6 flex flex-col h-64">
                  <div className="space-y-4 mb-6 flex-grow">
                    <div className="bg-yellow-50 rounded-lg p-3 border-l-4 border-yellow-400">
                      <h4 className="font-bold text-yellow-800 text-sm mb-2">POPULAR DAILY RATES</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-800 text-sm">Veg</span>
                          <span className="font-bold text-green-600">₹230</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-800 text-sm">Non-veg</span>
                          <span className="font-bold text-red-600">₹270</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded-lg font-semibold transition-colors duration-200">
                    Choose Popular Daily
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Meal Plans Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12">
            {/* Premium Monthly Rates */}
            <div className="relative group">
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border-2 border-blue-200 h-full">
                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold mb-1">Premium Monthly</h3>
                      <p className="text-sm opacity-90">Luxury Plan</p>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-white text-sm font-semibold">Premium</span>
                  </div>
                </div>
                <div className="p-6 flex flex-col h-64">
                  <div className="space-y-4 mb-6 flex-grow">
                    <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                      <h4 className="font-bold text-blue-800 text-sm mb-2">PREMIUM MONTHLY RATES</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-green-800 text-sm">Veg</span>
                          <span className="font-bold text-green-600">₹9,000</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-red-800 text-sm">Non-veg</span>
                          <span className="font-bold text-red-600">₹10,500</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors duration-200">
                    Choose Premium Monthly
                  </button>
                </div>
              </div>
            </div>

                         {/* Premium Weekly Rates */}
             <div className="relative group">
               <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border-2 border-blue-200 h-full">
                 <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
                   <div className="absolute inset-0 bg-black/20"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="text-center text-white">
                       <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                         <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                         </svg>
                       </div>
                       <h3 className="text-2xl font-bold mb-1">Premium Weekly</h3>
                       <p className="text-sm opacity-90">Luxury Week Plans</p>
                     </div>
                   </div>
                   <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                     <span className="text-white text-sm font-semibold">Premium</span>
                   </div>
                 </div>
                 <div className="p-6 flex flex-col h-80">
                   <div className="space-y-4 mb-6 flex-grow">
                     <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                       <h4 className="font-bold text-blue-800 text-sm mb-2">PREMIUM WEEKLY RATES</h4>
                       <div className="space-y-3">
                         <div className="border-b border-gray-200 pb-2">
                           <p className="text-xs text-gray-600 mb-2">Monday-Sunday Full Week Plan</p>
                           <div className="flex justify-between items-center">
                             <span className="font-medium text-gray-800 text-sm">Veg</span>
                             <span className="font-bold text-green-600">₹2,100</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="font-medium text-gray-800 text-sm">Non-veg</span>
                             <span className="font-bold text-red-600">₹2,450</span>
                           </div>
                         </div>
                         <div>
                           <p className="text-xs text-gray-600 mb-2">Monday-Friday Week-Day Plan</p>
                           <div className="flex justify-between items-center">
                             <span className="font-medium text-gray-800 text-sm">Veg</span>
                             <span className="font-bold text-green-600">₹1,500</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="font-medium text-gray-800 text-sm">Non-veg</span>
                             <span className="font-bold text-red-600">₹1,750</span>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                   <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors duration-200">
                     Choose Premium Weekly
                   </button>
                 </div>
               </div>
             </div>

            {/* Premium Daily Rates */}
            <div className="relative group">
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border-2 border-blue-200 h-full">
                <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold mb-1">Premium Daily</h3>
                      <p className="text-sm opacity-90">Luxury Daily Plan</p>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-white text-sm font-semibold">Premium</span>
                  </div>
                </div>
                <div className="p-6 flex flex-col h-64">
                  <div className="space-y-4 mb-6 flex-grow">
                    <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                      <h4 className="font-bold text-blue-800 text-sm mb-2">PREMIUM DAILY RATES</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-800 text-sm">Veg</span>
                          <span className="font-bold text-green-600">₹300</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-800 text-sm">Non-veg</span>
                          <span className="font-bold text-red-600">₹350</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors duration-200">
                    Choose Premium Daily
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Flexible Rates */}
          <div className="max-w-6xl mx-auto mb-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-orange-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Daily Flexible Rates</h3>
                <p className="text-gray-600">Choose individual meals as per your preference</p>
              </div>
              
              {/* Popular Daily Flexible Rates */}
              <div className="mb-8">
                <h4 className="text-xl font-bold text-yellow-700 mb-4 text-center border-b-2 border-yellow-200 pb-2">
                  POPULAR DAILY FLEXIBLE RATES
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Breakfast */}
                  <div className="text-center p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                    <div className="w-12 h-12 mx-auto mb-3 bg-yellow-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Breakfast</h4>
                    <p className="text-2xl font-bold text-yellow-600">₹70</p>
                  </div>

                  {/* Lunch */}
                  <div className="text-center p-4 bg-green-50 rounded-xl border-2 border-green-200">
                    <div className="w-12 h-12 mx-auto mb-3 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Lunch</h4>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Veg <span className="font-bold text-green-600">₹90</span></p>
                      <p className="text-sm text-gray-600">Non-veg <span className="font-bold text-red-600">₹110</span></p>
                    </div>
                  </div>

                  {/* Dinner */}
                  <div className="text-center p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                    <div className="w-12 h-12 mx-auto mb-3 bg-purple-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Dinner</h4>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Veg <span className="font-bold text-green-600">₹80</span></p>
                      <p className="text-sm text-gray-600">Non-veg <span className="font-bold text-red-600">₹100</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Daily Flexible Rates */}
              <div>
                <h4 className="text-xl font-bold text-blue-700 mb-4 text-center border-b-2 border-blue-200 pb-2">
                  PREMIUM DAILY FLEXIBLE RATES
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Breakfast */}
                  <div className="text-center p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <div className="w-12 h-12 mx-auto mb-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Breakfast</h4>
                    <p className="text-2xl font-bold text-blue-600">₹90</p>
                  </div>

                  {/* Lunch */}
                  <div className="text-center p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <div className="w-12 h-12 mx-auto mb-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Lunch</h4>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Veg <span className="font-bold text-green-600">₹130</span></p>
                      <p className="text-sm text-gray-600">Non-veg <span className="font-bold text-red-600">₹160</span></p>
                    </div>
                  </div>

                  {/* Dinner */}
                  <div className="text-center p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <div className="w-12 h-12 mx-auto mb-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">Dinner</h4>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Veg <span className="font-bold text-green-600">₹110</span></p>
                      <p className="text-sm text-gray-600">Non-veg <span className="font-bold text-red-600">₹140</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Special Offer Banner */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-8 text-center text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">Start Your Meal Journey Today!</h3>
                <p className="text-lg mb-6 opacity-90">Experience authentic Kerala cuisine with our flexible meal plans. Choose what works best for you!</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg">
                    Order Now
                  </button>
                  <button className="border-2 border-white text-white hover:bg-white hover:text-orange-600 px-8 py-3 rounded-full font-semibold transition-all duration-300">
                    Contact Us
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage
