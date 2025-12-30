// Homework Detail View Component
// Displays detailed view of a homework submission with original images and AI feedback
// **Feature: homework-grading**
// **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

const HomeworkDetailView = Vue.defineComponent({
  name: 'HomeworkDetailView',
  
  props: {
    // Job data with status, metadata, and result
    job: {
      type: Object,
      required: true
    }
  },
  
  emits: ['close'],
  
  template: `
    <div class="homework-detail-view">
      <!-- Header -->
      <div class="homework-detail-header">
        <button 
          @click="$emit('close')"
          class="homework-detail-back-btn"
          aria-label="Go back"
        >
          <div v-html="getIcon('arrowLeft', 'lucide', 20, '')"></div>
          <span>Back</span>
        </button>
        
        <div class="homework-detail-header-info">
          <h2 class="homework-detail-title">{{ memberName }}'s Homework</h2>
          <span class="homework-detail-timestamp">{{ formattedTimestamp }}</span>
        </div>
      </div>
      
      <!-- In-Progress View -->
      <!-- **Validates: Requirements 8.6** -->
      <div v-if="isPending || isProcessing" class="homework-detail-progress-view">
        <div class="homework-detail-progress-card">
          <div class="homework-detail-progress-icon">
            <div class="homework-detail-spinner"></div>
          </div>
          <h3 class="homework-detail-progress-title">{{ progressTitle }}</h3>
          <p class="homework-detail-progress-text">{{ progressText }}</p>
          
          <!-- Progress Bar -->
          <div class="homework-detail-progress-bar-container">
            <div class="homework-detail-progress-bar">
              <div 
                class="homework-detail-progress-fill" 
                :style="{ width: progressPercent + '%' }"
              ></div>
            </div>
            <span class="homework-detail-progress-percent">{{ progressPercent }}%</span>
          </div>
          
          <!-- Status Steps -->
          <div class="homework-detail-status-steps">
            <div 
              v-for="(step, index) in progressSteps" 
              :key="index"
              class="homework-detail-status-step"
              :class="{ 
                'homework-detail-status-step--complete': step.complete,
                'homework-detail-status-step--active': step.active
              }"
            >
              <div class="homework-detail-status-step-icon">
                <div v-if="step.complete" v-html="getIcon('check', 'lucide', 14, '')"></div>
                <div v-else-if="step.active" class="homework-detail-step-spinner"></div>
                <span v-else>{{ index + 1 }}</span>
              </div>
              <span class="homework-detail-status-step-label">{{ step.label }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Failed View -->
      <div v-else-if="isFailed" class="homework-detail-error-view">
        <div class="homework-detail-error-card">
          <div class="homework-detail-error-icon">
            <div v-html="getIcon('alertTriangle', 'lucide', 48, '')"></div>
          </div>
          <h3 class="homework-detail-error-title">Grading Failed</h3>
          <p class="homework-detail-error-text">{{ errorMessage }}</p>
          <button @click="$emit('close')" class="btn-primary">
            Go Back
          </button>
        </div>
      </div>
      
      <!-- Completed View -->
      <!-- **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5** -->
      <div v-else-if="isCompleted" class="homework-detail-content">
        <!-- Image Gallery Section -->
        <!-- **Validates: Requirements 8.2, 8.5** -->
        <section class="homework-detail-section homework-detail-images-section">
          <h3 class="homework-detail-section-title">
            <div v-html="getIcon('image', 'lucide', 18, '')"></div>
            Original Images
          </h3>
          
          <div class="homework-detail-image-gallery">
            <!-- Main Image Display -->
            <div class="homework-detail-main-image">
              <img 
                v-if="currentImage"
                :src="currentImage" 
                :alt="'Homework image ' + (currentImageIndex + 1)"
                class="homework-detail-image"
                @click="openImageFullscreen"
              />
              <div v-else class="homework-detail-no-image">
                <div v-html="getIcon('imageOff', 'lucide', 48, '')"></div>
                <p>No image available</p>
              </div>
            </div>
            
            <!-- Image Navigation -->
            <!-- **Validates: Requirements 8.5** -->
            <div v-if="imageCount > 1" class="homework-detail-image-nav">
              <button 
                @click="previousImage"
                :disabled="currentImageIndex === 0"
                class="homework-detail-nav-btn"
                aria-label="Previous image"
              >
                <div v-html="getIcon('chevronLeft', 'lucide', 20, '')"></div>
              </button>
              
              <div class="homework-detail-image-indicators">
                <button
                  v-for="(_, index) in images"
                  :key="index"
                  @click="goToImage(index)"
                  class="homework-detail-image-indicator"
                  :class="{ 'homework-detail-image-indicator--active': index === currentImageIndex }"
                  :aria-label="'Go to image ' + (index + 1)"
                ></button>
              </div>
              
              <button 
                @click="nextImage"
                :disabled="currentImageIndex === imageCount - 1"
                class="homework-detail-nav-btn"
                aria-label="Next image"
              >
                <div v-html="getIcon('chevronRight', 'lucide', 20, '')"></div>
              </button>
            </div>
            
            <p class="homework-detail-image-count">
              Image {{ currentImageIndex + 1 }} of {{ imageCount }}
            </p>
          </div>
        </section>
        
        <!-- Grading Summary Section -->
        <section class="homework-detail-section homework-detail-summary-section">
          <h3 class="homework-detail-section-title">
            <div v-html="getIcon('clipboardCheck', 'lucide', 18, '')"></div>
            Grading Summary
          </h3>
          
          <div class="homework-detail-summary-grid">
            <!-- Score Card -->
            <div class="homework-detail-summary-card homework-detail-score-card">
              <span class="homework-detail-summary-label">Score</span>
              <span class="homework-detail-summary-value" :class="scoreColorClass">
                {{ correctnessScore }}%
              </span>
            </div>
            
            <!-- Completion Card -->
            <div class="homework-detail-summary-card homework-detail-completion-card">
              <span class="homework-detail-summary-label">Completion</span>
              <div class="homework-detail-completion-status" :class="completionClasses">
                <div v-html="completionIcon"></div>
                <span>{{ completionText }}</span>
              </div>
            </div>
            
            <!-- Questions Card -->
            <div class="homework-detail-summary-card homework-detail-questions-card">
              <span class="homework-detail-summary-label">Questions</span>
              <span class="homework-detail-summary-value">
                {{ correctCount }}/{{ questionCount }} correct
              </span>
            </div>
            
            <!-- Validation Card -->
            <!-- **Validates: Requirements 8.4** -->
            <div class="homework-detail-summary-card homework-detail-validation-card">
              <span class="homework-detail-summary-label">AI Validation</span>
              <div class="homework-detail-validation-status" :class="validationClasses">
                <div v-html="validationIcon"></div>
                <span>{{ validationText }}</span>
              </div>
            </div>
          </div>
          
          <!-- Overall Summary -->
          <div v-if="gradingResult?.summary" class="homework-detail-overall-summary">
            <p>{{ gradingResult.summary }}</p>
          </div>
        </section>
        
        <!-- Questions Detail Section -->
        <!-- **Validates: Requirements 8.3** -->
        <section class="homework-detail-section homework-detail-questions-section">
          <h3 class="homework-detail-section-title">
            <div v-html="getIcon('listChecks', 'lucide', 18, '')"></div>
            Question Details
          </h3>
          
          <div class="homework-detail-questions-list">
            <div 
              v-for="(question, index) in questions" 
              :key="index"
              class="homework-detail-question-card"
              :class="{ 
                'homework-detail-question-card--correct': question.isCorrect,
                'homework-detail-question-card--incorrect': !question.isCorrect
              }"
            >
              <!-- Question Header -->
              <div class="homework-detail-question-header">
                <div class="homework-detail-question-number">
                  <div v-if="question.isCorrect" v-html="getIcon('checkCircle', 'lucide', 18, '')"></div>
                  <div v-else v-html="getIcon('xCircle', 'lucide', 18, '')"></div>
                  <span>Question {{ question.questionNumber || (index + 1) }}</span>
                </div>
                <span 
                  class="homework-detail-question-badge"
                  :class="question.isCorrect ? 'homework-detail-question-badge--correct' : 'homework-detail-question-badge--incorrect'"
                >
                  {{ question.isCorrect ? 'Correct' : 'Incorrect' }}
                </span>
              </div>
              
              <!-- Question Text -->
              <div class="homework-detail-question-text">
                <strong>Question:</strong> {{ question.questionText || 'N/A' }}
              </div>
              
              <!-- Student Answer -->
              <div class="homework-detail-student-answer">
                <strong>Student's Answer:</strong> {{ question.studentAnswer || 'No answer provided' }}
              </div>
              
              <!-- Feedback for Incorrect Answers -->
              <!-- **Validates: Requirements 8.3** -->
              <div v-if="!question.isCorrect && question.feedback" class="homework-detail-feedback">
                <div class="homework-detail-feedback-item homework-detail-why-wrong">
                  <div class="homework-detail-feedback-label">
                    <div v-html="getIcon('helpCircle', 'lucide', 16, '')"></div>
                    <span>Why it's wrong:</span>
                  </div>
                  <p>{{ question.feedback.whyWrong || 'No explanation provided' }}</p>
                </div>
                
                <div class="homework-detail-feedback-item homework-detail-correct-answer">
                  <div class="homework-detail-feedback-label">
                    <div v-html="getIcon('lightbulb', 'lucide', 16, '')"></div>
                    <span>Correct answer:</span>
                  </div>
                  <p>{{ question.feedback.correctAnswer || 'No correct answer provided' }}</p>
                </div>
              </div>
              
              <!-- Check if this question was corrected by secondary review -->
              <div 
                v-if="getQuestionCorrection(question.questionNumber || (index + 1))"
                class="homework-detail-correction-notice"
              >
                <div v-html="getIcon('alertCircle', 'lucide', 16, '')"></div>
                <span>
                  <strong>AI Correction:</strong> 
                  {{ getQuestionCorrection(question.questionNumber || (index + 1)).reason }}
                </span>
              </div>
            </div>
          </div>
        </section>
        
        <!-- Validation Details Section (if corrections exist) -->
        <!-- **Validates: Requirements 8.4** -->
        <section 
          v-if="hasCorrections" 
          class="homework-detail-section homework-detail-corrections-section"
        >
          <h3 class="homework-detail-section-title">
            <div v-html="getIcon('gitCompare', 'lucide', 18, '')"></div>
            AI Validation Corrections
          </h3>
          
          <div class="homework-detail-corrections-info">
            <div v-html="getIcon('info', 'lucide', 16, '')"></div>
            <p>
              The secondary AI review found and corrected {{ corrections.length }} 
              grading {{ corrections.length === 1 ? 'decision' : 'decisions' }}.
            </p>
          </div>
          
          <div class="homework-detail-corrections-list">
            <div 
              v-for="(correction, index) in corrections" 
              :key="index"
              class="homework-detail-correction-card"
            >
              <div class="homework-detail-correction-header">
                <span class="homework-detail-correction-question">
                  Question {{ correction.questionNumber }}
                </span>
                <div class="homework-detail-correction-change">
                  <span 
                    class="homework-detail-correction-badge"
                    :class="correction.originalGrade ? 'homework-detail-correction-badge--correct' : 'homework-detail-correction-badge--incorrect'"
                  >
                    {{ correction.originalGrade ? 'Correct' : 'Incorrect' }}
                  </span>
                  <div v-html="getIcon('arrowRight', 'lucide', 16, '')"></div>
                  <span 
                    class="homework-detail-correction-badge"
                    :class="correction.correctedGrade ? 'homework-detail-correction-badge--correct' : 'homework-detail-correction-badge--incorrect'"
                  >
                    {{ correction.correctedGrade ? 'Correct' : 'Incorrect' }}
                  </span>
                </div>
              </div>
              <p class="homework-detail-correction-reason">{{ correction.reason }}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,

  
  data() {
    return {
      // Current image index for navigation
      // **Validates: Requirements 8.5**
      currentImageIndex: 0
    };
  },
  
  computed: {
    // =============================================
    // STATUS COMPUTED PROPERTIES
    // =============================================
    
    /**
     * Check if job is pending
     * **Validates: Requirements 8.6**
     */
    isPending() {
      return this.job?.status === 'pending';
    },
    
    /**
     * Check if job is processing
     * **Validates: Requirements 8.6**
     */
    isProcessing() {
      return this.job?.status === 'processing';
    },
    
    /**
     * Check if job is completed
     * **Validates: Requirements 8.1**
     */
    isCompleted() {
      return this.job?.status === 'completed';
    },
    
    /**
     * Check if job failed
     */
    isFailed() {
      return this.job?.status === 'failed';
    },
    
    // =============================================
    // PROGRESS COMPUTED PROPERTIES (for pending/processing)
    // =============================================
    
    /**
     * Get progress title based on status
     * **Validates: Requirements 8.6**
     */
    progressTitle() {
      if (this.isPending) return 'Waiting to Start';
      if (this.isProcessing) return 'Grading in Progress';
      return 'Processing';
    },
    
    /**
     * Get progress description text
     * **Validates: Requirements 8.6**
     */
    progressText() {
      if (this.isPending) {
        return 'Your homework is queued and will be graded shortly.';
      }
      if (this.isProcessing) {
        return 'Our AI is analyzing the homework and providing feedback.';
      }
      return 'Please wait...';
    },
    
    /**
     * Get progress percentage
     * **Validates: Requirements 8.6**
     */
    progressPercent() {
      if (this.isPending) return 15;
      if (this.isProcessing) return 60;
      return 100;
    },
    
    /**
     * Get progress steps for status display
     * **Validates: Requirements 8.6**
     */
    progressSteps() {
      const isPending = this.isPending;
      const isProcessing = this.isProcessing;
      
      return [
        {
          label: 'Submitted',
          complete: true,
          active: false
        },
        {
          label: 'Extracting Text',
          complete: isProcessing,
          active: isPending
        },
        {
          label: 'AI Grading',
          complete: false,
          active: isProcessing
        },
        {
          label: 'Validation',
          complete: false,
          active: false
        }
      ];
    },
    
    // =============================================
    // FAMILY MEMBER COMPUTED PROPERTIES
    // =============================================
    
    /**
     * Get the resolved family member
     */
    resolvedMember() {
      const memberId = this.job?.metadata?.familyMemberId;
      if (memberId && window.useFamilyStore) {
        const familyStore = window.useFamilyStore();
        return familyStore.memberById(memberId);
      }
      return null;
    },
    
    /**
     * Get member display name
     */
    memberName() {
      return this.resolvedMember?.displayName || 
             this.resolvedMember?.name || 
             'Unknown';
    },
    
    /**
     * Get formatted timestamp
     */
    formattedTimestamp() {
      const timestamp = this.job?.createdAt;
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    // =============================================
    // IMAGE COMPUTED PROPERTIES
    // =============================================
    
    /**
     * Get images array from job metadata
     * **Validates: Requirements 8.2**
     */
    images() {
      return this.job?.metadata?.imageUrls || [];
    },
    
    /**
     * Get image count
     */
    imageCount() {
      return this.images.length || this.job?.metadata?.imageCount || 0;
    },
    
    /**
     * Get current image URL
     * **Validates: Requirements 8.5**
     */
    currentImage() {
      if (this.images.length === 0) return null;
      return this.images[this.currentImageIndex] || this.images[0];
    },
    
    // =============================================
    // GRADING RESULT COMPUTED PROPERTIES
    // =============================================
    
    /**
     * Get grading result from job
     */
    gradingResult() {
      return this.job?.result || null;
    },
    
    /**
     * Get correctness score
     */
    correctnessScore() {
      return this.gradingResult?.correctnessScore ?? 0;
    },
    
    /**
     * Get score color class based on score value
     */
    scoreColorClass() {
      const score = this.correctnessScore;
      if (score >= 80) return 'homework-detail-score--high';
      if (score >= 60) return 'homework-detail-score--medium';
      return 'homework-detail-score--low';
    },
    
    /**
     * Get completion status
     */
    completionStatus() {
      return this.gradingResult?.completionStatus || 'unknown';
    },
    
    /**
     * Get completion text
     */
    completionText() {
      return this.completionStatus === 'complete' ? 'Complete' : 'Incomplete';
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
        'homework-detail-completion--complete': this.completionStatus === 'complete',
        'homework-detail-completion--incomplete': this.completionStatus !== 'complete'
      };
    },
    
    /**
     * Get questions array
     * **Validates: Requirements 8.3**
     */
    questions() {
      return this.gradingResult?.questions || [];
    },
    
    /**
     * Get question count
     */
    questionCount() {
      return this.questions.length;
    },
    
    /**
     * Get correct answer count
     */
    correctCount() {
      return this.questions.filter(q => q.isCorrect).length;
    },
    
    // =============================================
    // VALIDATION COMPUTED PROPERTIES
    // =============================================
    
    /**
     * Get validation status
     * **Validates: Requirements 8.4**
     */
    validationStatus() {
      return this.gradingResult?.validationStatus || 'unknown';
    },
    
    /**
     * Get validation text
     * **Validates: Requirements 8.4**
     */
    validationText() {
      if (this.validationStatus === 'confirmed') return 'Confirmed';
      if (this.validationStatus === 'corrected') return 'Corrected';
      return 'Unknown';
    },
    
    /**
     * Get validation icon HTML
     * **Validates: Requirements 8.4**
     */
    validationIcon() {
      const iconName = this.validationStatus === 'confirmed' ? 'checkCircle' : 'gitCompare';
      return this.getIcon(iconName, 'lucide', 16, '');
    },
    
    /**
     * Get CSS classes for validation status
     */
    validationClasses() {
      return {
        'homework-detail-validation--confirmed': this.validationStatus === 'confirmed',
        'homework-detail-validation--corrected': this.validationStatus === 'corrected'
      };
    },
    
    /**
     * Get corrections array
     * **Validates: Requirements 8.4**
     */
    corrections() {
      return this.gradingResult?.corrections || [];
    },
    
    /**
     * Check if there are corrections
     */
    hasCorrections() {
      return this.corrections.length > 0;
    },
    
    // =============================================
    // ERROR COMPUTED PROPERTIES
    // =============================================
    
    /**
     * Get error message for failed jobs
     */
    errorMessage() {
      return this.job?.error || 'An error occurred while grading the homework.';
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
     * Navigate to previous image
     * **Validates: Requirements 8.5**
     */
    previousImage() {
      if (this.currentImageIndex > 0) {
        this.currentImageIndex--;
      }
    },
    
    /**
     * Navigate to next image
     * **Validates: Requirements 8.5**
     */
    nextImage() {
      if (this.currentImageIndex < this.imageCount - 1) {
        this.currentImageIndex++;
      }
    },
    
    /**
     * Go to specific image by index
     * **Validates: Requirements 8.5**
     */
    goToImage(index) {
      if (index >= 0 && index < this.imageCount) {
        this.currentImageIndex = index;
      }
    },
    
    /**
     * Open image in fullscreen (future enhancement)
     */
    openImageFullscreen() {
      // Could implement a lightbox/modal for fullscreen viewing
      console.log('Open fullscreen image:', this.currentImageIndex);
    },
    
    /**
     * Get correction for a specific question number
     * **Validates: Requirements 8.4**
     * @param {number} questionNumber - The question number to look up
     * @returns {Object|null} The correction object or null
     */
    getQuestionCorrection(questionNumber) {
      return this.corrections.find(c => c.questionNumber === questionNumber) || null;
    }
  },
  
  watch: {
    // Reset image index when job changes
    'job.jobId'() {
      this.currentImageIndex = 0;
    }
  }
});

// Register component globally
if (typeof window !== 'undefined') {
  window.HomeworkDetailView = HomeworkDetailView;
}
