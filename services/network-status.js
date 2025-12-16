// Network Status Service - Detects online/offline state changes
// Provides subscribe/unsubscribe pattern for status change notifications

class NetworkStatus {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.listeners = new Set();
    this._boundOnline = this._handleOnline.bind(this);
    this._boundOffline = this._handleOffline.bind(this);
    this._initialized = false;
  }

  // Initialize event listeners
  init() {
    if (this._initialized) {
      return;
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', this._boundOnline);
      window.addEventListener('offline', this._boundOffline);
      this._initialized = true;
      console.log('[OK] NetworkStatus service initialized, online:', this.isOnline);
    }
  }

  // Clean up event listeners
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this._boundOnline);
      window.removeEventListener('offline', this._boundOffline);
    }
    this.listeners.clear();
    this._initialized = false;
  }

  // Handle online event
  _handleOnline() {
    this._setOnline(true);
    // Trigger sync queue processing when coming back online
    this._triggerSync();
  }

  // Trigger sync queue processing
  _triggerSync() {
    if (typeof window !== 'undefined') {
      // Dispatch event for sync queue to process
      window.dispatchEvent(new CustomEvent('process-sync-queue'));
    }
  }

  // Handle offline event
  _handleOffline() {
    this._setOnline(false);
  }

  // Update online status and notify listeners
  _setOnline(status) {
    const previousStatus = this.isOnline;
    this.isOnline = status;
    
    if (previousStatus !== status) {
      console.log(`[NETWORK] Network status changed: ${status ? 'online' : 'offline'}`);
      this._notifyListeners(status);
    }
  }

  // Notify all subscribed listeners
  _notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  // Subscribe to status changes
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback);
      // Immediately call with current status
      callback(this.isOnline);
    }
    return () => this.unsubscribe(callback);
  }

  // Unsubscribe from status changes
  unsubscribe(callback) {
    this.listeners.delete(callback);
  }

  // Get current online status
  getStatus() {
    return this.isOnline;
  }
}

// Export singleton instance
window.networkStatus = new NetworkStatus();

// Initialization function
window.initializeNetworkStatus = function() {
  window.networkStatus.init();
  return true;
};
