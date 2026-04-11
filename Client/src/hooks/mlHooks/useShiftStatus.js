/**
 * useShiftStatus - Fetches shift status from API (GET /api/shift/status). Sync result to Zustand store.
 */
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import { API } from '../../api/endpoints';
import useMLDeliveryPartnerStore from '../../stores/MLDeliveryPartner.store.js';

const SHIFT_STATUS_KEY = ['ml-shift-status'];

export function useShiftStatus(options = {}) {
  const setInShift = useMLDeliveryPartnerStore((s) => s.setInShift);

  const query = useQuery({
    queryKey: SHIFT_STATUS_KEY,
    queryFn: async () => {
      const { data } = await api.get(`${API.MAX_ROUTE}/shift/status`);
      const inShift = !!data?.inShift;
      setInShift(inShift);
      return { inShift };
    },
    ...options,
  });

  const inShift = useMLDeliveryPartnerStore((s) => s.inShift);
  return {
    inShift,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    query,
  };
}

export { SHIFT_STATUS_KEY };
