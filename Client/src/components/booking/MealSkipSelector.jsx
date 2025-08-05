import React, { useState, useEffect } from 'react';
import { MdCalendarToday, MdClose, MdInfo, MdExpandMore, MdExpandLess } from 'react-icons/md';

const MealSkipSelector = ({
  selectedDates,
  selectedMenu,
  onSkipMealsChange,
  skipMeals,
  formatDateForDisplay,
  isWeekdayMenu,
  isWeekday
}) => {
  const [expandedDate, setExpandedDate] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const mealTypes = [
    { key: 'breakfast', label: '🍳 Breakfast', color: 'green' },
    { key: 'lunch', label: '🍽️ Lunch', color: 'yellow' },
    { key: 'dinner', label: '🌙 Dinner', color: 'pink' }
  ];

  const getMealTypeColor = (mealType) => {
    const meal = mealTypes.find(m => m.key === mealType);
    return meal?.color || 'gray';
  };

  const handleSkipMeal = (date, mealType, skip) => {
    const dateStr = date.toISOString().split('T')[0];
    const newSkipMeals = { ...skipMeals };
    
    if (!newSkipMeals[dateStr]) {
      newSkipMeals[dateStr] = {};
    }
    
    if (skip) {
      newSkipMeals[dateStr][mealType] = true;
    } else {
      delete newSkipMeals[dateStr][mealType];
      if (Object.keys(newSkipMeals[dateStr]).length === 0) {
        delete newSkipMeals[dateStr];
      }
    }
    
    onSkipMealsChange(newSkipMeals);
  };

  const isMealSkipped = (date, mealType) => {
    const dateStr = date.toISOString().split('T')[0];
    return skipMeals[dateStr]?.[mealType] || false;
  };

  const getSkippedMealsCount = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return Object.keys(skipMeals[dateStr] || {}).length;
  };

  const getTotalSkippedMeals = () => {
    return Object.values(skipMeals).reduce((total, dateMeals) => {
      return total + Object.keys(dateMeals).length;
    }, 0);
  };

  const isDateValidForMenu = (date) => {
    if (!selectedMenu) return true;
    if (isWeekdayMenu(selectedMenu)) {
      return isWeekday(date);
    }
    return true;
  };

  const getAvailableMealsForDate = (date) => {
    if (!selectedMenu) return mealTypes;
    
    const availableMeals = [];
    if (selectedMenu.hasBreakfast) availableMeals.push(mealTypes[0]);
    if (selectedMenu.hasLunch) availableMeals.push(mealTypes[1]);
    if (selectedMenu.hasDinner) availableMeals.push(mealTypes[2]);
    
    return availableMeals;
  };

  if (!selectedMenu || selectedDates.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-white to-orange-50 rounded-3xl shadow-xl border border-orange-100 mb-6 overflow-hidden">
      {/* Header - Always Visible */}
      <div 
        className="p-6 sm:p-8 cursor-pointer transition-all duration-300 hover:bg-orange-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <MdCalendarToday className="text-white text-xl" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-lg sm:text-xl">Meal Skip Selection</h4>
              <p className="text-gray-600 text-sm">Choose which meals to skip on specific dates</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {getTotalSkippedMeals() > 0 && (
              <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                {getTotalSkippedMeals()} meals skipped
              </div>
            )}
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
              {isExpanded ? (
                <MdExpandLess className="text-orange-600 text-xl" />
              ) : (
                <MdExpandMore className="text-orange-600 text-xl" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 border-t border-orange-100">
          <div className="space-y-4">
        {selectedDates.map((date, index) => {
          const isExpanded = expandedDate === index;
          const skippedCount = getSkippedMealsCount(date);
          const availableMeals = getAvailableMealsForDate(date);
          const isValidDate = isDateValidForMenu(date);

          return (
            <div
              key={index}
              className={`border-2 rounded-xl transition-all duration-300 ${
                skippedCount > 0
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Date Header */}
              <div
                className="p-4 cursor-pointer flex items-center justify-between"
                onClick={() => setExpandedDate(isExpanded ? null : index)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    isValidDate ? 'bg-blue-500' : 'bg-red-500'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">
                      {formatDateForDisplay(date)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {availableMeals.length} meals available
                      {!isValidDate && (
                        <span className="text-red-600 ml-2">⚠️ Invalid for this menu</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {skippedCount > 0 && (
                    <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-semibold">
                      {skippedCount} skipped
                    </div>
                  )}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}>
                    <MdCalendarToday className="text-gray-500 text-lg" />
                  </div>
                </div>
              </div>

              {/* Expanded Meal Selection */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-white rounded-b-xl">
                  <div className="space-y-3">
                    {availableMeals.map((mealType) => {
                      const isSkipped = isMealSkipped(date, mealType.key);
                      const colorClass = getMealTypeColor(mealType.key);
                      
                      return (
                        <div
                          key={mealType.key}
                          className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 ${
                            isSkipped
                              ? `border-${colorClass}-300 bg-${colorClass}-50`
                              : 'border-gray-200 bg-gray-50 hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isSkipped ? `bg-${colorClass}-500` : 'bg-gray-300'
                            }`}>
                              <span className="text-white text-sm">
                                {mealType.label.split(' ')[0]}
                              </span>
                            </div>
                            <span className={`font-medium ${
                              isSkipped ? `text-${colorClass}-700` : 'text-gray-700'
                            }`}>
                              {mealType.label}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => handleSkipMeal(date, mealType.key, !isSkipped)}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                              isSkipped
                                ? `bg-${colorClass}-500 text-white hover:bg-${colorClass}-600`
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {isSkipped ? 'Unskip' : 'Skip'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  
                  {!isValidDate && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700 text-sm">
                        <MdInfo className="text-red-500" />
                        <span>This date is not valid for the selected menu type</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
          </div>

          {/* Summary */}
          {getTotalSkippedMeals() > 0 && (
            <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
              <h5 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                <MdInfo className="text-orange-600" />
                Skip Summary
              </h5>
              <div className="text-sm text-orange-700">
                You have skipped <span className="font-bold">{getTotalSkippedMeals()}</span> meals across{' '}
                <span className="font-bold">{Object.keys(skipMeals).length}</span> dates.
                Your order will be adjusted accordingly.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MealSkipSelector; 