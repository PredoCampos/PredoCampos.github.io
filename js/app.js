import { CONFIG } from './config.js';
import { Camera } from './camera.js';
import { renderWorld } from './render.js';
import { ImageLoader } from './image-loader.js';
import { SubmitFlow } from './submit.js';
import { conflitos } from './geometry.js'; // Importação das regras do A.5

const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');
const camera = new Camera(canvas);
const imageLoader = new ImageLoader();

// Estado de Posicionamento (Fase 2)
let placement = null; // Estrutura: { img, width, height, x, y, isConflict }

const submitFlow = new SubmitFlow({
  onStartPlacement: (img) => {
    // Calcula as dimensões finais respeitando os limites da plataforma (A.12)
    let w = img.width;
    let h = img.height;
    if (Math.max(w, h) > CONFIG.STICKER.maxSide) {
      const scale = CONFIG.STICKER.maxSide / Math.max(w, h);
      w *= scale;
      h *= scale;
    }

    placement = { img, width: w, height: h, x: 0, y: 0, isConflict: false };
    submitFlow.hideForPlacement();
    canvas.style.cursor = 'crosshair';
  }
});

const mockStickers = [
  { id: "a1", seq: "2026-08-18T10:00", x: -200, y: -150, width: 300, height: 200, image: "https://picsum.photos/300/200?random=1", color: "#ff595e", artist: { name: "Artista 1" } },
  { id: "a2", seq: "2026-08-18T11:00", x: -50, y: -50, width: 250, height: 250, image: "https://picsum.photos/250/250?random=2", color: "#ffca3a", artist: { name: "Artista 2" } },
  { id: "a3", seq: "2026-08-18T12:00", x: 150, y: 100, width: 200, height: 300, image: "https://picsum.photos/200/300?random=3", color: "#8ac926", artist: { name: "Artista 3" } }
];

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
}

let isDragging = false;
let hasMoved = false; 
let lastX = 0;
let lastY = 0;
let mouseX = 0; // Armazena a última posição para atualizar o placement no zoom
let mouseY = 0;

function updatePlacementPosition() {
  if (!placement) return;
  const worldPos = camera.screenToWorld(mouseX, mouseY);
  // Centraliza a obra no cursor
  placement.x = worldPos.x - placement.width / 2;
  placement.y = worldPos.y - placement.height / 2;
  
  // Checagem de colisão em tempo real contra todas as obras
  placement.isConflict = conflitos(placement, mockStickers, CONFIG.OVERLAP.maxCoverage).length > 0;
}

canvas.addEventListener('pointerdown', (e) => {
  isDragging = true;
  hasMoved = false;
  lastX = e.clientX;
  lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
  if (!placement) canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('pointermove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  
  if (isDragging) {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved = true;
    camera.move(dx, dy);
    lastX = e.clientX;
    lastY = e.clientY;
  }

  // Atualiza a posição da obra fantasma se estiver no modo placement
  if (placement) updatePlacementPosition();
});

canvas.addEventListener('pointerup', (e) => {
  isDragging = false;
  canvas.releasePointerCapture(e.pointerId);
  canvas.style.cursor = placement ? 'crosshair' : 'grab';

  if (!hasMoved) {
    if (placement) {
      if (placement.isConflict) {
        // Alerta visual que a área está ocupada (a reescrita no render.js fará o feedback visual)
        console.log('Conflito: Área ocupada.');
      } else {
        alert(`Sucesso! Obra posicionada em X: ${Math.round(placement.x)}, Y: ${Math.round(placement.y)}.\nPronto para enviar ao Worker.`);
        placement = null;
        submitFlow.closePanel(); // Finaliza e limpa a UI
        canvas.style.cursor = 'grab';
      }
    } else {
      handleCanvasClick(e.clientX, e.clientY);
    }
  }
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
  camera.scaleAt(e.clientX, e.clientY, zoomFactor);
  if (placement) updatePlacementPosition(); // Atualiza a posição pois o mundo mudou de escala
}, { passive: false });

// Tecla ESC para cancelar o posicionamento
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && placement) {
    placement = null;
    submitFlow.openPanel(); // Devolve o usuário para o formulário
    canvas.style.cursor = 'grab';
  }
});

function handleCanvasClick(screenX, screenY) {
  const worldPos = camera.screenToWorld(screenX, screenY);
  for (let i = mockStickers.length - 1; i >= 0; i--) {
    const s = mockStickers[i];
    if (worldPos.x >= s.x && worldPos.x <= s.x + s.width &&
        worldPos.y >= s.y && worldPos.y <= s.y + s.height) {
      console.log('Obra clicada:', s);
      return; 
    }
  }
}

function tick() {
  renderWorld(ctx, canvas, camera, mockStickers, imageLoader, placement);
  requestAnimationFrame(tick);
}

window.addEventListener('resize', resize);
canvas.style.cursor = 'grab';
resize();
tick();