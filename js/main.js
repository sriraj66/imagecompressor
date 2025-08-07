/**
 * Main Application Logic with Elegant UI Interactions
 */
class ImageCompressorApp {
    constructor() {
        this.compressor = new ImageCompressor();
        this.currentFile = null;
        this.compressedBlob = null;
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        // Upload elements
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');

        // Preview elements
        this.previewSection = document.getElementById('previewSection');
        this.originalPreview = document.getElementById('originalPreview');
        this.originalSize = document.getElementById('originalSize');
        this.originalDimensions = document.getElementById('originalDimensions');
        this.compressedPreview = document.getElementById('compressedPreview');
        this.compressedPlaceholder = document.getElementById('compressedPlaceholder');
        this.compressedSize = document.getElementById('compressedSize');
        this.compressedDimensions = document.getElementById('compressedDimensions');

        // Control elements
        this.controlsSection = document.getElementById('controlsSection');
        this.targetSizeInput = document.getElementById('targetSize');
        this.sizeUnitSelect = document.getElementById('sizeUnit');
        this.outputFormatSelect = document.getElementById('outputFormat');
        this.enableResizeCheck = document.getElementById('enableResize');
        this.resizeOptions = document.getElementById('resizeOptions');
        this.compressBtn = document.getElementById('compressBtn');
        this.btnText = document.getElementById('btnText');
        this.btnLoader = document.getElementById('btnLoader');

        // Resize controls
        this.resizeTabs = document.querySelectorAll('.resize-tab');
        this.dimensionsInputs = document.getElementById('dimensionsInputs');
        this.percentageInputs = document.getElementById('percentageInputs');
        this.targetWidthInput = document.getElementById('targetWidth');
        this.targetHeightInput = document.getElementById('targetHeight');
        this.maintainAspectCheck = document.getElementById('maintainAspect');
        this.scalePercentageInput = document.getElementById('scalePercentage');

        // Progress elements
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');

        // Results elements
        this.resultsSection = document.getElementById('resultsSection');
        this.resultOriginalSize = document.getElementById('resultOriginalSize');
        this.resultCompressedSize = document.getElementById('resultCompressedSize');
        this.compressionRatio = document.getElementById('compressionRatio');
        this.qualityUsed = document.getElementById('qualityUsed');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.resetBtn = document.getElementById('resetBtn');
    }

    bindEvents() {
        // Upload events
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Control events
        this.enableResizeCheck.addEventListener('change', this.toggleResizeOptions.bind(this));
        this.resizeTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchResizeMode(tab.dataset.mode));
        });
        this.maintainAspectCheck.addEventListener('change', this.handleAspectRatioChange.bind(this));
        this.targetWidthInput.addEventListener('input', this.handleDimensionChange.bind(this));
        this.targetHeightInput.addEventListener('input', this.handleDimensionChange.bind(this));
        
        // Compress button
        this.compressBtn.addEventListener('click', this.compressImage.bind(this));

        // Action buttons
        this.downloadBtn.addEventListener('click', this.downloadImage.bind(this));
        this.resetBtn.addEventListener('click', this.resetApp.bind(this));

        // Prevent default drag behaviors
        document.addEventListener('dragover', e => e.preventDefault());
        document.addEventListener('drop', e => e.preventDefault());
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('border-primary-500', 'bg-primary-50');
    }

    handleDragLeave(e) {
        e.preventDefault();
        if (!this.uploadArea.contains(e.relatedTarget)) {
            this.uploadArea.classList.remove('border-primary-500', 'bg-primary-50');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('border-primary-500', 'bg-primary-50');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    async processFile(file) {
        try {
            // Validate the file
            this.compressor.validateImage(file);
            
            this.currentFile = file;
            
            // Get image dimensions
            const dimensions = await this.compressor.getImageDimensions(file);
            
            // Show immediate preview
            await this.showOriginalPreview(file, dimensions);
            
            // Set default values
            this.setDefaultValues(file, dimensions);
            
            // Show sections with animation
            this.showSection(this.previewSection);
            setTimeout(() => this.showSection(this.controlsSection), 200);
            
        } catch (error) {
            this.showError('File processing failed: ' + error.message);
        }
    }

    async showOriginalPreview(file, dimensions) {
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        this.originalPreview.src = previewUrl;
        
        // Update info
        this.originalSize.textContent = this.compressor.formatFileSize(file.size);
        this.originalDimensions.textContent = `${dimensions.width} × ${dimensions.height}px`;
        
        // Reset compressed preview
        this.compressedPreview.classList.add('hidden');
        this.compressedPlaceholder.classList.remove('hidden');
        this.compressedSize.textContent = '-';
        this.compressedDimensions.textContent = '-';
    }

    setDefaultValues(file, dimensions) {
        // Set default target size (half of original, minimum 100KB)
        const defaultTargetKB = Math.max(100, Math.floor(file.size / 1024 / 2));
        this.targetSizeInput.value = defaultTargetKB;
        
        // Set resize placeholders
        this.targetWidthInput.placeholder = dimensions.width;
        this.targetHeightInput.placeholder = dimensions.height;
        
        // Clear previous values
        this.targetWidthInput.value = '';
        this.targetHeightInput.value = '';
        this.scalePercentageInput.value = '75';
    }

    toggleResizeOptions() {
        if (this.enableResizeCheck.checked) {
            this.showSection(this.resizeOptions);
        } else {
            this.hideSection(this.resizeOptions);
        }
    }

    switchResizeMode(mode) {
        // Update tab states
        this.resizeTabs.forEach(tab => {
            if (tab.dataset.mode === mode) {
                tab.classList.add('active', 'bg-white', 'text-primary-600', 'shadow-sm');
                tab.classList.remove('text-slate-600');
            } else {
                tab.classList.remove('active', 'bg-white', 'text-primary-600', 'shadow-sm');
                tab.classList.add('text-slate-600');
            }
        });

        // Show/hide input sections
        if (mode === 'dimensions') {
            this.showSection(this.dimensionsInputs);
            this.hideSection(this.percentageInputs);
        } else {
            this.hideSection(this.dimensionsInputs);
            this.showSection(this.percentageInputs);
        }
    }

    handleAspectRatioChange() {
        if (this.maintainAspectCheck.checked) {
            this.handleDimensionChange();
        }
    }

    async handleDimensionChange() {
        if (!this.currentFile || !this.maintainAspectCheck.checked) return;

        try {
            const dimensions = await this.compressor.getImageDimensions(this.currentFile);
            const aspectRatio = dimensions.width / dimensions.height;

            const width = parseInt(this.targetWidthInput.value);
            const height = parseInt(this.targetHeightInput.value);

            if (width && !isNaN(width) && document.activeElement === this.targetWidthInput) {
                this.targetHeightInput.value = Math.round(width / aspectRatio);
            } else if (height && !isNaN(height) && document.activeElement === this.targetHeightInput) {
                this.targetWidthInput.value = Math.round(height * aspectRatio);
            }
        } catch (error) {
            console.error('Error calculating aspect ratio:', error);
        }
    }

    async compressImage() {
        if (!this.currentFile) return;

        try {
            // Validate inputs
            const targetSize = parseFloat(this.targetSizeInput.value);
            if (!targetSize || targetSize <= 0) {
                throw new Error('Please enter a valid target file size');
            }

            // Prepare options
            const options = {
                targetSize,
                sizeUnit: this.sizeUnitSelect.value,
                format: this.outputFormatSelect.value,
                enableResize: this.enableResizeCheck.checked,
                resize: {}
            };

            // Add resize options if enabled
            if (this.enableResizeCheck.checked) {
                const activeMode = document.querySelector('.resize-tab.active').dataset.mode;
                
                if (activeMode === 'dimensions') {
                    const width = parseInt(this.targetWidthInput.value) || null;
                    const height = parseInt(this.targetHeightInput.value) || null;
                    options.resize = {
                        width,
                        height,
                        maintainAspect: this.maintainAspectCheck.checked
                    };
                } else {
                    const percentage = parseFloat(this.scalePercentageInput.value) || 75;
                    options.resize = { percentage };
                }
            }

            // Show progress and set loading state
            this.showProgress();
            this.setButtonLoading(true);

            // Compress the image
            const result = await this.compressor.compressImage(
                this.currentFile,
                options,
                (progress, message) => {
                    this.updateProgress(progress, message);
                }
            );

            // Store compressed blob
            this.compressedBlob = result.blob;

            // Show compressed preview immediately
            await this.showCompressedPreview(result);

            // Show results
            this.showResults(result);

        } catch (error) {
            this.showError('Compression failed: ' + error.message);
        } finally {
            this.setButtonLoading(false);
            this.hideSection(this.progressSection);
        }
    }

    async showCompressedPreview(result) {
        // Create preview URL
        const previewUrl = this.compressor.createPreviewUrl(result.blob);
        this.compressedPreview.src = previewUrl;
        
        // Show compressed image, hide placeholder
        this.compressedPreview.classList.remove('hidden');
        this.compressedPlaceholder.classList.add('hidden');
        
        // Update info
        this.compressedSize.textContent = this.compressor.formatFileSize(result.compressedSize);
        this.compressedDimensions.textContent = `${result.dimensions.width} × ${result.dimensions.height}px`;
    }

    showProgress() {
        this.showSection(this.progressSection);
        this.progressFill.style.width = '0%';
        this.progressText.textContent = 'Starting compression...';
    }

    updateProgress(percentage, message) {
        const clampedPercentage = Math.min(100, Math.max(0, percentage));
        this.progressFill.style.width = `${clampedPercentage}%`;
        this.progressText.textContent = message || `Processing... ${clampedPercentage.toFixed(0)}%`;
    }

    showResults(result) {
        // Update statistics
        this.resultOriginalSize.textContent = this.compressor.formatFileSize(result.originalSize);
        this.resultCompressedSize.textContent = this.compressor.formatFileSize(result.compressedSize);
        this.compressionRatio.textContent = `${result.compressionRatio}%`;
        this.qualityUsed.textContent = `${(result.quality * 100).toFixed(1)}%`;

        // Show results section
        this.showSection(this.resultsSection);
    }

    downloadImage() {
        if (!this.compressedBlob) return;

        const format = this.outputFormatSelect.value;
        const extension = format.split('/')[1];
        const originalName = this.currentFile.name.replace(/\.[^/.]+$/, "");
        const filename = `${originalName}_compressed.${extension}`;

        const url = URL.createObjectURL(this.compressedBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    resetApp() {
        // Clean up URLs
        if (this.originalPreview.src) {
            URL.revokeObjectURL(this.originalPreview.src);
        }
        if (this.compressedPreview.src) {
            URL.revokeObjectURL(this.compressedPreview.src);
        }

        // Reset state
        this.currentFile = null;
        this.compressedBlob = null;

        // Reset form
        this.fileInput.value = '';
        this.targetSizeInput.value = '';
        this.targetWidthInput.value = '';
        this.targetHeightInput.value = '';
        this.scalePercentageInput.value = '75';
        this.enableResizeCheck.checked = false;
        this.maintainAspectCheck.checked = true;

        // Reset UI
        this.originalPreview.src = '';
        this.compressedPreview.src = '';
        this.compressedPreview.classList.add('hidden');
        this.compressedPlaceholder.classList.remove('hidden');

        // Hide sections
        this.hideSection(this.previewSection);
        this.hideSection(this.controlsSection);
        this.hideSection(this.progressSection);
        this.hideSection(this.resultsSection);
        this.hideSection(this.resizeOptions);

        // Reset button state
        this.setButtonLoading(false);
    }

    setButtonLoading(loading) {
        this.compressBtn.disabled = loading;
        
        if (loading) {
            this.btnText.classList.add('hidden');
            this.btnLoader.classList.remove('hidden');
        } else {
            this.btnText.classList.remove('hidden');
            this.btnLoader.classList.add('hidden');
        }
    }

    showSection(element) {
        element.classList.remove('hidden');
    }

    hideSection(element) {
        element.classList.add('hidden');
    }

    showError(message) {
        // Create elegant error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-slide-up';
        errorDiv.innerHTML = `
            <div class="flex items-center space-x-3">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
        
        console.error(message);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageCompressorApp();
});