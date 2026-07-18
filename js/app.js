/**
 * 数字展厅主入口文件（ES Module）
 * 负责初始化应用和协调各模块
 * 视觉风格：深蓝赛博 Cyber Blue
 */

import { CONFIG, AppState } from './config.js';
import { SceneManager } from './scene/SceneManager.js';
import { ExhibitionHall } from './objects/ExhibitionHall.js';
import { TechCenterpiece } from './objects/TechCenterpiece.js';
import { PlayerControls } from './controls/PlayerControls.js';
import { InteractionSystem } from './interaction/InteractionSystem.js';
import { UIManager } from './ui/UIManager.js';
import { Minimap } from './ui/Minimap.js';
import { AutoTourMode } from './controls/AutoTourMode.js';

// 模块实例
let sceneManager = null;
let exhibitionHall = null;
let techCenterpiece = null;
let playerControls = null;
let interactionSystem = null;
let uiManager = null;
let minimap = null;
let autoTourMode = null;

// FPS 统计
let frameCount = 0;
let lastTime = performance.now();
let fps = 60;

/**
 * 初始化应用
 */
async function initApp() {
  console.log('正在初始化数字展厅...');

  try {
    updateLoadingProgress(10, '初始化场景...');

    // 创建场景管理器
    sceneManager = new SceneManager(CONFIG.scene, CONFIG.camera, CONFIG.lighting);
    sceneManager.init();

    updateLoadingProgress(30, '创建展厅...');

    // 创建展厅
    exhibitionHall = new ExhibitionHall(CONFIG.exhibition);
    exhibitionHall.create(sceneManager.scene);

    // 创建中央装置
    // 中央装置已禁用（太亮）
    techCenterpiece = new TechCenterpiece();
    techCenterpiece.create(sceneManager.scene, { x: 0, y: 3, z: 0 });

    updateLoadingProgress(50, '初始化控制...');

    // 初始化玩家控制（传入 clock 用于真实帧时间差）
    playerControls = new PlayerControls(
      sceneManager.camera,
      sceneManager.renderer.domElement,
      CONFIG.player,
      sceneManager.clock
    );
    playerControls.init();
    // 注入碰撞对象
    playerControls.setWalls(exhibitionHall.walls);

    updateLoadingProgress(70, '加载交互系统...');

    // 初始化交互系统
    interactionSystem = new InteractionSystem(
      sceneManager.scene,
      sceneManager.camera,
      exhibitionHall
    );
    interactionSystem.init();

    updateLoadingProgress(85, '初始化界面...');

    // 初始化 UI 管理器
    uiManager = new UIManager(exhibitionHall, playerControls, interactionSystem);
    uiManager.init();

    // 初始化小地图
    minimap = new Minimap(CONFIG.exhibition, playerControls);
    minimap.init();
    minimap.setExhibitionZones([
      { id: 'plans', name: '服务方案', x: -10, z: 0 },
      { id: 'cases', name: '案例成果', x: 10, z: 0 },
      { id: 'training', name: '培训教育', x: 0, z: -10 },
      { id: 'docs', name: '技术文档', x: 0, z: 10 }
    ]);

    // 初始化自动巡展模式
    autoTourMode = new AutoTourMode(sceneManager.camera, CONFIG.exhibition);

    updateLoadingProgress(95, '加载内容...');

    // 加载展示内容
    await loadExhibitionContent();

    updateLoadingProgress(100, '准备就绪！');

    // 隐藏加载界面
    setTimeout(() => {
      hideLoadingScreen();
      startRenderLoop();
    }, 500);

    console.log('数字展厅初始化完成！');

  } catch (error) {
    console.error('初始化失败:', error);
    showError('初始化失败，请刷新页面重试');
  }
}

/**
 * 加载展示内容
 */
async function loadExhibitionContent() {
  try {
    const response = await fetch('content/content.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const contentData = await response.json();

    exhibitionHall.loadContent(contentData);

    if (uiManager) {
      uiManager.updateContentList(contentData);
    }

  } catch (error) {
    console.error('加载内容失败:', error);
    showError('内容加载失败，请检查网络连接');
  }
}

/**
 * 更新加载进度
 */
function updateLoadingProgress(progress, text) {
  const progressBar = document.getElementById('loading-progress');
  const loadingText = document.getElementById('loading-text');

  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }

  if (loadingText) {
    loadingText.textContent = text;
  }
}

/**
 * 隐藏加载界面
 */
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
    AppState.isLoading = false;
  }
}

/**
 * 显示错误信息
 */
function showError(message) {
  const loadingText = document.getElementById('loading-text');
  if (loadingText) {
    loadingText.textContent = message;
    loadingText.style.color = '#ff4444';
  }
}

/**
 * 开始渲染循环
 */
function startRenderLoop() {
  AppState.isPlaying = true;

  function animate() {
    if (!AppState.isPlaying) return;

    requestAnimationFrame(animate);

    if (autoTourMode && autoTourMode.isActive()) {
      autoTourMode.update();
    } else if (playerControls) {
      playerControls.update();
    }

    // 更新粒子动画 + 环境动效（传入 elapsed 时间）
    if (exhibitionHall) {
      exhibitionHall.updateParticles(sceneManager.clock.getElapsedTime());
    }

    // 更新中央装置
    if (techCenterpiece) {
      techCenterpiece.update(sceneManager.clock.getElapsedTime());
    }

    // 更新小地图
    if (minimap) {
      minimap.update();
    }

    updateFPS();

    if (sceneManager) {
      sceneManager.render();
    }
  }

  animate();
}

/**
 * 更新 FPS 显示
 */
function updateFPS() {
  frameCount++;
  const currentTime = performance.now();

  if (currentTime - lastTime >= 1000) {
    fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
    frameCount = 0;
    lastTime = currentTime;

    const fpsElement = document.getElementById('fps');
    if (fpsElement) {
      fpsElement.textContent = `FPS: ${fps}`;
    }
  }
}

/**
 * 窗口大小调整处理
 */
function onWindowResize() {
  if (sceneManager) {
    sceneManager.onWindowResize();
  }
}

// 事件监听
window.addEventListener('resize', onWindowResize);
window.addEventListener('load', initApp);

// 导出全局对象供 InteractionSystem 等模块回调
window.App = {
  config: CONFIG,
  state: AppState,
  sceneManager: () => sceneManager,
  exhibitionHall: () => exhibitionHall,
  techCenterpiece: () => techCenterpiece,
  playerControls: () => playerControls,
  interactionSystem: () => interactionSystem,
  uiManager: () => uiManager,
  minimap: () => minimap,
  autoTourMode: () => autoTourMode
};
