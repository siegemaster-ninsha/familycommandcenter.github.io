// Image Orientation Utilities
// Handles EXIF orientation detection and image rotation
//
// **Feature: recipe-image-capture**
// **Validates: Image orientation correction for better OCR accuracy**

const ImageOrientation = {
  /**
   * Read EXIF orientation from image file
   * @param {File} file - Image file
   * @returns {Promise<number>} EXIF orientation (1-8), defaults to 1
   */
  async getExifOrientation(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const view = new DataView(e.target.result);
        
        // Check for JPEG marker
        if (view.getUint16(0, false) !== 0xFFD8) {
          resolve(1);
          return;
        }
        
        const length = view.byteLength;
        let offset = 2;
        
        while (offset < length) {
          if (offset + 2 > length) break;
          
          const marker = view.getUint16(offset, false);
          offset += 2;
          
          // APP1 marker (EXIF)
          if (marker === 0xFFE1) {
            if (offset + 2 > length) break;
            
            // Skip exif length field
            offset += 2;
            
            // Check for "Exif" string
            if (offset + 6 > length) break;
            const exifHeader = String.fromCharCode(
              view.getUint8(offset),
              view.getUint8(offset + 1),
              view.getUint8(offset + 2),
              view.getUint8(offset + 3)
            );
            
            if (exifHeader !== 'Exif') {
              resolve(1);
              return;
            }
            
            offset += 6; // Skip "Exif\0\0"
            
            // TIFF header
            if (offset + 8 > length) break;
            const tiffOffset = offset;
            const littleEndian = view.getUint16(offset, false) === 0x4949;
            offset += 2;
            
            // Skip TIFF magic number
            offset += 2;
            
            // Get IFD0 offset
            const ifd0Offset = view.getUint32(offset, littleEndian);
            offset = tiffOffset + ifd0Offset;
            
            if (offset + 2 > length) break;
            const numEntries = view.getUint16(offset, littleEndian);
            offset += 2;
            
            // Search for orientation tag (0x0112)
            for (let i = 0; i < numEntries; i++) {
              if (offset + 12 > length) break;
              
              const tag = view.getUint16(offset, littleEndian);
              if (tag === 0x0112) {
                const orientation = view.getUint16(offset + 8, littleEndian);
                resolve(orientation);
                return;
              }
              offset += 12;
            }
            
            resolve(1);
            return;
          } else if ((marker & 0xFF00) === 0xFF00) {
            // Skip other markers
            if (offset + 2 > length) break;
            offset += view.getUint16(offset, false);
          } else {
            break;
          }
        }
        
        resolve(1);
      };
      
      reader.onerror = () => resolve(1);
      
      // Only read first 64KB for EXIF data
      reader.readAsArrayBuffer(file.slice(0, 65536));
    });
  },

  /**
   * Get rotation degrees from EXIF orientation
   * @param {number} orientation - EXIF orientation value (1-8)
   * @returns {{ rotation: number, flip: boolean }}
   */
  getTransformFromOrientation(orientation) {
    const transforms = {
      1: { rotation: 0, flip: false },
      2: { rotation: 0, flip: true },
      3: { rotation: 180, flip: false },
      4: { rotation: 180, flip: true },
      5: { rotation: 90, flip: true },
      6: { rotation: 90, flip: false },
      7: { rotation: 270, flip: true },
      8: { rotation: 270, flip: false }
    };
    return transforms[orientation] || { rotation: 0, flip: false };
  },

  /**
   * Rotate image by specified degrees
   * @param {string} imageUrl - Image URL or data URL
   * @param {number} degrees - Rotation in degrees (0, 90, 180, 270)
   * @param {boolean} flip - Whether to flip horizontally
   * @returns {Promise<{ dataUrl: string, blob: Blob }>}
   */
  async rotateImage(imageUrl, degrees, flip = false) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Normalize degrees
        degrees = ((degrees % 360) + 360) % 360;
        
        // Set canvas dimensions based on rotation
        if (degrees === 90 || degrees === 270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        
        // Move to center, rotate, then draw
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((degrees * Math.PI) / 180);
        
        if (flip) {
          ctx.scale(-1, 1);
        }
        
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        
        // Convert to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({
              dataUrl: canvas.toDataURL('image/jpeg', 0.92),
              blob: blob
            });
          } else {
            reject(new Error('Failed to create image blob'));
          }
        }, 'image/jpeg', 0.92);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  },

  /**
   * Auto-correct image orientation based on EXIF data
   * @param {File} file - Original image file
   * @returns {Promise<{ file: File, previewUrl: string, wasRotated: boolean, originalOrientation: number }>}
   */
  async autoCorrectOrientation(file) {
    const orientation = await this.getExifOrientation(file);
    const transform = this.getTransformFromOrientation(orientation);
    
    // If no rotation needed, return original
    if (transform.rotation === 0 && !transform.flip) {
      return {
        file: file,
        previewUrl: URL.createObjectURL(file),
        wasRotated: false,
        originalOrientation: orientation
      };
    }
    
    // Need to rotate
    const originalUrl = URL.createObjectURL(file);
    try {
      const result = await this.rotateImage(originalUrl, transform.rotation, transform.flip);
      
      // Create new file from blob
      const correctedFile = new File([result.blob], file.name, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
      URL.revokeObjectURL(originalUrl);
      
      return {
        file: correctedFile,
        previewUrl: result.dataUrl,
        wasRotated: true,
        originalOrientation: orientation
      };
    } catch (err) {
      URL.revokeObjectURL(originalUrl);
      // Fall back to original on error
      return {
        file: file,
        previewUrl: URL.createObjectURL(file),
        wasRotated: false,
        originalOrientation: orientation
      };
    }
  },

  /**
   * Apply manual rotation to an image
   * @param {string} currentUrl - Current image URL
   * @param {number} additionalDegrees - Degrees to rotate (90, -90, 180)
   * @returns {Promise<{ dataUrl: string, blob: Blob }>}
   */
  async applyManualRotation(currentUrl, additionalDegrees) {
    return this.rotateImage(currentUrl, additionalDegrees, false);
  }
};

// Export for use
window.ImageOrientation = ImageOrientation;
