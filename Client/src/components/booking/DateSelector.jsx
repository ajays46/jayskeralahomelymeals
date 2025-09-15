import React from 'react';
import { MdCalendarToday, MdChevronLeft, MdChevronRight } from 'react-icons/md';

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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <MdCalendarToday className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delivery Schedule</h3>
              <p className="text-sm text-gray-600">Select delivery dates for your customer</p>
            </div>
          </div>
          
          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={onPreviousDays}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Previous week"
            >
              <MdChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={onNextDays}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Next week"
            >
              <MdChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Month and Year Display */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {formatMonth(dates[0])} {dates[0].getFullYear()}
          </h2>
          <p className="text-gray-500 text-sm">Week of {dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {dates[dates.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-3 max-w-2xl mx-auto">
          {/* Day Headers - Dynamic based on actual dates */}
          {dates.map((date, index) => (
            <div key={index} className="text-center">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide py-2">
                {formatDay(date)}
              </div>
            </div>
          ))}

          {/* Date Cells */}
          {dates.map((date, index) => {
            const isSelectedDate = isSelected(date);
            const isTodayDate = isToday(date);
            
            return (
              <div key={index} className="text-center">
                <button
                  onClick={() => onDateSelection(date)}
                  className={`w-full aspect-square rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center relative group ${
                    isSelectedDate 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-105' 
                      : isTodayDate
                      ? 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-300'
                  }`}
                >
                  {/* Date Number */}
                  <span className={`text-lg font-bold ${isSelectedDate ? 'text-white' : ''}`}>
                    {formatDayNumber(date)}
                  </span>
                  
                  {/* Day Name */}
                  <span className={`text-xs font-medium ${isSelectedDate ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatDay(date)}
                  </span>

                  {/* Selection Indicator */}
                  {isSelectedDate && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  {/* Today Indicator */}
                  {isTodayDate && !isSelectedDate && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-xs text-white font-bold">T</span>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Selected Dates Summary */}
        {selectedDates.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{selectedDates.length}</span>
              </div>
              <span className="text-sm font-semibold text-blue-900">
                {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="text-sm text-blue-700">
              {(() => {
                if (selectedDates.length === 1) {
                  const date = selectedDates[0];
                  return (
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                      {formatMonth(date)} {formatDayNumber(date)}, {formatDay(date)}
                    </span>
                  );
                } else {
                  // Sort dates to get start and end dates
                  const sortedDates = [...selectedDates].sort((a, b) => a - b);
                  const startDate = sortedDates[0];
                  const endDate = sortedDates[sortedDates.length - 1];
                  
                  // Check if dates are consecutive
                  const isConsecutive = sortedDates.every((date, index) => {
                    if (index === 0) return true;
                    const prevDate = new Date(sortedDates[index - 1]);
                    const currentDate = new Date(date);
                    const diffTime = currentDate.getTime() - prevDate.getTime();
                    const diffDays = diffTime / (1000 * 60 * 60 * 24);
                    return diffDays === 1;
                  });
                  
                  if (isConsecutive) {
                    // Show range format like "Aug 12 to Aug 20"
                    if (startDate.getMonth() === endDate.getMonth()) {
                      return (
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                          {formatMonth(startDate)} {formatDayNumber(startDate)} to {formatDayNumber(endDate)}
                        </span>
                      );
                    } else {
                      return (
                        <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-md">
                          {formatMonth(startDate)} {formatDayNumber(startDate)} to {formatMonth(endDate)} {formatDayNumber(endDate)}
                        </span>
                      );
                    }
                  } else {
                    // Show first few dates with "and X more" if not consecutive
                    const displayDates = sortedDates.slice(0, 3);
                    const remainingCount = sortedDates.length - 3;
                    
                    return (
                      <div className="space-y-1">
                        {displayDates.map((date, index) => (
                          <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-md mr-2">
                            {formatMonth(date)} {formatDayNumber(date)}, {formatDay(date)}
                          </span>
                        ))}
                        {remainingCount > 0 && (
                          <span className="inline-block bg-blue-200 text-blue-800 px-2 py-1 rounded-md">
                            and {remainingCount} more
                          </span>
                        )}
                      </div>
                    );
                  }
                }
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateSelector; 