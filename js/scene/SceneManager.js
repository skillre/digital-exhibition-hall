/**
 * 场景管理器
 * 视觉方向：深色科技沉浸（Cyber Dark）
 * 核心：深色环境贴图 + 蓝色科技灯光 + 增强 Bloom
 * 明度总闸：灯光强度 + THEME.exposure（ACESFilmic），只在此处控制。
 */

import * as THREE from 'three';
import { THEME } from '../config.js';
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
      const f = this.sceneConfig.fog;
      if (f.type === 'exp2') {
        this.scene.fog = new THREE.FogExp2(f.color, f.density);
      } else {
        this.scene.fog = new THREE.Fog(f.color, f.near, f.far);
      }
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
    this.renderer.toneMappingExposure = THEME.exposure;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  /**
   * 创建环境贴图 — 深色科技
   * 给 PBR 建筑面提供深色调反射环境。
   */
  createEnvironment() {
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      pmremGenerator.compileEquirectangularShader();
      const envScene = new THREE.Scene();
      envScene.background = new THREE.Color(0x141c28);

      const panelGeo = new THREE.PlaneGeometry(10, 10);
      const dark = new THREE.MeshBasicMaterial({ color: 0x141c28 });
      const mid = new THREE.MeshBasicMaterial({ color: 0x1e2d42 });
      const accent = new THREE.MeshBasicMaterial({ color: 0x0a3060 });
      const floor = new THREE.MeshBasicMaterial({ color: 0x121a28 });
      // 添加亮色面板以增加反射丰富度
      const bright = new THREE.MeshBasicMaterial({ color: 0x2a3f5a });

      const faces = [
        { mat: floor,  pos: [0, -5, 0], rot: [-Math.PI / 2, 0, 0] },
        { mat: bright,  pos: [0, 5, 0], rot: [Math.PI / 2, 0, 0] },
        { mat: mid,    pos: [0, 0, -5], rot: [0, 0, 0] },
        { mat: mid,    pos: [0, 0, 5], rot: [0, Math.PI, 0] },
        { mat: accent, pos: [-5, 0, 0], rot: [0, Math.PI / 2, 0] },
        { mat: accent, pos: [5, 0, 0], rot: [0, -Math.PI / 2, 0] },
      ];
      faces.forEach(f => {
        const m = new THREE.Mesh(panelGeo, f.mat);
        m.position.set(...f.pos); m.rotation.set(...f.rot);
        envScene.add(m);
      });

      const envTexture = pmremGenerator.fromScene(envScene).texture;
      this.scene.environment = envTexture;
      envScene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      panelGeo.dispose(); pmremGenerator.dispose();
      console.log('环境贴图生成完成');
    } catch (e) {
      console.error('环境贴图生成失败:', e);
    }
  }

  /**
   * 创建灯光 — 暗调基调 + 蓝色科技补光
   */
  createLighting() {
    const a = this.lightingConfig.ambient;
    this.scene.add(new THREE.AmbientLight(a.color, a.intensity));

    const h = this.lightingConfig.hemisphere;
    this.scene.add(new THREE.HemisphereLight(h.sky, h.ground, h.intensity));

    const d = this.lightingConfig.directional;
    const dir = new THREE.DirectionalLight(d.color, d.intensity);
    dir.position.set(d.position.x, d.position.y, d.position.z);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 2048;
    dir.shadow.mapSize.height = 2048;
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 50;
    dir.shadow.camera.left = -25;
    dir.shadow.camera.right = 25;
    dir.shadow.camera.top = 25;
    dir.shadow.camera.bottom = -25;
    dir.shadow.bias = -0.0005;
    this.scene.add(dir);

    // 蓝色科技补光（空间氛围）
    const ac = this.lightingConfig.accent;
    const accent = new THREE.PointLight(ac.color, ac.intensity, 40);
    accent.position.set(0, 7, 0);
    this.scene.add(accent);

    // 四个展区的蓝色聚光灯
    const zonePositions = [
      { x: -11, z: 0 },   // 服务方案
      { x: 11, z: 0 },    // 案例成果
      { x: 0, z: -11 },   // 培训教育
      { x: 0, z: 11 },    // 技术文档
    ];
    zonePositions.forEach(pos => {
      const spot = new THREE.SpotLight(0x0a84ff, 1.5, 20, Math.PI / 5, 0.6, 1);
      spot.position.set(pos.x, 9, pos.z);
      spot.target.position.set(pos.x, 0, pos.z);
      this.scene.add(spot);
      this.scene.add(spot.target);
    });

    // 入口处暖色引导光
    const entryLight = new THREE.PointLight(0x4ac0ff, 1.2, 18);
    entryLight.position.set(0, 6, 18);
    this.scene.add(entryLight);

    // 青绿色氛围光（第二强调色，增加空间层次）
    const cyanLight = new THREE.PointLight(0x00d4aa, 0.6, 25);
    cyanLight.position.set(0, 5, 0);
    this.scene.add(cyanLight);

    // 四角补光（减少大面积暗区）
    const cornerPositions = [
      { x: -18, z: -18 }, { x: 18, z: -18 },
      { x: -18, z: 18 },  { x: 18, z: 18 },
    ];
    cornerPositions.forEach(pos => {
      const cornerLight = new THREE.PointLight(0x1a3a60, 0.4, 15);
      cornerLight.position.set(pos.x, 3, pos.z);
      this.scene.add(cornerLight);
    });
  }

  /**
   * 后处理：增强 Bloom
   */
  createPostProcessing() {
    try {
      const size = new THREE.Vector2();
      this.renderer.getSize(size);
      this.composer = new EffectComposer(this.renderer);
      this.composer.addPass(new RenderPass(this.scene, this.camera));

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(size.x, size.y),
        THEME.bloom.strength,
        THEME.bloom.radius,
        THEME.bloom.threshold
      );
      this.composer.addPass(bloomPass);
      console.log('后处理初始化完成');
    } catch (e) {
      console.error('后处理初始化失败:', e);
      this.composer = null;
    }
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
