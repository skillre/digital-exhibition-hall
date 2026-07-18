/**
 * 应用配置和状态
 * 视觉风格：真实展厅 + 数字叠加
 */

// 视觉设计令牌
export const THEME = {
  // 基调
  bgDeep: 0x080e1a,
  surfaceDark: 0xffffff,   // 纯白墙面
  surfaceMid: 0xffffff,    // 纯白天花板
  neon: 0x00d2ff,
  ice: 0x0088ff,
  safe: 0x00ff88,
  threat: 0xff00aa,
  floor: { color: 0x0a1a38, roughness: 0.15, metalness: 0.15, envMapIntensity: 1.0 },
  wall: { color: 0xffffff, roughness: 0.85, metalness: 0.0, envMapIntensity: 0.15 },
  panel: { color: 0x0a1628, emissive: 0x00d2ff, emissiveIntensity: 0.6 },
  // 灯光 — 高强度照明
  ambient: { color: 0xf0f4f8, intensity: 1.5 },
  directional: { color: 0xffffff, intensity: 2.0 },
  hemisphere: { sky: 0xf0f6ff, ground: 0x0a1a38, intensity: 0.8 },
  accent: { color: 0x00d2ff, intensity: 2.5 },
  fog: { color: 0x080e1a, density: 0.002 },
  bloom: { strength: 0.4, radius: 0.3, threshold: 0.7 },
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
