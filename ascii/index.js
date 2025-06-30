// Importa as bibliotecas como módulos ES
import { parseGIF, decompressFrames } from 'gifuct-js';
import GIF from 'gif.js';

// DOM element references
const imageInputElement = document.getElementById('image-input');
const uploadContainer = document.getElementById('upload-container');
const imagePreview = document.getElementById('image-preview');
const imagePreviewBox = document.querySelector('.image-preview-box');
const contentArea = document.getElementById('content-area');

const outputCanvas = document.getElementById('output-canvas');
const controlsContainer = document.getElementById('controls');
const resolutionSlider = document.getElementById('resolution-slider');
const resolutionInput = document.getElementById('resolution-input');
const resolutionError = document.getElementById('resolution-error');
const bgColorPicker = document.getElementById('bg-color-picker');
const fgColorPicker = document.getElementById('fg-color-picker');
const charInputElement = document.getElementById('char-input');

const downloadBtn = document.getElementById('download-btn');
const downloadBtnText = downloadBtn.querySelector('span');
const invertBtn = document.getElementById('invert-btn');
const invertCharsBtn = document.getElementById('invert-chars-btn');

const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');

const presetSelect = document.getElementById('preset-select');
const downloadWidthInput = document.getElementById('download-width-input');
const downloadHeightInput = document.getElementById('download-height-input');
const aspectRatioToggle = document.getElementById('aspect-ratio-toggle');
const downloadSizeSlider = document.getElementById('download-size-slider');


// --- State Variables ---
const ALPHA_THRESHOLD = 50;
let USER_ASCII_CHARS = ['.', '<', '>', '/', '1', '0']; 
let SORTED_ASCII_CHARS = [];

let currentImage = null;
let isGif = false;
let currentGif = null;
let parsedFrames = [];
let asciiFrameData = [];
let animationTimeoutId = null;
let currentFrameIndex = 0;
let currentAsciiData = null; // Store data for single image downloads

let originalAspectRatio = 1;
let isAspectRatioLocked = true;

let debounceTimer;
let charDebounceTimer;

async function analyzeAndSortChars(chars) {
    const uniqueChars = [...new Set(chars)];
    if (uniqueChars.length === 0) return [];

    const canvas = document.createElement('canvas');
    // Adicionando a otimização sugerida pelo console
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return uniqueChars;

    const charSize = 24;
    canvas.width = charSize;
    canvas.height = charSize;
    ctx.font = `bold ${charSize}px "Roboto Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const charDensities = [];

    for (const char of uniqueChars) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, charSize, charSize);
        ctx.fillStyle = '#fff';
        ctx.fillText(char, charSize / 2, charSize / 2);

        const imageData = ctx.getImageData(0, 0, charSize, charSize).data;
        let density = 0;
        for (let i = 0; i < imageData.length; i += 4) {
            if (imageData[i] > 0) density++;
        }
        charDensities.push({ char, density });
    }

    charDensities.sort((a, b) => a.density - b.density);
    return charDensities.map(item => item.char);
}

function showProgress(show) {
    progressContainer.style.display = show ? 'flex' : 'none';
    if (show) progressBar.style.width = '0%';
}

function updateProgress(percentage) {
    progressBar.style.width = `${percentage}%`;
}

function generateAsciiFrameData(imageDataSource) {
    if (SORTED_ASCII_CHARS.length === 0) return null;

    const resolution = parseInt(resolutionSlider.value, 10);
    const sourceWidth = imageDataSource.width;
    const sourceHeight = imageDataSource.height;

    const aspectRatio = sourceWidth / sourceHeight;
    const numCols = resolution;
    const numRows = Math.round((numCols / aspectRatio) * 0.55);

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = numCols;
    offscreenCanvas.height = numRows;
    const offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
    if (!offscreenCtx) return null;

    offscreenCtx.drawImage(imageDataSource, 0, 0, numCols, numRows);
    const currentImageData = offscreenCtx.getImageData(0, 0, numCols, numRows).data;

    const asciiData = [];

    for (let y = 0; y < numRows; y++) {
        for (let x = 0; x < numCols; x++) {
            const i = (y * numCols + x) * 4;
            const r = currentImageData[i];
            const g = currentImageData[i + 1];
            const b = currentImageData[i + 2];
            const a = currentImageData[i + 3];

            let char = '';

            if (a > ALPHA_THRESHOLD) {
                const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                const charIndex = Math.min(SORTED_ASCII_CHARS.length - 1, Math.floor(brightness * SORTED_ASCII_CHARS.length));
                const calculatedChar = SORTED_ASCII_CHARS[charIndex];
                if (calculatedChar) char = calculatedChar;
            }
            
            if (char) {
                asciiData.push({ char, x, y });
            }
        }
    }
    return { asciiData, numCols, numRows, aspectRatio };
}

function drawAsciiToCanvas(targetCanvas, frameData, config) {
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;
    
    if (!frameData || !frameData.asciiData || !frameData.aspectRatio) {
        ctx.fillStyle = config.bgColor;
        ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
        return;
    }

    const { asciiData, numCols, numRows, aspectRatio } = frameData;
    const { bgColor, fgColor } = config;

    const canvasW = targetCanvas.width;
    const canvasH = targetCanvas.height;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasW, canvasH);
    
    let targetW, targetH;
    if ((canvasW / canvasH) > aspectRatio) {
        targetH = canvasH;
        targetW = canvasH * aspectRatio;
    } else {
        targetW = canvasW;
        targetH = canvasW / aspectRatio;
    }

    const offsetX = (canvasW - targetW) / 2;
    const offsetY = (canvasH - targetH) / 2;
    
    const cellWidth = targetW / numCols;
    const cellHeight = targetH / numRows;
    
    ctx.font = `bold ${cellHeight}px "Roboto Mono", monospace`;
    ctx.fillStyle = fgColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const item of asciiData) {
        const drawX = offsetX + item.x * cellWidth + cellWidth / 2;
        const drawY = offsetY + item.y * cellHeight + cellHeight / 2;
        ctx.fillText(item.char, drawX, drawY);
    }
}

function drawAsciiFrame(frameData) {
    // Adicionando a otimização sugerida pelo console
    const ctx = outputCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const bgColor = bgColorPicker.value;

    if (!frameData || !frameData.asciiData || !frameData.aspectRatio) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
        return;
    }

    const { asciiData, numCols, numRows, aspectRatio } = frameData;
    const fgColor = fgColorPicker.value;
    
    const previewContainerWidth = outputCanvas.parentElement?.clientWidth || 800;
    outputCanvas.width = previewContainerWidth;
    outputCanvas.height = outputCanvas.width / aspectRatio;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
    
    const cellWidth = outputCanvas.width / numCols;
    const cellHeight = outputCanvas.height / numRows;
    ctx.font = `bold ${cellHeight}px "Roboto Mono", monospace`;
    ctx.fillStyle = fgColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const item of asciiData) {
        ctx.fillText(item.char, item.x * cellWidth + cellWidth / 2, item.y * cellHeight + cellHeight / 2);
    }
}

function stopAnimation() {
    if (animationTimeoutId) {
        clearTimeout(animationTimeoutId);
        animationTimeoutId = null;
    }
}

function playAnimation() {
    stopAnimation();
    if (!isGif || asciiFrameData.length === 0) return;

    const frameData = asciiFrameData[currentFrameIndex];
    
    if (!frameData) {
        currentFrameIndex = (currentFrameIndex + 1) % asciiFrameData.length;
        animationTimeoutId = window.setTimeout(playAnimation, 100);
        return;
    }

    drawAsciiFrame(frameData.data);
    
    const delay = frameData.delay;
    currentFrameIndex = (currentFrameIndex + 1) % asciiFrameData.length;

    animationTimeoutId = window.setTimeout(playAnimation, delay);
}

async function processAllFrames() {
    stopAnimation();
    showProgress(true);
    controlsContainer.setAttribute('disabled', 'true');
    await new Promise(resolve => setTimeout(resolve, 20));

    asciiFrameData = [];
    const masterCanvas = document.createElement('canvas');
    // Adicionando a otimização sugerida pelo console
    const masterCtx = masterCanvas.getContext('2d', { willReadFrequently: true });

    if (!masterCtx || !currentGif) {
        showProgress(false);
        controlsContainer.removeAttribute('disabled');
        console.error("GIF processing error: No GIF data available.");
        return;
    }

    const fullWidth = currentGif.lsd.width;
    const fullHeight = currentGif.lsd.height;
    masterCanvas.width = fullWidth;
    masterCanvas.height = fullHeight;

    for (let i = 0; i < parsedFrames.length; i++) {
        const frame = parsedFrames[i];
        const { width, height, top, left } = frame.dims;

        const frameImageData = masterCtx.createImageData(width, height);
        frameImageData.data.set(frame.patch);
        
        masterCtx.putImageData(frameImageData, left, top);

        const frameGenerationResult = generateAsciiFrameData(masterCanvas);
        
        if (frameGenerationResult) {
            asciiFrameData.push({ data: frameGenerationResult, delay: frame.delay });
        } else {
             asciiFrameData.push({ data: null, delay: frame.delay });
        }
        
        if (frame.disposalType === 2) {
            masterCtx.clearRect(left, top, width, height);
        }

        updateProgress(((i + 1) / parsedFrames.length) * 100);
        if (i % 5 === 0) await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    showProgress(false);
    controlsContainer.removeAttribute('disabled');
    currentFrameIndex = 0;
    playAnimation();
}


async function generateAsciiArt() {
    if (!currentImage) return;

    const resolution = parseInt(resolutionInput.value, 10);
    const minRes = parseInt(resolutionSlider.min, 10);
    const maxRes = parseInt(resolutionSlider.max, 10);

    if (isNaN(resolution) || resolution < minRes || resolution > maxRes) {
        resolutionError.textContent = `Resolução deve ser entre ${minRes} e ${maxRes}.`;
        resolutionError.style.display = 'block';
        downloadBtn.disabled = true;
        return;
    }

    resolutionError.style.display = 'none';
    downloadBtn.disabled = false;

    if (isGif) {
        await processAllFrames();
    } else {
        showProgress(true);
        controlsContainer.setAttribute('disabled', 'true');
        await new Promise(resolve => setTimeout(resolve, 20));

        const data = generateAsciiFrameData(currentImage);
        currentAsciiData = data;
        
        updateProgress(50);
        await new Promise(resolve => setTimeout(resolve, 20));
        
        drawAsciiFrame(data);
        updateProgress(100);
        
        showProgress(false);
        controlsContainer.removeAttribute('disabled');
    }
}


function handleControlChange() {
    clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(generateAsciiArt, 150);
}

function syncResolution(source) {
    if (source === 'slider') {
        resolutionInput.value = resolutionSlider.value;
    } else {
        const value = parseInt(resolutionInput.value, 10);
        if (!isNaN(value) && value >= parseInt(resolutionSlider.min) && value <= parseInt(resolutionSlider.max)) {
            resolutionSlider.value = value.toString();
        }
    }
}

function handleImageUpload(event) {
    stopAnimation();
    const target = event.target;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    isGif = file.type === 'image/gif';

    reader.onload = (e) => {
        uploadContainer.style.display = 'none';
        contentArea.style.display = 'grid';
        
        const img = new Image();
        img.onload = () => {
            currentImage = img;
            originalAspectRatio = img.naturalWidth / img.naturalHeight;
            
            downloadWidthInput.value = img.naturalWidth.toString();
            downloadHeightInput.value = img.naturalHeight.toString();
            const largerDimension = Math.max(img.naturalWidth, img.naturalHeight);
            downloadSizeSlider.value = Math.min(largerDimension, parseInt(downloadSizeSlider.max)).toString();
            presetSelect.value = 'original';
            isAspectRatioLocked = true;
            aspectRatioToggle.classList.add('locked');
            aspectRatioToggle.innerHTML = '🔗'; 

            imagePreview.src = img.src;
            if (isGif) {
                const bufferReader = new FileReader();
                bufferReader.onload = (bufEvent) => {
                    const buffer = bufEvent.target?.result;
                    currentGif = parseGIF(buffer);
                    parsedFrames = decompressFrames(currentGif, true);
                    generateAsciiArt();
                };
                bufferReader.readAsArrayBuffer(file);
            } else {
                currentGif = null;
                parsedFrames = [];
                generateAsciiArt();
            }
        };
        img.src = e.target?.result;
    };
    reader.readAsDataURL(file);
}

function downloadImage() {
    if (!currentAsciiData) return;

    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = parseInt(downloadWidthInput.value, 10) || 800;
    downloadCanvas.height = parseInt(downloadHeightInput.value, 10) || 600;

    drawAsciiToCanvas(downloadCanvas, currentAsciiData, {
        bgColor: bgColorPicker.value,
        fgColor: fgColorPicker.value,
    });
    
    const dataUrl = downloadCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'ascii-art.png';
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function downloadGif() {
    downloadBtn.disabled = true;
    downloadBtnText.textContent = 'Gerando GIF...';

    const gif = new GIF({
        workers: 2,
        quality: 10,
        workerScript: './gif.worker.js',
        background: bgColorPicker.value,
    });
    
    const downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = parseInt(downloadWidthInput.value, 10) || 800;
    downloadCanvas.height = parseInt(downloadHeightInput.value, 10) || 600;
    // Adicionando a otimização sugerida pelo console
    const ctx = downloadCanvas.getContext('2d', { willReadFrequently: true });

    for (const frame of asciiFrameData) {
        drawAsciiToCanvas(downloadCanvas, frame.data, {
            bgColor: bgColorPicker.value,
            fgColor: fgColorPicker.value,
        });

        // =================================================================
        // AQUI ESTÁ A CORREÇÃO CRÍTICA
        // O algoritmo de quantização de cores (NeuQuant) da biblioteca gif.js
        // pode travar indefinidamente se receber uma imagem com pouquíssimas
        // cores (ex: apenas 2). Adicionamos um único pixel de uma cor ligeiramente
        // diferente para garantir que o algoritmo tenha dados suficientes para processar.
        // =================================================================
        if (ctx) {
            const oldColor = ctx.fillStyle;
            ctx.fillStyle = '#010101'; // Uma cor sutilmente diferente do preto
            ctx.fillRect(0, 0, 1, 1);   // Pinta o pixel no canto superior esquerdo
            ctx.fillStyle = oldColor; // Restaura a cor original para não afetar nada
        }

        gif.addFrame(downloadCanvas, { copy: true, delay: frame.delay });
    }

    gif.on('finished', (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'ascii-art.gif';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        downloadBtn.disabled = false;
        downloadBtnText.textContent = 'Baixar Arte';
    });
    
    gif.on('abort', () => {
        console.error("A geração do GIF foi abortada.");
        alert("Ocorreu um erro inesperado ao gerar o GIF.");
        downloadBtn.disabled = false;
        downloadBtnText.textContent = 'Baixar Arte';
    });

    gif.render();
}

function invertColors() {
    const bg = bgColorPicker.value;
    const fg = fgColorPicker.value;
    bgColorPicker.value = fg;
    fgColorPicker.value = bg;
    generateAsciiArt();
}

function invertCharacters() {
    SORTED_ASCII_CHARS.reverse();
    generateAsciiArt();
}

function handleCharInputChange() {
    clearTimeout(charDebounceTimer);
    charDebounceTimer = window.setTimeout(async () => {
        const newChars = charInputElement.value;
        if (newChars.length < 3) return;
        
        USER_ASCII_CHARS = [...new Set(newChars.split(''))];
        charInputElement.value = USER_ASCII_CHARS.join('');

        controlsContainer.setAttribute('disabled', 'true');
        SORTED_ASCII_CHARS = await analyzeAndSortChars(USER_ASCII_CHARS);
        controlsContainer.removeAttribute('disabled');
        generateAsciiArt();
    }, 400);
}

function updateDownloadSlider() {
    const widthVal = parseInt(downloadWidthInput.value, 10);
    const heightVal = parseInt(downloadHeightInput.value, 10);
    if (isNaN(widthVal) || isNaN(heightVal)) return;

    const largerDimension = Math.max(widthVal, heightVal);
    downloadSizeSlider.value = Math.min(largerDimension, parseInt(downloadSizeSlider.max)).toString();
}

function handleDimensionChange(source) {
    if (!isAspectRatioLocked) {
        presetSelect.value = 'custom';
        updateDownloadSlider();
        return;
    }
    const widthVal = parseInt(downloadWidthInput.value, 10);
    const heightVal = parseInt(downloadHeightInput.value, 10);

    if (source === 'width' && widthVal > 0) {
        downloadHeightInput.value = Math.round(widthVal / originalAspectRatio).toString();
    } else if (source === 'height' && heightVal > 0) {
        downloadWidthInput.value = Math.round(heightVal * originalAspectRatio).toString();
    }
    presetSelect.value = 'custom';
    updateDownloadSlider();
}

function handlePresetChange() {
    const value = presetSelect.value;
    if (value === 'custom') {
        isAspectRatioLocked = false;
        aspectRatioToggle.classList.toggle('locked', isAspectRatioLocked);
        aspectRatioToggle.innerHTML = '🔓';
        return;
    };

    if (value === 'original' && currentImage) {
        downloadWidthInput.value = currentImage.naturalWidth.toString();
        downloadHeightInput.value = currentImage.naturalHeight.toString();
        if (!isAspectRatioLocked) toggleAspectRatioLock();
    } else {
        const [width, height] = value.split('x');
        downloadWidthInput.value = width;
        downloadHeightInput.value = height;
    }
    updateDownloadSlider();
}

function handleDownloadSizeChange() {
    const size = parseInt(downloadSizeSlider.value, 10);
    let newWidth, newHeight;

    if (originalAspectRatio >= 1) { // Landscape or square
        newWidth = size;
        newHeight = Math.round(size / originalAspectRatio);
    } else { // Portrait
        newHeight = size;
        newWidth = Math.round(size * originalAspectRatio);
    }
    downloadWidthInput.value = newWidth.toString();
    downloadHeightInput.value = newHeight.toString();

    if (!isAspectRatioLocked) {
       toggleAspectRatioLock();
    }
    presetSelect.value = 'custom';
}

function toggleAspectRatioLock() {
    isAspectRatioLocked = !isAspectRatioLocked;
    aspectRatioToggle.classList.toggle('locked', isAspectRatioLocked);
    aspectRatioToggle.innerHTML = isAspectRatioLocked ? '🔗' : '🔓';
    if (isAspectRatioLocked && currentImage) {
        handleDimensionChange('width');
    }
}

// Bloco de inicialização auto-executável e assíncrono
(async () => {
    SORTED_ASCII_CHARS = await analyzeAndSortChars(USER_ASCII_CHARS);
    charInputElement.value = USER_ASCII_CHARS.join('');

    imageInputElement.addEventListener('change', handleImageUpload);
    imagePreviewBox.addEventListener('click', () => imageInputElement.click());

    resolutionSlider.addEventListener('input', () => {
        syncResolution('slider');
        handleControlChange();
    });
    resolutionInput.addEventListener('input', () => {
        syncResolution('input');
        handleControlChange();
    });

    bgColorPicker.addEventListener('input', handleControlChange);
    fgColorPicker.addEventListener('input', handleControlChange);
    
    charInputElement.addEventListener('input', handleCharInputChange);

    downloadBtn.addEventListener('click', () => isGif ? downloadGif() : downloadImage());
    invertBtn.addEventListener('click', invertColors);
    invertCharsBtn.addEventListener('click', invertCharacters);

    downloadWidthInput.addEventListener('input', () => handleDimensionChange('width'));
    downloadHeightInput.addEventListener('input', () => handleDimensionChange('height'));
    presetSelect.addEventListener('change', handlePresetChange);
    aspectRatioToggle.addEventListener('click', toggleAspectRatioLock);
    downloadSizeSlider.addEventListener('input', handleDownloadSizeChange);
})();