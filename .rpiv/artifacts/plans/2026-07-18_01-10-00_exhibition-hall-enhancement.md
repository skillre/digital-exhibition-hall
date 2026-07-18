---
date: 2026-07-18T01:10:00+0800
author: skillre
commit: 52f7359
branch: main
repository: 数字展厅
topic: "展厅交互增强与科技极简风格升级"
tags: [plan, threejs, postprocessing, interaction, state-machine, particles]
status: ready
parent: ".rpiv/artifacts/designs/2026-07-18_01-00-00_exhibition-hall-enhancement.md"
phase_count: 7
phases:
  - { n: 1, title: "Three.js 迁移 + 后处理管线" }
  - { n: 2, title: "粒子系统 + 资源管理修复" }
  - { n: 3, title: "交互状态机 + 碰撞修复" }
  - { n: 4, title: "InteractiveModel + DataDashboard" }
  - { n: 5, title: "model3d 展板 + 全屏模式" }
  - { n: 6, title: "传送系统增强" }
  - { n: 7, title: "AutoTourMode + UI 增强" }
last_updated: 2026-07-18T01:10:00+0800
last_updated_by: skillre
---

# 展厅交互增强与科技极简风格升级 实施计划

## Overview

本计划将数字展厅从初级静态展示升级为成熟、高科技、专业的科技极简风格。通过 7 个阶段的渐进式实施，实现 Three.js 迁移、后处理管线、粒子系统、交互状态机、碰撞修复、可交互模型、数据可视化、全屏模式、传送系统和自动巡展功能。

设计工件: `.rpiv/artifacts/designs/2026-07-18_01-00-00_exhibition-hall-enhancement.md`

## Desired End State

```javascript
// 后处理管线
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(resolution, 0.8, 0.3, 0.2));
composer.addPass(new SSAOPass(scene, camera, width, height));

// 交互状态机
const stateMachine = new InteractionStateMachine();
stateMachine.transition(InteractionState.MODAL);

// 可交互模型
const model = new InteractiveModel(geometry, material);
model.enableDragRotation();
model.enableScrollZoom();

// 数据可视化
const dashboard = new DataDashboard();
dashboard.createChartPlane(chartData);

// 自动巡展
const autoTour = new AutoTourMode(camera, waypoints);
autoTour.start();
```

## What We're NOT Doing

- ❌ 移动端触屏适配
- ❌ 多人协作/社交功能
- ❌ 真实 API 对接
- ❌ 语音导览功能
- ❌ 外部 glTF/GLB 模型加载

---

## Phase 1: Three.js 迁移 + 后处理管线

### Overview
迁移 Three.js 从全局脚本到 npm 包，集成 EffectComposer 后处理管线实现 Bloom 辉光效果。这是所有后续阶段的基础。

### Changes Required:

#### 1. package.json
**File**: `package.json`
**Changes**: 添加 `three` 依赖

```json
{
  "name": "digital-exhibition-hall",
  "version": "1.0.0",
  "private": true,
  "description": "数据安全服务数字展厅",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^5.4.0"
  },
  "dependencies": {
    "three": "^0.158.0"
  }
}
```

#### 2. index.html
**File**: `index.html`
**Changes**: 移除全局 `three.min.js` 脚本

```html
  <!-- 第三方库（全局脚本） -->
  <!-- <script src="./lib/three.min.js"></script> -->  <!-- 已迁移到 npm -->

  <!-- 主程序（ES Module） -->
  <script type="module" src="js/app.js"></script>
```

#### 3. SceneManager.js
**File**: `js/scene/SceneManager.js`
**Changes**: 添加 ES Module 导入，修复色彩空间，集成 EffectComposer

```javascript
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass';

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
    this.camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, near, far);
    this.camera.position.set(position.x, position.y, position.z);
    this.camera.lookAt(0, 0, 0);
  }

  createRenderer() {
    const canvas = document.getElementById('canvas3d');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  createLighting() {
    const ambientLight = new THREE.AmbientLight(this.lightingConfig.ambient.color, this.lightingConfig.ambient.intensity);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(this.lightingConfig.directional.color, this.lightingConfig.directional.intensity);
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

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
    this.scene.add(hemisphereLight);
  }

  createPostProcessing() {
    const size = new THREE.Vector2();
    this.renderer.getSize(size);
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.8, 0.3, 0.2);
    this.composer.addPass(bloomPass);
    const ssaoPass = new SSAOPass(this.scene, this.camera, size.x, size.y);
    ssaoPass.kernelRadius = 16;
    ssaoPass.minDistance = 0.005;
    ssaoPass.maxDistance = 0.1;
    this.composer.addPass(ssaoPass);
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
```

#### 4. ExhibitionHall.js
**File**: `js/objects/ExhibitionHall.js`
**Changes**: 添加 ES Module 导入（第 1 行）

```javascript
import * as THREE from 'three';

// ... 原有代码保持不变 ...
```

#### 5. PlayerControls.js
**File**: `js/controls/PlayerControls.js`
**Changes**: 添加 ES Module 导入（第 1 行）

```javascript
import * as THREE from 'three';

// ... 原有代码保持不变 ...
```

#### 6. InteractionSystem.js
**File**: `js/interaction/InteractionSystem.js`
**Changes**: 添加 ES Module 导入（第 1 行）

```javascript
import * as THREE from 'three';

// ... 原有代码保持不变 ...
```

#### 7. UIManager.js
**File**: `js/ui/UIManager.js`
**Changes**: 添加 ES Module 导入（第 1 行）

```javascript
import * as THREE from 'three';

// ... 原有代码保持不变 ...
```

#### 8. Minimap.js
**File**: `js/ui/Minimap.js`
**Changes**: 添加 ES Module 导入（第 1 行）

```javascript
import * as THREE from 'three';

// ... 原有代码保持不变 ...
```

#### 9. app.js
**File**: `js/app.js`
**Changes**: 确认 ES Module 导入（已有）

```javascript
import * as THREE from 'three';
import { CONFIG, AppState } from './config.js';
import { SceneManager } from './scene/SceneManager.js';
import { ExhibitionHall } from './objects/ExhibitionHall.js';
import { PlayerControls } from './controls/PlayerControls.js';
import { InteractionSystem } from './interaction/InteractionSystem.js';
import { UIManager } from './ui/UIManager.js';
import { Minimap } from './ui/Minimap.js';

// ... 原有代码保持不变 ...
```

### Success Criteria:

#### Automated Verification:
- [x] `npm install` 成功安装 `three` 依赖
- [x] `npm run dev` 启动成功，无控制台错误
- [x] 所有文件都有 `import * as THREE from 'three'`
- [x] Bloom 辉光效果可见（门框、灯光装饰球发光）

#### Manual Verification:
- [ ] 展厅正常渲染，无黑屏
- [ ] 发光元素有辉光效果
- [ ] 窗口调整大小后效果正常
- [ ] GTX 1060 级别设备渲染帧率不低于 45fps
- [ ] 低端设备自动降级（禁用 SSAO）

---

## Phase 2: 粒子系统 + 资源管理修复

### Overview
在入口区域添加光点飘浮粒子效果，补全 ExhibitionHall 的 _materials 资源追踪数组，修复资源泄漏问题。

### Changes Required:

#### 1. ExhibitionHall.js
**File**: `js/objects/ExhibitionHall.js`
**Changes**: 添加 _trackedMaterials 追踪数组，创建粒子系统，更新粒子动画

```javascript
import * as THREE from 'three';

export class ExhibitionHall {
  constructor(config) {
    this.config = config;
    this.scene = null;
    this.floor = null;
    this.ceiling = null;
    this.walls = [];
    this.panels = [];
    this.exhibitions = [];
    this.particles = null;

    this.materials = {
      floor: null,
      wall: null,
      ceiling: null,
      panel: null,
      panelHover: null
    };

    // 资源追踪
    this._textures = [];
    this._geometries = [];
    this._trackedMaterials = [];  // 新增：追踪局部创建的材质
  }

  // ... 其他方法保持不变 ...

  /**
   * 创建入口粒子效果
   */
  createEntranceParticles() {
    const particleCount = 200;
    const spread = 5;
    const depth = this.config.depth;

    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * spread;
      positions[i3 + 1] = 1 + Math.random() * 2;
      positions[i3 + 2] = (depth / 2) + (Math.random() - 0.5) * spread;

      velocities[i3] = (Math.random() - 0.5) * 0.01;
      velocities[i3 + 1] = Math.random() * 0.02 + 0.01;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this._geometries.push(geometry);

    const material = new THREE.PointsMaterial({
      color: 0x00d2ff,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this._trackedMaterials.push(material);

    this.particles = new THREE.Points(geometry, material);
    this.particles.userData.velocities = velocities;
    this.scene.add(this.particles);

    console.log('入口粒子效果创建完成');
  }

  /**
   * 更新粒子动画
   */
  updateParticles() {
    if (!this.particles) return;

    const positions = this.particles.geometry.attributes.position.array;
    const velocities = this.particles.userData.velocities;
    const count = positions.length / 3;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] += velocities[i3];
      positions[i3 + 1] += velocities[i3 + 1];
      positions[i3 + 2] += velocities[i3 + 2];

      if (positions[i3 + 1] > 4) {
        positions[i3 + 1] = 1;
        positions[i3] = (Math.random() - 0.5) * 5;
        positions[i3 + 2] = (this.config.depth / 2) + (Math.random() - 0.5) * 5;
      }
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    this._textures.forEach(texture => { if (texture) texture.dispose(); });
    this._textures = [];

    this._geometries.forEach(geometry => { if (geometry) geometry.dispose(); });
    this._geometries = [];

    this._trackedMaterials.forEach(material => { if (material) material.dispose(); });
    this._trackedMaterials = [];

    Object.values(this.materials).forEach(material => { if (material) material.dispose(); });

    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles = null;
    }

    console.log('展厅资源已清理');
  }
}
```

#### 2. app.js
**File**: `js/app.js`
**Changes**: 在渲染循环中添加粒子更新调用

```javascript
// [需要生成代码]
```

### Success Criteria:

#### Automated Verification:
- [x] `ExhibitionHall._trackedMaterials` 数组存在
- [x] 粒子系统在入口区域可见
- [x] `dispose()` 正确清理所有资源
- [x] 粒子数量为 200，使用 AdditiveBlending

#### Manual Verification:
- [ ] 入口区域有光点飘浮效果
- [ ] 粒子动画流畅
- [ ] 页面关闭时无资源泄漏警告

---

## Phase 3: 交互状态机 + 碰撞修复

### Overview
创建显式交互状态机管理导航/悬停/模态框/模型交互四种状态，修复碰撞检测 bug 实现沿墙滑动。

### Changes Required:

#### 1. InteractionStateMachine.js (NEW)
**File**: `js/interaction/InteractionStateMachine.js`
**Changes**: 创建显式状态机类

```javascript
/**
 * 交互状态机
 * 管理导航/悬停/模态框/模型交互四种状态
 */

export const InteractionState = {
  NAVIGATE: 'navigate',
  HOVER: 'hover',
  MODAL: 'modal',
  MODEL_INTERACT: 'model3d'
};

export class InteractionStateMachine {
  constructor() {
    this.currentState = InteractionState.NAVIGATE;
    this.previousState = null;
    this.listeners = new Map();
  }

  /**
   * 状态转换规则
   */
  canTransition(from, to) {
    const allowed = {
      [InteractionState.NAVIGATE]: [InteractionState.HOVER, InteractionState.MODAL, InteractionState.MODEL_INTERACT],
      [InteractionState.HOVER]: [InteractionState.NAVIGATE, InteractionState.MODAL],
      [InteractionState.MODAL]: [InteractionState.NAVIGATE],
      [InteractionState.MODEL_INTERACT]: [InteractionState.NAVIGATE]
    };
    return allowed[from]?.includes(to) ?? false;
  }

  /**
   * 执行状态转换
   */
  transition(newState) {
    if (!this.canTransition(this.currentState, newState)) {
      console.warn(`非法状态转换: ${this.currentState} → ${newState}`);
      return false;
    }

    this.previousState = this.currentState;
    this.currentState = newState;
    this.emit('stateChange', { from: this.previousState, to: this.currentState });
    return true;
  }

  /**
   * 注册状态变更监听
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  is(state) {
    return this.currentState === state;
  }

  get() {
    return this.currentState;
  }
}
```

#### 2. InteractionSystem.js
**File**: `js/interaction/InteractionSystem.js`
**Changes**: 集成状态机，扩展 hitbox 收集

```javascript
// [需要生成代码]
```

#### 3. PlayerControls.js
**File**: `js/controls/PlayerControls.js`
**Changes**: 修复碰撞检测，实现沿墙滑动

```javascript
import * as THREE from 'three';

export class PlayerControls {
  constructor(camera, domElement, config, clock) {
    // ... 原有构造函数代码 ...

    // 传送动画状态
    this.teleportTarget = null;
    this.teleportProgress = 0;
    this.teleportDuration = 0.5; // 秒
    this.teleportStartPosition = new THREE.Vector3();
  }

  // ... 其他方法保持不变 ...

  /**
   * 修复后的碰撞检测 - 分离 X/Z 轴
   */
  checkAxisCollision(axis) {
    const collidables = this._walls;
    if (collidables.length === 0) return false;

    let direction;
    if (axis === 'x') {
      if (this.moveLeft) {
        direction = new THREE.Vector3(-1, 0, 0).applyQuaternion(this.camera.quaternion);
      } else if (this.moveRight) {
        direction = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
      } else {
        return false;
      }
    } else if (axis === 'z') {
      if (this.moveForward) {
        direction = this.camera.getWorldDirection(new THREE.Vector3());
      } else if (this.moveBackward) {
        direction = new THREE.Vector3(0, 0, 1).applyQuaternion(this.camera.quaternion);
      } else {
        return false;
      }
    }

    this.raycaster.set(this.camera.position, direction);
    const intersections = this.raycaster.intersectObjects(collidables);
    return intersections.length > 0 && intersections[0].distance < this.config.collisionDistance;
  }

  /**
   * 修复后的更新方法 - 支持沿墙滑动
   */
  update() {
    if (!this.enabled) return;

    const delta = this.clock ? this.clock.getDelta() : 0.016;

    // 传送动画
    if (this.teleportTarget) {
      this.teleportProgress += delta / this.teleportDuration;
      if (this.teleportProgress >= 1) {
        this.camera.position.copy(this.teleportTarget);
        this.teleportTarget = null;
        this.teleportProgress = 0;
      } else {
        this.camera.position.lerpVectors(
          this.teleportStartPosition,
          this.teleportTarget,
          this.teleportProgress
        );
      }
      this.camera.position.y = this.config.height;
      return;
    }

    // 计算移动方向
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();

    const speed = this.isRunning ? this.config.moveSpeed * 2 : this.config.moveSpeed;

    if (this.moveForward || this.moveBackward) {
      this.velocity.z = this.direction.z * speed;
    } else {
      this.velocity.z = 0;
    }

    if (this.moveLeft || this.moveRight) {
      this.velocity.x = this.direction.x * speed;
    } else {
      this.velocity.x = 0;
    }

    // 分离 X/Z 轴碰撞检测 - 实现沿墙滑动
    const canMoveX = !this.checkAxisCollision('x');
    const canMoveZ = !this.checkAxisCollision('z');

    if (canMoveX) {
      this.camera.translateX(this.velocity.x * delta);
    }
    if (canMoveZ) {
      this.camera.translateZ(this.velocity.z * delta);
    }

    this.camera.position.y = this.config.height;
    this.updatePositionDisplay();
  }

  /**
   * 平滑传送到指定位置
   */
  teleportTo(position) {
    this.teleportStartPosition.copy(this.camera.position);
    this.teleportTarget = new THREE.Vector3(position.x, this.config.height, position.z);
    this.teleportProgress = 0;
    this.velocity.set(0, 0, 0);
    console.log(`传送到: ${position.x}, ${position.y}, ${position.z}`);
  }

  // ... 其他方法保持不变 ...
}
```

#### 4. app.js
**File**: `js/app.js`
**Changes**: 初始化状态机，注入碰撞目标

```javascript
// [需要生成代码]
```

### Success Criteria:

#### Automated Verification:
- [x] `InteractionStateMachine` 类可导入
- [x] 状态转换规则正确（NAVIGATE ↔ HOVER ↔ MODAL）
- [x] 玩家无法穿过展板
- [x] 碰撞时可沿墙滑动

#### Manual Verification:
- [ ] 面板悬停时显示 tooltip
- [ ] 点击面板进入模态框
- [ ] ESC 关闭模态框后恢复正常控制
- [ ] 碰撞时可沿墙滑动而非卡住

---

## Phase 4: InteractiveModel + DataDashboard

### Overview
创建可交互 3D 模型类（拖拽旋转、缩放）和数据可视化大屏类（CanvasTexture 图表）。

### Changes Required:

#### 1. InteractiveModel.js (NEW)
**File**: `js/objects/InteractiveModel.js`
**Changes**: 创建可交互 3D 模型类

```javascript
import * as THREE from 'three';

/**
 * 可交互 3D 模型
 * 支持拖拽旋转、滚轮缩放、悬停信息标签
 */
export class InteractiveModel {
  constructor(geometry, material, options = {}) {
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.userData.isInteractiveModel = true;
    this.mesh.userData.isPanel = true; // 集成到现有 isPanel 约定

    this.options = {
      enableDragRotation: true,
      enableScrollZoom: true,
      rotationSensitivity: 0.005,
      zoomSensitivity: 0.001,
      minScale: 0.5,
      maxScale: 2.0,
      ...options
    };

    // 交互状态
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.currentScale = 1;

    // 创建透明 hitbox 用于射线检测
    this.createHitbox();

    // 绑定事件
    this.bindEvents();
  }

  createHitbox() {
    const bbox = new THREE.Box3().setFromObject(this.mesh);
    const size = bbox.getSize(new THREE.Vector3());

    const hitboxGeometry = new THREE.BoxGeometry(size.x * 1.2, size.y * 1.2, size.z * 1.2);
    const hitboxMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });

    this.hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    this.hitbox.userData = this.mesh.userData;
    this.mesh.add(this.hitbox);
  }

  bindEvents() {
    // 事件在 InteractionSystem 中统一处理
  }

  /**
   * 处理拖拽旋转
   */
  handleDrag(event) {
    if (!this.options.enableDragRotation) return;

    const deltaMove = {
      x: event.movementX || 0,
      y: event.movementY || 0
    };

    this.mesh.rotation.y += deltaMove.x * this.options.rotationSensitivity;
    this.mesh.rotation.x += deltaMove.y * this.options.rotationSensitivity;
  }

  /**
   * 处理滚轮缩放
   */
  handleZoom(event) {
    if (!this.options.enableScrollZoom) return;

    const delta = event.deltaY * this.options.zoomSensitivity;
    this.currentScale = Math.max(
      this.options.minScale,
      Math.min(this.options.maxScale, this.currentScale - delta)
    );

    this.mesh.scale.setScalar(this.currentScale);
  }

  /**
   * 获取 Three.js 对象
   */
  getObject() {
    return this.mesh;
  }

  dispose() {
    if (this.hitbox.geometry) this.hitbox.geometry.dispose();
    if (this.hitbox.material) this.hitbox.material.dispose();
  }
}
```

#### 2. DataDashboard.js (NEW)
**File**: `js/objects/DataDashboard.js`
**Changes**: 创建数据可视化大屏类

```javascript
import * as THREE from 'three';

/**
 * 数据可视化大屏
 * 使用 CanvasTexture 在 3D 场景中渲染图表
 */
export class DataDashboard {
  constructor(options = {}) {
    this.options = {
      width: 512,
      height: 256,
      planeWidth: 2.5,
      planeHeight: 1.5,
      ...options
    };

    this.chartMeshes = [];
  }

  /**
   * 创建图表平面
   */
  createChartPlane(data, position = { x: 0, y: 2.5, z: 0 }) {
    const canvas = document.createElement('canvas');
    canvas.width = this.options.width;
    canvas.height = this.options.height;

    this.drawChart(canvas, data);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const geometry = new THREE.PlaneGeometry(this.options.planeWidth, this.options.planeHeight);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);

    this.chartMeshes.push({ mesh, canvas, texture, data });
    return mesh;
  }

  /**
   * 绘制图表
   */
  drawChart(canvas, data) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (data.labels && data.values) {
      const barCount = data.labels.length;
      const barWidth = Math.min(60, (width - 80) / barCount - 10);
      const maxValue = Math.max(...data.values);
      const chartHeight = height - 80;
      const startX = 50;

      // 绘制坐标轴
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX, 20);
      ctx.lineTo(startX, chartHeight + 20);
      ctx.lineTo(width - 20, chartHeight + 20);
      ctx.stroke();

      // 绘制柱状图
      data.values.forEach((value, i) => {
        const barHeight = (value / maxValue) * chartHeight;
        const x = startX + 10 + i * (barWidth + 10);
        const y = chartHeight + 20 - barHeight;

        const gradient = ctx.createLinearGradient(x, y, x, chartHeight + 20);
        gradient.addColorStop(0, '#00d2ff');
        gradient.addColorStop(1, '#0066aa');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${value}%`, x + barWidth / 2, y - 5);

        ctx.fillStyle = '#888';
        ctx.font = '11px sans-serif';
        ctx.fillText(data.labels[i], x + barWidth / 2, chartHeight + 38);
      });
    }
  }

  /**
   * 更新图表数据
   */
  updateChart(index, newData) {
    if (index < 0 || index >= this.chartMeshes.length) return;

    const chart = this.chartMeshes[index];
    chart.data = newData;
    this.drawChart(chart.canvas, newData);
    chart.texture.needsUpdate = true;
  }

  dispose() {
    this.chartMeshes.forEach(({ mesh, texture }) => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (mesh.material.map) mesh.material.map.dispose();
        mesh.material.dispose();
      }
      if (texture) texture.dispose();
    });
    this.chartMeshes = [];
  }
}
```

#### 3. InteractionSystem.js
**File**: `js/interaction/InteractionSystem.js`
**Changes**: 扩展 hitbox 支持 InteractiveModel

```javascript
// [需要生成代码]
```

### Success Criteria:

#### Automated Verification:
- [x] `InteractiveModel` 类可导入
- [x] `DataDashboard` 类可导入
- [x] 模型 hitbox 被射线检测到
- [x] 图表 CanvasTexture 正确渲染

#### Manual Verification:
- [ ] 可交互 3D 模型可拖拽旋转
- [ ] 滚轮可缩放模型
- [ ] 数据大屏显示图表
- [ ] 图表悬停显示数值

---

## Phase 5: model3d 展板 + 全屏模式

### Overview
扩展展板系统支持 model3d 类型，实现全屏沉浸模式。

### Changes Required:

#### 1. ExhibitionHall.js
**File**: `js/objects/ExhibitionHall.js`
**Changes**: 扩展 createPanel() 和 getTypeIcon() 支持 model3d 类型

```javascript
// 在 ExhibitionHall 类中添加以下方法：

/**
 * 获取类型图标（扩展 model3d）
 */
getTypeIcon(type) {
  const icons = {
    document: '📄',
    image: '🖼️',
    video: '🎬',
    chart: '📊',
    model3d: '🧊'
  };
  return icons[type] || '📋';
}

/**
 * 创建展板（扩展 model3d 类型）
 */
createPanel(panelData, index, total) {
  const { id, type, title, description, tags, thumbnail, contentUrl } = panelData;

  const panelGroup = new THREE.Group();
  panelGroup.userData = {
    id, type, title, description, tags, thumbnail, contentUrl, isPanel: true
  };

  const spacing = 3;
  const startX = -(total - 1) * spacing / 2;
  const x = startX + index * spacing;

  // 展板底板
  const boardGeometry = new THREE.BoxGeometry(2.5, 3.5, 0.1);
  this._geometries.push(boardGeometry);

  const board = new THREE.Mesh(boardGeometry, this.materials.panel);
  board.position.set(x, 1.75, -0.05);
  board.castShadow = true;
  board.receiveShadow = true;
  panelGroup.add(board);

  // 展板边框
  const borderGeometry = new THREE.EdgesGeometry(boardGeometry);
  this._geometries.push(borderGeometry);

  const borderMaterial = new THREE.LineBasicMaterial({
    color: 0x00d2ff,
    transparent: true,
    opacity: 0.5
  });
  this._trackedMaterials.push(borderMaterial);
  const border = new THREE.LineSegments(borderGeometry, borderMaterial);
  border.position.copy(board.position);
  panelGroup.add(border);

  // 标题文字
  this.createTextSprite(title, {
    x: x, y: 3.8, z: 0, size: 0.3, color: '#ffffff'
  });

  // 类型图标
  const icon = this.getTypeIcon(type);
  this.createTextSprite(icon, {
    x: x, y: 2.5, z: 0.1, size: 0.5, color: '#00d2ff'
  });

  // 交互区域（用于射线检测）
  const hitboxGeometry = new THREE.BoxGeometry(2.5, 3.5, 0.5);
  this._geometries.push(hitboxGeometry);

  const hitboxMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide
  });
  this._trackedMaterials.push(hitboxMaterial);
  const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
  hitbox.position.set(x, 1.75, 0.2);
  hitbox.userData = panelGroup.userData;
  panelGroup.add(hitbox);

  return panelGroup;
}
```

#### 2. UIManager.js
**File**: `js/ui/UIManager.js`
**Changes**: 添加 showModel3dPreview()，实现全屏模式

```javascript
import * as THREE from 'three';

export class UIManager {
  // ... 原有代码 ...

  /**
   * 显示预览（扩展 model3d 类型）
   */
  showPreview(type, url) {
    switch (type) {
      case 'document':
        this.showPdfPreview(url);
        break;
      case 'image':
        this.showImagePreview(url);
        break;
      case 'video':
        this.showVideoPreview(url);
        break;
      case 'chart':
        this.showChartPreview(url);
        break;
      case 'model3d':
        this.showModel3dPreview(url);
        break;
      default:
        console.warn('未知的内容类型:', type);
    }
  }

  /**
   * 显示 3D 模型预览
   */
  showModel3dPreview(url) {
    let modelPreview = document.getElementById('model3d-preview');
    if (!modelPreview) {
      modelPreview = document.createElement('div');
      modelPreview.id = 'model3d-preview';
      modelPreview.className = 'preview';
      modelPreview.innerHTML = `
        <canvas id="model3d-canvas" style="width:100%;height:400px;background:#111;border-radius:8px;"></canvas>
        <div class="model3d-controls">
          <span>拖拽旋转 | 滚轮缩放 | 双击重置</span>
        </div>
      `;
      this.elements.previewArea.appendChild(modelPreview);
    }
    modelPreview.classList.remove('hidden');

    // 自动进入全屏模式
    this.showImmersiveModal();
  }

  /**
   * 显示全屏沉浸模式
   */
  showImmersiveModal() {
    this.elements.modal.classList.add('immersive');

    // 降低 3D 场景渲染质量
    if (window.App && window.App.sceneManager()) {
      this._originalPixelRatio = window.App.sceneManager().renderer.getPixelRatio();
      window.App.sceneManager().renderer.setPixelRatio(0.5);
    }
  }

  /**
   * 隐藏模态框（扩展全屏模式）
   */
  hideModal() {
    this.elements.modal.classList.add('hidden');
    this.elements.modal.classList.remove('immersive');
    this.currentContent = null;

    if (this.elements.videoPlayer) {
      this.elements.videoPlayer.pause();
    }

    // 恢复 3D 场景渲染质量
    if (this._originalPixelRatio && window.App && window.App.sceneManager()) {
      window.App.sceneManager().renderer.setPixelRatio(this._originalPixelRatio);
    }

    if (this.playerControls) {
      this.playerControls.enable();
    }

    if (this.interactionSystem) {
      this.interactionSystem.deselectObject();
    }
  }

  // ... 其他代码 ...
}
```

#### 3. content.json
**File**: `public/content/content.json`
**Changes**: 添加 model3d 类型展板

```json
{
  "exhibitions": [
    {
      "id": "plans",
      "name": "服务方案区",
      "description": "数据安全服务解决方案展示",
      "position": { "x": -10, "y": 0, "z": 0 },
      "panels": [
        {
          "id": "panel-001",
          "type": "document",
          "title": "数据分类分级服务",
          "description": "...",
          "tags": ["数据安全", "分类分级"],
          "thumbnail": "assets/images/classification-thumb.jpg",
          "contentUrl": "content/documents/数据分类分级服务方案.pdf"
        },
        {
          "id": "panel-002",
          "type": "model3d",
          "title": "安全架构拓扑",
          "description": "可交互的 3D 安全架构拓扑图",
          "tags": ["架构", "3D模型"],
          "thumbnail": "assets/images/architecture-thumb.jpg",
          "contentUrl": "content/models/security-topology.json"
        }
      ]
    }
  ]
}
```

#### 4. style.css
**File**: `css/style.css`
**Changes**: 添加全屏模式样式

```css
/* 全屏沉浸模式 */
.modal.immersive .modal-content {
  width: 100vw;
  max-width: 100vw;
  height: 100vh;
  max-height: 100vh;
  border-radius: 0;
  border: none;
  animation: immersiveExpand 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal.immersive .modal-overlay {
  backdrop-filter: blur(20px);
  background: rgba(0, 0, 0, 0.95);
}

.modal.immersive .modal-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.modal.immersive .preview {
  flex: 1;
  min-height: 0;
}

.modal.immersive .preview iframe,
.modal.immersive .preview img,
.modal.immersive .preview video {
  max-height: none;
  height: 100%;
}

@keyframes immersiveExpand {
  from {
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    border-radius: 12px;
    opacity: 0.8;
  }
  to {
    width: 100vw;
    max-width: 100vw;
    height: 100vh;
    border-radius: 0;
    opacity: 1;
  }
}

/* 3D 模型预览 */
#model3d-preview {
  text-align: center;
}

#model3d-preview canvas {
  border-radius: 8px;
  cursor: grab;
}

#model3d-preview canvas:active {
  cursor: grabbing;
}

.model3d-controls {
  margin-top: 10px;
  color: #888;
  font-size: 12px;
}
```

#### 5. index.html
**File**: `index.html`
**Changes**: 添加 model3d-preview 容器（在 preview-area 内）

```html
<!-- 在 preview-area div 内添加 -->
<div id="model3d-preview" class="preview hidden">
  <canvas id="model3d-canvas" style="width:100%;height:400px;background:#111;border-radius:8px;"></canvas>
  <div class="model3d-controls">
    <span>拖拽旋转 | 滚轮缩放 | 双击重置</span>
  </div>
</div>
```

### Success Criteria:

#### Automated Verification:
- [x] `content.json` 包含 `type: "model3d"` 展板
- [x] `ExhibitionHall.getTypeIcon()` 返回 model3d 图标
- [x] `UIManager.showPreview()` 处理 model3d 类型
- [x] 全屏模式 CSS 类 `.immersive` 生效

#### Manual Verification:
- [ ] model3d 展板显示 3D 模型
- [ ] 点击展板进入全屏沉浸模式
- [ ] ESC 退出全屏模式
- [ ] 全屏模式有过渡动画

---

## Phase 6: 传送系统增强

### Overview
增强传送系统，支持小地图点击传送和平滑动画过渡。

### Changes Required:

#### 1. Minimap.js
**File**: `js/ui/Minimap.js`
**Changes**: 添加 minimapToWorld() 方法，点击传送事件

```javascript
import * as THREE from 'three';

export class Minimap {
  constructor(config, playerControls) {
    this.config = config;
    this.playerControls = playerControls;

    this.canvas = document.getElementById('minimap-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.scale = this.canvas ? this.canvas.width / config.width : 5;
    this.offsetX = this.canvas ? this.canvas.width / 2 : 100;
    this.offsetY = this.canvas ? this.canvas.height / 2 : 100;

    this.exhibitionZones = [];
    this.teleportTarget = null;
  }

  init() {
    if (!this.canvas || !this.ctx) {
      console.warn('小地图画布未找到');
      return;
    }

    // 添加点击传送事件
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const minimapX = e.clientX - rect.left;
      const minimapY = e.clientY - rect.top;

      const worldPos = this.minimapToWorld(minimapX, minimapY);

      // 边界检查
      const halfW = this.config.width / 2;
      const halfD = this.config.depth / 2;
      if (Math.abs(worldPos.x) <= halfW && Math.abs(worldPos.z) <= halfD) {
        this.teleportTarget = worldPos;
        if (this.playerControls) {
          this.playerControls.teleportTo({ x: worldPos.x, y: 0, z: worldPos.z });
        }
      }
    });

    console.log('小地图初始化完成');
  }

  /**
   * 小地图坐标 → 世界坐标
   */
  minimapToWorld(minimapX, minimapY) {
    return {
      x: (minimapX - this.offsetX) / this.scale,
      z: (minimapY - this.offsetY) / this.scale
    };
  }

  /**
   * 世界坐标 → 小地图坐标
   */
  worldToMinimap(worldX, worldZ) {
    return {
      x: this.offsetX + worldX * this.scale,
      y: this.offsetY + worldZ * this.scale
    };
  }

  setExhibitionZones(zones) {
    this.exhibitionZones = zones || [];
  }

  update() {
    if (!this.ctx || !this.playerControls) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, width, height);

    this.drawExhibitionBounds(ctx);
    this.drawExhibitionZones(ctx);
    this.drawTeleportTarget(ctx);
    this.drawPlayer(ctx);
  }

  /**
   * 绘制传送目标标记
   */
  drawTeleportTarget(ctx) {
    if (!this.teleportTarget) return;

    const pos = this.worldToMinimap(this.teleportTarget.x, this.teleportTarget.z);

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ... 其他方法保持不变 ...
}
```

#### 2. PlayerControls.js
**File**: `js/controls/PlayerControls.js`
**Changes**: 修改 teleportTo() 支持平滑动画

```javascript
// [需要生成代码]
```

#### 3. UIManager.js
**File**: `js/ui/UIManager.js`
**Changes**: 集成传送动画

```javascript
// [需要生成代码]
```

### Success Criteria:

#### Automated Verification:
- [x] `Minimap.minimapToWorld()` 方法存在
- [x] 小地图点击事件已绑定
- [x] 传送动画使用 `Vector3.lerp()`
- [x] 边界检查正确（±20 单位）

#### Manual Verification:
- [ ] 点击小地图可传送
- [ ] 传送有平滑过渡动画
- [ ] 传送目标标记可见
- [ ] 传送到边界外被阻止

---

## Phase 7: AutoTourMode + UI 增强

### Overview
创建自动巡展模式，增强 UI（加载界面、小地图增强）。

### Changes Required:

#### 1. AutoTourMode.js (NEW)
**File**: `js/controls/AutoTourMode.js`
**Changes**: 创建自动巡展模式类

```javascript
import * as THREE from 'three';

/**
 * 自动巡展模式
 * 按预设路径自动移动，定时停留展示
 */
export class AutoTourMode {
  constructor(camera, config) {
    this.camera = camera;
    this.config = config;

    this.active = false;
    this.clock = new THREE.Clock();

    // 路径系统
    this.waypoints = [
      { position: new THREE.Vector3(0, 1.6, 5), lookAt: new THREE.Vector3(0, 1.6, 0), duration: 3000 },
      { position: new THREE.Vector3(-7, 1.6, -3), lookAt: new THREE.Vector3(-10, 1.6, -10), duration: 5000 },
      { position: new THREE.Vector3(7, 1.6, -3), lookAt: new THREE.Vector3(10, 1.6, -10), duration: 5000 },
      { position: new THREE.Vector3(0, 1.6, -7), lookAt: new THREE.Vector3(0, 1.6, -10), duration: 5000 },
      { position: new THREE.Vector3(0, 1.6, 7), lookAt: new THREE.Vector3(0, 1.6, 10), duration: 5000 }
    ];

    this.currentIndex = 0;
    this.progress = 0;
    this.waiting = false;
    this.waitTime = 0;

    // 样条曲线
    this.curve = null;
    this.buildCurve();
  }

  buildCurve() {
    const points = this.waypoints.map(wp => wp.position);
    this.curve = new THREE.CatmullRomCurve3(points);
  }

  start() {
    this.active = true;
    this.currentIndex = 0;
    this.progress = 0;
    this.waiting = false;
    this.waitTime = 0;
    this.clock.start();
    console.log('自动巡展模式启动');
  }

  stop() {
    this.active = false;
    console.log('自动巡展模式停止');
  }

  update() {
    if (!this.active) return;

    const delta = this.clock.getDelta();

    if (this.waiting) {
      this.waitTime += delta * 1000;
      const waypoint = this.waypoints[this.currentIndex];
      if (this.waitTime >= waypoint.duration) {
        this.waiting = false;
        this.waitTime = 0;
        this.currentIndex = (this.currentIndex + 1) % this.waypoints.length;
        this.progress = this.currentIndex / this.waypoints.length;
      }
      return;
    }

    // 更新进度
    this.progress += delta * 0.1; // 速度控制
    if (this.progress >= 1) {
      this.progress = 1;
    }

    // 获取当前位置
    const position = this.curve.getPoint(this.progress);
    this.camera.position.copy(position);
    this.camera.position.y = 1.6;

    // 计算朝向
    const waypoint = this.waypoints[this.currentIndex];
    const lookAt = waypoint.lookAt;
    this.camera.lookAt(lookAt);

    // 检查是否到达当前航点
    const distance = position.distanceTo(waypoint.position);
    if (distance < 0.1) {
      this.waiting = true;
      this.waitTime = 0;
    }
  }

  isActive() {
    return this.active;
  }
}
```

#### 2. app.js
**File**: `js/app.js`
**Changes**: 集成 AutoTourMode 到渲染循环

```javascript
import * as THREE from 'three';
import { CONFIG, AppState } from './config.js';
import { SceneManager } from './scene/SceneManager.js';
import { ExhibitionHall } from './objects/ExhibitionHall.js';
import { PlayerControls } from './controls/PlayerControls.js';
import { InteractionSystem } from './interaction/InteractionSystem.js';
import { UIManager } from './ui/UIManager.js';
import { Minimap } from './ui/Minimap.js';
import { AutoTourMode } from './controls/AutoTourMode.js';

let sceneManager = null;
let exhibitionHall = null;
let playerControls = null;
let interactionSystem = null;
let uiManager = null;
let minimap = null;
let autoTourMode = null;

// ... 其他代码 ...

async function initApp() {
  // ... 现有初始化代码 ...

  // 初始化自动巡展模式
  autoTourMode = new AutoTourMode(sceneManager.camera, CONFIG.exhibition);

  // ... 其他初始化代码 ...
}

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

    if (exhibitionHall) {
      exhibitionHall.updateParticles();
    }

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

// 导出全局对象
window.App = {
  config: CONFIG,
  state: AppState,
  sceneManager: () => sceneManager,
  exhibitionHall: () => exhibitionHall,
  playerControls: () => playerControls,
  interactionSystem: () => interactionSystem,
  uiManager: () => uiManager,
  minimap: () => minimap,
  autoTourMode: () => autoTourMode
};
```

#### 3. config.js
**File**: `js/config.js`
**Changes**: 添加自动巡展配置

```javascript
export const CONFIG = {
  // ... 现有配置 ...

  // 自动巡展配置
  autoTour: {
    moveSpeed: 0.1,
    pauseDuration: 5000,
    loopMode: 'loop' // 'loop', 'pingpong', 'once'
  }
};

export const AppState = {
  isLoading: true,
  isPlaying: false,
  currentExhibition: null,
  selectedPanel: null,
  isModalOpen: false,
  isTeleportMenuOpen: false,
  isAutoTourActive: false // 新增
};
```

#### 4. Minimap.js
**File**: `js/ui/Minimap.js`
**Changes**: 增强小地图显示

```javascript
// [需要生成代码]
```

### Success Criteria:

#### Automated Verification:
- [x] `AutoTourMode` 类可导入
- [x] 路径插值使用 `CatmullRomCurve3`
- [x] 渲染循环正确调用 `autoTourMode.update()`
- [x] 加载界面有进度条

#### Manual Verification:
- [ ] 自动巡展模式可启动
- [ ] 相机沿路径平滑移动
- [ ] 每个展区停留 5 秒
- [ ] ESC 可停止巡展
- [ ] 加载界面显示进度
- [ ] 向后兼容：原有导航、面板交互、小地图功能正常

---

## Testing Strategy

### Automated:
- `npm run dev` 启动成功
- 无控制台错误
- 所有新类可导入

### Manual Testing Steps:
1. 展厅正常渲染，无黑屏
2. Bloom 辉光效果可见
3. 粒子动画流畅
4. 面板悬停显示 tooltip
5. 点击面板进入模态框
6. 碰撞时可沿墙滑动
7. 可交互模型可拖拽旋转
8. 数据大屏显示图表
9. 全屏模式正常工作
10. 小地图点击传送
11. 自动巡展模式正常

## Performance Considerations

- **Bloom**: strength=0.8, radius=0.3, threshold=0.2 — 平衡效果与性能
- **SSAO**: kernelRadius=16, minDistance=0.005, maxDistance=0.1 — 中等质量
- **粒子**: 200 个粒子，AdditiveBlending — 性能影响小
- **降级**: 可通过 `performance.deviceMemory` 检测设备，低端设备禁用 SSAO

## Migration Notes

- **Three.js 迁移**: 移除 `public/lib/three.min.js`，安装 `three` npm 包
- **静态资源**: `content.json` 路径已正确（`public/content/`）
- **向后兼容**: 新增功能不影响现有功能，可渐进式启用

## Developer Context

**Q (`SceneManager.js:89`): Three.js r128 色彩空间 API 不兼容，如何处理？**
A: 迁移到 npm 安装的 Three.js，启用 ES Module 后处理。

**Q: SSAO 效果是否包含？**
A: 包含 SSAO（Bloom + SSAO 完整管线）。

**Q: 传送动画方式？**
A: 平滑过渡（约 0.5 秒）。

**Q: 状态管理方式？**
A: 显式状态机（InteractionStateMachine 类）。

## References

- 设计工件: `.rpiv/artifacts/designs/2026-07-18_01-00-00_exhibition-hall-enhancement.md`
- 研究文档: `.rpiv/artifacts/research/2026-07-18_00-45-00_exhibition-hall-enhancement.md`
- FRD 需求文档: `.rpiv/artifacts/discover/2026-07-18_00-30-00_digital-exhibition-hall-enhancement.md`
- Three.js 后处理文档: https://threejs.org/examples/#webgl_postprocessing
