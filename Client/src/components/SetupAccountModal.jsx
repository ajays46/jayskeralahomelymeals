import React, { useEffect, useMemo, useState } from 'react';
import { MdLock, MdPhone, MdVisibility, MdVisibilityOff, MdClose, MdCheck } from 'react-icons/md';
import api from '../api/axios';
import useAuthStore from '../stores/Zustand.store';
import Terms from './Terms';
import { showErrorToast, showSuccessToast } from '../utils/toastConfig';

const MOBILE_PATTERN = /^\d{10}$/;

const SetupAccountModal = ({ isOpen, onClose }) => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const [formData, setFormData] = useState({
    phone: '',
    newPassword: '',
    confirmPassword: '',
    termsAccepted: false,
  });
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ newPassword: false, confirmPassword: false });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;
    const digits = String(user?.phone || '').replace(/\D/g, '');
    setFormData({
      phone: digits.length >= 10 ? digits.slice(-10) : '',
      newPassword: '',
      confirmPassword: '',
      termsAccepted: Boolean(user?.termsAccepted),
    });
    setErrors({});
  }, [isOpen, user?.phone, user?.termsAccepted]);

  const passwordChecks = useMemo(() => ({
    length: formData.newPassword.length >= 8,
    uppercase: /[A-Z]/.test(formData.newPassword),
    lowercase: /[a-z]/.test(formData.newPassword),
    number: /[0-9]/.test(formData.newPassword),
    special: /[!@#$%^&*]/.test(formData.newPassword),
  }), [formData.newPassword]);

  const resetAndClose = () => {
    setFormData({
      phone: '',
      newPassword: '',
      confirmPassword: '',
      termsAccepted: false,
    });
    setShowPasswords({ newPassword: false, confirmPassword: false });
    setErrors({});
    onClose?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    const digits = String(formData.phone || '').replace(/\D/g, '');
    if (!MOBILE_PATTERN.test(digits)) {
      nextErrors.phone = 'Please enter a valid 10-digit mobile number.';
    }
    if (!formData.newPassword) {
      nextErrors.newPassword = 'Password is required.';
    } else {
      const allChecks = Object.values(passwordChecks).every(Boolean);
      if (!allChecks) {
        nextErrors.newPassword = 'Password does not meet all requirements.';
      }
    }
    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (formData.newPassword !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }
    if (!formData.termsAccepted) {
      nextErrors.termsAccepted = 'Please accept Terms & Conditions.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsLoading(true);
    try {
      const response = await api.post('/auth/google/setup-account', {
        phone: digits,
        termsAccepted: true,
        newPassword: formData.newPassword,
      });
      if (!response?.data?.success || !response?.data?.data) {
        throw new Error(response?.data?.message || 'Unable to complete account setup.');
      }
      setUser({
        ...(user || {}),
        ...response.data.data,
      });
      showSuccessToast('Account setup completed. You can now sign in with password.', 'Done');
      resetAndClose();
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Failed to set up account.';
      showErrorToast(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
        <div className="bg-white w-full h-[100dvh] sm:h-auto sm:max-h-[92vh] sm:rounded-xl sm:shadow-2xl sm:max-w-md mx-auto overflow-y-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white p-4 sm:p-6">
            <h2 className="text-xl font-bold text-gray-900">Setup Account</h2>
            <button type="button" onClick={resetAndClose} className="text-gray-500 hover:text-gray-700">
              <MdClose className="text-2xl" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5 p-4 pb-8 sm:p-6">
            <p className="text-sm text-gray-600">
              Complete your account to sign in with email/phone and password.
            </p>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Mobile Number</label>
              <div className="relative">
                <MdPhone className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, phone: e.target.value }));
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                  className={`w-full rounded-lg border py-3 pl-10 pr-3 focus:border-transparent focus:ring-2 focus:ring-[#FE8C00] ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter 10-digit mobile number"
                  disabled={isLoading}
                />
              </div>
              {errors.phone ? <p className="mt-1 text-sm text-red-600">{errors.phone}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Set Password</label>
              <div className="relative">
                <MdLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type={showPasswords.newPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, newPassword: e.target.value }));
                    if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }));
                  }}
                  className={`w-full rounded-lg border py-3 pl-10 pr-11 focus:border-transparent focus:ring-2 focus:ring-[#FE8C00] ${errors.newPassword ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter new password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((prev) => ({ ...prev, newPassword: !prev.newPassword }))}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.newPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
              {errors.newPassword ? <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p> : null}
              {formData.newPassword ? (
                <div className="mt-3 rounded-lg bg-gray-50 p-3">
                  <p className="mb-2 text-xs font-semibold text-gray-700">Password requirements</p>
                  {[
                    ['length', 'At least 8 characters'],
                    ['uppercase', 'One uppercase letter'],
                    ['lowercase', 'One lowercase letter'],
                    ['number', 'One number'],
                    ['special', 'One special character (!@#$%^&*)'],
                  ].map(([key, label]) => (
                    <div key={key} className="mb-1 flex items-center gap-2 text-xs">
                      {passwordChecks[key] ? <MdCheck className="text-green-600" /> : <span className="h-2 w-2 rounded-full border border-gray-300" />}
                      <span className={passwordChecks[key] ? 'text-green-700' : 'text-gray-500'}>{label}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="relative">
                <MdLock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type={showPasswords.confirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }));
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                  className={`w-full rounded-lg border py-3 pl-10 pr-11 focus:border-transparent focus:ring-2 focus:ring-[#FE8C00] ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Re-enter password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((prev) => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirmPassword ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
              {errors.confirmPassword ? <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p> : null}
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.termsAccepted}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, termsAccepted: e.target.checked }));
                  if (errors.termsAccepted) setErrors((prev) => ({ ...prev, termsAccepted: '' }));
                }}
                className="mt-1"
                disabled={isLoading}
              />
              <span>
                I accept the{' '}
                <button type="button" onClick={() => setShowTermsModal(true)} className="font-semibold text-orange-600 underline">
                  Terms & Conditions
                </button>
                .
              </span>
            </label>
            {errors.termsAccepted ? <p className="text-sm text-red-600">{errors.termsAccepted}</p> : null}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={resetAndClose}
                disabled={isLoading}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 rounded-lg bg-[#FE8C00] px-4 py-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
              >
                {isLoading ? 'Saving...' : 'Setup Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Terms isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </>
  );
};

export default SetupAccountModal;
