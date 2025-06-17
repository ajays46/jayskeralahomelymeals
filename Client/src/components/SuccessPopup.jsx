// 
import React, { useState } from 'react';
import { FaUserShield, FaStore, FaUser } from 'react-icons/fa';

const roles = {
  admin: {
    title: 'Admin',
    icon: <FaUserShield className="text-blue-600 text-3xl" />,
    description: 'Manage entire system and users.'
  },
  seller: {
    title: 'Seller',
    icon: <FaStore className="text-orange-500 text-3xl" />,
    description: 'Handle products and view orders.'
  },
  user: {
    title: 'User',
    icon: <FaUser className="text-green-600 text-3xl" />,
    description: 'Browse and place orders.'
  }
};

const RoleSelectorPopup = ({
  rolesList = Object.keys(roles),
  onSelect,
  onClose
}) => {
  const [selected, setSelected] = useState(rolesList[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred, semi-transparent background */}
      <div className="absolute inset-0 backdrop-blur-md"></div>
      <div
        className="relative bg-white/90 w-full max-w-xl md:max-w-2xl rounded-3xl shadow-2xl px-4 py-6 sm:px-8 sm:py-10 md:px-12 md:py-12 text-center border border-blue-200"
        style={{
          animation: 'fadeInUp 0.5s cubic-bezier(.4,0,.2,1) both'
        }}
      >
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 sm:top-5 sm:right-5 text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        {/* Login Success Message */}
        <div className="mb-4">
          <span className="inline-block bg-green-100 text-green-700 font-semibold px-4 py-2 rounded-full shadow text-base sm:text-lg">
            Login successfully!
          </span>
        </div>
        {/* Logo at the top */}
        <img
          src="/logo.png"
          alt="Logo"
          className="mx-auto mb-4 w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-full shadow"
          style={{ background: 'rgba(255,255,255,0.7)' }}
        />
        <h2 className="text-2xl sm:text-3xl font-merriweather font-extrabold text-gray-800 mb-6 tracking-tight">Access the Platform as</h2>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-8 mb-6">
          {rolesList.map((key) => {
            const role = roles[key];
            if (!role) return null;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={`flex flex-col items-center px-6 py-4 sm:px-8 sm:py-6 rounded-xl border-2 transition-all duration-150 w-full sm:w-44 shadow-sm
                  ${
                    selected === key
                      ? 'bg-blue-600 border-blue-600 text-white scale-105'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-blue-400 hover:scale-105'
                  }`}
                type="button"
              >
                {React.cloneElement(
                  role.icon,
                  {
                    className:
                      selected === key
                        ? "text-white text-3xl"
                        : role.icon.props.className
                  }
                )}
                <span className="mt-2 font-semibold">{role.title}</span>
              </button>
            );
          })}
        </div>
        <p className="text-gray-500 text-sm mb-8 min-h-[24px]">
          {roles[selected]?.description}
        </p>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <button
            className="w-full sm:w-auto px-6 py-2 rounded-full border border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition"
            onClick={onClose}
          >
            &#8592; Back
          </button>
          <button
            className="w-full sm:w-auto px-8 py-2 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            onClick={() => onSelect(selected)}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectorPopup;
    