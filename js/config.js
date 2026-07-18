/**
 * 应用配置和状态
 * 视觉风格：真实展厅 + 数字叠加
 */

// 视觉设计令牌
export const THEME = {
  // 基调 — 真实展厅色彩
  bgDeep: 0x1a1a1e,        // 暖灰深色 — 远景/雾
  surfaceDark: 0xd8d4cc,   // 暖白墙面
  surfaceMid: 0xf0ede8,    // 白色天花板
  // 强调 — 数字化点缀（仅用于展板/粒子/HUD）
  neon: 0x00d2ff,          // 青色霓虹
  ice: 0x0088ff,           // 冰蓝
  // 点缀
  safe: 0x00ff88,
  threat: 0xff00aa,
  // 材质参数 — 真实质感
  floor: { color: 0x2a2820, roughness: 0.15, metalness: 0.05, envMapIntensity: 0.6 },
  wall: { color: 0xd8d4cc, roughness: 0.85, metalness: 0.0, envMapIntensity: 0.2 },
  panel: { color: 0x0a1628, emissive: 0x00d2ff, emissiveIntensity: 0.6 },
  // 灯光 — 白色日光灯（真实展厅照明）
  ambient: { color: 0xf0ece4, intensity: 0.7 },
  directional: { color: 0xffffff, intensity: 1.0 },
  hemisphere: { sky: 0xf5f2ee, ground: 0x2a2820, intensity: 0.5 },
  accent: { color: 0x00d2ff, intensity: 1.5 },
  // 雾
  fog: { color: 0x1a1a1e, density: 0.002 },
  // 后处理 — 轻微 Bloom 只让数字元素发光
  bloom: { strength: 0.4, radius: 0.3, threshold: 0.75 },
};

// 全局配置
export const CONFIG = {
  scene: {
    backgroundColor: THEME.bgDeep,
    fog: {
      enabled: true,
      type: 'exp2',
      color: THEME.fog.color,
      density: THEME.fog.density,
      near: 35, far: 80,
    },
  },

  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: { x: 0, y: 1.6, z: 12 },
  },

  lighting: {
    ambient: THEME.ambient,
    directional: { ...THEME.directional, position: { x: 5, y: 10, z: 5 } },
    hemisphere: THEME.hemisphere,
    accent: THEME.accent,
  },

  player: {
    moveSpeed: 5,
    lookSpeed: 0.5,
    height: 1.6,
    collisionDistance: 0.5,
  },

  exhibition: {
    width: 40,
    height: 8,
    depth: 40,
    wallThickness: 0.3,
  },

  autoTour: {
    moveSpeed: 0.1,
    pauseDuration: 5000,
    loopMode: 'loop',
  },
};

export const AppState = {
  isLoading: true,
  isPlaying: false,
  currentExhibition: null,
  selectedPanel: null,
  isModalOpen: false,
  isTeleportMenuOpen: false,
  isAutoTourActive: false,
};
