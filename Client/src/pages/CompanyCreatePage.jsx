import React, { useState } from 'react';
import { FaBuilding, FaTrash } from 'react-icons/fa';
import AdminSlide from '../components/AdminSlide';
import { useCreateCompany, useCompanyList, useCompanyDelete } from '../hooks/adminHook/adminHook';
import { Popconfirm, Button } from 'antd';
import 'antd/dist/reset.css'; // or 'antd/dist/antd.css' for older versions

const CompanyCreatePage = () => {
  const { data: companyList } = useCompanyList();
  const { mutateAsync: deleteCompany, isLoading: isDeleting } = useCompanyDelete();
  const companies = Array.isArray(companyList) ? companyList : companyList?.data || [];
  const [form, setForm] = useState({
    name: '',
    address_id: '',
    created_at: new Date().toISOString().slice(0, 10),
    updated_at: new Date().toISOString().slice(0, 10),
  });

  const {
    mutate: createCompany,
    isLoading,
    isError,
    isSuccess,
    error,
    reset
  } = useCreateCompany();


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (isError || isSuccess) reset();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createCompany(
      {
        name: form.name,
        address_id: form.address_id,
      },
      {
        onSuccess: () => {
          setForm({
            name: '',
            address_id: '',
            created_at: new Date().toISOString().slice(0, 10),
            updated_at: new Date().toISOString().slice(0, 10),
          });
        },
      }
    );
  };

  const handleDelete = (id) => {
      deleteCompany(id);
      console.log(id);
      
      toast.success('Company deleted successfully');

  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 overflow-x-hidden">
      {/* Sidebar on desktop */}
      <div className="hidden md:block fixed left-0 top-0 h-full z-10">
        <AdminSlide />
      </div>
      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row gap-y-8 md:gap-x-8 p-2 sm:p-4 md:p-8 md:ml-[64px]">
        {/* Left: Creation Form */}
        <div className="w-full md:w-1/2 max-w-full md:max-w-lg bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8">
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <FaBuilding size={40} className="text-teal-400 mb-2 drop-shadow" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-teal-300 text-center tracking-wide">Create Company</h2>
          </div>
          {isSuccess && <div className="mb-4 text-green-400 font-semibold text-center">Company created successfully!</div>}
          {isError && <div className="mb-4 text-red-400 font-semibold text-center">{error?.response?.data?.message || 'Failed to create company'}</div>}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block mb-1 text-xs text-gray-400">Company Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-gray-100" disabled={isLoading} />
            </div>
            <div>
              <label className="block mb-1 text-xs text-gray-400">Address ID</label>
              <input type="text" name="address_id" value={form.address_id} onChange={handleChange} required className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-gray-100" disabled={isLoading} />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="flex-1">
                <label className="block mb-1 text-xs text-gray-400">Created At</label>
                <input type="date" name="created_at" value={form.created_at} readOnly className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-gray-400" />
              </div>
              <div className="flex-1">
                <label className="block mb-1 text-xs text-gray-400">Updated At</label>
                <input type="date" name="updated_at" value={form.updated_at} readOnly className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-gray-400" />
              </div>
            </div>
            <button type="submit" className="w-full bg-teal-600 text-white py-2 rounded font-semibold hover:bg-teal-700 transition" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Company'}
            </button>
          </form>
        </div>
        {/* Right: Companies List */}
        <div className="w-full md:w-1/2 max-w-full md:max-w-lg bg-gray-800 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8">
          <h3 className="text-xl sm:text-2xl font-extrabold mb-4 sm:mb-6 text-teal-400 flex items-center gap-2 tracking-wide">
            <FaBuilding className="text-teal-300" /> Created Companies
          </h3>
          {companies.length === 0 ? (
            <div className="text-gray-400 text-center">No companies found.</div>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="bg-gradient-to-r from-gray-700 to-gray-800 rounded-xl shadow-lg p-3 sm:p-5 flex items-center gap-3 sm:gap-5 hover:shadow-2xl transition-shadow border border-gray-700 hover:border-teal-400"
                >
                  <div className="flex-shrink-0 bg-teal-600 rounded-full w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center text-white text-lg sm:text-2xl font-bold shadow">
                    {company.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-base sm:text-lg text-teal-200">{company.name}</div>
                    <div className="mt-1">
                      <span className="inline-block bg-teal-700 text-teal-100 text-xs px-2 sm:px-3 py-1 rounded-full font-mono">
                        {company.address_id}
                      </span>
                    </div>
                  </div>
                  <Popconfirm
                    title="Are you sure you want to delete this company?"
                    onConfirm={async () => {
                      await deleteCompany(company.id);
                      // Optionally show a toast here
                    }}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button
                      type="primary"
                      danger
                      shape="circle"
                      icon={<FaTrash />}
                      className="ml-2"
                    />
                  </Popconfirm>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Sidebar as footer on mobile */}
      <div className="block md:hidden fixed bottom-0 left-0 w-full z-20">
        <AdminSlide isFooter />
      </div>
    </div>
  );
};

export default CompanyCreatePage; 