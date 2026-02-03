import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';

/**
 * Hook for checking if delivery images exist for a specific stop
 * @param {string} addressId - The address ID
 * @param {string} deliveryDate - Delivery date in YYYY-MM-DD format
 * @param {string} deliverySession - Delivery session (BREAKFAST, LUNCH, or DINNER)
 * @param {Object} options - React Query options
 * @returns {Object} Query object with data, isLoading, error, etc.
 */
export const useCheckDeliveryImages = (addressId, deliveryDate, deliverySession, options = {}) => {
  const {
    enabled = true,
    refetchInterval = false, // Don't auto-refetch by default
    staleTime = 30 * 1000, // 30 seconds
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: ['deliveryImages', 'check', addressId, deliveryDate, deliverySession],
    queryFn: async () => {
      if (!addressId || !deliveryDate || !deliverySession) {
        return null;
      }

      const params = new URLSearchParams({
        address_id: addressId,
        delivery_date: deliveryDate,
        delivery_session: deliverySession.toUpperCase()
      });

      const response = await axiosInstance.get(
        `/delivery-executives/check-delivery-images?${params.toString()}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to check delivery images');
      }

      return response.data;
    },
    enabled: enabled && !!addressId && !!deliveryDate && !!deliverySession,
    refetchInterval,
    staleTime,
    ...queryOptions
  });
};

/**
 * Hook to check multiple stops at once (batch check)
 * @param {Array} stops - Array of { addressId, deliveryDate, deliverySession }
 * @param {Object} options - React Query options
 * @returns {Object} Query object with data as a map of addressId_session_date -> status
 */
export const useCheckMultipleDeliveryImages = (stops = [], options = {}) => {
  const {
    enabled = true,
    refetchInterval = false,
    staleTime = 30 * 1000,
    ...queryOptions
  } = options;

  // Create a stable query key from stops (serialize to avoid reference issues)
  const stopsKey = stops.length > 0 
    ? stops.map(s => `${s.addressId}_${s.deliveryDate}_${s.deliverySession}`).sort().join('|')
    : 'empty';

  return useQuery({
    queryKey: ['deliveryImages', 'batch', stopsKey],
    queryFn: async () => {
      if (!stops || stops.length === 0) {
        return {};
      }

      // Check all stops in parallel
      const checkPromises = stops.map(async (stop) => {
        if (!stop.addressId || !stop.deliveryDate || !stop.deliverySession) {
          return null;
        }

        try {
          const params = new URLSearchParams({
            address_id: stop.addressId,
            delivery_date: stop.deliveryDate,
            delivery_session: stop.deliverySession.toUpperCase()
          });

          const response = await axiosInstance.get(
            `/delivery-executives/check-delivery-images?${params.toString()}`
          );

          if (response.data.success) {
            const key = `${stop.addressId}_${stop.deliverySession.toUpperCase()}_${stop.deliveryDate}`;
            return {
              key,
              status: response.data.status,
              hasImages: response.data.hasImages,
              imageCount: response.data.imageCount
            };
          }
        } catch (error) {
          return null;
        }
      });

      const results = await Promise.all(checkPromises);
      
      // Convert to map
      const statusMap = {};
      results.forEach(result => {
        if (result) {
          statusMap[result.key] = {
            status: result.status,
            hasImages: result.hasImages,
            imageCount: result.imageCount
          };
        }
      });

      return statusMap;
    },
    enabled: enabled && stops.length > 0,
    refetchInterval,
    staleTime,
    ...queryOptions
  });
};

/**
 * Hook to check pre-delivery images for multiple stops (calls GET /check-pre-delivery-images)
 * Same key format as delivery images: addressId_session_date
 * @param {Array} stops - Array of { addressId, deliveryDate, deliverySession }
 * @param {Object} options - React Query options
 * @returns {Object} Query object with data as map of key -> { status, hasImages, imageCount }
 */
export const useCheckMultiplePreDeliveryImages = (stops = [], options = {}) => {
  const {
    enabled = true,
    refetchInterval = false,
    staleTime = 30 * 1000,
    ...queryOptions
  } = options;

  const stopsKey = stops.length > 0
    ? stops.map(s => `${s.addressId}_${s.deliveryDate}_${s.deliverySession}`).sort().join('|')
    : 'empty';

  return useQuery({
    queryKey: ['preDeliveryImages', 'batch', stopsKey],
    queryFn: async () => {
      if (!stops || stops.length === 0) {
        return {};
      }

      const checkPromises = stops.map(async (stop) => {
        if (!stop.addressId || !stop.deliveryDate || !stop.deliverySession) {
          return null;
        }

        try {
          const params = new URLSearchParams({
            address_id: stop.addressId,
            delivery_date: stop.deliveryDate,
            delivery_session: stop.deliverySession.toUpperCase()
          });

          const response = await axiosInstance.get(
            `/delivery-executives/check-pre-delivery-images?${params.toString()}`
          );

          if (response.data.success) {
            const key = `${stop.addressId}_${stop.deliverySession.toUpperCase()}_${stop.deliveryDate}`;
            return {
              key,
              status: response.data.status,
              hasImages: response.data.hasImages,
              imageCount: response.data.imageCount
            };
          }
        } catch (error) {
          return null;
        }
      });

      const results = await Promise.all(checkPromises);
      const statusMap = {};
      results.forEach(result => {
        if (result) {
          statusMap[result.key] = {
            status: result.status,
            hasImages: result.hasImages,
            imageCount: result.imageCount
          };
        }
      });

      return statusMap;
    },
    enabled: enabled && stops.length > 0,
    refetchInterval,
    staleTime,
    ...queryOptions
  });
};
