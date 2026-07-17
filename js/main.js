/**
 * 数字展厅主入口文件
 * 负责初始化应用和协调各模块
 */

// 全局配置
const CONFIG = {
  // 场景配置
  scene: {
    backgroundColor: 0x1a1a2e,
    fog: {
      enabled: true,
      color: 0x1a1a2e,
      near: 10,
      far: 100
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
      intensity: 0.4
    },
    directional: {
      color: 0xffffff,
      intensity: 0.8,
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
  }
};

// 应用状态
const AppState = {
  isLoading: true,
  isPlaying: false,
  currentExhibition: null,
  selectedPanel: null,
  isModalOpen: false,
  isTeleportMenuOpen: false
};

// 全局对象
let sceneManager = null;
let exhibitionHall = null;
let playerControls = null;
let interactionSystem = null;
let uiManager = null;

/**
 * 初始化应用
 */
async function initApp() {
  console.log('正在初始化数字展厅...');
  
  try {
    // 更新加载进度
    updateLoadingProgress(10, '初始化场景...');
    
    // 创建场景管理器
    sceneManager = new SceneManager(CONFIG.scene, CONFIG.camera, CONFIG.lighting);
    sceneManager.init();
    
    updateLoadingProgress(30, '创建展厅...');
    
    // 创建展厅
    exhibitionHall = new ExhibitionHall(CONFIG.exhibition);
    exhibitionHall.create(sceneManager.scene);
    
    updateLoadingProgress(50, '初始化控制...');
    
    // 初始化玩家控制
    playerControls = new PlayerControls(
      sceneManager.camera,
      sceneManager.renderer.domElement,
      CONFIG.player
    );
    playerControls.init();
    
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
    // 这里可以加载 content.json 配置文件
    // 暂时使用示例数据
    const contentData = {
      exhibitions: [
        {
          id: 'plans',
          name: '服务方案区',
          description: '数据安全咨询服务方案',
          position: { x: -10, y: 0, z: 0 },
          panels: [
            {
              id: 'panel-001',
              type: 'document',
              title: '数据分类分级方案',
              description: '帮助企业建立数据分类分级体系，实现数据精细化管理',
              tags: ['数据安全', '分类分级', '合规'],
              thumbnail: 'assets/images/data-classification.jpg',
              contentUrl: 'content/documents/data-classification.pdf'
            },
            {
              id: 'panel-002',
              type: 'document',
              title: '数据安全治理方案',
              description: '全面的数据安全治理框架和实施路径',
              tags: ['安全治理', '体系建设'],
              thumbnail: 'assets/images/security-governance.jpg',
              contentUrl: 'content/documents/security-governance.pdf'
            }
          ]
        },
        {
          id: 'cases',
          name: '案例成果区',
          description: '成功案例展示',
          position: { x: 10, y: 0, z: 0 },
          panels: [
            {
              id: 'panel-003',
              type: 'image',
              title: '金融行业案例',
              description: '为某大型银行实施数据安全体系建设',
              tags: ['金融', '银行', '案例'],
              thumbnail: 'assets/images/finance-case.jpg',
              contentUrl: 'content/images/finance-case-detail.jpg'
            },
            {
              id: 'panel-004',
              type: 'video',
              title: '客户访谈视频',
              description: '客户分享数据安全服务体验',
              tags: ['客户反馈', '视频'],
              thumbnail: 'assets/images/interview-thumb.jpg',
              contentUrl: 'content/videos/customer-interview.mp4'
            }
          ]
        },
        {
          id: 'training',
          name: '培训教育区',
          description: '安全培训与教育资源',
          position: { x: 0, y: 0, z: -10 },
          panels: [
            {
              id: 'panel-005',
              type: 'video',
              title: '数据安全意识培训',
              description: '员工数据安全意识提升培训视频',
              tags: ['培训', '安全意识'],
              thumbnail: 'assets/images/training-thumb.jpg',
              contentUrl: 'content/videos/security-training.mp4'
            },
            {
              id: 'panel-006',
              type: 'document',
              title: '安全操作手册',
              description: '日常数据安全操作指南',
              tags: ['操作手册', '指南'],
              thumbnail: 'assets/images/manual-thumb.jpg',
              contentUrl: 'content/documents/security-manual.pdf'
            }
          ]
        },
        {
          id: 'docs',
          name: '技术文档区',
          description: '技术文档与白皮书',
          position: { x: 0, y: 0, z: 10 },
          panels: [
            {
              id: 'panel-007',
              type: 'document',
              title: '数据安全白皮书',
              description: '数据安全技术发展趋势白皮书',
              tags: ['白皮书', '技术趋势'],
              thumbnail: 'assets/images/whitepaper-thumb.jpg',
              contentUrl: 'content/documents/data-security-whitepaper.pdf'
            }
          ]
        }
      ]
    };
    
    // 将内容数据传递给展厅
    exhibitionHall.loadContent(contentData);
    
    // 更新 UI
    if (uiManager) {
      uiManager.updateContentList(contentData);
    }
    
  } catch (error) {
    console.error('加载内容失败:', error);
  }
}

/**
 * 更新加载进度
 * @param {number} progress - 进度百分比 (0-100)
 * @param {string} text - 加载提示文字
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
 * @param {string} message - 错误信息
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
  
  // 动画循环
  function animate() {
    if (!AppState.isPlaying) return;
    
    requestAnimationFrame(animate);
    
    // 更新玩家控制
    if (playerControls) {
      playerControls.update();
    }
    
    // 更新交互系统
    if (interactionSystem) {
      interactionSystem.update();
    }
    
    // 更新 FPS 显示
    updateFPS();
    
    // 渲染场景
    if (sceneManager) {
      sceneManager.render();
    }
  }
  
  animate();
}

/**
 * 更新 FPS 显示
 */
let frameCount = 0;
let lastTime = performance.now();
let fps = 60;

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

// 导出全局对象供其他模块使用
window.App = {
  config: CONFIG,
  state: AppState,
  sceneManager: () => sceneManager,
  exhibitionHall: () => exhibitionHall,
  playerControls: () => playerControls,
  interactionSystem: () => interactionSystem,
  uiManager: () => uiManager
};
