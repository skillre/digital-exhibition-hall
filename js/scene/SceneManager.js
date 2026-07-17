/**
 * 场景管理器
 * 负责创建和管理 Three.js 场景、相机、渲染器
 */

export class SceneManager {
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
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createLighting();

    console.log('场景管理器初始化完成');
  }

  /**
   * 创建场景
   */
  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.sceneConfig.backgroundColor);

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

    this.camera = new THREE.PerspectiveCamera(
      fov,
      window.innerWidth / window.innerHeight,
      near,
      far
    );

    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(0, 0, 0);
  }

  /**
   * 创建渲染器
   */
  createRenderer() {
    const canvas = document.getElementById('canvas3d');

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
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

    // 半球光
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
    this.scene.add(hemisphereLight);
  }

  /**
   * 添加对象到场景
   */
  addObject(object) {
    this.scene.add(object);
    this.objects.push(object);
  }

  /**
   * 从场景移除对象
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
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  getScene() { return this.scene; }
  getCamera() { return this.camera; }
  getRenderer() { return this.renderer; }
  getObjects() { return this.objects; }

  /**
   * 清理资源
   */
  dispose() {
    this.objects.forEach(obj => {
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(material => material.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    if (this.renderer) {
      this.renderer.dispose();
    }

    console.log('场景管理器资源已清理');
  }
}
