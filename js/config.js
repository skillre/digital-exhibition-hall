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
  // 空间基调（明亮科技深色）
  bg:        0x101825,   // 背景 / 远景（中性深蓝灰）
  wall:      0x1e2d42,   // 墙面（明亮蓝灰）
  ceiling:   0x182535,   // 天花板（中性深蓝）
  floor:     0x1a2838,   // 地面（中性灰蓝）
  floorGrid: 0x2a3f5a,   // 地面网格线（更亮）

  // 双色科技强调（蓝 + 青）
  accent:    0x0a84ff,   // 主蓝
  accentDim: 0x4aa3ff,   // 辅助浅蓝
  accentGlow: 0x0066cc,  // 深蓝辉光
  led:       0x4ac0ff,   // LED 灯带（冷蓝白）
  cyan:      0x00d4aa,   // 科技青绿（第二强调色）
  cyanDim:   0x00b89a,   // 辅助青绿

  // 状态色（数据安全语义，克制使用）
  safe:      0x30d158,
  threat:    0xff453a,

  // 文字（用于 3D Canvas 纹理 / HUD）
  ink:       0xf0f4fa,   // 浅白字（更亮）
  inkDim:    0x8a9cb5,   // 灰字（更亮）

  // ── 明度控制（明亮科技基调 + 双色发光）──
  lighting: {
    ambient:     { color: 0x2a3a55, intensity: 0.5 },
    hemisphere:  { sky: 0x2a3a55, ground: 0x101825, intensity: 0.6 },
    directional: { color: 0xd8e4f4, intensity: 0.9, position: { x: 6, y: 12, z: 6 } },
    // 蓝色科技补光（核心氛围光）
    accent:      { color: 0x0a84ff, intensity: 1.8 },
  },
  exposure: 1.1,        // ACESFilmic 曝光（提升整体亮度）

  // 材质参数（受光建筑面统一 PBR，增加反射）
  material: {
    floor:   { roughness: 0.25, metalness: 0.35, envMapIntensity: 0.6 },
    wall:    { roughness: 0.55, metalness: 0.12, envMapIntensity: 0.5 },
    ceiling: { roughness: 0.7,  metalness: 0.05, envMapIntensity: 0.3 },
  },

  // 雾（融入背景色，减弱以增加可见度）
  fog: { color: 0x101825, density: 0.012 },

  // Bloom（增强发光感，降低阈值让更多元素参与）
  bloom: { strength: 0.8, radius: 0.5, threshold: 0.5 },
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
