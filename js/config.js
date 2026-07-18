/**
 * 应用配置和状态
 * 视觉风格：深蓝赛博 Cyber Blue
 */

// 视觉设计令牌 — 深蓝赛博（单一来源，JS 侧；CSS 侧见 css/style.css :root）
export const THEME = {
  // 基调
  bgDeep: 0x0d1b2a,        // 深蓝黑 — 背景/雾
  surfaceDark: 0x263750,   // 暗锐蓝 — 墙面（明显可见）
  surfaceMid: 0x2e4260,    // 中间面 — 天花/展板底
  // 强调
  neon: 0x00d2ff,          // 青色霓虹 — 灯带/线框/数据点
  ice: 0x0088ff,           // 冰蓝 — 全息投影
  // 点缀
  safe: 0x00ff88,          // 翠绿 — 安全状态
  threat: 0xff00aa,        // 品红 — 威胁/告警
  // 材质参数
  floor: { color: 0x243450, roughness: 0.15, metalness: 0.8, envMapIntensity: 1.5 },
  wall: { color: 0x263750, roughness: 0.5, metalness: 0.2, envMapIntensity: 0.8 },
  panel: { color: 0x0a1628, emissive: 0x00d2ff, emissiveIntensity: 0.6 },
  // 灯光
  ambient: { color: 0x6688bb, intensity: 1.0 },
  directional: { color: 0xaaccee, intensity: 1.2 },
  hemisphere: { sky: 0x6699cc, ground: 0x243450, intensity: 0.8 },
  accent: { color: 0x00d2ff, intensity: 2.5 },
  // 雾
  fog: { color: 0x0d1b2a, density: 0.004 },
  // 后处理
  bloom: { strength: 0.5, radius: 0.3, threshold: 0.7 },
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
