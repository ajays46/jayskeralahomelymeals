import React from 'react';

const Terms = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Terms & Conditions</h1>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-700 mb-3">1. No Refund Policy</h2>
              <p className="text-gray-600">Once payment for the meal plan is made, refunds will not be available.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-700 mb-3">2. No Carryforward Policy</h2>
              <p className="text-gray-600">In case you don't want an order you placed delivered, we can stop delivery if informed in advance. However, the order won't be carried forward to another day or no payment credits will be availed.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-700 mb-3">3. Consumption of Food</h2>
              <p className="text-gray-600">Please consume the food within 2 hours of delivery. Beyond this period, we do not assume any responsibility for the food.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-700 mb-3">4. Menu Changes</h2>
              <p className="text-gray-600">Our Chef and Team reserve the right to change the menu without prior notice.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-700 mb-3">5. Order Window</h2>
              <p className="text-gray-600">Our order window for tomorrow closes at 2:30 PM today. All orders received after that will be delivered the day after. All new orders need to be explicitly confirmed by the delivery team after you make payments.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-700 mb-3">6. Delivery Charges</h2>
              <p className="text-gray-600">₹20 delivery charge per day. No delivery charge if you order for more than one person for the same location.</p>
            </section>
          </div>

          <div className="mt-8">
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms; 