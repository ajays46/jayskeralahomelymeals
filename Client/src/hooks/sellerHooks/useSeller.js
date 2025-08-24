import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';
import useAuthStore from '../../stores/Zustand.store';

export const useSeller = () => {
  const [sellerProfile, setSellerProfile] = useState(null);
  const [sellerUsers, setSellerUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { accessToken, roles } = useAuthStore();

  const isSeller = roles?.includes('SELLER');

  // Get seller profile
  const getSellerProfile = async () => {
    if (!isSeller) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get('/seller/profile');
      if (response.data.success) {
        setSellerProfile(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch seller profile');
    } finally {
      setLoading(false);
    }
  };

  // Get seller's created users
  const getSellerUsers = async () => {
    if (!isSeller) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get('/seller/users');
      if (response.data.success) {
        setSellerUsers(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch seller users');
    } finally {
      setLoading(false);
    }
  };

  // Create contact
  const createContact = async (contactData) => {
    if (!isSeller) {
      throw new Error('Only sellers can create contacts');
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.post('/seller/create-contact', contactData);
      if (response.data.success) {
        // Refresh the users list
        await getSellerUsers();
        return response.data;
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create contact';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSeller) {
      getSellerProfile();
      getSellerUsers();
    }
  }, [isSeller]);

  return {
    sellerProfile,
    sellerUsers,
    loading,
    error,
    isSeller,
    getSellerProfile,
    getSellerUsers,
    createContact,
    refreshData: () => {
      getSellerProfile();
      getSellerUsers();
    }
  };
};
