import React from 'react';
import { MdRestaurant } from 'react-icons/md';

const BookingHeader = () => {
  return (
    <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 shadow-lg pt-20 sm:pt-22 lg:pt-24 overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/banner_one.jpg')",
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
      />
      
      {/* Gradient Overlay for better text readability */}
      {/* <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 via-purple-600/80 to-indigo-700/80"></div> */}
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
              <MdRestaurant className="text-white text-2xl sm:text-3xl" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 drop-shadow-lg">Meal Booking</h1>
              <p className="text-blue-100 text-sm sm:text-base drop-shadow-md">Plan your perfect meal experience</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingHeader; 