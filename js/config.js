/**
 * 应用配置和状态
 */

// 全局配置
export const CONFIG = {
  // 场景配置
  scene: {
    backgroundColor: 0xd0d4dc,
    fog: {
      enabled: true,
      color: 0xd0d4dc,
      near: 35,
      far: 80
    }
  },

  // 相机配置
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: { x: 0, y: 1.6, z: 5 }
  },

  // 灯光配置
  lighting: {
    ambient: {
      color: 0xffffff,
      intensity: 0.6
    },
    directional: {
      color: 0xffffff,
      intensity: 1.0,
      position: { x: 5, y: 10, z: 5 }
    }
  },

  // 玩家配置
  player: {
    moveSpeed: 5,
    lookSpeed: 0.5,
    height: 1.6,
    collisionDistance: 0.5
  },

  // 展厅配置
  exhibition: {
    width: 40,
    height: 8,
    depth: 40,
    wallThickness: 0.3
  },

  // 自动巡展配置
  autoTour: {
    moveSpeed: 0.1,
    pauseDuration: 5000,
    loopMode: 'loop' // 'loop', 'pingpong', 'once'
  }
};

// 应用状态
export const AppState = {
  isLoading: true,
  isPlaying: false,
  currentExhibition: null,
  selectedPanel: null,
  isModalOpen: false,
  isTeleportMenuOpen: false,
  isAutoTourActive: false
};
