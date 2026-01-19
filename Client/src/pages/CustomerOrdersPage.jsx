import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal } from 'antd';
import { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast 
} from '../utils/toastConfig.jsx';
import { 
  MdArrowBack,
  MdPerson,
  MdPhone,
  MdEmail,
  MdLocationOn,
  MdShoppingCart,
  MdAttachMoney,
  MdCalendarToday,
  MdReceipt,
  MdLocalShipping,
  MdCheckCircle,
  MdPending,
  MdCancel,
  MdRefresh,
  MdFilterList,
  MdSearch,
  MdClear,
  MdVisibility,
  MdOpenInNew,
  MdNote,
  MdEdit,
  MdSave,
  MdClose,
  MdArrowForward
} from 'react-icons/md';
import useAuthStore from '../stores/Zustand.store';
import { useSeller } from '../hooks/sellerHooks/useSeller';
import { SkeletonTable, SkeletonCard, SkeletonOrderList } from '../components/Skeleton';

const CustomerOrdersPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, roles } = useAuthStore();
  const { getUserOrders, cancelOrder, cancelDeliveryItem, updateDeliveryNote, updateDeliveryItemsNoteByDate, updateDeliveryItemsNoteByDateRange } = useSeller();
  
  // Get customer data from navigation state
  const customer = location.state?.customer;
  
  // State management
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedOrders, setExpandedOrders] = useState({});
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    datePreset: 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
    sortBy: 'recent',
    showFilters: false
  });

  // Delivery items filter states for each order
  const [deliveryItemFilters, setDeliveryItemFilters] = useState({});
  
  // Confirmation modal states
  const [showCancelOrderModal, setShowCancelOrderModal] = useState(false);
  const [showCancelItemModal, setShowCancelItemModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [itemToCancel, setItemToCancel] = useState(null);
  
  // Delivery note modal state
  const [showDeliveryNoteModal, setShowDeliveryNoteModal] = useState(false);
  const [selectedOrderNote, setSelectedOrderNote] = useState(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editedNote, setEditedNote] = useState('');
  
  // Delivery items note by date modal state
  const [showDeliveryItemsNoteModal, setShowDeliveryItemsNoteModal] = useState(false);
  const [selectedOrderForDateNote, setSelectedOrderForDateNote] = useState(null);
  const [selectedDateForNote, setSelectedDateForNote] = useState(null);
  const [isEditingDateNote, setIsEditingDateNote] = useState(false);
  const [editedDateNote, setEditedDateNote] = useState('');
  
  // Calendar and date range state
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedOrderForCalendar, setSelectedOrderForCalendar] = useState(null);
  const [selectedSession, setSelectedSession] = useState('all'); // 'all', 'Breakfast', 'Lunch', 'Dinner'
  const [selectedDateRange, setSelectedDateRange] = useState({ from: null, to: null });
  const [calendarCurrentDate, setCalendarCurrentDate] = useState(new Date());
  const [calendarNote, setCalendarNote] = useState('');
  const [isEditingCalendarNote, setIsEditingCalendarNote] = useState(false);

  // Fetch customer orders on component mount
  useEffect(() => {
    if (customer?.id && user && roles?.includes('SELLER')) {
      fetchCustomerOrders();
    }
  }, [customer, user, roles]);

  // Apply filters whenever orders or filters change
  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const fetchCustomerOrders = async () => {
    if (!customer?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getUserOrders(customer.id);
      setOrders(result || []);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      setError(error.message || 'Failed to fetch orders');
      showErrorToast('Failed to fetch customer orders');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters to orders
  const applyFilters = () => {
    let filtered = [...orders];

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Date preset filter
    if (filters.datePreset !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (filters.datePreset) {
        case 'today':
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate >= today && orderDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          });
          break;
        case 'tomorrow':
          const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
          const dayAfterTomorrow = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate >= tomorrow && orderDate < dayAfterTomorrow;
          });
          break;
        case 'thisWeek':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate >= startOfWeek && orderDate < endOfWeek;
          });
          break;
        case 'nextWeek':
          const nextWeekStart = new Date(today);
          nextWeekStart.setDate(today.getDate() - today.getDay() + 7);
          const nextWeekEnd = new Date(nextWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate >= nextWeekStart && orderDate < nextWeekEnd;
          });
          break;
        case 'thisMonth':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          endOfMonth.setHours(23, 59, 59, 999);
          filtered = filtered.filter(order => {
            const orderDate = new Date(order.orderDate);
            return orderDate >= startOfMonth && orderDate <= endOfMonth;
          });
          break;
      }
    }

    // Custom date range filter (overrides preset if both are set)
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(order => new Date(order.orderDate) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(order => new Date(order.orderDate) <= toDate);
    }

    // Search filter (order ID, customer name, etc.)
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm) ||
        (customer?.firstName && customer.firstName.toLowerCase().includes(searchTerm)) ||
        (customer?.lastName && customer.lastName.toLowerCase().includes(searchTerm))
      );
    }

    // Sort orders
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'recent':
          return new Date(b.orderDate) - new Date(a.orderDate);
        case 'oldest':
          return new Date(a.orderDate) - new Date(b.orderDate);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'priceHigh':
          return (b.totalPrice || 0) - (a.totalPrice || 0);
        case 'priceLow':
          return (a.totalPrice || 0) - (b.totalPrice || 0);
        default:
          return new Date(b.orderDate) - new Date(a.orderDate);
      }
    });

    setFilteredOrders(filtered);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: 'all',
      datePreset: 'all',
      dateFrom: '',
      dateTo: '',
      search: '',
      sortBy: 'recent',
      showFilters: false
    });
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle delivery item filter changes
  const handleDeliveryItemFilterChange = (orderId, key, value) => {
    setDeliveryItemFilters(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [key]: value
      }
    }));
  };

  // Get filtered delivery items for a specific order
  const getFilteredDeliveryItems = (orderId, deliveryItems) => {
    if (!deliveryItems || !deliveryItemFilters[orderId]) {
      return deliveryItems;
    }

    const filters = deliveryItemFilters[orderId];
    let filtered = [...deliveryItems];

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // Time slot filter
    if (filters.timeSlot && filters.timeSlot !== 'all') {
      filtered = filtered.filter(item => item.deliveryTimeSlot === filters.timeSlot);
    }

    // Date preset filter
    if (filters.datePreset && filters.datePreset !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (filters.datePreset) {
        case 'today':
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.deliveryDate);
            return itemDate >= today && itemDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          });
          break;
        case 'tomorrow':
          const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
          const dayAfterTomorrow = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.deliveryDate);
            return itemDate >= tomorrow && itemDate < dayAfterTomorrow;
          });
          break;
        case 'thisWeek':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.deliveryDate);
            return itemDate >= startOfWeek && itemDate < endOfWeek;
          });
          break;
        case 'nextWeek':
          const nextWeekStart = new Date(today);
          nextWeekStart.setDate(today.getDate() - today.getDay() + 7);
          const nextWeekEnd = new Date(nextWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.deliveryDate);
            return itemDate >= nextWeekStart && itemDate < nextWeekEnd;
          });
          break;
        case 'thisMonth':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          endOfMonth.setHours(23, 59, 59, 999);
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.deliveryDate);
            return itemDate >= startOfMonth && itemDate <= endOfMonth;
          });
          break;
      }
    }

    // Sort items
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'dateRecent':
            return new Date(b.deliveryDate) - new Date(a.deliveryDate);
          case 'dateOldest':
            return new Date(a.deliveryDate) - new Date(b.deliveryDate);
          case 'name':
            return (a.menuItem?.name || '').localeCompare(b.menuItem?.name || '');
          case 'timeSlot':
            return (a.deliveryTimeSlot || '').localeCompare(b.deliveryTimeSlot || '');
          case 'status':
            return a.status.localeCompare(b.status);
          default:
            return 0;
        }
      });
    }

    return filtered;
  };

  // Clear delivery item filters for a specific order
  const clearDeliveryItemFilters = (orderId) => {
    setDeliveryItemFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[orderId];
      return newFilters;
    });
  };

  // Handle back navigation
  const handleBack = () => {
    navigate('/jkhm/seller/customers');
  };

  // Handle cancel order
  const handleCancelOrder = (orderId) => {
    setOrderToCancel(orderId);
    setShowCancelOrderModal(true);
  };

  // Confirm cancel order
  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;
    
    setLoading(true);
    try {
      // Make API call to cancel order
      await cancelOrder(orderToCancel);
      
      // Refresh orders to get updated statuses
      await fetchCustomerOrders();
      
      showSuccessToast('Order cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      showErrorToast(error.message || 'Failed to cancel order');
    } finally {
      setLoading(false);
      setShowCancelOrderModal(false);
      setOrderToCancel(null);
    }
  };

  // Handle cancel delivery item
  const handleCancelDeliveryItem = (itemId) => {
    setItemToCancel(itemId);
    setShowCancelItemModal(true);
  };

  // Confirm cancel delivery item
  const confirmCancelDeliveryItem = async () => {
    if (!itemToCancel) return;
    
    setLoading(true);
    try {
      // Make API call to cancel delivery item
      await cancelDeliveryItem(itemToCancel);
      
      // Refresh orders to get updated statuses (order might be auto-cancelled)
      await fetchCustomerOrders();
      
      showSuccessToast('Delivery item cancelled successfully');
    } catch (error) {
      console.error('Error cancelling delivery item:', error);
      showErrorToast(error.message || 'Failed to cancel delivery item');
    } finally {
      setLoading(false);
      setShowCancelItemModal(false);
      setItemToCancel(null);
    }
  };

  // Handle view payment receipts - open in new tab
  const handleViewReceipts = (order) => {
    // Find the first available receipt
    let receiptUrl = null;
    
    if (order.payments && order.payments.length > 0) {
      for (const payment of order.payments) {
        // Check detailed receipt records first (preferred)
        if (payment.paymentReceipts && payment.paymentReceipts.length > 0) {
          receiptUrl = payment.paymentReceipts[0].receiptImageUrl || payment.paymentReceipts[0].receipt;
          break;
        }
        // Check direct receipt URL if no detailed records exist
        else if (payment.receiptUrl) {
          receiptUrl = payment.receiptUrl;
          break;
        }
      }
    }
    
    // Open receipt in new tab
    if (receiptUrl) {
      window.open(`http://localhost:5000${receiptUrl}`, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle view delivery note
  const handleViewDeliveryNote = (order) => {
    setSelectedOrderNote({
      orderId: order.id,
      deliveryNote: order.deliveryNote,
      orderDate: order.orderDate
    });
    setEditedNote(order.deliveryNote || '');
    // If there's no note, open in edit mode automatically
    setIsEditingNote(!order.deliveryNote);
    setShowDeliveryNoteModal(true);
  };

  // Handle edit delivery note
  const handleEditNote = () => {
    setIsEditingNote(true);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditedNote(selectedOrderNote?.deliveryNote || '');
    setIsEditingNote(false);
  };

  // Handle save delivery note
  const handleSaveNote = async () => {
    if (!selectedOrderNote) return;
    
    setLoading(true);
    try {
      await updateDeliveryNote(selectedOrderNote.orderId, editedNote);
      
      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedOrderNote.orderId
            ? { ...order, deliveryNote: editedNote || null }
            : order
        )
      );
      
      // Update selected order note
      setSelectedOrderNote(prev => ({
        ...prev,
        deliveryNote: editedNote || null
      }));
      
      setIsEditingNote(false);
      showSuccessToast('Delivery note updated successfully');
    } catch (error) {
      console.error('Error updating delivery note:', error);
      showErrorToast(error.message || 'Failed to update delivery note');
    } finally {
      setLoading(false);
    }
  };

  // Group delivery items by date
  const groupDeliveryItemsByDate = (deliveryItems) => {
    if (!deliveryItems || deliveryItems.length === 0) return {};
    
    const grouped = {};
    deliveryItems.forEach(item => {
      const dateKey = item.deliveryDate ? new Date(item.deliveryDate).toISOString().split('T')[0] : 'unknown';
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(item);
    });
    
    return grouped;
  };

  // Get dates with delivery items filtered by session
  const getDatesBySession = (deliveryItems, session) => {
    if (!deliveryItems || deliveryItems.length === 0) return new Set();
    
    const dateSet = new Set();
    deliveryItems.forEach(item => {
      // Map database values to frontend values
      const itemSession = item.deliveryTimeSlot === 'BREAKFAST' ? 'Breakfast' :
                         item.deliveryTimeSlot === 'LUNCH' ? 'Lunch' :
                         item.deliveryTimeSlot === 'DINNER' ? 'Dinner' : item.deliveryTimeSlot;
      
      if (session === 'all' || itemSession === session) {
        const dateKey = item.deliveryDate ? new Date(item.deliveryDate).toISOString().split('T')[0] : null;
        if (dateKey) {
          dateSet.add(dateKey);
        }
      }
    });
    
    return dateSet;
  };

  // Generate calendar dates (month view)
  const generateCalendarDates = (startDate) => {
    const dates = [];
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first day of the week that contains the first day of the month
    const startDateCal = new Date(firstDay);
    startDateCal.setDate(startDateCal.getDate() - startDateCal.getDay());
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDateCal);
      date.setDate(startDateCal.getDate() + i);
      dates.push(date);
    }
    
    return dates;
  };

  // Check if date has delivery items for selected session
  const dateHasItems = (date, deliveryItems, session) => {
    const dateStr = date.toISOString().split('T')[0];
    return deliveryItems.some(item => {
      const itemDate = item.deliveryDate ? new Date(item.deliveryDate).toISOString().split('T')[0] : null;
      if (itemDate !== dateStr) return false;
      
      if (session === 'all') return true;
      
      const itemSession = item.deliveryTimeSlot === 'BREAKFAST' ? 'Breakfast' :
                         item.deliveryTimeSlot === 'LUNCH' ? 'Lunch' :
                         item.deliveryTimeSlot === 'DINNER' ? 'Dinner' : item.deliveryTimeSlot;
      return itemSession === session;
    });
  };

  // Check if date is in selected range
  const isDateInRange = (date, fromDate, toDate) => {
    if (!fromDate || !toDate) return false;
    const dateStr = date.toISOString().split('T')[0];
    const fromStr = fromDate.toISOString().split('T')[0];
    const toStr = toDate.toISOString().split('T')[0];
    return dateStr >= fromStr && dateStr <= toStr;
  };

  // Handle calendar date click
  const handleCalendarDateClick = (date) => {
    if (!selectedOrderForCalendar) return;
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Check if date has items for selected session
    if (!dateHasItems(date, selectedOrderForCalendar.deliveryItems, selectedSession)) {
      return;
    }
    
    // If no range selected, set as from date
    if (!selectedDateRange.from) {
      setSelectedDateRange({ from: date, to: null });
      setCalendarNote('');
      setIsEditingCalendarNote(false);
    } else if (!selectedDateRange.to) {
      // If from date is set, set as to date
      let newFrom = selectedDateRange.from;
      let newTo = date;
      
      if (date < selectedDateRange.from) {
        newFrom = date;
        newTo = selectedDateRange.from;
      }
      
      setSelectedDateRange({ from: newFrom, to: newTo });
      
      // Load existing note for the range
      loadNoteForDateRange(newFrom, newTo);
    } else {
      // Reset and set new from date
      setSelectedDateRange({ from: date, to: null });
      setCalendarNote('');
      setIsEditingCalendarNote(false);
    }
  };

  // Load existing note for date range
  const loadNoteForDateRange = (fromDate, toDate) => {
    if (!selectedOrderForCalendar) return;
    
    const fromStr = fromDate.toISOString().split('T')[0];
    const toStr = toDate.toISOString().split('T')[0];
    
    // Find items in the range with the selected session
    const itemsInRange = selectedOrderForCalendar.deliveryItems.filter(item => {
      const itemDate = item.deliveryDate ? new Date(item.deliveryDate).toISOString().split('T')[0] : null;
      if (!itemDate || itemDate < fromStr || itemDate > toStr) return false;
      
      if (selectedSession !== 'all') {
        const itemSession = item.deliveryTimeSlot === 'BREAKFAST' ? 'Breakfast' :
                           item.deliveryTimeSlot === 'LUNCH' ? 'Lunch' :
                           item.deliveryTimeSlot === 'DINNER' ? 'Dinner' : item.deliveryTimeSlot;
        return itemSession === selectedSession;
      }
      return true;
    });
    
    // Get note from first item (all should have same note)
    const existingNote = itemsInRange[0]?.deliveryNote || '';
    setCalendarNote(existingNote);
    setIsEditingCalendarNote(false);
  };

  // Handle open calendar modal
  const handleOpenCalendarModal = (order) => {
    setSelectedOrderForCalendar(order);
    setSelectedSession('all');
    setSelectedDateRange({ from: null, to: null });
    setCalendarNote('');
    setIsEditingCalendarNote(false);
    
    // Set calendar to show first delivery date
    if (order.deliveryItems && order.deliveryItems.length > 0) {
      const firstDate = new Date(order.deliveryItems[0].deliveryDate);
      setCalendarCurrentDate(new Date(firstDate.getFullYear(), firstDate.getMonth(), 1));
    }
    
    setShowCalendarModal(true);
  };

  // Handle save calendar note (date range)
  const handleSaveCalendarNote = async () => {
    if (!selectedOrderForCalendar || !selectedDateRange.from) return;
    
    // If only from date is selected, use it as both from and to
    const fromDate = selectedDateRange.from;
    const toDate = selectedDateRange.to || selectedDateRange.from;
    
    setLoading(true);
    try {
      await updateDeliveryItemsNoteByDateRange(
        selectedOrderForCalendar.id,
        fromDate.toISOString().split('T')[0],
        toDate.toISOString().split('T')[0],
        calendarNote,
        selectedSession !== 'all' ? selectedSession : null
      );
      
      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.id === selectedOrderForCalendar.id) {
            const updatedItems = order.deliveryItems.map(item => {
              const itemDate = item.deliveryDate ? new Date(item.deliveryDate).toISOString().split('T')[0] : null;
              const fromStr = fromDate.toISOString().split('T')[0];
              const toStr = toDate.toISOString().split('T')[0];
              
              if (itemDate && itemDate >= fromStr && itemDate <= toStr) {
                // Check session filter
                if (selectedSession !== 'all') {
                  const itemSession = item.deliveryTimeSlot === 'BREAKFAST' ? 'Breakfast' :
                                     item.deliveryTimeSlot === 'LUNCH' ? 'Lunch' :
                                     item.deliveryTimeSlot === 'DINNER' ? 'Dinner' : item.deliveryTimeSlot;
                  if (itemSession === selectedSession) {
                    return { ...item, deliveryNote: calendarNote || null };
                  }
                } else {
                  return { ...item, deliveryNote: calendarNote || null };
                }
              }
              return item;
            });
            return { ...order, deliveryItems: updatedItems };
          }
          return order;
        })
      );
      
      setIsEditingCalendarNote(false);
      setSelectedDateRange({ from: null, to: null });
      setCalendarNote('');
      showSuccessToast('Delivery note updated successfully for selected date range');
    } catch (error) {
      console.error('Error updating delivery note:', error);
      showErrorToast(error.message || 'Failed to update delivery note');
    } finally {
      setLoading(false);
    }
  };

  // Handle view/add delivery note for a specific date
  const handleViewDateDeliveryNote = (order, deliveryDate) => {
    const dateStr = deliveryDate instanceof Date 
      ? deliveryDate.toISOString().split('T')[0] 
      : new Date(deliveryDate).toISOString().split('T')[0];
    
    // Find delivery items for this date
    const itemsForDate = order.deliveryItems?.filter(item => {
      const itemDate = item.deliveryDate ? new Date(item.deliveryDate).toISOString().split('T')[0] : null;
      return itemDate === dateStr;
    }) || [];
    
    // Get the note from the first item (all items for same date should have same note)
    const existingNote = itemsForDate[0]?.deliveryNote || '';
    
    setSelectedOrderForDateNote(order);
    setSelectedDateForNote(dateStr);
    setEditedDateNote(existingNote);
    setIsEditingDateNote(false);
    setShowDeliveryItemsNoteModal(true);
  };

  // Handle save delivery note for date
  const handleSaveDateNote = async () => {
    if (!selectedOrderForDateNote || !selectedDateForNote) return;
    
    setLoading(true);
    try {
      await updateDeliveryItemsNoteByDate(
        selectedOrderForDateNote.id, 
        selectedDateForNote, 
        editedDateNote
      );
      
      // Update the order in the local state
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.id === selectedOrderForDateNote.id) {
            const updatedItems = order.deliveryItems.map(item => {
              const itemDate = item.deliveryDate ? new Date(item.deliveryDate).toISOString().split('T')[0] : null;
              if (itemDate === selectedDateForNote) {
                return { ...item, deliveryNote: editedDateNote || null };
              }
              return item;
            });
            return { ...order, deliveryItems: updatedItems };
          }
          return order;
        })
      );
      
      setIsEditingDateNote(false);
      showSuccessToast('Delivery note updated successfully for this date');
    } catch (error) {
      console.error('Error updating delivery note:', error);
      showErrorToast(error.message || 'Failed to update delivery note');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit date note
  const handleEditDateNote = () => {
    setIsEditingDateNote(true);
  };

  // Handle cancel edit date note
  const handleCancelEditDateNote = () => {
    const itemsForDate = selectedOrderForDateNote?.deliveryItems?.filter(item => {
      const itemDate = item.deliveryDate ? new Date(item.deliveryDate).toISOString().split('T')[0] : null;
      return itemDate === selectedDateForNote;
    }) || [];
    const existingNote = itemsForDate[0]?.deliveryNote || '';
    setEditedDateNote(existingNote);
    setIsEditingDateNote(false);
  };



  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format price
  const formatPrice = (price) => {
    if (!price || price === 0) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  // Get order status color and icon
  const getOrderStatusInfo = (status) => {
    switch (status) {
      case 'Payment_Confirmed':
        return { color: 'text-green-600', bgColor: 'bg-green-100', icon: MdCheckCircle, label: 'Payment Confirmed' };
      case 'In_Progress':
        return { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: MdPending, label: 'In Progress' };
      case 'Completed':
        return { color: 'text-green-600', bgColor: 'bg-green-100', icon: MdCheckCircle, label: 'Completed' };
      case 'Cancelled':
        return { color: 'text-red-600', bgColor: 'bg-red-100', icon: MdCancel, label: 'Cancelled' };
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-100', icon: MdPending, label: status || 'Unknown' };
    }
  };

  // Check if user has access
  if (!user || !roles?.includes('SELLER')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <MdPerson className="text-6xl text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to view customer orders.</p>
          <button
            onClick={() => navigate('/jkhm')}
            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Check if customer data is available
  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MdPerson className="text-6xl text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Customer Not Found</h2>
          <p className="text-gray-600 mb-4">No customer data available.</p>
          <button
            onClick={handleBack}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Professional Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 sm:py-4 gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleBack}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Customers"
              >
                <MdArrowBack className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">Customer Orders</h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">View all orders for this customer</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={fetchCustomerOrders}
                disabled={loading}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1 sm:gap-2 shadow-sm text-sm sm:text-base"
              >
                <MdRefresh className={`w-3 h-3 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden xs:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Customer Info Card */}
        {customer && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg flex-shrink-0">
                  {customer.contacts?.[0]?.firstName?.charAt(0) || 'C'}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                    {customer.contacts?.[0]?.firstName} {customer.contacts?.[0]?.lastName}
                  </h3>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <MdPhone className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{customer.contacts?.[0]?.phoneNumbers?.[0]?.number || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                      <MdEmail className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{customer.auth?.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MdShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>{orders.length} orders</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MdShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                Orders History
              </h2>
              
              {/* Filter Toggle Button */}
              <button
                onClick={() => handleFilterChange('showFilters', !filters.showFilters)}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm w-full sm:w-auto"
              >
                <MdFilterList className="w-3 h-3 sm:w-4 sm:h-4" />
                {filters.showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>

          {/* Filters Section */}
          {filters.showFilters && (
            <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
                {/* Search Filter */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Search</label>
                  <div className="relative">
                    <MdSearch className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                    <input
                      type="text"
                      placeholder="Order ID, customer name..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="w-full pl-8 sm:pl-10 pr-2 sm:pr-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Payment_Confirmed">Payment Confirmed</option>
                    <option value="In_Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Date Preset Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Date Preset</label>
                  <select
                    value={filters.datePreset}
                    onChange={(e) => handleFilterChange('datePreset', e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="thisWeek">This Week</option>
                    <option value="nextWeek">Next Week</option>
                    <option value="thisMonth">This Month</option>
                  </select>
                </div>

                {/* Sort By Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  >
                    <option value="recent">Most Recent First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="status">By Status</option>
                    <option value="priceHigh">Price: High to Low</option>
                    <option value="priceLow">Price: Low to High</option>
                  </select>
                </div>

                {/* Custom Date Range */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Custom Range</label>
                  <div className="space-y-1 sm:space-y-2">
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      placeholder="From Date"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    />
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      placeholder="To Date"
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                  Showing <span className="font-semibold">{filteredOrders.length}</span> of{' '}
                  <span className="font-semibold">{orders.length}</span> orders
                </div>
                <button
                  onClick={clearFilters}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm w-full sm:w-auto"
                >
                  <MdClear className="w-3 h-3 sm:w-4 sm:h-4" />
                  Clear Filters
                </button>
              </div>
            </div>
          )}
          
          {loading ? (
            <div className="p-4 sm:p-8">
              <SkeletonOrderList count={5} />
            </div>
          ) : error ? (
            <div className="p-4 sm:p-8 text-center">
              <MdCancel className="text-3xl sm:text-4xl text-red-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-red-600 font-medium text-sm sm:text-base">{error}</p>
              <button
                onClick={fetchCustomerOrders}
                className="mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Try Again
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-4 sm:p-8 text-center">
              {orders.length === 0 ? (
                <>
                  <MdShoppingCart className="text-3xl sm:text-4xl text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-500 text-sm sm:text-base">No orders found</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">This customer hasn't placed any orders yet</p>
                </>
              ) : (
                <>
                  <MdFilterList className="text-3xl sm:text-4xl text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <p className="text-gray-500 text-sm sm:text-base">No orders match your filters</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-2">Try adjusting your filter criteria</p>
                  <button
                    onClick={clearFilters}
                    className="mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    Clear Filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Table Header - Hidden on mobile, shown on larger screens */}
              <div className="hidden lg:block bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 items-center text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  <div className="col-span-2">Order Details</div>
                  <div className="col-span-2">Date & Amount</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Delivery Items</div>
                  <div className="col-span-2">Payment</div>
                  <div className="col-span-2">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const statusInfo = getOrderStatusInfo(order.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div key={order.id} className="p-3 sm:p-6 hover:bg-gray-50 transition-colors">
                      {/* Mobile Layout */}
                      <div className="lg:hidden space-y-3">
                        {/* Order Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg">
                              #{order.id.slice(-4)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-gray-900 text-xs sm:text-sm truncate">Order #{order.id.slice(-8)}</h3>
                              <p className="text-xs text-gray-500 truncate">ID: {order.id.slice(-12)}</p>
                            </div>
                          </div>
                          <div className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color} border`}>
                            <StatusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">{statusInfo.label}</span>
                          </div>
                        </div>

                        {/* Order Details */}
                        <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <MdCalendarToday className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="font-medium truncate">{formatDate(order.orderDate)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MdAttachMoney className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                            <span className="font-bold text-green-600 truncate">{formatPrice(order.totalPrice)}</span>
                          </div>
                        </div>

                        {/* Delivery Items & Payment */}
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <MdLocalShipping className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="font-medium">{order.deliveryItems?.length || 0} items</span>
                          </div>
                          <div className="flex items-center gap-1 text-green-600">
                            <MdReceipt className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="font-medium">Receipt</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {order.deliveryItems && order.deliveryItems.length > 0 && (
                            <button
                              onClick={() => {
                                const newExpandedOrders = { ...expandedOrders };
                                newExpandedOrders[order.id] = !newExpandedOrders[order.id];
                                setExpandedOrders(newExpandedOrders);
                              }}
                              className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                              {expandedOrders[order.id] ? 'Hide Details' : 'View Details'}
                            </button>
                          )}
                          
                          {/* View/Add Delivery Note Button */}
                          {order.deliveryNote ? (
                            <button
                              onClick={() => handleViewDeliveryNote(order)}
                              className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1 shadow-sm"
                              title="View Delivery Note"
                            >
                              <MdNote className="w-3 h-3" />
                              <span className="hidden sm:inline">Note</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleViewDeliveryNote(order)}
                              className="px-3 py-1.5 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1 shadow-sm border border-purple-400"
                              title="Add Delivery Note"
                            >
                              <MdNote className="w-3 h-3" />
                              <span className="hidden sm:inline">Add Note</span>
                            </button>
                          )}
                          
                          {/* View Receipts Button */}
                          {order.payments && order.payments.length > 0 && 
                           order.payments.some(payment => 
                             payment.receiptUrl || 
                             (payment.paymentReceipts && payment.paymentReceipts.length > 0)
                           ) && (
                            <button
                              onClick={() => handleViewReceipts(order)}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-sm"
                              title="View Receipts"
                            >
                              <MdVisibility className="w-3 h-3" />
                              <span className="hidden sm:inline">Receipt</span>
                            </button>
                          )}
                          
                          {order.status !== 'Cancelled' && order.status !== 'Completed' && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={loading}
                              className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1 shadow-sm"
                              title="Cancel Order"
                            >
                              <MdCancel className="w-3 h-3" />
                              <span className="hidden sm:inline">Cancel</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                        {/* Order Details Column */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
                              #{order.id.slice(-4)}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-gray-900 text-sm truncate">Order #{order.id.slice(-8)}</h3>
                              <p className="text-xs text-gray-500 mt-1">ID: {order.id.slice(-12)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Date & Amount Column */}
                        <div className="col-span-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <MdCalendarToday className="w-4 h-4" />
                              <span className="font-medium">{formatDate(order.orderDate)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <MdAttachMoney className="w-4 h-4 text-green-500" />
                              <span className="font-bold text-green-600">{formatPrice(order.totalPrice)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Column */}
                        <div className="col-span-2">
                          <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color} border w-fit`}>
                            <StatusIcon className="w-4 h-4" />
                            {statusInfo.label}
                          </div>
                        </div>

                        {/* Delivery Items Column */}
                        <div className="col-span-2">
                          {order.deliveryItems && order.deliveryItems.length > 0 ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <MdLocalShipping className="w-4 h-4" />
                                <span className="font-medium">{order.deliveryItems.length} items</span>
                              </div>
                              <button
                                onClick={() => {
                                  const newExpandedOrders = { ...expandedOrders };
                                  newExpandedOrders[order.id] = !newExpandedOrders[order.id];
                                  setExpandedOrders(newExpandedOrders);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {expandedOrders[order.id] ? 'Hide Details' : 'View Details'}
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 italic">No items</div>
                          )}
                        </div>

                        {/* Payment Column */}
                        <div className="col-span-2">
                          {order.payments && order.payments.length > 0 && 
                           order.payments.some(payment => 
                             payment.receiptUrl || 
                             (payment.paymentReceipts && payment.paymentReceipts.length > 0)
                           ) ? (
                            <div className="flex items-center gap-1 text-sm text-green-600">
                              <MdReceipt className="w-4 h-4" />
                              <span className="font-medium">Receipt Available</span>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 italic">No receipt</div>
                          )}
                        </div>

                        {/* Actions Column */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* View/Add Delivery Note Button */}
                            {order.deliveryNote ? (
                              <button
                                onClick={() => handleViewDeliveryNote(order)}
                                className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1 shadow-sm"
                                title="View Delivery Note"
                              >
                                <MdNote className="w-3 h-3" />
                                Note
                              </button>
                            ) : (
                              <button
                                onClick={() => handleViewDeliveryNote(order)}
                                className="px-3 py-1.5 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1 shadow-sm border border-purple-400"
                                title="Add Delivery Note"
                              >
                                <MdNote className="w-3 h-3" />
                                Add Note
                              </button>
                            )}
                            
                            {/* View Receipts Button */}
                            {order.payments && order.payments.length > 0 && 
                             order.payments.some(payment => 
                               payment.receiptUrl || 
                               (payment.paymentReceipts && payment.paymentReceipts.length > 0)
                             ) && (
                              <button
                                onClick={() => handleViewReceipts(order)}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-sm"
                                title="View Receipts"
                              >
                                <MdVisibility className="w-3 h-3" />
                                Receipt
                              </button>
                            )}
                            
                            {order.status !== 'Cancelled' && order.status !== 'Completed' && (
                              <button
                                onClick={() => handleCancelOrder(order.id)}
                                disabled={loading}
                                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1 shadow-sm"
                                title="Cancel Order"
                              >
                                <MdCancel className="w-3 h-3" />
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    
                      {/* Expanded Delivery Items Section */}
                      {expandedOrders[order.id] && order.deliveryItems && order.deliveryItems.length > 0 && (
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                          <div className="flex flex-col gap-3 mb-3 sm:mb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                              <h4 className="text-xs sm:text-sm font-semibold text-gray-800 flex items-center gap-1 sm:gap-2">
                                <MdLocalShipping className="w-3 h-3 sm:w-4 sm:h-4" />
                                Delivery Items ({order.deliveryItems.length})
                              </h4>
                              
                              {/* Delivery Items Filter Toggle */}
                              <button
                                onClick={() => {
                                  const currentFilters = deliveryItemFilters[order.id];
                                  if (currentFilters?.showFilters) {
                                    clearDeliveryItemFilters(order.id);
                                  } else {
                                    handleDeliveryItemFilterChange(order.id, 'showFilters', true);
                                  }
                                }}
                                className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm w-full sm:w-auto"
                              >
                                <MdFilterList className="w-3 h-3 sm:w-4 sm:h-4" />
                                {deliveryItemFilters[order.id]?.showFilters ? 'Hide Filters' : 'Show Filters'}
                              </button>
                            </div>
                            
                            {/* Delivery Dates Calendar Button */}
                            {order.deliveryItems && order.deliveryItems.length > 0 && (
                              <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                                <button
                                  onClick={() => handleOpenCalendarModal(order)}
                                  className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-xs sm:text-sm font-medium w-full sm:w-auto"
                                  title="Open calendar to add delivery notes by date range and session"
                                >
                                  <MdCalendarToday className="w-4 h-4" />
                                  <span>Add Delivery Notes by Date Range</span>
                                </button>
                              </div>
                            )}
                          </div>
                        
                          {/* Delivery Items Filters */}
                          {deliveryItemFilters[order.id]?.showFilters && (
                            <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                                {/* Time Slot Filter */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Time Slot</label>
                                  <select
                                    value={deliveryItemFilters[order.id]?.timeSlot || 'all'}
                                    onChange={(e) => handleDeliveryItemFilterChange(order.id, 'timeSlot', e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="all">All Time Slots</option>
                                    <option value="Breakfast">Breakfast</option>
                                    <option value="Lunch">Lunch</option>
                                    <option value="Dinner">Dinner</option>
                                  </select>
                                </div>

                                {/* Status Filter */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                                  <select
                                    value={deliveryItemFilters[order.id]?.status || 'all'}
                                    onChange={(e) => handleDeliveryItemFilterChange(order.id, 'status', e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="all">All Statuses</option>
                                    <option value="Pending">Pending</option>
                                    <option value="In_Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                  </select>
                                </div>

                                {/* Date Preset Filter */}
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Date Preset</label>
                                  <select
                                    value={deliveryItemFilters[order.id]?.datePreset || 'all'}
                                    onChange={(e) => handleDeliveryItemFilterChange(order.id, 'datePreset', e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="all">All Dates</option>
                                    <option value="today">Today</option>
                                    <option value="tomorrow">Tomorrow</option>
                                    <option value="thisWeek">This Week</option>
                                    <option value="nextWeek">Next Week</option>
                                    <option value="thisMonth">This Month</option>
                                  </select>
                                </div>

                                {/* Clear Filters Button */}
                                <div className="flex items-end">
                                  <button
                                    onClick={() => clearDeliveryItemFilters(order.id)}
                                    className="w-full px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors flex items-center justify-center gap-1"
                                  >
                                    <MdClear className="w-3 h-3" />
                                    Clear
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Filtered Delivery Items */}
                          <div className="space-y-2 sm:space-y-3">
                            {(() => {
                              const filteredItems = getFilteredDeliveryItems(order.id, order.deliveryItems);
                              return filteredItems.length > 0 ? (
                                <div className="max-h-60 sm:max-h-80 overflow-y-auto space-y-2 sm:space-y-3">
                                  {filteredItems.map((item) => (
                                    <div key={item.id} className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-sm transition-shadow">
                                      {/* Mobile Layout */}
                                      <div className="lg:hidden space-y-3">
                                        {/* Item Header */}
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-md">
                                              {item.quantity}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <h4 className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                                                {item.menuItem?.name || 'Unknown Item'}
                                              </h4>
                                              <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-600 mt-1">
                                                <div className="flex items-center gap-1">
                                                  <MdCalendarToday className="w-3 h-3 flex-shrink-0" />
                                                  <span className="truncate">{item.deliveryDate ? formatDate(item.deliveryDate) : 'No date'}</span>
                                                </div>
                                                {item.deliveryTimeSlot && (
                                                  <div className="flex items-center gap-1">
                                                    <MdLocalShipping className="w-3 h-3 flex-shrink-0" />
                                                    <span className="font-medium text-blue-600 truncate">{item.deliveryTimeSlot}</span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium border ${
                                            item.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                            item.status === 'Cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                                            'bg-blue-100 text-blue-700 border-blue-200'
                                          }`}>
                                            {item.status}
                                          </div>
                                        </div>

                                        {/* Delivery Address */}
                                        <div className="bg-white rounded-lg p-2 sm:p-3 border border-gray-100">
                                          <div className="flex items-center gap-1 text-xs text-gray-600 mb-1 sm:mb-2">
                                            <MdLocationOn className="w-3 h-3 text-red-500 flex-shrink-0" />
                                            <span className="font-medium text-gray-700">Delivery Address</span>
                                          </div>
                                          <div className="text-xs text-gray-600 leading-relaxed">
                                            {item.deliveryAddress ? (
                                              <>
                                                {item.deliveryAddress.housename && (
                                                  <div className="font-medium text-gray-800 truncate">{item.deliveryAddress.housename}</div>
                                                )}
                                                <div className="truncate">{item.deliveryAddress.street}</div>
                                                <div className="truncate">{item.deliveryAddress.city}{item.deliveryAddress.pincode && item.deliveryAddress.pincode !== 0 ? ` - ${item.deliveryAddress.pincode}` : ''}</div>
                                                {item.deliveryAddress.state && (
                                                  <div className="truncate">{item.deliveryAddress.state}</div>
                                                )}
                                                {item.deliveryAddress.googleMapsUrl && (
                                                  <div className="mt-2">
                                                    <a
                                                      href={item.deliveryAddress.googleMapsUrl}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                                      title="Open in Google Maps"
                                                    >
                                                      <MdOpenInNew className="w-3 h-3" />
                                                      View on Maps
                                                    </a>
                                                  </div>
                                                )}
                                              </>
                                            ) : (
                                              <div className="text-gray-400 italic">No address specified</div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Delivery Note */}
                                        {item.deliveryNote && (
                                          <div className="bg-purple-50 rounded-lg p-2 sm:p-3 border border-purple-200">
                                            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1 sm:mb-2">
                                              <MdNote className="w-3 h-3 text-purple-600 flex-shrink-0" />
                                              <span className="font-medium text-purple-700">Delivery Note</span>
                                            </div>
                                            <div className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                                              {item.deliveryNote}
                                            </div>
                                          </div>
                                        )}

                                        {/* Actions */}
                                        {item.status !== 'Cancelled' && item.status !== 'Completed' && (
                                          <div className="flex justify-end">
                                            <button
                                              onClick={() => handleCancelDeliveryItem(item.id)}
                                              disabled={loading}
                                              className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1 shadow-sm"
                                              title="Cancel this item"
                                            >
                                              <MdCancel className="w-3 h-3" />
                                              Cancel
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      {/* Desktop Layout */}
                                      <div className="hidden lg:flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                                            {item.quantity}
                                          </div>
                                          <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 text-sm">
                                              {item.menuItem?.name || 'Unknown Item'}
                                            </h4>
                                            <div className="flex items-center gap-3 text-xs text-gray-600 mt-1">
                                              <div className="flex items-center gap-1">
                                                <MdCalendarToday className="w-3 h-3" />
                                                <span>{item.deliveryDate ? formatDate(item.deliveryDate) : 'No date'}</span>
                                              </div>
                                              {item.deliveryTimeSlot && (
                                                <div className="flex items-center gap-1">
                                                  <MdLocalShipping className="w-3 h-3" />
                                                  <span className="font-medium text-blue-600">{item.deliveryTimeSlot}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          
                                          {/* Delivery Address - Center */}
                                          <div className="flex-1 text-center">
                                            <div className="flex items-center justify-center gap-1 text-xs text-gray-600 mb-1">
                                              <MdLocationOn className="w-3 h-3 text-red-500" />
                                              <span className="font-medium text-gray-700">Delivery Address</span>
                                            </div>
                                            <div className="text-xs text-gray-600 leading-relaxed">
                                              {item.deliveryAddress ? (
                                                <>
                                                  {item.deliveryAddress.housename && (
                                                    <div className="font-medium text-gray-800">{item.deliveryAddress.housename}</div>
                                                  )}
                                                  <div>{item.deliveryAddress.street}</div>
                                                  <div>{item.deliveryAddress.city}{item.deliveryAddress.pincode && item.deliveryAddress.pincode !== 0 ? ` - ${item.deliveryAddress.pincode}` : ''}</div>
                                                  {item.deliveryAddress.state && (
                                                    <div>{item.deliveryAddress.state}</div>
                                                  )}
                                                  {item.deliveryAddress.googleMapsUrl && (
                                                    <div className="mt-2">
                                                      <a
                                                        href={item.deliveryAddress.googleMapsUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                                                        title="Open in Google Maps"
                                                      >
                                                        <MdOpenInNew className="w-3 h-3" />
                                                        View on Maps
                                                      </a>
                                                    </div>
                                                  )}
                                                </>
                                              ) : (
                                                <div className="text-gray-400 italic">No address specified</div>
                                              )}
                                            </div>
                                            
                                            {/* Delivery Note - Desktop */}
                                            {item.deliveryNote && (
                                              <div className="mt-3 bg-purple-50 rounded-lg p-2 border border-purple-200 text-left">
                                                <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                                                  <MdNote className="w-3 h-3 text-purple-600" />
                                                  <span className="font-medium text-purple-700">Delivery Note</span>
                                                </div>
                                                <div className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">
                                                  {item.deliveryNote}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                            item.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                                            item.status === 'Cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                                            'bg-blue-100 text-blue-700 border-blue-200'
                                          }`}>
                                            {item.status}
                                          </div>
                                          {item.status !== 'Cancelled' && item.status !== 'Completed' && (
                                            <button
                                              onClick={() => handleCancelDeliveryItem(item.id)}
                                              disabled={loading}
                                              className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1 shadow-sm"
                                              title="Cancel this item"
                                            >
                                              <MdCancel className="w-3 h-3" />
                                              Cancel
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 sm:py-6 text-gray-500">
                                  <MdFilterList className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-3 text-gray-300" />
                                  <p className="text-xs sm:text-sm font-medium">No delivery items match your filters</p>
                                  <button
                                    onClick={() => clearDeliveryItemFilters(order.id)}
                                    className="mt-2 sm:mt-3 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                  >
                                    Clear Filters
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      <Modal
        title="Cancel Order"
        open={showCancelOrderModal}
        onOk={confirmCancelOrder}
        onCancel={() => {
          setShowCancelOrderModal(false);
          setOrderToCancel(null);
        }}
        okText="Yes, Cancel Order"
        cancelText="Keep Order"
        okType="danger"
        width="90%"
        style={{ maxWidth: '400px' }}
      >
        <p className="text-sm sm:text-base">Are you sure you want to cancel this order? This action cannot be undone.</p>
      </Modal>

      {/* Cancel Delivery Item Confirmation Modal */}
      <Modal
        title="Cancel Delivery Item"
        open={showCancelItemModal}
        onOk={confirmCancelDeliveryItem}
        onCancel={() => {
          setShowCancelItemModal(false);
          setItemToCancel(null);
        }}
        okText="Yes, Cancel Item"
        cancelText="Keep Item"
        okType="danger"
        width="90%"
        style={{ maxWidth: '400px' }}
      >
        <p className="text-sm sm:text-base">Are you sure you want to cancel this delivery item? This action cannot be undone.</p>
      </Modal>

      {/* Delivery Note Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <MdNote className="w-5 h-5 text-purple-600" />
            <span>Delivery Note</span>
          </div>
        }
        open={showDeliveryNoteModal}
        onCancel={() => {
          setShowDeliveryNoteModal(false);
          setSelectedOrderNote(null);
          setIsEditingNote(false);
          setEditedNote('');
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: '600px' }}
      >
        {selectedOrderNote && (
          <div className="space-y-4">
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MdNote className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-purple-900">Delivery Instructions</h3>
                </div>
                {!isEditingNote && (
                  <button
                    onClick={handleEditNote}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors"
                    title="Edit Delivery Note"
                  >
                    <MdEdit className="w-3 h-3" />
                    Edit
                  </button>
                )}
              </div>
              
              {isEditingNote ? (
                <div className="space-y-3">
                  <textarea
                    value={editedNote}
                    onChange={(e) => setEditedNote(e.target.value)}
                    placeholder="Enter delivery instructions, special requests, or any notes for the delivery team..."
                    rows={6}
                    maxLength={500}
                    className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {editedNote.length}/500 characters
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancelEdit}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                      >
                        <MdClose className="w-3 h-3" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNote}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        <MdSave className="w-3 h-3" />
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {selectedOrderNote.deliveryNote || 'No delivery note available.'}
                </div>
              )}
            </div>
            
            {!isEditingNote && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowDeliveryNoteModal(false);
                    setSelectedOrderNote(null);
                    setIsEditingNote(false);
                    setEditedNote('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Calendar Modal for Date Range Delivery Notes */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <MdCalendarToday className="w-5 h-5 text-blue-600" />
            <span>Delivery Notes Calendar</span>
          </div>
        }
        open={showCalendarModal}
        onCancel={() => {
          setShowCalendarModal(false);
          setSelectedOrderForCalendar(null);
          setSelectedSession('all');
          setSelectedDateRange({ from: null, to: null });
          setCalendarNote('');
          setIsEditingCalendarNote(false);
        }}
        footer={null}
        width="95%"
        style={{ maxWidth: '650px' }}
      >
        {selectedOrderForCalendar && (
          <div className="space-y-3">
            {/* Session Filter */}
            <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Filter by Session</label>
              <div className="flex flex-wrap gap-1.5">
                {['all', 'Breakfast', 'Lunch', 'Dinner'].map(session => (
                  <button
                    key={session}
                    onClick={() => {
                      setSelectedSession(session);
                      setSelectedDateRange({ from: null, to: null });
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                      selectedSession === session
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {session === 'all' ? 'All Sessions' : session}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => {
                    const newDate = new Date(calendarCurrentDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setCalendarCurrentDate(newDate);
                  }}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <MdArrowBack className="w-4 h-4" />
                </button>
                <h3 className="text-base font-semibold text-gray-900">
                  {calendarCurrentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={() => {
                    const newDate = new Date(calendarCurrentDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setCalendarCurrentDate(newDate);
                  }}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <MdArrowForward className="w-4 h-4" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1.5">
                    {day}
                  </div>
                ))}

                {/* Calendar Dates */}
                {generateCalendarDates(calendarCurrentDate).map((date, index) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const hasItems = dateHasItems(date, selectedOrderForCalendar.deliveryItems, selectedSession);
                  const isInRange = isDateInRange(date, selectedDateRange.from, selectedDateRange.to);
                  const isFromDate = selectedDateRange.from && dateStr === selectedDateRange.from.toISOString().split('T')[0];
                  const isToDate = selectedDateRange.to && dateStr === selectedDateRange.to.toISOString().split('T')[0];
                  const isCurrentMonth = date.getMonth() === calendarCurrentDate.getMonth();
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isToday = dateStr === today.toISOString().split('T')[0];

                  return (
                    <button
                      key={index}
                      onClick={() => hasItems && handleCalendarDateClick(date)}
                      disabled={!hasItems || !isCurrentMonth}
                      className={`aspect-square rounded-md border transition-all text-xs font-medium flex items-center justify-center ${
                        !isCurrentMonth
                          ? 'text-gray-300 border-gray-100 cursor-not-allowed'
                          : !hasItems
                          ? 'text-gray-400 border-gray-200 cursor-not-allowed bg-gray-50'
                          : isFromDate || isToDate
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105'
                          : isInRange
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : isToday
                          ? 'bg-orange-50 border-orange-300 text-orange-700 hover:bg-orange-100'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-300'
                      }`}
                      title={hasItems ? `Click to select date range` : 'No delivery items for this date'}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              {/* Selected Range Display */}
              {selectedDateRange.from && (
                <div className="mt-3 p-2.5 bg-blue-50 rounded-md border border-blue-200">
                  <div className="text-xs font-medium text-blue-900 mb-1">Selected Date Range:</div>
                  <div className="text-xs text-blue-700">
                    {formatDate(selectedDateRange.from.toISOString().split('T')[0])}
                    {selectedDateRange.to && (
                      <> to {formatDate(selectedDateRange.to.toISOString().split('T')[0])}</>
                    )}
                    {selectedSession !== 'all' && (
                      <span className="ml-2">({selectedSession})</span>
                    )}
                  </div>
                  {selectedDateRange.from && (
                    <button
                      onClick={() => setSelectedDateRange({ from: null, to: null })}
                      className="mt-1.5 text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Delivery Note Input */}
            {selectedDateRange.from && (
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <MdNote className="w-4 h-4 text-purple-600" />
                    <h3 className="text-xs font-semibold text-purple-900">Delivery Note</h3>
                  </div>
                  {!isEditingCalendarNote && (
                    <button
                      onClick={() => setIsEditingCalendarNote(true)}
                      className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 transition-colors"
                    >
                      <MdEdit className="w-3 h-3" />
                      {calendarNote ? 'Edit' : 'Add Note'}
                    </button>
                  )}
                </div>

                {isEditingCalendarNote ? (
                  <div className="space-y-2">
                    <textarea
                      value={calendarNote}
                      onChange={(e) => setCalendarNote(e.target.value)}
                      placeholder="Enter delivery instructions for the selected date range..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-2.5 py-1.5 text-xs border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {calendarNote.length}/500
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setIsEditingCalendarNote(false);
                            setCalendarNote('');
                          }}
                          disabled={loading}
                          className="flex items-center gap-1 px-2.5 py-1 bg-gray-500 text-white text-xs rounded-md hover:bg-gray-600 transition-colors disabled:opacity-50"
                        >
                          <MdClose className="w-3 h-3" />
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveCalendarNote}
                          disabled={loading}
                          className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                          <MdSave className="w-3 h-3" />
                          {loading ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {calendarNote || 'No delivery note set for this range. Click "Add Note" to add one.'}
                  </div>
                )}
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  setShowCalendarModal(false);
                  setSelectedOrderForCalendar(null);
                  setSelectedSession('all');
                  setSelectedDateRange({ from: null, to: null });
                  setCalendarNote('');
                  setIsEditingCalendarNote(false);
                }}
                className="px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-xs"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delivery Items Note by Date Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <MdNote className="w-5 h-5 text-purple-600" />
            <span>Delivery Note for Date</span>
          </div>
        }
        open={showDeliveryItemsNoteModal}
        onCancel={() => {
          setShowDeliveryItemsNoteModal(false);
          setSelectedOrderForDateNote(null);
          setSelectedDateForNote(null);
          setIsEditingDateNote(false);
          setEditedDateNote('');
        }}
        footer={null}
        width="90%"
        style={{ maxWidth: '600px' }}
      >
        {selectedOrderForDateNote && selectedDateForNote && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Delivery Date</div>
              <div className="text-sm font-semibold text-gray-900">{formatDate(selectedDateForNote)}</div>
              <div className="text-xs text-gray-600 mt-2 mb-1">Items for this date</div>
              <div className="text-sm text-gray-700">
                {(() => {
                  const itemsForDate = selectedOrderForDateNote.deliveryItems?.filter(item => {
                    const itemDate = item.deliveryDate ? new Date(item.deliveryDate).toISOString().split('T')[0] : null;
                    return itemDate === selectedDateForNote;
                  }) || [];
                  return `${itemsForDate.length} delivery item${itemsForDate.length !== 1 ? 's' : ''}`;
                })()}
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MdNote className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-purple-900">Delivery Instructions for this Date</h3>
                </div>
                {!isEditingDateNote && (
                  <button
                    onClick={handleEditDateNote}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors"
                    title="Edit Delivery Note"
                  >
                    <MdEdit className="w-3 h-3" />
                    {editedDateNote ? 'Edit' : 'Add Note'}
                  </button>
                )}
              </div>
              
              {isEditingDateNote ? (
                <div className="space-y-3">
                  <textarea
                    value={editedDateNote}
                    onChange={(e) => setEditedDateNote(e.target.value)}
                    placeholder="Enter delivery instructions, special requests, or any notes for the delivery team for this specific date..."
                    rows={6}
                    maxLength={500}
                    className="w-full px-3 py-2 text-sm border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {editedDateNote.length}/500 characters
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCancelEditDateNote}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                      >
                        <MdClose className="w-3 h-3" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveDateNote}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        <MdSave className="w-3 h-3" />
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {editedDateNote || 'No delivery note available for this date.'}
                </div>
              )}
            </div>
            
            {!isEditingDateNote && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowDeliveryItemsNoteModal(false);
                    setSelectedOrderForDateNote(null);
                    setSelectedDateForNote(null);
                    setIsEditingDateNote(false);
                    setEditedDateNote('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

    </div>
  );
};

export default CustomerOrdersPage;
