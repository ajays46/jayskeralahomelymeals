import React, { useState, useEffect } from 'react';
import { 
  MdCheckCircle, 
  MdCelebration, 
  MdLocationOn, 
  MdSchedule, 
  MdShoppingCart,
  MdPayment,
  MdArrowForward,
  MdHome,
  MdReceipt
} from 'react-icons/md';

const OrderSuccessPopup = ({ 
  isOpen, 
  onClose, 
  orderDetails = {},
  onViewOrder,
  onGoHome 
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [animateContent, setAnimateContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      setTimeout(() => setAnimateContent(true), 300);
      
      // Auto-hide confetti after 3 seconds
      const confettiTimer = setTimeout(() => setShowConfetti(false), 3000);
      
      return () => clearTimeout(confettiTimer);
    } else {
      setShowConfetti(false);
      setAnimateContent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop with blur effect */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute confetti-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`,
              }}
            >
              <div className={`w-2 h-2 rounded-full ${
                ['bg-yellow-400', 'bg-pink-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400'][Math.floor(Math.random() * 5)]
              }`} />
            </div>
          ))}
        </div>
      )}

      {/* Main Modal */}
      <div className={`relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-sm sm:max-w-lg w-full transform transition-all duration-500 animate-scale-in ${
        animateContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-t-xl sm:rounded-t-2xl p-3 sm:p-4 text-white overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 right-2 w-8 h-8 sm:w-12 sm:h-12 bg-white rounded-full"></div>
            <div className="absolute bottom-2 left-2 w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full"></div>
          </div>
          
          {/* Success Icon */}
          <div className="relative z-10 flex justify-center mb-2">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-3 border-4 border-white/30">
              <MdCheckCircle className="text-2xl sm:text-3xl text-white" />
            </div>
          </div>
          
          {/* Success Message */}
          <div className="relative z-10 text-center">
            <h1 className="text-lg sm:text-xl font-bold mb-1">Order Successful!</h1>
            <p className="text-xs sm:text-sm opacity-90">
              Your order has been placed successfully and payment has been confirmed
            </p>
          </div>
          
          {/* Celebration Icon */}
          <div className="absolute top-2 right-2">
            <MdCelebration className="text-lg sm:text-xl text-white/80 animate-pulse" />
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          {/* Order Summary */}
          <div className="border border-gray-200 rounded-lg p-2 sm:p-3 mb-3">
            <h2 className="text-sm sm:text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
              <MdShoppingCart className="text-green-500" />
              Order Summary
            </h2>
            
            <div className="grid grid-cols-1 gap-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-xs sm:text-sm">Order ID:</span>
                  <span className="font-semibold text-gray-800 text-xs sm:text-sm">#{orderDetails.id || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-xs sm:text-sm">Menu:</span>
                  <span className="font-semibold text-gray-800 text-xs sm:text-sm">{orderDetails.menuName || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-xs sm:text-sm">Total Amount:</span>
                  <span className="font-bold text-base sm:text-lg text-green-600">
                    {formatPrice(orderDetails.totalPrice)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MdSchedule className="text-blue-500 text-xs sm:text-sm" />
                  <span className="text-gray-600 text-xs sm:text-sm">Order Date:</span>
                  <span className="font-semibold text-gray-800 text-xs sm:text-sm">
                    {formatDate(orderDetails.orderDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MdPayment className="text-purple-500 text-xs sm:text-sm" />
                  <span className="text-gray-600 text-xs sm:text-sm">Payment Status:</span>
                  <span className="font-semibold text-green-600 text-xs sm:text-sm">Confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <MdReceipt className="text-orange-500 text-xs sm:text-sm" />
                  <span className="text-gray-600 text-xs sm:text-sm">Receipt:</span>
                  <span className="font-semibold text-gray-800 text-xs sm:text-sm">Uploaded</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          {orderDetails.deliveryLocations && (
            <div className="border border-gray-200 rounded-lg p-2 sm:p-3 mb-3">
              <h3 className="text-xs sm:text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                <MdLocationOn className="text-blue-500" />
                Delivery Information
              </h3>
              
              <div className="space-y-1">
                {orderDetails.deliveryLocations.breakfast && (
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-2">
                    <span className="text-base sm:text-lg">🍳</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-xs sm:text-sm">Breakfast Delivery</p>
                      <p className="text-xs text-gray-600 truncate">
                        {orderDetails.deliveryLocationNames?.breakfast || 'Primary Address'}
                      </p>
                    </div>
                  </div>
                )}
                
                {orderDetails.deliveryLocations.lunch && (
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-2">
                    <span className="text-base sm:text-lg">🍽️</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-xs sm:text-sm">Lunch Delivery</p>
                      <p className="text-xs text-gray-600 truncate">
                        {orderDetails.deliveryLocationNames?.lunch || 'Primary Address'}
                      </p>
                    </div>
                  </div>
                )}
                
                {orderDetails.deliveryLocations.dinner && (
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-2">
                    <span className="text-base sm:text-lg">🌙</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-xs sm:text-sm">Dinner Delivery</p>
                      <p className="text-xs text-gray-600 truncate">
                        {orderDetails.deliveryLocationNames?.dinner || 'Primary Address'}
                      </p>
                    </div>
                  </div>
                )}
                
                {!orderDetails.deliveryLocations.breakfast && 
                 !orderDetails.deliveryLocations.lunch && 
                 !orderDetails.deliveryLocations.dinner && (
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-2">
                    <span className="text-base sm:text-lg">📍</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-xs sm:text-sm">All Meals Delivery</p>
                      <p className="text-xs text-gray-600 truncate">
                        {orderDetails.deliveryLocationNames?.full || 'Primary Address'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={onGoHome}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-2 sm:py-2.5 rounded-lg font-bold hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <MdHome className="text-base sm:text-lg" />
              Go to Home
            </button>
            
            <button
              onClick={onViewOrder}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 sm:py-2.5 rounded-lg font-bold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <MdArrowForward className="text-base sm:text-lg" />
              View Order Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPopup;
