/**
 * Advanced Image Compression Engine with Binary Search Algorithm
 */
class ImageCompressor {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Load image from file with proper error handling
     */
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                URL.revokeObjectURL(img.src);
                resolve(img);
            };
            img.onerror = () => {
                URL.revokeObjectURL(img.src);
                reject(new Error('Failed to load image'));
            };
            img.src = URL.createObjectURL(file);
        });
    }

    /**
     * Resize image with various options
     */
    resizeImage(img, options = {}) {
        const { width, height, percentage, maintainAspect = true } = options;
        
        let targetWidth = img.width;
        let targetHeight = img.height;

        if (percentage) {
            targetWidth = Math.round(img.width * (percentage / 100));
            targetHeight = Math.round(img.height * (percentage / 100));
        } else if (width || height) {
            if (maintainAspect) {
                const aspectRatio = img.width / img.height;
                if (width && height) {
                    const widthRatio = width / img.width;
                    const heightRatio = height / img.height;
                    const ratio = Math.min(widthRatio, heightRatio);
                    targetWidth = Math.round(img.width * ratio);
                    targetHeight = Math.round(img.height * ratio);
                } else if (width) {
                    targetWidth = width;
                    targetHeight = Math.round(width / aspectRatio);
                } else if (height) {
                    targetHeight = height;
                    targetWidth = Math.round(height * aspectRatio);
                }
            } else {
                targetWidth = width || img.width;
                targetHeight = height || img.height;
            }
        }

        // Set canvas dimensions
        this.canvas.width = targetWidth;
        this.canvas.height = targetHeight;

        // Use high-quality image rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        // Clear and draw
        this.ctx.clearRect(0, 0, targetWidth, targetHeight);
        this.ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        return {
            width: targetWidth,
            height: targetHeight,
            canvas: this.canvas
        };
    }

    /**
     * Convert canvas to blob with specific quality
     */
    canvasToBlob(canvas, format, quality) {
        return new Promise((resolve) => {
            canvas.toBlob(resolve, format, quality);
        });
    }

    /**
     * Binary search algorithm to find optimal quality for target file size
     */
    async findOptimalQuality(canvas, format, targetSizeBytes, onProgress) {
        let minQuality = 0.1;
        let maxQuality = 1.0;
        let bestQuality = 0.8;
        let bestBlob = null;
        let iterations = 0;
        const maxIterations = 12;
        const tolerance = targetSizeBytes * 0.05; // 5% tolerance

        // For PNG, quality doesn't apply, return as-is
        if (format === 'image/png') {
            const blob = await this.canvasToBlob(canvas, format, 1.0);
            onProgress?.(100, 'PNG format processed (quality adjustment not applicable)');
            return { blob, quality: 1.0, iterations: 1 };
        }

        onProgress?.(0, 'Starting intelligent compression...');

        // Initial test to see if we can achieve the target
        const testBlob = await this.canvasToBlob(canvas, format, 0.9);
        if (testBlob.size <= targetSizeBytes) {
            // We can achieve target size, proceed with binary search
            while (minQuality <= maxQuality && iterations < maxIterations) {
                iterations++;
                const currentQuality = (minQuality + maxQuality) / 2;
                
                onProgress?.(
                    (iterations / maxIterations) * 90, 
                    `Optimizing quality: ${(currentQuality * 100).toFixed(1)}%`
                );

                const blob = await this.canvasToBlob(canvas, format, currentQuality);
                const currentSize = blob.size;

                // Update best result if this is closer to target
                if (!bestBlob || Math.abs(currentSize - targetSizeBytes) < Math.abs(bestBlob.size - targetSizeBytes)) {
                    bestBlob = blob;
                    bestQuality = currentQuality;
                }

                // Check if we're within tolerance
                if (Math.abs(currentSize - targetSizeBytes) <= tolerance) {
                    onProgress?.(100, `Optimal quality found: ${(currentQuality * 100).toFixed(1)}%`);
                    return { blob, quality: currentQuality, iterations };
                }

                // Adjust search range
                if (currentSize > targetSizeBytes) {
                    maxQuality = currentQuality - 0.01;
                } else {
                    minQuality = currentQuality + 0.01;
                }
            }
        } else {
            // Even at high quality we can't reach target, use minimum quality
            bestBlob = await this.canvasToBlob(canvas, format, 0.1);
            bestQuality = 0.1;
        }

        onProgress?.(100, `Compression completed: ${(bestQuality * 100).toFixed(1)}% quality`);
        return { blob: bestBlob, quality: bestQuality, iterations };
    }

    /**
     * Main compression function
     */
    async compressImage(file, options, onProgress) {
        try {
            const {
                targetSize,
                sizeUnit = 'KB',
                format = 'image/jpeg',
                resize = {},
                enableResize = false
            } = options;

            // Calculate target size in bytes
            const targetSizeBytes = sizeUnit === 'MB' ? targetSize * 1024 * 1024 : targetSize * 1024;

            onProgress?.(10, 'Loading image...');

            // Load the image
            const img = await this.loadImage(file);
            
            onProgress?.(25, 'Processing image...');

            // Resize if needed
            const resizeOptions = enableResize ? resize : {};
            const { canvas, width, height } = this.resizeImage(img, resizeOptions);

            onProgress?.(40, 'Starting compression optimization...');

            // Find optimal quality using binary search
            const result = await this.findOptimalQuality(
                canvas, 
                format, 
                targetSizeBytes,
                (progress, message) => {
                    onProgress?.(40 + (progress * 0.5), message);
                }
            );

            onProgress?.(100, 'Compression completed successfully!');

            return {
                blob: result.blob,
                quality: result.quality,
                iterations: result.iterations,
                originalSize: file.size,
                compressedSize: result.blob.size,
                compressionRatio: ((file.size - result.blob.size) / file.size * 100).toFixed(1),
                format: format,
                dimensions: { width, height }
            };

        } catch (error) {
            console.error('Compression error:', error);
            throw new Error(`Compression failed: ${error.message}`);
        }
    }

    /**
     * Create preview URL from blob
     */
    createPreviewUrl(blob) {
        return URL.createObjectURL(blob);
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * Get image dimensions from file
     */
    async getImageDimensions(file) {
        const img = await this.loadImage(file);
        return { width: img.width, height: img.height };
    }

    /**
     * Validate image file
     */
    validateImage(file) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        
        if (!allowedTypes.includes(file.type)) {
            throw new Error(`Unsupported file type: ${file.type}. Please use JPEG, PNG, or WEBP.`);
        }
        
        if (file.size > maxSize) {
            throw new Error(`File too large: ${this.formatFileSize(file.size)}. Maximum size is 50MB.`);
        }
        
        return true;
    }

    /**
     * Clean up resources
     */
    dispose() {
        if (this.canvas) {
            this.canvas.width = 1;
            this.canvas.height = 1;
            this.ctx.clearRect(0, 0, 1, 1);
        }
    }
}

// Export for use in main.js
window.ImageCompressor = ImageCompressor;