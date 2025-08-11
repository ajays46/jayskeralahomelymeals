import React from 'react';
import { MdArrowBack, MdCalendarToday } from 'react-icons/md';

const DateSelector = ({
  dates,
  selectedDates,
  currentDate,
  isMobile,
  onDateSelection,
  onNextDays,
  onPreviousDays,
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
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
        {/* Month Display */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <div className="inline-flex items-center gap-2 sm:gap-3 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl px-4 sm:px-6 py-3 sm:py-4 shadow-lg border border-white/20">
            <MdCalendarToday className="text-blue-600 text-xl sm:text-2xl lg:text-3xl" />
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-800">
                {formatMonth(dates[0])} {dates[0].getFullYear()}
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm lg:text-base mt-1">
                Select a date and choose from available menu plans
              </p>
            </div>
          </div>


        </div>
        
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <button 
            onClick={onPreviousDays}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-white/20 hover:bg-white hover:shadow-xl transition-all duration-300 flex items-center justify-center group flex-shrink-0"
          >
            <MdArrowBack className="text-gray-600 group-hover:text-[#FE8C00] text-lg sm:text-xl transition-colors" />
          </button>
          
          <div className="flex-1 flex gap-1 sm:gap-2 lg:gap-3 xl:gap-4  justify-center items-center px-1 sm:px-2">
            {dates.slice(0, isMobile ? 4 : dates.length).map((date, index) => (
              <button
                key={index}
                onClick={() => onDateSelection(date)}
                className={`flex flex-col items-center p-1.5 sm:p-2 lg:p-3 xl:p-4 rounded-lg sm:rounded-xl lg:rounded-2xl min-w-[50px] sm:min-w-[55px] lg:min-w-[65px] xl:min-w-[75px] transition-all duration-300 flex-shrink-0 shadow-lg border-2 relative ${
                  isSelected(date) 
                    ? 'bg-gradient-to-br from-[#FE8C00] to-[#F83600] text-white border-[#FE8C00] shadow-orange-200 transform scale-110 z-10' 
                    : isToday(date)
                    ? 'bg-gradient-to-br from-orange-100 to-yellow-100 text-[#FE8C00] border-orange-300 hover:shadow-orange-200 hover:scale-105'
                    : 'bg-white/80 backdrop-blur-sm text-gray-600 border-gray-200 hover:bg-white hover:shadow-xl hover:border-[#FE8C00] hover:scale-105'
                }`}
              >
                <span className="text-xs sm:text-sm lg:text-base xl:text-lg font-bold">{formatDayNumber(date)}</span>
                <span className="text-xs sm:text-sm font-medium">{formatDay(date)}</span>
              </button>
            ))}
          </div>
          
          <button 
            onClick={onNextDays}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-white/20 hover:bg-white hover:shadow-xl transition-all duration-300 flex items-center justify-center group flex-shrink-0"
          >
            <MdArrowBack className="text-gray-600 group-hover:text-[#FE8C00] text-lg sm:text-xl rotate-180 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateSelector; 