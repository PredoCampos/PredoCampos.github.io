import { CONFIG } from './config.js';

export class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.minZoom = 0.15; 
    this.maxZoom = 3.0;

    const marginX = (CONFIG.WORLD.maxX - CONFIG.WORLD.minX) * 0.1;
    const marginY = (CONFIG.WORLD.maxY - CONFIG.WORLD.minY) * 0.1;

    this.bounds = {
      minX: CONFIG.WORLD.minX - marginX,
      maxX: CONFIG.WORLD.maxX + marginX,
      minY: CONFIG.WORLD.minY - marginY,
      maxY: CONFIG.WORLD.maxY + marginY
    };
  }

  apply(ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }

  move(dx, dy) {
    this.x -= dx / this.zoom;
    this.y -= dy / this.zoom;
    this.clamp();
  }

  scaleAt(screenX, screenY, zoomFactor) {
    const worldX = this.x + (screenX - this.canvas.width / 2) / this.zoom;
    const worldY = this.y + (screenY - this.canvas.height / 2) / this.zoom;

    this.zoom *= zoomFactor;
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom));

    this.x = worldX - (screenX - this.canvas.width / 2) / this.zoom;
    this.y = worldY - (screenY - this.canvas.height / 2) / this.zoom;
    this.clamp();
  }

  clamp() {
    this.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.x));
    this.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.y));
  }

  getVisibleBounds() {
    const w = this.canvas.width / this.zoom;
    const h = this.canvas.height / this.zoom;
    return {
      minX: this.x - w / 2,
      maxX: this.x + w / 2,
      minY: this.y - h / 2,
      maxY: this.y + h / 2
    };
  }

  // NOVO: Converte pixel da tela para coordenada do mundo
  screenToWorld(screenX, screenY) {
    // Compensa o devicePixelRatio que aplicamos no app.js
    const dpr = window.devicePixelRatio || 1;
    const logicalX = screenX * dpr;
    const logicalY = screenY * dpr;

    return {
      x: this.x + (logicalX - this.canvas.width / 2) / this.zoom,
      y: this.y + (logicalY - this.canvas.height / 2) / this.zoom
    };
  }
}