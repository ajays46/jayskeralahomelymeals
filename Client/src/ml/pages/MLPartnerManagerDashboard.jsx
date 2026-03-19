/**
 * MLPartnerManagerDashboard - Per FRONTEND_EXECUTIVES_VEHICLE_ASSIGNMENT_GUIDE.
 * Executives + vehicle_choices from 5004; assign by registration_number; 409 → confirm → force_assign.
 */
import React from 'react';
import { motion } from 'framer-motion';
import MLNavbar from '../components/MLNavbar';
import { useTenant } from '../../context/TenantContext';
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
  const activeExecutives = executives.filter((exec) => String(exec.status || 'ACTIVE').toUpperCase() !== 'INACTIVE').length;

  const inputClass =
    'w-full min-h-[42px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0';

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
    <div className="min-h-screen bg-gray-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <MLNavbar onSignInClick={() => {}} />
      <main className="pt-20 sm:pt-24 pb-24 px-4 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Partner Manager Dashboard</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Create delivery partners and assign vehicles for today&apos;s routes.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Partners</p>
                  <p className="text-lg font-bold text-gray-900">{executives.length}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">Active</p>
                  <p className="text-lg font-bold" style={{ color: accent }}>{activeExecutives}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-2xl bg-white border border-gray-100 p-5 sm:p-6 shadow-sm">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <MdPerson className="text-xl" style={{ color: accent }} />
                Create delivery partner
              </h2>
              <form
                onSubmit={handleCreatePartnerSubmit}
                className="mt-4 grid grid-cols-1 gap-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">First name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={newPartner.firstName}
                      onChange={handleCreatePartnerChange}
                      className={inputClass}
                      style={{ ['--tw-ring-color']: `${accent}55` }}
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
                      className={inputClass}
                      style={{ ['--tw-ring-color']: `${accent}55` }}
                      placeholder="e.g. Kumar"
                      disabled={createPartnerMutation.isPending}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-600">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={newPartner.email}
                      onChange={handleCreatePartnerChange}
                      className={inputClass}
                      style={{ ['--tw-ring-color']: `${accent}55` }}
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
                      className={inputClass}
                      style={{ ['--tw-ring-color']: `${accent}55` }}
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
                    className={inputClass}
                    style={{ ['--tw-ring-color']: `${accent}55` }}
                    placeholder="Minimum 8 characters"
                    disabled={createPartnerMutation.isPending}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm active:scale-[0.98] transition-transform disabled:opacity-70"
                    style={{ backgroundColor: accent }}
                    disabled={createPartnerMutation.isPending}
                  >
                    {createPartnerMutation.isPending ? 'Creating…' : 'Create partner'}
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-2xl bg-white border border-gray-100 p-5 sm:p-6 flex flex-col min-h-[260px] shadow-sm">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                <MdPerson className="text-xl" style={{ color: accent }} />
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
                <ul className="mt-4 space-y-3 overflow-y-auto max-h-[460px] pr-1">
                  {executives.map((exec) => {
                    const userId = exec.user_id ?? exec.id;
                    const currentVehicle = exec.vehicle ?? '';
                    return (
                      <li
                        key={userId}
                        className="flex flex-col gap-3 py-3.5 px-4 rounded-xl bg-gray-50 border border-gray-100"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-gray-900 block truncate">
                            {exec.exec_name ?? exec.email ?? userId}
                          </span>
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize bg-white border border-gray-200 text-gray-600">
                            {exec.status ?? 'ACTIVE'}
                          </span>
                          {exec.whatsapp_number && (
                            <span className="text-xs text-gray-600 block mt-0.5">WhatsApp: {exec.whatsapp_number}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 w-full">
                          <MdDirectionsBike className="w-5 h-5 flex-shrink-0" style={{ color: accent }} />
                          <select
                            value={currentVehicle}
                            onChange={(e) => handleVehicleChange(userId, e.target.value)}
                            disabled={isPending}
                            className="flex-1 min-w-0 min-h-[44px] pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm font-medium focus:ring-2 focus:ring-offset-0 disabled:opacity-60"
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
            </section>
          </div>

        </motion.div>
      </main>
    </div>
  );
};

export default MLPartnerManagerDashboard;
