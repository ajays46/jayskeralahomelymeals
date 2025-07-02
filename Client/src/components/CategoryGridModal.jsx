import React from 'react';

const CategoryGridModal = ({ open, onClose, categories }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-md w-full relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-[#FE8C00] text-2xl font-bold focus:outline-none"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold text-center mb-4 text-[#FE8C00]">All Categories</h2>
        <div className="grid grid-cols-3 gap-4">
          {categories.map((cat, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#FE8C00] mb-1 bg-white flex items-center justify-center">
                <img src={cat.image} alt={cat.name} className="object-cover w-full h-full" />
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center line-clamp-2">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryGridModal; 