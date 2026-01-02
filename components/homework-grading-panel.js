/**
 * Homework Grading Panel Component
 * Main panel for the Homework Grading tab in Learning Hub
 * 
 * **Feature: homework-grading**
 * **Validates: Requirements 1.3, 2.1, 2.2, 2.3, 2.5, 2.6, 2.7**
 */

const HomeworkGradingPanel = Vue.defineComponent({
  name: 'HomeworkGradingPanel',
  
  components: {
    'submission-card': window.SubmissionCard,
    'homework-detail-view': window.HomeworkDetailView
  },
  
  setup() {
    const homeworkStore = window.useHomeworkGradingStore();
    const familyStore = window.useFamilyStore();
    const jobStore = window.useJobStore();
    
    return { homeworkStore, familyStore, jobStore };
  },
  
  template: `
    <div class="homework-grading-panel">
      <!-- Detail View Modal -->
      <homework-detail-view
        v-if="detailViewJobId"
        :job="detailViewJob"
        @close="closeDetailView"
      ></homework-detail-view>
      
      <!-- Main Panel Content -->
      <div v-else class="homework-grading-content">
        <!-- Header with New Submission Button -->
        <!-- **Validates: Requirements 1.3** -->
        <div class="homework-grading-header">
          <div class="homework-grading-header-text">
            <h2 class="homework-grading-title">Homework Grading</h2>
            <p class="homework-grading-subtitle">Upload homework images for AI-powered grading and feedback</p>
          </div>
          <button
            v-if="!showSubmissionForm"
            @click="openSubmissionForm"
            class="btn-primary homework-grading-new-btn"
          >
            <div v-html="getIcon('plus', 'lucide', 18, '')"></div>
            <span>New Submission</span>
          </button>
        </div>
        
        <!-- Submission Form -->
        <!-- **Validates: Requirements 2.1** -->
        <div v-if="showSubmissionForm" class="homework-submission-form">
          <div class="homework-submission-form-header">
            <h3 class="homework-submission-form-title">New Homework Submission</h3>
            <button
              @click="closeSubmissionForm"
              class="homework-submission-form-close"
              aria-label="Close form"
            >
              <div v-html="getIcon('x', 'lucide', 20, '')"></div>
            </button>
          </div>
          
          <!-- Family Member Selector -->
          <!-- **Validates: Requirements 2.1, 2.6** -->
          <div class="homework-form-section">
            <label class="homework-form-label">
              <span>Select Family Member</span>
              <span class="homework-form-required">*</span>
            </label>
            <div class="homework-member-selector">
              <button
                v-for="member in familyMembers"
                :key="member.id"
                @click="selectMember(member.id)"
                class="homework-member-option"
                :class="{ 'homework-member-option--selected': selectedMemberId === member.id }"
                type="button"
              >
                <div class="homework-member-avatar" :style="getMemberAvatarStyle(member)">
                  <span v-if="!member.avatar">{{ getMemberInitial(member) }}</span>
                  <img v-else :src="member.avatar" :alt="member.displayName || member.name" />
                </div>
                <span class="homework-member-name">{{ member.displayName || member.name }}</span>
                <div v-if="selectedMemberId === member.id" class="homework-member-check">
                  <div v-html="getIcon('check', 'lucide', 16, '')"></div>
                </div>
              </button>
            </div>
            <p v-if="!selectedMemberId && validationAttempted" class="homework-form-error">
              Please select a family member
            </p>
          </div>
          
          <!-- Image Capture/Upload Area -->
          <!-- **Validates: Requirements 2.1, 2.2, 2.3** -->
          <div class="homework-form-section">
            <label class="homework-form-label">
              <span>Homework Images</span>
              <span class="homework-form-required">*</span>
            </label>
            
            <!-- Image Preview Grid -->
            <div v-if="capturedImages.length > 0" class="homework-image-preview-grid">
              <div
                v-for="(img, idx) in capturedImages"
                :key="idx"
                class="homework-image-preview-item"
              >
                <img :src="img.dataUrl" :alt="'Homework image ' + (idx + 1)" />
                <button
                  @click="removeImage(idx)"
                  class="homework-image-remove-btn"
                  type="button"
                  aria-label="Remove image"
                >
                  <div v-html="getIcon('x', 'lucide', 14, '')"></div>
                </button>
              </div>
              
              <!-- Add More Button -->
              <button
                v-if="capturedImages.length < maxImages"
                @click="triggerFileInput"
                class="homework-image-add-more"
                type="button"
              >
                <div v-html="getIcon('plus', 'lucide', 24, '')"></div>
                <span>Add</span>
              </button>
            </div>
            
            <!-- Empty State - Capture Options -->
            <div v-else class="homework-capture-options">
              <!-- Camera Button (mobile) -->
              <!-- **Validates: Requirements 2.2** -->
              <button
                v-if="cameraSupported"
                @click="triggerCamera"
                class="homework-capture-btn"
                type="button"
              >
                <div v-html="getIcon('camera', 'lucide', 32, 'text-primary-500')"></div>
                <span>Take Photo</span>
              </button>
              
              <!-- File Upload Button -->
              <button
                @click="triggerFileInput"
                class="homework-capture-btn"
                type="button"
              >
                <div v-html="getIcon('upload', 'lucide', 32, 'text-primary-500')"></div>
                <span>Upload Images</span>
              </button>
            </div>
            
            <!-- Hidden File Inputs -->
            <input
              ref="fileInput"
              type="file"
              :key="'file-' + fileInputKey"
              accept="image/jpeg,image/png,image/heic,image/webp"
              multiple
              class="hidden"
              @change="handleFileUpload"
            />
            <input
              ref="cameraInput"
              type="file"
              :key="'camera-' + fileInputKey"
              accept="image/jpeg,image/png,image/heic,image/webp"
              capture="environment"
              class="hidden"
              @change="handleCameraCapture"
            />
            
            <p class="homework-form-hint">
              Supports JPEG, PNG, HEIC, WebP. Max {{ maxImages }} images.
            </p>
            <p v-if="capturedImages.length === 0 && validationAttempted" class="homework-form-error">
              Please add at least one image
            </p>
          </div>
          
          <!-- Submit Button -->
          <!-- **Validates: Requirements 2.5, 2.6, 2.7** -->
          <div class="homework-form-actions">
            <button
              @click="closeSubmissionForm"
              class="btn-secondary"
              type="button"
              :disabled="isSubmitting"
            >
              Cancel
            </button>
            <button
              @click="submitHomework"
              class="btn-primary"
              type="button"
              :disabled="!canSubmit || isSubmitting"
            >
              <div v-if="isSubmitting" class="homework-submit-spinner"></div>
              <div v-else v-html="getIcon('send', 'lucide', 18, '')"></div>
              <span>{{ isSubmitting ? 'Submitting...' : 'Submit for Grading' }}</span>
            </button>
          </div>
          
          <!-- Error Display -->
          <div v-if="submitError" class="homework-form-error-banner">
            <div v-html="getIcon('alertCircle', 'lucide', 18, '')"></div>
            <span>{{ submitError }}</span>
          </div>
        </div>
        
        <!-- Submissions List -->
        <!-- **Validates: Requirements 1.3, 7.7** -->
        <div class="homework-submissions-section">
          <h3 v-if="submissions.length > 0" class="homework-submissions-title">
            Recent Submissions
          </h3>
          
          <!-- Loading State -->
          <div v-if="isLoading" class="homework-loading">
            <div class="homework-loading-spinner"></div>
            <span>Loading submissions...</span>
          </div>
          
          <!-- Empty State -->
          <div v-else-if="submissions.length === 0 && !showSubmissionForm" class="homework-empty-state">
            <div v-html="getIcon('clipboardList', 'lucide', 48, 'text-secondary-custom')"></div>
            <h3>No Homework Submissions Yet</h3>
            <p>Upload your first homework assignment to get AI-powered grading and feedback.</p>
            <button @click="openSubmissionForm" class="btn-primary">
              <div v-html="getIcon('plus', 'lucide', 18, '')"></div>
              <span>Submit Homework</span>
            </button>
          </div>
          
          <!-- Submissions Grid -->
          <div v-else class="homework-submissions-grid">
            <submission-card
              v-for="submission in submissions"
              :key="submission.jobId"
              :job="submission"
              @click="openDetailView"
              @delete="handleDeleteSubmission"
            ></submission-card>
          </div>
        </div>
      </div>
    </div>
  `,
  
  data() {
    return {
      showSubmissionForm: false,
      selectedMemberId: null,
      capturedImages: [],
      detailViewJobId: null,
      isCapturing: false,
      fileInputKey: 0,
      validationAttempted: false,
      submitError: null,
      isLoading: false,
      maxImages: 5,
      cameraSupported: false
    };
  },
  
  computed: {
    /**
     * Get sorted submissions from store
     * **Validates: Requirements 7.7**
     */
    submissions() {
      return this.homeworkStore.submissions || [];
    },
    
    /**
     * Check if currently submitting
     */
    isSubmitting() {
      return this.homeworkStore.isSubmitting;
    },
    
    /**
     * Get family members from store
     */
    familyMembers() {
      return this.familyStore.members || [];
    },
    
    /**
     * Check if form can be submitted
     * **Validates: Requirements 2.5, 2.6**
     */
    canSubmit() {
      return this.selectedMemberId && 
             this.capturedImages.length > 0 && 
             !this.isSubmitting;
    },
    
    /**
     * Get selected family member
     */
    selectedMember() {
      if (!this.selectedMemberId) return null;
      return this.familyMembers.find(m => m.id === this.selectedMemberId);
    },
    
    /**
     * Get job for detail view
     */
    detailViewJob() {
      if (!this.detailViewJobId) return null;
      return this.submissions.find(s => s.jobId === this.detailViewJobId);
    }
  },
  
  async mounted() {
    this.detectCameraSupport();
    
    // Load family members if not already loaded
    if (this.familyStore.members.length === 0) {
      console.log('[Homework] Loading family members...');
      await this.familyStore.loadMembers();
      console.log('[Homework] Family members loaded:', this.familyStore.members.length);
    }
    
    await this.loadSubmissions();
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
     * Detect if device supports camera capture
     */
    detectCameraSupport() {
      const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      this.cameraSupported = hasMediaDevices || isMobile;
    },
    
    /**
     * Load submissions from store
     */
    async loadSubmissions() {
      this.isLoading = true;
      try {
        await this.homeworkStore.loadSubmissions();
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * Open submission form
     * **Validates: Requirements 2.1**
     */
    openSubmissionForm() {
      this.showSubmissionForm = true;
      this.selectedMemberId = null;
      this.capturedImages = [];
      this.validationAttempted = false;
      this.submitError = null;
    },
    
    /**
     * Close submission form
     */
    closeSubmissionForm() {
      this.showSubmissionForm = false;
      this.selectedMemberId = null;
      this.capturedImages = [];
      this.validationAttempted = false;
      this.submitError = null;
      this.fileInputKey++;
    },
    
    /**
     * Select a family member
     * **Validates: Requirements 2.6**
     */
    selectMember(memberId) {
      this.selectedMemberId = memberId;
    },
    
    /**
     * Get avatar style for a member
     */
    getMemberAvatarStyle(member) {
      if (member.avatar) return {};
      
      const colors = [
        'var(--color-primary-500)',
        'var(--color-secondary-500)',
        'var(--color-success-500)',
        'var(--color-warning-500)'
      ];
      const name = member.displayName || member.name || '';
      const index = name.charCodeAt(0) % colors.length;
      
      return {
        backgroundColor: colors[index],
        color: 'white'
      };
    },
    
    /**
     * Get initial for member avatar
     */
    getMemberInitial(member) {
      const name = member.displayName || member.name || '?';
      return name.charAt(0).toUpperCase();
    },
    
    /**
     * Trigger file input for upload
     */
    triggerFileInput() {
      this.$refs.fileInput?.click();
    },
    
    /**
     * Trigger camera input
     * **Validates: Requirements 2.2**
     */
    triggerCamera() {
      this.$refs.cameraInput?.click();
    },

    /**
     * Handle file upload from input
     * **Validates: Requirements 2.3**
     * @param {Event} event - File input change event
     */
    handleFileUpload(event) {
      const files = event.target.files;
      if (!files || files.length === 0) return;
      
      this.processFiles(Array.from(files));
      event.target.value = '';
    },
    
    /**
     * Handle camera capture
     * **Validates: Requirements 2.2**
     * @param {Event} event - Camera input change event
     */
    handleCameraCapture(event) {
      const files = event.target.files;
      if (!files || files.length === 0) return;
      
      this.processFiles(Array.from(files));
      event.target.value = '';
    },
    
    /**
     * Process selected files
     * **Validates: Requirements 2.3**
     * @param {File[]} files - Array of files to process
     */
    async processFiles(files) {
      // Allowed types: image/jpeg, image/png, image/heic, image/webp
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      for (const file of files) {
        // Check max images limit
        if (this.capturedImages.length >= this.maxImages) {
          this.submitError = `Maximum ${this.maxImages} images allowed`;
          break;
        }
        
        // Validate file type
        // **Validates: Requirements 2.3**
        if (!this.isValidImageType(file)) {
          this.submitError = `Unsupported format: ${file.name}. Use JPEG, PNG, HEIC, or WebP.`;
          continue;
        }
        
        // Validate file size
        if (file.size > maxSize) {
          this.submitError = `File too large: ${file.name}. Maximum size is 10MB.`;
          continue;
        }
        
        // Create preview
        try {
          const dataUrl = await this.readFileAsDataUrl(file);
          this.capturedImages.push({
            file,
            dataUrl,
            name: file.name
          });
          this.submitError = null;
        } catch (err) {
          console.error('Error reading file:', err);
          this.submitError = `Failed to read file: ${file.name}`;
        }
      }
    },
    
    /**
     * Check if file has valid image type
     * **Validates: Requirements 2.3**
     * @param {File} file - File to check
     * @returns {boolean} True if valid image type
     */
    isValidImageType(file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'heic', 'webp'];
      
      // Check MIME type
      if (allowedTypes.includes(file.type)) {
        return true;
      }
      
      // Fallback to extension check (for HEIC which may not have correct MIME)
      const extension = file.name.split('.').pop()?.toLowerCase();
      return allowedExtensions.includes(extension);
    },
    
    /**
     * Read file as data URL
     * @param {File} file - File to read
     * @returns {Promise<string>} Data URL
     */
    readFileAsDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    },
    
    /**
     * Remove image from captured images
     * @param {number} index - Index of image to remove
     */
    removeImage(index) {
      if (index >= 0 && index < this.capturedImages.length) {
        this.capturedImages.splice(index, 1);
      }
    },
    
    /**
     * Submit homework for grading
     * **Validates: Requirements 2.5, 2.6, 2.7**
     */
    async submitHomework() {
      this.validationAttempted = true;
      this.submitError = null;
      
      // Validate inputs
      // **Validates: Requirements 2.5, 2.6**
      if (!this.selectedMemberId) {
        this.submitError = 'Please select a family member';
        return;
      }
      
      if (this.capturedImages.length === 0) {
        this.submitError = 'Please add at least one image';
        return;
      }
      
      // Extract data URLs for submission
      const images = this.capturedImages.map(img => img.dataUrl);
      
      // Submit to store
      // **Validates: Requirements 2.7**
      const result = await this.homeworkStore.submitHomework(
        this.selectedMemberId,
        images
      );
      
      if (result.success) {
        // Close form and show new pending card
        this.closeSubmissionForm();
      } else {
        this.submitError = result.error || 'Failed to submit homework';
      }
    },
    
    /**
     * Open detail view for a submission
     * @param {Object} job - Job to view
     */
    openDetailView(job) {
      if (job && job.jobId) {
        this.detailViewJobId = job.jobId;
      }
    },
    
    /**
     * Close detail view
     */
    closeDetailView() {
      this.detailViewJobId = null;
    },
    
    /**
     * Handle delete submission
     * @param {string} jobId - Job ID to delete
     */
    async handleDeleteSubmission(jobId) {
      if (!jobId) return;
      
      // Confirm deletion
      if (!confirm('Are you sure you want to delete this submission?')) {
        return;
      }
      
      await this.homeworkStore.deleteSubmission(jobId);
    }
  }
});

// Export for image format validation (used in property tests)
// **Feature: homework-grading, Property 4: Image Format Acceptance**
// **Validates: Requirements 2.3**
const ImageFormatValidator = {
  /**
   * Allowed MIME types for homework images
   */
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/heic', 'image/webp'],
  
  /**
   * Allowed file extensions for homework images
   */
  allowedExtensions: ['jpg', 'jpeg', 'png', 'heic', 'webp'],
  
  /**
   * Check if a MIME type is valid for homework images
   * @param {string} mimeType - MIME type to check
   * @returns {boolean} True if valid
   */
  isValidMimeType(mimeType) {
    return this.allowedMimeTypes.includes(mimeType);
  },
  
  /**
   * Check if a file extension is valid for homework images
   * @param {string} extension - File extension to check (without dot)
   * @returns {boolean} True if valid
   */
  isValidExtension(extension) {
    return this.allowedExtensions.includes(extension?.toLowerCase());
  },
  
  /**
   * Check if a file is valid for homework submission
   * @param {Object} file - File-like object with type and name properties
   * @returns {boolean} True if valid
   */
  isValidFile(file) {
    if (!file) return false;
    
    // Check MIME type first
    if (file.type && this.isValidMimeType(file.type)) {
      return true;
    }
    
    // Fallback to extension check
    if (file.name) {
      const extension = file.name.split('.').pop();
      return this.isValidExtension(extension);
    }
    
    return false;
  }
};

// Register component globally
if (typeof window !== 'undefined') {
  window.HomeworkGradingPanel = HomeworkGradingPanel;
  window.ImageFormatValidator = ImageFormatValidator;
}
