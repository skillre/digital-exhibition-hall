/**
 * 应用配置与状态
 * 视觉方向：明亮科技（Bright Blue-White Tech）
 *   - 浅蓝白空间（明亮但不刺眼）+ 蓝色科技发光点缀
 *   - 建筑面统一走「受光」材质（MeshStandardMaterial），浅冷调为主
 *   - 自发光元素（LED 灯带 / 展板边框 / 中央装置）用 emissive / Basic，不受灯光影响
 *
 * 这里是全项目唯一配色来源，请勿在各模块散落硬编码颜色。
 * 亮度调节只在三处：灯光强度、THEME.exposure、THEME.bloom。切勿把墙面直接改成纯白，
 * 否则叠加曝光 + Bloom 会导致「白到刺眼」。
 */

// ── 设计令牌 ─────────────────────────────────────────────
export const THEME = {
  // 空间基调（明亮科技浅蓝白，刻意避开纯白以防眩光）
  bg:        0xdfe8f2,   // 背景 / 远景（浅蓝白）
  wall:      0xdfe7f0,   // 墙面（浅冷灰蓝）
  ceiling:   0xeef3f9,   // 天花板（最亮，柔白）
  floor:     0xd0dae8,   // 地面（浅蓝灰，略深以稳住空间）
  floorGrid: 0x9fb2cc,   // 地面网格线（中蓝灰，浅底上可见）

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
  ink:       0x1a2740,   // 深蓝黑字（浅底上可读）
  inkDim:    0x5a6b85,   // 灰蓝字

  // ── 明度控制（明亮科技基调：柔和均匀，避免眩光）──
  lighting: {
    ambient:     { color: 0xffffff, intensity: 0.75 },
    hemisphere:  { sky: 0xeaf2ff, ground: 0xcdd8e6, intensity: 0.95 },
    directional: { color: 0xffffff, intensity: 1.15, position: { x: 6, y: 12, z: 6 } },
    // 蓝色科技补光（点缀氛围，浅底空间下大幅调低以防蓝色泛滥/过曝）
    accent:      { color: 0x0a84ff, intensity: 0.35 },
  },
  exposure: 1.0,        // ACESFilmic 曝光（1.0 中性，浅底无需再抬亮）

  // 材质参数（受光建筑面统一 PBR；浅底面降低金属度、提高粗糙度，做哑光磨砂质感，避免镜面反射变暗）
  material: {
    floor:   { roughness: 0.5,  metalness: 0.12, envMapIntensity: 0.35 },
    wall:    { roughness: 0.75, metalness: 0.04, envMapIntensity: 0.25 },
    ceiling: { roughness: 0.85, metalness: 0.02, envMapIntensity: 0.2 },
  },

  // 雾（融入浅色背景，做出空间纵深但不糊）
  fog: { color: 0xe4ecf5, density: 0.006 },

  // Bloom（浅底场景只让真正的高亮发光体溢光，阈值抬高、强度调低以防「白到刺眼」）
  bloom: { strength: 0.28, radius: 0.4, threshold: 0.82 },
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
