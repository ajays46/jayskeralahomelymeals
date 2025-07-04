import React, { useState, useRef } from 'react'
import { useUsersList } from '../hooks/userHooks/useLogin';
import Navbar from '../components/Navbar';
import AuthSlider from '../components/AuthSlider';
import dummyData from '../data/dummy.json';
import vegData from '../data/veg.json';
import nonVegData from '../data/non-veg.json';
import vegComboData from '../data/veg-combo.json';
import nonVegComboData from '../data/non-veg-combo.json';
import riceData from '../data/rice.json';
import sidesData from '../data/sides.json';
import saladData from '../data/salad.json';
import vegCurryData from '../data/veg-curry.json';
import { FiChevronRight, FiX } from 'react-icons/fi';
import CategoryGridModal from '../components/CategoryGridModal';

const HomePage = () => {
  const { data } = useUsersList();
  const [authSliderOpen, setAuthSliderOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCategoryGrid, setShowCategoryGrid] = useState(false);
  const categoryRef = useRef(null);
  const handleOpenAuthSlider = () => setAuthSliderOpen(true);
  const handleCloseAuthSlider = () => setAuthSliderOpen(false);

  // Unique categories with images
  const allCategories = [
    { name: 'All', image: '/combo.png' },
    ...[...new Set(dummyData.map(item => item.category))].map(cat => ({
      name: cat,
      image: (() => {
        switch (cat) {
          case 'Veg': return '/veg.png';
          case 'Non-veg': return '/Non-veg.png';
          case 'Combo': return '/combo.png';
          case 'Rice': return '/rice.png';
          case 'Sides': return '/Sides.png';
          case 'Salad': return '/salad.png';
          case 'Veg Curry': return '/thaninadan.png';
          default: return dummyData.find(item => item.category === cat)?.image || '/combo.png';
        }
      })()
    })),
    { name: 'Combo', image: '/combo.png' }
  ];

  // Define subcategory groups for 'All' category
  const allGroups = [
    {
      key: 'Veg Curry',
      title: 'Veg ',
      icon: '/thaninadan.png',
      subtitle: 'Assorted vegetarian curries',
      data: vegCurryData,
      color: 'green'
    },
    {
      key: 'Non-veg',
      title: 'Non-veg ',
      icon: '/Non-veg.png',
      subtitle: 'Assorted non-vegetarian curries',
      data: nonVegData,
      color: 'red'
    },
    {
      key: 'Rice',
      title: 'Rice',
      icon: '/rice.png',
      subtitle: 'Rice varieties',
      data: riceData,
      color: 'yellow'
    },
    {
      key: 'Sides',
      title: 'Sides',
      icon: '/Sides.png',
      subtitle: 'Tasty sides',
      data: sidesData,
      color: 'orange'
    },
    {
      key: 'Salad',
      title: 'Salad',
      icon: '/salad.png',
      subtitle: 'Fresh salads',
      data: saladData,
      color: 'lime'
    },
  ];

  // Filter data based on selected category
  const getCategoryData = (category) => {
    switch (category) {
      case 'All':
        return dummyData;
      case 'Veg':
        return vegData;
      case 'Non-veg':
        return nonVegData;
      case 'Combo':
        return [...vegComboData, ...nonVegComboData];
      case 'Rice':
        return riceData;
      case 'Sides':
        return sidesData;
      case 'Salad':
        return saladData;
      case 'Veg Curry':
        return vegCurryData;
      default:
        return dummyData.filter(item => item.category === category);
    }
  };

  const filteredData = getCategoryData(selectedCategory);

  // Get category image
  const getCategoryImage = (category) => {
    switch (category) {
      case 'Veg':
        return '/veg.png';
      case 'Non-veg':
        return '/Non-veg.png';
      case 'Combo':
        return '/combo.png';
      case 'Rice':
        return '/rice.png';
      case 'Sides':
        return '/Sides.png';
      case 'Salad':
        return '/salad.png';
      case 'Veg Curry':
        return '/thaninadan.png';
      default:
        return dummyData.find(item => item.category === category)?.image || '/combo.png';
    }
  };
  return (
    <div>
      <header>
        <div className='bg-[url("/banner_one.jpg")] bg-cover bg-center h-52 lg:h-[400px] flex items-center justify-center'>
          <Navbar onSignInClick={handleOpenAuthSlider} />
        </div>
      </header>
      <AuthSlider isOpen={authSliderOpen} onClose={handleCloseAuthSlider} />
      <main className='max-w-8xl mx-auto px-2 sm:px-4 lg:px-20 py-0'  style={{
            backgroundImage: "url('/pattern.jpg')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundColor: "rgba(255,255,255,0.97)",
            backgroundBlendMode: "lighten"
          }}>
      <div className="p-4 pt-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#FE8C00] to-orange-500 bg-clip-text text-transparent drop-shadow">Find by Category</h2>
          </div>
          <button 
            onClick={() => setShowCategoryGrid(v => !v)}
            className="flex lg:hidden items-center gap-1 text-[#FE8C00] font-semibold text-base sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[#FE8C00] hover:bg-[#FE8C00] hover:text-white transition shadow-sm"
          >
            {showCategoryGrid ? (
              <>
                Close <FiX className="inline text-lg sm:text-xl" />
              </>
            ) : (
              <>
                See All <FiChevronRight className="inline text-lg sm:text-xl" />
              </>
            )}
          </button>
        </div>
        {/* Category Avatars - Dynamic rendering */}
        {!showCategoryGrid && (
          <div ref={categoryRef} className="category-scroll-section flex gap-3 sm:gap-6 mb-8 sm:mb-10 lg:pt-2 pt-1 scrollbar-hide overflow-x-auto pb-2">
            {allCategories.map((cat) => (
              <div
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className="flex flex-col items-center group cursor-pointer min-w-[70px] sm:min-w-[90px]"
              >
                <div className={`w-12 h-12 sm:w-20 sm:h-20 rounded-full border-4 ${selectedCategory === cat.name ? 'border-[#FE8C00] bg-orange-50' : 'border-gray-200 bg-white'} flex items-center justify-center overflow-hidden mb-1 sm:mb-2 shadow-lg group-hover:scale-105 group-hover:shadow-xl transition`}>
                  <img src={cat.image} alt={cat.name} className="object-cover w-full h-full" />
                </div>
                <span className={`text-xs sm:text-sm font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow ${selectedCategory === cat.name ? 'bg-[#FE8C00] text-white' : 'bg-gray-100 text-gray-700'} group-hover:bg-[#FE8C00] group-hover:text-white transition`}>{cat.name}</span>
              </div>
            ))}
          </div>
        )}
        {/* Category Grid - show when showCategoryGrid is true */}
        {showCategoryGrid && (
          <div className="mb-8">
            <div className="grid grid-cols-3 gap-4">
              {allCategories.map((cat, idx) => (
                <div
                  key={cat.name}
                  onClick={() => {
                    setSelectedCategory(cat.name);
                    setShowCategoryGrid(false);
                  }}
                  className="flex flex-col items-center cursor-pointer group"
                >
                  <div className={`w-16 h-16 rounded-full border-2 ${selectedCategory === cat.name ? 'border-[#FE8C00] bg-orange-50' : 'border-gray-200 bg-white'} flex items-center justify-center overflow-hidden mb-1 shadow group-hover:scale-105 group-hover:shadow-xl transition`}>
                    <img src={cat.image} alt={cat.name} className="object-cover w-full h-full" />
                  </div>
                  <span className={`text-xs font-semibold text-gray-700 text-center group-hover:text-[#FE8C00] transition`}>{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </main>
      <section className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-20 py-0">
        
        {/* Food Cards */}
        <div className="relative">
          {/* Mobile horizontal scroll grid */}
          <div className="block lg:hidden">
            {selectedCategory === 'Combo' ? (
              <>
                {/* Veg Combo Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-green-600 mb-4 px-2 flex items-center gap-2">
                    <img src="/veg.png" alt="Veg" className="w-6 h-6" />
                    Veg Combo
                  </h3>
                  <div className="overflow-x-auto">
                    <div className="grid grid-rows-2 grid-flow-col gap-x-2 gap-y-4 min-w-[320px]" style={{ minHeight: '150px' }}>
                      {vegComboData.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-xl hover:shadow-2xl border border-gray-100 hover:border-[#FE8C00] p-0 flex flex-col items-center transition group cursor-pointer w-[calc(50vw-1rem)] min-w-[140px] max-w-[180px] overflow-hidden">
                          <div className="relative w-full h-[80px] flex-shrink-0">
                            <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                            {/* Overlay gradient and promo text */}
                            <div className="absolute bottom-0 left-0 w-full h-7 bg-gradient-to-t from-black/80 to-transparent flex items-end px-2 pb-1">
                              <span className="text-white font-bold text-[10px] tracking-wide drop-shadow">ITEMS AT ₹{item.price}</span>
                            </div>
                          </div>
                          <div className="w-full flex flex-col items-start px-2 pt-1 pb-2">
                            <span className="font-bold text-gray-900 text-[11px] mb-1 group-hover:text-[#FE8C00] transition line-clamp-2">{item.product_name}</span>
                            {item.malayalam_name && (
                              <span className="font-medium text-gray-700 text-[9px] mb-1 line-clamp-1">{item.malayalam_name}</span>
                            )}
                            <span className={`flex items-center gap-2 font-semibold text-[10px] mb-1 ${item.category === 'Non-veg' || item.category === 'Non-veg Combo' ? 'text-red-600' : 'text-green-600'}`}>
                              <svg xmlns='http://www.w3.org/2000/svg' className='inline w-2.5 h-2.5' fill='currentColor' viewBox='0 0 20 20'><circle cx='10' cy='10' r='10' /></svg>
                              {item.rating || 4.3}
                            </span>
                            <span className="text-gray-500 text-[9px] mb-1 capitalize">{item.category}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Non-veg Combo Section */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-red-600 mb-4 px-2 flex items-start gap-2">
                    <img src="/Non-veg.png" alt="Non-veg" className="w-6 h-6" />
                    Non-veg Combo
                  </h3>
                  <div className="overflow-x-auto">
                    <div className="grid grid-rows-2 grid-flow-col gap-x-2 gap-y-4 min-w-[320px]" style={{ minHeight: '150px' }}>
                      {nonVegComboData.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-xl shadow-xl hover:shadow-2xl border border-gray-100 hover:border-[#FE8C00] p-0 flex flex-col items-center transition group cursor-pointer w-[calc(50vw-1rem)] min-w-[140px] max-w-[180px] overflow-hidden">
                          <div className="relative w-full h-[80px] flex-shrink-0">
                            <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                            {/* Overlay gradient and promo text */}
                            <div className="absolute bottom-0 left-0 w-full h-7 bg-gradient-to-t from-black/80 to-transparent flex items-end px-2 pb-1">
                              <span className="text-white font-bold text-[10px] tracking-wide drop-shadow">ITEMS AT ₹{item.price}</span>
                            </div>
                          </div>
                          <div className="w-full flex flex-col items-start px-2 pt-1 pb-2">
                            <span className="font-bold text-gray-900 text-[11px] mb-1 group-hover:text-[#FE8C00] transition line-clamp-2">{item.product_name}</span>
                            {item.malayalam_name && (
                              <span className="font-medium text-gray-700 text-[9px] mb-1 line-clamp-1">{item.malayalam_name}</span>
                            )}
                            <span className={`flex items-center gap-2 font-semibold text-[10px] mb-1 ${item.category === 'Non-veg' || item.category === 'Non-veg Combo' ? 'text-red-600' : 'text-green-600'}`}>
                              <svg xmlns='http://www.w3.org/2000/svg' className='inline w-2.5 h-2.5' fill='currentColor' viewBox='0 0 20 20'><circle cx='10' cy='10' r='10' /></svg>
                              {item.rating || 4.3}
                            </span>
                            <span className="text-gray-500 text-[9px] mb-1 capitalize">{item.category}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : selectedCategory === 'All' ? (
              <>
                {allGroups.map((group, gidx) => (
                  <div key={group.key} className="mb-6">
                    {/* Section Header */}
                    <div className="flex items-center gap-3 mb-4 px-2">
                      <div className={`w-10 h-10 rounded-full bg-${group.color}-100 flex items-center justify-center`}>
                        <img src={group.icon} alt={group.title} className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">{group.title}</div>
                        <div className="text-gray-500 text-xs -mt-1">{group.subtitle}</div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <div className="grid grid-rows-2 grid-flow-col gap-x-2 gap-y-4 min-w-[320px]" style={{ minHeight: '150px' }}>
                        {group.data.map((item, idx) => (
                          <div key={idx} className="bg-white rounded-xl shadow-xl hover:shadow-2xl border border-gray-100 hover:border-[#FE8C00] p-0 flex flex-col items-center transition group cursor-pointer w-[calc(50vw-1rem)] min-w-[140px] max-w-[180px] overflow-hidden">
                            <div className="relative w-full h-[80px] flex-shrink-0">
                              <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                              {/* Overlay gradient and promo text */}
                              <div className="absolute bottom-0 left-0 w-full h-7 bg-gradient-to-t from-black/80 to-transparent flex items-end px-2 pb-1">
                                <span className="text-white font-bold text-[10px] tracking-wide drop-shadow">ITEMS AT ₹{item.price}</span>
                              </div>
                            </div>
                            <div className="w-full flex flex-col items-start px-2 pt-1 pb-2">
                              <span className="font-bold text-gray-900 text-[11px] mb-1 group-hover:text-[#FE8C00] transition line-clamp-2">{item.product_name}</span>
                              {item.malayalam_name && (
                                <span className="font-medium text-gray-700 text-[9px] mb-1 line-clamp-1">{item.malayalam_name}</span>
                              )}
                              <span className={`flex items-center gap-2 font-semibold text-[10px] mb-1 ${item.category === 'Non-veg' || item.category === 'Non-veg Combo' ? 'text-red-600' : 'text-green-600'}`}>
                                <svg xmlns='http://www.w3.org/2000/svg' className='inline w-2.5 h-2.5' fill='currentColor' viewBox='0 0 20 20'><circle cx='10' cy='10' r='10' /></svg>
                                {item.rating || 4.3}
                              </span>
                              <span className="text-gray-500 text-[9px] mb-1 capitalize">{item.category}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="overflow-x-auto">
                <div className="grid grid-rows-2 grid-flow-col gap-x-2 gap-y-4 min-w-[320px]" style={{ minHeight: '150px' }}>
                  {filteredData.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-xl hover:shadow-2xl border border-gray-100 hover:border-[#FE8C00] p-0 flex flex-col items-center transition group cursor-pointer w-[calc(50vw-1rem)] min-w-[140px] max-w-[180px] overflow-hidden">
                      <div className="relative w-full h-[80px] flex-shrink-0">
                        <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                        {/* Overlay gradient and promo text */}
                        <div className="absolute bottom-0 left-0 w-full h-7 bg-gradient-to-t from-black/80 to-transparent flex items-end px-2 pb-1">
                          <span className="text-white font-bold text-[10px] tracking-wide drop-shadow">ITEMS AT ₹{item.price}</span>
                        </div>
                      </div>
                      <div className="w-full flex flex-col items-start px-2 pt-1 pb-2">
                        <span className="font-bold text-gray-900 text-[11px] mb-1 group-hover:text-[#FE8C00] transition line-clamp-2">{item.product_name}</span>
                        {item.malayalam_name && (
                          <span className="font-medium text-gray-700 text-[9px] mb-1 line-clamp-1">{item.malayalam_name}</span>
                        )}
                        <span className={`flex items-center gap-2 font-semibold text-[10px] mb-1 ${item.category === 'Non-veg' || item.category === 'Non-veg Combo' ? 'text-red-600' : 'text-green-600'}`}>
                          <svg xmlns='http://www.w3.org/2000/svg' className='inline w-2.5 h-2.5' fill='currentColor' viewBox='0 0 20 20'><circle cx='10' cy='10' r='10' /></svg>
                          {item.rating || 4.3}
                        </span>
                        <span className="text-gray-500 text-[9px] mb-1 capitalize">{item.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Desktop grid */}
          <div className="hidden lg:grid mx-auto grid-cols-5 gap-x-[280px] gap-y-10 justify-items-center">
            {selectedCategory === 'Combo' ? (
              <>
                {/* Veg Combo Section */}
                <div className="col-span-5 mb-8">
                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <img src="/veg.png" alt="Veg" className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">Veg Combo</div>
                      <div className="text-gray-500 text-sm -mt-1">Assorted vegetarian combos</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-x-[280px] gap-y-20 justify-items-center">
                    {vegComboData.map((item, idx) => (
                      <div key={idx} className="bg-white rounded-3xl shadow-xl hover:shadow-2xl border border-gray-100 hover:border-[#FE8C00] p-0 flex flex-col w-[95%] min-w-[270px] max-w-[320px] transition group cursor-pointer overflow-hidden">
                        <div className="relative w-full h-[180px] flex-shrink-0">
                          <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                          {/* Overlay gradient and promo text */}
                          <div className="absolute bottom-0 left-0 w-full h-14 bg-gradient-to-t from-black/80 to-transparent flex items-end px-4 pb-2">
                            <span className="text-white font-bold text-lg tracking-wide drop-shadow">ITEMS AT ₹{item.price}</span>
                          </div>
                        </div>
                        <div className="w-full flex flex-col items-start px-4 pt-3 pb-6">
                          <span className="font-bold text-gray-900 text-lg mb-1 group-hover:text-[#FE8C00] transition">{item.product_name}</span>
                          {item.malayalam_name && (
                            <span className="font-medium text-gray-700 text-sm mb-1 line-clamp-1">{item.malayalam_name}</span>
                          )}
                          <span className={`flex items-center gap-2 font-semibold text-sm mb-1 ${item.category === 'Non-veg' || item.category === 'Non-veg Combo' ? 'text-red-600' : 'text-green-600'}`}>
                            <svg xmlns='http://www.w3.org/2000/svg' className='inline w-4 h-4' fill='currentColor' viewBox='0 0 20 20'><circle cx='10' cy='10' r='10' /></svg>
                            {item.rating || 4.3}
                          </span>
                          <span className="text-gray-500 text-sm mb-1 capitalize">{item.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Non-veg Combo Section */}
                <div className="col-span-5 mb-8">
                  {/* Section Header */}
                  <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <img src="/Non-veg.png" alt="Non-veg" className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-900">Non-veg Combo</div>
                      <div className="text-gray-500 text-sm -mt-1">Assorted non-vegetarian combos</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-x-[280px] gap-y-20 justify-items-center">
                    {nonVegComboData.map((item, idx) => (
                      <div key={idx} className="bg-white rounded-3xl shadow-xl hover:shadow-2xl border border-gray-100 hover:border-[#FE8C00] p-0 flex flex-col w-[95%] min-w-[270px] max-w-[320px] transition group cursor-pointer overflow-hidden">
                        <div className="relative w-full h-[180px] flex-shrink-0">
                          <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                          {/* Overlay gradient and promo text */}
                          <div className="absolute bottom-0 left-0 w-full h-14 bg-gradient-to-t from-black/80 to-transparent flex items-end px-4 pb-2">
                            <span className="text-white font-bold text-lg tracking-wide drop-shadow">ITEMS AT ₹{item.price}</span>
                          </div>
                        </div>
                        <div className="w-full flex flex-col items-start px-4 pt-3 pb-6">
                          <span className="font-bold text-gray-900 text-lg mb-1 group-hover:text-[#FE8C00] transition">{item.product_name}</span>
                          {item.malayalam_name && (
                            <span className="font-medium text-gray-700 text-sm mb-1 line-clamp-1">{item.malayalam_name}</span>
                          )}
                          <span className={`flex items-center gap-2 font-semibold text-sm mb-1 ${item.category === 'Non-veg' || item.category === 'Non-veg Combo' ? 'text-red-600' : 'text-green-600'}`}>
                            <svg xmlns='http://www.w3.org/2000/svg' className='inline w-4 h-4' fill='currentColor' viewBox='0 0 20 20'><circle cx='10' cy='10' r='10' /></svg>
                            {item.rating || 4.3}
                          </span>
                          <span className="text-gray-500 text-sm mb-1 capitalize">{item.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : selectedCategory === 'All' ? (
              <>
                {allGroups.map((group, gidx) => (
                  <div key={group.key} className="col-span-5 mb-8">
                    {/* Section Header */}
                    <div className="flex items-center gap-3 mb-4 px-2">
                      <div className={`w-10 h-10 rounded-full bg-${group.color}-100 flex items-center justify-center`}>
                        <img src={group.icon} alt={group.title} className="w-7 h-7" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-gray-900">{group.title}</div>
                        <div className="text-gray-500 text-sm -mt-1">{group.subtitle}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-x-[280px] gap-y-20 justify-items-center">
                      {group.data.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-3xl shadow-xl hover:shadow-2xl border border-gray-100 hover:border-[#FE8C00] p-0 flex flex-col w-[95%] min-w-[270px] max-w-[320px] transition group cursor-pointer overflow-hidden">
                          <div className="relative w-full h-[180px] flex-shrink-0">
                            <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                            {/* Overlay gradient and promo text */}
                            <div className="absolute bottom-0 left-0 w-full h-14 bg-gradient-to-t from-black/80 to-transparent flex items-end px-4 pb-2">
                              <span className="text-white font-bold text-lg tracking-wide drop-shadow">ITEMS AT ₹{item.price}</span>
                            </div>
                          </div>
                          <div className="w-full flex flex-col items-start px-4 pt-3 pb-6">
                            <span className="font-bold text-gray-900 text-lg mb-1 group-hover:text-[#FE8C00] transition">{item.product_name}</span>
                            {item.malayalam_name && (
                              <span className="font-medium text-gray-700 text-sm mb-1 line-clamp-1">{item.malayalam_name}</span>
                            )}
                            <span className={`flex items-center gap-2 font-semibold text-sm mb-1 ${item.category === 'Non-veg' || item.category === 'Non-veg Combo' ? 'text-red-600' : 'text-green-600'}`}>
                              <svg xmlns='http://www.w3.org/2000/svg' className='inline w-4 h-4' fill='currentColor' viewBox='0 0 20 20'><circle cx='10' cy='10' r='10' /></svg>
                              {item.rating || 4.3}
                            </span>
                            <span className="text-gray-500 text-sm mb-1 capitalize">{item.category}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              filteredData.map((item, idx) => (
                <div key={idx} className="bg-white rounded-3xl shadow-xl hover:shadow-2xl border border-gray-100 hover:border-[#FE8C00] p-0 flex flex-col w-[95%] min-w-[270px] max-w-[320px] transition group cursor-pointer overflow-hidden">
                  <div className="relative w-full h-[180px] flex-shrink-0">
                    <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                    {/* Overlay gradient and promo text */}
                    <div className="absolute bottom-0 left-0 w-full h-14 bg-gradient-to-t from-black/80 to-transparent flex items-end px-4 pb-2">
                      <span className="text-white font-bold text-lg tracking-wide drop-shadow">ITEMS AT ₹{item.price}</span>
                    </div>
                  </div>
                  <div className="w-full flex flex-col items-start px-4 pt-3 pb-6">
                    <span className="font-bold text-gray-900 text-lg mb-1 group-hover:text-[#FE8C00] transition">{item.product_name}</span>
                    {item.malayalam_name && (
                      <span className="font-medium text-gray-700 text-sm mb-1 line-clamp-1">{item.malayalam_name}</span>
                    )}
                    <span className={`flex items-center gap-2 font-semibold text-sm mb-1 ${item.category === 'Non-veg' || item.category === 'Non-veg Combo' ? 'text-red-600' : 'text-green-600'}`}>
                      <svg xmlns='http://www.w3.org/2000/svg' className='inline w-4 h-4' fill='currentColor' viewBox='0 0 20 20'><circle cx='10' cy='10' r='10' /></svg>
                      {item.rating || 4.3}
                    </span>
                    <span className="text-gray-500 text-sm mb-1 capitalize">{item.category}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
