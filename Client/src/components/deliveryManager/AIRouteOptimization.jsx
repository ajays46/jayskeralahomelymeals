import React, { useState, useEffect } from 'react';
import { 
  FiMap, 
  FiNavigation, 
  FiPackage,
  FiBarChart2,
  FiAlertCircle,
  FiFileText
} from 'react-icons/fi';
import { showSuccessToast, showErrorToast, showWarningToast } from '../../utils/toastConfig.jsx';
import RoutePlanningTab from './aiRoutes/RoutePlanningTab';
import DraftPlanSession from './aiRoutes/DraftPlanSession';
import ReassignDriverTab from './aiRoutes/ReassignDriverTab';
import TrackingTab from './aiRoutes/TrackingTab';
import AnalyticsTab from './aiRoutes/AnalyticsTab';
import APIHealthStatus from './aiRoutes/APIHealthStatus';
import { StartJourneyModal, StopJourneyModal } from './aiRoutes/JourneyModals';
import {
  useAIRouteHealth,
  usePlanRoute,
  useSavePlanToS3,
  useReassignDriver,
  useMoveStop,
  usePredictStartTime,
  useStartJourney,
  useEndJourney,
  useTrackingStatus,
  useVehicleTracking
} from '../../hooks/deliverymanager/useAIRouteOptimization';

/**
 * AI Route Optimization Component
 * Main container component that orchestrates all route optimization features
 * Approve = save planned routes to S3 (Excel + TXT) and open download links.
 */
const AIRouteOptimization = ({ showSuccessToast, showErrorToast }) => {
  // Main state
  const [activeTab, setActiveTab] = useState('planning'); // 'planning', 'deliveries', 'tracking', 'analytics'
  const [componentError, setComponentError] = useState(null);
  
  // Route Planning State
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [deliverySession, setDeliverySession] = useState('lunch');
  const [numDrivers, setNumDrivers] = useState(null); // null = auto-select
  const [depotLocation, setDepotLocation] = useState({
    lat: 10.0352754,
    lng: 76.4100184
  });
  const [routePlan, setRoutePlan] = useState(null);
  const [routeComparison, setRouteComparison] = useState(null);
  const [predictedStartTime, setPredictedStartTime] = useState(null);
  // All stored drafts keyed by `${delivery_date}_${delivery_session}` for Meal Type filter in Draft Plan tab
  const [draftPlans, setDraftPlans] = useState({});
  
  // Tracking State
  const [startJourneyData, setStartJourneyData] = useState({
    route_id: '',
    driver_id: ''
  });
  const [showStartJourneyModal, setShowStartJourneyModal] = useState(false);
  const [showStopJourneyModal, setShowStopJourneyModal] = useState(false);
  const [selectedRouteForStop, setSelectedRouteForStop] = useState(null);
  
  // React Query Hooks
  const { data: apiHealth, refetch: refetchHealth } = useAIRouteHealth({
    refetchInterval: 60000, // Refetch every minute
    enabled: true
  });
  
  const planRouteMutation = usePlanRoute();
  const savePlanToS3Mutation = useSavePlanToS3();
  const reassignDriverMutation = useReassignDriver();
  const moveStopMutation = useMoveStop();
  const predictStartTimeMutation = usePredictStartTime();
  const startJourneyMutation = useStartJourney();
  const endJourneyMutation = useEndJourney();
  const vehicleTrackingMutation = useVehicleTracking();
  
  // Generate localStorage key based on date and session
  const getStorageKey = (type) => {
    return `aiRoute_${type}_${deliveryDate}_${deliverySession}`;
  };
  
  // Handle Plan Route
  const handlePlanRoute = async () => {
    if (!deliveryDate || !deliverySession) {
      showErrorToast('Please select delivery date and session');
      return;
    }
    
    try {
      const result = await planRouteMutation.mutateAsync({
        delivery_date: deliveryDate,
        delivery_session: deliverySession,
        num_drivers: numDrivers,
        depot_location: depotLocation
      });
      
      setRoutePlan(result);
      setRouteComparison(result.route_comparison);
      const draftKey = `${result.delivery_date}_${result.delivery_session}`;
      setDraftPlans((prev) => ({ ...prev, [draftKey]: { plan: result, comparison: result.route_comparison } }));

      // Save to localStorage - save both routePlan and routeComparison
      try {
        const storageKey = getStorageKey('routePlan');
        const storageKeyComparison = getStorageKey('routeComparison');
        
        // Save the full result (which includes route_comparison)
        localStorage.setItem(storageKey, JSON.stringify(result));
        
        // Also save routeComparison separately for easier retrieval
        if (result.route_comparison) {
          localStorage.setItem(storageKeyComparison, JSON.stringify(result.route_comparison));
        }
      } catch (error) {
        console.error('Error saving route plan to localStorage:', error);
      }

      // Show success message (draft is stored only in Draft Plan tab, not in Route & Management)
      const successMessage = `Route planned successfully! ${result.num_drivers || 0} driver(s) assigned. View in Draft Plan tab.`;
      showSuccessToast(successMessage);
      
      // Show warnings if they exist (even on success)
      if (result.warnings && Array.isArray(result.warnings) && result.warnings.length > 0) {
        const warningsText = result.warnings.join('; ');
        showWarningToast(warningsText, 'Route Planning Warnings');
      }
    } catch (error) {
      // Build error message
      let errorMessage = error.message || 'Route planning failed';
      
      // Check if error has warnings from the API response
      let warnings = null;
      if (error.warnings && Array.isArray(error.warnings) && error.warnings.length > 0) {
        warnings = error.warnings;
      } else if (error.responseData?.warnings && Array.isArray(error.responseData.warnings) && error.responseData.warnings.length > 0) {
        // Fallback: check responseData for warnings
        warnings = error.responseData.warnings;
      }
      
      // Show error message
      showErrorToast(errorMessage, 'Route Planning Failed');
      
      // Show warnings separately if they exist
      if (warnings && warnings.length > 0) {
        const warningsText = warnings.join('; ');
        showWarningToast(warningsText, 'Route Planning Warnings');
      }
    }
  };
  
  // Helper function to format time for toast messages
  const formatTimeForToast = (timeValue) => {
    if (!timeValue) return 'N/A';
    
    // If it's already a time string (HH:MM:SS), format it
    if (typeof timeValue === 'string' && timeValue.match(/^\d{2}:\d{2}:\d{2}$/)) {
      const [hours, minutes] = timeValue.split(':');
      const hour12 = parseInt(hours) % 12 || 12;
      const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
      return `${hour12}:${minutes} ${ampm}`;
    }
    
    // If it's a datetime string, parse it
    try {
      const date = new Date(timeValue);
      if (isNaN(date.getTime())) {
        return timeValue; // Return as-is if invalid date
      }
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return timeValue; // Return as-is if parsing fails
    }
  };

  // Handle Predict Start Time
  const handlePredictStartTime = async () => {
    if (!deliveryDate || !deliverySession) {
      showErrorToast('Please select delivery date and session');
      return;
    }
    
    try {
      const result = await predictStartTimeMutation.mutateAsync({
        delivery_date: deliveryDate,
        delivery_session: deliverySession,
        depot_location: depotLocation
      });
      
      setPredictedStartTime(result);
      
      // Save to localStorage
      try {
        const storageKey = getStorageKey('predictedStartTime');
        localStorage.setItem(storageKey, JSON.stringify(result));
      } catch (error) {
        console.error('Error saving predicted start time to localStorage:', error);
      }
      
      // Get the best available time value (prioritize datetime over time string)
      const startTime = result.predicted_start_datetime || result.predicted_start_time || null;
      const formattedTime = formatTimeForToast(startTime);
      
      showSuccessToast(`Predicted start time: ${formattedTime}`);
    } catch (error) {
      showErrorToast(error.message || 'Failed to predict start time');
    }
  };
  
  // Handle Start Journey
  const handleStartJourney = async () => {
    if (!startJourneyData.route_id) {
      showErrorToast('Route ID is required');
      return;
    }
    
    if (!startJourneyData.driver_id) {
      showErrorToast('Driver ID is required');
      return;
    }
    
    try {
      await startJourneyMutation.mutateAsync({
        route_id: startJourneyData.route_id,
        driver_id: startJourneyData.driver_id
      });
      showSuccessToast('Journey started successfully!');
      setShowStartJourneyModal(false);
      setStartJourneyData({
        route_id: '',
        driver_id: ''
      });
    } catch (error) {
      showErrorToast(error.message || 'Failed to start journey');
    }
  };
  
  // Handle Stop Journey
  const handleStopJourney = async () => {
    if (!selectedRouteForStop) {
      showErrorToast('Please select a route');
      return;
    }
    
    try {
      await endJourneyMutation.mutateAsync({ user_id: selectedRouteForStop, route_id: selectedRouteForStop });
      showSuccessToast('Journey stopped successfully!');
      setShowStopJourneyModal(false);
      setSelectedRouteForStop(null);
    } catch (error) {
      showErrorToast(error.message || 'Failed to stop journey');
    }
  };
  
  // Handle Start Journey from Route Planning
  const handleStartJourneyFromRoute = (journeyData) => {
    setStartJourneyData(prev => ({
      ...prev,
      ...journeyData
    }));
    setShowStartJourneyModal(true);
  };

  // Approve = save planned routes to S3 (Excel + TXT); returns response so Draft Plan can show Export buttons
  const handleApproveDraft = async (routePlanData) => {
    const routeIds = routePlanData?.route_ids;
    if (!routeIds || !Array.isArray(routeIds) || routeIds.length === 0) {
      showErrorToast?.('No route_ids in plan. Plan a route first.');
      return null;
    }
    try {
      const data = await savePlanToS3Mutation.mutateAsync({ route_ids: routeIds });
      showSuccessToast?.(data.message || 'Planned routes saved to S3 (Excel and TXT).');
      return data;
    } catch (error) {
      showErrorToast?.(error?.message || 'Failed to save plan to S3');
      return null;
    }
  };
  
  // Initialize
  useEffect(() => {
    try {
      // Health check and available dates are automatically fetched by hooks
    } catch (error) {
      console.error('Error initializing AI Route Optimization:', error);
      setComponentError('Failed to initialize component. Please refresh the page.');
    }
  }, []);
  
  // Load route plan and predicted start time from localStorage on mount or when date/session changes
  useEffect(() => {
    if (!deliveryDate || !deliverySession) return;
    
    // Generate storage keys inline to avoid dependency issues
    const storageKeyRoute = `aiRoute_routePlan_${deliveryDate}_${deliverySession}`;
    const storageKeyComparison = `aiRoute_routeComparison_${deliveryDate}_${deliverySession}`;
    const storageKeyTime = `aiRoute_predictedStartTime_${deliveryDate}_${deliverySession}`;
    
    try {
      const savedRoutePlan = localStorage.getItem(storageKeyRoute);
      if (savedRoutePlan) {
        const parsed = JSON.parse(savedRoutePlan);
        setRoutePlan(parsed);
        // Also restore route comparison if it exists in the saved data
        if (parsed.route_comparison) {
          setRouteComparison(parsed.route_comparison);
        }
      }
      
      // Try to load routeComparison separately (in case it was saved separately)
      const savedRouteComparison = localStorage.getItem(storageKeyComparison);
      if (savedRouteComparison) {
        try {
          const parsedComparison = JSON.parse(savedRouteComparison);
          setRouteComparison(parsedComparison);
        } catch (error) {
          console.error('Error parsing saved route comparison:', error);
        }
      }
      
      const savedPredictedTime = localStorage.getItem(storageKeyTime);
      if (savedPredictedTime) {
        const parsed = JSON.parse(savedPredictedTime);
        setPredictedStartTime(parsed);
      }
    } catch (error) {
      console.error('Error loading saved route data from localStorage:', error);
    }
  }, [deliveryDate, deliverySession]); // Re-load when date or session changes

  // Load all draft plans from localStorage on mount (for Draft Plan tab Meal Type filter)
  useEffect(() => {
    try {
      const prefix = 'aiRoute_routePlan_';
      const next = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(prefix)) continue;
        const rest = key.slice(prefix.length);
        const parts = rest.split('_');
        const date = parts[0];
        const session = parts.slice(1).join('_') || (parts[1] ?? '');
        if (!date || !session) continue;
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const plan = JSON.parse(raw);
        next[`${date}_${session}`] = { plan, comparison: plan.route_comparison ?? null };
      }
      setDraftPlans((prev) => (Object.keys(next).length ? { ...next, ...prev } : prev));
    } catch (e) {
      console.error('Error loading draft plans from localStorage:', e);
    }
  }, []);

  // Error boundary - show error message if component fails
  if (componentError) {
    return (
      <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
        <div className="flex items-center gap-2 text-red-400 mb-2">
          <FiAlertCircle />
          <span className="font-medium">Component Error</span>
        </div>
        <p className="text-red-300 text-sm mb-3">{componentError}</p>
        <button
          onClick={() => {
            setComponentError(null);
            window.location.reload();
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Reload Page
        </button>
      </div>
    );
  }

  // Tab configuration
  const tabs = [
    { id: 'planning', label: 'Route Planning', icon: FiMap },
    { id: 'draft', label: 'Draft Plan', icon: FiFileText },
    { id: 'reassign', label: 'Reassign Driver', icon: FiPackage },
    { id: 'tracking', label: 'Tracking', icon: FiNavigation },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart2 }
  ];

  return (
    <div className="space-y-4">
      {/* API Health Status */}
      <APIHealthStatus 
        apiHealth={apiHealth} 
        onRefresh={refetchHealth} 
      />
      
      {/* Tabs */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-1">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        {activeTab === 'planning' && (
          <RoutePlanningTab
            deliveryDate={deliveryDate}
            setDeliveryDate={setDeliveryDate}
            deliverySession={deliverySession}
            setDeliverySession={setDeliverySession}
            numDrivers={numDrivers}
            setNumDrivers={setNumDrivers}
            depotLocation={depotLocation}
            setDepotLocation={setDepotLocation}
            routePlan={routePlan}
            setRoutePlan={setRoutePlan}
            routeComparison={routeComparison}
            setRouteComparison={setRouteComparison}
            predictedStartTime={predictedStartTime}
            setPredictedStartTime={setPredictedStartTime}
            onPlanRoute={handlePlanRoute}
            onPredictStartTime={handlePredictStartTime}
            planningRoute={planRouteMutation.isPending}
            predictingStartTime={predictStartTimeMutation.isPending}
            onStartJourney={handleStartJourneyFromRoute}
          />
        )}

        {activeTab === 'draft' && (
          <DraftPlanSession
            draftPlans={draftPlans}
            currentDeliveryDate={deliveryDate}
            currentDeliverySession={deliverySession}
            onApproveRoute={handleApproveDraft}
            showSuccessToast={showSuccessToast}
            showErrorToast={showErrorToast}
          />
        )}
        
        {activeTab === 'reassign' && (
          <ReassignDriverTab
            routePlan={routePlan}
            reassignMutation={reassignDriverMutation}
            moveStopMutation={moveStopMutation}
          />
        )}
        
        {activeTab === 'tracking' && (
          <TrackingTab 
            onStartJourneyClick={() => setShowStartJourneyModal(true)}
            onVehicleTracking={vehicleTrackingMutation.mutateAsync}
            vehicleTrackingLoading={vehicleTrackingMutation.isPending}
          />
        )}
        
        {activeTab === 'analytics' && (
          <AnalyticsTab />
        )}
      </div>
      
      {/* Start Journey Modal */}
      <StartJourneyModal
        open={showStartJourneyModal}
        onClose={() => setShowStartJourneyModal(false)}
        startJourneyData={startJourneyData}
        setStartJourneyData={setStartJourneyData}
        onStart={handleStartJourney}
        loading={startJourneyMutation.isPending}
      />
      
      {/* Stop Journey Modal */}
      <StopJourneyModal
        open={showStopJourneyModal}
        onClose={() => {
          setShowStopJourneyModal(false);
          setSelectedRouteForStop(null);
        }}
        routeId={selectedRouteForStop}
        onStop={handleStopJourney}
        loading={endJourneyMutation.isPending}
      />
    </div>
  );
};

export default AIRouteOptimization;
