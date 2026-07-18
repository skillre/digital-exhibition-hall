/**
 * 应用配置和状态
 * 视觉风格：深蓝赛博 Cyber Blue
 */

// 视觉设计令牌 — 深蓝赛博（单一来源，JS 侧；CSS 侧见 css/style.css :root）
export const THEME = {
  // 基调
  bgDeep: 0x0c1828,        // 深蓝黑 — 背景/雾
  surfaceDark: 0x2a4468,   // 墙面（中等暗蓝）
  surfaceMid: 0x305070,    // 天花
  // 强调
  neon: 0x00d2ff,          // 青色霓虹
  ice: 0x0088ff,           // 冰蓝
  // 点缀
  safe: 0x00ff88,          // 翠绿
  threat: 0xff00aa,        // 品红
  // 材质参数 — 低 metalness 让灯光穿透
  floor: { color: 0x253a58, roughness: 0.25, metalness: 0.3, envMapIntensity: 1.5 },
  wall: { color: 0x2a4468, roughness: 0.5, metalness: 0.1, envMapIntensity: 0.8 },
  panel: { color: 0x0a1628, emissive: 0x00d2ff, emissiveIntensity: 0.6 },
  // 灯光 — 保持足够强度
  ambient: { color: 0x8899bb, intensity: 1.5 },
  directional: { color: 0xccddee, intensity: 2.0 },
  hemisphere: { sky: 0x7799bb, ground: 0x253a58, intensity: 1.0 },
  accent: { color: 0x00d2ff, intensity: 3.0 },
  // 雾
  fog: { color: 0x0c1828, density: 0.003 },
  // 后处理
  bloom: { strength: 0.4, radius: 0.3, threshold: 0.8 },
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
