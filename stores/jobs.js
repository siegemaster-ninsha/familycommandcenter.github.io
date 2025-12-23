// Job Store
// Manages async job tracking with automatic polling
// **Feature: async-job-service**
// **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.4, 6.3**

// Default polling interval in milliseconds
const DEFAULT_POLL_INTERVAL = 2000;

// Default delay before removing completed/failed jobs (ms)
const DEFAULT_CLEAR_DELAY = 30000;

const useJobStore = Pinia.defineStore('jobs', {
  state: () => ({
    // Tracked jobs: { jobId: jobData }
    // **Validates: Requirements 4.1**
    trackedJobs: {},
    
    // Polling intervals: { jobId: intervalId }
    pollingIntervals: {},
    
    // Progress history for ETA calculation: { jobId: [{ progress, timestamp }] }
    progressHistory: {},
    
    // Configuration
    pollInterval: DEFAULT_POLL_INTERVAL,
    clearDelay: DEFAULT_CLEAR_DELAY,
    
    // Loading state
    loading: false,
    error: null
  }),
  
  getters: {
    // Get all pending jobs
    // **Validates: Requirements 4.5**
    pendingJobs: (state) => {
      return Object.values(state.trackedJobs).filter(job => job.status === 'pending');
    },
    
    // Get all processing jobs
    // **Validates: Requirements 4.5**
    processingJobs: (state) => {
      return Object.values(state.trackedJobs).filter(job => job.status === 'processing');
    },
    
    // Get all completed jobs
    // **Validates: Requirements 4.5**
    completedJobs: (state) => {
      return Object.values(state.trackedJobs).filter(job => job.status === 'completed');
    },
    
    // Get all failed jobs
    // **Validates: Requirements 4.5, 6.3**
    failedJobs: (state) => {
      return Object.values(state.trackedJobs).filter(job => job.status === 'failed');
    },
    
    // Get active jobs (pending + processing)
    activeJobs: (state) => {
      return Object.values(state.trackedJobs).filter(
        job => job.status === 'pending' || job.status === 'processing'
      );
    },
    
    // Get job by ID
    getJob: (state) => {
      return (jobId) => state.trackedJobs[jobId] || null;
    },
    
    // Get jobs by type
    jobsByType: (state) => {
      return (jobType) => Object.values(state.trackedJobs).filter(job => job.jobType === jobType);
    },
    
    // Check if any jobs are active
    hasActiveJobs: (state) => {
      return Object.values(state.trackedJobs).some(
        job => job.status === 'pending' || job.status === 'processing'
      );
    },
    
    // Get count of tracked jobs
    jobCount: (state) => Object.keys(state.trackedJobs).length
  },
  
  actions: {
    /**
     * Start tracking a job by ID
     * Fetches initial job data and starts polling
     * **Validates: Requirements 4.2, 4.3**
     * 
     * @param {string} jobId - The job ID to track
     * @returns {Promise<{success: boolean, job?: Object, error?: string}>}
     */
    async trackJob(jobId) {
      if (!jobId) {
        return { success: false, error: 'Job ID is required' };
      }
      
      // Check if already tracking
      if (this.trackedJobs[jobId]) {
        console.log('[Job Store] Already tracking job:', jobId);
        return { success: true, job: this.trackedJobs[jobId] };
      }
      
      try {
        // Fetch initial job data
        const result = await this.refreshJob(jobId);
        
        if (!result.success) {
          return result;
        }
        
        const job = result.job;
        
        // Initialize progress history for ETA calculation
        if (job.progress !== undefined && job.progress !== null) {
          this.progressHistory[jobId] = [{
            progress: job.progress,
            timestamp: Date.now()
          }];
        }
        
        // Start polling if job is not complete
        // **Validates: Requirements 4.3**
        if (job.status === 'pending' || job.status === 'processing') {
          this._startPolling(jobId);
        }
        
        console.log('[Job Store] Now tracking job:', jobId, 'status:', job.status);
        return { success: true, job };
      } catch (error) {
        console.error('[Job Store] Failed to track job:', error);
        return { success: false, error: error.message };
      }
    },
    
    /**
     * Refresh job data from the API
     * **Validates: Requirements 4.2**
     * 
     * @param {string} jobId - The job ID to refresh
     * @returns {Promise<{success: boolean, job?: Object, error?: string}>}
     */
    async refreshJob(jobId) {
      if (!jobId) {
        return { success: false, error: 'Job ID is required' };
      }
      
      try {
        const data = await apiService.get(`/jobs/${jobId}`);
        
        if (data.success && data.data) {
          const job = data.data;
          const previousJob = this.trackedJobs[jobId];
          const previousStatus = previousJob?.status;
          
          // Update tracked job
          this.trackedJobs[jobId] = job;
          
          // Track progress for ETA calculation
          // **Validates: Requirements 5.1, 5.2**
          if (job.progress !== undefined && job.progress !== null) {
            if (!this.progressHistory[jobId]) {
              this.progressHistory[jobId] = [];
            }
            
            const history = this.progressHistory[jobId];
            const lastEntry = history[history.length - 1];
            
            // Only add if progress changed
            if (!lastEntry || lastEntry.progress !== job.progress) {
              history.push({
                progress: job.progress,
                timestamp: Date.now()
              });
              
              // Keep only last 10 entries for ETA calculation
              if (history.length > 10) {
                history.shift();
              }
            }
          }
          
          // Check for status change and emit events
          // **Validates: Requirements 4.4**
          if (previousStatus && previousStatus !== job.status) {
            this._handleStatusChange(jobId, previousStatus, job.status, job);
          }
          
          return { success: true, job };
        }
        
        return { success: false, error: 'Job not found' };
      } catch (error) {
        // Handle job not found (expired)
        if (error.message?.includes('404') || error.message?.includes('not found')) {
          this._handleJobExpired(jobId);
          return { success: false, error: 'Job not found or has expired' };
        }
        
        console.error('[Job Store] Failed to refresh job:', error);
        return { success: false, error: error.message };
      }
    },
    
    /**
     * Stop tracking a job
     * Stops polling and removes from tracked jobs
     * 
     * @param {string} jobId - The job ID to stop tracking
     */
    stopTracking(jobId) {
      if (!jobId) return;
      
      // Stop polling
      this._stopPolling(jobId);
      
      // Remove from tracked jobs
      delete this.trackedJobs[jobId];
      delete this.progressHistory[jobId];
      
      console.log('[Job Store] Stopped tracking job:', jobId);
    },
    
    /**
     * Clear all completed and failed jobs from tracking
     * **Validates: Requirements 7.3**
     * 
     * @param {number} delay - Optional delay in ms before clearing (default: immediate)
     */
    clearCompleted(delay = 0) {
      const clear = () => {
        const jobsToRemove = Object.values(this.trackedJobs)
          .filter(job => job.status === 'completed' || job.status === 'failed')
          .map(job => job.jobId);
        
        jobsToRemove.forEach(jobId => {
          this.stopTracking(jobId);
        });
        
        console.log('[Job Store] Cleared', jobsToRemove.length, 'completed/failed jobs');
      };
      
      if (delay > 0) {
        setTimeout(clear, delay);
      } else {
        clear();
      }
    },
    
    /**
     * Calculate estimated time remaining for a job
     * **Validates: Requirements 5.4**
     * 
     * @param {string} jobId - The job ID
     * @returns {number|null} Estimated seconds remaining, or null if cannot calculate
     */
    calculateETA(jobId) {
      const job = this.trackedJobs[jobId];
      const history = this.progressHistory[jobId];
      
      // Cannot calculate if no job, no progress, or progress is 0
      if (!job || job.progress === undefined || job.progress === null || job.progress === 0) {
        return null;
      }
      
      // Cannot calculate if no history or only one entry
      if (!history || history.length < 2) {
        return null;
      }
      
      // Get first and last entries for rate calculation
      const firstEntry = history[0];
      const lastEntry = history[history.length - 1];
      
      const progressDelta = lastEntry.progress - firstEntry.progress;
      const timeDelta = lastEntry.timestamp - firstEntry.timestamp;
      
      // Cannot calculate if no progress made
      if (progressDelta <= 0 || timeDelta <= 0) {
        return null;
      }
      
      // Calculate rate (progress per ms)
      const rate = progressDelta / timeDelta;
      
      // Calculate remaining progress
      const remainingProgress = 100 - lastEntry.progress;
      
      // Calculate ETA in seconds
      // Formula: (elapsed_time / progress) * (100 - progress)
      // Simplified: remainingProgress / rate (in ms), then convert to seconds
      const etaMs = remainingProgress / rate;
      const etaSeconds = Math.round(etaMs / 1000);
      
      return etaSeconds > 0 ? etaSeconds : null;
    },
    
    /**
     * Format ETA as human-readable string
     * 
     * @param {string} jobId - The job ID
     * @returns {string} Formatted ETA string (e.g., "2m 30s", "< 1m")
     */
    formatETA(jobId) {
      const eta = this.calculateETA(jobId);
      
      if (eta === null) {
        return 'Calculating...';
      }
      
      if (eta < 60) {
        return eta < 10 ? '< 10s' : `${eta}s`;
      }
      
      const minutes = Math.floor(eta / 60);
      const seconds = eta % 60;
      
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
      }
      
      return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    },
    
    /**
     * Set polling interval
     * 
     * @param {number} interval - Polling interval in milliseconds
     */
    setPollInterval(interval) {
      if (interval > 0) {
        this.pollInterval = interval;
      }
    },
    
    /**
     * Set clear delay for completed jobs
     * 
     * @param {number} delay - Delay in milliseconds
     */
    setClearDelay(delay) {
      if (delay >= 0) {
        this.clearDelay = delay;
      }
    },
    
    // =============================================
    // PRIVATE METHODS
    // =============================================
    
    /**
     * Start polling for a job
     * @private
     */
    _startPolling(jobId) {
      // Don't start if already polling
      if (this.pollingIntervals[jobId]) {
        return;
      }
      
      const poll = async () => {
        const result = await this.refreshJob(jobId);
        
        // Stop polling if job completed, failed, or not found
        if (!result.success || 
            result.job?.status === 'completed' || 
            result.job?.status === 'failed') {
          this._stopPolling(jobId);
        }
      };
      
      // Start interval
      this.pollingIntervals[jobId] = setInterval(poll, this.pollInterval);
      console.log('[Job Store] Started polling for job:', jobId);
    },
    
    /**
     * Stop polling for a job
     * @private
     */
    _stopPolling(jobId) {
      if (this.pollingIntervals[jobId]) {
        clearInterval(this.pollingIntervals[jobId]);
        delete this.pollingIntervals[jobId];
        console.log('[Job Store] Stopped polling for job:', jobId);
      }
    },
    
    /**
     * Handle job status change
     * Emits events and stops polling when appropriate
     * **Validates: Requirements 4.4**
     * @private
     */
    _handleStatusChange(jobId, previousStatus, newStatus, job) {
      console.log('[Job Store] Job status changed:', jobId, previousStatus, '->', newStatus);
      
      // Stop polling on completion or failure
      if (newStatus === 'completed' || newStatus === 'failed') {
        this._stopPolling(jobId);
        
        // Emit custom event for listeners
        const eventName = newStatus === 'completed' ? 'job-completed' : 'job-failed';
        const event = new CustomEvent(eventName, {
          detail: { jobId, job }
        });
        window.dispatchEvent(event);
        
        // Show UI notification if available
        if (window.useUIStore) {
          const uiStore = window.useUIStore();
          if (newStatus === 'completed') {
            uiStore.showSuccess(`Job completed: ${job.jobType}`);
          } else {
            uiStore.showError(`Job failed: ${job.error || 'Unknown error'}`);
          }
        }
        
        // Schedule auto-clear if configured
        if (this.clearDelay > 0) {
          setTimeout(() => {
            if (this.trackedJobs[jobId]?.status === newStatus) {
              this.stopTracking(jobId);
            }
          }, this.clearDelay);
        }
      }
    },
    
    /**
     * Handle job expired (not found)
     * @private
     */
    _handleJobExpired(jobId) {
      console.log('[Job Store] Job expired:', jobId);
      
      // Stop polling
      this._stopPolling(jobId);
      
      // Emit event
      const event = new CustomEvent('job-expired', {
        detail: { jobId }
      });
      window.dispatchEvent(event);
      
      // Remove from tracking
      delete this.trackedJobs[jobId];
      delete this.progressHistory[jobId];
    },
    
    /**
     * Fetch active jobs from the API
     * Useful when returning to a page to see pending jobs
     * @returns {Promise<{success: boolean, jobs?: Array, error?: string}>}
     */
    async fetchActiveJobs() {
      this.loading = true;
      this.error = null;
      
      try {
        const data = await apiService.get('/jobs?status=pending,processing');
        
        if (data.success && data.data) {
          const jobs = data.data;
          
          // Add each job to tracking and start polling
          for (const job of jobs) {
            if (!this.trackedJobs[job.jobId]) {
              this.trackedJobs[job.jobId] = job;
              
              // Initialize progress history
              if (job.progress !== undefined && job.progress !== null) {
                this.progressHistory[job.jobId] = [{
                  progress: job.progress,
                  timestamp: Date.now()
                }];
              }
              
              // Start polling for active jobs
              if (job.status === 'pending' || job.status === 'processing') {
                this._startPolling(job.jobId);
              }
            }
          }
          
          console.log('[Job Store] Fetched', jobs.length, 'active jobs');
          return { success: true, jobs };
        }
        
        return { success: true, jobs: [] };
      } catch (error) {
        console.error('[Job Store] Failed to fetch active jobs:', error);
        this.error = error.message;
        return { success: false, error: error.message };
      } finally {
        this.loading = false;
      }
    },

    /**
     * Reset store state
     */
    reset() {
      // Stop all polling
      Object.keys(this.pollingIntervals).forEach(jobId => {
        this._stopPolling(jobId);
      });
      
      // Clear state
      this.trackedJobs = {};
      this.pollingIntervals = {};
      this.progressHistory = {};
      this.loading = false;
      this.error = null;
    }
  }
});

// Export for use in components
if (typeof window !== 'undefined') {
  window.useJobStore = useJobStore;
}
