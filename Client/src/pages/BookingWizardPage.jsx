import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal } from 'antd';
import { 
  MdPeople, 
  MdRestaurant, 
  MdLocationOn, 
  MdSchedule, 
  MdShoppingCart,
  MdArrowForward,
  MdArrowBack,
  MdCheckCircle,
  MdPerson,
  MdPhone,
  MdEmail,
  MdLocationCity,
  MdEdit,
  MdAdd,
  MdWarning,
  MdCheckCircleOutline,
  MdDashboard,
  MdClear,
  MdInfo
} from 'react-icons/md';
import { useSeller } from '../hooks/sellerHooks/useSeller';
import { useMenusForBooking, useProductQuantitiesForMenus } from '../hooks/adminHook/adminHook';
import { useAddress } from '../hooks/userHooks/userAddress';
import { useOrder, useCalculateMenuPricing, useCalculateOrderTotal } from '../hooks/userHooks/useOrder';
import { useAdminOrderBlock } from '../hooks/userHooks/useAdminOrderBlock';
import { useGlobalSettings } from '../hooks/useGlobalSettings.js';
import { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast,
  showOrderSuccess,
  showOrderError,
  showValidationError,
  showRequiredFieldError
} from '../utils/toastConfig.jsx';
import { saveDraftWithCleanup, cleanExpiredDrafts } from '../utils/draftOrderUtils';
import useAuthStore from '../stores/Zustand.store';
import AddressPicker from '../components/AddressPicker';
import AdminOrderBlockedModal from '../components/AdminOrderBlockedModal';
import OrderSuccessPopup from '../components/OrderSuccessPopup';
import Pagination from '../components/Pagination';
import { SkeletonTable, SkeletonCard, SkeletonWizardStep, SkeletonLoading } from '../components/Skeleton';
import { 
  DateSelector, 
  MenuSelector, 
  OrderSummary,
  MealSkipSelector
} from '../components/booking';
import axiosInstance from '../api/axios.js';

// Draft Orders List Component
const DraftOrdersList = ({ onLoadDraft, onDeleteDraft, currentDraftId }) => {
  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    const loadDrafts = () => {
      const savedDrafts = JSON.parse(localStorage.getItem('draftOrders') || '[]');
      setDrafts(savedDrafts);
    };
    
    loadDrafts();
    
    // Listen for storage changes to update the list
    const handleStorageChange = () => {
      loadDrafts();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (drafts.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="text-gray-400 text-sm">No draft orders</div>
        <div className="text-gray-500 text-xs mt-1">Save orders as drafts to continue later</div>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {drafts.map((draft) => (
        <div
          key={draft.id}
          className={`p-2 border rounded-lg text-xs ${
            currentDraftId === draft.id 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex justify-between items-start mb-1">
            <div className="font-medium text-gray-900 truncate">
              {draft.customerName || 'Unknown Customer'}
            </div>
            <div className="text-gray-500">
              {formatDate(draft.updatedAt)}
            </div>
          </div>
          
          <div className="text-gray-600 mb-2">
            {draft.selectedMenu?.name || 'No menu selected'}
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => onLoadDraft(draft)}
              className="flex-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200 transition-colors"
            >
              Load
            </button>
            <button
              onClick={() => onDeleteDraft(draft.id)}
              className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * BookingWizardPage - Multi-step order booking wizard with menu selection and customer management
 * Handles complete order flow from customer selection to payment processing
 * Features: Multi-step wizard, menu selection, customer management, address handling, order validation
 */
const BookingWizardPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [dietaryPreference, setDietaryPreference] = useState('veg');
  const [menuCategory, setMenuCategory] = useState('popular');
  const [expandedSections, setExpandedSections] = useState({
    menus: true,
    dateSelection: false
  });
  const [orderMode, setOrderMode] = useState('multiple');
  const [savedOrder, setSavedOrder] = useState(null);
  const [showMenuPopup, setShowMenuPopup] = useState(false);
  const [menuPopupMessage, setMenuPopupMessage] = useState('');
  const [showOrderSuccessPopup, setShowOrderSuccessPopup] = useState(false);
  const [orderSuccessDetails, setOrderSuccessDetails] = useState(null);
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Delivery locations state
  const [deliveryLocations, setDeliveryLocations] = useState({
    breakfast: '',
    lunch: '',
    dinner: '',
    full: ''
  });
  const [deliveryLocationNames, setDeliveryLocationNames] = useState({
    breakfast: '',
    lunch: '',
    dinner: '',
    full: ''
  });
  
  // Meal skipping state
  const [skipMeals, setSkipMeals] = useState({});
  
  // Daily Flexible Plan - Store menu selection for each date
  const [dateMenuSelections, setDateMenuSelections] = useState({});
  
  // Seller user selection state
  const [selectedUserAddresses, setSelectedUserAddresses] = useState([]);
  const [isLoadingUserAddresses, setIsLoadingUserAddresses] = useState(false);
  
  // Menu pagination state
  const [menuCurrentPage, setMenuCurrentPage] = useState(1);
  const [menuItemsPerPage, setMenuItemsPerPage] = useState(6);


  // Hooks
  const { sellerUsers, loading: sellerUsersLoading, getSellerUsers, isSeller } = useSeller();
  const { data: menusData, isLoading: menusLoading, error: menusError } = useMenusForBooking();
  const { data: productQuantitiesData, isLoading: productQuantitiesLoading } = useProductQuantitiesForMenus();
  const { createOrder, isCreating } = useOrder();
  const { addresses: userAddresses } = useAddress();
  const calculateMenuPricing = useCalculateMenuPricing();
  const calculateOrderTotal = useCalculateOrderTotal();
  const { showAdminBlockModal, handleOrderError, handleSwitchAccount, closeAdminBlockModal } = useAdminOrderBlock();
  const { getAutoSelectionDays, getMenuTypeMessage, loading: settingsLoading, menuTypeConfig } = useGlobalSettings();
  const { user } = useAuthStore();
  const menus = menusData?.data || [];
  const productQuantities = productQuantitiesData?.data || {};

  const steps = [
    { id: 1, title: 'Select Customer', icon: MdPeople, color: 'blue' },
    { id: 2, title: 'Choose Menu', icon: MdRestaurant, color: 'green' },
    { id: 3, title: 'Delivery Address', icon: MdLocationOn, color: 'purple' },
    { id: 4, title: 'Schedule & Save', icon: MdSchedule, color: 'indigo' }
  ];

  // Helper functions
  const getAddressDisplayName = (addressId) => {
    // If seller has selected a user, use that user's addresses
    if (isSeller && selectedUser && selectedUserAddresses) {
      const address = selectedUserAddresses.find(addr => addr.id === addressId);
      if (address) {
        return `${address.housename ? address.housename + ', ' : ''}${address.street}, ${address.city} - ${address.pincode}`;
      }
    }
    
    // Fallback to logged-in user's addresses
    if (!addressId || !userAddresses) return '';
    const address = userAddresses.find(addr => addr.id === addressId);
    if (!address) return '';
    return `${address.housename ? address.housename + ', ' : ''}${address.street}, ${address.city} - ${address.pincode}`;
  };

  // Helper function to safely get product ID from menu item
  const getProductId = (menuItem) => {
    if (!menuItem) return null;
    if (menuItem.product && menuItem.product.id) {
      return menuItem.product.id;
    }
    if (menuItem.productId) {
      return menuItem.productId;
    }
    return null;
  };

  // Helper function to safely get product quantity
  const getProductQuantity = (menuItem) => {
    const productId = getProductId(menuItem);
    if (!productId || !productQuantities) return null;
    return productQuantities[productId];
  };

  const isWeekday = (date) => {
    const day = date.getDay();
    return day >= 1 && day <= 5;
  };

  const isWeekdayMenu = (menu) => {
    if (!menu) return false;
    
    const itemName = menu.name?.toLowerCase() || '';
    
    // Check if it's a full week menu (should not be restricted to weekdays)
    if (itemName.includes('full week')) {
      return false;
    }
    
    // Check if it's a weekday menu based on name only
    const isWeekdayByName = itemName.includes('week day') || itemName.includes('weekday') || itemName.includes('monday') || itemName.includes('tuesday') || itemName.includes('wednesday') || itemName.includes('thursday') || itemName.includes('friday');
    return isWeekdayByName;
  };


  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTotalItems = () => {
    // For comprehensive menus, count the menu items automatically
    if (selectedMenu && selectedMenu.isComprehensiveMenu) {
   
      let total = 0;
      if (selectedMenu.mealTypes.breakfast) total += selectedMenu.mealTypes.breakfast.length;
      if (selectedMenu.mealTypes.lunch) total += selectedMenu.mealTypes.lunch.length;
      if (selectedMenu.mealTypes.dinner) total += selectedMenu.mealTypes.dinner.length;
      return total;
    }
    
    // For daily rates, count based on selected dates and meal types
    if (selectedMenu && selectedMenu.isDailyRateItem) {
      let total = 0;
      if (selectedMenu.hasBreakfast) total += selectedDates.length;
      if (selectedMenu.hasLunch) total += selectedDates.length;
      if (selectedMenu.hasDinner) total += selectedDates.length;
      return total;
    }
    
    // For other regular menus, return 1 (the selected menu item)
    return 1;
  };

  const getTotalPrice = () => {
    // Return 0 if no menu selected
    if (!selectedMenu) {
      return 0;
    }
    
    // For daily flexible mode, calculate based on individual date-menu selections
    if (orderMode === 'daily-flexible') {
      let total = 0;
      
      selectedDates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        const menuForDate = dateMenuSelections[dateStr];
        
        if (menuForDate) {
          total += (menuForDate.price || 0);
        }
      });
      
      return total;
    }
    
    // Check if this is a daily rate menu item using the backend flag
    if (selectedMenu.isDailyRateItem) {
      const basePrice = selectedMenu.price || 0;
      const numberOfDays = selectedDates.length;
      return basePrice * numberOfDays;
    }
    
    // For comprehensive menus (monthly/weekly/weekday): Keep original price
    return selectedMenu.price || 0;
  };

  const getFilteredMenus = () => {
    if (!menus || menus.length === 0) {
      return [];
    }

    let filteredMenus = menus;

    // Filter by dietary preference
    filteredMenus = filteredMenus.filter(menuItem => {
        if (menuItem.categories && menuItem.categories.length > 0) {
          const categoryNames = menuItem.categories.map(cat => cat.name.toLowerCase());
          
          if (dietaryPreference === 'veg') {
            const isVeg = categoryNames.some(name => name.includes('veg') && !name.includes('non'));
            return isVeg;
          } else if (dietaryPreference === 'non-veg') {
            const isNonVeg = categoryNames.some(name => name.includes('non') || name.includes('non-veg'));
            return isNonVeg;
          }
        }
        
        // If no categories or categories don't match, be more lenient
        if (dietaryPreference === 'veg') {
          const categoryNames = menuItem.categories?.map(cat => cat.name.toLowerCase()) || [];
          const hasNonVeg = categoryNames.some(name => name.includes('non') || name.includes('non-veg'));
          const isVeg = !hasNonVeg;
          return isVeg;
        } else if (dietaryPreference === 'non-veg') {
          const categoryNames = menuItem.categories?.map(cat => cat.name.toLowerCase()) || [];
          const hasNonVeg = categoryNames.some(name => name.includes('non') || name.includes('non-veg'));
          return hasNonVeg;
        }
        
        return true;
      });

    // Filter by menu category (Popular, Premium, etc.)
    filteredMenus = filteredMenus.filter(menuItem => {
        const menuName = menuItem.name?.toLowerCase() || '';
        
        if (menuCategory === 'popular') {
          return menuName.includes('popular') || menuName.includes('basic') || menuName.includes('standard');
        } else if (menuCategory === 'premium') {
          return menuName.includes('premium') || menuName.includes('deluxe') || menuName.includes('luxury');
        }
        
        return true;
      });
    
    if (filteredMenus.length === 0 && menus.length > 0) {
      return menus;
    }
    
    return filteredMenus;
  };

  // Get paginated menu items
  const getPaginatedMenus = () => {
    const filteredMenus = getFilteredMenus();
    const startIndex = (menuCurrentPage - 1) * menuItemsPerPage;
    const endIndex = startIndex + menuItemsPerPage;
    return filteredMenus.slice(startIndex, endIndex);
  };

  // Menu pagination calculations
  const filteredMenus = getFilteredMenus();
  const menuTotalItems = filteredMenus.length;
  const menuTotalPages = Math.ceil(menuTotalItems / menuItemsPerPage);

  // Menu pagination handlers
  const handleMenuPageChange = (page) => {
    setMenuCurrentPage(page);
  };

  const handleMenuItemsPerPageChange = (newItemsPerPage) => {
    setMenuItemsPerPage(newItemsPerPage);
    setMenuCurrentPage(1); // Reset to first page when changing items per page
  };

  // Reset menu pagination when filters change
  React.useEffect(() => {
    setMenuCurrentPage(1);
  }, [dietaryPreference, menuCategory]);

  // Adjust items per page based on screen size
  React.useEffect(() => {
    if (isMobile) {
      setMenuItemsPerPage(4); // Show fewer items on mobile
    } else {
      setMenuItemsPerPage(6); // Show more items on desktop
    }
  }, [isMobile]);

  // Screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (isSeller) {
      getSellerUsers();
    }
  }, [isSeller]);

  // Check for existing draft orders on component load
  useEffect(() => {
    const checkForDrafts = () => {
      const drafts = JSON.parse(localStorage.getItem('draftOrders') || '[]');
      if (drafts.length > 0) {
        // Show a notification that drafts are available
      }
    };
    
    checkForDrafts();
  }, []);

  // Handle order success state from payment
  useEffect(() => {
    if (location.state?.showOrderSuccess) {
      setShowOrderSuccessPopup(true);
      setOrderSuccessDetails(location.state.orderDetails);
      // Clear the navigation state to prevent showing popup again on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);

  // Handle selected user from navigation state
  useEffect(() => {
    if (location.state?.selectedUser && isSeller) {
      try {
        const userFromState = location.state.selectedUser;
        
        // If this is from CreateUserPage, transform the data structure
        if (location.state?.fromCreateUser) {
          // Transform the createContactOnly response to match sellerUsers structure
          const transformedUser = {
            id: userFromState.user.id,
            status: userFromState.user.status,
            createdBy: userFromState.user.createdBy,
            companyId: userFromState.user.companyId,
            contacts: [{
              firstName: userFromState.contact.firstName,
              lastName: userFromState.contact.lastName,
              phoneNumbers: [{
                number: userFromState.phoneNumber.number,
                type: userFromState.phoneNumber.type
              }]
            }],
            addresses: userFromState.address ? [{
              id: userFromState.address.id,
              street: userFromState.address.street,
              housename: userFromState.address.housename,
              city: userFromState.address.city,
              pincode: userFromState.address.pincode,
              addressType: 'HOME'
            }] : []
          };
          
          setSelectedUser(transformedUser);
          // Fetch addresses for the newly created user (this will update the addresses if needed)
          fetchUserAddresses(transformedUser.id);
          
          // If initialTab is 'menu' or skipToMenuSelection is true, go directly to step 2 (Choose Menu)
          if (location.state?.initialTab === 'menu' || location.state?.skipToMenuSelection) {
            setCurrentStep(2);
          }
          
          // Clear the navigation state to prevent re-selection on refresh
          navigate(location.pathname, { replace: true });
          return;
        }
        
        // Otherwise, try to find the user in sellerUsers array
        if (sellerUsers.length > 0) {
        const fullUser = sellerUsers.find(u => u.id === userFromState.id);
        if (fullUser) {
          setSelectedUser(fullUser);
          // Fetch addresses for the selected user
          fetchUserAddresses(fullUser.id);
          
          // If initialTab is 'menu' or skipToMenuSelection is true, go directly to step 2 (Choose Menu)
          if (location.state?.initialTab === 'menu' || location.state?.skipToMenuSelection) {
            setCurrentStep(2);
          }
        }
        // Clear the navigation state to prevent re-selection on refresh
        navigate(location.pathname, { replace: true });
        }
      } catch (error) {
        // Clear the navigation state on error
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.state?.selectedUser, location.state?.fromCreateUser, isSeller, sellerUsers, navigate]);

  // Handle draft order resumption
  useEffect(() => {
    if (location.state?.draftOrder && location.state?.resumeDraft) {
      try {
        const draftOrder = location.state.draftOrder;
        const isEditMode = location.state?.editMode || false;
        
        // Load draft data
        setSelectedUser(draftOrder.selectedUser);
        setSelectedMenu(draftOrder.selectedMenu);
        setSelectedDates(draftOrder.selectedDates.map(dateStr => new Date(dateStr)));
        setDeliveryLocations(draftOrder.deliveryLocations || {});
        setDeliveryLocationNames(draftOrder.deliveryLocationNames || {});
        setSkipMeals(draftOrder.skipMeals || {});
        setDateMenuSelections(draftOrder.dateMenuSelections || {});
        setOrderMode(draftOrder.orderMode || 'multiple');
        setDietaryPreference(draftOrder.dietaryPreference || 'veg');
        setDraftId(draftOrder.id);
        setIsDraftMode(true);
        
        // Fetch addresses for the selected user if it's a seller
        if (draftOrder.selectedUser && isSeller) {
          fetchUserAddresses(draftOrder.selectedUser.id);
        }
        
        // Navigate to the appropriate step based on edit mode
        if (isEditMode) {
          // If editing dates, go to Schedule & Save Order step (step 4) where date selection happens
          setCurrentStep(4);
          showSuccessToast('Draft order loaded for editing! You can now modify the dates and other details.');
        } else {
          // Navigate to the appropriate step based on what's completed
          if (draftOrder.selectedUser && draftOrder.selectedMenu && draftOrder.selectedDates.length > 0) {
            setCurrentStep(4); // Go to final step if everything is selected
          } else if (draftOrder.selectedUser && draftOrder.selectedMenu) {
            setCurrentStep(3); // Go to address step if user and menu are selected
          } else if (draftOrder.selectedUser) {
            setCurrentStep(2); // Go to menu step if only user is selected
          }
          showSuccessToast('Draft order loaded successfully! You can now continue from where you left off.');
        }
        
        // Clear the navigation state to prevent re-loading on refresh
        navigate(location.pathname, { replace: true });
      } catch (error) {
        showErrorToast('Failed to load draft order. Please try again.');
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.state?.draftOrder, location.state?.resumeDraft, location.state?.editMode, isSeller, navigate]);

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Helper function to detect single meal type from menu name
  const getSingleMealType = (menu) => {
    if (!menu || !menu.name) return null;
    const menuName = menu.name.toLowerCase();
    
    if (menuName.includes('breakfast')) return 'breakfast';
    if (menuName.includes('lunch')) return 'lunch';
    if (menuName.includes('dinner')) return 'dinner';
    
    return null;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return isSeller ? selectedUser : true; // For sellers, need to select user; for others, can proceed
      case 2: return selectedMenu;
      case 3: 
        // Check if this is a single meal item
        const singleMealType = getSingleMealType(selectedMenu);
        if (singleMealType) {
          // For single meal items, require only that specific meal address
          return !!deliveryLocations[singleMealType];
        }
        
        // For daily flexible rates, require individual meal addresses (no primary address needed)
        if (selectedMenu && selectedMenu.isDailyRateItem) {
          if (selectedMenu.hasBreakfast && !deliveryLocations.breakfast) return false;
          if (selectedMenu.hasLunch && !deliveryLocations.lunch) return false;
          if (selectedMenu.hasDinner && !deliveryLocations.dinner) return false;
          return true;
        }
        // For other menu types, check if user has provided either primary address or meal-specific addresses
        return deliveryLocations.full || deliveryLocations.breakfast || deliveryLocations.lunch || deliveryLocations.dinner;
      case 4: return selectedDates.length > 0; // Allow proceeding if dates are selected
      default: return false;
    }
  };

  // Date generation and navigation
  const generateDates = () => {
    const dates = [];
    const startDate = new Date(currentDate);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  const goToNextDays = () => {
    const newDate = new Date(currentDate);
    const daysToMove = isMobile ? 5 : 7;
    newDate.setDate(currentDate.getDate() + daysToMove);
    setCurrentDate(newDate);
  };

  const goToPreviousDays = () => {
    const newDate = new Date(currentDate);
    const daysToMove = isMobile ? 5 : 7;
    newDate.setDate(currentDate.getDate() - daysToMove);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (newDate >= today) {
      setCurrentDate(newDate);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatMonth = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long'
    });
  };

  const formatDay = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short' 
    });
  };

  const formatDayNumber = (date) => {
    return date.getDate();
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return selectedDates.some(selectedDate => selectedDate.toDateString() === date.toDateString());
  };

  const handleDateSelection = (date) => {
    const autoSelectionDays = getAutoSelectionDays(selectedMenu);
    
    // If a menu with auto-selection is selected, always auto-select from the clicked date
    if (selectedMenu && autoSelectionDays > 0) {
      handleAutoDateSelection(date, autoSelectionDays);
      return;
    }

    // For menus without auto-selection, toggle individual dates
    setSelectedDates(prev => {
      const dateStr = date.toDateString();
      const exists = prev.find(d => d.toDateString() === dateStr);
      if (exists) {
        return prev.filter(d => d.toDateString() !== dateStr);
      } else {
        return [...prev, date];
      }
    });
  };

  const handleAutoDateSelection = (startDate, days) => {
    const selectedDates = [];
    
    // Helper function to get next Monday from a given date (never today)
    const getNextMonday = (date) => {
      const nextMonday = new Date(date);
      const dayOfWeek = nextMonday.getDay();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // If it's already Monday (1), check if it's today
      if (dayOfWeek === 1) {
        nextMonday.setHours(0, 0, 0, 0);
        if (nextMonday.getTime() <= today.getTime()) {
          // This Monday is today or past, go to next Monday
          nextMonday.setDate(nextMonday.getDate() + 7);
        }
      } else if (dayOfWeek === 0) {
        // Sunday - go to next Monday
        nextMonday.setDate(nextMonday.getDate() + 1);
      } else if (dayOfWeek > 1) {
        // Tuesday-Saturday - go back to this Monday
        nextMonday.setDate(nextMonday.getDate() - (dayOfWeek - 1));
        nextMonday.setHours(0, 0, 0, 0);
        if (nextMonday.getTime() <= today.getTime()) {
          // This Monday is today or past, go to next Monday
          nextMonday.setDate(nextMonday.getDate() + 7);
        }
      }
      
      return nextMonday;
    };
    
    // Helper function to check if a date is a weekday (Monday-Friday)
    const isWeekday = (date) => {
      const day = date.getDay();
      return day >= 1 && day <= 5;
    };
    
    // Dynamic selection logic based on days parameter
    if (days > 0) {
      // Get the selection type from global settings
      let selectionType = 'consecutive'; // Default
      
      // Find the matching menu type to get selection type
      for (const [menuType, config] of Object.entries(menuTypeConfig)) {
        if (config.autoDays === days) {
          selectionType = config.selectionType || 'consecutive';
          break;
        }
      }
      
      if (selectionType === 'weekdays_only') {
        // Weekday selection: Start from next Monday, select only weekdays
        const nextMonday = getNextMonday(startDate);
        let currentDate = new Date(nextMonday);
        let selectedCount = 0;
        
        while (selectedCount < days) {
          if (isWeekday(currentDate)) {
            selectedDates.push(new Date(currentDate));
            selectedCount++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        // Consecutive selection: Select consecutive days
        let startFromDate = new Date(startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        startFromDate.setHours(0, 0, 0, 0);
        
        // If the selected date is today or in the past, start from tomorrow
        if (startFromDate.getTime() <= today.getTime()) {
          startFromDate = new Date();
          startFromDate.setDate(startFromDate.getDate() + 1);
        }
        
        for (let i = 0; i < days; i++) {
          const date = new Date(startFromDate);
          date.setDate(startFromDate.getDate() + i);
          selectedDates.push(date);
        }
      }
    }
    
    setSelectedDates(selectedDates);
    
    // Auto-navigate calendar to show the first selected date
    if (selectedDates.length > 0) {
      setCurrentDate(selectedDates[0]);
    }
  };

  const handleMenuSelection = (menu) => {
    const productQuantity = getProductQuantity(menu);
    if (productQuantity && productQuantity.quantity === 0) {
      return;
    }
    
    setSelectedMenu(menu);
    
    // Use dynamic configuration instead of hardcoded
    const autoSelectionDays = getAutoSelectionDays(menu);
    
    if (autoSelectionDays > 0) {
      // Start from tomorrow for initial selection
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      handleAutoDateSelection(tomorrow, autoSelectionDays);
    } else {
      // Clear existing dates when switching to a menu without auto-selection
      setSelectedDates([]);
    }
    
    if (orderMode === 'daily-flexible') {
      if (selectedDates.length === 0) {

        return;
      }
      
      const menuDisplayName = menu.name;
      
      const shouldApplyToAll = window.confirm(
        `Apply "${menuDisplayName}" to all ${selectedDates.length} selected dates?`
      );
      
      if (shouldApplyToAll) {
        const newDateMenuSelections = { ...dateMenuSelections };
        selectedDates.forEach(date => {
          const dateStr = date.toISOString().split('T')[0];
          newDateMenuSelections[dateStr] = menu;
        });
        setDateMenuSelections(newDateMenuSelections);

      } else {
        const firstDate = selectedDates[0];
        const dateStr = firstDate.toISOString().split('T')[0];
        setDateMenuSelections(prev => ({
          ...prev,
          [dateStr]: menu
        }));

      }
      return;
    }
    
    setSelectedMenu(menu);
    
    // Use dynamic message instead of hardcoded
    const menuMessage = getMenuTypeMessage(menu);
    
    if (menuMessage) {
      setMenuPopupMessage(menuMessage);
      setShowMenuPopup(true);
    }
  };

  const handleDeliveryLocationChange = (type, addressId, displayName) => {
    setDeliveryLocations(prev => ({ ...prev, [type]: addressId }));
    setDeliveryLocationNames(prev => ({ ...prev, [type]: displayName }));
  };

  const clearDeliveryAddress = (type) => {
    setDeliveryLocations(prev => ({ ...prev, [type]: '' }));
    setDeliveryLocationNames(prev => ({ ...prev, [type]: '' }));
  };

  const handleSkipMealsChange = (newSkipMeals) => {
    setSkipMeals(newSkipMeals);
  };



  // Function to fetch addresses for the selected user
  const fetchUserAddresses = async (userId) => {
    if (!userId) return;
    
    setIsLoadingUserAddresses(true);
    try {
      const response = await axiosInstance.get(`/seller/users/${userId}/addresses`);
      
      if (response.data.success) {
        setSelectedUserAddresses(response.data.data || []);
      } else {
        setSelectedUserAddresses([]);
      }
    } catch (error) {
      setSelectedUserAddresses([]);
    } finally {
      setIsLoadingUserAddresses(false);
    }
  };

  // Function to create address for the selected user
  const createAddressForUser = async (userId, addressData) => {
    if (!userId) {
      throw new Error('No user selected');
    }
    
    try {
      const response = await axiosInstance.post(`/seller/users/${userId}/addresses`, addressData);
      
      if (response.data.success) {
        await fetchUserAddresses(userId);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create address');
      }
    } catch (error) {
      throw error;
    }
  };

  // Function to delete address for the selected user
  const deleteAddressForUser = async (addressId) => {
    if (!selectedUser?.id) {
      throw new Error('No user selected');
    }
    
    try {
      const response = await axiosInstance.delete(`/seller/users/${selectedUser.id}/addresses/${addressId}`);
      
      if (response.data.success) {
        await fetchUserAddresses(selectedUser.id);
        return true;
      } else {
        throw new Error(response.data.message || 'Failed to delete address');
      }
    } catch (error) {
      throw error;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Select Customer</h2>
              <p className="text-gray-600 text-xs sm:text-sm">Choose the customer for this order</p>
            </div>
            
            {isSeller ? (
              <div className="max-w-md mx-auto">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Customer Account</label>
                <select
                  value={selectedUser?.id || ''}
                  onChange={(e) => {
                    const user = sellerUsers.find(u => u.id === e.target.value);
                    setSelectedUser(user);
                    if (user) {
                      fetchUserAddresses(user.id);
                    } else {
                      setSelectedUserAddresses([]);
                    }
                  }}
                  className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[44px] sm:min-h-0"
                  disabled={sellerUsersLoading}
                >
                  <option value="">Select a customer...</option>
                  {sellerUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.contacts?.[0]?.firstName} {user.contacts?.[0]?.lastName} - {user.contacts?.[0]?.phoneNumbers?.[0]?.number || 'No phone'}
                    </option>
                  ))}
                </select>

                {selectedUser && (
                  <div className="mt-3 bg-blue-50 rounded-lg p-2 sm:p-3 border border-blue-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <MdPerson className="text-white text-sm sm:text-lg" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-blue-900 text-xs sm:text-sm truncate">
                          {selectedUser.contacts?.[0]?.firstName}
                        </h3>
                        <p className="text-blue-700 text-xs sm:text-sm truncate">{selectedUser.contacts?.[0]?.phoneNumbers?.[0]?.number}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedUserAddresses.length > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {selectedUserAddresses.length} address{selectedUserAddresses.length !== 1 ? 'es' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
                <MdPerson className="text-2xl sm:text-3xl text-gray-400 mx-auto mb-2 sm:mb-3" />
                <h3 className="text-sm sm:text-base font-semibold text-gray-700 mb-2">Personal Order</h3>
                <p className="text-gray-600 text-xs sm:text-sm">You're placing an order for yourself</p>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Choose Menu Package</h2>
              <p className="text-gray-600 text-xs sm:text-sm">Select the meal plan for your customer</p>
            </div>
            
            {/* Category and Dietary Preference Filters */}
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Menu Category Tabs */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Menu Category</label>
                <div className="flex gap-2 flex-wrap">
                  {['popular', 'premium'].map((category) => (
                    <button
                      key={category}
                      onClick={() => setMenuCategory(category)}
                      className={`px-3 sm:px-4 py-2 sm:py-2 rounded-lg font-medium transition-all text-xs sm:text-sm min-h-[44px] sm:min-h-0 ${
                        menuCategory === category
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category === 'popular' ? 'Popular' : 'Premium'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary Preference Filter */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Dietary Preference</label>
                <div className="flex gap-2">
                  {['veg', 'non-veg'].map((pref) => (
                    <button
                      key={pref}
                      onClick={() => setDietaryPreference(pref)}
                      className={`px-3 py-2 rounded-lg font-medium transition-all text-xs sm:text-sm min-h-[44px] sm:min-h-0 ${
                        dietaryPreference === pref
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pref === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Counter */}
            <div className="text-center mb-4">
              <p className="text-xs sm:text-sm text-gray-600">
                Showing {menuTotalItems} menu{menuTotalItems !== 1 ? 's' : ''} in {menuCategory} category ({dietaryPreference === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'})
              </p>
            </div>

            {/* Menu Grid */}
            {menusLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: menuItemsPerPage }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            ) : menuTotalItems === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <MdRestaurant className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No menus found</h3>
                <p className="text-gray-600 text-xs sm:text-sm mb-4">
                  Try adjusting your filters to see more options
                </p>
                <button
                  onClick={() => {
                    setMenuCategory('popular');
                    setDietaryPreference('veg');
                  }}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium min-h-[44px] sm:min-h-0"
                >
                  Reset to Default
                </button>
              </div>
            ) : (
              <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {getPaginatedMenus().map((menu) => {
                const productQuantity = getProductQuantity(menu);
                const isOutOfStock = productQuantity && productQuantity.quantity === 0;
                
                return (
                  <div
                    key={menu.id}
                    onClick={() => !isOutOfStock && handleMenuSelection(menu)}
                    className={`p-2 sm:p-3 border-2 rounded-lg cursor-pointer transition-all min-h-[120px] sm:min-h-0 ${
                      isOutOfStock
                        ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-60'
                        : selectedMenu?.id === menu.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-xs sm:text-sm break-words">{menu.name}</h3>
                        {/* Category Badge */}
                        {(() => {
                          const menuName = menu.name?.toLowerCase() || '';
                          if (menuName.includes('premium') || menuName.includes('deluxe') || menuName.includes('luxury')) {
                            return <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full mt-1 inline-block">Premium</span>;
                          } else if (menuName.includes('popular') || menuName.includes('basic') || menuName.includes('standard')) {
                            return <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full mt-1 inline-block">Popular</span>;
                          }
                          return null;
                        })()}
                      </div>
                      {isOutOfStock && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full flex-shrink-0">
                          Out of Stock
                        </span>
                      )}
                    </div>
                    <p className="text-green-600 font-bold text-sm sm:text-base">₹{menu.price}</p>
                    {menu.categories && (
                      <div className="text-xs text-gray-600 mt-1 break-words">
                        {menu.categories.map(cat => cat.name).join(', ')}
                      </div>
                    )}
                    {productQuantity && productQuantity.quantity > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        Available: {productQuantity.quantity}
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
              
              {/* Menu Pagination */}
              {menuTotalItems > 0 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={menuCurrentPage}
                    totalPages={menuTotalPages}
                    totalItems={menuTotalItems}
                    itemsPerPage={menuItemsPerPage}
                    onPageChange={handleMenuPageChange}
                    onItemsPerPageChange={handleMenuItemsPerPageChange}
                    showItemsPerPage={false} // Hide items per page for grid layout
                    className="justify-center"
                  />
                </div>
              )}
              </>
            )}


            {menusError && (
              <div className="text-center py-4 sm:py-6">
                <MdWarning className="text-2xl sm:text-3xl text-red-500 mx-auto mb-2 sm:mb-3" />
                <p className="text-red-600 text-xs sm:text-sm">Failed to load menus. Please try again.</p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Delivery Configuration</h2>
              <p className="text-gray-600 text-xs sm:text-sm">Set delivery addresses and preferences</p>
            </div>
            
            <div className="space-y-4">
              {/* Primary Address - Only show for non-daily rate items */}
              {selectedMenu && !selectedMenu.isDailyRateItem && (
                <div className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
                        <MdLocationOn className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <label className="block text-xs sm:text-sm font-semibold text-gray-900">Primary Delivery Address</label>
                      <p className="text-xs text-gray-600">Default address for all meal deliveries</p>
                    </div>
                    </div>
                    {(deliveryLocations.full || deliveryLocationNames.full) && (
                      <button
                        onClick={() => clearDeliveryAddress('full')}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
                        title="Clear address"
                      >
                        <MdClear className="w-3 h-3" />
                        <span className="hidden sm:inline">Clear</span>
                      </button>
                    )}
                  </div>
                  <AddressPicker
                    value={deliveryLocationNames.full || deliveryLocations.full}
                    onChange={(e) => {
                      const addressId = e.target.value;
                      const displayName = e.target.displayName || getAddressDisplayName(addressId);
                      handleDeliveryLocationChange('full', addressId, displayName);
                    }}
                    placeholder="Select primary delivery address..."
                    className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm min-h-[44px] sm:min-h-0"
                    mealType="full"
                    addresses={selectedUserAddresses}
                    onAddressCreate={createAddressForUser}
                    onAddressDelete={deleteAddressForUser}
                    selectedUserId={selectedUser?.id}
                    disabled={isModalOpen}
                  />
                </div>
              )}

              {/* Meal-Specific Addresses */}
              {selectedMenu && (
                <div className="space-y-3">
                  {(() => {
                    const singleMealType = getSingleMealType(selectedMenu);
                    
                    if (singleMealType) {
                      // For single meal items, show only that meal's address
                      return (
                        <>
                          <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">
                            Required Delivery Address
                          </h4>
                        </>
                      );
                    } else {
                      // For other menu types, show all meal addresses
                      return (
                        <>
                          <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">
                            {selectedMenu.isDailyRateItem ? 'Required Meal-Specific Addresses' : 'Optional Meal-Specific Addresses'}
                          </h4>
                          {selectedMenu.isDailyRateItem && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <MdWarning className="w-4 h-4 text-orange-600" />
                                <p className="text-sm text-orange-800">
                                  For Daily Flexible Rates, each meal type requires its own delivery address.
                                </p>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    }
                  })()}
                   
                  {/* Breakfast Address */}
                  {(() => {
                    const singleMealType = getSingleMealType(selectedMenu);
                    const shouldShowBreakfast = (selectedMenu.hasBreakfast && (!singleMealType || singleMealType === 'breakfast')) || singleMealType === 'breakfast';
                    return shouldShowBreakfast;
                  })() && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-green-600 rounded-md flex items-center justify-center">
                            <MdSchedule className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900">
                            Breakfast Delivery Address
                            {selectedMenu.isDailyRateItem && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <p className="text-xs text-gray-600">
                            {selectedMenu.isDailyRateItem 
                              ? 'Required for Daily Flexible Rates' 
                              : 'Leave empty to use primary address'
                            }
                          </p>
                        </div>
                        </div>
                        {(deliveryLocations.breakfast || deliveryLocationNames.breakfast) && (
                          <button
                            onClick={() => clearDeliveryAddress('breakfast')}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                            title="Clear address"
                          >
                            <MdClear className="w-3 h-3" />
                            Clear
                          </button>
                        )}
                      </div>
                      <AddressPicker
                        value={deliveryLocationNames.breakfast || deliveryLocations.breakfast}
                        onChange={(e) => {
                          const addressId = e.target.value;
                          const displayName = e.target.displayName || getAddressDisplayName(addressId);
                          handleDeliveryLocationChange('breakfast', addressId, displayName);
                        }}
                        placeholder={selectedMenu.isDailyRateItem ? "Select breakfast address (required)" : "Select breakfast address (optional)"}
                        className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-sm"
                        mealType="breakfast"
                        addresses={selectedUserAddresses}
                        onAddressCreate={createAddressForUser}
                        onAddressDelete={deleteAddressForUser}
                        selectedUserId={selectedUser?.id}
                        disabled={isModalOpen}
                      />
                    </div>
                  )}

                  {/* Lunch Address */}
                  {(() => {
                    const singleMealType = getSingleMealType(selectedMenu);
                    const shouldShowLunch = (selectedMenu.hasLunch && (!singleMealType || singleMealType === 'lunch')) || singleMealType === 'lunch';
                    return shouldShowLunch;
                  })() && (
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-yellow-600 rounded-md flex items-center justify-center">
                            <MdSchedule className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900">
                            Lunch Delivery Address
                            {selectedMenu.isDailyRateItem && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <p className="text-xs text-gray-600">
                            {selectedMenu.isDailyRateItem 
                              ? 'Required for Daily Flexible Rates' 
                              : 'Leave empty to use primary address'
                            }
                          </p>
                        </div>
                        </div>
                        {(deliveryLocations.lunch || deliveryLocationNames.lunch) && (
                          <button
                            onClick={() => clearDeliveryAddress('lunch')}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                            title="Clear address"
                          >
                            <MdClear className="w-3 h-3" />
                            Clear
                          </button>
                        )}
                      </div>
                      <AddressPicker
                        value={deliveryLocationNames.lunch || deliveryLocations.lunch}
                        onChange={(e) => {
                          const addressId = e.target.value;
                          const displayName = e.target.displayName || getAddressDisplayName(addressId);
                          handleDeliveryLocationChange('lunch', addressId, displayName);
                        }}
                        placeholder={selectedMenu.isDailyRateItem ? "Select lunch address (required)" : "Select lunch address (optional)"}
                        className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-sm"
                        mealType="lunch"
                        addresses={selectedUserAddresses}
                        onAddressCreate={createAddressForUser}
                        onAddressDelete={deleteAddressForUser}
                        selectedUserId={selectedUser?.id}
                        disabled={isModalOpen}
                      />
                    </div>
                  )}

                  {/* Dinner Address */}
                  {(() => {
                    const singleMealType = getSingleMealType(selectedMenu);
                    const shouldShowDinner = (selectedMenu.hasDinner && (!singleMealType || singleMealType === 'dinner')) || singleMealType === 'dinner';
                    return shouldShowDinner;
                  })() && (
                    <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-red-600 rounded-md flex items-center justify-center">
                            <MdSchedule className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900">
                            Dinner Delivery Address
                            {selectedMenu.isDailyRateItem && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          <p className="text-xs text-gray-600">
                            {selectedMenu.isDailyRateItem 
                              ? 'Required for Daily Flexible Rates' 
                              : 'Leave empty to use primary address'
                            }
                          </p>
                        </div>
                        </div>
                        {(deliveryLocations.dinner || deliveryLocationNames.dinner) && (
                          <button
                            onClick={() => clearDeliveryAddress('dinner')}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                            title="Clear address"
                          >
                            <MdClear className="w-3 h-3" />
                            Clear
                          </button>
                        )}
                      </div>
                      <AddressPicker
                        value={deliveryLocationNames.dinner || deliveryLocations.dinner}
                        onChange={(e) => {
                          const addressId = e.target.value;
                          const displayName = e.target.displayName || getAddressDisplayName(addressId);
                          handleDeliveryLocationChange('dinner', addressId, displayName);
                        }}
                        placeholder={selectedMenu.isDailyRateItem ? "Select dinner address (required)" : "Select dinner address (optional)"}
                        className="w-full px-3 py-2 border border-red-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-sm"
                        mealType="dinner"
                        addresses={selectedUserAddresses}
                        onAddressCreate={createAddressForUser}
                        onAddressDelete={deleteAddressForUser}
                        selectedUserId={selectedUser?.id}
                        disabled={isModalOpen}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Schedule & Save Order</h2>
              <p className="text-gray-600 text-xs sm:text-sm">Select delivery dates and confirm order</p>
            </div>
            
            {/* Date Selection Header */}
            <div className="bg-blue-50 rounded-lg p-2 sm:p-3 border border-blue-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MdSchedule className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-blue-900 text-xs sm:text-sm">Select Delivery Dates</h3>
                    <p className="text-xs text-blue-700 break-words">
                      {selectedMenu && getAutoSelectionDays(selectedMenu) > 0 
                        ? (() => {
                            const days = getAutoSelectionDays(selectedMenu);
                            const menuName = selectedMenu.name?.toLowerCase() || '';
                            // Get selection type from global settings
                            let selectionType = 'consecutive';
                            for (const [menuType, config] of Object.entries(menuTypeConfig)) {
                              if (config.autoDays === days) {
                                selectionType = config.selectionType || 'consecutive';
                                break;
                              }
                            }
                            
                            if (selectionType === 'weekdays_only') {
                              return `Click any date to auto-select next ${days} weekdays from that date`;
                            } else {
                              return `Click any date to auto-select ${days} consecutive days from that date`;
                            }
                          })()
                        : 'Choose your preferred delivery dates'
                      }
                    </p>
                  </div>
                </div>
                {selectedDates.length > 0 && (
                  <button
                    onClick={() => setSelectedDates([])}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors self-start sm:self-auto min-h-[44px] sm:min-h-0"
                    title="Clear all selected dates"
                  >
                    <MdClear className="w-3 h-3" />
                    <span className="hidden sm:inline">Clear Dates</span>
                    <span className="sm:hidden">Clear</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Date Selection */}
            <div className="space-y-3">
                <DateSelector
                  dates={generateDates()}
                  selectedDates={selectedDates}
                  currentDate={currentDate}
                  isMobile={isMobile}
                  onDateSelection={handleDateSelection}
                  onNextDays={goToNextDays}
                  onPreviousDays={goToPreviousDays}
                  formatMonth={formatMonth}
                  formatDayNumber={formatDayNumber}
                  formatDay={formatDay}
                  isToday={isToday}
                  isSelected={isSelected}
                />
              </div>

            {/* Meal Skip Selector */}
            {selectedMenu && selectedDates.length > 0 && (
              <div className="mt-4">
                <MealSkipSelector
                  selectedDates={selectedDates}
                  selectedMenu={selectedMenu}
                  onSkipMealsChange={handleSkipMealsChange}
                  skipMeals={skipMeals}
                  formatDateForDisplay={formatDateForDisplay}
                  isWeekdayMenu={isWeekdayMenu}
                  isWeekday={isWeekday}
                />
              </div>
            )}


          </div>
        );

      default:
        return null;
    }
  };

  // Draft management functions
  const saveDraftOrder = () => {
    if (!selectedUser && !isSeller) {
      showErrorToast('Please select a customer first');
      return;
    }

    if (!selectedMenu) {
      showErrorToast('Please select a menu first');
      return;
    }

    if (selectedDates.length === 0) {
      showErrorToast('Please select at least one delivery date');
      return;
    }

    const draftData = {
      id: draftId || `draft_${Date.now()}`,
      selectedUser,
      selectedMenu,
      selectedDates: selectedDates.map(date => date.toISOString().split('T')[0]),
      deliveryLocations,
      deliveryLocationNames,
      skipMeals,
      dateMenuSelections,
      orderMode,
      dietaryPreference,
      customerName: selectedUser ? 
        `${selectedUser.contacts?.[0]?.firstName || ''}`.trim() :
        `${user?.contacts?.[0]?.firstName || ''}`.trim() || user?.auth?.email || 'N/A'
    };

    // Save draft with automatic cleanup of expired drafts
    const savedDraftId = saveDraftWithCleanup(draftData);
    
    if (savedDraftId) {
      setDraftId(savedDraftId);
      setIsDraftMode(true);
      showSuccessToast(`Order saved as draft successfully! You can continue this order later from the Draft Orders section.`);
    } else {
      showErrorToast('Failed to save draft order. Please try again.');
    }
  };

  const loadDraftOrder = (draft) => {
    setSelectedUser(draft.selectedUser);
    setSelectedMenu(draft.selectedMenu);
    setSelectedDates(draft.selectedDates.map(dateStr => new Date(dateStr)));
    setDeliveryLocations(draft.deliveryLocations || {});
    setDeliveryLocationNames(draft.deliveryLocationNames || {});
    setSkipMeals(draft.skipMeals || {});
    setDateMenuSelections(draft.dateMenuSelections || {});
    setOrderMode(draft.orderMode || 'multiple');
    setDietaryPreference(draft.dietaryPreference || 'veg');
    setDraftId(draft.id);
    setIsDraftMode(true);
    
    // Fetch addresses for the selected user if it's a seller
    if (draft.selectedUser && isSeller) {
      fetchUserAddresses(draft.selectedUser.id);
    }
    
    showSuccessToast(`Draft order loaded successfully! You can now make changes and either update the draft or complete the order.`);
  };

  const deleteDraftOrder = (draftId) => {
    // Clean expired drafts first, then remove the specific draft
    cleanExpiredDrafts();
    
    const existingDrafts = JSON.parse(localStorage.getItem('draftOrders') || '[]');
    const updatedDrafts = existingDrafts.filter(draft => draft.id !== draftId);
    localStorage.setItem('draftOrders', JSON.stringify(updatedDrafts));
    
    if (draftId === draftId) {
      setIsDraftMode(false);
      setDraftId(null);
    }
    
    showSuccessToast('Draft order deleted successfully!');
  };

  const handleSaveOrder = async () => {
    try {
      // Check if user is authenticated
      if (!user || !user.id) {
        showErrorToast('Please login to continue with your order');
        return;
      }

      if (getTotalItems() === 0) {
        showErrorToast('Please select at least one item to order');
        return;
      }

      if (selectedDates.length === 0) {
        showErrorToast('Please select at least one date for your order');
        return;
      }

      if (!selectedMenu) {
        showErrorToast('Please select a menu for your order');
        return;
      }

      // Check if selected menu is completely out of stock
      const productQuantity = getProductQuantity(selectedMenu);
      if (productQuantity && productQuantity.quantity === 0) {
        showErrorToast(`Cannot place order - "${selectedMenu.name}" is Completely Out of Stock (Available: ${productQuantity.quantity})`);
        return;
      }

      // Check address requirements based on menu type
      const singleMealType = getSingleMealType(selectedMenu);
      
      if (singleMealType) {
        // For single meal items, require only that specific meal address
        if (!deliveryLocations[singleMealType]) {
          const mealName = singleMealType.charAt(0).toUpperCase() + singleMealType.slice(1);
          showErrorToast(`Please select a delivery address for ${mealName}`);
          return;
        }
      } else if (selectedMenu.isDailyRateItem) {
        // For daily flexible rates, require individual meal addresses
        const requiredMealAddresses = [];
        if (selectedMenu.hasBreakfast && !deliveryLocations.breakfast) {
          requiredMealAddresses.push('Breakfast');
        }
        if (selectedMenu.hasLunch && !deliveryLocations.lunch) {
          requiredMealAddresses.push('Lunch');
        }
        if (selectedMenu.hasDinner && !deliveryLocations.dinner) {
          requiredMealAddresses.push('Dinner');
        }
        
        if (requiredMealAddresses.length > 0) {
          showErrorToast(`Please select delivery addresses for: ${requiredMealAddresses.join(', ')}`);
          return;
        }
      } else {
        // For other menu types, check if user has provided either primary address or meal-specific addresses
        const hasPrimaryAddress = deliveryLocations.full;
        const hasMealAddresses = deliveryLocations.breakfast || deliveryLocations.lunch || deliveryLocations.dinner;
        
        if (!hasPrimaryAddress && !hasMealAddresses) {
          showErrorToast('Please select at least one delivery address (primary or meal-specific)');
          return;
        }
      }

      const orderItems = [];
      
      // Create order items based on menu type
      // Priority: Single meal items first, then comprehensive, then daily rate, then regular
      if (singleMealType) {
        // For single meal items, create order item for that specific meal
        if (selectedMenu.menuItem) {
          orderItems.push({
            menuItemId: selectedMenu.menuItem.id,
            quantity: selectedDates.length,
            mealType: singleMealType
          });
        } else if (selectedMenu.id) {
          // Fallback: use the menu itself as the menu item
          orderItems.push({
            menuItemId: selectedMenu.id,
            quantity: selectedDates.length,
            mealType: singleMealType
          });
        }
      } else if (selectedMenu.isComprehensiveMenu) {
        if (selectedMenu.mealTypes.breakfast && selectedMenu.mealTypes.breakfast.length > 0) {
          selectedMenu.mealTypes.breakfast.forEach(item => {
            orderItems.push({
              menuItemId: item.id,
              quantity: 1,
              mealType: 'breakfast'
            });
          });
        }
        if (selectedMenu.mealTypes.lunch && selectedMenu.mealTypes.lunch.length > 0) {
          selectedMenu.mealTypes.lunch.forEach(item => {
            orderItems.push({
              menuItemId: item.id,
              quantity: 1,
              mealType: 'lunch'
            });
          });
        }
        if (selectedMenu.mealTypes.dinner && selectedMenu.mealTypes.dinner.length > 0) {
          selectedMenu.mealTypes.dinner.forEach(item => {
            orderItems.push({
              menuItemId: item.id,
              quantity: 1,
              mealType: 'dinner'
            });
          });
        }
      } else if (selectedMenu.isDailyRateItem) {
        if (selectedMenu.menuItem) {
          if (selectedMenu.hasBreakfast) {
            orderItems.push({
              menuItemId: selectedMenu.menuItem.id,
              quantity: selectedDates.length,
              mealType: 'breakfast'
            });
          }
          if (selectedMenu.hasLunch) {
            orderItems.push({
              menuItemId: selectedMenu.menuItem.id,
              quantity: selectedDates.length,
              mealType: 'lunch'
            });
          }
          if (selectedMenu.hasDinner) {
            orderItems.push({
              menuItemId: selectedMenu.menuItem.id,
              quantity: selectedDates.length,
              mealType: 'dinner'
            });
          }
        }
      } else {
        // Regular menu
        if (selectedMenu.menuItem) {
          if (selectedMenu.hasBreakfast) {
            orderItems.push({
              menuItemId: selectedMenu.menuItem.id,
              quantity: selectedDates.length,
              mealType: 'breakfast'
            });
          }
          if (selectedMenu.hasLunch) {
            orderItems.push({
              menuItemId: selectedMenu.menuItem.id,
              quantity: selectedDates.length,
              mealType: 'lunch'
            });
          }
          if (selectedMenu.hasDinner) {
            orderItems.push({
              menuItemId: selectedMenu.menuItem.id,
              quantity: selectedDates.length,
              mealType: 'dinner'
            });
          }
        }
      }

      // Create order times
      const orderTimes = [];
      if (singleMealType) {
        // For single meal items, only add that specific meal time
        orderTimes.push(singleMealType.charAt(0).toUpperCase() + singleMealType.slice(1));
      } else {
        // For other menu types, add all available meal times
        if (selectedMenu.hasBreakfast) orderTimes.push('Breakfast');
        if (selectedMenu.hasLunch) orderTimes.push('Lunch');
        if (selectedMenu.hasDinner) orderTimes.push('Dinner');
      }

      // Use primary address if available, otherwise use the first meal-specific address
      let primaryAddressId;
      if (singleMealType) {
        // For single meal items, use the specific meal address
        primaryAddressId = deliveryLocations[singleMealType];
      } else {
        // For other menu types, use primary or first meal-specific address
        primaryAddressId = deliveryLocations.full || 
          deliveryLocations.breakfast || 
          deliveryLocations.lunch || 
          deliveryLocations.dinner;
      }
      
      const orderData = {
        orderDate: selectedDates.length > 0 ? selectedDates[0].toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        orderTimes: orderTimes,
        orderItems: orderItems,
        deliveryAddressId: primaryAddressId,
        deliveryLocations: singleMealType ? {
          [singleMealType]: deliveryLocations[singleMealType] || null,
        } : {
          breakfast: deliveryLocations.breakfast || null,
          lunch: deliveryLocations.lunch || null,
          dinner: deliveryLocations.dinner || null,
        },
        selectedDates: selectedDates.map(date => date.toISOString().split('T')[0]),
        orderMode: orderMode,
        menuId: selectedMenu.menuId,
        menuName: selectedMenu.name,
        skipMeals: skipMeals,

        userId: selectedUser?.id || user?.id,
        // Include customer name for display
        customerName: selectedUser ? 
          `${selectedUser.contacts?.[0]?.firstName || ''}`.trim() :
          `${user?.contacts?.[0]?.firstName || ''}`.trim() || user?.auth?.email || 'N/A'
      };

      // Ensure userId is always set
      if (!orderData.userId) {
        showErrorToast('User ID is missing. Please try logging in again.');
        return;
      }

      // Don't create order yet - save order data for payment
      const orderDataForPayment = {
        ...orderData,
        orderDate: selectedDates[0]?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        menu: selectedMenu,
        items: [],
        deliveryLocationNames: deliveryLocationNames,
        totalPrice: getTotalPrice(),
        isDailyRateItem: selectedMenu.isDailyRateItem,
        // Add delivery address information for display in payment page
        deliveryAddress: selectedUserAddresses.length > 0 ? {
          housename: selectedUserAddresses[0].housename || '',
          street: selectedUserAddresses[0].street || '',
          city: selectedUserAddresses[0].city || '',
          pincode: selectedUserAddresses[0].pincode || '',
          state: selectedUserAddresses[0].state || '',
          landmark: selectedUserAddresses[0].landmark || ''
        } : null
      };

      setSavedOrder(orderDataForPayment);
      showOrderSuccess('Order data prepared! Proceed to payment to confirm your order.');

      // Clear draft data if this was a draft order
      if (isDraftMode && draftId) {
        deleteDraftOrder(draftId);
        setIsDraftMode(false);
        setDraftId(null);
      }

      // Save order data to localStorage for payment page
      localStorage.setItem('savedOrder', JSON.stringify(orderDataForPayment));
      
      // Redirect to payment page with order data
      navigate('/jkhm/process-payment', { 
        state: { orderData: orderDataForPayment } 
      });

    } catch (error) {
      // Check if it's an admin order blocking error
      if (handleOrderError(error)) {
        return;
      }
      
      // Check if it's a database connection error
      if (error.message && error.message.includes('database')) {
        showErrorToast('Database connection failed. Please check your connection and try again.', 'Database Error');
      } else {
        showOrderError(error.message || 'Failed to create order. Please try again.');
      }
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 ${isModalOpen ? 'modal-open' : ''}`}>
      <div className="max-w-7xl mx-auto px-3 py-4 pt-8">
        {/* Professional Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-4">
          <div className="px-3 sm:px-4 py-3 border-b border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-semibold text-slate-800">Create Customer Order</h1>
                <p className="text-slate-600 mt-1 text-xs sm:text-sm">Set up a new order for your customer</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {currentStep >= 3 && (
                  <button
                    onClick={() => {
                      // Blur any currently focused elements to prevent form validation
                      const activeElement = document.activeElement;
                      if (activeElement && activeElement.blur) {
                        activeElement.blur();
                      }
                      setIsModalOpen(true);
                      setShowCancelConfirm(true);
                    }}
                    className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 shadow-sm min-h-[44px] sm:min-h-0"
                  >
                    <MdClear className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Cancel Order</span>
                    <span className="sm:hidden">Cancel</span>
                  </button>
                )}
                <button
                  onClick={() => navigate('/jkhm/seller')}
                  className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 shadow-sm min-h-[44px] sm:min-h-0"
                >
                  <MdDashboard className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Home</span>
                </button>
                {isSeller && (
                  <button
                    onClick={() => navigate('/jkhm/seller/customers')}
                    className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 shadow-sm min-h-[44px] sm:min-h-0"
                  >
                    <MdPeople className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Customer List</span>
                    <span className="sm:hidden">Customers</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Professional Step Progress */}
          <div className="px-3 sm:px-4 py-3">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center">
                    <div className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 transition-all duration-200 ${
                      currentStep >= step.id
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}>
                      {currentStep > step.id ? (
                        <MdCheckCircle className="text-xs sm:text-sm" />
                      ) : (
                        <step.icon className="text-xs sm:text-sm" />
                      )}
                    </div>
                    
                    <div className="ml-1 sm:ml-2 hidden md:block">
                      <div className={`text-xs font-medium transition-colors ${
                        currentStep >= step.id ? 'text-slate-800' : 'text-slate-500'
                      }`}>
                        {step.title}
                      </div>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 sm:mx-2 transition-colors ${
                      currentStep > step.id ? 'bg-blue-600' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            
            {/* Mobile Step Title */}
            <div className="mt-2 md:hidden">
              <div className={`text-xs font-medium text-center transition-colors ${
                currentStep >= 1 ? 'text-slate-800' : 'text-slate-500'
              }`}>
                {steps[currentStep - 1]?.title}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Column - Wizard Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="p-3 sm:p-4">
                {renderStepContent()}
              </div>
              
              {/* Professional Navigation */}
              <div className="px-3 sm:px-4 py-3 bg-slate-50 border-t border-slate-200 rounded-b-lg">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={prevStep}
                      disabled={currentStep === 1}
                      className={`flex items-center justify-center px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-none min-h-[44px] sm:min-h-0 ${
                        currentStep === 1
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                      }`}
                    >
                      <MdArrowBack className="mr-1 text-sm sm:text-base" />
                      <span className="hidden sm:inline">Previous</span>
                      <span className="sm:hidden">Prev</span>
                    </button>
                    
                    <div className="text-xs text-slate-500 px-2 sm:px-3 whitespace-nowrap">
                      Step {currentStep} of {steps.length}
                    </div>
                    
                    {currentStep < steps.length ? (
                      <button
                        onClick={nextStep}
                        disabled={!canProceed()}
                        className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-none min-h-[44px] sm:min-h-0 ${
                          !canProceed()
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                        }`}
                      >
                        <span className="hidden sm:inline">Next</span>
                        <span className="sm:hidden">Next</span>
                        <MdArrowForward className="ml-1 text-sm sm:text-base" />
                      </button>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {/* Save as Draft Button - Only for sellers */}
                        {isSeller && (
                          <button
                            onClick={saveDraftOrder}
                            disabled={!selectedUser || !selectedMenu || selectedDates.length === 0}
                            className={`flex items-center justify-center px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-none min-h-[44px] sm:min-h-0 ${
                              !selectedUser || !selectedMenu || selectedDates.length === 0
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm'
                            }`}
                          >
                            <MdEdit className="mr-1 text-sm sm:text-base" />
                            <span className="hidden sm:inline">{isDraftMode ? 'Update Draft' : 'Save as Draft'}</span>
                            <span className="sm:hidden">{isDraftMode ? 'Update' : 'Draft'}</span>
                          </button>
                        )}
                        
                        {/* Save Order Button */}
                        <button
                          onClick={handleSaveOrder}
                          disabled={!canProceed() || isCreating}
                          className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-none min-h-[44px] sm:min-h-0 ${
                            !canProceed() || isCreating
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                          }`}
                        >
                          {isCreating ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                              <span className="text-xs sm:text-sm">Saving...</span>
                            </>
                          ) : (
                            <>
                              <span className="hidden sm:inline">Save Order</span>
                              <span className="sm:hidden">Save</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Professional Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">

              <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="px-3 py-2 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-base font-semibold text-slate-800">Order Summary</h3>
                    {isDraftMode && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                        Draft
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-3 space-y-3">
                  {selectedUser && (
                   <div className="mb-4 p-2 sm:p-3 bg-blue-50 rounded-lg">
                     <div className="text-xs sm:text-sm font-medium text-blue-900 mb-1">Customer</div>
                     <div className="text-blue-700 text-sm">
                       {selectedUser.contacts?.[0]?.firstName}
                     </div>
                     <div className="text-blue-600 text-xs mt-1">
                       {selectedUser.contacts?.[0]?.phoneNumbers?.[0]?.number}
                     </div>
                   </div>
                 )}
                 
                 {selectedMenu && (
                   <div className="mb-4 p-2 sm:p-3 bg-green-50 rounded-lg">
                     <div className="text-xs sm:text-sm font-medium text-green-900 mb-1">Menu Package</div>
                     <div className="text-green-700 font-semibold text-xs sm:text-sm break-words">{selectedMenu.name}</div>
                     {selectedMenu.categories && (
                       <div className="text-green-600 text-xs mt-1">
                         {selectedMenu.categories.map(cat => cat.name).join(', ')}
                       </div>
                     )}
                     <div className="text-green-600 font-bold mt-2 text-sm sm:text-base">₹{selectedMenu.price}</div>
                     {selectedMenu.isDailyRateItem && (
                       <div className="text-green-600 text-xs mt-1">Daily Rate Item</div>
                     )}
                     {selectedMenu.isComprehensiveMenu && (
                       <div className="text-green-600 text-xs mt-1">Comprehensive Menu</div>
                     )}
                   </div>
                 )}
                 
                 {(deliveryLocations.full || deliveryLocations.breakfast || deliveryLocations.lunch || deliveryLocations.dinner) && (
                   <div className="mb-4 p-2 sm:p-3 bg-purple-50 rounded-lg">
                     <div className="text-xs sm:text-sm font-medium text-purple-900 mb-1">
                       {selectedMenu && selectedMenu.isDailyRateItem ? 'Meal Delivery Addresses' : 'Delivery Addresses'}
                     </div>
                     {deliveryLocations.full && !selectedMenu?.isDailyRateItem && (
                       <div className="text-purple-700 text-xs mb-1 break-words">
                         <span className="font-medium">Primary:</span> {deliveryLocationNames.full || 'Selected'}
                       </div>
                     )}
                     {deliveryLocations.breakfast && (
                       <div className="text-purple-700 text-xs mb-1 break-words">
                         <span className="font-medium">Breakfast:</span> {deliveryLocationNames.breakfast || 'Selected'}
                       </div>
                     )}
                     {deliveryLocations.lunch && (
                       <div className="text-purple-700 text-xs mb-1 break-words">
                         <span className="font-medium">Lunch:</span> {deliveryLocationNames.lunch || 'Selected'}
                       </div>
                     )}
                     {deliveryLocations.dinner && (
                       <div className="text-purple-700 text-xs break-words">
                         <span className="font-medium">Dinner:</span> {deliveryLocationNames.dinner || 'Selected'}
                       </div>
                     )}
                     {selectedMenu && selectedMenu.isDailyRateItem && (
                       <div className="text-purple-600 text-xs mt-2 font-medium">
                         ✓ Individual addresses configured for each meal
                       </div>
                     )}
                   </div>
                 )}
                 
                 {selectedDates.length > 0 && (
                   <div className="mb-4 p-2 sm:p-3 bg-indigo-50 rounded-lg">
                     <div className="text-xs sm:text-sm font-medium text-indigo-900 mb-1">Delivery Schedule</div>
                     <div className="text-indigo-700 text-xs sm:text-sm">
                       {selectedDates.length} day{selectedDates.length !== 1 ? 's' : ''} selected
                     </div>
                     {selectedDates.length > 0 && (
                       <div className="text-indigo-600 text-xs mt-1">
                         {(() => {
                           if (selectedDates.length === 1) {
                             return formatDateForDisplay(selectedDates[0]);
                           } else {
                             const sortedDates = [...selectedDates].sort((a, b) => a - b);
                             const startDate = sortedDates[0];
                             const endDate = sortedDates[sortedDates.length - 1];
                             
                             const startMonth = startDate.toLocaleDateString('en-US', { month: 'long' });
                             const startDay = startDate.getDate();
                             const endMonth = endDate.toLocaleDateString('en-US', { month: 'long' });
                             const endDay = endDate.getDate();
                             
                             if (startMonth === endMonth) {
                               return `${startMonth} ${startDay} to ${endDay}`;
                             } else {
                               return `${startMonth} ${startDay} to ${endMonth} ${endDay}`;
                             }
                           }
                         })()}
                       </div>
                     )}
                   </div>
                 )}

                 {Object.keys(skipMeals).length > 0 && (
                   <div className="mb-4 p-2 sm:p-3 bg-orange-50 rounded-lg">
                     <div className="text-xs sm:text-sm font-medium text-orange-900 mb-1">Skipped Meals</div>
                     <div className="space-y-1">
                       {Object.entries(skipMeals).map(([dateStr, meals]) => {
                         const date = new Date(dateStr);
                         const skippedMealTypes = [];
                         if (meals.breakfast) skippedMealTypes.push('Breakfast');
                         if (meals.lunch) skippedMealTypes.push('Lunch');
                         if (meals.dinner) skippedMealTypes.push('Dinner');
                         
                         if (skippedMealTypes.length === 0) return null;
                         
                         return (
                           <div key={dateStr} className="text-xs text-orange-700">
                             <span className="font-medium">{formatDateForDisplay(date)}:</span> {skippedMealTypes.join(', ')}
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 )}
                 
                 {selectedMenu && (
                   <div className="pt-3 sm:pt-4 border-t border-gray-200">
                     <div className="space-y-2">
                       <div className="flex justify-between items-center">
                         <span className="text-xs sm:text-sm text-gray-600">Items:</span>
                         <span className="text-xs sm:text-sm font-medium text-gray-900">{getTotalItems()}</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-xs sm:text-sm text-gray-600">Days:</span>
                         <span className="text-xs sm:text-sm font-medium text-gray-900">{selectedDates.length}</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-sm sm:text-lg font-semibold text-gray-900">Total:</span>
                         <span className="text-lg sm:text-2xl font-bold text-blue-600">₹{getTotalPrice()}</span>
                       </div>
                     </div>
                   </div>
                 )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Selection Popup */}
      <Modal
        title={
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <MdCheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-base sm:text-lg font-semibold text-gray-900">Menu Package Selected</span>
          </div>
        }
        open={showMenuPopup}
        onCancel={() => setShowMenuPopup(false)}
        footer={[
          <button
            key="ok"
            onClick={() => setShowMenuPopup(false)}
            className="px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 font-medium text-sm sm:text-base min-h-[44px] sm:min-h-0 w-full sm:w-auto"
          >
            Continue
          </button>
        ]}
        width="95%"
        style={{ 
          maxWidth: '400px',
          top: '5%'
        }}
        styles={{
          body: { textAlign: 'center', padding: '16px 20px' }
        }}
        maskClosable={true}
        closable={true}
        destroyOnHidden={true}
        wrapClassName="menu-selection-modal"
      >
        <div className="text-center">
          <div className="mb-3 sm:mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <MdCheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{menuPopupMessage}</p>
          </div>
        </div>
      </Modal>
      
      {/* Admin Order Blocked Modal */}
      <AdminOrderBlockedModal
        visible={showAdminBlockModal}
        onClose={closeAdminBlockModal}
        onSwitchAccount={handleSwitchAccount}
      />
      
      {/* Order Success Popup */}
      <OrderSuccessPopup
        visible={showOrderSuccessPopup}
        onClose={() => setShowOrderSuccessPopup(false)}
        orderDetails={orderSuccessDetails}
      />

      {/* Cancel Order Confirmation Modal */}
      <Modal
        title="Cancel Order"
        open={showCancelConfirm}
        onOk={(e) => {
          e.preventDefault();
          // Clear any draft data and navigate to customer list
          if (isDraftMode && draftId) {
            deleteDraftOrder(draftId);
          }
          setIsModalOpen(false);
          navigate('/jkhm/seller/customers');
        }}
        onCancel={() => {
          setIsModalOpen(false);
          setShowCancelConfirm(false);
        }}
        okText="Yes, Cancel Order"
        cancelText="Keep Order"
        okType="danger"
        maskClosable={false}
        keyboard={false}
        destroyOnClose={true}
        width="95%"
        style={{ 
          maxWidth: '400px',
          top: '10%'
        }}
        styles={{
          body: { padding: '16px 20px' }
        }}
        afterClose={() => {
          setIsModalOpen(false);
          // Prevent any form validation from triggering
          const activeElement = document.activeElement;
          if (activeElement && activeElement.blur) {
            activeElement.blur();
          }
        }}
      >
        <p className="text-sm sm:text-base">Are you sure you want to cancel this order? This action cannot be undone and all order data will be lost.</p>
      </Modal>
    </div>
  );
};

export default BookingWizardPage;
