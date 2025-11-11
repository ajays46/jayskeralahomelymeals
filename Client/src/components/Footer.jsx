import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Footer - Copyright footer component
 * Displays copyright information for the application
 * Format: © [Year] [Company Name]. All rights reserved.
 */
const Footer = () => {
  const copyrightYear = 2025;
  const companyName = 'JAYS KERALA INNOVATIONS PRIVATE LIMITED';

  return (
    <footer className="bg-gray-900 text-gray-300 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center items-center gap-4 flex-wrap">
            <Link 
              to="/terms" 
              className="text-sm hover:text-white transition-colors duration-200 underline-offset-2 hover:underline"
            >
              Terms and Conditions
            </Link>
          </div>
          <p className="text-sm">
            © {copyrightYear} {companyName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

