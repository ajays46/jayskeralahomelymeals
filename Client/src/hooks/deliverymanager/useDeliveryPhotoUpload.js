import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';

/**
 * Delivery Photo Upload Hook
 * React Query hook for uploading delivery photos to external API
 */

/**
 * Upload Delivery Photo (Mutation)
 * Uploads a delivery photo with address_id and session to external API
 * @param {Object} photoData - { image: File, address_id: string, session: string }
 */
export const useUploadDeliveryPhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (photoData) => {
      const { image, address_id, session } = photoData;

      if (!image) {
        throw new Error('Image file is required');
      }

      if (!address_id) {
        throw new Error('Address ID is required');
      }

      if (!session) {
        throw new Error('Session is required');
      }

      // Convert session to uppercase (BREAKFAST, LUNCH, DINNER)
      const sessionUpper = session.toUpperCase();

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', image);
      formData.append('address_id', address_id);
      formData.append('session', sessionUpper);

      // Don't set Content-Type manually - axios will set it automatically with boundary for FormData
      const response = await axiosInstance.post('/delivery-executives/upload-delivery-photo', formData, {
        timeout: 60000, // 60 seconds timeout for large file uploads
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to upload photo');
      }

      return response.data;
    },
    onSuccess: (data) => {
      // Optionally invalidate related queries if needed
      queryClient.invalidateQueries({ queryKey: ['deliveryStatus'] });
    },
    onError: (error) => {
      console.error('Error uploading delivery photo:', error);
      throw error; // Re-throw to be caught by component
    }
  });
};
