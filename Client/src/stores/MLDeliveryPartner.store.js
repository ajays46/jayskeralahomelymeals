import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Start of today (midnight) in local time, for "new day" expiry. */
function startOfTodayMs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * useMLDeliveryPartnerStore - Delivery partner state: start shift, start route, picked up, delivered.
 * Persisted in localStorage. If driver doesn't logout, data from previous day is cleared on next open (new-day check).
 */
const useMLDeliveryPartnerStore = create(
  persist(
    (set, get) => ({
      // Start shift: driver online/offline (from driver_availability)
      inShift: false,
      setInShift: (inShift) => set({ inShift, lastActivityAt: Date.now() }),

      // Start route: preferred platform (used when starting route without explicit selection)
      platform: 'swiggy',
      setPlatform: (platform) => set({ platform: platform || 'swiggy', lastActivityAt: Date.now() }),

      // Start route: active route (from driver_availability.route_id + stops)
      routeId: null,
      stops: [],
      setActiveRoute: (routeId, stops = []) =>
        set({ routeId: routeId ?? null, stops: Array.isArray(stops) ? stops : [], lastActivityAt: Date.now() }),
      clearActiveRoute: () => set({ routeId: null, stops: [] }),

      // Picked up / Delivered: tripId -> trip_status (from ml_trips; cache after PATCH)
      tripStatusByTripId: {},
      setTripStatus: (tripId, tripStatus) =>
        set((state) => ({
          tripStatusByTripId: {
            ...state.tripStatusByTripId,
            ...(tripId && tripStatus ? { [tripId]: tripStatus } : {}),
          },
          lastActivityAt: Date.now(),
        })),
      getTripStatus: (tripId) => get().tripStatusByTripId[tripId] ?? null,
      clearTripStatus: (tripId) =>
        set((state) => {
          const next = { ...state.tripStatusByTripId };
          delete next[tripId];
          return { tripStatusByTripId: next };
        }),

      // Clear all (e.g. on end shift or logout)
      clearAll: () =>
        set({
          inShift: false,
          routeId: null,
          stops: [],
          tripStatusByTripId: {},
          platform: 'swiggy',
          lastActivityAt: Date.now(),
        }),

      // Not used by UI; only for persist + new-day check
      lastActivityAt: null,
    }),
    {
      name: 'ml_delivery_partner',
      partialize: (state) => ({
        inShift: state.inShift,
        platform: state.platform,
        routeId: state.routeId,
        stops: state.stops,
        tripStatusByTripId: state.tripStatusByTripId,
        lastActivityAt: state.lastActivityAt,
      }),
      onRehydrateStorage: () => (rehydratedState) => {
        if (!rehydratedState?.lastActivityAt) return;
        if (rehydratedState.lastActivityAt < startOfTodayMs()) {
          useMLDeliveryPartnerStore.getState().clearAll();
        }
      },
    }
  )
);

export default useMLDeliveryPartnerStore;
