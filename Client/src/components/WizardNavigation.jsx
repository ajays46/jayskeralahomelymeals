import React from 'react';
import { Link } from 'react-router-dom';
import { MdShoppingCart, MdPayment, MdArrowForward } from 'react-icons/md';
import { useCompanyBasePath } from '../context/TenantContext';

const WizardNavigation = () => {
  const basePath = useCompanyBasePath();
  return (
    <div className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              to={`${basePath}/place-order`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <MdShoppingCart className="text-lg" />
              <span>Place Order</span>
              <MdArrowForward className="text-sm" />
            </Link>
            
            <Link
              to={`${basePath}/process-payment`}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <MdPayment className="text-lg" />
              <span>Process Payment</span>
              <MdArrowForward className="text-sm" />
            </Link>
          </div>
          
          <div className="text-sm text-gray-600">
            <span className="font-medium">Wizard System</span> - Test the new booking flow
          </div>
        </div>
      </div>
    </div>
  );
};

export default WizardNavigation;
