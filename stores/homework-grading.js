// Homework Grading Store
// Manages homework submissions, grading jobs, and results
// **Feature: homework-grading**
// **Validates: Requirements 2.7, 3.2, 3.3, 3.4, 3.6, 7.7, 10.2, 10.4**

const useHomeworkGradingStore = Pinia.defineStore('homeworkGrading', {
  state: () => ({
    // Array of homework submission jobs
    // **Validates: Requirements 3.2, 7.7**
    submissions: [],
    
    // Loading state for submission creation
    isSubmitting: false,
    
    // Error message if any
    error: null,
    
    // Track if submissions have been loaded
    _loaded: false,
    
    // Track if job store listeners are initialized
    // **Validates: Requirements 3.3, 3.4, 3.6**
    _jobStoreInitialized: false
  }),
  
  getters: {
    /**
     * Get pending submissions (status: pending or processing)
     * **Validates: Requirements 3.2**
     * @returns {Array} Submissions with pending/processing status
     */
    pendingSubmissions: (state) => {
      return state.submissions.filter(
        sub => sub.status === 'pending' || sub.status === 'processing'
      );
    },
    
    /**
     * Get completed submissions (status: completed)
     * **Validates: Requirements 3.2**
     * @returns {Array} Submissions with completed status
     */
    completedSubmissions: (state) => {
      return state.submissions.filter(sub => sub.status === 'completed');
    },
    
    /**
     * Get failed submissions (status: failed)
     * @returns {Array} Submissions with failed status
     */
    failedSubmissions: (state) => {
      return state.submissions.filter(sub => sub.status === 'failed');
    },
    
    /**
     * Get submissions filtered by family member ID
     * **Validates: Requirements 7.7**
     * @returns {Function} Filter function that takes memberId
     */
    submissionsByMember: (state) => {
      return (memberId) => state.submissions.filter(
        sub => sub.metadata?.familyMemberId === memberId
      );
    },
    
    /**
     * Get submission count
     * @returns {number} Total number of submissions
     */
    submissionCount: (state) => state.submissions.length,
    
    /**
     * Check if there are any active (pending/processing) submissions
     * @returns {boolean}
     */
    hasActiveSubmissions: (state) => {
      return state.submissions.some(
        sub => sub.status === 'pending' || sub.status === 'processing'
      );
    },
    
    /**
     * Get submission by job ID
     * @returns {Function} Finder function that takes jobId
     */
    getSubmission: (state) => {
      return (jobId) => state.submissions.find(sub => sub.jobId === jobId);
    }
  },
  
  actions: {
    /**
     * Submit homework for grading
     * Creates a job and tracks it
     * **Validates: Requirements 2.7**
     * 
     * @param {string} memberId - Family member ID
     * @param {Array} images - Array of image data URLs
     * @returns {Promise<{success: boolean, jobId?: string, error?: string}>}
     */
    async submitHomework(memberId, images) {
      if (!memberId) {
        return { success: false, error: 'Family member is required' };
      }
      
      if (!images || !Array.isArray(images) || images.length === 0) {
        return { success: false, error: 'At least one image is required' };
      }
      
      this.isSubmitting = true;
      this.error = null;
      
      try {
        // Call API to create homework grading job
        const response = await apiService.post('/homework/grade', {
          familyMemberId: memberId,
          images: images
        });
        
        if (response.success && response.data) {
          const job = response.data;
          
          // Add to local submissions immediately
          // **Validates: Requirements 2.7**
          this.submissions.unshift({
            jobId: job.jobId,
            status: job.status || 'pending',
            metadata: {
              familyMemberId: memberId,
              imageCount: images.length
            },
            createdAt: job.createdAt || new Date().toISOString()
          });
          
          // Sort by createdAt descending (newest first)
          // **Validates: Requirements 7.7**
          this._sortSubmissions();
          
          // Start tracking with job store if available
          if (window.useJobStore) {
            const jobStore = window.useJobStore();
            jobStore.trackJob(job.jobId);
          }
          
          console.log('[Homework] Submission created:', job.jobId);
          return { success: true, jobId: job.jobId };
        }
        
        const errorMsg = response.error || 'Failed to submit homework';
        this.error = errorMsg;
        return { success: false, error: errorMsg };
      } catch (error) {
        const errorMsg = this._formatError(error);
        this.error = errorMsg;
        console.error('[Homework] Submit failed:', error);
        return { success: false, error: errorMsg };
      } finally {
        this.isSubmitting = false;
      }
    },
    
    /**
     * Load all homework submissions for the account
     * **Validates: Requirements 3.6, 10.2**
     * 
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async loadSubmissions() {
      this.error = null;
      
      // Initialize job store integration if not already done
      // **Validates: Requirements 3.3, 3.4, 3.6**
      this.initJobStoreIntegration();
      
      try {
        const response = await apiService.get('/homework/submissions');
        
        if (response.success && response.data) {
          this.submissions = response.data;
          
          // Sort by createdAt descending (newest first)
          // **Validates: Requirements 7.7**
          this._sortSubmissions();
          
          // Track active jobs with job store
          // **Validates: Requirements 3.3**
          if (window.useJobStore) {
            const jobStore = window.useJobStore();
            this.submissions
              .filter(sub => sub.status === 'pending' || sub.status === 'processing')
              .forEach(sub => jobStore.trackJob(sub.jobId));
          }
          
          this._loaded = true;
          console.log('[Homework] Loaded', this.submissions.length, 'submissions');
          return { success: true };
        }
        
        // Handle empty response
        this.submissions = [];
        this._loaded = true;
        return { success: true };
      } catch (error) {
        const errorMsg = this._formatError(error);
        this.error = errorMsg;
        console.error('[Homework] Load failed:', error);
        return { success: false, error: errorMsg };
      }
    },
    
    /**
     * Delete a homework submission
     * **Validates: Requirements 10.4**
     * 
     * @param {string} jobId - Job ID to delete
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async deleteSubmission(jobId) {
      if (!jobId) {
        return { success: false, error: 'Job ID is required' };
      }
      
      // Optimistic update - remove from local state immediately
      const index = this.submissions.findIndex(sub => sub.jobId === jobId);
      const removed = index !== -1 ? this.submissions.splice(index, 1)[0] : null;
      
      try {
        await apiService.delete(`/homework/submissions/${jobId}`);
        
        // Stop tracking with job store if available
        if (window.useJobStore) {
          const jobStore = window.useJobStore();
          jobStore.stopTracking(jobId);
        }
        
        console.log('[Homework] Submission deleted:', jobId);
        return { success: true };
      } catch (error) {
        // Restore on failure
        if (removed && index !== -1) {
          this.submissions.splice(index, 0, removed);
        }
        
        const errorMsg = this._formatError(error);
        this.error = errorMsg;
        console.error('[Homework] Delete failed:', error);
        return { success: false, error: errorMsg };
      }
    },
    
    /**
     * Update a submission from job store events
     * Called when job status changes
     * **Validates: Requirements 3.2**
     * 
     * @param {Object} job - Updated job data from job store
     */
    updateSubmissionFromJob(job) {
      if (!job || !job.jobId) return;
      
      const index = this.submissions.findIndex(sub => sub.jobId === job.jobId);
      
      if (index !== -1) {
        // Update existing submission
        this.submissions[index] = {
          ...this.submissions[index],
          status: job.status,
          result: job.result,
          error: job.error,
          completedAt: job.completedAt
        };
        console.log('[Homework] Submission updated:', job.jobId, 'status:', job.status);
      } else if (job.jobType === 'homework-grading') {
        // Add new submission if it's a homework job we don't have
        this.submissions.unshift(job);
        this._sortSubmissions();
        console.log('[Homework] New submission added:', job.jobId);
      }
    },
    
    /**
     * Clear error state
     */
    clearError() {
      this.error = null;
    },
    
    /**
     * Reset store state
     */
    reset() {
      this._cleanupJobStoreListeners();
      this.submissions = [];
      this.isSubmitting = false;
      this.error = null;
      this._loaded = false;
      this._jobStoreInitialized = false;
    },
    
    // =============================================
    // JOB STORE INTEGRATION
    // **Validates: Requirements 3.3, 3.4, 3.6**
    // =============================================
    
    /**
     * Initialize job store integration
     * Sets up event listeners for job status changes
     * **Validates: Requirements 3.3, 3.4, 3.6**
     */
    initJobStoreIntegration() {
      if (this._jobStoreInitialized) {
        return;
      }
      
      // Listen for job completion events
      window.addEventListener('job-completed', this._handleJobCompleted.bind(this));
      window.addEventListener('job-failed', this._handleJobFailed.bind(this));
      window.addEventListener('job-expired', this._handleJobExpired.bind(this));
      
      this._jobStoreInitialized = true;
      console.log('[Homework] Job store integration initialized');
    },
    
    /**
     * Clean up job store event listeners
     * @private
     */
    _cleanupJobStoreListeners() {
      if (!this._jobStoreInitialized) {
        return;
      }
      
      window.removeEventListener('job-completed', this._handleJobCompleted);
      window.removeEventListener('job-failed', this._handleJobFailed);
      window.removeEventListener('job-expired', this._handleJobExpired);
      
      this._jobStoreInitialized = false;
      console.log('[Homework] Job store listeners cleaned up');
    },
    
    /**
     * Handle job completed event from job store
     * **Validates: Requirements 3.4**
     * @private
     * @param {CustomEvent} event - Job completed event
     */
    _handleJobCompleted(event) {
      const { jobId, job } = event.detail || {};
      
      // Only handle homework-grading jobs
      if (!job || job.jobType !== 'homework-grading') {
        return;
      }
      
      this.updateSubmissionFromJob(job);
      console.log('[Homework] Job completed:', jobId);
    },
    
    /**
     * Handle job failed event from job store
     * **Validates: Requirements 3.4**
     * @private
     * @param {CustomEvent} event - Job failed event
     */
    _handleJobFailed(event) {
      const { jobId, job } = event.detail || {};
      
      // Only handle homework-grading jobs
      if (!job || job.jobType !== 'homework-grading') {
        return;
      }
      
      this.updateSubmissionFromJob(job);
      console.log('[Homework] Job failed:', jobId);
    },
    
    /**
     * Handle job expired event from job store
     * **Validates: Requirements 3.6**
     * @private
     * @param {CustomEvent} event - Job expired event
     */
    _handleJobExpired(event) {
      const { jobId } = event.detail || {};
      
      if (!jobId) return;
      
      // Find and update the submission
      const index = this.submissions.findIndex(sub => sub.jobId === jobId);
      if (index !== -1) {
        // Mark as expired/failed
        this.submissions[index] = {
          ...this.submissions[index],
          status: 'failed',
          error: 'Job has expired'
        };
        console.log('[Homework] Job expired:', jobId);
      }
    },
    
    /**
     * Sync with job store to get latest status for all active submissions
     * **Validates: Requirements 3.3, 3.6**
     * 
     * @returns {Promise<void>}
     */
    async syncWithJobStore() {
      if (!window.useJobStore) {
        console.warn('[Homework] Job store not available');
        return;
      }
      
      const jobStore = window.useJobStore();
      
      // Get all active submissions
      const activeSubmissions = this.submissions.filter(
        sub => sub.status === 'pending' || sub.status === 'processing'
      );
      
      // Track each active job with the job store
      for (const submission of activeSubmissions) {
        const result = await jobStore.trackJob(submission.jobId);
        
        if (result.success && result.job) {
          // Update local submission with latest job data
          this.updateSubmissionFromJob(result.job);
        } else if (!result.success && result.error?.includes('not found')) {
          // Job expired or deleted
          this._handleJobExpired({ detail: { jobId: submission.jobId } });
        }
      }
      
      console.log('[Homework] Synced', activeSubmissions.length, 'active submissions with job store');
    },
    
    // =============================================
    // PRIVATE METHODS
    // =============================================
    
    /**
     * Sort submissions by createdAt descending (newest first)
     * **Validates: Requirements 7.7**
     * @private
     */
    _sortSubmissions() {
      this.submissions.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA; // Descending order
      });
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
        return 'Please log in to submit homework';
      }
      if (message.includes('network') || message.includes('fetch')) {
        return 'Unable to connect. Please check your internet connection.';
      }
      if (message.includes('Invalid family member') || message.includes('400')) {
        return 'Invalid family member selected';
      }
      if (message.includes('At least one image')) {
        return 'Please add at least one image of the homework';
      }
      
      // Return the message if it's already user-friendly
      if (message.length < 100 && !message.includes('Error:')) {
        return message;
      }
      
      return 'Something went wrong. Please try again later.';
    }
  }
});

// Export for use in components
if (typeof window !== 'undefined') {
  window.useHomeworkGradingStore = useHomeworkGradingStore;
}
