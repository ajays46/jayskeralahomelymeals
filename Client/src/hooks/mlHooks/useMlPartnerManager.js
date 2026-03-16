/**
 * useMlPartnerManager - Partner Manager: per FRONTEND_EXECUTIVES_VEHICLE_ASSIGNMENT_GUIDE.
 * GET /executives → executives + vehicle_choices; assign by registration_number; 409 + force_assign.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';

const EXECUTIVES_KEY = ['ml-partner-manager', 'executives'];
const PARTNERS_KEY = ['ml-partner-manager', 'partners'];
const VEHICLES_KEY = ['ml-partner-manager', 'vehicles'];

/** Single source: executives + vehicle_choices from 5004 (or fallback). */
export function useMlPartnerManagerExecutives(options = {}) {
  return useQuery({
    queryKey: EXECUTIVES_KEY,
    queryFn: async () => {
      const { data } = await api.get('/ml-partner-manager/executives');
      return {
        executives: data?.executives ?? [],
        vehicle_choices: data?.vehicle_choices ?? [],
      };
    },
    ...options,
  });
}

export function useMlPartnerManagerPartners(options = {}) {
  return useQuery({
    queryKey: PARTNERS_KEY,
    queryFn: async () => {
      const { data } = await api.get('/ml-partner-manager/partners');
      return data?.data ?? [];
    },
    ...options,
  });
}

export function useMlPartnerManagerCreatePartner(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/ml-partner-manager/partners', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTNERS_KEY });
      queryClient.invalidateQueries({ queryKey: EXECUTIVES_KEY });
    },
    ...options,
  });
}

export function useMlPartnerManagerVehicles(userId = null, options = {}) {
  return useQuery({
    queryKey: [...VEHICLES_KEY, userId ?? 'all'],
    queryFn: async () => {
      const params = userId ? { user_id: userId } : {};
      const { data } = await api.get('/ml-partner-manager/vehicles', { params });
      return data?.data ?? [];
    },
    ...options,
  });
}

/** Assign by registration_number. May return 409; use force_assign on retry. */
export function useMlPartnerManagerAssignVehicle(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, registration_number, force_assign = false }) => {
      const { data } = await api.post('/ml-partner-manager/vehicles/assign', {
        userId,
        registration_number,
        force_assign,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXECUTIVES_KEY });
      queryClient.invalidateQueries({ queryKey: VEHICLES_KEY });
    },
    ...options,
  });
}

/** Unassign by userId (registration_number: null on 5004). */
export function useMlPartnerManagerUnassignVehicle(options = {}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }) => {
      const { data } = await api.post('/ml-partner-manager/vehicles/unassign', { userId });
      return data?.data ?? data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXECUTIVES_KEY });
      queryClient.invalidateQueries({ queryKey: VEHICLES_KEY });
    },
    ...options,
  });
}
