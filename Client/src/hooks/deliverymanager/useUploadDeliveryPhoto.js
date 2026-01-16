import { useMutation } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';

/**
 * Hook for uploading delivery photos to external API
 * @returns {Object} Mutation object with mutate, isLoading, error, etc.
 */
export const useUploadDeliveryPhoto = () => {
  return useMutation({
    mutationFn: async ({ image, address_id, session }) => {
      // Validate inputs
      if (!image) {
        throw new Error('Image file is required');
      }

      if (!address_id) {
        throw new Error('Address ID is required');
      }

      if (!session) {
        throw new Error('Session is required (BREAKFAST, LUNCH, or DINNER)');
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', image);
      formData.append('address_id', address_id);
      formData.append('session', session.toUpperCase()); // Ensure uppercase

      // Make API call
      const response = await axiosInstance.post('/delivery-executives/upload-delivery-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to upload delivery photo');
      }

      return response.data;
    },
    onError: (error) => {
      console.error('Error uploading delivery photo:', error);
    },
  });
};
