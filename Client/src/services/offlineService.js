/**
 * Offline Service - Handles offline functionality for delivery executives
 * Features: Network detection, action queueing, localStorage caching, auto-sync
 */

const STORAGE_KEYS = {
  ROUTES_CACHE: 'offline_routes_cache',
  ACTIONS_QUEUE: 'offline_actions_queue',
  LAST_SYNC: 'offline_last_sync'
};

class OfflineService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];
    this.syncInProgress = false;
    this.init();
  }

  init() {
    // Listen to online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  handleOnline() {
    this.isOnline = true;
    this.notifyListeners('online');
    // Auto-sync when network is restored
    this.processSyncQueue();
  }

  handleOffline() {
    this.isOnline = false;
    this.notifyListeners('offline');
  }

  // Subscribe to network status changes
  onNetworkChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(status) {
    this.listeners.forEach(callback => callback(status));
  }

  // Check if currently online
  checkOnline() {
    return navigator.onLine;
  }

  // Cache routes data
  cacheRoutes(routesData) {
    try {
      const cacheData = {
        data: routesData,
        timestamp: new Date().toISOString(),
        driverId: routesData.driver_id || null
      };
      localStorage.setItem(STORAGE_KEYS.ROUTES_CACHE, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.error('Error caching routes:', error);
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded. Clearing old cache...');
        this.clearCache();
        try {
          localStorage.setItem(STORAGE_KEYS.ROUTES_CACHE, JSON.stringify(cacheData));
          return true;
        } catch (retryError) {
          console.error('Failed to cache routes after clearing:', retryError);
          return false;
        }
      }
      return false;
    }
  }

  // Get cached routes
  getCachedRoutes() {
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.ROUTES_CACHE);
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      return cacheData.data;
    } catch (error) {
      console.error('Error reading cached routes:', error);
      return null;
    }
  }

  // Clear routes cache
  clearCache() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ROUTES_CACHE);
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }

  // Queue an action for later sync
  queueAction(action) {
    try {
      const queue = this.getQueuedActions();
      const actionWithId = {
        id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...action,
        timestamp: new Date().toISOString(),
        retryCount: 0
      };
      
      queue.push(actionWithId);
      localStorage.setItem(STORAGE_KEYS.ACTIONS_QUEUE, JSON.stringify(queue));
      return actionWithId.id;
    } catch (error) {
      console.error('Error queueing action:', error);
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded. Cannot queue action.');
        return null;
      }
      return null;
    }
  }

  // Get all queued actions
  getQueuedActions() {
    try {
      const queue = localStorage.getItem(STORAGE_KEYS.ACTIONS_QUEUE);
      if (!queue) return [];
      return JSON.parse(queue);
    } catch (error) {
      console.error('Error reading action queue:', error);
      return [];
    }
  }

  // Remove action from queue (after successful sync)
  removeAction(actionId) {
    try {
      const queue = this.getQueuedActions();
      const filtered = queue.filter(action => action.id !== actionId);
      localStorage.setItem(STORAGE_KEYS.ACTIONS_QUEUE, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error removing action from queue:', error);
      return false;
    }
  }

  // Update action retry count
  updateActionRetry(actionId, retryCount) {
    try {
      const queue = this.getQueuedActions();
      const updated = queue.map(action => 
        action.id === actionId ? { ...action, retryCount } : action
      );
      localStorage.setItem(STORAGE_KEYS.ACTIONS_QUEUE, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Error updating action retry count:', error);
      return false;
    }
  }

  // Clear all queued actions
  clearQueue() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIONS_QUEUE);
      return true;
    } catch (error) {
      console.error('Error clearing queue:', error);
      return false;
    }
  }

  // Process sync queue - sync all queued actions
  async processSyncQueue(syncCallback) {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    if (!this.checkOnline()) {
      console.log('Not online, cannot sync');
      return;
    }

    const queue = this.getQueuedActions();
    if (queue.length === 0) {
      return { success: true, synced: 0, failed: 0 };
    }

    this.syncInProgress = true;
    let synced = 0;
    let failed = 0;
    const failedActions = [];

    try {
      for (const action of queue) {
        try {
          if (syncCallback) {
            const result = await syncCallback(action);
            if (result && result.success !== false) {
              this.removeAction(action.id);
              synced++;
            } else {
              // Increment retry count
              const newRetryCount = (action.retryCount || 0) + 1;
              this.updateActionRetry(action.id, newRetryCount);
              
              // If retry count exceeds limit, mark as failed
              if (newRetryCount >= 5) {
                failedActions.push(action);
                failed++;
              }
            }
          }
        } catch (error) {
          console.error(`Error syncing action ${action.id}:`, error);
          const newRetryCount = (action.retryCount || 0) + 1;
          this.updateActionRetry(action.id, newRetryCount);
          
          if (newRetryCount >= 5) {
            failedActions.push(action);
            failed++;
          }
        }
      }

      // Update last sync timestamp
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

      return { success: true, synced, failed, failedActions };
    } finally {
      this.syncInProgress = false;
    }
  }

  // Get sync status
  getSyncStatus() {
    return {
      isOnline: this.checkOnline(),
      queueLength: this.getQueuedActions().length,
      syncInProgress: this.syncInProgress,
      lastSync: localStorage.getItem(STORAGE_KEYS.LAST_SYNC)
    };
  }
}

// Create singleton instance
const offlineService = new OfflineService();

export default offlineService;
