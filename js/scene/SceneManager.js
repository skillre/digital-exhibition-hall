/**
 * 场景管理器
 * 负责创建和管理 Three.js 场景、相机、渲染器
 */

class SceneManager {
  /**
   * 构造函数
   * @param {Object} sceneConfig - 场景配置
   * @param {Object} cameraConfig - 相机配置
   * @param {Object} lightingConfig - 灯光配置
   */
  constructor(sceneConfig, cameraConfig, lightingConfig) {
    this.sceneConfig = sceneConfig;
    this.cameraConfig = cameraConfig;
    this.lightingConfig = lightingConfig;
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.objects = [];
    
    this.clock = new THREE.Clock();
  }
  
  /**
   * 初始化场景
   */
  init() {
    // 创建场景
    this.createScene();
    
    // 创建相机
    this.createCamera();
    
    // 创建渲染器
    this.createRenderer();
    
    // 创建灯光
    this.createLighting();
    
    // 添加坐标轴辅助（可选，开发用）
    // this.addAxesHelper();
    
    console.log('场景管理器初始化完成');
  }
  
  /**
   * 创建场景
   */
  createScene() {
    this.scene = new THREE.Scene();
    
    // 设置背景色
    this.scene.background = new THREE.Color(this.sceneConfig.backgroundColor);
    
    // 设置雾效果
    if (this.sceneConfig.fog.enabled) {
      this.scene.fog = new THREE.Fog(
        this.sceneConfig.fog.color,
        this.sceneConfig.fog.near,
        this.sceneConfig.fog.far
      );
    }
  }
  
  /**
   * 创建相机
   */
  createCamera() {
    const { fov, near, far, position } = this.cameraConfig;
    
    // 创建透视相机
    this.camera = new THREE.PerspectiveCamera(
      fov,
      window.innerWidth / window.innerHeight,
      near,
      far
    );
    
    // 设置相机位置
    this.camera.position.set(position.x, position.y, position.z);
    
    // 相机朝向原点
    this.camera.lookAt(0, 0, 0);
  }
  
  /**
   * 创建渲染器
   */
  createRenderer() {
    // 获取画布元素
    const canvas = document.getElementById('canvas3d');
    
    // 创建 WebGL 渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false
    });
    
    // 设置渲染器尺寸
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    // 设置像素比
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // 启用阴影
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // 设置色调映射
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    // 设置输出编码
    this.renderer.outputEncoding = THREE.sRGBEncoding;
  }
  
  /**
   * 创建灯光
   */
  createLighting() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(
      this.lightingConfig.ambient.color,
      this.lightingConfig.ambient.intensity
    );
    this.scene.add(ambientLight);
    
    // 方向光（主光源）
    const directionalLight = new THREE.DirectionalLight(
      this.lightingConfig.directional.color,
      this.lightingConfig.directional.intensity
    );
    
    const { x, y, z } = this.lightingConfig.directional.position;
    directionalLight.position.set(x, y, z);
    
    // 启用阴影
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    
    this.scene.add(directionalLight);
    
    // 添加半球光（补充环境光）
    const hemisphereLight = new THREE.HemisphereLight(
      0xffffff, // 天空颜色
      0x444444, // 地面颜色
      0.3
    );
    this.scene.add(hemisphereLight);
  }
  
  /**
   * 添加坐标轴辅助
   */
  addAxesHelper() {
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);
  }
  
  /**
   * 添加对象到场景
   * @param {THREE.Object3D} object - 3D 对象
   */
  addObject(object) {
    this.scene.add(object);
    this.objects.push(object);
  }
  
  /**
   * 从场景移除对象
   * @param {THREE.Object3D} object - 3D 对象
   */
  removeObject(object) {
    this.scene.remove(object);
    
    const index = this.objects.indexOf(object);
    if (index > -1) {
      this.objects.splice(index, 1);
    }
  }
  
  /**
   * 渲染场景
   */
  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
  
  /**
   * 窗口大小调整处理
   */
  onWindowResize() {
    if (this.camera && this.renderer) {
      // 更新相机宽高比
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      
      // 更新渲染器尺寸
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }
  
  /**
   * 获取场景对象
   * @returns {THREE.Scene}
   */
  getScene() {
    return this.scene;
  }
  
  /**
   * 获取相机对象
   * @returns {THREE.PerspectiveCamera}
   */
  getCamera() {
    return this.camera;
  }
  
  /**
   * 获取渲染器对象
   * @returns {THREE.WebGLRenderer}
   */
  getRenderer() {
    return this.renderer;
  }
  
  /**
   * 获取所有对象
   * @returns {Array}
   */
  getObjects() {
    return this.objects;
  }
  
  /**
   * 清理资源
   */
  dispose() {
    // 移除所有对象
    this.objects.forEach(obj => {
      this.scene.remove(obj);
      
      // 清理几何体和材质
      if (obj.geometry) {
        obj.geometry.dispose();
      }
      
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(material => material.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    
    // 清理渲染器
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    console.log('场景管理器资源已清理');
  }
}

// 导出
window.SceneManager = SceneManager;
