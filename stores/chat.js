// Chat Store
// Manages AI chat state: messages, loading, errors
// **Feature: learning-hub-ai-chat**
// **Validates: Requirements 2.3, 5.1, 5.2, 5.3, 5.4, 6.1, 6.3, 6.4**

// Session storage keys
const CHAT_MESSAGES_KEY = 'chat_messages';
const CHAT_SESSION_KEY = 'chat_session_active';

const useChatStore = Pinia.defineStore('chat', {
  state: () => ({
    // Message history - array of { role: 'user'|'assistant', content: string, timestamp: Date }
    messages: [],
    
    // Loading state for API calls
    isLoading: false,
    
    // Error message if any
    error: null,
    
    // Track if session has been initialized
    _sessionInitialized: false
  }),
  
  getters: {
    // Get message count
    messageCount: (state) => state.messages.length,
    
    // Check if chat has any messages
    hasMessages: (state) => state.messages.length > 0,
    
    // Get recent messages for API context (max 10)
    recentHistory: (state) => {
      return state.messages.slice(-10);
    }
  },
  
  actions: {
    /**
     * Send a message to the AI chat API
     * **Validates: Requirements 2.3, 5.1, 5.2, 5.4**
     * 
     * @param {string} content - The message content to send
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async sendMessage(content) {
      if (!content || typeof content !== 'string' || !content.trim()) {
        return { success: false, error: 'Message content is required' };
      }
      
      const trimmedContent = content.trim();
      
      // Add user message to history immediately (optimistic update)
      // **Validates: Requirements 2.3**
      const userMessage = {
        role: 'user',
        content: trimmedContent,
        timestamp: new Date()
      };
      this.messages.push(userMessage);
      
      // Save user message to session storage immediately
      // **Validates: Requirements 6.3**
      this._saveToSession();
      
      // Set loading state
      // **Validates: Requirements 5.1, 5.2**
      this.isLoading = true;
      this.error = null;
      
      try {
        // Build history for context (exclude the message we just added)
        const history = this.messages.slice(0, -1).slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        
        // Call API
        const response = await apiService.post(CONFIG.API.ENDPOINTS.CHAT_MESSAGE, {
          message: trimmedContent,
          history
        });
        
        if (response.success && response.response) {
          // Add AI response to history
          const assistantMessage = {
            role: 'assistant',
            content: response.response,
            timestamp: new Date(response.timestamp || Date.now())
          };
          this.messages.push(assistantMessage);
          
          // Save to session storage (includes AI response)
          this._saveToSession();
          
          return { success: true };
        } else {
          // Handle API error response
          const errorMsg = response.error || 'Failed to get AI response';
          this.error = errorMsg;
          return { success: false, error: errorMsg };
        }
      } catch (error) {
        // Handle network/unexpected errors
        // **Validates: Requirements 5.3**
        const errorMsg = this._formatError(error);
        this.error = errorMsg;
        console.error('[Chat] Send message failed:', error);
        return { success: false, error: errorMsg };
      } finally {
        // Re-enable input
        // **Validates: Requirements 5.4**
        this.isLoading = false;
      }
    },
    
    /**
     * Clear all chat history
     * **Validates: Requirements 6.4**
     */
    clearHistory() {
      this.messages = [];
      this.error = null;
      this._clearSession();
      console.log('[Chat] History cleared');
    },
    
    /**
     * Clear current error
     */
    clearError() {
      this.error = null;
    },
    
    /**
     * Initialize session - call this on app startup
     * Handles the distinction between page refresh (clear) and SPA navigation (preserve)
     * **Validates: Requirements 6.3, 6.4**
     */
    initSession() {
      if (this._sessionInitialized) {
        return;
      }
      
      try {
        // Check if this is a page refresh or a fresh session
        // We use a session marker that gets set after first load
        // If marker exists, we're navigating within SPA - load messages
        // If marker doesn't exist, it's a page refresh - clear messages
        const sessionMarker = sessionStorage.getItem(CHAT_SESSION_KEY);
        
        if (sessionMarker) {
          // SPA navigation - load existing messages
          // **Validates: Requirements 6.3**
          this._loadFromStorage();
          console.log('[Chat] Session restored -', this.messages.length, 'messages');
        } else {
          // Page refresh or new session - start fresh
          // **Validates: Requirements 6.4**
          this._clearStorage();
          console.log('[Chat] Fresh session started');
        }
        
        // Set the session marker for future navigations
        sessionStorage.setItem(CHAT_SESSION_KEY, 'true');
        this._sessionInitialized = true;
      } catch (error) {
        console.warn('[Chat] Session init failed:', error);
        this._sessionInitialized = true;
      }
    },
    
    /**
     * Load messages from session storage (called during SPA navigation)
     * **Validates: Requirements 6.3**
     */
    loadFromSession() {
      // Initialize session if not already done
      if (!this._sessionInitialized) {
        this.initSession();
        return;
      }
      
      // If already initialized, just load from storage
      this._loadFromStorage();
    },
    
    /**
     * Internal: Load messages from storage
     * @private
     */
    _loadFromStorage() {
      try {
        const stored = sessionStorage.getItem(CHAT_MESSAGES_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            this.messages = parsed.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
          }
        }
      } catch (error) {
        console.warn('[Chat] Failed to load from storage:', error);
      }
    },
    
    /**
     * Save messages to session storage
     * @private
     */
    _saveToSession() {
      try {
        sessionStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(this.messages));
      } catch (error) {
        console.warn('[Chat] Failed to save to session:', error);
      }
    },
    
    /**
     * Clear session storage (messages only, keep session marker)
     * @private
     */
    _clearSession() {
      try {
        sessionStorage.removeItem(CHAT_MESSAGES_KEY);
      } catch (error) {
        console.warn('[Chat] Failed to clear session:', error);
      }
    },
    
    /**
     * Clear all storage including session marker
     * @private
     */
    _clearStorage() {
      try {
        sessionStorage.removeItem(CHAT_MESSAGES_KEY);
        // Don't remove session marker here - it's managed by initSession
      } catch (error) {
        console.warn('[Chat] Failed to clear storage:', error);
      }
    },
    
    /**
     * Format error message for display
     * @private
     * @param {Error} error - The error object
     * @returns {string} User-friendly error message
     */
    _formatError(error) {
      if (!error) return 'An unexpected error occurred';
      
      const message = error.message || String(error);
      
      // Map common errors to user-friendly messages
      if (message.includes('AUTH_REQUIRED') || message.includes('401')) {
        return 'Please log in to use the chat';
      }
      if (message.includes('network') || message.includes('fetch')) {
        return 'Unable to connect. Please check your internet connection.';
      }
      if (message.includes('timeout') || message.includes('504')) {
        return 'The AI is taking too long to respond. Please try again.';
      }
      if (message.includes('503') || message.includes('unavailable')) {
        return 'AI service temporarily unavailable. Please try again later.';
      }
      
      // Return the message if it's already user-friendly, otherwise generic
      if (message.length < 100 && !message.includes('Error:')) {
        return message;
      }
      
      return 'Something went wrong. Please try again later.';
    }
  }
});

// Export for use in components
if (typeof window !== 'undefined') {
  window.useChatStore = useChatStore;
}
