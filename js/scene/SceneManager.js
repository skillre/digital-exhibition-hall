/**
 * 场景管理器
 * 视觉风格：深蓝赛博 Cyber Blue
 * 核心技术：暗色科技环境贴图 + PBR 材质 + Bloom + 扫描线后处理
 */

import * as THREE from 'three';
import { THEME } from '../config.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

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
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  /**
   * 创建环境贴图 — 亮色科技版
   */
  createEnvironment() {
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      pmremGenerator.compileEquirectangularShader();
      const envScene = new THREE.Scene();
      envScene.background = new THREE.Color(0x888888);
      const panelGeo = new THREE.PlaneGeometry(10, 10);
      const bright = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const mid = new THREE.MeshBasicMaterial({ color: 0x888888 });
      const floor = new THREE.MeshBasicMaterial({ color: 0x1a1e22 });
      const faces = [
        { mat: floor, pos: [0, -5, 0], rot: [-Math.PI / 2, 0, 0] },
        { mat: bright, pos: [0, 5, 0], rot: [Math.PI / 2, 0, 0] },
        { mat: bright, pos: [0, 0, -5], rot: [0, 0, 0] },
        { mat: bright, pos: [0, 0, 5], rot: [0, Math.PI, 0] },
        { mat: mid, pos: [-5, 0, 0], rot: [0, Math.PI / 2, 0] },
        { mat: mid, pos: [5, 0, 0], rot: [0, -Math.PI / 2, 0] },
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
   * 创建灯光 — 暗冷色 + 青色补光
   */
  createLighting() {
    const a = this.lightingConfig.ambient;
    this.scene.add(new THREE.AmbientLight(a.color, a.intensity));

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

    const h = this.lightingConfig.hemisphere;
    this.scene.add(new THREE.HemisphereLight(h.sky, h.ground, h.intensity));

    const ac = this.lightingConfig.accent;
    const accent = new THREE.PointLight(ac.color, ac.intensity, 30);
    accent.position.set(0, 6, 0);
    this.scene.add(accent);

    // 白色补光
    const warmFill = new THREE.PointLight(0xffffff, 0.3, 25);
    warmFill.position.set(-8, 6, 5);
    this.scene.add(warmFill);
    const warmFill2 = new THREE.PointLight(0xffffff, 0.2, 20);
    warmFill2.position.set(8, 6, -5);
    this.scene.add(warmFill2);
  }

  /**
   * 后处理：Bloom + 扫描线
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
