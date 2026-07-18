/**
 * 应用配置和状态
 * 视觉风格：深蓝赛博 Cyber Blue
 */

// 视觉设计令牌 — 真实展厅 + 数字点缀
export const THEME = {
  // 基调 — 真实展厅色
  bgDeep: 0x0c1420,        // 深色背景
  surfaceDark: 0x2a2a30,   // 墙面（真实灰调）
  surfaceMid: 0x222228,    // 天花板
  // 强调 — 数字化点缀
  neon: 0x00d2ff,          // 青色霓虹
  ice: 0x0088ff,           // 冰蓝
  // 点缀
  safe: 0x00ff88,          // 翠绿
  threat: 0xff00aa,        // 品红
  // 材质参数 — 真实质感（低 metalness）
  floor: { color: 0x1e1e24, roughness: 0.2, metalness: 0.1, envMapIntensity: 0.8 },
  wall: { color: 0x2a2a30, roughness: 0.7, metalness: 0.05, envMapIntensity: 0.3 },
  panel: { color: 0x0a1628, emissive: 0x00d2ff, emissiveIntensity: 0.6 },
  // 灯光 — 白色日光灯（真实展厅感）
  ambient: { color: 0xe8e4dd, intensity: 0.6 },
  directional: { color: 0xffffff, intensity: 1.2 },
  hemisphere: { sky: 0xf0eee8, ground: 0x1e1e24, intensity: 0.5 },
  accent: { color: 0x00d2ff, intensity: 1.5 },
  // 雾
  fog: { color: 0x0c1420, density: 0.003 },
  // 后处理
  bloom: { strength: 0.6, radius: 0.4, threshold: 0.6 },
};

// 全局配置
export const CONFIG = {
  scene: {
    backgroundColor: THEME.bgDeep,
    fog: {
      enabled: true,
      type: 'exp2',         // SceneManager 用 FogExp2
      color: THEME.fog.color,
      density: THEME.fog.density,
      near: 35, far: 80,    // 线性雾回退兼容
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
