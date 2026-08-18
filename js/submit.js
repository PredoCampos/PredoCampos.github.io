import { CONFIG } from './config.js';

export class SubmitFlow {
  // Agora recebemos callbacks no construtor para conversar com o app.js
  constructor(callbacks = {}) {
    this.onStartPlacement = callbacks.onStartPlacement;
    
    this.sidebar = document.getElementById('sidebar');
    this.btnAdd = document.getElementById('btn-add');
    this.btnClose = document.getElementById('btn-close-sidebar');
    this.btnCancel = document.getElementById('btn-cancel');
    this.form = document.getElementById('submit-form');
    this.fileInput = document.getElementById('sticker-file');
    this.btnSubmit = document.getElementById('btn-submit');
    
    this.previewContainer = document.getElementById('image-preview-container');
    this.previewCanvas = document.getElementById('preview-canvas');
    this.previewCtx = this.previewCanvas.getContext('2d');

    this.currentImage = null; // Guarda a imagem carregada na memória

    this.bindEvents();
  }

  bindEvents() {
    this.btnAdd.addEventListener('click', () => this.openPanel());
    this.btnClose.addEventListener('click', () => this.closePanel());
    this.btnCancel.addEventListener('click', () => this.closePanel());
    
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.currentImage && this.onStartPlacement) {
        this.onStartPlacement(this.currentImage);
      }
    });
  }

  openPanel() {
    this.sidebar.classList.remove('hidden');
    this.btnAdd.classList.add('hidden');
  }

  closePanel() {
    this.sidebar.classList.add('hidden');
    this.btnAdd.classList.remove('hidden');
    this.form.reset();
    this.previewContainer.classList.add('hidden');
    this.btnSubmit.disabled = true;
    this.currentImage = null;
  }

  hideForPlacement() {
    // Esconde o painel mas não reseta, pois o usuário pode cancelar o posicionamento
    this.sidebar.classList.add('hidden');
  }

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > CONFIG.UPLOAD.maxBytes) {
      alert('Arquivo muito grande. O limite é 2 MB.');
      this.fileInput.value = '';
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      
      if (img.width * img.height > CONFIG.UPLOAD.maxPixels || 
          img.width > CONFIG.UPLOAD.maxDim || 
          img.height > CONFIG.UPLOAD.maxDim) {
        alert('Dimensões da imagem muito grandes.');
        this.fileInput.value = '';
        return;
      }

      this.currentImage = img;
      this.showPreview(img);
      this.btnSubmit.disabled = false;
    };

    img.src = url;
  }

  showPreview(img) {
    const scale = Math.min(200 / img.width, 200 / img.height, 1);
    this.previewCanvas.width = img.width * scale;
    this.previewCanvas.height = img.height * scale;
    this.previewCtx.drawImage(img, 0, 0, this.previewCanvas.width, this.previewCanvas.height);
    this.previewContainer.classList.remove('hidden');
  }
}