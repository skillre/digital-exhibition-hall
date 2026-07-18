/**
 * 应用配置和状态
 * 视觉风格：深蓝赛博 Cyber Blue
 */

// 视觉设计令牌 — 深蓝赛博（单一来源，JS 侧；CSS 侧见 css/style.css :root）
export const THEME = {
  // 基调
  bgDeep: 0x080e1a,        // 深蓝黑 — 背景/雾（略提亮）
  surfaceDark: 0x141e30,   // 暗锐蓝 — 墙面（提亮）
  surfaceMid: 0x1a2438,    // 中间面 — 天花/展板底（提亮）
  // 强调
  neon: 0x00d2ff,          // 青色霓虹 — 灯带/线框/数据点
  ice: 0x0066ff,           // 冰蓝 — 全息投影
  // 点缀
  safe: 0x00ff88,          // 翠绿 — 安全状态
  threat: 0xff00aa,        // 品红 — 威胁/告警
  // 材质参数
  floor: { color: 0x0c1424, roughness: 0.05, metalness: 0.95, envMapIntensity: 1.0 },
  wall: { color: 0x141e30, roughness: 0.5, metalness: 0.25, envMapIntensity: 0.5 },
  panel: { color: 0x0a1628, emissive: 0x00d2ff, emissiveIntensity: 0.6 },
  // 灯光
  ambient: { color: 0x1a2a4e, intensity: 0.45 },
  directional: { color: 0x4488cc, intensity: 0.6 },
  hemisphere: { sky: 0x00d2ff, ground: 0x0c1424, intensity: 0.5 },
  accent: { color: 0x00d2ff, intensity: 1.2 },
  // 雾
  fog: { color: 0x080e1a, density: 0.008 },
  // 后处理
  bloom: { strength: 0.8, radius: 0.4, threshold: 0.5 },
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
