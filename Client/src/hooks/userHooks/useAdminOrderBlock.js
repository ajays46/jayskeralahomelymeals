import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/Zustand.store';

export const useAdminOrderBlock = () => {
  const [showAdminBlockModal, setShowAdminBlockModal] = useState(false);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleOrderError = (error) => {
    // Check if the error is related to admin order blocking
    if (error?.response?.data?.message?.includes('Admins are not allowed to place orders')) {
      setShowAdminBlockModal(true);
      return true; // Error was handled
    }
    
    // Also check for pricing calculation errors (same middleware applies)
    if (error?.response?.data?.message?.includes('Admins are not allowed to place orders')) {
      setShowAdminBlockModal(true);
      return true; // Error was handled
    }
    
    return false; // Error was not handled
  };

  const handleSwitchAccount = () => {
    // Use proper logout from Zustand store
    logout();
    
    // Clear any additional localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Navigate to home page
    navigate('/jkhm');
  };

  const closeAdminBlockModal = () => {
    setShowAdminBlockModal(false);
  };

  return {
    showAdminBlockModal,
    handleOrderError,
    handleSwitchAccount,
    closeAdminBlockModal
  };
};
