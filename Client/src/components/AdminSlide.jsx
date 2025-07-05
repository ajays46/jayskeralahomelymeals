import React from 'react';
import { FaHome, FaRegChartBar, FaUsers, FaClipboardList, FaRegSquare, FaUser, FaBuilding } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const AdminSlide = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col justify-between items-center h-screen w-14 bg-[#232328] py-4">
      <div className="flex flex-col gap-4 mt-2">
        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#232328] hover:bg-gray-200 transition"><FaHome size={20} /></button>
        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#232328] hover:bg-gray-200 transition"><FaRegChartBar size={20} /></button>
        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#232328] hover:bg-gray-200 transition"><FaUsers size={20} /></button>
        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#232328] hover:bg-gray-200 transition"><FaClipboardList size={20} /></button>
        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#232328] hover:bg-gray-200 transition"><FaRegSquare size={20} /></button>
        <button
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#232328] hover:bg-orange-200 transition"
          title="Create Company"
          onClick={() => navigate('/admin/company-create')}
        >
          <FaBuilding size={20} />
        </button>
      </div>
      <div className="mb-2">
        <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-[#232328] hover:bg-gray-200 transition">
          <FaUser size={22} />
        </button>
      </div>
    </div>
  );
};

export default AdminSlide;
