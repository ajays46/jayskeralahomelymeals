import React, { useState, useEffect } from 'react';
import { MdCalendarToday, MdClose, MdInfo, MdExpandMore, MdExpandLess, MdCheck, MdCancel, MdSkipNext } from 'react-icons/md';

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
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const mealTypes = [
    { key: 'breakfast', label: '🍳 Breakfast', color: 'green', icon: '🌅' },
    { key: 'lunch', label: '🍽️ Lunch', color: 'yellow', icon: '☀️' },
    { key: 'dinner', label: '🌙 Dinner', color: 'pink', icon: '🌙' }
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
      {/* Compact Header */}
      <div 
        className="p-3 cursor-pointer transition-all duration-200 hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-6 h-6 bg-orange-500 rounded-md flex items-center justify-center flex-shrink-0">
              <MdCalendarToday className="text-white text-sm" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-gray-800 text-sm">Meal Skip Options</h4>
              <p className="text-gray-500 text-xs">Configure which meals to skip</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {getTotalSkippedMeals() > 0 && (
              <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">
                {getTotalSkippedMeals()} skipped
              </div>
            )}
            <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">
              {isExpanded ? (
                <MdExpandLess className="text-gray-600 text-sm" />
              ) : (
                <MdExpandMore className="text-gray-600 text-sm" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="px-3 py-3 border-t border-gray-200">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedDates.map((date, index) => {
              const isExpanded = expandedDate === index;
              const skippedCount = getSkippedMealsCount(date);
              const availableMeals = getAvailableMealsForDate(date);
              const isValidDate = isDateValidForMenu(date);

              return (
                <div
                  key={index}
                  className={`border rounded-lg transition-all duration-200 ${
                    skippedCount > 0
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                {/* Compact Date Header */}
                <div
                  className="p-2 cursor-pointer flex items-center justify-between"
                  onClick={() => setExpandedDate(isExpanded ? null : index)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                      isValidDate ? 'bg-blue-500' : 'bg-red-500'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-800 text-xs">
                        {formatDateForDisplay(date)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {availableMeals.length} meals
                        {!isValidDate && (
                          <span className="text-red-600 ml-1">⚠️ Invalid</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {skippedCount > 0 && (
                      <div className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-xs">
                        {skippedCount}
                      </div>
                    )}
                    <div className={`w-4 h-4 rounded flex items-center justify-center transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}>
                      <MdCalendarToday className="text-gray-400 text-xs" />
                    </div>
                  </div>
                </div>

              {/* Compact Meal Selection */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-2 bg-gray-50 rounded-b-lg">
                  <div className="space-y-1">
                    {availableMeals.map((mealType) => {
                      const isSkipped = isMealSkipped(date, mealType.key);
                      const colorClass = getMealTypeColor(mealType.key);
                      
                      return (
                        <div
                          key={mealType.key}
                          className={`flex items-center justify-between p-2 rounded-md border transition-all duration-200 ${
                            isSkipped
                              ? `border-${colorClass}-300 bg-${colorClass}-50`
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                              isSkipped ? `bg-${colorClass}-500` : 'bg-gray-400'
                            }`}>
                              <span className="text-white text-xs">
                                {isSkipped ? '❌' : mealType.icon}
                              </span>
                            </div>
                            <span className={`font-medium text-xs ${
                              isSkipped ? `text-${colorClass}-700` : 'text-gray-700'
                            }`}>
                              {mealType.label.split(' ')[1]}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => handleSkipMeal(date, mealType.key, !isSkipped)}
                            className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                              isSkipped
                                ? `bg-${colorClass}-500 text-white hover:bg-${colorClass}-600`
                                : 'bg-red-500 text-white hover:bg-red-600'
                            }`}
                          >
                            {isSkipped ? 'Restore' : 'Skip'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  
                  {!isValidDate && (
                    <div className="mt-2 p-1.5 bg-red-50 border border-red-200 rounded text-xs">
                      <div className="flex items-center gap-1 text-red-600">
                        <MdInfo className="text-red-500 text-xs" />
                        <span>Invalid for this menu</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
          </div>

          {/* Compact Summary */}
          {getTotalSkippedMeals() > 0 && (
            <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
              <div className="text-orange-700">
                <span className="font-medium">{getTotalSkippedMeals()}</span> meals skipped across{' '}
                <span className="font-medium">{Object.keys(skipMeals).length}</span> dates
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MealSkipSelector; 