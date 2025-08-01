import React from 'react';
import { MdArrowBack, MdCalendarToday } from 'react-icons/md';

const DateSelector = ({
  dates,
  selectedDate,
  selectedDates,
  orderMode,
  currentDate,
  isMobile,
  onDateSelection,
  onNextDays,
  onPreviousDays,
  onOrderModeChange,
  formatMonth,
  formatDayNumber,
  formatDay,
  isToday,
  isSelected
}) => {
  return (
    <div className="relative bg-gradient-to-br from-gray-50 to-blue-50 border-b border-gray-200  overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{
          backgroundImage: "url('/pattern.jpg')",
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          opacity: 0.04
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Month Display */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-white/20">
            <MdCalendarToday className="text-blue-600 text-2xl sm:text-3xl" />
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
                {formatMonth(dates[0])} {dates[0].getFullYear()}
              </h2>
              <p className="text-gray-600 text-sm sm:text-base mt-1">
                Select a date and choose from available menu plans
              </p>
            </div>
          </div>

          {/* Order Mode Selection */}
          <div className="mt-6 flex justify-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20">
              <div className="flex gap-2">
                <button
                  onClick={() => onOrderModeChange('single')}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                    orderMode === 'single'
                      ? 'bg-gradient-to-r from-[#FE8C00] to-[#F83600] text-white shadow-lg transform scale-105'
                      : 'bg-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">📅</span>
                  Single Date
                </button>
                <button
                  onClick={() => onOrderModeChange('multiple')}
                  className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                    orderMode === 'multiple'
                      ? 'bg-gradient-to-r from-[#FE8C00] to-[#F83600] text-white shadow-lg transform scale-105'
                      : 'bg-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">📆</span>
                  Multiple Dates
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <button 
            onClick={onPreviousDays}
            className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-white/20 hover:bg-white hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          >
            <MdArrowBack className="text-gray-600 group-hover:text-[#FE8C00] text-xl transition-colors" />
          </button>
          
          <div className="flex gap-3 sm:gap-4 lg:gap-5 overflow-visible px-6 justify-center items-center">
            {dates.map((date, index) => (
              <button
                key={index}
                onClick={() => onDateSelection(date)}
                className={`flex flex-col items-center p-3 sm:p-4 rounded-2xl min-w-[65px] sm:min-w-[75px] lg:min-w-[85px] transition-all duration-300 flex-shrink-0 shadow-lg border-2 relative ${
                  orderMode === 'single' 
                    ? (isSelected(date) 
                        ? 'bg-gradient-to-br from-[#FE8C00] to-[#F83600] text-white border-[#FE8C00] shadow-orange-200 transform scale-110 z-10' 
                        : isToday(date)
                        ? 'bg-gradient-to-br from-orange-100 to-yellow-100 text-[#FE8C00] border-orange-300 hover:shadow-orange-200 hover:scale-105'
                        : 'bg-white/80 backdrop-blur-sm text-gray-600 border-gray-200 hover:bg-white hover:shadow-xl hover:border-[#FE8C00] hover:scale-105')
                    : (selectedDates.some(d => d.toDateString() === date.toDateString())
                        ? 'bg-gradient-to-br from-[#FE8C00] to-[#F83600] text-white border-[#FE8C00] shadow-orange-200 transform scale-110 z-10'
                        : isToday(date)
                        ? 'bg-gradient-to-br from-orange-100 to-yellow-100 text-[#FE8C00] border-orange-300 hover:shadow-orange-200 hover:scale-105'
                        : 'bg-white/80 backdrop-blur-sm text-gray-600 border-gray-200 hover:bg-white hover:shadow-xl hover:border-[#FE8C00] hover:scale-105')
                }`}
              >
                <span className="text-sm sm:text-base lg:text-lg font-bold">{formatDayNumber(date)}</span>
                <span className="text-xs sm:text-sm font-medium">{formatDay(date)}</span>
              </button>
            ))}
          </div>
          
          <button 
            onClick={onNextDays}
            className="w-12 h-12 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-white/20 hover:bg-white hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          >
            <MdArrowBack className="text-gray-600 group-hover:text-[#FE8C00] text-xl rotate-180 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateSelector; 