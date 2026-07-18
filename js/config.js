/**
 * 应用配置和状态
 * 视觉风格：真实展厅 + 数字叠加
 */

// 视觉设计令牌
export const THEME = {
  // 基调
  bgDeep: 0x0a1420,
  surfaceDark: 0xffffff,   // 纯白（材质本身纯白，靠灯光调亮度）
  surfaceMid: 0xffffff,    // 纯白
  neon: 0x00d2ff,
  ice: 0x0088ff,
  safe: 0x00ff88,
  threat: 0xff00aa,
  floor: { color: 0x0c1a34, roughness: 0.2, metalness: 0.15, envMapIntensity: 0.6 },
  wall: { color: 0xffffff, roughness: 0.85, metalness: 0.0, envMapIntensity: 0.15 },
  panel: { color: 0x0a1628, emissive: 0x00d2ff, emissiveIntensity: 0.6 },
  // 灯光 — 柔和灯光控制白色亮度
  ambient: { color: 0xe0e8ee, intensity: 0.5 },
  directional: { color: 0xffffff, intensity: 0.7 },
  hemisphere: { sky: 0xe8eef2, ground: 0x0c1a34, intensity: 0.4 },
  accent: { color: 0x00d2ff, intensity: 1.5 },
  fog: { color: 0x0a1420, density: 0.002 },
  bloom: { strength: 0.3, radius: 0.3, threshold: 0.75 },
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
