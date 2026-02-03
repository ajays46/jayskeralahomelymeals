import { useMutation } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';

/**
 * Hook for uploading pre-delivery photos/videos to external API (before delivery at stop).
 * Same params as delivery photo: address_id, session, date, file(s), optional comments.
 * @returns {Object} Mutation object with mutate, isLoading, error, etc.
 */
export const useUploadPreDeliveryPhoto = () => {
  return useMutation({
    mutationFn: async ({ images, address_id, session, date, comments = '' }) => {
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

      const formData = new FormData();
      formData.append('address_id', address_id);
      formData.append('session', session.toUpperCase());
      formData.append('date', date);
      if (comments != null && String(comments).trim() !== '') {
        formData.append('comments', String(comments).trim());
      }
      images.forEach((file) => {
        formData.append('file', file);
      });

      const response = await axiosInstance.post('/delivery-executives/upload-pre-delivery-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to upload pre-delivery photos');
      }

      return response.data;
    },
    onError: (error) => {
      console.error('Error uploading pre-delivery photos:', error);
    },
  });
};
