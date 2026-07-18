/**
 * 应用配置与状态
 * 视觉方向：深色科技沉浸（Cyber Dark）
 *   - 深蓝黑空间 + 蓝色科技发光点缀
 *   - 建筑面统一走「受光」材质（MeshStandardMaterial），暗调为主
 *   - 自发光元素（LED 灯带 / 展板边框 / 中央装置）用 emissive / Basic，不受灯光影响
 *
 * 这里是全项目唯一配色来源，请勿在各模块散落硬编码颜色。
 */

// ── 设计令牌 ─────────────────────────────────────────────
export const THEME = {
  // 空间基调（深色科技）
  bg:        0x080c14,   // 背景 / 远景（极深蓝黑）
  wall:      0x141a28,   // 墙面（深蓝灰）
  ceiling:   0x0c1018,   // 天花板（深黑蓝）
  floor:     0x101620,   // 地面（深灰蓝）
  floorGrid: 0x1a2540,   // 地面网格线

  // 蓝色科技点缀（唯一强调色系）
  accent:    0x0a84ff,   // 主蓝
  accentDim: 0x4aa3ff,   // 辅助浅蓝
  accentGlow: 0x0066cc,  // 深蓝辉光
  led:       0x4ac0ff,   // LED 灯带（冷蓝白）

  // 状态色（数据安全语义，克制使用）
  safe:      0x30d158,
  threat:    0xff453a,

  // 文字（用于 3D Canvas 纹理 / HUD）
  ink:       0xe8edf5,   // 浅白字（暗背景上）
  inkDim:    0x7a8ba5,

  // ── 明度控制（暗调基调，蓝色发光点缀）──
  lighting: {
    ambient:     { color: 0x1a2540, intensity: 0.3 },
    hemisphere:  { sky: 0x1a2540, ground: 0x080c14, intensity: 0.4 },
    directional: { color: 0xc8d8f0, intensity: 0.6, position: { x: 6, y: 12, z: 6 } },
    // 蓝色科技补光（核心氛围光）
    accent:      { color: 0x0a84ff, intensity: 1.2 },
  },
  exposure: 0.9,        // ACESFilmic 曝光

  // 材质参数（受光建筑面统一 PBR）
  material: {
    floor:   { roughness: 0.35, metalness: 0.25, envMapIntensity: 0.4 },
    wall:    { roughness: 0.75, metalness: 0.05, envMapIntensity: 0.3 },
    ceiling: { roughness: 0.85, metalness: 0.0,  envMapIntensity: 0.2 },
  },

  // 雾（融入背景色，深色远处淡出）
  fog: { color: 0x080c14, density: 0.018 },

  // Bloom（增强发光感）
  bloom: { strength: 0.6, radius: 0.6, threshold: 0.7 },
};

// ── 全局配置 ─────────────────────────────────────────────
export const CONFIG = {
  scene: {
    backgroundColor: THEME.bg,
    fog: {
      enabled: true,
      type: 'exp2',
      color: THEME.fog.color,
      density: THEME.fog.density,
      near: 35, far: 80,
    },
  },

  camera: {
    fov: 70,
    near: 0.1,
    far: 1000,
    position: { x: 0, y: 1.6, z: 14 },
  },

  lighting: THEME.lighting,

  player: {
    moveSpeed: 5,
    lookSpeed: 0.5,
    height: 1.6,
    collisionDistance: 0.5,
  },

  exhibition: {
    width: 44,
    height: 10,
    depth: 44,
    wallThickness: 0.4,
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
