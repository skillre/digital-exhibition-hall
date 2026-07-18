import * as THREE from 'three';

const COL = {
  bg: 'rgba(12, 20, 36, 0.9)',
  border: 'rgba(10, 132, 255, 0.6)',
  text: '#e8edf5',
  glow: '#0a84ff',
  dim: '#7a8ba5',
};
const FONT_MONO = 'SF Mono, JetBrains Mono, Menlo, Consolas, monospace';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawIcon(ctx, type, cx, cy, s) {
  ctx.save();
  ctx.strokeStyle = COL.glow; ctx.fillStyle = COL.glow;
  ctx.lineWidth = 4; ctx.shadowColor = COL.glow; ctx.shadowBlur = 12;
  switch (type) {
    case 'shield':
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.6); ctx.lineTo(cx + s * 0.5, cy - s * 0.3);
      ctx.lineTo(cx + s * 0.5, cy + s * 0.2);
      ctx.quadraticCurveTo(cx + s * 0.5, cy + s * 0.6, cx, cy + s * 0.7);
      ctx.quadraticCurveTo(cx - s * 0.5, cy + s * 0.6, cx - s * 0.5, cy + s * 0.2);
      ctx.lineTo(cx - s * 0.5, cy - s * 0.3); ctx.closePath(); ctx.stroke();
      break;
    case 'document':
      ctx.strokeRect(cx - s * 0.35, cy - s * 0.5, s * 0.7, s);
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(cx - s * 0.2, cy + i * s * 0.18); ctx.lineTo(cx + s * 0.2, cy + i * s * 0.18); ctx.stroke(); }
      break;
    case 'image':
      ctx.strokeRect(cx - s * 0.4, cy - s * 0.4, s * 0.8, s * 0.8);
      ctx.beginPath(); ctx.arc(cx - s * 0.15, cy - s * 0.1, s * 0.1, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - s * 0.4, cy + s * 0.3); ctx.lineTo(cx, cy - s * 0.1); ctx.lineTo(cx + s * 0.4, cy + s * 0.4); ctx.stroke();
      break;
    case 'video':
      ctx.strokeRect(cx - s * 0.45, cy - s * 0.3, s * 0.9, s * 0.6);
      ctx.beginPath(); ctx.moveTo(cx + s * 0.45, cy); ctx.lineTo(cx + s * 0.7, cy - s * 0.2); ctx.lineTo(cx + s * 0.7, cy + s * 0.2); ctx.closePath(); ctx.stroke();
      break;
    case 'chart':
      ctx.beginPath(); ctx.moveTo(cx - s * 0.4, cy + s * 0.4); ctx.lineTo(cx + s * 0.4, cy + s * 0.4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - s * 0.4, cy + s * 0.4); ctx.lineTo(cx - s * 0.4, cy - s * 0.4); ctx.stroke();
      ctx.fillRect(cx - s * 0.25, cy, s * 0.1, s * 0.4);
      ctx.fillRect(cx - s * 0.05, cy - s * 0.1, s * 0.1, s * 0.5);
      ctx.fillRect(cx + s * 0.15, cy - s * 0.3, s * 0.1, s * 0.7);
      break;
    case 'model3d':
      ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.5); ctx.lineTo(cx + s * 0.45, cy - s * 0.2); ctx.lineTo(cx + s * 0.45, cy + s * 0.2); ctx.lineTo(cx, cy + s * 0.5); ctx.lineTo(cx - s * 0.45, cy + s * 0.2); ctx.lineTo(cx - s * 0.45, cy - s * 0.2); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.5); ctx.lineTo(cx, cy + s * 0.5); ctx.moveTo(cx - s * 0.45, cy - s * 0.2); ctx.lineTo(cx + s * 0.45, cy + s * 0.2); ctx.stroke();
      break;
    default: ctx.strokeRect(cx - s * 0.3, cy - s * 0.3, s * 0.6, s * 0.6);
  }
  ctx.restore();
}

export const ICON_MAP = {
  document: 'document', image: 'image', video: 'video',
  chart: 'chart', model3d: 'model3d', default: 'shield',
};

export class HUDLabel {
  static createLabel(text, options = {}) {
    const { size = 1, color = COL.text, sub = '', icon = null } = options;
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // 深色背景
    ctx.fillStyle = COL.bg; roundRect(ctx, 4, 4, canvas.width - 8, canvas.height - 8, 12); ctx.fill();

    // 蓝色发光边框
    ctx.strokeStyle = COL.border; ctx.lineWidth = 3;
    ctx.shadowColor = COL.glow; ctx.shadowBlur = 16;
    roundRect(ctx, 4, 4, canvas.width - 8, canvas.height - 8, 12); ctx.stroke();
    ctx.shadowBlur = 0;

    if (icon) { drawIcon(ctx, icon, 50, 64, 40); }

    // 浅色文字（暗背景上）
    ctx.fillStyle = color; ctx.font = 'bold 42px ' + FONT_MONO;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.shadowColor = COL.glow; ctx.shadowBlur = 4;
    ctx.fillText(text, icon ? 96 : 40, sub ? 50 : 64);
    ctx.shadowBlur = 0;

    if (sub) { ctx.fillStyle = COL.dim; ctx.font = '22px ' + FONT_MONO; ctx.fillText(sub, icon ? 96 : 40, 92); }

    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(size * 4, size, 1);
    return sprite;
  }

  static createIcon(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    drawIcon(ctx, type, 64, 64, 56);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1, 1, 1);
    return sprite;
  }
}
