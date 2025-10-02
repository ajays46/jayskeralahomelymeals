/**
 * Utility functions for managing draft orders with automatic expiration
 */

/**
 * Check if a draft order is expired (older than 1 day)
 * @param {Object} draft - The draft order object
 * @returns {boolean} - True if the draft is expired
 */
export const isDraftExpired = (draft) => {
  if (!draft.createdAt) {
    return true; // If no createdAt, consider it expired
  }
  
  const createdAt = new Date(draft.createdAt);
  const now = new Date();
  const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  return (now - createdAt) > oneDayInMs;
};

/**
 * Clean expired draft orders from localStorage
 * @returns {Array} - Array of remaining valid drafts
 */
export const cleanExpiredDrafts = () => {
  try {
    const savedDrafts = JSON.parse(localStorage.getItem('draftOrders') || '[]');
    
    // Filter out expired drafts
    const validDrafts = savedDrafts.filter(draft => {
      // Keep drafts that are not expired and have required fields
      return !isDraftExpired(draft) && 
             draft.selectedUser && 
             draft.selectedMenu && 
             draft.selectedDates;
    });
    
    // Update localStorage with cleaned drafts
    localStorage.setItem('draftOrders', JSON.stringify(validDrafts));
    
    // Return count of removed drafts for logging
    const removedCount = savedDrafts.length - validDrafts.length;
    if (removedCount > 0) {
      console.log(`Cleaned ${removedCount} expired draft orders`);
    }
    
    return validDrafts;
  } catch (error) {
    console.error('Error cleaning expired drafts:', error);
    return [];
  }
};

/**
 * Get all valid draft orders (non-expired and with required fields)
 * @returns {Array} - Array of valid draft orders
 */
export const getValidDrafts = () => {
  try {
    const savedDrafts = JSON.parse(localStorage.getItem('draftOrders') || '[]');
    
    return savedDrafts.filter(draft => {
      return !isDraftExpired(draft) && 
             draft.selectedUser && 
             draft.selectedMenu && 
             draft.selectedDates;
    });
  } catch (error) {
    console.error('Error getting valid drafts:', error);
    return [];
  }
};

/**
 * Save a draft order with automatic cleanup of expired drafts
 * @param {Object} draftData - The draft order data to save
 * @returns {string} - The ID of the saved draft
 */
export const saveDraftWithCleanup = (draftData) => {
  try {
    // First clean expired drafts
    const validDrafts = cleanExpiredDrafts();
    
    // Add createdAt and updatedAt if not present
    const now = new Date().toISOString();
    const draftToSave = {
      ...draftData,
      createdAt: draftData.createdAt || now,
      updatedAt: now
    };
    
    // Update existing draft or add new one
    const draftIndex = validDrafts.findIndex(draft => draft.id === draftToSave.id);
    if (draftIndex >= 0) {
      validDrafts[draftIndex] = draftToSave;
    } else {
      validDrafts.push(draftToSave);
    }
    
    // Save to localStorage
    localStorage.setItem('draftOrders', JSON.stringify(validDrafts));
    
    return draftToSave.id;
  } catch (error) {
    console.error('Error saving draft with cleanup:', error);
    return null;
  }
};

/**
 * Initialize draft order cleanup - should be called on app startup
 * This ensures expired drafts are cleaned up when the app loads
 */
export const initializeDraftCleanup = () => {
  try {
    const cleanedDrafts = cleanExpiredDrafts();
    console.log(`Draft cleanup initialized. ${cleanedDrafts.length} valid drafts remaining.`);
    return cleanedDrafts;
  } catch (error) {
    console.error('Error initializing draft cleanup:', error);
    return [];
  }
};
