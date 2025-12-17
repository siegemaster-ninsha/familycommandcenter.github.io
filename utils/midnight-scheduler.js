// Midnight Scheduler
// Automatically triggers the "New Day" function at midnight local time
// 
// This scheduler calculates the time until the next midnight and sets a timeout.
// When midnight arrives, it triggers the new day process and reschedules for the next day.

const MidnightScheduler = {
  _timeoutId: null,
  _isEnabled: false,
  _lastTriggeredDate: null,

  /**
   * Calculate milliseconds until next midnight local time
   * @returns {number} Milliseconds until midnight
   */
  getMillisecondsUntilMidnight() {
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1, // Next day
      0, 0, 0, 0 // Midnight
    );
    return midnight.getTime() - now.getTime();
  },

  /**
   * Get today's date as YYYY-MM-DD string for tracking
   * @returns {string} Date string
   */
  getTodayDateString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  },

  /**
   * Check if new day was already triggered today (prevents duplicate triggers)
   * @returns {boolean}
   */
  wasTriggeredToday() {
    const today = this.getTodayDateString();
    const lastTriggered = localStorage.getItem('midnightScheduler_lastTriggered');
    return lastTriggered === today;
  },

  /**
   * Mark that new day was triggered for today
   */
  markTriggeredToday() {
    const today = this.getTodayDateString();
    localStorage.setItem('midnightScheduler_lastTriggered', today);
    this._lastTriggeredDate = today;
  },

  /**
   * Trigger the new day process
   * Uses the chores store's startNewDay action
   */
  async triggerNewDay() {
    // Prevent duplicate triggers
    if (this.wasTriggeredToday()) {
      console.log('[MidnightScheduler] New day already triggered today, skipping');
      return;
    }

    console.log('[MidnightScheduler] 🌅 Midnight reached! Triggering new day...');

    try {
      // Get the chores store
      const choresStore = window.useChoresStore ? window.useChoresStore() : null;
      
      if (!choresStore) {
        console.warn('[MidnightScheduler] Chores store not available');
        return;
      }

      // Check if user is authenticated
      const authStore = window.useAuthStore ? window.useAuthStore() : null;
      if (authStore && !authStore.isAuthenticated) {
        console.log('[MidnightScheduler] User not authenticated, skipping new day trigger');
        return;
      }

      // Trigger the new day
      const result = await choresStore.startNewDay();
      
      if (result.success) {
        this.markTriggeredToday();
        console.log('[MidnightScheduler] ✅ New day triggered successfully', result.summary);
        
        // Show a notification if the UI store is available
        const uiStore = window.useUIStore ? window.useUIStore() : null;
        if (uiStore) {
          uiStore.showSuccess('🌅 Midnight! New day started automatically.');
        }
      } else if (result.offlineBlocked) {
        console.log('[MidnightScheduler] Offline - will retry when online');
      } else {
        console.error('[MidnightScheduler] Failed to trigger new day:', result.error);
      }
    } catch (error) {
      console.error('[MidnightScheduler] Error triggering new day:', error);
    }
  },

  /**
   * Schedule the next midnight trigger
   */
  scheduleNext() {
    // Clear any existing timeout
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }

    if (!this._isEnabled) {
      return;
    }

    const msUntilMidnight = this.getMillisecondsUntilMidnight();
    const hoursUntil = Math.floor(msUntilMidnight / (1000 * 60 * 60));
    const minutesUntil = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));

    console.log(`[MidnightScheduler] Next trigger in ${hoursUntil}h ${minutesUntil}m`);

    this._timeoutId = setTimeout(async () => {
      await this.triggerNewDay();
      // Schedule the next day's trigger
      this.scheduleNext();
    }, msUntilMidnight);
  },

  /**
   * Start the midnight scheduler
   * Call this when the app initializes and user is authenticated
   */
  start() {
    if (this._isEnabled) {
      console.log('[MidnightScheduler] Already running');
      return;
    }

    this._isEnabled = true;
    console.log('[MidnightScheduler] Started');
    this.scheduleNext();

    // Also listen for visibility changes to reschedule when tab becomes visible
    // This handles cases where the device was asleep at midnight
    document.addEventListener('visibilitychange', this._handleVisibilityChange.bind(this));
    
    // Listen for online events to retry if we missed midnight while offline
    window.addEventListener('online', this._handleOnline.bind(this));
  },

  /**
   * Stop the midnight scheduler
   */
  stop() {
    this._isEnabled = false;
    
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }

    document.removeEventListener('visibilitychange', this._handleVisibilityChange.bind(this));
    window.removeEventListener('online', this._handleOnline.bind(this));
    
    console.log('[MidnightScheduler] Stopped');
  },

  /**
   * Handle visibility change - check if we missed midnight while tab was hidden
   */
  _handleVisibilityChange() {
    if (document.visibilityState === 'visible' && this._isEnabled) {
      // Check if we missed midnight
      if (!this.wasTriggeredToday()) {
        const now = new Date();
        // If it's past midnight and we haven't triggered today, do it now
        if (now.getHours() < 6) { // Within 6 hours of midnight
          console.log('[MidnightScheduler] Tab became visible, checking for missed midnight...');
          this.triggerNewDay();
        }
      }
      // Reschedule in case the timeout drifted
      this.scheduleNext();
    }
  },

  /**
   * Handle coming back online - check if we missed midnight while offline
   */
  _handleOnline() {
    if (this._isEnabled && !this.wasTriggeredToday()) {
      const now = new Date();
      // If it's past midnight and we haven't triggered today, do it now
      if (now.getHours() < 6) { // Within 6 hours of midnight
        console.log('[MidnightScheduler] Back online, checking for missed midnight...');
        this.triggerNewDay();
      }
    }
  },

  /**
   * Check if the scheduler is currently enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this._isEnabled;
  }
};

// Export for use in app.js
window.MidnightScheduler = MidnightScheduler;
