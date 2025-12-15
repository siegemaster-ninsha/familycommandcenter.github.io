/**
 * MobileLifecycleManager
 * 
 * A reusable utility class for handling mobile PWA lifecycle events,
 * particularly iOS Safari issues when apps go to background and return.
 * 
 * Common issues this solves:
 * - CSS custom properties getting lost
 * - Theme styling breaking (black backgrounds)
 * - Stale page state after bfcache restoration
 * 
 * Usage:
 * ```js
 * // Basic usage with defaults
 * const lifecycle = new MobileLifecycleManager();
 * lifecycle.init();
 * 
 * // With custom handlers
 * const lifecycle = new MobileLifecycleManager({
 *   onResume: (info) => {
 *     console.log('App resumed after', info.timeInBackground, 'ms');
 *     MyThemeManager.reapply();
 *   },
 *   onBackground: () => {
 *     console.log('App going to background');
 *   },
 *   deepRefreshThreshold: 60000, // 1 minute
 *   debug: true
 * });
 * lifecycle.init();
 * ```
 * 
 * @author Family Command Center
 * @license MIT
 */

class MobileLifecycleManager {
  /**
   * @param {Object} options - Configuration options
   * @param {Function} [options.onResume] - Callback when app resumes from background
   * @param {Function} [options.onBackground] - Callback when app goes to background
   * @param {Function} [options.onDeepRefresh] - Callback for deep refresh (long background)
   * @param {Function} [options.refreshStyles] - Custom style refresh function
   * @param {number} [options.deepRefreshThreshold=30000] - Ms in background before deep refresh
   * @param {boolean} [options.debug=false] - Enable debug logging
   * @param {string} [options.refreshClass='mobile-refresh'] - CSS class for refresh animation
   */
  constructor(options = {}) {
    this.options = {
      onResume: options.onResume || null,
      onBackground: options.onBackground || null,
      onDeepRefresh: options.onDeepRefresh || null,
      refreshStyles: options.refreshStyles || null,
      deepRefreshThreshold: options.deepRefreshThreshold || 30000,
      debug: options.debug || false,
      refreshClass: options.refreshClass || 'mobile-refresh'
    };
    
    this.state = {
      initialized: false,
      lastVisibilityState: typeof document !== 'undefined' ? document.visibilityState : 'visible',
      backgroundTimestamp: null,
      resumeCount: 0
    };
    
    // Bind methods to preserve context
    this._handleVisibilityChange = this._handleVisibilityChange.bind(this);
    this._handlePageShow = this._handlePageShow.bind(this);
    this._handleFocus = this._handleFocus.bind(this);
    this._handleOrientationChange = this._handleOrientationChange.bind(this);
  }
  
  /**
   * Platform detection utilities
   */
  static get platform() {
    if (typeof navigator === 'undefined') {
      return { isIOS: false, isAndroid: false, isStandalone: false, isMobile: false };
    }
    
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         window.navigator.standalone === true;
    const isMobile = isIOS || isAndroid || /Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    
    return { isIOS, isAndroid, isStandalone, isMobile };
  }
  
  /**
   * Debug logger
   */
  _log(...args) {
    if (this.options.debug) {
      console.log('📱 [MobileLifecycle]', ...args);
    }
  }
  
  /**
   * Initialize all lifecycle handlers
   * @returns {MobileLifecycleManager} this instance for chaining
   */
  init() {
    if (typeof document === 'undefined') {
      this._log('Not in browser environment, skipping init');
      return this;
    }
    
    if (this.state.initialized) {
      this._log('Already initialized');
      return this;
    }
    
    const { isIOS, isStandalone, isMobile } = MobileLifecycleManager.platform;
    this._log('Initializing...', { isIOS, isStandalone, isMobile });
    
    // Core handlers (all platforms)
    document.addEventListener('visibilitychange', this._handleVisibilityChange);
    window.addEventListener('pageshow', this._handlePageShow);
    window.addEventListener('focus', this._handleFocus);
    
    // Mobile-specific handlers
    if (isMobile) {
      window.addEventListener('orientationchange', this._handleOrientationChange);
    }
    
    this.state.initialized = true;
    this._log('Initialized successfully');
    
    return this;
  }
  
  /**
   * Clean up event listeners
   */
  destroy() {
    if (!this.state.initialized) return;
    
    document.removeEventListener('visibilitychange', this._handleVisibilityChange);
    window.removeEventListener('pageshow', this._handlePageShow);
    window.removeEventListener('focus', this._handleFocus);
    window.removeEventListener('orientationchange', this._handleOrientationChange);
    
    this.state.initialized = false;
    this._log('Destroyed');
  }
  
  /**
   * Handle visibility change (tab/app switching)
   */
  _handleVisibilityChange() {
    const currentState = document.visibilityState;
    this._log('Visibility changed:', this.state.lastVisibilityState, '->', currentState);
    
    if (currentState === 'hidden') {
      this.state.backgroundTimestamp = Date.now();
      if (this.options.onBackground) {
        this.options.onBackground();
      }
    } else if (currentState === 'visible' && this.state.lastVisibilityState === 'hidden') {
      const timeInBackground = this.state.backgroundTimestamp 
        ? Date.now() - this.state.backgroundTimestamp 
        : 0;
      
      this._log('Resumed after', timeInBackground, 'ms');
      this._handleResume({ timeInBackground, source: 'visibility' });
    }
    
    this.state.lastVisibilityState = currentState;
  }
  
  /**
   * Handle pageshow event (bfcache restoration)
   */
  _handlePageShow(event) {
    if (event.persisted) {
      this._log('Page restored from bfcache');
      this._handleResume({ timeInBackground: 0, source: 'bfcache', fromBfcache: true });
    }
  }
  
  /**
   * Handle focus event
   */
  _handleFocus() {
    setTimeout(() => {
      if (document.visibilityState === 'visible') {
        this._log('Window focused');
        this.refreshStyles();
      }
    }, 100);
  }
  
  /**
   * Handle orientation change
   */
  _handleOrientationChange() {
    setTimeout(() => {
      this._log('Orientation changed');
      this.refreshStyles();
    }, 300);
  }
  
  /**
   * Central resume handler
   */
  _handleResume(info) {
    this.state.resumeCount++;
    info.resumeCount = this.state.resumeCount;
    this._log('Resume handler triggered', new Date().toISOString(), info);
    
    // Always refresh styles
    this.refreshStyles();
    
    // Verify theme was applied correctly after refresh
    if (typeof ThemeManager !== 'undefined' && ThemeManager.verifyThemeApplied) {
      const themeValid = ThemeManager.verifyThemeApplied();
      this._log('Theme verification result:', themeValid);
      if (!themeValid) {
        this._log('Theme verification failed, applying fallback colors');
        if (ThemeManager._applyFallbackColors) {
          ThemeManager._applyFallbackColors();
        }
      }
    }
    
    // Deep refresh if needed
    const needsDeepRefresh = info.timeInBackground > this.options.deepRefreshThreshold || info.fromBfcache;
    if (needsDeepRefresh) {
      this._log('Performing deep refresh');
      this.deepRefresh();
      if (this.options.onDeepRefresh) {
        this.options.onDeepRefresh(info);
      }
    }
    
    // Custom callback
    if (this.options.onResume) {
      this.options.onResume(info);
    }
    
    // Dispatch event for other listeners
    window.dispatchEvent(new CustomEvent('app-resumed', { detail: info }));
  }
  
  /**
   * Refresh CSS styles - main fix for iOS background issue
   */
  refreshStyles() {
    this._log('Refreshing styles...', new Date().toISOString());
    
    // Use custom refresh function if provided
    if (this.options.refreshStyles) {
      this.options.refreshStyles();
      return;
    }
    
    // Check for CSS variable loss before refresh
    const cssLost = this._detectCSSVariableLoss();
    if (cssLost) {
      this._log('CSS variables lost, triggering recovery...');
    }
    
    // Default: Re-apply theme if ThemeManager exists
    if (typeof ThemeManager !== 'undefined' && ThemeManager.forceRefresh) {
      // Use the new forceRefresh method for iOS recovery
      this._log('Using ThemeManager.forceRefresh()');
      ThemeManager.forceRefresh();
    } else if (typeof ThemeManager !== 'undefined' && ThemeManager.applyTheme) {
      // Fallback to direct applyTheme if forceRefresh not available
      const currentTheme = ThemeManager.getCurrentTheme?.() || 
                          localStorage.getItem('selectedTheme') || 
                          'default';
      this._log('Re-applying theme:', currentTheme);
      ThemeManager.applyTheme(currentTheme);
    } else {
      // Fallback: Try to restore CSS variables from localStorage
      this._restoreCSSVariablesFromStorage();
    }
    
    // Force repaint
    this._forceRepaint();
  }
  
  /**
   * Detect if CSS variables were lost (e.g., after iOS bfcache restoration)
   */
  _detectCSSVariableLoss() {
    try {
      const root = document.documentElement;
      const style = getComputedStyle(root);
      const bgPrimary = style.getPropertyValue('--color-bg-primary').trim();
      
      // Check for signs of CSS variable loss
      return !bgPrimary || 
             bgPrimary === '' || 
             bgPrimary === 'rgba(0, 0, 0, 0)' ||
             bgPrimary === 'transparent' ||
             bgPrimary === 'rgb(0, 0, 0)';
    } catch (e) {
      this._log('Failed to detect CSS variable loss:', e);
      return true; // Assume loss on error
    }
  }
  
  /**
   * Fallback method to restore CSS variables if ThemeManager isn't available
   */
  _restoreCSSVariablesFromStorage() {
    try {
      const savedVars = localStorage.getItem('fcc_css_variables');
      if (savedVars) {
        const vars = JSON.parse(savedVars);
        const root = document.documentElement;
        Object.entries(vars).forEach(([key, value]) => {
          root.style.setProperty(key, value);
        });
        this._log('Restored CSS variables from storage');
      }
    } catch (e) {
      this._log('Failed to restore CSS variables:', e);
    }
  }
  
  /**
   * Force browser repaint - more aggressive for iOS recovery
   */
  _forceRepaint() {
    const root = document.documentElement;
    const { refreshClass } = this.options;
    
    root.classList.add(refreshClass);
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove(refreshClass);
      });
    });
    
    // Force body background refresh - more aggressive for iOS
    const body = document.body;
    if (body) {
      // Get computed background color from CSS variable
      const computedBg = getComputedStyle(body).backgroundColor;
      const varBg = getComputedStyle(root).getPropertyValue('--color-bg-primary').trim();
      const textColor = getComputedStyle(root).getPropertyValue('--color-text-primary').trim();
      
      // Force a style recalculation
      body.style.display = 'none';
      body.offsetHeight; // Force reflow
      body.style.display = '';
      
      // Re-apply background if it was lost
      if (computedBg === 'rgba(0, 0, 0, 0)' || computedBg === 'transparent' || computedBg === 'rgb(0, 0, 0)') {
        if (varBg) {
          body.style.backgroundColor = varBg;
        } else {
          // Ultimate fallback - apply a light background
          body.style.backgroundColor = '#f5f5f5';
        }
        this._log('Fixed black/transparent background');
      }
      
      // Also re-apply text color if needed
      if (textColor) {
        body.style.color = textColor;
      }
    }
    
    // Also refresh the app container if it exists
    const appContainer = document.getElementById('app');
    if (appContainer) {
      // Force style recalculation on app container
      const appBg = getComputedStyle(root).getPropertyValue('--color-bg-primary').trim();
      if (appBg) {
        appContainer.style.backgroundColor = appBg;
      }
      
      appContainer.style.opacity = '0.99';
      requestAnimationFrame(() => {
        appContainer.style.opacity = '1';
      });
    }
  }
  
  /**
   * Deep refresh for longer background periods
   */
  deepRefresh() {
    this._log('Deep refresh...');
    
    // Toggle stylesheets to force reload
    const styleSheets = document.styleSheets;
    for (let i = 0; i < styleSheets.length; i++) {
      try {
        const sheet = styleSheets[i];
        if (sheet.href) {
          sheet.disabled = true;
          requestAnimationFrame(() => {
            sheet.disabled = false;
          });
        }
      } catch (e) {
        // CORS may prevent access
      }
    }
  }
  
  /**
   * Manually trigger a refresh (useful for testing or external triggers)
   */
  manualRefresh() {
    this._log('Manual refresh triggered');
    this._handleResume({ timeInBackground: 0, source: 'manual' });
  }
  
  /**
   * Get current state info
   */
  getState() {
    return {
      ...this.state,
      platform: MobileLifecycleManager.platform
    };
  }
}

// Create default instance with app-specific configuration
const mobileLifecycle = new MobileLifecycleManager({
  debug: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  refreshClass: 'ios-refresh',
  onResume: (info) => {
    console.log('📱 App resumed:', info);
  }
});

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mobileLifecycle.init());
} else {
  mobileLifecycle.init();
}

// Export for use in other modules
window.MobileLifecycleManager = MobileLifecycleManager;
window.mobileLifecycle = mobileLifecycle;

// Legacy alias for backward compatibility
window.iOSLifecycle = mobileLifecycle;
