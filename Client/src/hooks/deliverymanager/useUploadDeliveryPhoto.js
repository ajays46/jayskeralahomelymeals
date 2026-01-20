import { useMutation } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';

/**
 * Hook for uploading delivery photos/videos to external API
 * @returns {Object} Mutation object with mutate, isLoading, error, etc.
 */
export const useUploadDeliveryPhoto = () => {
  return useMutation({
    mutationFn: async ({ images, address_id, session, date }) => {
      // Validate inputs
      if (!images || images.length === 0) {
        throw new Error('At least one image or video file is required');
      }

      if (!address_id) {
        throw new Error('Address ID is required');
      }

      if (!session) {
        throw new Error('Session is required (BREAKFAST, LUNCH, or DINNER)');
      }

      if (!date) {
        throw new Error('Date is required (YYYY-MM-DD format)');
      }

      // Create FormData for file upload
      const formData = new FormData();
      
      // Append all files with 'images[]' key (array format)
      images.forEach((file) => {
        formData.append('images[]', file);
      });
      
      formData.append('address_id', address_id);
      formData.append('session', session.toUpperCase()); // Ensure uppercase
      formData.append('date', date); // Date in YYYY-MM-DD format

      // Make API call
      const response = await axiosInstance.post('/delivery-executives/upload-delivery-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to upload delivery photos');
      }

      return response.data;
    },
    onError: (error) => {
      console.error('Error uploading delivery photos:', error);
    },
  });
};
