// Image Capture Modal Component
// Allows users to capture or select multiple images for recipe extraction
//
// **Feature: recipe-image-capture, multi-image-recipe-categories**
// **Validates: Requirements 1.1, 1.2, 1.3, 1.5, 2.1, 2.2, 2.3, 5.1, 6.1, 6.2, 6.3, 6.4, 8.1, 8.2, 8.3, 8.4, 10.1, 10.2, 10.3**

const ImageCaptureModal = Vue.defineComponent({
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['close', 'image-captured', 'images-captured'],
  
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

          <!-- Capture Mode Selection (when no images selected) -->
          <div v-if="imageSet.length === 0" class="space-y-4">
            <p class="text-secondary-custom text-center mb-6">
              Take a photo of your recipe or select images from your device. You can add up to 5 images.
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

          <!-- Multi-Image Preview (when images selected) -->
          <!-- **Feature: multi-image-recipe-categories** -->
          <!-- **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 8.1, 8.2** -->
          <div v-else class="space-y-4">
            <!-- Image Count Display -->
            <div class="text-center text-sm text-secondary-custom">
              {{ imageCount }}
            </div>
            
            <!-- Thumbnail Gallery -->
            <div class="flex flex-wrap gap-2 justify-center">
              <div
                v-for="(img, idx) in imageSet"
                :key="idx"
                class="relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all"
                :class="activeImageIndex === idx ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'"
                @click="selectImage(idx)"
              >
                <img
                  :src="img.previewUrl"
                  :alt="'Image ' + (idx + 1)"
                  class="w-full h-full object-cover"
                >
                <!-- Upload Progress Overlay -->
                <div
                  v-if="uploading && !img.uploaded && img.uploadProgress < 100"
                  class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                >
                  <span class="text-white text-xs font-medium">{{ img.uploadProgress }}%</span>
                </div>
                <!-- Upload Complete Checkmark -->
                <div
                  v-if="img.uploaded"
                  class="absolute inset-0 bg-green-500 bg-opacity-30 flex items-center justify-center"
                >
                  <div v-html="Helpers.IconLibrary.getIcon('check', 'lucide', 20, 'text-white')"></div>
                </div>
                <!-- Upload Error Indicator -->
                <div
                  v-if="img.error"
                  class="absolute inset-0 bg-red-500 bg-opacity-30 flex items-center justify-center"
                >
                  <div v-html="Helpers.IconLibrary.getIcon('alertTriangle', 'lucide', 16, 'text-white')"></div>
                </div>
                <!-- Remove Button -->
                <button
                  v-if="!uploading"
                  @click.stop="removeImage(idx)"
                  class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors"
                >
                  <div v-html="Helpers.IconLibrary.getIcon('x', 'lucide', 12, 'text-white')"></div>
                </button>
              </div>
            </div>

            <!-- Main Preview Image -->
            <div class="relative rounded-lg overflow-hidden bg-gray-100">
              <img
                :src="activePreviewUrl"
                alt="Recipe preview"
                class="w-full max-h-[300px] object-contain"
              >
            </div>

            <!-- Active Image Info -->
            <div class="text-sm text-secondary-custom text-center">
              <p>{{ activeImage?.file?.name || 'Image ' + (activeImageIndex + 1) }}</p>
              <p v-if="activeImage?.file">{{ formatFileSize(activeImage.file.size) }}</p>
            </div>
            
            <!-- Add Another Image Button -->
            <!-- **Feature: multi-image-recipe-categories** -->
            <!-- **Validates: Requirements 1.1, 2.1, 2.2** -->
            <div v-if="!uploading" class="flex justify-center">
              <button
                v-if="canAddMore"
                @click="openGalleryForMore"
                class="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
                style="border-color: var(--color-border-card)"
              >
                <div v-html="Helpers.IconLibrary.getIcon('plus', 'lucide', 16, 'text-primary-500')"></div>
                <span>Add Another Image</span>
              </button>
              <span v-else class="text-sm text-gray-500">
                Maximum 5 images per recipe
              </span>
            </div>
            
            <!-- Hidden file input for adding more images -->
            <input
              ref="addMoreInput"
              type="file"
              accept="image/jpeg,image/png,image/heic,image/webp"
              class="hidden"
              @change="handleAddMoreFile"
            >

            <!-- Upload Progress (when uploading multiple) -->
            <div v-if="uploading" class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-secondary-custom">{{ uploadStatusText }}</span>
                <span class="font-medium text-primary-custom">{{ overallProgress }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div
                  class="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  :style="{ width: overallProgress + '%' }"
                ></div>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div v-if="!uploading" class="flex gap-3">
              <button
                @click="clearAllImages"
                class="flex-1 px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                style="border-color: var(--color-border-card)"
              >
                <div v-html="Helpers.IconLibrary.getIcon('refreshCw', 'lucide', 18, '')"></div>
                <span>Start Over</span>
              </button>
              <button
                @click="confirmImages"
                class="flex-1 btn-success flex items-center justify-center gap-2 px-4 py-3"
              >
                <div v-html="Helpers.IconLibrary.getIcon('check', 'lucide', 18, 'text-white')"></div>
                <span>{{ imageSet.length > 1 ? 'Use These Images' : 'Use This Image' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  data() {
    return {
      // Multi-image support
      // **Feature: multi-image-recipe-categories**
      // **Validates: Requirements 1.1, 1.3, 2.1**
      imageSet: [],           // Array of { file, previewUrl, uploadProgress, uploaded, error, s3Key }
      maxImages: 5,
      activeImageIndex: 0,    // Currently previewed image
      
      // Legacy single-image support (for backward compatibility)
      selectedImage: null,
      previewUrl: null,
      
      // Upload state
      uploading: false,
      uploadProgress: 0,
      
      // Error state
      error: null,
      errorTitle: 'Error',
      canRetry: false,
      lastAction: null,
      retryCount: 0,
      maxRetries: 2,
      
      // Device capabilities
      cameraSupported: false
    };
  },

  computed: {
    /**
     * Check if more images can be added
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 2.1**
     */
    canAddMore() {
      return this.imageSet.length < this.maxImages;
    },
    
    /**
     * Check if all images have been uploaded
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 8.2**
     */
    allUploaded() {
      return this.imageSet.length > 0 && 
             this.imageSet.every(img => img.uploaded);
    },

    /**
     * Get image count display string
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 1.3**
     */
    imageCount() {
      const count = this.imageSet.length;
      return `${count} image${count !== 1 ? 's' : ''} selected`;
    },
    
    /**
     * Get the currently active image object
     */
    activeImage() {
      return this.imageSet[this.activeImageIndex] || null;
    },
    
    /**
     * Get the preview URL for the active image
     */
    activePreviewUrl() {
      return this.activeImage?.previewUrl || null;
    },
    
    /**
     * Calculate overall upload progress across all images
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 8.1**
     */
    overallProgress() {
      if (this.imageSet.length === 0) return 0;
      const total = this.imageSet.reduce((sum, img) => sum + (img.uploadProgress || 0), 0);
      return Math.round(total / this.imageSet.length);
    },
    
    /**
     * Get upload status text
     */
    uploadStatusText() {
      const uploaded = this.imageSet.filter(img => img.uploaded).length;
      const total = this.imageSet.length;
      if (uploaded === total) {
        return 'Processing images...';
      }
      return `Uploading ${uploaded + 1} of ${total}...`;
    }
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
     */
    detectCameraSupport() {
      const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      this.cameraSupported = hasMediaDevices || isMobile;
    },
    
    /**
     * Open camera for photo capture
     */
    openCamera() {
      this.error = null;
      this.$refs.cameraInput?.click();
    },
    
    /**
     * Open gallery for image selection
     */
    openGallery() {
      this.error = null;
      this.$refs.galleryInput?.click();
    },
    
    /**
     * Open gallery to add more images
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 1.1, 2.1**
     */
    openGalleryForMore() {
      if (!this.canAddMore) {
        this.error = 'Maximum 5 images per recipe';
        return;
      }
      this.error = null;
      this.$refs.addMoreInput?.click();
    },
    
    /**
     * Handle file selection from camera or gallery (first image)
     */
    handleFileSelect(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      
      const validationResult = this.validateFile(file);
      if (!validationResult.valid) {
        this.error = validationResult.error;
        event.target.value = '';
        return;
      }

      this.addImage(file);
      this.error = null;
      event.target.value = '';
    },

    /**
     * Handle file selection for adding more images
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 1.1, 2.1, 2.2**
     */
    handleAddMoreFile(event) {
      const file = event.target.files?.[0];
      if (!file) return;
      
      const validationResult = this.validateFile(file);
      if (!validationResult.valid) {
        this.error = validationResult.error;
        event.target.value = '';
        return;
      }

      this.addImage(file);
      this.error = null;
      event.target.value = '';
    },
    
    /**
     * Add an image to the imageSet
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 1.1, 2.1, 2.2**
     * @param {File} file - The image file to add
     */
    addImage(file) {
      if (this.imageSet.length >= this.maxImages) {
        this.error = 'Maximum 5 images per recipe';
        return;
      }
      
      this.imageSet.push({
        file,
        previewUrl: URL.createObjectURL(file),
        uploadProgress: 0,
        uploaded: false,
        error: null,
        s3Key: null
      });
      
      // Set active to the newly added image
      this.activeImageIndex = this.imageSet.length - 1;
    },
    
    /**
     * Remove an image from the imageSet
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 1.5, 2.3**
     * @param {number} index - Index of image to remove
     */
    removeImage(index) {
      if (index < 0 || index >= this.imageSet.length) return;
      
      const img = this.imageSet[index];
      if (img.previewUrl) {
        URL.revokeObjectURL(img.previewUrl);
      }
      
      this.imageSet.splice(index, 1);
      
      // Update activeImageIndex if needed
      if (this.imageSet.length === 0) {
        this.activeImageIndex = 0;
      } else if (this.activeImageIndex >= this.imageSet.length) {
        this.activeImageIndex = this.imageSet.length - 1;
      } else if (this.activeImageIndex > index) {
        this.activeImageIndex--;
      }
    },

    /**
     * Select an image to preview
     * @param {number} index - Index of image to select
     */
    selectImage(index) {
      if (index >= 0 && index < this.imageSet.length) {
        this.activeImageIndex = index;
      }
    },
    
    /**
     * Validate file extension and size
     * @param {File} file - The file to validate
     * @returns {{ valid: boolean, error?: string }}
     */
    validateFile(file) {
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'heic', 'webp'];
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (!extension || !allowedExtensions.includes(extension)) {
        return {
          valid: false,
          error: 'Unsupported image format. Please use JPG, PNG, or HEIC.'
        };
      }
      
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return {
          valid: false,
          error: 'Image too large. Maximum size is 10MB.'
        };
      }
      
      return { valid: true };
    },
    
    /**
     * Clear all selected images
     */
    clearAllImages() {
      this.imageSet.forEach(img => {
        if (img.previewUrl) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
      this.imageSet = [];
      this.activeImageIndex = 0;
      this.error = null;
    },

    /**
     * Confirm images and start upload
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 1.6, 8.1, 8.2, 8.3, 8.4**
     */
    async confirmImages() {
      if (this.imageSet.length === 0) return;
      
      this.uploading = true;
      this.error = null;
      
      // For single image, use legacy behavior for backward compatibility
      if (this.imageSet.length === 1) {
        const img = this.imageSet[0];
        const extension = img.file.name.split('.').pop()?.toLowerCase() || 'jpg';
        
        this.$emit('image-captured', {
          file: img.file,
          extension: extension,
          previewUrl: img.previewUrl
        });
        return;
      }
      
      // For multiple images, emit all image data
      const images = this.imageSet.map(img => ({
        file: img.file,
        extension: img.file.name.split('.').pop()?.toLowerCase() || 'jpg',
        previewUrl: img.previewUrl
      }));
      
      this.$emit('images-captured', { images });
    },
    
    /**
     * Upload all images to S3
     * **Feature: multi-image-recipe-categories**
     * **Validates: Requirements 1.6, 8.1, 8.2, 8.3, 8.4**
     * @param {Function} getUploadUrls - Function to get presigned URLs
     * @param {Function} uploadToS3 - Function to upload file to S3
     * @returns {Promise<{success: boolean, s3Keys?: string[], errors?: Array}>}
     */
    async uploadAllImages(getUploadUrls, uploadToS3) {
      if (this.imageSet.length === 0) {
        return { success: false, errors: ['No images to upload'] };
      }
      
      this.uploading = true;
      this.error = null;
      const errors = [];
      const s3Keys = [];
      
      try {
        // Get file extensions
        const extensions = this.imageSet.map(img => 
          img.file.name.split('.').pop()?.toLowerCase() || 'jpg'
        );
        
        // Request presigned URLs for all images
        const urlsResult = await getUploadUrls(extensions);
        if (!urlsResult.success) {
          throw new Error(urlsResult.error || 'Failed to get upload URLs');
        }

        const uploads = urlsResult.uploads;
        
        // Upload each image with individual progress tracking
        for (let i = 0; i < this.imageSet.length; i++) {
          const img = this.imageSet[i];
          const upload = uploads[i];
          
          try {
            // Update progress callback for this image
            const onProgress = (progress) => {
              img.uploadProgress = progress;
            };
            
            await uploadToS3(upload.uploadUrl, img.file, onProgress);
            
            img.uploaded = true;
            img.uploadProgress = 100;
            img.s3Key = upload.s3Key;
            s3Keys.push(upload.s3Key);
          } catch (uploadError) {
            img.error = uploadError.message || 'Upload failed';
            errors.push({
              index: i,
              error: img.error
            });
          }
        }
        
        // Check for partial failures
        if (errors.length > 0 && errors.length < this.imageSet.length) {
          this.error = `${errors.length} image(s) failed to upload. You can retry or continue with uploaded images.`;
          this.errorTitle = 'Partial Upload Failure';
          return { success: false, s3Keys, errors, partial: true };
        }
        
        if (errors.length === this.imageSet.length) {
          this.error = 'All images failed to upload. Please try again.';
          this.errorTitle = 'Upload Failed';
          return { success: false, errors };
        }
        
        return { success: true, s3Keys };
      } catch (err) {
        this.error = err.message || 'Failed to upload images';
        this.errorTitle = 'Upload Error';
        return { success: false, errors: [err.message] };
      } finally {
        this.uploading = false;
      }
    },

    /**
     * Update upload progress for a specific image (called by parent)
     * @param {number} index - Image index
     * @param {number} progress - Progress percentage (0-100)
     */
    setImageUploadProgress(index, progress) {
      if (index >= 0 && index < this.imageSet.length) {
        this.imageSet[index].uploadProgress = Math.min(100, Math.max(0, progress));
      }
    },
    
    /**
     * Mark an image as uploaded (called by parent)
     * @param {number} index - Image index
     * @param {string} s3Key - S3 key of uploaded image
     */
    setImageUploaded(index, s3Key) {
      if (index >= 0 && index < this.imageSet.length) {
        this.imageSet[index].uploaded = true;
        this.imageSet[index].uploadProgress = 100;
        this.imageSet[index].s3Key = s3Key;
      }
    },
    
    /**
     * Set error for a specific image (called by parent)
     * @param {number} index - Image index
     * @param {string} error - Error message
     */
    setImageError(index, error) {
      if (index >= 0 && index < this.imageSet.length) {
        this.imageSet[index].error = error;
      }
    },
    
    /**
     * Get all S3 keys for uploaded images
     * @returns {string[]} Array of S3 keys
     */
    getUploadedS3Keys() {
      return this.imageSet
        .filter(img => img.uploaded && img.s3Key)
        .map(img => img.s3Key);
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
     * @param {string} error - Technical error message
     * @returns {string} User-friendly error message
     */
    getUserFriendlyError(error) {
      if (!error) return 'An unexpected error occurred';
      
      const errorLower = error.toLowerCase();
      
      if (errorLower.includes('network') || errorLower.includes('fetch') || errorLower.includes('failed to fetch')) {
        return 'Network connection error. Please check your internet connection and try again.';
      }
      
      if (errorLower.includes('timeout') || errorLower.includes('timed out')) {
        return 'The request took too long. Please try again.';
      }
      
      if (errorLower.includes('unavailable') || errorLower.includes('503')) {
        return 'The image processing service is temporarily unavailable. Please try again in a few moments.';
      }
      
      if (errorLower.includes('unsupported image format') || 
          errorLower.includes('image too large') ||
          errorLower.includes('maximum size') ||
          errorLower.includes('maximum 5 images')) {
        return error;
      }
      
      if (errorLower.includes('could not read recipe') || errorLower.includes('could not extract')) {
        return 'Could not read recipe from image. Please ensure the recipe text is clearly visible and try again.';
      }
      
      if (errorLower.includes('upload') && errorLower.includes('failed')) {
        return 'Failed to upload image. Please check your connection and try again.';
      }
      
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
      
      if (errorLower.includes('unsupported image format') ||
          errorLower.includes('image too large') ||
          errorLower.includes('maximum size') ||
          errorLower.includes('maximum 5 images') ||
          errorLower.includes('invalid')) {
        return false;
      }
      
      return errorLower.includes('network') ||
             errorLower.includes('timeout') ||
             errorLower.includes('unavailable') ||
             errorLower.includes('failed') ||
             errorLower.includes('try again');
    },
    
    /**
     * Retry the last failed action
     */
    async retryLastAction() {
      if (!this.canRetry || this.retryCount >= this.maxRetries) {
        this.error = 'Maximum retry attempts reached. Please try again later.';
        this.canRetry = false;
        return;
      }
      
      this.retryCount++;
      this.error = null;
      
      if (this.lastAction === 'confirm' && this.imageSet.length > 0) {
        await this.confirmImages();
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
      // Clean up all preview URLs
      this.imageSet.forEach(img => {
        if (img.previewUrl) {
          URL.revokeObjectURL(img.previewUrl);
        }
      });
      
      // Reset multi-image state
      this.imageSet = [];
      this.activeImageIndex = 0;
      
      // Reset legacy state
      if (this.previewUrl) {
        URL.revokeObjectURL(this.previewUrl);
      }
      this.selectedImage = null;
      this.previewUrl = null;
      
      // Reset upload state
      this.uploading = false;
      this.uploadProgress = 0;
      
      // Reset error state
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
    // Clean up all object URLs
    this.imageSet.forEach(img => {
      if (img.previewUrl) {
        URL.revokeObjectURL(img.previewUrl);
      }
    });
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }
});

// Register component globally
window.ImageCaptureModal = ImageCaptureModal;
