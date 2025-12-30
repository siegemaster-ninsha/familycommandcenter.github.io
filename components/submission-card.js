// Submission Card Component
// Displays a homework submission with status, family member info, and grading results
// **Feature: homework-grading**
// **Validates: Requirements 3.2, 3.4, 3.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

const SubmissionCard = Vue.defineComponent({
  name: 'SubmissionCard',
  
  props: {
    // Job data with status and result
    job: {
      type: Object,
      required: true
    },
    // Family member info (optional - will look up from store if not provided)
    familyMember: {
      type: Object,
      default: null
    }
  },
  
  emits: ['click', 'delete'],
  
  template: `
    <div 
      class="submission-card"
      :class="cardClasses"
      @click="handleClick"
      role="button"
      tabindex="0"
      @keydown.enter="handleClick"
      @keydown.space.prevent="handleClick"
      :aria-label="ariaLabel"
    >
      <!-- Card Header: Family Member + Timestamp -->
      <div class="submission-card-header">
        <div class="submission-card-member">
          <!-- Avatar -->
          <!-- **Validates: Requirements 7.1** -->
          <div class="submission-card-avatar" :style="avatarStyle">
            <span v-if="!memberAvatar">{{ memberInitial }}</span>
            <img v-else :src="memberAvatar" :alt="memberName" class="submission-card-avatar-img" />
          </div>
          
          <!-- Name -->
          <!-- **Validates: Requirements 7.1** -->
          <div class="submission-card-member-info">
            <span class="submission-card-member-name">{{ memberName }}</span>
            <!-- **Validates: Requirements 7.6** -->
            <span class="submission-card-timestamp">{{ formattedTimestamp }}</span>
          </div>
        </div>
        
        <!-- Status Badge -->
        <div class="submission-card-status" :class="statusClasses">
          <!-- **Validates: Requirements 3.2, 7.2** -->
          <div v-if="isPending || isProcessing" class="submission-card-spinner"></div>
          <div v-else-if="isCompleted" v-html="getIcon('checkCircle', 'lucide', 16, '')"></div>
          <div v-else-if="isFailed" v-html="getIcon('alertCircle', 'lucide', 16, '')"></div>
          <span class="submission-card-status-text">{{ statusText }}</span>
        </div>
      </div>
      
      <!-- Card Body: Results or Progress -->
      <div class="submission-card-body">
        <!-- Pending/Processing State -->
        <!-- **Validates: Requirements 3.2, 7.2** -->
        <div v-if="isPending || isProcessing" class="submission-card-progress">
          <div class="submission-card-progress-bar">
            <div class="submission-card-progress-fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <span class="submission-card-progress-text">{{ progressText }}</span>
        </div>
        
        <!-- Completed State -->
        <!-- **Validates: Requirements 3.4, 7.3, 7.4** -->
        <div v-else-if="isCompleted" class="submission-card-results">
          <!-- Score Display -->
          <div class="submission-card-score">
            <span class="submission-card-score-value" :class="scoreColorClass">{{ correctnessScore }}%</span>
            <span class="submission-card-score-label">Score</span>
          </div>
          
          <!-- Completion Status -->
          <div class="submission-card-completion" :class="completionClasses">
            <div v-html="completionIcon"></div>
            <span>{{ completionText }}</span>
          </div>
          
          <!-- Question Summary -->
          <div v-if="questionCount > 0" class="submission-card-questions">
            <span class="submission-card-questions-text">{{ questionSummary }}</span>
          </div>
        </div>
        
        <!-- Failed State -->
        <!-- **Validates: Requirements 3.5, 7.5** -->
        <div v-else-if="isFailed" class="submission-card-error">
          <div v-html="getIcon('alertTriangle', 'lucide', 20, 'submission-card-error-icon')"></div>
          <span class="submission-card-error-text">{{ errorMessage }}</span>
        </div>
      </div>
      
      <!-- Card Footer: Actions -->
      <div class="submission-card-footer">
        <span class="submission-card-images">
          <div v-html="getIcon('image', 'lucide', 14, '')"></div>
          {{ imageCount }} {{ imageCount === 1 ? 'image' : 'images' }}
        </span>
        
        <button 
          @click.stop="handleDelete"
          class="submission-card-delete-btn"
          title="Delete submission"
          aria-label="Delete submission"
        >
          <div v-html="getIcon('trash2', 'lucide', 16, '')"></div>
        </button>
      </div>
    </div>
  `,
  
  computed: {
    // =============================================
    // FAMILY MEMBER COMPUTED PROPERTIES
    // =============================================
    
    /**
     * Get the resolved family member (from prop or store lookup)
     * **Validates: Requirements 7.1**
     */
    resolvedMember() {
      if (this.familyMember) {
        return this.familyMember;
      }
      
      // Look up from family store
      const memberId = this.job?.metadata?.familyMemberId;
      if (memberId && window.useFamilyStore) {
        const familyStore = window.useFamilyStore();
        return familyStore.memberById(memberId);
      }
      
      return null;
    },
    
    /**
     * Get member display name
     * **Validates: Requirements 7.1**
     */
    memberName() {
      return this.resolvedMember?.displayName || 
             this.resolvedMember?.name || 
             'Unknown';
    },
    
    /**
     * Get member avatar URL
     */
    memberAvatar() {
      return this.resolvedMember?.avatar || null;
    },
    
    /**
     * Get member initial for avatar fallback
     */
    memberInitial() {
      return this.memberName.charAt(0).toUpperCase();
    },
    
    /**
     * Get avatar background style
     */
    avatarStyle() {
      if (this.memberAvatar) return {};
      
      // Generate consistent color from member name
      const colors = [
        'var(--color-primary-500)',
        'var(--color-secondary-500)',
        'var(--color-success-500)',
        'var(--color-warning-500)'
      ];
      const index = this.memberName.charCodeAt(0) % colors.length;
      
      return {
        backgroundColor: colors[index],
        color: 'white'
      };
    },
    
    // =============================================
    // STATUS COMPUTED PROPERTIES
    // =============================================
    
    /**
     * Check if job is pending
     * **Validates: Requirements 3.2, 7.2**
     */
    isPending() {
      return this.job?.status === 'pending';
    },
    
    /**
     * Check if job is processing
     * **Validates: Requirements 3.2, 7.2**
     */
    isProcessing() {
      return this.job?.status === 'processing';
    },
    
    /**
     * Check if job is completed
     * **Validates: Requirements 3.4, 7.3, 7.4**
     */
    isCompleted() {
      return this.job?.status === 'completed';
    },
    
    /**
     * Check if job failed
     * **Validates: Requirements 3.5, 7.5**
     */
    isFailed() {
      return this.job?.status === 'failed';
    },
    
    /**
     * Get status text for display
     * **Validates: Requirements 3.2, 3.4, 3.5**
     */
    statusText() {
      switch (this.job?.status) {
        case 'pending': return 'Pending';
        case 'processing': return 'Grading...';
        case 'completed': return 'Graded';
        case 'failed': return 'Failed';
        default: return 'Unknown';
      }
    },
    
    /**
     * Get CSS classes for status badge
     */
    statusClasses() {
      return {
        'submission-card-status--pending': this.isPending,
        'submission-card-status--processing': this.isProcessing,
        'submission-card-status--completed': this.isCompleted,
        'submission-card-status--failed': this.isFailed
      };
    },
    
    /**
     * Get CSS classes for card
     */
    cardClasses() {
      return {
        'submission-card--pending': this.isPending,
        'submission-card--processing': this.isProcessing,
        'submission-card--completed': this.isCompleted,
        'submission-card--failed': this.isFailed
      };
    },
    
    // =============================================
    // PROGRESS COMPUTED PROPERTIES
    // =============================================
    
    /**
     * Get progress percentage for pending/processing jobs
     */
    progressPercent() {
      if (this.isPending) return 10;
      if (this.isProcessing) return 60;
      return 100;
    },
    
    /**
     * Get progress text
     */
    progressText() {
      if (this.isPending) return 'Waiting to start...';
      if (this.isProcessing) return 'AI is grading homework...';
      return '';
    },
    
    // =============================================
    // RESULT COMPUTED PROPERTIES
    // =============================================
    
    /**
     * Get grading result from job
     */
    gradingResult() {
      return this.job?.result || null;
    },
    
    /**
     * Get correctness score
     * **Validates: Requirements 7.3**
     */
    correctnessScore() {
      return this.gradingResult?.correctnessScore ?? 0;
    },
    
    /**
     * Get score color class based on score value
     */
    scoreColorClass() {
      const score = this.correctnessScore;
      if (score >= 80) return 'submission-card-score--high';
      if (score >= 60) return 'submission-card-score--medium';
      return 'submission-card-score--low';
    },
    
    /**
     * Get completion status
     * **Validates: Requirements 7.4**
     */
    completionStatus() {
      return this.gradingResult?.completionStatus || 'unknown';
    },
    
    /**
     * Get completion text
     */
    completionText() {
      return this.completionStatus === 'complete' ? 'All questions attempted' : 'Incomplete';
    },
    
    /**
     * Get completion icon HTML
     */
    completionIcon() {
      const iconName = this.completionStatus === 'complete' ? 'checkCircle' : 'alertCircle';
      return this.getIcon(iconName, 'lucide', 16, '');
    },
    
    /**
     * Get CSS classes for completion status
     */
    completionClasses() {
      return {
        'submission-card-completion--complete': this.completionStatus === 'complete',
        'submission-card-completion--incomplete': this.completionStatus !== 'complete'
      };
    },
    
    /**
     * Get question count
     */
    questionCount() {
      return this.gradingResult?.questions?.length || 0;
    },
    
    /**
     * Get question summary text
     */
    questionSummary() {
      const questions = this.gradingResult?.questions || [];
      const correct = questions.filter(q => q.isCorrect).length;
      const total = questions.length;
      return `${correct}/${total} correct`;
    },
    
    // =============================================
    // ERROR COMPUTED PROPERTIES
    // =============================================
    
    /**
     * Get error message for failed jobs
     * **Validates: Requirements 3.5, 7.5**
     */
    errorMessage() {
      return this.job?.error || 'An error occurred while grading';
    },
    
    // =============================================
    // METADATA COMPUTED PROPERTIES
    // =============================================
    
    /**
     * Get image count from metadata
     */
    imageCount() {
      return this.job?.metadata?.imageCount || 0;
    },
    
    /**
     * Get formatted timestamp
     * **Validates: Requirements 7.6**
     */
    formattedTimestamp() {
      const timestamp = this.job?.createdAt;
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      // Relative time for recent submissions
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      // Absolute date for older submissions
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
    },
    
    /**
     * Get aria label for accessibility
     */
    ariaLabel() {
      const status = this.statusText;
      const member = this.memberName;
      
      if (this.isCompleted) {
        return `${member}'s homework - ${status} - Score: ${this.correctnessScore}%`;
      }
      
      return `${member}'s homework - ${status}`;
    }
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
     * Handle card click
     */
    handleClick() {
      this.$emit('click', this.job);
    },
    
    /**
     * Handle delete button click
     */
    handleDelete() {
      this.$emit('delete', this.job?.jobId);
    }
  }
});

// Export for status display mapping (used in property tests)
// **Feature: homework-grading, Property 3: Status Display Mapping**
// **Validates: Requirements 3.2, 3.4, 3.5, 7.2, 7.3, 7.4, 7.5**
const StatusDisplayMapping = {
  /**
   * Map job status to display properties
   * @param {string} status - Job status (pending, processing, completed, failed)
   * @returns {Object} Display properties
   */
  getDisplayForStatus(status) {
    switch (status) {
      case 'pending':
        return {
          showSpinner: true,
          showScore: false,
          showError: false,
          statusText: 'Pending',
          statusClass: 'submission-card-status--pending'
        };
      case 'processing':
        return {
          showSpinner: true,
          showScore: false,
          showError: false,
          statusText: 'Grading...',
          statusClass: 'submission-card-status--processing'
        };
      case 'completed':
        return {
          showSpinner: false,
          showScore: true,
          showError: false,
          statusText: 'Graded',
          statusClass: 'submission-card-status--completed'
        };
      case 'failed':
        return {
          showSpinner: false,
          showScore: false,
          showError: true,
          statusText: 'Failed',
          statusClass: 'submission-card-status--failed'
        };
      default:
        return {
          showSpinner: false,
          showScore: false,
          showError: false,
          statusText: 'Unknown',
          statusClass: ''
        };
    }
  },
  
  /**
   * Get all valid statuses
   * @returns {string[]} Array of valid status values
   */
  getValidStatuses() {
    return ['pending', 'processing', 'completed', 'failed'];
  }
};

// Register component globally
if (typeof window !== 'undefined') {
  window.SubmissionCard = SubmissionCard;
  window.StatusDisplayMapping = StatusDisplayMapping;
}
