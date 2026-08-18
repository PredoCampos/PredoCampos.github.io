export function bboxOf(s) {
  return [s.x, s.y, s.x + s.width, s.y + s.height];
}

export function coverage(novo, existente) {
  const [ax1, ay1, ax2, ay2] = bboxOf(novo);
  const [bx1, by1, bx2, by2] = bboxOf(existente);
  const w = Math.min(ax2, bx2) - Math.max(ax1, bx1);
  const h = Math.min(ay2, by2) - Math.max(ay1, by1);
  if (w <= 0 || h <= 0) return 0;
  return (w * h) / (existente.width * existente.height);
}

export function conflitos(novo, ocupados, max = 0.5) {
  return ocupados.filter(o => coverage(novo, o) > max);
}