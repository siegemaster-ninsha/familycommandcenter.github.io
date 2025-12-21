// AI Chat Panel Component
// Chat interface for interacting with AI assistant
// **Feature: learning-hub-ai-chat**
// **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4**

const AIChatPanel = Vue.defineComponent({
  name: 'AIChatPanel',
  template: `
    <div class="ai-chat-panel">
      <!-- Chat Header -->
      <div class="ai-chat-header">
        <div class="ai-chat-header-info">
          <div v-html="getIcon('bot', 'lucide', 24, 'ai-chat-header-icon')"></div>
          <div>
            <h2 class="ai-chat-title">AI Assistant</h2>
            <p class="ai-chat-subtitle">Ask me anything!</p>
          </div>
        </div>
        <button 
          v-if="chatStore.hasMessages"
          @click="clearChat"
          class="btn-secondary ai-chat-clear-btn"
          title="Clear chat history"
        >
          <div v-html="getIcon('trash2', 'lucide', 16, '')"></div>
          <span class="ai-chat-clear-text">Clear</span>
        </button>
      </div>
      
      <!-- Message History Area -->
      <!-- **Validates: Requirements 2.2, 2.5** -->
      <div 
        ref="messagesContainer"
        class="ai-chat-messages"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        <!-- Welcome message when empty -->
        <div v-if="!chatStore.hasMessages && !chatStore.isLoading" class="ai-chat-welcome">
          <div class="ai-chat-welcome-icon">
            <div v-html="getIcon('sparkles', 'lucide', 48, '')"></div>
          </div>
          <h3 class="ai-chat-welcome-title">Welcome to AI Chat!</h3>
          <p class="ai-chat-welcome-text">
            I'm here to help with questions about learning, homework, and everyday topics.
            Type a message below to get started.
          </p>
        </div>
        
        <!-- Message list -->
        <div 
          v-for="(message, index) in chatStore.messages" 
          :key="index"
          class="ai-chat-message"
          :class="'ai-chat-message--' + message.role"
        >
          <!-- Avatar -->
          <div class="ai-chat-message-avatar">
            <div v-if="message.role === 'user'" v-html="getIcon('user', 'lucide', 20, '')"></div>
            <div v-else v-html="getIcon('bot', 'lucide', 20, '')"></div>
          </div>
          
          <!-- Message content -->
          <div class="ai-chat-message-content">
            <div class="ai-chat-message-header">
              <span class="ai-chat-message-sender">{{ message.role === 'user' ? 'You' : 'AI Assistant' }}</span>
              <span class="ai-chat-message-time">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div class="ai-chat-message-text">{{ message.content }}</div>
          </div>
        </div>
        
        <!-- Loading indicator -->
        <!-- **Validates: Requirements 5.1** -->
        <div v-if="chatStore.isLoading" class="ai-chat-message ai-chat-message--assistant ai-chat-message--loading">
          <div class="ai-chat-message-avatar">
            <div v-html="getIcon('bot', 'lucide', 20, '')"></div>
          </div>
          <div class="ai-chat-message-content">
            <div class="ai-chat-loading-indicator">
              <span class="ai-chat-loading-dot"></span>
              <span class="ai-chat-loading-dot"></span>
              <span class="ai-chat-loading-dot"></span>
            </div>
          </div>
        </div>
        
        <!-- Error message with retry -->
        <!-- **Validates: Requirements 5.3** -->
        <div v-if="chatStore.error" class="ai-chat-error">
          <div class="ai-chat-error-content">
            <div v-html="getIcon('alertCircle', 'lucide', 20, 'ai-chat-error-icon')"></div>
            <span>{{ chatStore.error }}</span>
          </div>
          <button @click="retryLastMessage" class="btn-secondary ai-chat-retry-btn">
            <div v-html="getIcon('refreshCw', 'lucide', 16, '')"></div>
            Retry
          </button>
        </div>
      </div>
      
      <!-- Input Area -->
      <!-- **Validates: Requirements 2.1, 2.3, 5.2, 5.4** -->
      <div class="ai-chat-input-area">
        <div class="ai-chat-input-wrapper">
          <input
            ref="messageInput"
            v-model="messageText"
            @keydown.enter="sendMessage"
            :disabled="chatStore.isLoading"
            type="text"
            class="ai-chat-input"
            placeholder="Type your message..."
            aria-label="Chat message input"
          />
          <button
            @click="sendMessage"
            :disabled="chatStore.isLoading || !messageText.trim()"
            class="btn-primary ai-chat-send-btn"
            aria-label="Send message"
          >
            <div v-if="chatStore.isLoading" class="ai-chat-send-spinner"></div>
            <div v-else v-html="getIcon('send', 'lucide', 20, '')"></div>
          </button>
        </div>
      </div>
    </div>
  `,
  
  setup() {
    const chatStore = useChatStore();
    return { chatStore };
  },
  
  data() {
    return {
      messageText: '',
      lastFailedMessage: null
    };
  },
  
  watch: {
    // Auto-scroll when messages change
    'chatStore.messages': {
      handler() {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      },
      deep: true
    },
    // Auto-scroll when loading state changes
    'chatStore.isLoading'() {
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    }
  },
  
  mounted() {
    // Load messages from session storage
    this.chatStore.loadFromSession();
    
    // Focus input on mount
    this.$nextTick(() => {
      if (this.$refs.messageInput) {
        this.$refs.messageInput.focus();
      }
      this.scrollToBottom();
    });
  },
  
  methods: {
    /**
     * Get icon HTML using the Helpers library
     */
    getIcon(iconName, library = 'lucide', size = 16, className = '') {
      if (typeof window.Helpers !== 'undefined' && window.Helpers.IconLibrary) {
        return window.Helpers.IconLibrary.getIcon(iconName, library, size, className);
      }
      return '';
    },
    
    /**
     * Send message to AI
     * **Validates: Requirements 2.3, 2.4**
     */
    async sendMessage() {
      const text = this.messageText.trim();
      if (!text || this.chatStore.isLoading) return;
      
      // Store message in case we need to retry
      this.lastFailedMessage = text;
      
      // Clear input immediately
      this.messageText = '';
      
      // Clear any previous error
      this.chatStore.clearError();
      
      // Send message
      const result = await this.chatStore.sendMessage(text);
      
      // If successful, clear the last failed message
      if (result.success) {
        this.lastFailedMessage = null;
      }
      
      // Focus input after sending
      this.$nextTick(() => {
        if (this.$refs.messageInput) {
          this.$refs.messageInput.focus();
        }
      });
    },
    
    /**
     * Retry the last failed message
     * **Validates: Requirements 5.3**
     */
    async retryLastMessage() {
      if (!this.lastFailedMessage) return;
      
      // Remove the failed user message from history
      const messages = this.chatStore.messages;
      if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
        messages.pop();
      }
      
      // Clear error and retry
      this.chatStore.clearError();
      
      const result = await this.chatStore.sendMessage(this.lastFailedMessage);
      
      if (result.success) {
        this.lastFailedMessage = null;
      }
    },
    
    /**
     * Clear chat history
     */
    clearChat() {
      this.chatStore.clearHistory();
      this.lastFailedMessage = null;
      
      // Focus input after clearing
      this.$nextTick(() => {
        if (this.$refs.messageInput) {
          this.$refs.messageInput.focus();
        }
      });
    },
    
    /**
     * Scroll messages container to bottom
     */
    scrollToBottom() {
      const container = this.$refs.messagesContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },
    
    /**
     * Format timestamp for display
     * @param {Date} timestamp - The message timestamp
     * @returns {string} Formatted time string
     */
    formatTime(timestamp) {
      if (!timestamp) return '';
      
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  }
});

// Register component globally
if (typeof window !== 'undefined') {
  window.AIChatPanel = AIChatPanel;
}
