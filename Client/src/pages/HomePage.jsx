import React, { useState } from 'react'
import { useUsersList } from '../hooks/userHooks/useLogin';
import Navbar from '../components/Navbar';
import AuthSlider from '../components/AuthSlider';
import dummyData from '../data/dummy.json';
import vegData from '../data/veg.json';
import nonVegData from '../data/non-veg.json';
import comboData from '../data/combo.json';
import riceData from '../data/rice.json';
import sidesData from '../data/sides.json';
import saladData from '../data/salad.json';
import vegCurryData from '../data/veg-curry.json';
import { FiChevronRight } from 'react-icons/fi';

const HomePage = () => {
  const { data } = useUsersList();
  const [authSliderOpen, setAuthSliderOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const handleOpenAuthSlider = () => setAuthSliderOpen(true);
  const handleCloseAuthSlider = () => setAuthSliderOpen(false);

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
        return comboData;
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
      <div
          className=" p-4 pt-10"
         
        >
        <div className="flex items-center justify-between   mb-8">
          <div className="flex items-center  gap-2 sm:gap-3">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[#FE8C00] to-orange-500 bg-clip-text text-transparent drop-shadow">Find by Category</h2>
          </div>
          <a href="#" className="flex lg:hidden items-center gap-1 text-[#FE8C00] font-semibold text-base sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[#FE8C00] hover:bg-[#FE8C00] hover:text-white transition shadow-sm">
            See All <FiChevronRight className="inline text-lg sm:text-xl" />
          </a>
        </div>
        {/* Category Avatars - Dynamic rendering */}
        <div className="flex gap-3 sm:gap-6 mb-8 sm:mb-10 lg:pt-2 pt-1 scrollbar-hide overflow-x-auto pb-2">
          {/* All Categories Option */}
          <div
            onClick={() => setSelectedCategory('All')}
            className="flex flex-col items-center group cursor-pointer min-w-[70px] sm:min-w-[90px]"
          >
            <div className={`w-12 h-12 sm:w-20 sm:h-20 rounded-full border-4 ${selectedCategory === 'All' ? 'border-[#FE8C00] bg-orange-50' : 'border-gray-200 bg-white'} flex items-center justify-center overflow-hidden mb-1 sm:mb-2 shadow-lg group-hover:scale-105 group-hover:shadow-xl transition`}>
              <img src="/combo.png" alt="All" className="object-cover w-full h-full" />
            </div>
            <span className={`text-xs sm:text-sm font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow ${selectedCategory === 'All' ? 'bg-[#FE8C00] text-white' : 'bg-gray-100 text-gray-700'} group-hover:bg-[#FE8C00] group-hover:text-white transition`}>All</span>
          </div>

          {[...new Set(dummyData.map(item => item.category))].map((cat) => (
            <div
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="flex flex-col items-center group cursor-pointer min-w-[70px] sm:min-w-[90px]"
            >
              <div className={`w-12 h-12 sm:w-20 sm:h-20 rounded-full border-4 ${selectedCategory === cat ? 'border-[#FE8C00] bg-orange-50' : 'border-gray-200 bg-white'} flex items-center justify-center overflow-hidden mb-1 sm:mb-2 shadow-lg group-hover:scale-105 group-hover:shadow-xl transition`}>
                <img src={getCategoryImage(cat)} alt={cat} className="object-cover w-full h-full" />
              </div>
              <span className={`text-xs sm:text-sm font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full shadow ${selectedCategory === cat ? 'bg-[#FE8C00] text-white' : 'bg-gray-100 text-gray-700'} group-hover:bg-[#FE8C00] group-hover:text-white transition`}>{cat}</span>
            </div>
          ))}
        </div>
        </div>
      </main>
      <section className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-20 py-0">
        
        {/* Food Cards */}
        <div className="relative">
          {/* Mobile horizontal scroll grid */}
          <div className="block lg:hidden overflow-x-auto">
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
                    <span className={`flex items-center gap-2 font-semibold text-[10px] mb-1 ${item.category === 'Non-veg' ? 'text-red-600' : 'text-green-600'}`}>
                      <svg xmlns='http://www.w3.org/2000/svg' className='inline w-2.5 h-2.5' fill='currentColor' viewBox='0 0 20 20'><circle cx='10' cy='10' r='10' /></svg>
                      {item.rating || 4.3}
                    </span>
                    <span className="text-gray-500 text-[9px] mb-1 capitalize">{item.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Desktop grid */}
          <div className="hidden lg:grid mx-auto grid-cols-5 gap-x-[280px] gap-y-20 justify-items-center">
            {filteredData.map((item, idx) => (
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
                  <span className={`flex items-center gap-2 font-semibold text-sm mb-1 ${item.category === 'Non-veg' ? 'text-red-600' : 'text-green-600'}`}>
                    <svg xmlns='http://www.w3.org/2000/svg' className='inline w-4 h-4' fill='currentColor' viewBox='0 0 20 20'><circle cx='10' cy='10' r='10' /></svg>
                    {item.rating || 4.3}
                  </span>
                  <span className="text-gray-500 text-sm mb-1 capitalize">{item.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
