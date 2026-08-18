export const CONFIG = {
  WORLD:   { minX: -3000, maxX: 3000, minY: -3000, maxY: 3000 },
  STICKER: { maxSide: 999999999, minSide: 48 },
  UPLOAD:  { maxBytes: 30 * 1024 * 1024, maxDim: 999999999999, maxPixels: 99999999 },
  OVERLAP: { maxCoverage: 0.50 },
  RATE:    { perIpPerDay: 3, maxPendingPerIp: 2 },
  RESERVA: { ttlDias: 14 },
  TEXTO:   { name: 60, handle: 40, url: 200, city: 60, description: 280 },
};