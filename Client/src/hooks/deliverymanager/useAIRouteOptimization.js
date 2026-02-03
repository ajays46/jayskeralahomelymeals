import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../api/axios';

/**
 * AI Route Optimization Hooks
 * React Query hooks for AI route optimization API calls
 */

// Query Keys
export const aiRouteKeys = {
  all: ['aiRoutes'],
  health: () => [...aiRouteKeys.all, 'health'],
  availableDates: () => [...aiRouteKeys.all, 'availableDates'],
  deliveryData: (filters) => [...aiRouteKeys.all, 'deliveryData', filters],
  routePlan: (params) => [...aiRouteKeys.all, 'routePlan', params],
  trackingStatus: (routeId) => [...aiRouteKeys.all, 'trackingStatus', routeId],
  allVehicleTracking: () => [...aiRouteKeys.all, 'allVehicleTracking'],
  // Traffic and Route Order
  checkTraffic: (routeId) => [...aiRouteKeys.all, 'checkTraffic', routeId],
  routeOrder: (routeId) => [...aiRouteKeys.all, 'routeOrder', routeId],
  routeStatus: (routeId) => [...aiRouteKeys.all, 'routeStatus', routeId],
  // Weather
  currentWeather: (params) => [...aiRouteKeys.all, 'currentWeather', params],
  weatherForecast: (params) => [...aiRouteKeys.all, 'weatherForecast', params],
  weatherZones: (params) => [...aiRouteKeys.all, 'weatherZones', params],
  weatherPredictions: (params) => [...aiRouteKeys.all, 'weatherPredictions', params],
  // Zones
  zones: (params) => [...aiRouteKeys.all, 'zones', params],
  zone: (zoneId) => [...aiRouteKeys.all, 'zone', zoneId],
  zoneDeliveries: (zoneId, params) => [...aiRouteKeys.all, 'zoneDeliveries', zoneId, params],
  // Address
  missingGeoLocations: (limit) => [...aiRouteKeys.all, 'missingGeoLocations', limit],
};

/**
 * Check API Health
 */
export const useAIRouteHealth = (options = {}) => {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 30 * 1000, // 30 seconds
    cacheTime = 5 * 60 * 1000, // 5 minutes
    retry = 1,
    retryDelay = 1000,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: aiRouteKeys.health(),
    queryFn: async () => {
      const response = await axiosInstance.get('/ai-routes/health');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to check API health');
      }
      
      return response.data;
    },
    enabled,
    refetchOnWindowFocus,
    staleTime,
    cacheTime,
    retry,
    retryDelay,
    ...queryOptions
  });
};

/**
 * Fetch Available Dates
 */
export const useAvailableDates = (options = {}) => {
  const {
    limit = 30,
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    retry = 2,
    retryDelay = 1000,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: aiRouteKeys.availableDates(),
    queryFn: async () => {
      const response = await axiosInstance.get(`/ai-routes/delivery-data/available-dates`, {
        params: { limit }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch available dates');
      }
      
      return response.data;
    },
    enabled,
    refetchOnWindowFocus,
    staleTime,
    cacheTime,
    retry,
    retryDelay,
    ...queryOptions
  });
};

/**
 * Fetch Delivery Data
 */
export const useDeliveryData = (filters = {}, options = {}) => {
  const {
    date,
    session,
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 2 * 60 * 1000, // 2 minutes
    cacheTime = 5 * 60 * 1000, // 5 minutes
    retry = 2,
    retryDelay = 1000,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: aiRouteKeys.deliveryData({ date, session }),
    queryFn: async () => {
      const params = {};
      if (date) params.date = date;
      if (session) params.session = session;
      
      const response = await axiosInstance.get('/ai-routes/delivery-data', { params });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch delivery data');
      }
      
      return response.data;
    },
    enabled: enabled && !!(date && session),
    refetchOnWindowFocus,
    staleTime,
    cacheTime,
    retry,
    retryDelay,
    ...queryOptions
  });
};

/**
 * Plan Route (Mutation)
 */
export const usePlanRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (routeData) => {
      try {
        const response = await axiosInstance.post('/ai-routes/route/plan', routeData);
        
        if (!response.data.success) {
          // Create error with warnings if available
          const error = new Error(response.data.message || 'Failed to plan route');
          error.warnings = response.data.warnings || [];
          error.responseData = response.data; // Preserve full response for warnings
          throw error;
        }
        
        return response.data;
      } catch (error) {
        // If it's an axios error with response data, preserve warnings
        if (error.response?.data) {
          const customError = new Error(
            error.response.data.message || error.message || 'Failed to plan route'
          );
          customError.warnings = error.response.data.warnings || [];
          customError.responseData = error.response.data;
          customError.status = error.response.status;
          throw customError;
        }
        // Re-throw if it's already our custom error or if no response data
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: aiRouteKeys.routePlan(variables) });
      queryClient.invalidateQueries({ queryKey: aiRouteKeys.deliveryData() });
    },
    onError: (error) => {
      console.error('Error planning route:', error);
    }
  });
};

/**
 * Reassign Driver (Mutation)
 * Body: { route_id, new_driver_name } for single reassign, or { exchange: true, route_id_1, route_id_2 } for exchange
 */
export const useReassignDriver = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const response = await axiosInstance.post('/ai-routes/route/reassign-driver', body);
      if (!response.data.success) {
        throw new Error(response.data.message || response.data.error || 'Reassign driver failed');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiRouteKeys.all });
    },
    onError: (error) => {
      console.error('Reassign driver error:', error);
    }
  });
};

/**
 * Move Stop (Mutation)
 * Body: { from_route_id, to_route_id, stop_identifier: { delivery_id } or { stop_order }, insert_at_order? }
 */
export const useMoveStop = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const response = await axiosInstance.post('/ai-routes/route/move-stop', body);
      if (!response.data.success) {
        throw new Error(response.data.message || response.data.error || 'Move stop failed');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiRouteKeys.all });
    },
    onError: (error) => {
      console.error('Move stop error:', error);
    }
  });
};

/**
 * Predict Start Time (Mutation)
 */
export const usePredictStartTime = () => {
  return useMutation({
    mutationFn: async (predictionData) => {
      const response = await axiosInstance.post('/ai-routes/route/predict-start-time', predictionData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to predict start time');
      }
      
      return response.data;
    },
    onError: (error) => {
      console.error('Error predicting start time:', error);
    }
  });
};

/**
 * Start Journey (Mutation) - NEW API: /api/journey/start
 * Sends: route_id, driver_id (per documentation)
 */
export const useStartJourney = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (journeyData) => {
      const { driver_id, route_id } = journeyData;
      
      // Build request body - include route_id if provided
      const requestBody = {
        driver_id
      };
      
      // Include route_id if provided (required for session-specific routes)
      if (route_id) {
        requestBody.route_id = route_id;
      }
      
      // Send driver_id and route_id to the API
      const response = await axiosInstance.post('/ai-routes/journey/start', requestBody);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to start journey');
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      if (data.route_id) {
        queryClient.invalidateQueries({ 
          queryKey: aiRouteKeys.trackingStatus(data.route_id) 
        });
      }
      queryClient.invalidateQueries({ queryKey: aiRouteKeys.all });
    },
    onError: (error) => {
      console.error('Error starting journey:', error);
    }
  });
};

/**
 * Stop Reached / Mark Stop (Mutation) - NEW API: /api/journey/mark-stop
 * Mark delivery stop as reached/delivered
 * Uses new format matching documentation: route_id, stop_order, delivery_id, completed_at, current_location
 */
export const useStopReached = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stopData) => {
      const { 
        route_id, 
        planned_stop_id,
        stop_order, // Keep for backward compatibility
        delivery_id, 
        driver_id,
        completed_at,
        current_location,
        // Legacy parameters (for backward compatibility)
        user_id,
        latitude,
        longitude,
        status,
        packages_delivered,
        comments // Comments field for delivery notes
      } = stopData;
      
      // Build request body according to documentation format
      // Prefer planned_stop_id over stop_order
      const requestBody = {
        route_id,
        delivery_id
      };
      
      // Use planned_stop_id if provided, otherwise fallback to stop_order
      if (planned_stop_id && typeof planned_stop_id === 'string' && planned_stop_id.trim() !== '') {
        requestBody.planned_stop_id = planned_stop_id;
      } else if (stop_order !== undefined) {
        requestBody.stop_order = stop_order;
      }
      
      // Add driver_id if provided (required by external API)
      if (driver_id) {
        requestBody.driver_id = driver_id;
      } else if (user_id) {
        // Fallback to user_id if driver_id not provided
        requestBody.driver_id = user_id;
      }
      
      // Add completed_at if provided
      if (completed_at) {
        requestBody.completed_at = completed_at;
      }
      
      // Add status if provided (Delivered or CUSTOMER_UNAVAILABLE)
      if (status) {
        requestBody.status = status;
      }
      
      // Add comments if provided (optional field, max 500 characters)
      if (comments && typeof comments === 'string' && comments.trim()) {
        requestBody.comments = comments.trim();
      }
      
      // Add current_location if available (new format)
      if (current_location && current_location.lat && current_location.lng) {
        requestBody.current_location = {
          lat: current_location.lat,
          lng: current_location.lng
        };
      } else if (latitude !== undefined && longitude !== undefined) {
        // Legacy format - convert to new format
        requestBody.current_location = {
          lat: latitude,
          lng: longitude
        };
      }
      
      // Use only the mark-stop endpoint (no fallback)
      const response = await axiosInstance.post('/ai-routes/journey/mark-stop', requestBody);
      
      if (!response.data.success) {
        throw new Error(response.data.message || response.data.error || 'Failed to mark stop reached');
      }
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      if (variables.route_id) {
        queryClient.invalidateQueries({ 
          queryKey: aiRouteKeys.trackingStatus(variables.route_id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: aiRouteKeys.routeOrder(variables.route_id) 
        });
      }
      queryClient.invalidateQueries({ queryKey: aiRouteKeys.all });
    },
    onError: (error) => {
      console.error('Error marking stop reached:', error);
    }
  });
};

/**
 * End Journey (Mutation) - NEW API: /api/journey/end
 * End journey with final location
 */
export const useEndJourney = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (journeyData) => {
      const { user_id, route_id, latitude, longitude } = journeyData;
      
      const response = await axiosInstance.post('/ai-routes/journey/end', {
        user_id,
        route_id,
        latitude,
        longitude
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to end journey');
      }
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      if (variables.route_id) {
        queryClient.invalidateQueries({ 
          queryKey: aiRouteKeys.trackingStatus(variables.route_id) 
        });
      }
      queryClient.invalidateQueries({ queryKey: aiRouteKeys.all });
    },
    onError: (error) => {
      console.error('Error ending journey:', error);
    }
  });
};

/**
 * Get Journey Status - NEW API: /api/journey/status/:route_id
 */
export const useJourneyStatus = (routeId, options = {}) => {
  const {
    enabled = true,
    refetchInterval = 30000,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: aiRouteKeys.trackingStatus(routeId),
    queryFn: async () => {
      const response = await axiosInstance.get(`/ai-routes/journey/status/${routeId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get journey status');
      }
      
      return response.data;
    },
    enabled: enabled && !!routeId,
    refetchInterval,
    ...queryOptions
  });
};

/**
 * Fetch Tracking Status
 */
export const useTrackingStatus = (routeId, options = {}) => {
  const {
    enabled = true,
    refetchInterval = 30000, // Refetch every 30 seconds for active routes
    refetchOnWindowFocus = true,
    staleTime = 10 * 1000, // 10 seconds
    cacheTime = 5 * 60 * 1000, // 5 minutes
    retry = 2,
    retryDelay = 1000,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: aiRouteKeys.trackingStatus(routeId),
    queryFn: async () => {
      const response = await axiosInstance.get(`/ai-routes/route/tracking-status/${routeId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch tracking status');
      }
      
      return response.data;
    },
    enabled: enabled && !!routeId,
    refetchInterval,
    refetchOnWindowFocus,
    staleTime,
    cacheTime,
    retry,
    retryDelay,
    ...queryOptions
  });
};

/**
 * Vehicle Tracking (Mutation)
 * Save vehicle GPS tracking points for complete journey tracking
 */
export const useVehicleTracking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trackingData) => {
      const response = await axiosInstance.post('/ai-routes/vehicle-tracking', trackingData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to save vehicle tracking data');
      }
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate tracking status for the route
      if (variables.route_id) {
        queryClient.invalidateQueries({ 
          queryKey: aiRouteKeys.trackingStatus(variables.route_id) 
        });
      }
      queryClient.invalidateQueries({ queryKey: aiRouteKeys.all });
    },
    onError: (error) => {
      console.error('Error saving vehicle tracking:', error);
    }
  });
};

/**
 * Get All Vehicle Tracking
 * Fetch all active vehicle tracking data
 */
export const useGetAllVehicleTracking = (options = {}) => {
  const {
    enabled = true,
    refetchInterval = 30000, // Refetch every 30 seconds for real-time updates
    refetchOnWindowFocus = true,
    staleTime = 10 * 1000, // 10 seconds
    cacheTime = 5 * 60 * 1000, // 5 minutes
    retry = 2,
    retryDelay = 1000,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: aiRouteKeys.allVehicleTracking(),
    queryFn: async () => {
      const response = await axiosInstance.get('/ai-routes/vehicle/tracking/all');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch all vehicle tracking');
      }
      
      return response.data;
    },
    enabled,
    refetchInterval,
    refetchOnWindowFocus,
    staleTime,
    cacheTime,
    retry,
    retryDelay,
    ...queryOptions
  });
};

/**
 * Get Current Weather
 */
export const useCurrentWeather = (params = {}, options = {}) => {
  const {
    zone_id,
    latitude,
    longitude,
    lat, // Support 'lat' from documentation
    lng  // Support 'lng' from documentation
  } = params;
  
  const {
    enabled = true,
    refetchInterval = 5 * 60 * 1000, // 5 minutes
    staleTime = 2 * 60 * 1000, // 2 minutes
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: aiRouteKeys.currentWeather({ zone_id, latitude: lat || latitude, longitude: lng || longitude }),
    queryFn: async () => {
      const queryParams = {};
      if (zone_id) queryParams.zone_id = zone_id;
      // Support both 'lat'/'lng' (documentation) and 'latitude'/'longitude' (current)
      if (lat || latitude) queryParams.lat = lat || latitude;
      if (lng || longitude) queryParams.lng = lng || longitude;
      
      const response = await axiosInstance.get('/ai-routes/weather/current', { params: queryParams });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch current weather');
      }
      
      return response.data;
    },
    enabled,
    refetchInterval,
    staleTime,
    ...queryOptions
  });
};

/**
 * Get Weather Forecast
 */
export const useWeatherForecast = (params = {}, options = {}) => {
  const {
    zone_id,
    latitude,
    longitude,
    days = 5,
    session
  } = params;
  
  const {
    enabled = true,
    staleTime = 10 * 60 * 1000, // 10 minutes
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: aiRouteKeys.weatherForecast({ zone_id, latitude, longitude, days, session }),
    queryFn: async () => {
      const queryParams = { days };
      if (zone_id) queryParams.zone_id = zone_id;
      if (latitude) queryParams.latitude = latitude;
      if (longitude) queryParams.longitude = longitude;
      if (session) queryParams.session = session;
      
      const response = await axiosInstance.get('/ai-routes/weather/forecast', { params: queryParams });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch weather forecast');
      }
      
      return response.data;
    },
    enabled,
    staleTime,
    ...queryOptions
  });
};

/**
 * Get Weather for All Zones
 */
export const useWeatherZones = (params = {}, options = {}) => {
  const {
    priority,
    is_active = 1
  } = params;
  
  const {
    enabled = true,
    refetchInterval = 5 * 60 * 1000, // 5 minutes
    staleTime = 2 * 60 * 1000, // 2 minutes
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: aiRouteKeys.weatherZones({ priority, is_active }),
    queryFn: async () => {
      const queryParams = { is_active };
      if (priority !== undefined) queryParams.priority = priority;
      
      const response = await axiosInstance.get('/ai-routes/weather/zones', { params: queryParams });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch zones weather');
      }
      
      return response.data;
    },
    enabled,
    refetchInterval,
    staleTime,
    ...queryOptions
  });
};

/**
 * Get Weather Predictions
 */
export const useWeatherPredictions = (params = {}, options = {}) => {
  const {
    latitude,
    longitude,
    days = 7,
    session
  } = params;
  
  const {
    enabled = true,
    staleTime = 30 * 60 * 1000, // 30 minutes
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: aiRouteKeys.weatherPredictions({ latitude, longitude, days, session }),
    queryFn: async () => {
      const response = await axiosInstance.get('/ai-routes/weather/predictions', { 
        params: { latitude, longitude, days, session } 
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch weather predictions');
      }
      
      return response.data;
    },
    enabled: enabled && !!latitude && !!longitude,
    staleTime,
    ...queryOptions
  });
};

/**
 * Get All Zones
 */
export const useZones = (params = {}, options = {}) => {
  const {
    is_active,
    zone_type
  } = params;
  
  const {
    enabled = true,
    staleTime = 10 * 60 * 1000, // 10 minutes
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: aiRouteKeys.zones({ is_active, zone_type }),
    queryFn: async () => {
      const queryParams = {};
      if (is_active !== undefined) queryParams.is_active = is_active;
      if (zone_type) queryParams.zone_type = zone_type;
      
      const response = await axiosInstance.get('/ai-routes/zones', { params: queryParams });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch zones');
      }
      
      return response.data;
    },
    enabled,
    staleTime,
    ...queryOptions
  });
};

/**
 * Get Zone by ID
 */
export const useZone = (zoneId, options = {}) => {
  const {
    enabled = true,
    staleTime = 10 * 60 * 1000, // 10 minutes
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: aiRouteKeys.zone(zoneId),
    queryFn: async () => {
      const response = await axiosInstance.get(`/ai-routes/zones/${zoneId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch zone');
      }
      
      return response.data;
    },
    enabled: enabled && !!zoneId,
    staleTime,
    ...queryOptions
  });
};

/**
 * Create Zone (Mutation)
 */
export const useCreateZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (zoneData) => {
      const response = await axiosInstance.post('/ai-routes/zones', zoneData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create zone');
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiRouteKeys.zones({}) });
    },
    onError: (error) => {
      console.error('Error creating zone:', error);
    }
  });
};

/**
 * Update Zone (Mutation)
 */
export const useUpdateZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ zoneId, data }) => {
      const response = await axiosInstance.put(`/ai-routes/zones/${zoneId}`, data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update zone');
      }
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: aiRouteKeys.zones({}) });
      queryClient.invalidateQueries({ queryKey: aiRouteKeys.zone(variables.zoneId) });
    },
    onError: (error) => {
      console.error('Error updating zone:', error);
    }
  });
};

/**
 * Delete Zone (Mutation)
 */
export const useDeleteZone = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (zoneId) => {
      const response = await axiosInstance.delete(`/ai-routes/zones/${zoneId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete zone');
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiRouteKeys.zones({}) });
    },
    onError: (error) => {
      console.error('Error deleting zone:', error);
    }
  });
};

/**
 * Get Zone Deliveries
 */
export const useZoneDeliveries = (zoneId, params = {}, options = {}) => {
  const {
    date,
    session
  } = params;
  
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: aiRouteKeys.zoneDeliveries(zoneId, { date, session }),
    queryFn: async () => {
      const queryParams = {};
      if (date) queryParams.date = date;
      if (session) queryParams.session = session;
      
      const response = await axiosInstance.get(`/ai-routes/zones/${zoneId}/deliveries`, { params: queryParams });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch zone deliveries');
      }
      
      return response.data;
    },
    enabled: enabled && !!zoneId,
    staleTime,
    ...queryOptions
  });
};

/**
 * Re-optimize Route (Mutation)
 */
export const useReoptimizeRoute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reoptimizeData) => {
      const response = await axiosInstance.post('/ai-routes/route/reoptimize', reoptimizeData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to reoptimize route');
      }
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      if (variables.route_id) {
        queryClient.invalidateQueries({ queryKey: aiRouteKeys.trackingStatus(variables.route_id) });
      }
      queryClient.invalidateQueries({ queryKey: aiRouteKeys.all });
    },
    onError: (error) => {
      console.error('Error reoptimizing route:', error);
    }
  });
};

/**
 * Complete Driver Session (Mutation)
 */
export const useCompleteDriverSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ route_id }) => {
      const response = await axiosInstance.post(`/ai-routes/driver-session/complete`, {
        route_id
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to complete driver session');
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiRouteKeys.all });
    },
    onError: (error) => {
      console.error('Error completing driver session:', error);
    }
  });
};

/**
 * Get Driver Next Stop Maps
 * Fetch individual stop map links for a driver
 */
export const useDriverNextStopMaps = (params = {}, options = {}) => {
  const {
    date,
    session
  } = params;
  
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: [...aiRouteKeys.all, 'driverNextStopMaps', { date, session }],
    queryFn: async () => {
      const queryParams = {};
      if (date) queryParams.date = date;
      if (session) queryParams.session = session;
      
      const response = await axiosInstance.get('/drivers/next-stop-maps', { params: queryParams });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch driver next stop maps');
      }
      
      return response.data;
    },
    enabled: enabled && !!(date && session),
    staleTime,
    ...queryOptions
  });
};

/**
 * Get Driver Route Overview Maps
 * Fetch route overview map links for a driver
 */
export const useDriverRouteOverviewMaps = (params = {}, options = {}) => {
  const {
    date,
    session
  } = params;
  
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: [...aiRouteKeys.all, 'driverRouteOverviewMaps', { date, session }],
    queryFn: async () => {
      const queryParams = {};
      if (date) queryParams.date = date;
      if (session) queryParams.session = session;
      
      const response = await axiosInstance.get('/drivers/route-overview-maps', { params: queryParams });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch driver route overview maps');
      }
      
      return response.data;
    },
    enabled: enabled && !!(date && session),
    staleTime,
    ...queryOptions
  });
};

  /**
 * Get Missing Geo Locations
 */
export const useMissingGeoLocations = (limit = 100, options = {}) => {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: aiRouteKeys.missingGeoLocations(limit),
    queryFn: async () => {
      const response = await axiosInstance.get('/ai-routes/address/get-missing-geo-locations', {
        params: { limit }
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch missing geo locations');
      }
      
      return response.data;
    },
    enabled,
    staleTime,
    ...queryOptions
  });
};

/**
 * Update Geo Location (Mutation)
 */
export const useUpdateGeoLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ address_id, delivery_item_id, geo_location, order_id, menu_item_id, delivery_date, session }) => {
      const response = await axiosInstance.post('/ai-routes/address/update-geo-location', {
        address_id,
        delivery_item_id,
        geo_location,
        order_id,
        menu_item_id,
        delivery_date,
        session
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update geo location');
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiRouteKeys.missingGeoLocations() });
      queryClient.invalidateQueries({ queryKey: aiRouteKeys.deliveryData() });
    },
    onError: (error) => {
      console.error('Error updating geo location:', error);
    }
  });
};

/**
 * Check Traffic and Auto-Reoptimize (Mutation) ⭐ TRAFFIC REOPTIMIZATION
 * Checks traffic on remaining route segments and automatically reoptimizes if heavy traffic detected (≥1.5x multiplier)
 */
export const useCheckTraffic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ route_id, current_location, check_all_segments = true }) => {
      const response = await axiosInstance.post('/ai-routes/journey/check-traffic', {
        route_id,
        current_location,
        check_all_segments
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || response.data.error || 'Failed to check traffic');
      }
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate related queries when traffic is checked
      if (variables.route_id) {
        queryClient.invalidateQueries({ queryKey: aiRouteKeys.routeOrder(variables.route_id) });
        queryClient.invalidateQueries({ queryKey: aiRouteKeys.trackingStatus(variables.route_id) });
      }
      queryClient.invalidateQueries({ queryKey: aiRouteKeys.all });
    },
    onError: (error) => {
      console.error('Error checking traffic:', error);
    }
  });
};

/**
 * Get Route Order
 * Get current route order with stop status
 */
export const useRouteOrder = (routeId, options = {}) => {
  const {
    enabled = true,
    refetchInterval = 30000, // 30 seconds for real-time updates
    staleTime = 10 * 1000, // 10 seconds
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: aiRouteKeys.routeOrder(routeId),
    queryFn: async () => {
      const response = await axiosInstance.get(`/ai-routes/journey/route-order/${routeId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || response.data.error || 'Failed to get route order');
      }
      
      return response.data;
    },
    enabled: enabled && !!routeId,
    refetchInterval,
    staleTime,
    ...queryOptions
  });
};

/**
 * Get Route Status from Actual Route Stops
 * Fetches journey status, marked stops, and completed sessions from actual_route_stops table
 */
export const useRouteStatusFromActualStops = (routeId, options = {}) => {
  const {
    enabled = true,
    refetchInterval = 30000, // Refetch every 30 seconds to stay updated
    staleTime = 10 * 1000, // 10 seconds
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: aiRouteKeys.routeStatus(routeId),
    queryFn: async () => {
      const response = await axiosInstance.get(`/ai-routes/route/${routeId}/status`);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get route status');
      }
      return response.data;
    },
    enabled: !!routeId && enabled,
    refetchInterval,
    staleTime,
    ...queryOptions
  });
};

/**
 * Update Delivery Comment (Mutation)
 * Updates the comment for a specific delivery using delivery_id
 */
export const useUpdateDeliveryComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ delivery_id, comments }) => {
      const response = await axiosInstance.put(`/ai-routes/delivery_data/${delivery_id}/comments`, {
        comments
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to update delivery comment');
      }
      
      return response.data;
    },
    onSuccess: () => {
      // Invalidate delivery data queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: aiRouteKeys.deliveryData() });
    },
    onError: (error) => {
      console.error('Error updating delivery comment:', error);
    }
  });
};

