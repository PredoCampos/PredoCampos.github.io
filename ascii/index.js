

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    const fileUploadInput = document.getElementById('file-upload');
    const imagePreview = document.getElementById('image-preview');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const uploadLabel = document.getElementById('upload-label');
    const resultsContainer = document.getElementById('results-container');
    const resultsImagePreview = document.getElementById('results-image-preview');
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const filterForm = document.getElementById('filter-form');
    const asciiArtContainer = document.getElementById('ascii-art-container');
    const asciiPreview = document.getElementById('ascii-preview');
    const asciiForm = document.getElementById('ascii-form');
    const sectionHeaders = document.querySelectorAll('.section-header');
    const actionsContainer = document.getElementById('actions-container');
    const copyBtn = document.getElementById('copy-btn');
    const downloadTxtBtn = document.getElementById('download-txt-btn');
    const downloadPngBtn = document.getElementById('download-png-btn');
    const helpBtn = document.getElementById('help-btn');
    const helpModalOverlay = document.getElementById('help-modal-overlay');
    const closeModalBtn = document.getElementById('close-modal-btn');


    const filterControls = {
        brightness: document.getElementById('brightness'),
        contrast: document.getElementById('contrast'),
        saturate: document.getElementById('saturate'),
        'hue-rotate': document.getElementById('hue-rotate'),
        grayscale: document.getElementById('grayscale'),
        sepia: document.getElementById('sepia'),
        'invert-toggle': document.getElementById('invert-toggle'),
        invert: document.getElementById('invert'),
        'threshold-toggle': document.getElementById('threshold-toggle'),
        threshold: document.getElementById('threshold'),
    };

    const asciiControls = {
        resolution: document.getElementById('ascii-resolution'),
        charset: document.getElementById('ascii-charset'),
        invert: document.getElementById('ascii-invert-toggle'),
    };
    
    // --- Initial State & Defaults ---
    const defaultFilters = {
        brightness: 100,
        contrast: 100,
        saturate: 100,
        'hue-rotate': 0,
        grayscale: 0,
        sepia: 0,
        'invert-toggle': false,
        invert: 100,
        'threshold-toggle': false,
        threshold: 50,
    };

    const defaultAsciiSettings = {
        resolution: 100,
        charset: ' .:-=+*#%@',
        invert: false,
    };

    // Create a single offscreen canvas for processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // --- Core Functions ---

    /**
     * Dynamically updates the parameters of the SVG 'threshold' filter.
     * @param {number} level - The threshold level from 0 to 100.
     */
    function updateThresholdFilter(level) {
        const slope = 255; // A large number for a steep, threshold-like transition
        const intercept = - (level / 100) * slope;
        const feFuncs = document.querySelectorAll('#threshold feComponentTransfer > *');
        
        feFuncs.forEach(func => {
            func.setAttribute('type', 'linear');
            func.setAttribute('slope', slope);
            func.setAttribute('intercept', intercept);
        });
    }

    /**
     * Applies CSS filters to the results image based on current input values.
     */
    function applyFilters() {
        if (!resultsImagePreview) return;

        const isThresholdOn = filterControls['threshold-toggle'].checked;

        let filterParts = [
            `brightness(${filterControls.brightness.value / 100})`,
            `contrast(${filterControls.contrast.value / 100})`,
            `saturate(${filterControls.saturate.value / 100})`,
            `hue-rotate(${filterControls['hue-rotate'].value}deg)`,
            `sepia(${filterControls.sepia.value / 100})`,
        ];
        
        // Threshold overrides grayscale
        if(isThresholdOn) {
            filterParts.push('grayscale(1)');
        } else {
            filterParts.push(`grayscale(${filterControls.grayscale.value / 100})`);
        }

        if (filterControls['invert-toggle'].checked) {
            filterParts.push(`invert(${filterControls.invert.value}%)`);
        }

        let svgFilters = '';
        if (isThresholdOn) {
            svgFilters += ' url(#threshold)';
        }
        
        resultsImagePreview.style.filter = filterParts.join(' ') + svgFilters;
    }

    /**
     * Generates ASCII art from the filtered image preview.
     */
    function generateAsciiArt() {
        if (!resultsImagePreview.src || !ctx || !asciiPreview || resultsImagePreview.naturalWidth === 0) {
            return;
        }

        const sourceImage = resultsImagePreview;
        const width = sourceImage.naturalWidth;
        const height = sourceImage.naturalHeight;

        const resolution = parseInt(asciiControls.resolution.value, 10);
        const charMap = asciiControls.charset.value.split('');
        const invertColors = asciiControls.invert.checked;

        if (charMap.length === 0) {
            asciiPreview.textContent = 'Please provide characters for the character set.';
            return;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.filter = sourceImage.style.filter;
        ctx.drawImage(sourceImage, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        let asciiString = '';
        const cellWidth = width / resolution;
        const fontAspectRatio = 0.5;
        const cellHeight = cellWidth / fontAspectRatio;

        for (let y = 0; y < height; y += cellHeight) {
            for (let x = 0; x < width; x += cellWidth) {
                const posX = Math.floor(x);
                const posY = Math.floor(y);
                const i = (posY * width + posX) * 4;

                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const brightness = (r + g + b) / 3;

                let charIndex = Math.floor((brightness / 255) * (charMap.length - 1));
                if (invertColors) {
                    charIndex = (charMap.length - 1) - charIndex;
                }
                
                asciiString += charMap[charIndex] || ' ';
            }
            asciiString += '\n';
        }

        asciiPreview.textContent = asciiString;
    }


    /**
     * Updates the text display for a range slider.
     * @param {HTMLInputElement} slider - The range input element.
     */
    function updateSliderValueText(slider) {
        const valueDisplay = document.getElementById(`${slider.id}-value`);
        if (valueDisplay) {
            const unit = slider.dataset.unit || '';
            valueDisplay.textContent = slider.value + unit;
        }
    }

    /**
     * Resets all filter controls to their default values and applies them.
     */
    function resetAllFilters() {
        for (const key in defaultFilters) {
            const control = filterControls[key];
            if (!control) continue;

            if (control.type === 'checkbox') {
                control.checked = defaultFilters[key];
                control.dispatchEvent(new Event('change')); 
            } else if (control.type === 'range') {
                control.value = defaultFilters[key];
                updateSliderValueText(control);
            }
        }
        updateThresholdFilter(defaultFilters.threshold);
        applyFilters();
    }

    /**
     * Resets all ASCII controls to their default values and regenerates art.
     */
    function resetAsciiSettings() {
        asciiControls.resolution.value = defaultAsciiSettings.resolution;
        asciiControls.charset.value = defaultAsciiSettings.charset;
        asciiControls.invert.checked = defaultAsciiSettings.invert;

        updateSliderValueText(asciiControls.resolution);
        generateAsciiArt();
    }
    
    /**
     * Sets up a toggleable filter control (checkbox enables/disables a slider).
     * @param {string} toggleId - The ID of the checkbox input.
     * @param {string} sliderId - The ID of the range input.
     */
    function setupToggleableFilter(toggleId, sliderId) {
        const toggle = document.getElementById(toggleId);
        const slider = document.getElementById(sliderId);
        if (!toggle || !slider) return;

        toggle.addEventListener('change', () => {
            slider.disabled = !toggle.checked;
            if (toggleId === 'threshold-toggle') {
                filterControls.grayscale.disabled = toggle.checked;
            }
            applyFilters();
            generateAsciiArt();
        });
    }


    // --- Event Listeners Setup ---
    
    // Disable action buttons initially
    copyBtn.disabled = true;
    downloadTxtBtn.disabled = true;
    downloadPngBtn.disabled = true;

    // Section Collapse/Expand Logic
    sectionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const sectionContainer = header.closest('.results-container');
            if (sectionContainer) {
                sectionContainer.classList.toggle('collapsed');
                const button = header.querySelector('.toggle-section-btn');
                const isCollapsed = sectionContainer.classList.contains('collapsed');
                button.setAttribute('aria-expanded', !isCollapsed);
            }
        });
    });
    

    // Image Uploader Logic
    if (fileUploadInput && imagePreview && imagePreviewContainer && uploadLabel && resultsContainer && resultsImagePreview) {
        imagePreviewContainer.addEventListener('click', () => fileUploadInput.click());

        fileUploadInput.addEventListener('change', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLInputElement)) return;

            const files = target.files;
            if (files && files.length > 0) {
                const file = files[0];
                if (!file.type.startsWith('image/')) {
                    alert('Please select an image file.');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    const result = e.target?.result;
                    if (typeof result === 'string') {
                        imagePreview.src = result;
                        resultsImagePreview.src = result;

                        // Use a load event on the preview image to ensure its dimensions are available
                        resultsImagePreview.onload = () => {
                            imagePreviewContainer.style.display = 'flex';
                            uploadLabel.style.display = 'none';
                            
                            // Make sure sections are not collapsed when a new image is uploaded
                            resultsContainer.classList.remove('collapsed');
                            asciiArtContainer.classList.remove('collapsed');
                            document.querySelectorAll('.toggle-section-btn').forEach(btn => btn.setAttribute('aria-expanded', 'true'));

                            resultsContainer.classList.add('visible');
                            asciiArtContainer.classList.add('visible');
                            actionsContainer.classList.add('visible');

                            copyBtn.disabled = false;
                            downloadTxtBtn.disabled = false;
                            downloadPngBtn.disabled = false;
                            
                            resetAllFilters();
                            resetAsciiSettings();
                            
                            // Unset the handler to avoid it re-running
                            resultsImagePreview.onload = null;
                        };
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    } else {
        console.error('One or more image uploader elements are missing from the DOM.');
    }

    // Theme Toggler Logic
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', () => {
            const htmlElement = document.documentElement;
            htmlElement.classList.toggle('dark-mode');
            localStorage.setItem('theme', htmlElement.classList.contains('dark-mode') ? 'dark' : 'light');
        });
    } else {
        console.error('Theme toggle button is missing from the DOM.');
    }

    // Filter Controls Logic
    if (filterForm) {
        setupToggleableFilter('invert-toggle', 'invert');
        setupToggleableFilter('threshold-toggle', 'threshold');

        filterForm.addEventListener('input', (e) => {
            const target = e.target;
            if (target instanceof HTMLInputElement && target.type === 'range') {
                updateSliderValueText(target);
                if (target.id === 'threshold') {
                    updateThresholdFilter(target.value);
                }
                applyFilters();
                generateAsciiArt();
            }
        });

        filterForm.addEventListener('reset', (e) => {
            e.preventDefault();
            resetAllFilters();
            generateAsciiArt();
        });

        document.querySelectorAll('#filter-form input[type="range"]').forEach(updateSliderValueText);
        resetAllFilters();
    } else {
        console.error('Filter form is missing from the DOM.');
    }

    // ASCII Controls Logic
    if (asciiForm) {
        asciiForm.addEventListener('input', (e) => {
            const target = e.target;
            if (target instanceof HTMLInputElement && target.type === 'range') {
                updateSliderValueText(target);
            }
            generateAsciiArt();
        });

        asciiForm.addEventListener('reset', (e) => {
            e.preventDefault();
            resetAsciiSettings();
        });

        updateSliderValueText(asciiControls.resolution);
    } else {
        console.error('ASCII form is missing from the DOM.');
    }

    // Action Buttons Logic
    if(copyBtn) {
        copyBtn.addEventListener('click', async () => {
            if (!asciiPreview.textContent) return;

            try {
                await navigator.clipboard.writeText(asciiPreview.textContent);
                const originalContent = copyBtn.innerHTML;
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.innerHTML = originalContent;
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
                alert('Could not copy text to clipboard.');
            }
        });
    }

    if(downloadTxtBtn) {
        downloadTxtBtn.addEventListener('click', () => {
            if (!asciiPreview.textContent) return;

            const blob = new Blob([asciiPreview.textContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'ascii-art.txt';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    }

    if(downloadPngBtn) {
        downloadPngBtn.addEventListener('click', () => {
            if (!resultsImagePreview.src || resultsImagePreview.naturalWidth === 0) return;
            
            const sourceImage = resultsImagePreview;
            const width = sourceImage.naturalWidth;
            const height = sourceImage.naturalHeight;

            canvas.width = width;
            canvas.height = height;
            ctx.filter = sourceImage.style.filter; // Apply filters
            ctx.drawImage(sourceImage, 0, 0, width, height); // Draw image

            const url = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = url;
            link.download = 'edited-image.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            ctx.filter = 'none'; // Reset canvas filter
        });
    }

    // Help Modal Logic
    if (helpBtn && helpModalOverlay && closeModalBtn) {
        const openModal = () => {
            helpModalOverlay.classList.add('visible');
            document.body.classList.add('modal-open');
        };

        const closeModal = () => {
            helpModalOverlay.classList.remove('visible');
            document.body.classList.remove('modal-open');
        };

        helpBtn.addEventListener('click', openModal);
        closeModalBtn.addEventListener('click', closeModal);
        helpModalOverlay.addEventListener('click', (e) => {
            if (e.target === helpModalOverlay) {
                closeModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && helpModalOverlay.classList.contains('visible')) {
                closeModal();
            }
        });
    } else {
        console.error('One or more help modal elements are missing from the DOM.');
    }
});