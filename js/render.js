import { CONFIG } from './config.js';

function drawGrid(ctx, bounds, step = 100) {
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  
  for (let x = Math.floor(bounds.minX / step) * step; x <= bounds.maxX; x += step) {
    ctx.moveTo(x, bounds.minY);
    ctx.lineTo(x, bounds.maxY);
  }
  for (let y = Math.floor(bounds.minY / step) * step; y <= bounds.maxY; y += step) {
    ctx.moveTo(bounds.minX, y);
    ctx.lineTo(bounds.maxX, y);
  }
  ctx.stroke();
}

function rectsIntersect(a, b) {
  return !(a.maxX < b.minX || a.minX > b.maxX || a.maxY < b.minY || a.minY > b.maxY);
}

// Adicionamos o 'placement' na assinatura
export function renderWorld(ctx, canvas, camera, stickers, imageLoader, placement) {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  ctx.save();
  camera.apply(ctx);

  const viewBounds = camera.getVisibleBounds();

  // 1. Fundo e Grid
  drawGrid(ctx, viewBounds);

  // 2. Fronteiras do Território
  ctx.strokeStyle = '#e0e0e0';
  ctx.lineWidth = 2;
  ctx.strokeRect(
    CONFIG.WORLD.minX, 
    CONFIG.WORLD.minY, 
    CONFIG.WORLD.maxX - CONFIG.WORLD.minX, 
    CONFIG.WORLD.maxY - CONFIG.WORLD.minY
  );

  // 3. Obras publicadas
  for (const s of stickers) {
    const stickerBounds = { 
      minX: s.x, maxX: s.x + s.width, 
      minY: s.y, maxY: s.y + s.height 
    };

    if (!rectsIntersect(stickerBounds, viewBounds)) continue; 

    const asset = imageLoader.get(s);

    if (asset.status === 'loaded') {
      ctx.drawImage(asset.img, s.x, s.y, s.width, s.height);
    } 
    else if (asset.status === 'loading') {
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(s.x, s.y, s.width, s.height);
      ctx.strokeStyle = '#dddddd';
      ctx.lineWidth = 1;
      ctx.strokeRect(s.x, s.y, s.width, s.height);
    } 
    else if (asset.status === 'error') {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
      ctx.fillRect(s.x, s.y, s.width, s.height);
    }
  }

  // 4. Obra em modo de posicionamento (Fantasma)
  if (placement) {
    // Torna a imagem semitransparente para ver o que tem embaixo
    ctx.globalAlpha = 0.7;
    ctx.drawImage(placement.img, placement.x, placement.y, placement.width, placement.height);
    
    // A espessura da linha se adapta ao zoom da câmera para manter consistência visual
    ctx.lineWidth = 4 / camera.zoom; 

    if (placement.isConflict) {
      // Conflito (Cobertura > 0.5) -> Vermelho
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      ctx.fillRect(placement.x, placement.y, placement.width, placement.height);
      ctx.strokeStyle = '#ff0000';
    } else {
      // Posição válida -> Verde (ou usa a cor original se preferir)
      ctx.strokeStyle = '#00ff00';
    }
    
    ctx.strokeRect(placement.x, placement.y, placement.width, placement.height);
    ctx.globalAlpha = 1.0;
  }

  ctx.restore();
}