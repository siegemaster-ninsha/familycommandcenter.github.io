// Image Capture Modal Component
// Allows users to capture or select images for recipe extraction
//
// **Feature: recipe-image-capture**
// **Validates: Requirements 1.1, 1.2, 1.3, 1.5, 5.1, 6.1, 6.2, 6.3, 6.4, 10.1, 10.2, 10.3**

const ImageCaptureModal = Vue.defineComponent({
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['close', 'image-captured'],
  
  template: `
    <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="sticky top-0 bg-white border-b p-4 flex items-center justify-between" style="border-color: var(--color-border-card);">
          <h2 class="text-xl font-bold text-primary-custom flex items-center gap-2">
            <div v-html="Helpers.IconLibrary.getIcon('camera', 'lucide', 20, 'text-primary-custom')"></div>
            Capture Recipe
          </h2>
          <button
            @click="handleClose"
            class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            :disabled="uploading"
          >
            <div v-html="Helpers.IconLibrary.getIcon('x', 'lucide', 20, '')"></div>
          </button>
        </div>
        
        <!-- Modal Content -->
        <div class="p-6">
          <!-- Error Display with Retry -->
          <!-- **Feature: recipe-image-capture** -->
          <!-- **Validates: Requirements 6.1, 6.2** -->
          <div v-if="error" class="mb-4 p-4 rounded-lg bg-red-50 border border-red-200">
            <div class="flex items-start gap-3">
              <div v-html="Helpers.IconLibrary.getIcon('alertTriangle', 'lucide', 20, 'text-red-500 flex-shrink-0')"></div>
              <div class="flex-1">
                <p class="font-medium text-red-700">{{ errorTitle }}</p>
                <p class="text-sm text-red-600 mt-1">{{ error }}</p>
                <button
                  v-if="canRetry"
                  @click="retryLastAction"
                  class="mt-2 text-sm text-red-700 hover:text-red-800 underline flex items-center gap-1"
                >
                  <div v-html="Helpers.IconLibrary.getIcon('refreshCw', 'lucide', 14, '')"></div>
                  Try Again
                </button>
              </div>
            </div>
          </div>

          <!-- Capture Mode Selection (when no image selected) -->
          <div v-if="!selectedImage" class="space-y-4">
            <p class="text-secondary-custom text-center mb-6">
              Take a photo of your recipe or select an image from your device.
            </p>
            
            <!-- Camera Button (if supported) -->
            <button
              v-if="cameraSupported"
              @click="openCamera"
              class="w-full p-4 border-2 border-dashed rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all flex items-center justify-center gap-3"
              style="border-color: var(--color-border-card)"
            >
              <div v-html="Helpers.IconLibrary.getIcon('camera', 'lucide', 24, 'text-primary-500')"></div>
              <span class="font-medium text-primary-custom">Take Photo</span>
            </button>
            
            <!-- Gallery Button -->
            <button
              @click="openGallery"
              class="w-full p-4 border-2 border-dashed rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all flex items-center justify-center gap-3"
              style="border-color: var(--color-border-card)"
            >
              <div v-html="Helpers.IconLibrary.getIcon('image', 'lucide', 24, 'text-primary-500')"></div>
              <span class="font-medium text-primary-custom">Choose from Gallery</span>
            </button>
            
            <!-- Hidden file inputs -->
            <input
              ref="cameraInput"
              type="file"
              accept="image/jpeg,image/png,image/heic,image/webp"
              capture="environment"
              class="hidden"
              @change="handleFileSelect"
            >
            <input
              ref="galleryInput"
              type="file"
              accept="image/jpeg,image/png,image/heic,image/webp"
              class="hidden"
              @change="handleFileSelect"
            >
          </div>
          
          <!-- Image Preview (when image selected) -->
          <div v-else class="space-y-4">
            <!-- Preview Image -->
            <div class="relative rounded-lg overflow-hidden bg-gray-100">
              <img
                :src="previewUrl"
                alt="Recipe preview"
                class="w-full max-h-[400px] object-contain"
              >
            </div>

            <!-- File Info -->
            <div class="text-sm text-secondary-custom text-center">
              <p>{{ selectedImage.name }}</p>
              <p>{{ formatFileSize(selectedImage.size) }}</p>
            </div>
            
            <!-- Upload Progress -->
            <div v-if="uploading" class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-secondary-custom">Uploading...</span>
                <span class="font-medium text-primary-custom">{{ uploadProgress }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  :style="{ width: uploadProgress + '%' }"
                ></div>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div v-if="!uploading" class="flex gap-3">
              <button
                @click="clearSelection"
                class="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                style="border-color: var(--color-border-card)"
              >
                <div v-html="Helpers.IconLibrary.getIcon('refreshCw', 'lucide', 18, '')"></div>
                <span>{{ cameraSupported ? 'Retake' : 'Choose Different' }}</span>
              </button>
              <button
                @click="confirmImage"
                class="flex-1 btn-success flex items-center justify-center gap-2 px-4 py-3"
              >
                <div v-html="Helpers.IconLibrary.getIcon('check', 'lucide', 18, 'text-white')"></div>
                <span>Use This Image</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  
  data() {
    return {
      selectedImage: null,
      previewUrl: null,
      uploading: false,
      uploadProgress: 0,
      error: null,
      errorTitle: 'Error',
      canRetry: false,
      lastAction: null, // Store last action for retry
      retryCount: 0,
      maxRetries: 2,
      cameraSupported: false
    };
  },

  mounted() {
    this.detectCameraSupport();
  },
  
  watch: {
    visible(newVal) {
      if (newVal) {
        this.resetState();
        this.detectCameraSupport();
      }
    }
  },
  
  methods: {
    /**
     * Detect if device supports camera capture
     * **Validates: Requirements 1.5**
     */
    detectCameraSupport() {
      // Check for camera support via mediaDevices API or input capture attribute
      const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      this.cameraSupported = hasMediaDevices || isMobile;
    },
    
    /**
     * Open camera for photo capture
     * **Validates: Requirements 1.2**
     */
    openCamera() {
      this.error = null;
      this.$refs.cameraInput?.click();
    },
    
    /**
     * Open gallery for image selection
     * **Validates: Requirements 1.2**
     */
    openGallery() {
      this.error = null;
      this.$refs.galleryInput?.click();
    },
    
    /**
     * Handle file selection from camera or gallery
     * **Validates: Requirements 1.3, 6.3, 6.4**
     */
    handleFileSelect(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      
      // Validate file extension
      const validationResult = this.validateFile(file);
      if (!validationResult.valid) {
        this.error = validationResult.error;
        event.target.value = '';
        return;
      }

      this.selectedImage = file;
      this.previewUrl = URL.createObjectURL(file);
      this.error = null;
      
      // Reset file input
      event.target.value = '';
    },
    
    /**
     * Validate file extension and size
     * **Validates: Requirements 6.3, 6.4**
     * @param {File} file - The file to validate
     * @returns {{ valid: boolean, error?: string }}
     */
    validateFile(file) {
      // Allowed extensions
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'heic', 'webp'];
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (!extension || !allowedExtensions.includes(extension)) {
        return {
          valid: false,
          error: 'Unsupported image format. Please use JPG, PNG, or HEIC.'
        };
      }
      
      // Max file size: 10MB
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        return {
          valid: false,
          error: 'Image too large. Maximum size is 10MB.'
        };
      }
      
      return { valid: true };
    },
    
    /**
     * Clear selected image and return to selection mode
     * **Validates: Requirements 10.1, 10.2**
     */
    clearSelection() {
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl);
      }
      this.selectedImage = null;
      this.previewUrl = null;
      this.error = null;
    },

    /**
     * Confirm image selection and start upload
     * **Validates: Requirements 10.3, 5.1**
     */
    async confirmImage() {
      if (!this.selectedImage) return;
      
      this.uploading = true;
      this.uploadProgress = 0;
      this.error = null;
      
      try {
        // Get file extension
        const extension = this.selectedImage.name.split('.').pop()?.toLowerCase() || 'jpg';
        
        // Emit the image data for the parent to handle upload
        this.$emit('image-captured', {
          file: this.selectedImage,
          extension: extension,
          previewUrl: this.previewUrl
        });
      } catch (err) {
        this.error = err.message || 'Failed to process image';
        this.uploading = false;
      }
    },
    
    /**
     * Update upload progress (called by parent)
     * **Validates: Requirements 5.1**
     * @param {number} progress - Progress percentage (0-100)
     */
    setUploadProgress(progress) {
      this.uploadProgress = Math.min(100, Math.max(0, progress));
    },
    
    /**
     * Set uploading state (called by parent)
     * @param {boolean} uploading - Whether upload is in progress
     */
    setUploading(uploading) {
      this.uploading = uploading;
    },
    
    /**
     * Set error message (called by parent)
     * **Validates: Requirements 6.1, 6.2**
     * @param {string} error - Error message to display
     * @param {Object} options - Optional settings { title, canRetry, action }
     */
    setError(error, options = {}) {
      this.error = this.getUserFriendlyError(error);
      this.errorTitle = options.title || 'Error';
      this.canRetry = options.canRetry !== false && this.isRetryableError(error);
      this.lastAction = options.action || null;
      this.uploading = false;
    },
    
    /**
     * Convert technical errors to user-friendly messages
     * **Validates: Requirements 6.1, 6.2**
     * @param {string} error - Technical error message
     * @returns {string} User-friendly error message
     */
    getUserFriendlyError(error) {
      if (!error) return 'An unexpected error occurred';
      
      const errorLower = error.toLowerCase();
      
      // Network errors
      if (errorLower.includes('network') || errorLower.includes('fetch') || errorLower.includes('failed to fetch')) {
        return 'Network connection error. Please check your internet connection and try again.';
      }
      
      // Timeout errors
      if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
        return 'The request took too long. Please try again.';
      }
      
      // Service unavailable
      if (errorLower.includes('unavailable') || errorLower.includes('503')) {
        return 'The image processing service is temporarily unavailable. Please try again in a few moments.';
      }
      
      // File validation errors - already user-friendly
      if (errorLower.includes('unsupported image format') || 
          errorLower.includes('image too large') ||
          errorLower.includes('maximum size')) {
        return error;
      }
      
      // Vision/extraction errors
      if (errorLower.includes('could not read recipe') || errorLower.includes('could not extract')) {
        return 'Could not read recipe from image. Please ensure the recipe text is clearly visible and try again.';
      }
      
      // Upload errors
      if (errorLower.includes('upload') && errorLower.includes('failed')) {
        return 'Failed to upload image. Please check your connection and try again.';
      }
      
      // Generic server errors
      if (errorLower.includes('500') || errorLower.includes('internal server')) {
        return 'Something went wrong on our end. Please try again.';
      }
      
      return error;
    },
    
    /**
     * Check if an error is retryable
     * @param {string} error - Error message
     * @returns {boolean} Whether the error can be retried
     */
    isRetryableError(error) {
      if (!error) return false;
      
      const errorLower = error.toLowerCase();
      
      // Non-retryable errors (validation failures)
      if (errorLower.includes('unsupported image format') ||
          errorLower.includes('image too large') ||
          errorLower.includes('maximum size') ||
          errorLower.includes('invalid')) {
        return false;
      }
      
      // Retryable errors (transient failures)
      return errorLower.includes('network') ||
             errorLower.includes('timeout') ||
             errorLower.includes('unavailable') ||
             errorLower.includes('failed') ||
             errorLower.includes('try again');
    },
    
    /**
     * Retry the last failed action
     * **Validates: Requirements 6.1, 6.2**
     */
    async retryLastAction() {
      if (!this.canRetry || this.retryCount >= this.maxRetries) {
        this.error = 'Maximum retry attempts reached. Please try again later.';
        this.canRetry = false;
        return;
      }
      
      this.retryCount++;
      this.error = null;
      
      if (this.lastAction === 'confirm' && this.selectedImage) {
        await this.confirmImage();
      }
    },

    /**
     * Handle modal close
     */
    handleClose() {
      if (this.uploading) return;
      this.resetState();
      this.$emit('close');
    },
    
    /**
     * Reset modal state
     */
    resetState() {
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl);
      }
      this.selectedImage = null;
      this.previewUrl = null;
      this.uploading = false;
      this.uploadProgress = 0;
      this.error = null;
      this.errorTitle = 'Error';
      this.canRetry = false;
      this.lastAction = null;
      this.retryCount = 0;
    },
    
    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  },
  
  beforeUnmount() {
    // Clean up object URL
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }
});

// Register component globally
window.ImageCaptureModal = ImageCaptureModal;
