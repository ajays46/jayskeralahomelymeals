/**
 * MLPartnerManagerDashboard - Per FRONTEND_EXECUTIVES_VEHICLE_ASSIGNMENT_GUIDE.
 * Executives + vehicle_choices from 5004; assign by registration_number; 409 → confirm → force_assign.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import MLNavbar from '../components/MLNavbar';
import { useCompanyBasePath, useTenant } from '../../context/TenantContext';
import { getThemeForCompany } from '../../config/tenantThemes';
import { showSuccessToast, showErrorToast } from '../utils/mlToast';
import {
  useMlPartnerManagerExecutives,
  useMlPartnerManagerAssignVehicle,
  useMlPartnerManagerUnassignVehicle,
  useMlPartnerManagerCreatePartner,
} from '../../hooks/mlHooks/useMlPartnerManager';
import { MdPerson, MdDirectionsBike } from 'react-icons/md';

const MLPartnerManagerDashboard = () => {
  const base = useCompanyBasePath();
  const tenant = useTenant();
  const theme = tenant?.theme ?? getThemeForCompany(null, null);
  const accent = theme.accentColor || theme.primaryColor || '#E85D04';

  const executivesQuery = useMlPartnerManagerExecutives();
  const assignMutation = useMlPartnerManagerAssignVehicle({
    onSuccess: () => showSuccessToast('Vehicle assigned to partner.', 'Success'),
    onError: (err) => {
      if (err?.response?.status !== 409) {
        showErrorToast(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to assign.', 'Error');
      }
    },
  });
  const unassignMutation = useMlPartnerManagerUnassignVehicle({
    onSuccess: () => showSuccessToast('Vehicle unassigned.', 'Success'),
    onError: (err) => showErrorToast(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to unassign.', 'Error'),
  });
  const createPartnerMutation = useMlPartnerManagerCreatePartner({
    onSuccess: () => showSuccessToast('Delivery partner created.', 'Success'),
    onError: (err) =>
      showErrorToast(
        err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to create partner.',
        'Error',
      ),
  });

  const [newPartner, setNewPartner] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });

  const executives = executivesQuery.data?.executives ?? [];
  const vehicle_choices = executivesQuery.data?.vehicle_choices ?? [];

  const handleVehicleChange = async (userId, registrationNumber) => {
    if (registrationNumber === '') {
      unassignMutation.mutate({ userId });
      return;
    }
    try {
      await assignMutation.mutateAsync({ userId, registration_number: registrationNumber, force_assign: false });
    } catch (err) {
      const data = err?.response?.data;
      if (err?.response?.status === 409 && data?.require_force && data?.current_assignee) {
        const assigneeName = data.current_assignee?.exec_name || 'another partner';
        const ok = window.confirm(
          `Vehicle ${data.registration_number || registrationNumber} is currently assigned to ${assigneeName}. Assign it to this partner anyway? The current assignee will be unassigned.`
        );
        if (ok) {
          try {
            await assignMutation.mutateAsync({ userId, registration_number: registrationNumber, force_assign: true });
          } catch (e) {
            showErrorToast(e?.response?.data?.error || e?.message || 'Failed to assign.', 'Error');
          }
        }
      }
    }
  };

  const isLoading = executivesQuery.isLoading;
  const isError = executivesQuery.isError;
  const isPending = assignMutation.isPending || unassignMutation.isPending;

  const handleCreatePartnerChange = (e) => {
    const { name, value } = e.target;
    setNewPartner((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreatePartnerSubmit = (e) => {
    e.preventDefault();
    if (!newPartner.firstName || !newPartner.lastName || !newPartner.email || !newPartner.phone || !newPartner.password) {
      showErrorToast('Please fill all fields.', 'Error');
      return;
    }
    createPartnerMutation.mutate(newPartner, {
      onSuccess: () => {
        setNewPartner({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
        });
        executivesQuery.refetch();
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-100" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <MLNavbar onSignInClick={() => {}} />
      <main className="pt-20 sm:pt-24 pb-24 px-4 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Partner Manager</h1>
              <p className="text-sm text-gray-600 mt-1">
                Create delivery partners and assign vehicles for today&apos;s routes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-white shadow-md border border-gray-100 p-4 sm:p-5">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <MdPerson style={{ color: accent }} />
                Create delivery partner
              </h2>
              <form
                onSubmit={handleCreatePartnerSubmit}
                className="mt-4 grid grid-cols-1 gap-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">First name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={newPartner.firstName}
                      onChange={handleCreatePartnerChange}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-orange-400"
                      placeholder="e.g. Anu"
                      disabled={createPartnerMutation.isPending}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Last name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={newPartner.lastName}
                      onChange={handleCreatePartnerChange}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-orange-400"
                      placeholder="e.g. Kumar"
                      disabled={createPartnerMutation.isPending}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={newPartner.email}
                      onChange={handleCreatePartnerChange}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-orange-400"
                      placeholder="partner@example.com"
                      disabled={createPartnerMutation.isPending}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={newPartner.phone}
                      onChange={handleCreatePartnerChange}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-orange-400"
                      placeholder="+91 98765 43210"
                      disabled={createPartnerMutation.isPending}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-600">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={newPartner.password}
                    onChange={handleCreatePartnerChange}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-orange-400"
                    placeholder="Minimum 8 characters"
                    disabled={createPartnerMutation.isPending}
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm"
                    style={{ backgroundColor: accent }}
                    disabled={createPartnerMutation.isPending}
                  >
                    {createPartnerMutation.isPending ? 'Creating…' : 'Create partner'}
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-2xl bg-white shadow-md border border-gray-100 p-4 sm:p-5 flex flex-col min-h-[260px]">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <MdPerson style={{ color: accent }} />
                Delivery partners
              </h2>
              {isLoading && <p className="py-4 text-sm text-gray-500">Loading…</p>}
              {isError && (
                <p className="py-4 text-sm text-red-600">
                  {executivesQuery.error?.response?.data?.message || executivesQuery.error?.message || 'Failed to load.'}
                </p>
              )}
              {!isLoading && !isError && executives.length === 0 && (
                <p className="py-4 text-sm text-gray-500">No delivery partners in this company yet.</p>
              )}
              {!isLoading && !isError && executives.length > 0 && (
                <ul className="mt-3 space-y-3 overflow-y-auto max-h-[420px] pr-1">
                  {executives.map((exec) => {
                    const userId = exec.user_id ?? exec.id;
                    const currentVehicle = exec.vehicle ?? '';
                    return (
                      <li
                        key={userId}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 px-4 rounded-xl bg-gray-50 border border-gray-100"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-gray-800 block truncate">
                            {exec.exec_name ?? exec.email ?? userId}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">({exec.status ?? 'ACTIVE'})</span>
                          {exec.whatsapp_number && (
                            <span className="text-xs text-gray-600 block mt-0.5">WhatsApp: {exec.whatsapp_number}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <MdDirectionsBike className="w-5 h-5 flex-shrink-0 text-gray-400" />
                          <select
                            value={currentVehicle}
                            onChange={(e) => handleVehicleChange(userId, e.target.value)}
                            disabled={isPending}
                            className="flex-1 min-w-0 min-h-[44px] pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm font-medium focus:ring-2 focus:ring-offset-0 focus:border-gray-400 disabled:opacity-60"
                            style={{ borderColor: accent, maxWidth: '100%' }}
                          >
                            <option value="">— No vehicle —</option>
                            {vehicle_choices.map((reg) => (
                              <option key={reg} value={reg}>
                                {reg}
                              </option>
                            ))}
                          </select>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

        </motion.div>
      </main>
    </div>
  );
};

export default MLPartnerManagerDashboard;
