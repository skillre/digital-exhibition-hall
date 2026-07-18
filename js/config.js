/**
 * 应用配置与状态
 * 视觉方向（唯一）：明亮科技极简（Apple Store 感）
 *   - 明亮冷白空间 + 克制的蓝色科技点缀
 *   - 建筑面统一走「受光」材质（MeshStandardMaterial），明度只由灯光 + 曝光一处控制
 *   - 自发光元素（LED 灯带 / 展板边框 / 中央装置）用 emissive / Basic，不受灯光影响
 *
 * 这里是全项目唯一配色来源，请勿在各模块散落硬编码颜色。
 */

// ── 设计令牌 ─────────────────────────────────────────────
export const THEME = {
  // 空间基调（明亮冷白）
  bg:        0xeef1f5,   // 背景 / 远景（雾融入其中，远处淡出到亮，而非变黑）
  wall:      0xf4f6f9,   // 墙面（近白冷灰）
  ceiling:   0xffffff,   // 天花板（纯白）
  floor:     0xe4e8ee,   // 地面（浅冷灰，抛光微反射）

  // 蓝色科技点缀（唯一强调色系）
  accent:    0x0a84ff,   // 主蓝（Apple 系统蓝）
  accentDim: 0x4aa3ff,   // 辅助浅蓝
  led:       0xffffff,   // LED 灯带（纯白发光）

  // 状态色（数据安全语义，克制使用）
  safe:      0x30d158,
  threat:    0xff453a,

  // 文字（用于 3D Canvas 纹理 / HUD）
  ink:       0x1c2530,   // 深墨字
  inkDim:    0x5b6b7d,

  // ── 明度控制（明亮基调，明度集中在这几处 + 曝光）──
  lighting: {
    ambient:     { color: 0xffffff, intensity: 0.75 },
    hemisphere:  { sky: 0xffffff, ground: 0xd8dde4, intensity: 0.9 },
    directional: { color: 0xffffff, intensity: 1.1, position: { x: 6, y: 12, z: 6 } },
    // 蓝色科技补光（点亮青蓝氛围，克制）
    accent:      { color: 0x4aa3ff, intensity: 0.35 },
  },
  exposure: 1.0,        // ACESFilmic 曝光 — 全局明度总闸

  // 材质参数（受光建筑面统一 PBR）
  material: {
    floor:   { roughness: 0.25, metalness: 0.15, envMapIntensity: 0.6 },
    wall:    { roughness: 0.85, metalness: 0.0,  envMapIntensity: 0.35 },
    ceiling: { roughness: 0.9,  metalness: 0.0,  envMapIntensity: 0.3 },
  },

  // 雾（融入背景色，远景淡出到亮 → 明亮通透，而非灰暗）
  fog: { color: 0xeef1f5, density: 0.012 },

  // Bloom（克制，只让 LED / 边框 / 装置微微发光）
  bloom: { strength: 0.35, radius: 0.5, threshold: 0.85 },
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
    position: { x: 0, y: 1.6, z: 12 },
  },

  lighting: THEME.lighting,

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
