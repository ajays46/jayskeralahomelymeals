/**
 * MLCXODashboard - Placeholder dashboard for MaXHub Logistics CXO (CEO/CFO) role.
 */
import React from 'react';
import MLNavbar from '../components/MLNavbar';
import { useTenant } from '../../context/TenantContext';

const MLCXODashboard = () => {
  const tenant = useTenant();

  return (
    <div className="min-h-screen bg-gray-50">
      <MLNavbar onSignInClick={() => {}} />
      <main className="pt-24 pb-12 px-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">CXO Dashboard</h1>
        <p className="text-gray-600">MaXHub Logistics executive overview. Reports and trip management will be available when added.</p>
      </main>
    </div>
  );
};

export default MLCXODashboard;
