import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiLogOut, FiMapPin, FiPlay } from 'react-icons/fi';
import { MdLocalShipping } from 'react-icons/md';
import { message } from 'antd';
import { toast } from 'react-toastify';
import useAuthStore from '../stores/Zustand.store';
import axiosInstance from '../api/axios';
import { SkeletonCard, SkeletonTable, SkeletonLoading, SkeletonDashboard } from '../components/Skeleton';
import { useStartJourney, useCompleteDriverSession, useStopReached, useEndJourney, useDriverNextStopMaps, useDriverRouteOverviewMaps, useCheckTraffic, useRouteOrder, useReoptimizeRoute, useUpdateGeoLocation, useRouteStatusFromActualStops } from '../hooks/deliverymanager/useAIRouteOptimization';
import { useUploadDeliveryPhoto, useCheckMultipleDeliveryImages } from '../hooks/deliverymanager';
import { showSuccessToast, showErrorToast } from '../utils/toastConfig.jsx';
import offlineService from '../services/offlineService';

/**
 * DeliveryExecutivePage - Delivery executive dashboard with route and order management
 * Handles delivery executive operations including route viewing, order updates, and location tracking
 * Features: Route management, order status updates, location tracking, delivery analytics
 */
const DeliveryExecutivePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('routes'); // routes only
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  
  // Logout confirmation state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Routes state
  const [routes, setRoutes] = useState({ sessions: {} }); // Initialize as object with sessions property
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState(null);
  const [selectedSession, setSelectedSession] = useState('breakfast'); // breakfast, lunch, dinner
  const [showAllStops, setShowAllStops] = useState(false);
  
  // Get user and roles first (before hooks that use them)
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const roles = useAuthStore((state) => state.roles);
  const logout = useAuthStore((state) => state.logout);
  
  // Get current date string (memoized to avoid unnecessary recalculations)
  const currentDateStr = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }, []); // Only calculate once per day (could add date dependency if needed)
  
  // Helper function to get today's date string (for dynamic date checking)
  const getTodayDateString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };
  
  // Use React Query hooks for driver maps
  const isMapsEnabled = !!user?.id && !!selectedSession && routes.sessions && Object.keys(routes.sessions).length > 0;
  
  const { data: driverMapsResponse, isLoading: mapsLoading, error: mapsError, refetch: refetchDriverMaps } = useDriverNextStopMaps(
    { date: currentDateStr, session: selectedSession.toLowerCase() },
    { 
      enabled: isMapsEnabled
    }
  );
  
  const { data: routeOverviewResponse, isLoading: routeOverviewLoading, refetch: refetchRouteOverview } = useDriverRouteOverviewMaps(
    { date: currentDateStr, session: selectedSession.toLowerCase() },
    { 
      enabled: isMapsEnabled
    }
  );
  
  // Debug logging (remove in production)
  useEffect(() => {
    if (mapsError) {
      console.error('Driver Maps API Error:', mapsError);
    }
  }, [mapsError]);
  
  // Extract driver-specific data from responses
  const driverMapsData = driverMapsResponse?.drivers?.find(driver => driver.driver_id === user?.id) || null;
  const routeOverviewData = routeOverviewResponse?.drivers?.find(driver => driver.driver_id === user?.id) || null;
  
  // Delivery completion state
  const [completingDelivery, setCompletingDelivery] = useState(null); // stop index being completed
  const [completionLocation, setCompletionLocation] = useState(null);
  const [completionLocationLoading, setCompletionLocationLoading] = useState(false);
  const [completionLocationError, setCompletionLocationError] = useState(null);
  const [completionLoading, setCompletionLoading] = useState(false);
  const [locationUpdated, setLocationUpdated] = useState(false); // Track if location was successfully updated
  const [updatedLocationStops, setUpdatedLocationStops] = useState(() => {
    // Load from localStorage on mount
    try {
      const saved = localStorage.getItem('updatedDeliveryLocations');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (error) {
      console.error('Error loading updated locations from localStorage:', error);
      return new Set();
    }
  }); // Track which stops have updated locations (keyed by address_id + session)
  
  // Helper function to get location key (address_id + session)
  const getLocationKey = (addressId, session) => {
    return `${addressId}_${session.toUpperCase()}`;
  };
  
  // Helper function to check if location is updated
  const isLocationUpdated = (addressId, session) => {
    if (!addressId || !session) return false;
    return updatedLocationStops.has(getLocationKey(addressId, session));
  };
  
  // Helper function to mark location as updated
  const markLocationAsUpdated = (addressId, session) => {
    const key = getLocationKey(addressId, session);
    setUpdatedLocationStops(prev => {
      const newSet = new Set(prev);
      newSet.add(key);
      // Save to localStorage
      try {
        localStorage.setItem('updatedDeliveryLocations', JSON.stringify(Array.from(newSet)));
      } catch (error) {
        console.error('Error saving updated locations to localStorage:', error);
      }
      return newSet;
    });
  };
  
  // Image/Video upload state
  const [uploadingImage, setUploadingImage] = useState(null); // stop index being uploaded
  const [selectedFiles, setSelectedFiles] = useState([]); // Array of selected files (images/videos)
  const [filePreviews, setFilePreviews] = useState([]); // Array of preview URLs
  const [imageUploadError, setImageUploadError] = useState(null);
  
  // Hook for uploading delivery photos
  const uploadDeliveryPhotoMutation = useUploadDeliveryPhoto();
  
  // Delivery status state
  const [deliveryStatus, setDeliveryStatus] = useState({});
  const [loadingStatus, setLoadingStatus] = useState({});
  
  // Track marked stops (using route_id + stop_order as key)
  const [markedStops, setMarkedStops] = useState(new Set());
  
  // Track uploaded photos (keyed by address_id + session + date)
  // Structure: { "addressId_session_date": true }
  const [uploadedPhotos, setUploadedPhotos] = useState(() => {
    // Load from localStorage on mount and clean up old entries
    try {
      const saved = localStorage.getItem('uploadedDeliveryPhotos');
      if (!saved) return {};
      
      const savedData = JSON.parse(saved);
      // Get today's date string
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Filter to keep only today's entries
      const todayEntries = {};
      Object.keys(savedData).forEach(key => {
        // Key format: "addressId_session_date"
        const parts = key.split('_');
        if (parts.length >= 3) {
          const datePart = parts.slice(-1)[0]; // Last part is the date
          if (datePart === todayStr) {
            todayEntries[key] = true;
          }
        }
      });
      
      // Update localStorage with cleaned data
      if (Object.keys(todayEntries).length !== Object.keys(savedData).length) {
        localStorage.setItem('uploadedDeliveryPhotos', JSON.stringify(todayEntries));
      }
      
      return todayEntries;
    } catch (error) {
      console.error('Error loading uploaded photos from localStorage:', error);
      return {};
    }
  });
  
  // Helper function to get photo key (address_id + session + date)
  const getPhotoKey = (addressId, session, date = null) => {
    const dateStr = date || getTodayDateString();
    return `${addressId}_${session.toUpperCase()}_${dateStr}`;
  };
  
  // Helper function to check if photo is uploaded (checks database first, then localStorage fallback)
  const isPhotoUploaded = (addressId, session) => {
    if (!addressId || !session) return false;
    
    // First check database status
    const key = getPhotoKey(addressId, session);
    if (deliveryImagesStatus && deliveryImagesStatus[key]) {
      return deliveryImagesStatus[key].status === 'uploaded';
    }
    
    // Fallback to localStorage (for backward compatibility)
    return uploadedPhotos[key] === true;
  };
  
  // Helper function to mark photo as uploaded
  const markPhotoAsUploaded = (addressId, session) => {
    const key = getPhotoKey(addressId, session);
    setUploadedPhotos(prev => {
      const newData = { ...prev, [key]: true };
      // Save to localStorage
      try {
        localStorage.setItem('uploadedDeliveryPhotos', JSON.stringify(newData));
      } catch (error) {
        console.error('Error saving uploaded photos to localStorage:', error);
      }
      return newData;
    });
  };
  
  // Clean up old photo entries when date changes (e.g., past midnight)
  useEffect(() => {
    const cleanupOldPhotos = () => {
      const today = getTodayDateString();
      setUploadedPhotos(prev => {
        const cleaned = {};
        Object.keys(prev).forEach(key => {
          // Key format: "addressId_session_date"
          const parts = key.split('_');
          if (parts.length >= 3) {
            const datePart = parts.slice(-1)[0]; // Last part is the date
            if (datePart === today) {
              cleaned[key] = true;
            }
          }
        });
        
        // Update localStorage if cleaned data is different
        if (Object.keys(cleaned).length !== Object.keys(prev).length) {
          try {
            localStorage.setItem('uploadedDeliveryPhotos', JSON.stringify(cleaned));
          } catch (error) {
            console.error('Error cleaning up old photos from localStorage:', error);
          }
        }
        
        return cleaned;
      });
    };
    
    // Clean up on mount and set interval to check every hour
    cleanupOldPhotos();
    const interval = setInterval(cleanupOldPhotos, 60 * 60 * 1000); // Check every hour
    
    return () => clearInterval(interval);
  }, []); // Empty deps - cleanup runs on mount and via interval
  
  // Start Journey state
  const [showStartJourneyModal, setShowStartJourneyModal] = useState(false);
  const [startJourneyData, setStartJourneyData] = useState({
    route_id: '',
    driver_id: ''
  });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  // Load activeRouteId from localStorage on mount to persist journey state
  const [activeRouteId, setActiveRouteId] = useState(() => {
    const saved = localStorage.getItem('activeRouteId');
    return saved || null;
  }); // Track active journey route_id
  
  // End Session state
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  const [endSessionData, setEndSessionData] = useState({
    sessionName: '',
    sessionId: ''
  });
  // Track completed sessions
  const [completedSessions, setCompletedSessions] = useState(new Set());
  
  // Status selection modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStopForStatus, setSelectedStopForStatus] = useState(null);
  const [selectedStopIndex, setSelectedStopIndex] = useState(null);
  const [selectedStopStatus, setSelectedStopStatus] = useState('Delivered'); // Default to 'Delivered'
  const [gettingLocation, setGettingLocation] = useState(false); // Track geolocation loading state
  const [deliveryComments, setDeliveryComments] = useState(''); // Comments for delivery
  const MAX_COMMENTS_LENGTH = 500; // Maximum characters for comments
  
  // Delivery note modal state
  const [showDeliveryNoteModal, setShowDeliveryNoteModal] = useState(false);
  const [selectedDeliveryNote, setSelectedDeliveryNote] = useState(null);
  const [selectedStopForNote, setSelectedStopForNote] = useState(null);
  
  // Offline state
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncStatus, setSyncStatus] = useState({ queueLength: 0, syncInProgress: false });
  
  // React Query hooks
  const startJourneyMutation = useStartJourney();
  const updateGeoLocationMutation = useUpdateGeoLocation();
  const completeSessionMutation = useCompleteDriverSession();
  const stopReachedMutation = useStopReached();
  const endJourneyMutation = useEndJourney();
  const checkTrafficMutation = useCheckTraffic();
  const reoptimizeRouteMutation = useReoptimizeRoute();
  
  // Traffic checking state
  const [trafficData, setTrafficData] = useState(null);
  const [lastTrafficCheck, setLastTrafficCheck] = useState(null);
  const [showTrafficAlert, setShowTrafficAlert] = useState(false);
  const [showReoptimizationSuccess, setShowReoptimizationSuccess] = useState(false);
  
  // Helper function to get route_id from currently selected session (defined early for use in useMemo)
  const getRouteIdFromSelectedSession = useCallback(() => {
    if (!routes || !selectedSession) {
      return '';
    }
    
    // Normalize selected session to lowercase for matching
    const normalizedSession = selectedSession.toLowerCase();
    
    // First, try to get from sessions object
    if (routes.sessions && routes.sessions[normalizedSession]) {
      const currentSession = routes.sessions[normalizedSession];
      
      // Try to get route_id from session object (this is the primary source)
      if (currentSession.route_id) {
        return currentSession.route_id;
      }
      
      // Try from stops in the session
      if (currentSession.stops && currentSession.stops.length > 0) {
        const firstStop = currentSession.stops.find(stop => stop.route_id || stop.Route_ID);
        return firstStop?.route_id || firstStop?.Route_ID || '';
      }
    }
    
    // Fallback: Try to find route from routes array by matching session
    if (routes.routes && Array.isArray(routes.routes)) {
      const matchingRoute = routes.routes.find(route => 
        route.session && route.session.toLowerCase() === normalizedSession
      );
      if (matchingRoute && matchingRoute.route_id) {
        return matchingRoute.route_id;
      }
    }
    
    // Also check data.routes structure
    if (routes.data && routes.data.routes && Array.isArray(routes.data.routes)) {
      const matchingRoute = routes.data.routes.find(route => 
        route.session && route.session.toLowerCase() === normalizedSession
      );
      if (matchingRoute && matchingRoute.route_id) {
        return matchingRoute.route_id;
      }
    }
    
    return '';
  }, [routes, selectedSession]);

  // Get route_id for fetching route order - use currently selected session's route_id
  const routeIdForOrder = useMemo(() => {
    const currentSessionRouteId = getRouteIdFromSelectedSession();
    return currentSessionRouteId || activeRouteId || '';
  }, [routes, selectedSession, activeRouteId, getRouteIdFromSelectedSession]);

  // Get route order for active route (if available)
  const { data: routeOrderData } = useRouteOrder(routeIdForOrder, {
    enabled: !!routeIdForOrder,
    refetchInterval: 30000 // Poll every 30 seconds
  });

  // Merge delivery notes from routeOrderData into stops
  const stopsWithDeliveryNotes = useMemo(() => {
    if (!routes.sessions || !routes.sessions[selectedSession] || !routeOrderData?.stops) {
      return routes.sessions?.[selectedSession]?.stops || [];
    }

    const currentStops = routes.sessions[selectedSession].stops || [];
    const routeOrderStops = routeOrderData.stops || [];

    return currentStops.map(stop => {
      // Try to find matching stop in routeOrderData by stop_order or delivery_name
      const matchingStop = routeOrderStops.find(routeStop => 
        routeStop.stop_order === stop.Stop_No ||
        routeStop.delivery_name?.toLowerCase() === stop.Delivery_Name?.toLowerCase() ||
        routeStop.planned_stop_id === stop.planned_stop_id
      );

      return {
        ...stop,
        delivery_note: matchingStop?.delivery_note || stop.delivery_note || null,
        // Merge planned_stop_id from routeOrderData if not already in stop
        planned_stop_id: stop.planned_stop_id || stop.Planned_Stop_ID || matchingStop?.planned_stop_id || stop._original?.planned_stop_id || null
      };
    });
  }, [routes.sessions, selectedSession, routeOrderData]);

  // Prepare stops for batch image status check
  const stopsForImageCheck = useMemo(() => {
    if (!stopsWithDeliveryNotes || stopsWithDeliveryNotes.length === 0) {
      return [];
    }

    const today = getTodayDateString();
    const sessionUpper = selectedSession.toUpperCase();

    return stopsWithDeliveryNotes
      .filter(stop => {
        // Filter out "Return to Hub" stops
        if (stop.Delivery_Name === 'Return to Hub') return false;
        
        // Get address_id from stop
        const addressId = 
          (stop?.address_id && stop.address_id !== '') ? stop.address_id :
          (stop?.Address_ID && stop.Address_ID !== '') ? stop.Address_ID :
          (stop?.addressId && stop.addressId !== '') ? stop.addressId :
          (stop?._original?.address_id && stop._original.address_id !== '') ? stop._original.address_id :
          (stop?._original?.Address_ID && stop._original.Address_ID !== '') ? stop._original.Address_ID :
          (stop?._original?.addressId && stop._original.addressId !== '') ? stop._original.addressId :
          null;
        
        return !!addressId;
      })
      .map(stop => {
        const addressId = 
          (stop?.address_id && stop.address_id !== '') ? stop.address_id :
          (stop?.Address_ID && stop.Address_ID !== '') ? stop.Address_ID :
          (stop?.addressId && stop.addressId !== '') ? stop.addressId :
          (stop?._original?.address_id && stop._original.address_id !== '') ? stop._original.address_id :
          (stop?._original?.Address_ID && stop._original.Address_ID !== '') ? stop._original.Address_ID :
          (stop?._original?.addressId && stop._original.addressId !== '') ? stop._original.addressId :
          null;
        
        return {
          addressId,
          deliveryDate: today,
          deliverySession: sessionUpper
        };
      });
  }, [stopsWithDeliveryNotes, selectedSession]);

  // Check delivery images status for all stops using database
  const { data: deliveryImagesStatus, refetch: refetchImageStatus, isLoading: checkingImages } = useCheckMultipleDeliveryImages(
    stopsForImageCheck,
    {
      enabled: stopsForImageCheck.length > 0,
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 15 * 1000 // 15 seconds
    }
  );


  // Get route_id for status check - use currently selected session's route_id
  const routeIdForStatus = useMemo(() => {
    // First, try to get route_id from currently selected session (most accurate)
    const currentSessionRouteId = getRouteIdFromSelectedSession();
    if (currentSessionRouteId) {
      return currentSessionRouteId;
    }
    
    // Fallback: Check for routes array in the response structure: { routes: [...] }
    if (routes?.routes && Array.isArray(routes.routes) && routes.routes.length > 0) {
      return routes.routes[0].route_id || '';
    } 
    // Check for nested data structure: { data: { routes: [...] } }
    else if (routes?.data?.routes && Array.isArray(routes.data.routes) && routes.data.routes.length > 0) {
      return routes.data.routes[0].route_id || '';
    }
    // Check for sessions structure (legacy format)
    else if (routes?.sessions) {
      const sessions = routes.sessions;
      // Try to get route_id from first available session
      const firstSession = sessions.breakfast || sessions.lunch || sessions.dinner;
      if (firstSession && firstSession.route_id) {
        return firstSession.route_id;
      }
      // Try from stops
      if (firstSession && firstSession.stops && firstSession.stops.length > 0) {
        const firstStop = firstSession.stops.find(stop => stop.route_id || stop.Route_ID);
        return firstStop?.route_id || firstStop?.Route_ID || '';
      }
    }
    // Use activeRouteId if available
    return activeRouteId || '';
  }, [routes, activeRouteId, selectedSession, getRouteIdFromSelectedSession]);

  // Get route status from actual_route_stops table
  const { data: routeStatus } = useRouteStatusFromActualStops(routeIdForStatus, {
    enabled: !!routeIdForStatus && !!user?.id
  });

  // Get display name with fallbacks
  const getDisplayName = () => {
    return user?.firstName || user?.name || user?.email?.split('@')[0] || 'Delivery Executive';
  };

  useEffect(() => {
    if (!user || !roles.includes('DELIVERY_EXECUTIVE')) {
      message.error('Access denied. Delivery Executive role required.');
      navigate('/jkhm');
      return;
    }
    // Simulate loading for profile data
    setTimeout(() => setLoading(false), 1000);
  }, [user, roles, navigate]);

  // Initialize offline service and network status listener
  useEffect(() => {
    const unsubscribe = offlineService.onNetworkChange((status) => {
      setIsOffline(status === 'offline');
      const statusInfo = offlineService.getSyncStatus();
      setSyncStatus(statusInfo);
      
      if (status === 'online') {
        // Network restored - trigger auto-sync
        handleAutoSync();
      }
    });
    
    // Set initial status
    setIsOffline(!offlineService.checkOnline());
    const initialStatus = offlineService.getSyncStatus();
    setSyncStatus(initialStatus);
    
    return unsubscribe;
  }, []);

  // Load cached routes on mount if offline
  useEffect(() => {
    if (!offlineService.checkOnline()) {
      const cachedRoutes = offlineService.getCachedRoutes();
      if (cachedRoutes) {
        // Transform cached data if needed
        if (cachedRoutes.sessions && Object.keys(cachedRoutes.sessions).length > 0) {
          setRoutes(cachedRoutes);
          message.info('Loaded routes from cache (offline mode)');
        }
      }
    }
  }, []);

  // Update sync status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const status = offlineService.getSyncStatus();
      setSyncStatus(status);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-fetch routes when component loads if on routes tab
  useEffect(() => {
    const driverId = user?.id;
    
    if (activeTab === 'routes' && driverId && (!routes.sessions || Object.keys(routes.sessions).length === 0) && !routesLoading) {
      // Only fetch if online, otherwise use cached data
      if (offlineService.checkOnline()) {
        fetchRoutes();
      } else {
        const cachedRoutes = offlineService.getCachedRoutes();
        if (cachedRoutes && cachedRoutes.sessions && Object.keys(cachedRoutes.sessions).length > 0) {
          setRoutes(cachedRoutes);
        }
      }
    }
  }, [activeTab, user]);

  // Update routes state when driver maps data is loaded
  useEffect(() => {
    if (driverMapsData && routes.sessions && routes.sessions[selectedSession]) {
      const currentStops = routes.sessions[selectedSession].stops;
      
      // Check if any stop needs updating (has map_link in driverMapsData but not in current stops)
      const needsUpdate = currentStops.some(stop => {
        const mapStop = driverMapsData.stops?.find(s => 
          s.stop_order === stop.Stop_No || 
          s.delivery_name === stop.Delivery_Name ||
          (s.delivery_name && stop.Delivery_Name && s.delivery_name.toLowerCase() === stop.Delivery_Name.toLowerCase())
        );
        return mapStop && mapStop.map_link && !stop.Map_Link;
      });
      
      // Only update if there are changes to avoid infinite loop
      if (needsUpdate) {
        const updatedStops = currentStops.map(stop => {
          const mapStop = driverMapsData.stops?.find(s => 
            s.stop_order === stop.Stop_No || 
            s.delivery_name === stop.Delivery_Name ||
            (s.delivery_name && stop.Delivery_Name && s.delivery_name.toLowerCase() === stop.Delivery_Name.toLowerCase())
          );
          
          if (mapStop && mapStop.map_link) {
            return {
              ...stop,
              Map_Link: mapStop.map_link
            };
          }
          return stop;
        });
        
        setRoutes(prev => ({
          ...prev,
          sessions: {
            ...prev.sessions,
            [selectedSession]: {
              ...prev.sessions[selectedSession],
              stops: updatedStops
            }
          }
        }));
      }
    }
  }, [driverMapsData, selectedSession, routes.sessions]); // Added routes.sessions to ensure it runs when routes change

  // Update routes state when route overview data is loaded
  useEffect(() => {
    if (routeOverviewData && routes.sessions && routes.sessions[selectedSession]) {
      const currentSession = routes.sessions[selectedSession];
      
      // Check if update is needed (data has changed)
      const needsUpdate = 
        routeOverviewData.route_map_link !== currentSession.route_map_link ||
        routeOverviewData.map_view_link !== currentSession.map_view_link;
      
      // Only update if there are changes to avoid infinite loop
      if (needsUpdate) {
        setRoutes(prev => ({
          ...prev,
          sessions: {
            ...prev.sessions,
            [selectedSession]: {
              ...prev.sessions[selectedSession],
              map_link: routeOverviewData.route_map_link || prev.sessions[selectedSession].map_link,
              route_map_link: routeOverviewData.route_map_link,
              map_view_link: routeOverviewData.map_view_link
            }
          }
        }));
      }
    }
  }, [routeOverviewData, selectedSession]); // Removed routes.sessions from dependencies

  // Auto-fetch delivery status when routes are loaded
  useEffect(() => {
    if (routes.sessions && routes.sessions[selectedSession]) {
      const stops = routes.sessions[selectedSession].stops.filter(stop => stop.Delivery_Name !== 'Return to Hub');
      
      // Fetch status for each stop
      stops.forEach((stop, index) => {
        if (stop.Delivery_Item_ID) {
          fetchDeliveryStatus(stop.Delivery_Item_ID, index);
        }
      });
    }
  }, [routes, selectedSession]);

  // Initialize driver_id when user is available
  useEffect(() => {
    if (user?.id) {
      setStartJourneyData(prev => ({
        ...prev,
        driver_id: user.id
      }));
    }
  }, [user?.id]);

  // Restore state from routeStatus API response
  useEffect(() => {
    if (routeStatus?.success) {
      // Get current session's route_id to verify this status is for the correct session
      const currentSessionRouteId = getRouteIdFromSelectedSession();
      
      // Only restore state if the route_id matches the current session's route_id
      // This prevents restoring state from a different session when switching tabs
      if (routeStatus.route_id === currentSessionRouteId || !currentSessionRouteId) {
        // Restore marked stops (include session to make it unique across sessions)
        // Use planned_stop_id as stable identifier, fallback to stop_order for backward compatibility
        const marked = new Set();
        routeStatus.marked_stops?.forEach(stop => {
          // Include session in stopKey to prevent conflicts across sessions
          // Use stop.session from backend, fallback to selectedSession if not available
          const session = (stop.session || selectedSession).toLowerCase();
          // Use planned_stop_id if available (stable identifier), otherwise fallback to stop_order
          const stopIdentifier = stop.planned_stop_id || stop.stop_order;
          const stopKey = `${routeStatus.route_id}-${session}-${stopIdentifier}`;
          marked.add(stopKey);
        });
        // Merge with existing marked stops instead of replacing (in case multiple sessions are active)
        setMarkedStops(prev => {
          const merged = new Set(prev);
          marked.forEach(key => merged.add(key));
          return merged;
        });
        
        // Restore completed sessions (normalize to lowercase for consistent comparison)
        // Merge with existing completed sessions to handle multiple routes
        setCompletedSessions(prev => {
          const newCompleted = new Set(prev);
          (routeStatus.completed_sessions || []).forEach(s => {
            newCompleted.add(s?.toLowerCase());
          });
          return newCompleted;
        });
        
        // Restore active journey state only if it matches current session
        if (routeStatus.is_journey_started) {
          // Only update activeRouteId if it matches the current session's route_id
          if (routeStatus.route_id === currentSessionRouteId || !currentSessionRouteId) {
            setActiveRouteId(routeStatus.route_id);
            localStorage.setItem('activeRouteId', routeStatus.route_id);
          }
        } else {
          // Only clear if the route_id matches current session
          if (routeStatus.route_id === currentSessionRouteId) {
            // Only clear if we don't have activeRouteId from localStorage
            // This prevents clearing if journey was just started but not yet in DB
            if (!localStorage.getItem('activeRouteId')) {
              setActiveRouteId(null);
            }
          }
        }
      }
    }
  }, [routeStatus, selectedSession, getRouteIdFromSelectedSession]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Location capture functions for delivery completion
  const getCompletionLocation = () => {
    setCompletionLocationLoading(true);
    setCompletionLocationError(null);
    
    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by this browser. Please use a different browser or device.';
      setCompletionLocationError(errorMsg);
      setCompletionLocationLoading(false);
      showErrorToast(errorMsg);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCompletionLocation({
          latitude,
          longitude,
          timestamp: new Date().toISOString()
        });
        setCompletionLocationLoading(false);
        setCompletionLocationError(null);
        
        // Show success message
        showSuccessToast(`Location captured: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        
        // Reverse geocoding to get address
        reverseGeocodeCompletion(latitude, longitude);
      },
      (error) => {
        // Handle location errors with proper error messages
        setCompletionLocationLoading(false);
        let errorMsg = 'Unable to get your location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg += 'Location access denied. Please enable location permissions in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg += 'Location information is unavailable. Please check your GPS or network connection.';
            break;
          case error.TIMEOUT:
            errorMsg += 'Location request timed out. Please try again.';
            break;
          default:
            errorMsg += 'An unknown error occurred. Please try again.';
            break;
        }
        
        setCompletionLocationError(errorMsg);
        showErrorToast(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // Increased timeout to 15 seconds
        maximumAge: 0 // Always get fresh location
      }
    );
  };

  const reverseGeocodeCompletion = async (latitude, longitude) => {
    
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.display_name) {
          const addressData = {
            address: data.display_name,
            city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
            state: data.address?.state || 'Unknown',
            country: data.address?.country || 'Unknown',
            postalCode: data.address?.postcode || 'Unknown'
          };
          
          setCompletionLocation(prev => ({
            ...prev,
            ...addressData
          }));
        } else {
        }
      } else {
      }
    } catch (error) {
      const fallbackAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      
      setCompletionLocation(prev => ({
        ...prev,
        address: fallbackAddress,
        city: 'Coordinates Only',
        state: 'Coordinates Only',
        country: 'Coordinates Only',
        postalCode: 'N/A'
      }));
    }
  };



  const clearCompletionLocation = () => {
    setCompletionLocation(null);
    setCompletionLocationError(null);
    setLocationUpdated(false);
    // Remove from updated stops if currently completing a delivery
    if (completingDelivery !== null) {
      setUpdatedLocationStops(prev => {
        const newSet = new Set(prev);
        newSet.delete(completingDelivery);
        return newSet;
      });
    }
  };

  // Image/Video upload functions
  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles = [];
    const errors = [];
    
    // Validate all files first
    files.forEach((file) => {
      // Validate file type (images or videos)
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        errors.push(`${file.name}: Invalid file type. Only images and videos are allowed.`);
        return;
      }
      
      // Validate file size (max 50MB for videos, 10MB for images)
      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        errors.push(`${file.name}: ${isVideo ? 'Video' : 'Image'} size should be less than ${maxSize / (1024 * 1024)}MB.`);
        return;
      }
      
      validFiles.push(file);
    });
    
    if (errors.length > 0) {
      setImageUploadError(errors.join(' '));
      return;
    }
    
    if (validFiles.length === 0) {
      return;
    }
    
    // Create previews for all valid files
    const previewPromises = validFiles.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            url: e.target.result,
            type: file.type,
            name: file.name
          });
        };
        reader.onerror = () => {
          resolve({
            url: null,
            type: file.type,
            name: file.name
          });
        };
        reader.readAsDataURL(file);
      });
    });
    
    const previews = await Promise.all(previewPromises);
    
    // Update state
    setSelectedFiles(prev => [...prev, ...validFiles]);
    setFilePreviews(prev => [...prev, ...previews]);
    setImageUploadError(null);
    
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearImageUpload = () => {
    setSelectedFiles([]);
    setFilePreviews([]);
    setImageUploadError(null);
    setUploadingImage(null);
  };

  // Fetch delivery status for a specific delivery item
  const fetchDeliveryStatus = async (deliveryItemId, stopIndex) => {
    if (!deliveryItemId) return;
    
    setLoadingStatus(prev => ({ ...prev, [stopIndex]: true }));
    
    try {
      const response = await axiosInstance.get(`/api/delivery-items/status/${deliveryItemId}`);
      
      if (response.data.success) {
        setDeliveryStatus(prev => ({
          ...prev,
          [stopIndex]: response.data.data
        }));
      }
    } catch (error) {
      // Silent error handling - status will remain as is
    } finally {
      setLoadingStatus(prev => ({ ...prev, [stopIndex]: false }));
    }
  };

  const handleImageUpload = async (stopIndex) => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setImageUploadError('Please select at least one image or video first.');
      return;
    }

    setImageUploadError(null);

    try {
      // Get the current stop data
      const currentStop = routes.sessions[selectedSession].stops.filter(stop => stop.Delivery_Name !== 'Return to Hub')[stopIndex];
      
      // Extract address_id from stop data (similar to handleCompleteDelivery)
      const addressId = 
        (currentStop?.address_id && currentStop.address_id !== '') ? currentStop.address_id :
        (currentStop?.Address_ID && currentStop.Address_ID !== '') ? currentStop.Address_ID :
        (currentStop?.addressId && currentStop.addressId !== '') ? currentStop.addressId :
        (currentStop?._original?.address_id && currentStop._original.address_id !== '') ? currentStop._original.address_id :
        (currentStop?._original?.Address_ID && currentStop._original.Address_ID !== '') ? currentStop._original.Address_ID :
        (currentStop?._original?.addressId && currentStop._original.addressId !== '') ? currentStop._original.addressId :
        null;
      
      if (!addressId) {
        setImageUploadError('No address ID found for this delivery stop.');
        toast.error(
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-semibold text-red-800 text-base">❌ Upload Failed</div>
              <div className="text-sm text-red-700 mt-1">No address ID found for this delivery stop.</div>
            </div>
          </div>,
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
            style: {
              background: "#fef2f2",
              border: "1px solid #ef4444",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
            },
          }
        );
        return;
      }

      // Get session in uppercase format (BREAKFAST, LUNCH, DINNER)
      const sessionUpper = selectedSession.toUpperCase();
      
      // Get today's date in YYYY-MM-DD format
      const today = getTodayDateString();

      // Use the mutation hook to upload the photos/videos
      await uploadDeliveryPhotoMutation.mutateAsync({
        images: selectedFiles,
        address_id: addressId,
        session: sessionUpper,
        date: today
      });

      // Mark photo as uploaded in state and localStorage (for backward compatibility)
      markPhotoAsUploaded(addressId, sessionUpper);

      // Refetch image status from database to update UI
      refetchImageStatus();

      // Fetch updated delivery status from database if deliveryItemId exists
      const deliveryItemId = currentStop?.Delivery_Item_ID;
      if (deliveryItemId) {
        await fetchDeliveryStatus(deliveryItemId, stopIndex);
      }
      
      // Save file count before clearing
      const fileCount = selectedFiles.length;
      
      // Clear selected files after successful upload
      clearImageUpload();
      
      // Show success toast
      toast.success(
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <div className="font-semibold text-green-800 text-base">✅ {fileCount} File{fileCount > 1 ? 's' : ''} Uploaded!</div>
            <div className="text-sm text-green-700 mt-1">{fileCount} file{fileCount > 1 ? 's' : ''} uploaded successfully to external API.</div>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          style: {
            background: "#f0f9ff",
            border: "1px solid #10b981",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
          },
        }
      );
      
      // Clear upload state
      clearImageUpload();
    } catch (apiError) {
      // Show error toast
      toast.error(
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="font-semibold text-red-800 text-base">❌ Upload Failed</div>
            <div className="text-sm text-red-700 mt-1">
              {apiError.response?.data?.message || apiError.message || 'Failed to upload image. Please try again.'}
            </div>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          style: {
            background: "#fef2f2",
            border: "1px solid #ef4444",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
          },
        }
      );
      
      setImageUploadError(apiError.response?.data?.message || apiError.message || 'Failed to upload image. Please try again.');
    }
  };

  const handleCompleteDelivery = async (stopIndex) => {
    if (!completionLocation) {
      const errorMsg = 'Please capture your current location first. Click "Get Current Location" button.';
      setCompletionLocationError(errorMsg);
      showErrorToast(errorMsg);
      return;
    }

    setCompletionLoading(true);
    setCompletionLocationError(null);

    try {
      // Get the current stop data
      const currentStop = routes.sessions[selectedSession].stops.filter(stop => stop.Delivery_Name !== 'Return to Hub')[stopIndex];
      
      // First, try to get address_id from stop (preferred method)
      const addressId = 
        (currentStop?.address_id && currentStop.address_id !== '') ? currentStop.address_id :
        (currentStop?.Address_ID && currentStop.Address_ID !== '') ? currentStop.Address_ID :
        (currentStop?.addressId && currentStop.addressId !== '') ? currentStop.addressId :
        (currentStop?._original?.address_id && currentStop._original.address_id !== '') ? currentStop._original.address_id :
        (currentStop?._original?.Address_ID && currentStop._original.Address_ID !== '') ? currentStop._original.Address_ID :
        (currentStop?._original?.addressId && currentStop._original.addressId !== '') ? currentStop._original.addressId :
        null;
      
      // If address_id is available, use it to update address geo_location directly
      if (addressId) {
        // Check if offline - queue action if offline
        if (!offlineService.checkOnline()) {
          // Queue the location update action
          const actionId = offlineService.queueAction({
            type: 'update_location',
            data: {
              driver_id: user.id,
              address_id: addressId,
              latitude: completionLocation.latitude,
              longitude: completionLocation.longitude
            }
          });
          
          if (actionId) {
            // Mark location as updated for this stop (optimistically)
            setLocationUpdated(true);
            setUpdatedLocationStops(prev => new Set(prev).add(stopIndex));
            
            // Show success toast
            toast.success(
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-semibold text-green-800 text-base">✅ Location Updated! (Queued for sync)</div>
                  <div className="text-sm text-green-700 mt-1">GPS coordinates will be synced when network is restored.</div>
                </div>
              </div>,
              {
                position: "top-right",
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
                style: {
                  background: "#f0f9ff",
                  border: "1px solid #10b981",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
                },
              }
            );
            
            // Update sync status
            setSyncStatus(offlineService.getSyncStatus());
            
            // Close the location UI after successful update (but keep updatedLocationStops)
            setCompletingDelivery(null);
            setCompletionLocation(null);
            setCompletionLocationError(null);
            setLocationUpdated(false);
            setCompletionLoading(false);
            return;
          } else {
            throw new Error('Failed to queue location update');
          }
        }
        
        // Online - proceed with normal API call
        const response = await axiosInstance.put(`/delivery-executives/${user.id}/location`, {
          address_id: addressId,
          latitude: completionLocation.latitude,
          longitude: completionLocation.longitude
        });
        
        if (response.data.success) {
          // Mark location as updated for this stop (using address_id + session)
          setLocationUpdated(true);
          markLocationAsUpdated(addressId, selectedSession);
          
          // Show success toast
          toast.success(
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-semibold text-green-800 text-base">✅ Location Updated Successfully!</div>
                <div className="text-sm text-green-700 mt-1">GPS coordinates have been updated using address ID.</div>
              </div>
            </div>,
            {
              position: "top-right",
              autoClose: 4000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light",
              style: {
                background: "#f0f9ff",
                border: "1px solid #10b981",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
              },
            }
          );
          
          // Close the location UI after successful update (but keep updatedLocationStops)
          setCompletingDelivery(null);
          setCompletionLocation(null);
          setCompletionLocationError(null);
          setLocationUpdated(false);
          setCompletionLoading(false);
          return;
        } else {
          throw new Error(response.data.message || 'Failed to update address');
        }
      }
      
      // Try multiple ways to get delivery_item_id
      const deliveryItemId = 
        (currentStop?.Delivery_Item_ID && currentStop.Delivery_Item_ID !== '') ? currentStop.Delivery_Item_ID :
        (currentStop?.delivery_item_id && currentStop.delivery_item_id !== '') ? currentStop.delivery_item_id :
        (currentStop?._original?.delivery_item_id && currentStop._original.delivery_item_id !== '') ? currentStop._original.delivery_item_id :
        (currentStop?._original?.Delivery_Item_ID && currentStop._original.Delivery_Item_ID !== '') ? currentStop._original.Delivery_Item_ID :
        null;
      
      // If delivery_item_id is not found, try using order_id and menu_item_id as fallback
      if (!deliveryItemId) {
        // Try to get order_id and menu_item_id from stop data
        const orderId = currentStop?.order_id || 
                       currentStop?.Order_ID || 
                       currentStop?._original?.order_id || 
                       currentStop?._original?.Order_ID;
        
        const menuItemId = currentStop?.menu_item_id || 
                          currentStop?.Menu_Item_ID || 
                          currentStop?._original?.menu_item_id || 
                          currentStop?._original?.Menu_Item_ID;
        
        const deliveryDate = currentStop?.Date || 
                            currentStop?.date || 
                            currentStop?._original?.date || 
                            currentStop?._original?.Date;
        
        const session = selectedSession || 
                       currentStop?.session || 
                       currentStop?._original?.session;
        
        // If we have order_id and menu_item_id, use the updateGeoLocation endpoint
        if (orderId && menuItemId) {
          const geoLocationString = `${completionLocation.latitude},${completionLocation.longitude}`;
          
          const mutationPayload = {
            geo_location: geoLocationString,
            order_id: orderId,
            menu_item_id: menuItemId
          };
          
          if (deliveryDate) {
            mutationPayload.delivery_date = deliveryDate;
          }
          if (session) {
            mutationPayload.session = session;
          }
          
          // Check if offline - queue action if offline
          if (!offlineService.checkOnline()) {
            // Queue the location update action
            const actionId = offlineService.queueAction({
              type: 'update_location',
              data: mutationPayload
            });
            
            if (actionId) {
              // Mark location as updated for this stop (optimistically)
              setLocationUpdated(true);
              setUpdatedLocationStops(prev => new Set(prev).add(stopIndex));
              
              // Show success toast
              toast.success(
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="font-semibold text-green-800 text-base">✅ Location Updated! (Queued for sync)</div>
                    <div className="text-sm text-green-700 mt-1">GPS coordinates will be synced when network is restored.</div>
                  </div>
                </div>,
                {
                  position: "top-right",
                  autoClose: 4000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                  theme: "light",
                  style: {
                    background: "#f0f9ff",
                    border: "1px solid #10b981",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
                  },
                }
              );
              
              // Update sync status
              setSyncStatus(offlineService.getSyncStatus());
              
              // Close the location UI
              setCompletingDelivery(null);
              setCompletionLocation(null);
              setCompletionLocationError(null);
              setLocationUpdated(false);
              setCompletionLoading(false);
              return;
            } else {
              throw new Error('Failed to queue location update');
            }
          }
          
          // Online - proceed with normal API call
          await updateGeoLocationMutation.mutateAsync(mutationPayload);

          // Mark location as updated for this stop (using address_id + session if available)
          setLocationUpdated(true);
          // Try to get address_id for persistence
          const addressIdForLocation = 
            (currentStop?.address_id && currentStop.address_id !== '') ? currentStop.address_id :
            (currentStop?.Address_ID && currentStop.Address_ID !== '') ? currentStop.Address_ID :
            (currentStop?.addressId && currentStop.addressId !== '') ? currentStop.addressId :
            (currentStop?._original?.address_id && currentStop._original.address_id !== '') ? currentStop._original.address_id :
            (currentStop?._original?.Address_ID && currentStop._original.Address_ID !== '') ? currentStop._original.Address_ID :
            (currentStop?._original?.addressId && currentStop._original.addressId !== '') ? currentStop._original.addressId :
            null;
          
          if (addressIdForLocation) {
            markLocationAsUpdated(addressIdForLocation, selectedSession);
          } else {
            // Fallback to index-based tracking if address_id not available
            setUpdatedLocationStops(prev => new Set(prev).add(stopIndex));
          }
          
          // Show success toast
          toast.success(
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-semibold text-green-800 text-base">✅ Location Updated Successfully!</div>
                <div className="text-sm text-green-700 mt-1">GPS coordinates have been updated using order and menu item IDs.</div>
              </div>
            </div>,
            {
              position: "top-right",
              autoClose: 4000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light",
              style: {
                background: "#f0f9ff",
                border: "1px solid #10b981",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
              },
            }
          );
          
          // Close the location UI after successful update (but keep updatedLocationStops)
          setCompletingDelivery(null);
          setCompletionLocation(null);
          setCompletionLocationError(null);
          setLocationUpdated(false);
          setCompletionLoading(false);
          return;
        }
        
        // Log all available fields for debugging
        console.error('Stop object keys:', Object.keys(currentStop || {}));
        console.error('Stop _original keys:', Object.keys(currentStop?._original || {}));
        console.error('Stop data:', JSON.stringify(currentStop, null, 2));
        
        const errorMsg = `No delivery item ID found for this delivery stop. Stop: ${currentStop?.Delivery_Name || 'Unknown'}. Please check the route data.`;
        setCompletionLocationError(errorMsg);
        showErrorToast(errorMsg);
        setCompletionLoading(false);
        return;
      }
      
      const requestData = {
        latitude: completionLocation.latitude,
        longitude: completionLocation.longitude
      };
      
      const response = await axiosInstance.put(`/api/delivery-items/${deliveryItemId}/address`, requestData);

      if (response.data.success) {
        // Mark location as updated for this stop (using address_id + session if available)
        setLocationUpdated(true);
        // Try to get address_id for persistence
        const addressIdForLocation = 
          (currentStop?.address_id && currentStop.address_id !== '') ? currentStop.address_id :
          (currentStop?.Address_ID && currentStop.Address_ID !== '') ? currentStop.Address_ID :
          (currentStop?.addressId && currentStop.addressId !== '') ? currentStop.addressId :
          (currentStop?._original?.address_id && currentStop._original.address_id !== '') ? currentStop._original.address_id :
          (currentStop?._original?.Address_ID && currentStop._original.Address_ID !== '') ? currentStop._original.Address_ID :
          (currentStop?._original?.addressId && currentStop._original.addressId !== '') ? currentStop._original.addressId :
          null;
        
        if (addressIdForLocation) {
          markLocationAsUpdated(addressIdForLocation, selectedSession);
        } else {
          // Fallback to index-based tracking if address_id not available
          setUpdatedLocationStops(prev => new Set(prev).add(stopIndex));
        }
        
        // Show toastify success popup
        toast.success(
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-semibold text-green-800 text-base">✅ Location Updated Successfully!</div>
              <div className="text-sm text-green-700 mt-1">GPS coordinates have been updated for this delivery location.</div>
            </div>
          </div>,
          {
            position: "top-right",
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
            style: {
              background: "#f0f9ff",
              border: "1px solid #10b981",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
            },
          }
        );
        
        // Close the location UI after successful update (but keep updatedLocationStops)
        setCompletingDelivery(null);
        setCompletionLocation(null);
        setCompletionLocationError(null);
        setLocationUpdated(false);
      } else {
        throw new Error(response.data.message || 'Failed to update delivery address');
      }
    } catch (apiError) {
      
      // Show toastify error popup
      toast.error(
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="font-semibold text-red-800 text-base">❌ Update Failed</div>
            <div className="text-sm text-red-700 mt-1">
              {apiError.response?.data?.message || apiError.message || 'Failed to update delivery address. Please try again.'}
            </div>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          style: {
            background: "#fef2f2",
            border: "1px solid #ef4444",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.15)",
          },
        }
      );
      
      setCompletionLocationError(apiError.response?.data?.message || apiError.message || 'Failed to update delivery address. Please try again.');
    } finally {
      setCompletionLoading(false);
    }
  };


  const handleLogout = async () => {
    try {
      // Call logout API endpoint if it exists
      try {
        await axiosInstance.post('/auth/logout');
      } catch (error) {
        // Logout API call failed, proceeding with local logout
      }
      
      // Clear all authentication data
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear any cookies if they exist
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      // Clear axios default headers
      delete axiosInstance.defaults.headers.common['Authorization'];
      
      // Call logout from store
      logout();
      
      // Show success message
      message.success('Logged out successfully');
      
      // Navigate to home page
      navigate('/jkhm');
      
      // Force page reload to clear any remaining state
      window.location.reload();
    } catch (error) {
      message.error('Logout failed. Please try again.');
    }
  };


  // Get phone number from user object
  const getUserPhoneNumber = () => {
    // Try different possible locations for phone number
    if (user?.phoneNumber) return user.phoneNumber;
    if (user?.phone) return user.phone;
    if (user?.contacts?.[0]?.phoneNumbers?.[0]?.number) return user.contacts[0].phoneNumbers[0].number;
    if (user?.contacts?.[0]?.phone) return user.contacts[0].phone;
    return null;
  };

  // Helper function to transform API response to sessions format
  const transformRoutesToSessions = (routesData) => {
    // If already in sessions format, return as is
    if (routesData.sessions) {
      return routesData;
    }

    // Handle nested data structure: { data: { routes: [...] } }
    let routesArray = routesData.routes;
    if (!routesArray && routesData.data && routesData.data.routes) {
      routesArray = routesData.data.routes;
    }

    // Transform routes array to sessions format
    if (routesArray && Array.isArray(routesArray)) {
      const sessions = {};
      
      routesArray.forEach(route => {
        // Normalize session name to lowercase for consistent matching
        const sessionName = (route.session || 'dinner').toLowerCase();
        
        if (!sessions[sessionName]) {
          sessions[sessionName] = {
            stops: [],
            map_link: route.map_link || '',
            route_id: route.route_id || '', // Store route_id at session level
            route_map_link: route.route_map_link || route.map_link || '',
            map_view_link: route.map_view_link || ''
          };
        }
        
        // Transform stops to match expected format
        if (route.stops && Array.isArray(route.stops)) {
          const transformedStops = route.stops.map(stop => ({
            Stop_No: stop.stop_order || stop.Stop_No || 0,
            Delivery_Name: stop.delivery_name || stop.Delivery_Name || 'Unknown',
            Location: stop.location || stop.Location || '',
            Packages: stop.packages || stop.Packages || 0,
            Delivery_Item_ID: stop.delivery_item_id || stop.Delivery_Item_ID || '',
            Date: stop.date || stop.Date || routesData.date || routesData.data?.date || '',
            Latitude: stop.latitude || stop.Latitude || 0,
            Longitude: stop.longitude || stop.Longitude || 0,
            Map_Link: stop.map_link || stop.Map_Link || '',
            route_id: stop.route_id || route.route_id || '', // Ensure route_id is in each stop
            planned_stop_id: stop.planned_stop_id || stop.Planned_Stop_ID || null, // Preserve planned_stop_id
            // Keep original data for reference
            _original: stop
          }));
          
          sessions[sessionName].stops = [...sessions[sessionName].stops, ...transformedStops];
        }
      });
      
      return {
        ...routesData,
        sessions: sessions,
        routes: routesArray // Keep original routes array for reference
      };
    }
    
    return routesData;
  };


  // Fetch routes function
  const fetchRoutes = async () => {
    // Use driver_id (user.id) instead of phone number
    const driverId = user?.id;
  
    if (!driverId) {
      setRoutesError('User ID not found for delivery executive');
      return;
    }
    setRoutesLoading(true);
    setRoutesError(null);

    try {
      const apiUrl = `/delivery-executives/routes?driver_id=${driverId}`;
      
      const response = await axiosInstance.get(apiUrl);

      if (response.data && response.data.success) {
        const routesData = response.data.data;
        
        // Transform the response to sessions format
        const transformedData = transformRoutesToSessions(routesData);
        
        // Preserve existing Map_Link data when updating routes
        const preserveMapLinks = (newRoutes, oldRoutes) => {
          // If no old routes or no sessions, just return new routes
          if (!oldRoutes?.sessions || Object.keys(oldRoutes.sessions).length === 0) {
            return newRoutes;
          }
          
          if (!newRoutes?.sessions) {
            return newRoutes;
          }
          
          // Merge map links from old routes into new routes
          const mergedSessions = { ...newRoutes.sessions };
          
          Object.keys(oldRoutes.sessions).forEach(sessionName => {
            const oldSession = oldRoutes.sessions[sessionName];
            const newSession = mergedSessions[sessionName];
            
            // Only merge if both sessions exist
            if (oldSession && newSession) {
              // Preserve map links at session level
              mergedSessions[sessionName] = {
                ...newSession,
                map_link: newSession.map_link || oldSession.map_link || '',
                route_map_link: newSession.route_map_link || oldSession.route_map_link || '',
                map_view_link: newSession.map_view_link || oldSession.map_view_link || ''
              };
              
              // Preserve Map_Link for each stop
              if (oldSession.stops && Array.isArray(oldSession.stops) && 
                  newSession.stops && Array.isArray(newSession.stops)) {
                mergedSessions[sessionName].stops = newSession.stops.map(newStop => {
                  // Try to find matching old stop by multiple criteria
                  const oldStop = oldSession.stops.find(os => {
                    const stopNoMatch = (os.Stop_No === newStop.Stop_No) || 
                                       (os.stop_order === newStop.stop_order) ||
                                       (os.Stop_No === newStop.stop_order) ||
                                       (os.stop_order === newStop.Stop_No);
                    const nameMatch = (os.Delivery_Name === newStop.Delivery_Name) ||
                                     (os.delivery_name === newStop.delivery_name) ||
                                     (os.Delivery_Name === newStop.delivery_name) ||
                                     (os.delivery_name === newStop.Delivery_Name) ||
                                     (os.Delivery_Name && newStop.Delivery_Name && 
                                      os.Delivery_Name.toLowerCase() === newStop.Delivery_Name.toLowerCase());
                    return stopNoMatch && nameMatch;
                  });
                  
                  // Preserve Map_Link if old stop has it and new stop doesn't
                  if (oldStop && oldStop.Map_Link && !newStop.Map_Link) {
                    return {
                      ...newStop,
                      Map_Link: oldStop.Map_Link
                    };
                  }
                  return newStop;
                });
              }
            }
          });
          
          return {
            ...newRoutes,
            sessions: mergedSessions
          };
        };
        
        // Handle different response structures
        let finalRoutes = null;
        
        // Structure 1: Object with data.routes (new format: { data: { date, driver_id, routes: [...] } })
        // This matches the actual API response structure
        if (routesData && typeof routesData === 'object' && routesData.routes && Array.isArray(routesData.routes) && routesData.routes.length > 0) {
          finalRoutes = preserveMapLinks(transformedData, routes);
        }
        // Structure 2: Object with sessions property (already transformed)
        else if (transformedData && transformedData.sessions && Object.keys(transformedData.sessions).length > 0) {
          finalRoutes = preserveMapLinks(transformedData, routes);
        }
        // Structure 3: Object with sessions property (legacy)
        else if (routesData && typeof routesData === 'object' && routesData.sessions) {
          finalRoutes = preserveMapLinks(routesData, routes);
        }
        // Structure 4: Array - convert to object with sessions
        else if (Array.isArray(routesData) && routesData.length > 0) {
          // If it's an array, try to structure it
          const structuredRoutes = {
            sessions: routesData[0]?.sessions || {},
            ...routesData[0]
          };
          finalRoutes = preserveMapLinks(structuredRoutes, routes);
        }
        // Structure 5: Empty or no data
        else {
          finalRoutes = { sessions: {}, routes: [] };
        }
        
        if (finalRoutes) {
          setRoutes(finalRoutes);
          
          // Cache routes for offline use (including map links)
          const cacheData = {
            ...finalRoutes,
            driver_id: driverId,
            cached_at: new Date().toISOString()
          };
          offlineService.cacheRoutes(cacheData);
          
          message.success('Routes loaded successfully!');
        } else {
          setRoutes({ sessions: {}, routes: [] });
          message.info('No routes assigned for today');
        }
        
        // Refetch map data after routes are updated to ensure map links are populated
        if (isMapsEnabled) {
          setTimeout(() => {
            refetchDriverMaps();
            refetchRouteOverview();
          }, 500);
        }
      } else {
        throw new Error(response.data?.message || 'Failed to fetch routes');
      }
    } catch (apiError) {
      // If offline and we have cached routes, use them instead of showing error
      if (!offlineService.checkOnline()) {
        const cachedRoutes = offlineService.getCachedRoutes();
        if (cachedRoutes && cachedRoutes.sessions && Object.keys(cachedRoutes.sessions).length > 0) {
          setRoutes(cachedRoutes);
          message.info('Using cached routes (offline mode)');
          setRoutesLoading(false);
          return;
        }
      }
      
      let errorMessage = apiError.response?.data?.message || apiError.message || 'Failed to fetch routes. Please try again.';
      
      // Sanitize error message to remove driver ID and date for user-friendly display
      // Check if it's a "no routes" message and clean it up
      if (errorMessage.toLowerCase().includes('no routes assigned')) {
        // Remove driver ID (UUID pattern - matches any UUID format)
        errorMessage = errorMessage
          .replace(/for driver [a-f0-9-]{8,36}/gi, '') // Remove "for driver <uuid>" (8-36 chars for UUID)
          .replace(/driver [a-f0-9-]{8,36}/gi, '') // Remove "driver <uuid>" (without "for")
          .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '') // Remove any UUID pattern
          .replace(/on \d{4}-\d{2}-\d{2}/gi, '') // Remove "on YYYY-MM-DD"
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .trim();
        
        // If message is empty or just whitespace after sanitization, use default message
        if (!errorMessage || errorMessage.length === 0) {
          errorMessage = 'No routes assigned for today';
        } else {
          // Ensure it starts with proper capitalization
          errorMessage = errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1);
        }
      }
      
      setRoutesError(errorMessage);
      message.error(errorMessage);
    } finally {
      setRoutesLoading(false);
    }
  };

  // Handle routes tab click
  const handleRoutesTabClick = () => {
    const driverId = user?.id;
    
    setActiveTab('routes');
    setSidebarOpen(false);
    
    // Fetch routes when switching to routes tab
    if ((!routes.sessions || Object.keys(routes.sessions).length === 0) && !routesLoading && driverId) {
      fetchRoutes();
    }
  };

  // Get current GPS location
  const getCurrentLocationForJourney = () => {
    if (!navigator.geolocation) {
      showErrorToast('Geolocation is not supported by your browser');
      return;
    }
    
    setLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setCurrentLocation(location);
        // Note: Location is captured but not sent to API (API only requires route_id and driver_id)
        setLocationLoading(false);
        showSuccessToast('Location captured successfully!');
      },
      (error) => {
        // Silently handle location errors without showing toast
        setLocationLoading(false);
        // User can try again if needed
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Get current GPS location for traffic checking (returns Promise)
  const getCurrentLocationForTraffic = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          // Silently fail - return null instead of rejecting
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    });
  };

  // Helper function to get route_id from routes data
  const getRouteIdFromRoutes = useCallback(() => {
    // First, try to get route_id from currently selected session
    const sessionRouteId = getRouteIdFromSelectedSession();
    if (sessionRouteId) {
      return sessionRouteId;
    }
    
    // Check for routes array in the response structure: { routes: [...] }
    if (routes?.routes && Array.isArray(routes.routes) && routes.routes.length > 0) {
      return routes.routes[0].route_id || '';
    } 
    // Check for nested data structure: { data: { routes: [...] } }
    else if (routes?.data?.routes && Array.isArray(routes.data.routes) && routes.data.routes.length > 0) {
      return routes.data.routes[0].route_id || '';
    }
    // Check for sessions structure (legacy format)
    else if (routes?.sessions) {
      const sessions = routes.sessions;
      // Try to get route_id from first available session
      const firstSession = sessions.breakfast || sessions.lunch || sessions.dinner;
      if (firstSession && firstSession.route_id) {
        return firstSession.route_id;
      }
      // Try from stops
      if (firstSession && firstSession.stops && firstSession.stops.length > 0) {
        const firstStop = firstSession.stops.find(stop => stop.route_id || stop.Route_ID);
        return firstStop?.route_id || firstStop?.Route_ID || '';
      }
    }
    // Use activeRouteId if available
    return activeRouteId || '';
  }, [routes, activeRouteId, getRouteIdFromSelectedSession]);

  // Check if routes are available (for button visibility)
  const hasRoutes = useMemo(() => {
    return !!(routes?.sessions && Object.keys(routes.sessions).length > 0) || 
           !!(routes?.routes && routes.routes.length > 0) ||
           !!(routes?.data?.routes && routes.data.routes.length > 0) ||
           !!activeRouteId;
  }, [routes, activeRouteId]);

  // Manual route reoptimization (for delivery executive to manually reroute)
  const handleReoptimizeRoute = useCallback(async () => {
    const routeId = getRouteIdFromRoutes();
    
    if (!routeId) {
      showErrorToast('No route found. Please ensure you have an active route.');
      return;
    }
    
    try {
      // Get current location for reoptimization
      const currentLocation = await getCurrentLocationForTraffic();
      
      const result = await reoptimizeRouteMutation.mutateAsync({
        route_id: routeId,
        current_location: currentLocation
      });
      
      if (result.success) {
        showSuccessToast('Route reoptimized successfully! The route has been updated.');
        
        // Refresh routes to show updated order
        fetchRoutes();
      } else {
        showErrorToast(result.message || 'Failed to reoptimize route');
      }
    } catch (error) {
      if (error.response?.data?.message) {
        showErrorToast(error.response.data.message);
      } else {
        showErrorToast(error.message || 'Failed to reoptimize route. Please try again.');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getRouteIdFromRoutes, reoptimizeRouteMutation]);

  // Check traffic and auto-reoptimize (wrapped in useCallback to avoid dependency issues)
  const handleCheckTraffic = useCallback(async () => {
    if (!activeRouteId) {
      showErrorToast('No active journey. Please start a journey first.');
      return;
    }
    
    try {
      const currentLocation = await getCurrentLocationForTraffic();
      
      const result = await checkTrafficMutation.mutateAsync({
        route_id: activeRouteId,
        current_location: currentLocation,
        check_all_segments: true
      });
      
      setTrafficData(result);
      setLastTrafficCheck(new Date());
      
      // Show alerts based on result
      if (result.heavy_traffic_detected) {
        setShowTrafficAlert(true);
        // Auto-hide after 10 seconds
        setTimeout(() => setShowTrafficAlert(false), 10000);
      }
      
      if (result.reoptimized && result.updated_route_order) {
        setShowReoptimizationSuccess(true);
        // Auto-hide after 15 seconds
        setTimeout(() => setShowReoptimizationSuccess(false), 15000);
        
        // Show success toast with details
        const timeSaved = result.reoptimization_result?.time_saved_minutes || 0;
        const distanceSaved = result.reoptimization_result?.distance_saved_km || 0;
        showSuccessToast(
          `Route optimized! Saved ${timeSaved} minutes${distanceSaved > 0 ? ` and ${distanceSaved} km` : ''}`
        );
        
        // Refresh routes to show updated order
        fetchRoutes();
      }
    } catch (error) {
      // Handle rate limiting errors
      if (error.rateLimitInfo) {
        const resetTime = error.rateLimitInfo.resetTime 
          ? new Date(error.rateLimitInfo.resetTime).toLocaleTimeString()
          : 'later';
        showErrorToast(`Rate limit exceeded. Please try again after ${resetTime}`);
      } else if (error.isApiKeyError) {
        showErrorToast('API key authentication failed. Please contact support.');
      } else {
        // Silently handle other errors - don't interrupt user experience
        console.error('Traffic check error:', error);
      }
    }
  }, [activeRouteId, checkTrafficMutation]);

  // Use ref to store the latest handleCheckTraffic function
  const handleCheckTrafficRef = useRef(handleCheckTraffic);
  useEffect(() => {
    handleCheckTrafficRef.current = handleCheckTraffic;
  }, [handleCheckTraffic]);

  // Auto-check traffic every 5 minutes when journey is active
  // Only depends on activeRouteId to prevent re-creating interval
  useEffect(() => {
    if (!activeRouteId) {
      return; // No active journey, don't check traffic
    }
    
    // Check immediately when journey starts
    handleCheckTrafficRef.current();
    
    // Then check every 5 minutes (300000 ms)
    const trafficCheckInterval = setInterval(() => {
      handleCheckTrafficRef.current();
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(trafficCheckInterval);
    };
  }, [activeRouteId]); // Only re-run when activeRouteId changes

  // Handle Start Journey button click
  const handleStartJourneyClick = () => {
    if (!user?.id) {
      showErrorToast('User ID not found. Please log in again.');
      return;
    }
    
    // Get route_id from currently selected session (preferred)
    let routeId = getRouteIdFromSelectedSession();
    
    // Fallback: Extract route_id from fetched routes if session doesn't have one
    if (!routeId) {
      // Check for routes array in the response structure: { routes: [...] }
      if (routes?.routes && Array.isArray(routes.routes) && routes.routes.length > 0) {
        routeId = routes.routes[0].route_id || '';
      } 
      // Check for nested data structure: { data: { routes: [...] } }
      else if (routes?.data?.routes && Array.isArray(routes.data.routes) && routes.data.routes.length > 0) {
        routeId = routes.data.routes[0].route_id || '';
      }
      // Check for sessions structure (legacy format)
      else if (routes?.sessions) {
        const sessions = routes.sessions;
        // Try to get route_id from first available session
        const firstSession = sessions.breakfast || sessions.lunch || sessions.dinner;
        if (firstSession && firstSession.routes && Array.isArray(firstSession.routes) && firstSession.routes.length > 0) {
          routeId = firstSession.routes[0].route_id || '';
        }
      }
    }
    
    // Set driver_id and route_id and open modal for confirmation
    setStartJourneyData({
      route_id: routeId,
      driver_id: user?.id || ''
    });
    setShowStartJourneyModal(true);
    
    // Auto-get location when modal opens
    getCurrentLocationForJourney();
  };

  // Handle Start Journey submission
  const handleStartJourney = async () => {
    if (!startJourneyData.driver_id) {
      showErrorToast('Driver ID is required');
      return;
    }
    
    try {
      // Get the current session's route_id (this is the correct one to use)
      const currentSessionRouteId = getRouteIdFromSelectedSession();
      
      if (!currentSessionRouteId) {
        showErrorToast('Route ID not found for current session. Please ensure routes are loaded.');
        return;
      }
      
      const journeyData = {
        driver_id: startJourneyData.driver_id,
        route_id: currentSessionRouteId
      };
      
      // Check if offline - queue action if offline
      if (!offlineService.checkOnline()) {
        // Queue the start journey action
        const actionId = offlineService.queueAction({
          type: 'start_journey',
          data: journeyData
        });
        
        if (actionId) {
          // Optimistically set active route (will be confirmed when synced)
          setActiveRouteId(currentSessionRouteId);
          localStorage.setItem('activeRouteId', currentSessionRouteId);
          
          showSuccessToast(`${selectedSession.charAt(0).toUpperCase() + selectedSession.slice(1)} journey started! (Queued for sync)`);
          setShowStartJourneyModal(false);
          setStartJourneyData({
            route_id: '',
            driver_id: user?.id || ''
          });
          
          // Update sync status
          setSyncStatus(offlineService.getSyncStatus());
          return;
        } else {
          throw new Error('Failed to queue start journey action');
        }
      }
      
      // Online - proceed with normal API call
      // Send both driver_id and route_id to the API
      // This ensures the external API knows which route to start the journey for
      const result = await startJourneyMutation.mutateAsync(journeyData);
      
      // Use the route_id we sent (current session's route_id) or API response
      const activeRouteId = result.route_id || currentSessionRouteId;
      
      if (activeRouteId) {
        setActiveRouteId(activeRouteId);
        // Persist to localStorage so it survives page refresh
        localStorage.setItem('activeRouteId', activeRouteId);
      }
      
      showSuccessToast(`${selectedSession.charAt(0).toUpperCase() + selectedSession.slice(1)} journey started successfully!`);
      setShowStartJourneyModal(false);
      setStartJourneyData({
        route_id: '',
        driver_id: user?.id || ''
      });
      
      // Refresh routes after starting journey
      fetchRoutes().then(() => {
        // Refetch map data to ensure map links are available after routes are loaded
        if (isMapsEnabled) {
          setTimeout(() => {
            refetchDriverMaps();
            refetchRouteOverview();
          }, 500);
        }
      });
    } catch (error) {
      showErrorToast(error.message || 'Failed to start journey');
    }
  };

  // Handle opening status selection modal
  // Helper function to get comments key for localStorage
  const getCommentsKey = (stop, routeId, stopIndex = null) => {
    const stopOrder = stop.Stop_No || stop.stop_order || (stopIndex !== null ? stopIndex + 1 : 1);
    const plannedStopId = stop.planned_stop_id || stop.Planned_Stop_ID || stop._original?.planned_stop_id || stop._original?.Planned_Stop_ID;
    return `delivery_comments_${routeId}_${plannedStopId || stopOrder}`;
  };

  // Helper function to save comments to localStorage
  const saveCommentsToLocalStorage = (key, comments) => {
    try {
      if (comments && comments.trim()) {
        localStorage.setItem(key, comments.trim());
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error saving comments to localStorage:', error);
    }
  };

  // Helper function to load comments from localStorage
  const loadCommentsFromLocalStorage = (key) => {
    try {
      return localStorage.getItem(key) || '';
    } catch (error) {
      console.error('Error loading comments from localStorage:', error);
      return '';
    }
  };

  const handleOpenStatusModal = (stop, stopIndex) => {
    setSelectedStopForStatus(stop);
    setSelectedStopIndex(stopIndex);
    setSelectedStopStatus('Delivered'); // Reset to default
    
    // Load comments from localStorage
    const routeId = activeRouteId;
    const commentsKey = getCommentsKey(stop, routeId, stopIndex);
    const savedComments = loadCommentsFromLocalStorage(commentsKey);
    setDeliveryComments(savedComments);
    
    setShowStatusModal(true);
  };


  // Handle marking a stop as reached/delivered with status
  const handleStopReached = async (stop, stopIndex, status = 'Delivered') => {
    if (!user?.id) {
      showErrorToast('User ID not found. Please log in again.');
      return;
    }
    
    // Get route_id from currently selected session
    const currentSessionRouteId = getRouteIdFromSelectedSession();
    
    // Check if session is completed
    const isSessionCompleted = completedSessions.has(selectedSession.toLowerCase());
    if (isSessionCompleted) {
      showErrorToast('This session is already completed. Cannot mark stops for completed sessions.');
      return;
    }
    
    // Use the activeRouteId (from started journey) - this is the correct route_id
    const routeId = activeRouteId;
    
    // Prepare stop data
    const stopOrder = stop.Stop_No || stop.stop_order || stopIndex + 1;
    // Try multiple sources for planned_stop_id: direct property, _original, or routeOrderData
    let plannedStopId = stop.planned_stop_id || stop.Planned_Stop_ID || stop._original?.planned_stop_id || stop._original?.Planned_Stop_ID;
    
    // If still not found, try to get it from routeOrderData by matching stop_order or delivery_name
    if (!plannedStopId && routeOrderData?.stops) {
      const matchingRouteStop = routeOrderData.stops.find(routeStop => 
        routeStop.stop_order === stopOrder ||
        routeStop.delivery_name?.toLowerCase() === stop.Delivery_Name?.toLowerCase()
      );
      if (matchingRouteStop?.planned_stop_id) {
        plannedStopId = matchingRouteStop.planned_stop_id;
      }
    }
    
    const deliveryId = stop.Delivery_Item_ID || stop.delivery_item_id || '';
    const packagesDelivered = stop.Packages || stop.packages || 1;
    
    // Debug log to help troubleshoot (only log when not found)
    if (!plannedStopId) {
      console.warn('planned_stop_id not found for stop:', {
        Stop_No: stopOrder,
        Delivery_Name: stop.Delivery_Name
      });
    }
    
    // Set loading state for geolocation
    setGettingLocation(true);
    
    try {
      // Get current location with better error handling and timeout
      let position = null;
      let locationError = null;
      
      try {
        position = await new Promise((resolve, reject) => {
          // Set a timeout for the geolocation call
          const timeoutId = setTimeout(() => {
            reject(new Error('Location request timed out. Please try again.'));
          }, 8000); // Reduced from 10s to 8s for faster feedback
          
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              clearTimeout(timeoutId);
              resolve(pos);
            },
            (err) => {
              clearTimeout(timeoutId);
              reject(err);
            },
            {
              enableHighAccuracy: false, // Changed to false for faster response
              timeout: 7000, // 7 seconds timeout
              maximumAge: 30000 // Accept location up to 30 seconds old (faster)
            }
          );
        });
      } catch (geoError) {
        locationError = geoError;
        // If geolocation fails, we'll proceed without location (optional)
        console.warn('Geolocation failed, proceeding without location:', geoError);
      }
      
      // Prepare request data - use planned_stop_id if available, otherwise fallback to stop_order
      const requestData = {
        route_id: routeId,
        delivery_id: deliveryId,
        driver_id: user.id,
        completed_at: new Date().toISOString(),
        status: status
      };
      
      // Use planned_stop_id if available, otherwise fallback to stop_order for backward compatibility
      // Explicitly check for truthy value and ensure it's a string
      if (plannedStopId && typeof plannedStopId === 'string' && plannedStopId.trim() !== '') {
        requestData.planned_stop_id = plannedStopId;
      } else {
        requestData.stop_order = stopOrder;
      }
      
      // Add location if available (make it optional)
      if (position && position.coords) {
        requestData.current_location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
      }
      
      // Add comments if provided (trim and only include if not empty)
      if (deliveryComments && deliveryComments.trim()) {
        requestData.comments = deliveryComments.trim();
      }
      
      // Use new format matching documentation with status
      // Check if offline - queue action if offline
      if (!offlineService.checkOnline()) {
        // Queue the action for later sync
        const actionId = offlineService.queueAction({
          type: 'mark_stop',
          data: requestData
        });
        
        if (actionId) {
          const statusMessage = status === 'CUSTOMER_UNAVAILABLE' 
            ? `Stop ${stopOrder} marked as Customer Unavailable! (Queued for sync)`
            : `Stop ${stopOrder} marked as Delivered! (Queued for sync)`;
          showSuccessToast(statusMessage);
          
          // Mark this stop as reached in local state (include session to make it unique across sessions)
          const session = selectedSession.toLowerCase();
          const stopKey = `${routeId}-${session}-${stopOrder}`;
          setMarkedStops(prev => new Set(prev).add(stopKey));
          
          // Update sync status
          setSyncStatus(offlineService.getSyncStatus());
        } else {
          showErrorToast('Failed to queue action. Please try again.');
        }
        
        // Close modal if open
        setShowStatusModal(false);
        setSelectedStopForStatus(null);
        setSelectedStopIndex(null);
        setGettingLocation(false);
        return;
      }
      
      // Online - proceed with normal API call
      await stopReachedMutation.mutateAsync(requestData);
      
      const statusMessage = status === 'CUSTOMER_UNAVAILABLE' 
        ? `Stop ${stopOrder} marked as Customer Unavailable!`
        : `Stop ${stopOrder} marked as Delivered!`;
      showSuccessToast(statusMessage);
      
      // Mark this stop as reached in local state (include session to make it unique across sessions)
      // Use planned_stop_id as stable identifier, fallback to stop_order for backward compatibility
      const session = selectedSession.toLowerCase();
      const stopIdentifier = plannedStopId || stopOrder;
      const stopKey = `${routeId}-${session}-${stopIdentifier}`;
      setMarkedStops(prev => new Set(prev).add(stopKey));
      
      // Clear comments from localStorage after successful submission
      const commentsKey = getCommentsKey(stop, routeId, stopIndex);
      localStorage.removeItem(commentsKey);
      setDeliveryComments('');
      
      // Close modal if open
      setShowStatusModal(false);
      setSelectedStopForStatus(null);
      setSelectedStopIndex(null);
      setGettingLocation(false);
      
      // Refresh routes to update status (but don't wait for it - make it non-blocking)
      // Use setTimeout to make it non-blocking
      setTimeout(async () => {
        await fetchRoutes();
        // Refetch map data to ensure map links are available after marking stop
        if (isMapsEnabled) {
          setTimeout(() => {
            refetchDriverMaps();
            refetchRouteOverview();
          }, 500);
        }
      }, 100);
      
    } catch (error) {
      setGettingLocation(false);
      
      // Better error handling
      if (error.code === 1) {
        showErrorToast('Location access denied. Please enable location permissions in your browser settings.');
      } else if (error.code === 2) {
        showErrorToast('Location unavailable. Please check your GPS or network connection.');
      } else if (error.code === 3 || error.message?.includes('timeout')) {
        showErrorToast('Location request timed out. The stop was marked without location data.');
        // Try to proceed without location
        try {
          const retryRequestData = {
            route_id: routeId,
            delivery_id: deliveryId,
            driver_id: user.id,
            completed_at: new Date().toISOString(),
            status: status
            // No location - API should handle this
          };
          
          // Use planned_stop_id if available, otherwise fallback to stop_order
          // Explicitly check for truthy value and ensure it's a string
          if (plannedStopId && typeof plannedStopId === 'string' && plannedStopId.trim() !== '') {
            retryRequestData.planned_stop_id = plannedStopId;
          } else {
            retryRequestData.stop_order = stopOrder;
          }
          
          // Add comments if provided (trim and only include if not empty)
          if (deliveryComments && deliveryComments.trim()) {
            retryRequestData.comments = deliveryComments.trim();
          }
          
          await stopReachedMutation.mutateAsync(retryRequestData);
          
          const statusMessage = status === 'CUSTOMER_UNAVAILABLE' 
            ? `Stop ${stopOrder} marked as Customer Unavailable!`
            : `Stop ${stopOrder} marked as Delivered!`;
          showSuccessToast(statusMessage);
          
          // Mark this stop as reached in local state (include session to make it unique across sessions)
          // Use planned_stop_id as stable identifier, fallback to stop_order for backward compatibility
          const session = selectedSession.toLowerCase();
          const stopIdentifier = plannedStopId || stopOrder;
          const stopKey = `${routeId}-${session}-${stopIdentifier}`;
          setMarkedStops(prev => new Set(prev).add(stopKey));
          
          // Clear comments from localStorage after successful submission
          const commentsKey = getCommentsKey(stop, routeId, stopIndex);
          localStorage.removeItem(commentsKey);
          setDeliveryComments('');
          
          setShowStatusModal(false);
          setSelectedStopForStatus(null);
          setSelectedStopIndex(null);
          
          setTimeout(() => {
            fetchRoutes();
          }, 100);
        } catch (retryError) {
          if (retryError.response?.data?.message) {
            showErrorToast(retryError.response.data.message);
          } else {
            showErrorToast(retryError.message || 'Failed to mark stop as reached');
          }
        }
      } else if (error.response?.data?.message) {
        showErrorToast(error.response.data.message);
      } else {
        showErrorToast(error.message || 'Failed to mark stop as reached');
      }
    }
  };

  // Auto-sync function - syncs queued actions when network is restored
  const handleAutoSync = async () => {
    if (!offlineService.checkOnline()) {
      return;
    }

    const queue = offlineService.getQueuedActions();
    if (queue.length === 0) {
      return;
    }

    setSyncStatus(prev => ({ ...prev, syncInProgress: true }));

    try {
      const result = await offlineService.processSyncQueue(async (action) => {
        if (action.type === 'mark_stop') {
          // Sync mark stop action
          await stopReachedMutation.mutateAsync(action.data);
          return { success: true };
        } else if (action.type === 'update_location') {
          // Sync location update action
          if (action.data.address_id) {
            // Update address location
            const response = await axiosInstance.put(`/delivery-executives/${user.id}/location`, {
              address_id: action.data.address_id,
              latitude: action.data.latitude,
              longitude: action.data.longitude
            });
            return response.data;
          } else if (action.data.geo_location) {
            // Update geo location using mutation
            await updateGeoLocationMutation.mutateAsync(action.data);
            return { success: true };
          }
          return { success: false };
        } else if (action.type === 'start_journey') {
          // Sync start journey action
          const result = await startJourneyMutation.mutateAsync({
            driver_id: action.data.driver_id,
            route_id: action.data.route_id
          });
          // Update active route ID if needed
          const activeRouteId = result.route_id || action.data.route_id;
          if (activeRouteId) {
            setActiveRouteId(activeRouteId);
            localStorage.setItem('activeRouteId', activeRouteId);
          }
          return { success: true, route_id: activeRouteId };
        } else if (action.type === 'end_session') {
          // Sync end session action
          await completeSessionMutation.mutateAsync({
            route_id: action.data.route_id
          });
          // Mark session as completed
          const sessionName = action.data.sessionName || selectedSession;
          setCompletedSessions(prev => new Set(prev).add(sessionName.toLowerCase()));
          // Clear active journey state
          setActiveRouteId(null);
          localStorage.removeItem('activeRouteId');
          return { success: true };
        }
        return { success: false };
      });

      if (result.synced > 0) {
        showSuccessToast(`${result.synced} action(s) synced successfully!`);
        // Refresh routes after sync
        if (offlineService.checkOnline()) {
          setTimeout(() => {
            fetchRoutes();
          }, 500);
        }
      }

      if (result.failed > 0) {
        showErrorToast(`${result.failed} action(s) failed to sync. Will retry later.`);
      }

      // Update sync status
      setSyncStatus(offlineService.getSyncStatus());
    } catch (error) {
      console.error('Error during auto-sync:', error);
      showErrorToast('Error syncing actions. Will retry later.');
    } finally {
      setSyncStatus(prev => ({ ...prev, syncInProgress: false }));
    }
  };

  // Handle ending the journey
  const handleEndJourney = async () => {
    if (!user?.id || !activeRouteId) {
      showErrorToast('No active journey to end.');
      return;
    }
    
    try {
      // Get current location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });
      
      await endJourneyMutation.mutateAsync({
        user_id: user.id,
        route_id: activeRouteId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      
      showSuccessToast('Journey ended successfully!');
      setActiveRouteId(null);
      // Clear from localStorage when journey ends
      localStorage.removeItem('activeRouteId');
      fetchRoutes();
    } catch (error) {
      showErrorToast(error.message || 'Failed to end journey');
    }
  };

  // Handle End Session button click
  const handleEndSessionClick = (sessionName) => {
    // Generate session ID based on session name and current date
    const today = new Date().toISOString().split('T')[0];
    const sessionId = `${sessionName}_${today}_${user?.id || 'unknown'}`;
    
    setEndSessionData({
      sessionName: sessionName,
      sessionId: sessionId
    });
    setShowEndSessionModal(true);
  };

  // Handle End Session submission
  const handleEndSession = async () => {
    // Extract route_id from routes data
    let routeId = '';
    
    // Try to get route_id from routes array
    if (routes?.routes && Array.isArray(routes.routes) && routes.routes.length > 0) {
      routeId = routes.routes[0].route_id || '';
    }
    // Try from data.routes (nested structure)
    else if (routes?.data?.routes && Array.isArray(routes.data.routes) && routes.data.routes.length > 0) {
      routeId = routes.data.routes[0].route_id || '';
    }
    // Try from selected session stops
    else if (routes?.sessions?.[selectedSession]?.stops && routes.sessions[selectedSession].stops.length > 0) {
      const firstStop = routes.sessions[selectedSession].stops.find(stop => stop.route_id || stop.Route_ID);
      routeId = firstStop?.route_id || firstStop?.Route_ID || '';
    }
    // Try from activeRouteId if journey is started
    else if (activeRouteId) {
      routeId = activeRouteId;
    }
    
    if (!routeId) {
      showErrorToast('Route ID not found. Please ensure you have an active route.');
      return;
    }
    
    const sessionData = {
      route_id: routeId,
      sessionName: endSessionData.sessionName || selectedSession
    };
    
    // Check if offline - queue action if offline
    if (!offlineService.checkOnline()) {
      // Queue the end session action
      const actionId = offlineService.queueAction({
        type: 'end_session',
        data: sessionData
      });
      
      if (actionId) {
        // Optimistically mark session as completed (will be confirmed when synced)
        setCompletedSessions(prev => new Set(prev).add(selectedSession.toLowerCase()));
        
        showSuccessToast(`${endSessionData.sessionName.charAt(0).toUpperCase() + endSessionData.sessionName.slice(1)} session completed! (Queued for sync)`);
        setShowEndSessionModal(false);
        setEndSessionData({ sessionName: '', sessionId: '' });
        
        // Clear active journey state when session ends
        setActiveRouteId(null);
        localStorage.removeItem('activeRouteId');
        
        // Update sync status
        setSyncStatus(offlineService.getSyncStatus());
        return;
      } else {
        throw new Error('Failed to queue end session action');
      }
    }
    
    // Online - proceed with normal API call
    try {
      await completeSessionMutation.mutateAsync(sessionData);
      // Mark this session as completed (normalize to lowercase)
      setCompletedSessions(prev => new Set(prev).add(selectedSession.toLowerCase()));
      showSuccessToast(`${endSessionData.sessionName.charAt(0).toUpperCase() + endSessionData.sessionName.slice(1)} session completed successfully!`);
      setShowEndSessionModal(false);
      setEndSessionData({ sessionName: '', sessionId: '' });
      // Clear active journey state when session ends
      setActiveRouteId(null);
      localStorage.removeItem('activeRouteId');
      // Refresh routes after session completion
      fetchRoutes();
    } catch (error) {
      showErrorToast(error.message || 'Failed to complete session');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="pt-16 px-4 py-6">
          <SkeletonDashboard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-x-hidden">
      {/* Navbar - Swiggy Style */}
      <div className="fixed top-0 left-0 w-full h-16 sm:h-18 bg-white border-b border-gray-200 shadow-sm z-40 flex items-center px-4 sm:px-6">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => navigate('/jkhm')}
            className="text-gray-600 hover:text-blue-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
            aria-label="Go back to home"
          >
            <FiArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <MdLocalShipping className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Delivery Executive</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Manage your deliveries</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Offline Indicator */}
          {isOffline && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 border border-orange-300 rounded-full">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm font-medium text-orange-700">Offline</span>
            </div>
          )}
          
          {/* Sync Status Indicator - Only show when syncing */}
          {syncStatus.syncInProgress && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 border border-blue-300 rounded-full">
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-xs sm:text-sm font-medium text-blue-700">Syncing...</span>
            </div>
          )}
          
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">{getDisplayName().charAt(0).toUpperCase()}</span>
            </div>
            <span className="text-sm font-medium text-gray-700">{getDisplayName()}</span>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Logout"
          >
            <FiLogOut size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 sm:pt-18">
        {/* Dashboard Content - Full Width */}
        <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">



          {/* Routes Tab Content */}
          {activeTab === 'routes' && (
            <div className="space-y-6">
              {/* Welcome Header - Standard Style */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2">Today's Deliveries</h2>
                    <p className="text-blue-50 text-sm sm:text-base">Manage your delivery routes efficiently</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    {(() => {
                      const currentSessionRouteId = getRouteIdFromSelectedSession();
                      const isCurrentSessionActive = currentSessionRouteId === activeRouteId;
                      const isSessionCompleted = completedSessions.has(selectedSession.toLowerCase());
                      
                      // If mutation is pending, show loading state regardless of other conditions
                      if (startJourneyMutation.isPending) {
                        return (
                          <button
                            disabled
                            className="px-3 sm:px-5 py-2.5 sm:py-3 bg-white/20 text-white rounded-xl font-semibold flex items-center gap-2 border-2 border-white/30 opacity-75 cursor-not-allowed"
                          >
                            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                            <span className="text-sm sm:text-base">Starting Journey...</span>
                          </button>
                        );
                      }
                      
                      // Show "Journey Started" only if activeRouteId matches current session's route_id
                      if (isCurrentSessionActive && (activeRouteId || routeStatus?.is_journey_started)) {
                        return (
                          <div className="px-3 sm:px-5 py-2.5 sm:py-3 bg-white/20 text-white rounded-xl font-semibold flex items-center gap-2 border-2 border-white/30">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm sm:text-base">Journey Started ({selectedSession})</span>
                          </div>
                        );
                      }
                      
                      // Show "Start Journey" if:
                      // 1. Session is not completed
                      // 2. Current session route doesn't match active route (or no active route)
                      if (!isSessionCompleted && (!isCurrentSessionActive || !activeRouteId)) {
                        return (
                          <button
                            onClick={handleStartJourneyClick}
                            disabled={routesLoading}
                            className="px-3 sm:px-5 py-2.5 sm:py-3 bg-white text-blue-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <FiPlay className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="hidden sm:inline">Start Journey</span>
                            <span className="sm:hidden">Start</span>
                          </button>
                        );
                      }
                      
                      // If session is completed, show completed badge
                      if (isSessionCompleted) {
                        return (
                          <div className="px-3 sm:px-5 py-2.5 sm:py-3 bg-green-500/20 text-white rounded-xl font-semibold flex items-center gap-2 border-2 border-green-300/30">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm sm:text-base">{selectedSession.charAt(0).toUpperCase() + selectedSession.slice(1)} Completed</span>
                          </div>
                        );
                      }
                      
                      return null;
                    })()}
                    {/* Traffic/Reoptimize Button - Show when routes are available */}
                    {hasRoutes && (
                      <button
                        onClick={handleReoptimizeRoute}
                        disabled={reoptimizeRouteMutation.isPending}
                        className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center gap-2 border border-white/30"
                        title="Reoptimize route (for wrong way, traffic blocks, etc.)"
                      >
                        {reoptimizeRouteMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                            <span className="hidden sm:inline">Reoptimizing...</span>
                            <span className="sm:hidden">Optimizing...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="hidden sm:inline">Reoptimize Route</span>
                            <span className="sm:hidden">Reoptimize</span>
                          </>
                        )}
                      </button>
                    )}
                    {/* Refresh Button */}
                    <button
                      onClick={fetchRoutes}
                      disabled={routesLoading}
                      className="p-2.5 sm:p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center flex-shrink-0"
                      title="Refresh routes"
                    >
                      {routesLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                    </button>
                  </div>
                    </div>
                  </div>
              
              {/* Traffic Alert - Heavy Traffic Detected */}
              {showTrafficAlert && trafficData?.heavy_traffic_detected && (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-red-800 text-base">
                        ⚠️ Heavy Traffic Detected
                        {trafficData.max_traffic_multiplier && (
                          <span className="ml-2">({trafficData.max_traffic_multiplier.toFixed(1)}x)</span>
                        )}
                      </div>
                      <div className="text-red-700 text-sm mt-1">
                        {trafficData.reoptimized 
                          ? 'Route has been automatically reoptimized to avoid traffic.'
                          : 'Checking route for optimization...'
                        }
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTrafficAlert(false)}
                    className="text-red-600 hover:text-red-800 p-2"
                    title="Dismiss"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Reoptimization Success Notification */}
              {showReoptimizationSuccess && trafficData?.reoptimized && trafficData?.reoptimization_result && (
                <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-bold text-green-800 text-base">✅ Route Optimized!</div>
                      <div className="text-green-700 text-sm mt-1">
                        Saved {trafficData.reoptimization_result.time_saved_minutes || 0} minutes
                        {trafficData.reoptimization_result.distance_saved_km > 0 && (
                          <span> and {trafficData.reoptimization_result.distance_saved_km.toFixed(1)} km</span>
                        )}
                        {trafficData.updated_route_order && (
                          <span>. New route order available.</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowReoptimizationSuccess(false)}
                    className="text-green-600 hover:text-green-800 p-2"
                    title="Dismiss"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Traffic Check Status Indicator */}
              {activeRouteId && lastTrafficCheck && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-blue-700 text-sm">
                      Last checked: {(() => {
                        const minutesAgo = Math.floor((new Date() - lastTrafficCheck) / 60000);
                        if (minutesAgo < 1) return 'Just now';
                        if (minutesAgo === 1) return '1 minute ago';
                        return `${minutesAgo} minutes ago`;
                      })()}
                    </span>
                  </div>
                  {trafficData?.heavy_traffic_detected && !trafficData?.reoptimized && (
                    <span className="text-red-600 text-sm font-semibold">⚠️ Heavy traffic detected</span>
                  )}
                </div>
              )}

              {/* Session Overview Cards - Swiggy Style */}
              {routes.sessions && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {Object.entries(routes.sessions).map(([session, data]) => (
                    <div key={session} className="bg-white rounded-xl p-3 sm:p-4 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{session}</div>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-0.5">
                        {data.stops.filter(stop => stop.Delivery_Name !== 'Return to Hub').length}
                      </div>
                      <div className="text-xs text-gray-600 mb-2">Stops</div>
                      <div className="flex items-center">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {data.stops.reduce((total, stop) => total + (stop.Packages || 0), 0)} packages
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Routes Content */}
              <div className="w-full">
                {/* Today's Routes */}
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
                  
                  {/* Loading State */}
                  {routesLoading && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={`session-${index}`} className="bg-gray-100 rounded-xl p-6 animate-pulse">
                            <div className="h-4 bg-gray-300 rounded w-1/2 mb-3"></div>
                            <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                          </div>
                        ))}
                      </div>
                      {Array.from({ length: 2 }).map((_, index) => (
                        <div key={`route-${index}`} className="bg-gray-100 rounded-xl p-6 animate-pulse">
                          <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
                          <div className="h-20 bg-gray-300 rounded"></div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error State */}
                  {routesError && (
                    <div className="text-center py-12 bg-red-50 rounded-xl border border-red-200">
                      <div className="text-red-500 text-5xl mb-4">⚠️</div>
                      <p className="text-red-700 font-medium mb-4">{routesError}</p>
                      <button
                        onClick={fetchRoutes}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-md"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  {/* Routes List */}
                  {!routesLoading && !routesError && (
                    <div className="space-y-6">
                      {(!routes.sessions || Object.keys(routes.sessions).length === 0) ? (
                        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                          <div className="text-6xl mb-4">📋</div>
                          <p className="text-gray-700 font-semibold text-lg mb-2">No routes found</p>
                          <p className="text-gray-500">No delivery routes assigned for today</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Session Tabs - Swiggy Style */}
                          <div className="flex gap-2 bg-gray-100 rounded-xl p-1.5">
                            {Object.keys(routes.sessions || {}).map((session) => {
                              const sessionRouteId = routes.sessions[session]?.route_id || 
                                routes.sessions[session]?.stops?.[0]?.route_id || 
                                routes.sessions[session]?.stops?.[0]?.Route_ID || '';
                              const isSessionCompleted = completedSessions.has(session.toLowerCase());
                              const isActiveRoute = sessionRouteId === activeRouteId;
                              
                              return (
                                <button
                                  key={session}
                                  onClick={() => setSelectedSession(session)}
                                  className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all relative ${
                                    selectedSession === session
                                      ? 'bg-white text-blue-600 shadow-md'
                                      : 'text-gray-600 hover:text-gray-900'
                                  }`}
                                  title={
                                    isSessionCompleted 
                                      ? `${session.charAt(0).toUpperCase() + session.slice(1)} - Completed`
                                      : isActiveRoute
                                      ? `${session.charAt(0).toUpperCase() + session.slice(1)} - Journey Active`
                                      : `${session.charAt(0).toUpperCase() + session.slice(1)} - Click to view`
                                  }
                                >
                                  {session.charAt(0).toUpperCase() + session.slice(1)}
                                  {isSessionCompleted && (
                                    <span className="ml-1 text-green-600">✓</span>
                                  )}
                                  {!isSessionCompleted && isActiveRoute && (
                                    <span className="ml-1 text-blue-600">●</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Selected Session Details */}
                          {routes.sessions && routes.sessions[selectedSession] && (
                            <div className="space-y-6">
                              {/* Session Header - Swiggy Style */}
                              <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                                  <div>
                                    <h4 className="text-xl font-bold text-gray-900 capitalize mb-1">
                                      {selectedSession} Route
                                    </h4>
                                    <div className="flex items-center gap-3">
                                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                        {routes.sessions[selectedSession].stops.length} Stops
                                      </span>
                                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                        {routes.sessions[selectedSession].stops.reduce((total, stop) => total + (stop.Packages || 0), 0)} Packages
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Route Overview Maps - Swiggy Style */}
                                {(routes.sessions[selectedSession].map_link || routes.sessions[selectedSession].route_map_link || routes.sessions[selectedSession].map_view_link) && (
                                  <div className="flex flex-col sm:flex-row gap-3">
                                    {/* Full Route Map Link */}
                                    {(routes.sessions[selectedSession].route_map_link || routes.sessions[selectedSession].map_link) && (
                                      <a
                                        href={routes.sessions[selectedSession].route_map_link || routes.sessions[selectedSession].map_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-semibold"
                                        title="Full route with all stops as waypoints"
                                      >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                        </svg>
                                        Full Route Directions
                                      </a>
                                    )}
                                    
                                    {/* Map View Link */}
                                    {routes.sessions[selectedSession].map_view_link && (
                                      <a
                                        href={routes.sessions[selectedSession].map_view_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-semibold"
                                        title="Overview map showing all stops"
                                      >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        View Overview Map
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Stops List - Swiggy Style */}
                              <div className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-lg font-bold text-gray-900">Delivery Stops</h5>
                                  {stopsWithDeliveryNotes.filter(stop => stop.Delivery_Name !== 'Return to Hub').length > 2 && (
                                    <button
                                      onClick={() => setShowAllStops(!showAllStops)}
                                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 text-sm font-semibold rounded-lg transition-colors"
                                    >
                                      {showAllStops ? 'Show Less' : `Show All (${stopsWithDeliveryNotes.filter(stop => stop.Delivery_Name !== 'Return to Hub').length})`}
                                    </button>
                                  )}
                                </div>
                                
                                {(showAllStops ? stopsWithDeliveryNotes.filter(stop => stop.Delivery_Name !== 'Return to Hub') : stopsWithDeliveryNotes.filter(stop => stop.Delivery_Name !== 'Return to Hub').slice(0, 2)).map((stop, index) => (
                                  <div key={index} className="bg-white rounded-xl p-5 shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                                    <div className="flex items-start justify-between mb-2 gap-3">
                                      <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0 shadow-md">
                                          {stop.Stop_No}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <h6 className="text-gray-900 font-bold text-base mb-1 truncate">
                                            {stop.Delivery_Name || 'Unknown Delivery'}
                                          </h6>
                                          <p className="text-gray-600 text-sm truncate flex items-center gap-1">
                                            <FiMapPin className="w-4 h-4 text-gray-400" />
                                            {stop.Location || 'Location not specified'}
                                          </p>
                                        </div>
                                      </div>
                                      {stop.Packages && (
                                        <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-bold rounded-full flex-shrink-0">
                                          {stop.Packages} pkg
                                        </span>
                                      )}
                                    </div>

                                    {/* Delivery Note - Prominent Display */}
                                    {stop.delivery_note && (
                                      <div className="mb-3 py-2 px-2.5 sm:px-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300 rounded-lg shadow-sm -mt-1">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                              </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-yellow-900 font-semibold text-xs sm:text-sm mb-0.5">Delivery Note</p>
                                              <p className="text-yellow-800 text-xs sm:text-sm line-clamp-1">{stop.delivery_note}</p>
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => {
                                              setSelectedDeliveryNote(stop.delivery_note);
                                              setSelectedStopForNote(stop);
                                              setShowDeliveryNoteModal(true);
                                            }}
                                            className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors flex-shrink-0 shadow-sm hover:shadow-md whitespace-nowrap"
                                            title="View full delivery note"
                                          >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            <span className="hidden sm:inline">View</span>
                                          </button>
                                        </div>
                                      </div>
                                    )}


                                    {/* Action Buttons - Swiggy Style */}
                                    <div className="mt-4">
                                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                                        {/* Map Button - use Directions API with destination=lat,lng so each stop opens correct location */}
                                        {(stop.Map_Link || (stop.Latitude != null && stop.Longitude != null)) && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const lat = stop.latitude ?? stop.Latitude;
                                              const lng = stop.longitude ?? stop.Longitude;
                                              const stopOrder = stop.stop_order ?? stop.Stop_No ?? index + 1;

                                              if (lat != null && lng != null && (lat !== 0 || lng !== 0)) {
                                                const navigationUrl =
                                                  `https://www.google.com/maps/dir/?api=1` +
                                                  `&destination=${lat},${lng}` +
                                                  `&travelmode=driving` +
                                                  `&stop=${stopOrder}` +
                                                  `&t=${Date.now()}`;
                                                window.open(navigationUrl, '_blank', 'noopener,noreferrer');
                                              } else if (stop.Map_Link) {
                                                const base = stop.Map_Link;
                                                const sep = base.includes('?') ? '&' : '?';
                                                const uniqueUrl = `${base}${sep}stop=${encodeURIComponent(stopOrder)}&t=${Date.now()}`;
                                                window.open(uniqueUrl, '_blank', 'noopener,noreferrer');
                                              }
                                            }}
                                            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg sm:rounded-xl font-semibold shadow-md hover:shadow-lg transition-all text-xs sm:text-sm"
                                            title="Opens Google Maps with directions to this stop"
                                          >
                                            <FiMapPin className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                                            <span className="truncate">Map</span>
                                          </button>
                                        )}
                                        
                                        {/* Mark as Reached Button */}
                                        {(() => {
                                          const stopOrder = stop.Stop_No || stop.stop_order || index + 1;
                                          const routeId = activeRouteId || stop.route_id || stop.Route_ID || '';
                                          // Include session in stopKey to prevent conflicts across sessions
                                          const session = selectedSession.toLowerCase();
                                          // Use planned_stop_id as stable identifier, fallback to stop_order for backward compatibility
                                          const stopIdentifier = stop.planned_stop_id || stop.Planned_Stop_ID || stop._original?.planned_stop_id || stop._original?.Planned_Stop_ID || stopOrder;
                                          const stopKey = `${routeId}-${session}-${stopIdentifier}`;
                                          const isMarked = markedStops.has(stopKey);
                                          
                                          return (
                                            <button
                                              onClick={() => handleOpenStatusModal(stop, index)}
                                              disabled={stopReachedMutation.isPending || isMarked}
                                              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:cursor-not-allowed text-xs sm:text-sm ${
                                                isMarked
                                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                                  : stopReachedMutation.isPending
                                                  ? 'bg-gray-300 text-white'
                                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                                              }`}
                                            >
                                              {stopReachedMutation.isPending ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                              ) : isMarked ? (
                                                <>
                                                  <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                  </svg>
                                                  <span className="truncate">Marked</span>
                                                </>
                                              ) : (
                                                <>
                                                  <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                  </svg>
                                                  <span className="truncate">Mark</span>
                                                </>
                                              )}
                                            </button>
                                          );
                                        })()}
                                        
                                        {/* Photo Button */}
                                        {deliveryStatus[index]?.status !== 'Delivered' && (() => {
                                          // Get address_id from stop
                                          const stopAddressId = 
                                            (stop?.address_id && stop.address_id !== '') ? stop.address_id :
                                            (stop?.Address_ID && stop.Address_ID !== '') ? stop.Address_ID :
                                            (stop?.addressId && stop.addressId !== '') ? stop.addressId :
                                            (stop?._original?.address_id && stop._original.address_id !== '') ? stop._original.address_id :
                                            (stop?._original?.Address_ID && stop._original.Address_ID !== '') ? stop._original.Address_ID :
                                            (stop?._original?.addressId && stop._original.addressId !== '') ? stop._original.addressId :
                                            null;
                                          
                                          const photoUploaded = stopAddressId ? isPhotoUploaded(stopAddressId, selectedSession) : false;
                                          
                                          return (
                                            <button
                                              onClick={() => {
                                                if (!photoUploaded) {
                                                  setUploadingImage(uploadingImage === index ? null : index);
                                                }
                                              }}
                                              disabled={photoUploaded}
                                              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold shadow-md hover:shadow-lg transition-all text-xs sm:text-sm ${
                                                photoUploaded
                                                  ? 'bg-green-600 hover:bg-green-700 text-white cursor-default'
                                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                                              }`}
                                              title={photoUploaded ? 'Photo already uploaded' : 'Upload delivery photo'}
                                            >
                                              {photoUploaded ? (
                                                <>
                                                  <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                  </svg>
                                                  <span className="truncate">Uploaded</span>
                                                </>
                                              ) : (
                                                <>
                                                  <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                  </svg>
                                                  <span className="truncate">Photo</span>
                                                </>
                                              )}
                                            </button>
                                          );
                                        })()}
                                        
                                        {/* Location/Update Address Button */}
                                        {(() => {
                                          // Get address_id from stop
                                          const stopAddressId = 
                                            (stop?.address_id && stop.address_id !== '') ? stop.address_id :
                                            (stop?.Address_ID && stop.Address_ID !== '') ? stop.Address_ID :
                                            (stop?.addressId && stop.addressId !== '') ? stop.addressId :
                                            (stop?._original?.address_id && stop._original.address_id !== '') ? stop._original.address_id :
                                            (stop?._original?.Address_ID && stop._original.Address_ID !== '') ? stop._original.Address_ID :
                                            (stop?._original?.addressId && stop._original.addressId !== '') ? stop._original.addressId :
                                            null;
                                          
                                          const locationUpdated = stopAddressId ? isLocationUpdated(stopAddressId, selectedSession) : updatedLocationStops.has(index);
                                          
                                          return (
                                            <button
                                              onClick={() => {
                                                if (completingDelivery === index) {
                                                  // Close if already open
                                                  setCompletingDelivery(null);
                                                  clearCompletionLocation();
                                                } else {
                                                  // Open and auto-get location
                                                  setCompletingDelivery(index);
                                                  setLocationUpdated(false); // Reset update status when opening
                                                  // Auto-get location when opening
                                                  setTimeout(() => {
                                                    getCompletionLocation();
                                                  }, 100);
                                                }
                                              }}
                                              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold shadow-md hover:shadow-lg transition-all text-xs sm:text-sm ${
                                                locationUpdated
                                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                                  : 'bg-purple-600 hover:bg-purple-700 text-white'
                                              }`}
                                              title={locationUpdated ? 'Location already updated' : 'Update delivery location'}
                                            >
                                              <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                              </svg>
                                              <span className="truncate">{locationUpdated ? 'Located' : 'Location'}</span>
                                            </button>
                                          );
                                        })()}
                                      </div>
                                    </div>

                                    {/* Delivery Status Display - Swiggy Style */}
                                    {(deliveryStatus[index] || loadingStatus[index]) && (
                                      <div className={`mt-4 p-4 rounded-xl border-2 ${
                                        loadingStatus[index] 
                                          ? 'bg-gray-50 border-gray-200'
                                          : deliveryStatus[index].status === 'Delivered' 
                                          ? 'bg-green-50 border-green-300' 
                                          : deliveryStatus[index].status === 'Pending'
                                          ? 'bg-yellow-50 border-yellow-300'
                                          : deliveryStatus[index].status === 'Confirmed'
                                          ? 'bg-blue-50 border-blue-300'
                                          : deliveryStatus[index].status === 'Cancelled'
                                          ? 'bg-red-50 border-red-300'
                                          : 'bg-gray-50 border-gray-200'
                                      }`}>
                                        <div className="flex items-center gap-3">
                                          {loadingStatus[index] ? (
                                            <>
                                              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                                              <div>
                                                <div className="text-gray-700 font-semibold text-sm">Loading Status...</div>
                                                <div className="text-gray-500 text-xs">Fetching delivery information</div>
                                              </div>
                                            </>
                                          ) : (
                                            <>
                                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                                deliveryStatus[index].status === 'Delivered' 
                                                  ? 'bg-green-500' 
                                                  : deliveryStatus[index].status === 'Pending'
                                                  ? 'bg-yellow-500'
                                                  : deliveryStatus[index].status === 'Confirmed'
                                                  ? 'bg-blue-500'
                                                  : deliveryStatus[index].status === 'Cancelled'
                                                  ? 'bg-red-500'
                                                  : 'bg-gray-500'
                                              }`}>
                                                {deliveryStatus[index].status === 'Delivered' ? (
                                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                  </svg>
                                                ) : deliveryStatus[index].status === 'Pending' ? (
                                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                  </svg>
                                                ) : deliveryStatus[index].status === 'Confirmed' ? (
                                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                  </svg>
                                                ) : deliveryStatus[index].status === 'Cancelled' ? (
                                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                  </svg>
                                                ) : null}
                                              </div>
                                              <div>
                                                <div className={`font-bold text-base ${
                                                  deliveryStatus[index].status === 'Delivered' 
                                                    ? 'text-green-700' 
                                                    : deliveryStatus[index].status === 'Pending'
                                                    ? 'text-yellow-700'
                                                    : deliveryStatus[index].status === 'Confirmed'
                                                    ? 'text-blue-700'
                                                    : deliveryStatus[index].status === 'Cancelled'
                                                    ? 'text-red-700'
                                                    : 'text-gray-700'
                                                }`}>
                                                  {deliveryStatus[index].status === 'Delivered' ? '✅ Delivered' :
                                                   deliveryStatus[index].status === 'Pending' ? '⏳ Pending' :
                                                   deliveryStatus[index].status === 'Confirmed' ? '✅ Confirmed' :
                                                   deliveryStatus[index].status === 'Cancelled' ? '❌ Cancelled' :
                                                   deliveryStatus[index].status}
                                                </div>
                                                <div className="text-gray-600 text-xs mt-1">
                                                  Updated: {new Date(deliveryStatus[index].updatedAt).toLocaleString()}
                                                </div>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {/* Action UI - Compact Style */}
                                    {(completingDelivery === index || uploadingImage === index) && (
                                      <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                                        {/* Delivery Completion UI */}
                                        {completingDelivery === index && (
                                          <>
                                            {/* Loading State */}
                                            {completionLocationLoading && (
                                              <div className="flex items-center justify-center gap-2 py-3">
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                                                <span className="text-gray-600 text-xs">Detecting location...</span>
                                              </div>
                                            )}

                                            {/* Error Display */}
                                            {completionLocationError && (
                                              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                  </svg>
                                                  <p className="text-red-600 text-xs">{completionLocationError}</p>
                                                </div>
                                              </div>
                                            )}

                                            {/* Action Buttons Row */}
                                            <div className="flex items-center gap-2">
                                              {/* Clear Button - Show when location is captured */}
                                              {completionLocation && !completionLocationError && (
                                                <button 
                                                  onClick={clearCompletionLocation}
                                                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5"
                                                >
                                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                  </svg>
                                                  Clear
                                                </button>
                                              )}

                                              {/* Update Location Button - Show when location is captured but not updated yet */}
                                              {completionLocation && !completionLocationError && !locationUpdated && (
                                                <button
                                                  onClick={() => handleCompleteDelivery(index)}
                                                  disabled={!completionLocation || completionLoading}
                                                  className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                                                    completionLocation && !completionLoading
                                                      ? 'bg-green-500 hover:bg-green-600 text-white shadow-sm'
                                                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                  }`}
                                                >
                                                  {completionLoading ? (
                                                    <>
                                                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                                      <span>Updating...</span>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                      </svg>
                                                      <span>Update Location</span>
                                                    </>
                                                  )}
                                                </button>
                                              )}
                                            </div>
                                          </>
                                        )}

                                        {/* Image/Video Upload UI */}
                                        {uploadingImage === index && (
                                          <>
                                            <h6 className="text-gray-900 font-bold mb-4 flex items-center gap-2 text-base">
                                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                              </svg>
                                              Upload Delivery Photos/Videos
                                            </h6>
                                            
                                            <div className="space-y-4">
                                              {/* File Input */}
                                              <div className="bg-white rounded-xl p-4 border-2 border-dashed border-gray-300">
                                                <label className="block cursor-pointer">
                                                  <input
                                                    type="file"
                                                    accept="image/*,video/*"
                                                    multiple
                                                    onChange={handleFileSelect}
                                                    className="hidden"
                                                    id={`image-upload-${index}`}
                                                  />
                                                  <div className="flex flex-col items-center justify-center py-6">
                                                    <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                    <p className="text-gray-700 font-semibold text-sm mb-1">
                                                      {selectedFiles.length > 0 ? `Add More Files (${selectedFiles.length} selected)` : 'Select Images/Videos'}
                                                    </p>
                                                    <p className="text-gray-500 text-xs">Images: Max 10MB | Videos: Max 50MB</p>
                                                  </div>
                                                </label>
                                              </div>

                                              {/* Files Preview */}
                                              {selectedFiles.length > 0 && (
                                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                                  <div className="flex items-center justify-between mb-3">
                                                    <span className="text-gray-700 font-semibold text-sm">
                                                      Selected Files ({selectedFiles.length}):
                                                    </span>
                                                    <button
                                                      onClick={clearImageUpload}
                                                      className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1"
                                                    >
                                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                      </svg>
                                                      Clear All
                                                    </button>
                                                  </div>
                                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {selectedFiles.map((file, fileIndex) => {
                                                      const preview = filePreviews[fileIndex];
                                                      const isVideo = file.type.startsWith('video/');
                                                      return (
                                                        <div key={fileIndex} className="relative group">
                                                          <div className="relative rounded-lg border border-gray-200 overflow-hidden bg-gray-100">
                                                            {preview ? (
                                                              isVideo ? (
                                                                <video
                                                                  src={preview.url}
                                                                  className="w-full h-24 object-cover"
                                                                  controls={false}
                                                                />
                                                              ) : (
                                                                <img
                                                                  src={preview.url}
                                                                  alt={file.name}
                                                                  className="w-full h-24 object-cover"
                                                                />
                                                              )
                                                            ) : (
                                                              <div className="w-full h-24 flex items-center justify-center">
                                                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                              </div>
                                                            )}
                                                            <button
                                                              onClick={() => removeFile(fileIndex)}
                                                              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                              title="Remove file"
                                                            >
                                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                              </svg>
                                                            </button>
                                                          </div>
                                                          <p className="text-xs text-gray-600 mt-1 truncate" title={file.name}>
                                                            {file.name}
                                                          </p>
                                                          <p className="text-xs text-gray-400">
                                                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                                                          </p>
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              )}

                                              {/* Error Display */}
                                              {imageUploadError && (
                                                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3">
                                                  <p className="text-red-700 text-sm font-medium">{imageUploadError}</p>
                                                </div>
                                              )}

                                              {/* Upload Button */}
                                              <div className="pt-2">
                                                <button
                                                  onClick={() => handleImageUpload(index)}
                                                  disabled={selectedFiles.length === 0 || uploadDeliveryPhotoMutation.isPending}
                                                  className={`w-full px-5 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${
                                                    selectedFiles.length > 0 && !uploadDeliveryPhotoMutation.isPending
                                                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                  }`}
                                                >
                                                  {uploadDeliveryPhotoMutation.isPending ? (
                                                    <>
                                                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                      Uploading {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}...
                                                    </>
                                                  ) : (
                                                    <>
                                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                      </svg>
                                                      Upload {selectedFiles.length > 0 ? `${selectedFiles.length} ` : ''}File{selectedFiles.length !== 1 ? 's' : ''}
                                                    </>
                                                  )}
                                                </button>
                                              </div>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Fixed Return to Hub Component - Standard Style */}
                              <div className="mt-6 p-5 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl shadow-md">
                                {/* End Session Button - Moved to top */}
                                <div className="mb-4">
                                  {completedSessions.has(selectedSession.toLowerCase()) ? (
                                    <button
                                      disabled
                                      className="w-full px-4 py-3 bg-green-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2 font-semibold shadow-md cursor-not-allowed"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Session Completed
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleEndSessionClick(selectedSession)}
                                      disabled={completeSessionMutation.isPending}
                                      className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white rounded-xl transition-colors flex items-center justify-center gap-2 font-semibold shadow-md"
                                    >
                                      {completeSessionMutation.isPending ? (
                                        <>
                                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                          Completing...
                                        </>
                                      ) : (
                                        <>
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                          </svg>
                                          End Session
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                                
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-md">
                                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                      </svg>
                                    </div>
                                    <div>
                                      <span className="text-gray-900 font-bold text-base block">Return to Hub</span>
                                      <span className="text-gray-600 text-xs">End of Route</span>
                                    </div>
                                  </div>
                                </div>
                                <a
                                  href='https://maps.app.goo.gl/Lb39YMjpLvxpHRPS9'
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
                                  title="Opens Google Maps with directions back to hub"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  Get Return Directions
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal - Swiggy Style */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FiLogOut className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Confirm Logout</h3>
                <p className="text-gray-600 text-sm">Are you sure you want to logout?</p>
              </div>
            </div>
            
            <p className="text-gray-700 text-sm mb-6 pl-16">
              You will be redirected to the home page and all your session data will be cleared.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Journey Confirmation Modal - Swiggy Style */}
      {showStartJourneyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FiPlay className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Start Journey</h3>
                <p className="text-gray-600 text-sm">Ready to start your delivery journey?</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-700 font-semibold text-sm mb-2">Route ID</label>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-gray-900 font-mono text-sm">{startJourneyData.route_id || 'No route assigned'}</p>
                </div>
                <p className="text-gray-500 text-xs mt-2">Auto-filled from your assigned routes</p>
              </div>
              
              <div>
                <label className="block text-gray-700 font-semibold text-sm mb-2">Driver ID *</label>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-gray-900 font-mono text-sm">{startJourneyData.driver_id || user?.id || 'N/A'}</p>
                </div>
                <p className="text-gray-500 text-xs mt-2">Auto-filled from your account</p>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowStartJourneyModal(false);
                  setCurrentLocation(null);
                }}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartJourney}
                disabled={startJourneyMutation.isPending || !startJourneyData.driver_id}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {startJourneyMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Starting...
                  </>
                ) : (
                  <>
                    <FiPlay className="w-5 h-5" />
                    Start Journey
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Status Selection Modal - Swiggy Style */}
      {showStatusModal && selectedStopForStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Mark Stop</h3>
                <p className="text-gray-600 text-sm">Select delivery status</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 text-sm mb-4">
                Stop: <span className="font-bold text-gray-900">{selectedStopForStatus.Delivery_Name || 'Unknown'}</span>
              </p>
              
              {/* Location fetching indicator */}
              {gettingLocation && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <p className="text-blue-700 text-xs font-medium">Getting your current location...</p>
                </div>
              )}
              
              <div className="space-y-3">
                <label className="block text-gray-700 font-semibold text-sm mb-2">Delivery Status *</label>
                <select
                  value={selectedStopStatus}
                  onChange={(e) => setSelectedStopStatus(e.target.value)}
                  disabled={gettingLocation || stopReachedMutation.isPending}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="Delivered">Delivered</option>
                  <option value="CUSTOMER_UNAVAILABLE">Customer Unavailable</option>
                </select>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                  <p className="text-blue-700 text-xs">
                    {selectedStopStatus === 'Delivered' 
                      ? '✅ Package successfully delivered to customer'
                      : '⚠️ Customer was not available at the delivery location'}
                  </p>
                </div>
              </div>
              
              {/* Comments Section */}
              <div className="mt-4">
                <label className="block text-gray-700 font-semibold text-sm mb-2">
                  Comments (Optional)
                  <span className={`ml-2 text-xs font-normal ${deliveryComments.length > MAX_COMMENTS_LENGTH * 0.9 ? 'text-orange-500' : 'text-gray-500'}`}>
                    {deliveryComments.length}/{MAX_COMMENTS_LENGTH}
                  </span>
                </label>
                <textarea
                  value={deliveryComments}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= MAX_COMMENTS_LENGTH) {
                      setDeliveryComments(value);
                      // Save to localStorage as user types (debounced)
                      const routeId = activeRouteId;
                      const commentsKey = getCommentsKey(selectedStopForStatus, routeId, selectedStopIndex);
                      // Use setTimeout for debouncing
                      clearTimeout(window.commentsSaveTimeout);
                      window.commentsSaveTimeout = setTimeout(() => {
                        saveCommentsToLocalStorage(commentsKey, value);
                      }, 500);
                    }
                  }}
                  placeholder="Add any notes about this delivery (e.g., 'Customer requested early delivery', 'Left at door', etc.)"
                  rows={4}
                  maxLength={MAX_COMMENTS_LENGTH}
                  disabled={gettingLocation || stopReachedMutation.isPending}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-vertical"
                />
                {deliveryComments.length > MAX_COMMENTS_LENGTH * 0.9 && (
                  <p className="text-orange-500 text-xs mt-1">
                    {MAX_COMMENTS_LENGTH - deliveryComments.length} characters remaining
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedStopForStatus(null);
                  setSelectedStopIndex(null);
                  setSelectedStopStatus('Delivered');
                  setGettingLocation(false);
                  // Don't clear comments - keep them for next time user opens modal
                }}
                disabled={stopReachedMutation.isPending}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStopReached(selectedStopForStatus, selectedStopIndex, selectedStopStatus)}
                disabled={stopReachedMutation.isPending || gettingLocation}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {(stopReachedMutation.isPending || gettingLocation) ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    {gettingLocation ? 'Getting location...' : 'Marking...'}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mark Stop
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Note Modal - Swiggy Style */}
      {showDeliveryNoteModal && selectedDeliveryNote && selectedStopForNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Delivery Note</h3>
                <p className="text-gray-600 text-sm">{selectedStopForNote.Delivery_Name || 'Unknown Delivery'}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-yellow-800 font-semibold text-sm mb-2">Special Instructions:</p>
                    <p className="text-yellow-900 text-base leading-relaxed whitespace-pre-wrap">{selectedDeliveryNote}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeliveryNoteModal(false);
                  setSelectedDeliveryNote(null);
                  setSelectedStopForNote(null);
                }}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Session Confirmation Modal - Swiggy Style */}
      {showEndSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">End {endSessionData.sessionName.charAt(0).toUpperCase() + endSessionData.sessionName.slice(1)} Session</h3>
                <p className="text-gray-600 text-sm">Are you sure you want to end this session?</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 text-sm mb-3">
                This will mark the <span className="font-bold text-gray-900 capitalize">{endSessionData.sessionName}</span> session as completed.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600 font-medium">Session:</span>
                  <span className="text-gray-900 capitalize font-bold">{endSessionData.sessionName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium">End Time:</span>
                  <span className="text-gray-900 font-mono font-semibold">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
              <p className="text-amber-600 text-xs mt-3 font-semibold bg-amber-50 p-2 rounded-lg">
                ⚠️ This action will trigger reinforcement learning and cannot be undone.
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowEndSessionModal(false);
                  setEndSessionData({ sessionName: '', sessionId: '' });
                }}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEndSession}
                disabled={completeSessionMutation.isPending}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {completeSessionMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Completing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    End Session
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryExecutivePage;
