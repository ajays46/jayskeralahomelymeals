import React from 'react';
import { Link } from 'react-router-dom';

const Gust = () => {
  return (
    <div className="w-full flex flex-col items-center  ">
      <button
        className="w-full py-3 rounded-full bg-white text-orange-500 font-semibold text-lg shadow-md transition-colors mb-3 hover:bg-orange-50"
      >
        Continue as Guest
      </button>
      <Link
        to="/login"
        className="block w-full py-3 rounded-full bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-50 font-semibold text-lg shadow-md transition-colors text-center mb-3"
      >
        Login to Your Account
      </Link>
      <p className="text-center text-sm text-white mt-2">
        Don't have an account?{' '}
        <Link to="/register" className="text-white font-medium underline hover:text-orange-100">
          Register here
        </Link>
      </p>
    </div>
  );
};

export default Gust;
