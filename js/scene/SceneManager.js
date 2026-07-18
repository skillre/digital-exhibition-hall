/**
 * 场景管理器
 * 视觉风格：高质量拟物感展厅
 * 核心技术：RoomEnvironment 环境贴图 + PBR 材质 + 后处理
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

export class SceneManager {
  constructor(sceneConfig, cameraConfig, lightingConfig) {
    this.sceneConfig = sceneConfig;
    this.cameraConfig = cameraConfig;
    this.lightingConfig = lightingConfig;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.objects = [];

    this.clock = new THREE.Clock();
  }

  init() {
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createEnvironment();
    this.createLighting();
    this.createPostProcessing();
    console.log('场景管理器初始化完成');
  }

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

  createCamera() {
    const { fov, near, far, position } = this.cameraConfig;
    this.camera = new THREE.PerspectiveCamera(
      fov, window.innerWidth / window.innerHeight, near, far
    );
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(0, 0, 0);
  }

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
    this.renderer.toneMappingExposure = 0.8;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  /**
   * 创建环境贴图 — 这是真实感的核心
   * RoomEnvironment 生成一个简单的室内环境，让金属/光泽表面有东西可以反射
   */
  createEnvironment() {
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();

    const roomEnv = new RoomEnvironment();
    const envTexture = pmremGenerator.fromScene(roomEnv).texture;

    this.scene.environment = envTexture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    console.log('环境贴图生成完成');
  }

  /**
   * 创建灯光
   */
  createLighting() {
    // 环境光：低强度补光
    const ambientLight = new THREE.AmbientLight(
      this.lightingConfig.ambient.color,
      this.lightingConfig.ambient.intensity
    );
    this.scene.add(ambientLight);

    // 主方向光
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
    directionalLight.shadow.camera.left = -25;
    directionalLight.shadow.camera.right = 25;
    directionalLight.shadow.camera.top = 25;
    directionalLight.shadow.camera.bottom = -25;
    directionalLight.shadow.bias = -0.0005;
    this.scene.add(directionalLight);

    // 半球光：天空+地面反射
    const hemisphereLight = new THREE.HemisphereLight(0xddeeff, 0x998877, 0.5);
    this.scene.add(hemisphereLight);

    // 补光
    const fillLight = new THREE.DirectionalLight(0xfff0dd, 0.3);
    fillLight.position.set(-5, 8, -5);
    this.scene.add(fillLight);
  }

  /**
   * 后处理：轻度 Bloom
   */
  createPostProcessing() {
    const size = new THREE.Vector2();
    this.renderer.getSize(size);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.x, size.y),
      0.15,  // strength — 非常轻
      0.4,   // radius
      0.85   // threshold — 只有灯带等最亮物体才发光
    );
    this.composer.addPass(bloomPass);

    console.log('后处理管线初始化完成');
  }

  addObject(object) {
    this.scene.add(object);
    this.objects.push(object);
  }

  removeObject(object) {
    this.scene.remove(object);
    const index = this.objects.indexOf(object);
    if (index > -1) this.objects.splice(index, 1);
  }

  render() {
    if (this.composer) {
      this.composer.render();
    } else if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  onWindowResize() {
    if (this.camera && this.renderer) {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      if (this.composer) this.composer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  getScene() { return this.scene; }
  getCamera() { return this.camera; }
  getRenderer() { return this.renderer; }
  getObjects() { return this.objects; }

  dispose() {
    if (this.composer) {
      this.composer.passes.forEach(pass => { if (pass.dispose) pass.dispose(); });
      this.composer.dispose();
    }
    this.objects.forEach(obj => {
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    });
    if (this.renderer) this.renderer.dispose();
    console.log('场景管理器资源已清理');
  }
}
