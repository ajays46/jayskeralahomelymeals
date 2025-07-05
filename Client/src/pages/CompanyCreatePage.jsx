import React, { useState } from 'react';
import { FaBuilding } from 'react-icons/fa';
import AdminSlide from '../components/AdminSlide';
import { useCreateCompany } from '../hooks/adminHook/adminHook';

const CompanyCreatePage = () => {
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

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100">
      <AdminSlide />
      <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-auto">
        <div className="w-full max-w-lg mx-4 sm:mx-auto mt-6 sm:mt-10 p-4 sm:p-6 md:p-8 bg-gray-800 rounded-lg shadow text-gray-100">
          <div className="flex flex-col items-center mb-6">
            <FaBuilding size={40} className="text-teal-400 mb-2" />
            <h2 className="text-xl sm:text-2xl font-bold text-teal-300 text-center">Create Company</h2>
          </div>
          {isSuccess && <div className="mb-4 text-green-400 font-semibold text-center">Company created successfully!</div>}
          {isError && <div className="mb-4 text-red-400 font-semibold text-center">{error?.response?.data?.message || 'Failed to create company'}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
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
      </div>
    </div>
  );
};

export default CompanyCreatePage; 