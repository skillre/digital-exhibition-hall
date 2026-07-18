---
date: "2026-07-18T12:28:04+08:00"
author: skillre
commit: d37c3d9
branch: main
repository: 数字展厅
topic: "视觉重做·深蓝赛博科技数据风"
tags: [plan, visual-redesign, threejs, cyber-blue, tech-aesthetic]
status: ready
parent: ".rpiv/artifacts/designs/2026-07-18_visual-redesign-cyber-blue.md"
phase_count: 7
phases:
  - { n: 1, title: "Design Tokens 与色彩基调" }
  - { n: 2, title: "场景渲染基调" }
  - { n: 3, title: "科技空间骨架" }
  - { n: 4, title: "移除家具 + 中央装置" }
  - { n: 5, title: "HUD 标签 + 展板科技化" }
  - { n: 6, title: "环境动效系统" }
  - { n: 7, title: "数据可视化 + UI 统一收尾" }
last_updated: "2026-07-18T12:28:04+08:00"
last_updated_by: skillre
---

# 视觉重做·深蓝赛博科技数据风 Implementation Plan

## Overview

将数字展厅 3D 视觉从"传统拟物写实"（大理石/木材/盆栽/白墙）整体重做为"深蓝赛博科技数据风"，并统一 UI，使其具备科技感、数据感、安全感，达到可交付水准。本 plan 继承自 design artifact 的 7 个切片（slice ≡ phase，1:1），代码来自 design 的 `## Architecture`，Success Criteria 来自 design 的 `## Slices`（verbatim，slice-verifier 已验证）。

Design artifact: `.rpiv/artifacts/designs/2026-07-18_visual-redesign-cyber-blue.md`（status: ready）

## Desired End State

启动后：加载界面为深蓝赛博品牌动效 → 进入 3D 展厅，深蓝黑空间 + 青色发光网格地面（镜面反射倒影）→ 中央悬浮发光盾牌全息 + 旋转数据流粒子环 → 四面暗锐蓝墙面带嵌入式发光条 → 展板为半透明玻璃数据屏，表面显示缩略图+标题，青色发光边框，上方悬浮 HUD 标签（深色半透明+青色发光描边+矢量图标，无 emoji）→ 漫游时地面网格流光、数据流粒子上升、装置呼吸灯、展板悬浮微动 → 点击展板弹出深蓝赛博统一 UI 详情窗 → 整体科技感、数据感、安全感，可交付。

## What We're NOT Doing

- 移动端触屏适配改造
- 多人协作 / 真实 API 对接 / 语音导览
- 外部 glTF/GLB 模型加载（继续程序化生成）
- SSAO（本轮用 Bloom + 反射营造深度，SSAO 留待后续）
- 联网字体（离线部署约束，用系统字体）

## Phase 1: Design Tokens 与色彩基调

### Overview
建立深蓝赛博色板/材质/灯光参数单一来源（JS `THEME` + CSS `:root` 变量），改 config 背景为深蓝黑。所有后续 phase 引用这些 tokens。

### Changes Required:

#### 1. js/config.js（MODIFY — 完整重写）
**File**: `js/config.js`
**Changes**: 新增 `THEME` 视觉令牌（色板/材质/灯光/雾/Bloom 参数），改 `CONFIG.scene` 背景为深蓝黑、fog 用 exp2、`CONFIG.lighting` 暗冷色结构、相机 z=12。

```js
/**
 * 应用配置和状态
 * 视觉风格：深蓝赛博 Cyber Blue
 */

// 视觉设计令牌 — 深蓝赛博（单一来源，JS 侧；CSS 侧见 css/style.css :root）
export const THEME = {
  // 基调
  bgDeep: 0x050d1f,        // 深蓝黑 — 背景/雾
  surfaceDark: 0x0d1117,   // 暗锐蓝 — 墙面
  surfaceMid: 0x111722,    // 中间面 — 天花/展板底
  // 强调
  neon: 0x00d2ff,          // 青色霓虹 — 灯带/线框/数据点
  ice: 0x0066ff,           // 冰蓝 — 全息投影
  // 点缀
  safe: 0x00ff88,          // 翠绿 — 安全状态
  threat: 0xff00aa,        // 品红 — 威胁/告警
  // 材质参数
  floor: { color: 0x050d1f, roughness: 0.02, metalness: 0.98, envMapIntensity: 0.6 },
  wall: { color: 0x0d1117, roughness: 0.6, metalness: 0.2, envMapIntensity: 0.3 },
  panel: { color: 0x0a1628, emissive: 0x00d2ff, emissiveIntensity: 0.6 },
  // 灯光
  ambient: { color: 0x0a1a2e, intensity: 0.18 },
  directional: { color: 0x0066ff, intensity: 0.25 },
  hemisphere: { sky: 0x00d2ff, ground: 0x050d1f, intensity: 0.3 },
  accent: { color: 0x00d2ff, intensity: 0.6 },
  // 雾
  fog: { color: 0x050d1f, density: 0.018 },
  // 后处理
  bloom: { strength: 1.0, radius: 0.5, threshold: 0.3 },
};

// 全局配置
export const CONFIG = {
  scene: {
    backgroundColor: THEME.bgDeep,
    fog: {
      enabled: true,
      type: 'exp2',         // SceneManager 用 FogExp2
      color: THEME.fog.color,
      density: THEME.fog.density,
      near: 35, far: 80,    // 线性雾回退兼容
    },
  },

  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: { x: 0, y: 1.6, z: 12 },
  },

  lighting: {
    ambient: THEME.ambient,
    directional: { ...THEME.directional, position: { x: 5, y: 10, z: 5 } },
    hemisphere: THEME.hemisphere,
    accent: THEME.accent,
  },

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
```

#### 2. css/style.css（MODIFY — 顶部 :root + body；Phase 7 完成全量统一）
**File**: `css/style.css`
**Changes**: 新增 `:root` design tokens 变量，body 背景改深蓝黑。完整 UI 组件统一在 Phase 7 完成。

```css
/* 主样式文件 — 深蓝赛博 Cyber Blue */

:root {
  --bg-deep: #050d1f;
  --surface-dark: #0d1117;
  --surface-mid: #111722;
  --neon: #00d2ff;
  --ice: #0066ff;
  --safe: #00ff88;
  --threat: #ff00aa;
  --text: #cdeeff;
  --text-dim: #6f8aab;
  --border-glow: rgba(0, 210, 255, 0.4);
  --panel-bg: rgba(8, 16, 32, 0.72);
  --font-mono: 'SF Mono', 'JetBrains Mono', 'Menlo', 'Consolas', monospace;
  --font-sans: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  width: 100%; height: 100%; overflow: hidden;
  font-family: var(--font-sans);
  background: var(--bg-deep);
  color: var(--text);
}

#app { width: 100%; height: 100%; position: relative; }
#canvas3d { width: 100%; height: 100%; display: block; }
```

### Success Criteria:

#### Automated Verification:
- [x] 浅灰基调已移除：`grep -n "0xd0d4dc" js/config.js` 无输出
- [x] JS tokens 已建立：`grep -n "export const THEME" js/config.js` 返回 1
- [x] CSS tokens 已建立：`grep -n "--neon" css/style.css` 返回 >= 1
- [x] 构建通过：`npm run build`（先 `rm -rf node_modules && npm install` 修复 rollup）

#### Manual Verification:
- [ ] `config.js` THEME 色板与 `css/style.css :root` 变量色值逐一对应一致
- [ ] 页面 body 背景渲染为深蓝黑 `#050d1f`（非浅灰 `#d0d4dc`）
- [ ] UI 文字色为浅青蓝 `#cdeeff`，对比度可读

---

## Phase 2: 场景渲染基调

### Overview
SceneManager 改为暗冷色灯光、暗色科技环境贴图（替换暖色 RoomEnvironment）、Bloom 提强、FogExp2、曝光调整。

### Changes Required:

#### 1. js/scene/SceneManager.js（MODIFY）
**File**: `js/scene/SceneManager.js`
**Changes**: 移除 RoomEnvironment import、引入 THEME；createRenderer 曝光 1.0；createScene 支持 FogExp2；createEnvironment 自建暗色科技环境贴图；createLighting 暗冷色+青色补光；createPostProcessing Bloom 用 THEME.bloom。

```js
// === 改动1：import 调整 ===
// 移除：import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
// 新增：
import { THEME } from '../config.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

// === 改动2：createRenderer() 中曝光 0.8 → 1.0（暗场景提亮发光）===
//   this.renderer.toneMappingExposure = 1.0;

// === 改动3：createScene() —— 支持 FogExp2（整体替换）===
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

// === 改动4：createEnvironment() —— 暗色科技环境贴图（替换暖色 RoomEnvironment，整体替换）===
createEnvironment() {
  const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
  pmremGenerator.compileEquirectangularShader();
  // 自建暗色科技环境场景，为金属/玻璃表面提供反射内容（深色底 + 青色高光面）
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(THEME.bgDeep);
  const panelGeo = new THREE.PlaneGeometry(10, 10);
  const glow = new THREE.MeshBasicMaterial({ color: THEME.neon });
  const ice = new THREE.MeshBasicMaterial({ color: THEME.ice });
  const dark = new THREE.MeshBasicMaterial({ color: THEME.surfaceDark });
  const faces = [
    { mat: dark, pos: [0, -5, 0], rot: [-Math.PI/2, 0, 0] },
    { mat: dark, pos: [0, 5, 0], rot: [Math.PI/2, 0, 0] },
    { mat: glow, pos: [0, 0, -5], rot: [0, 0, 0] },
    { mat: dark, pos: [0, 0, 5], rot: [0, Math.PI, 0] },
    { mat: ice, pos: [-5, 0, 0], rot: [0, Math.PI/2, 0] },
    { mat: dark, pos: [5, 0, 0], rot: [0, -Math.PI/2, 0] },
  ];
  faces.forEach(f => {
    const m = new THREE.Mesh(panelGeo, f.mat);
    m.position.set(...f.pos); m.rotation.set(...f.rot);
    envScene.add(m);
  });
  const envTexture = pmremGenerator.fromScene(envScene).texture;
  this.scene.environment = envTexture;
  envScene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  panelGeo.dispose();
  pmremGenerator.dispose();
  console.log('暗色科技环境贴图生成完成');
}

// === 改动5：createLighting() —— 暗冷色 + 青色补光（整体替换）===
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
}

// === 改动6：createPostProcessing() —— Bloom 用 THEME.bloom 参数（替换原 bloomPass 构造）===
//   const bloomPass = new UnrealBloomPass(
//     new THREE.Vector2(size.x, size.y),
//     THEME.bloom.strength,   // 1.0
//     THEME.bloom.radius,    // 0.5
//     THEME.bloom.threshold  // 0.3
//   );

// === 改动7：扫描线后处理 pass（D7 轻扫描线）===
// 在 bloomPass 追加之后（composer 末位）：
const ScanlineShader = {
  uniforms: { tDiffuse: { value: null }, opacity: { value: 0.06 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float opacity; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); float s = sin(vUv.y * 800.0) * 0.5 + 0.5; c.rgb -= s * opacity; gl_FragColor = c; }`,
};
const scanlinePass = new ShaderPass(ScanlineShader);
this.composer.addPass(scanlinePass);
this._scanlinePass = scanlinePass;
```

### Success Criteria:

#### Automated Verification:
- [x] RoomEnvironment 引用已移除：`grep -n "RoomEnvironment" js/scene/SceneManager.js` 无输出
- [x] THEME 已引入：`grep -n "import { THEME }" js/scene/SceneManager.js` 返回 1
- [x] FogExp2 已用：`grep -n "FogExp2" js/scene/SceneManager.js` 返回 1
- [x] Bloom 参数来自 THEME：`grep -n "THEME.bloom" js/scene/SceneManager.js` 返回 >= 1
- [x] 扫描线 pass 已加：`grep -n "ScanlineShader\|scanlinePass" js/scene/SceneManager.js` 返回 >= 1
- [x] 构建通过：`npm run build`

#### Manual Verification:
- [ ] 场景背景为深蓝黑，金属/玻璃表面反射出青色高光（非暖色室内反射）
- [ ] 灯带/自发光物体产生可见 Bloom 辉光
- [ ] 雾为指数雾，远处自然没入深蓝黑（非浅灰线性雾）
- [ ] 画面有轻微 CRT 扫描线质感（细横线，不刺眼，opacity 0.06）

---

## Phase 3: 科技空间骨架

### Overview
ExhibitionHall 地面改深色镜面反射+发光网格，墙面改暗锐蓝+嵌入式发光条，天花板改暗色+青色灯带；删除大理石/白墙/方格天/墙裙/踢脚线/顶线等写实纹理与构件。

### Changes Required:

#### 1. js/objects/ExhibitionHall.js（MODIFY — Slice 3 段）
**File**: `js/objects/ExhibitionHall.js`
**Changes**: import THEME + Reflector；initMaterials 换科技材质；删除 drawMarbleTexture/drawWallTexture/drawCeilingTexture/createBaseboard/createCrownMolding/createWainscoting；createFloor 用 Reflector+网格；createWalls/createWall 暗锐蓝+发光条；createCeiling/createCeilingLights 暗色+青色灯带；dispose 增补反射器/网格释放。

```js
// ===== Slice 3: 科技空间骨架 =====

// --- 改动3.1：import 调整 ---
// 新增：
import { THEME } from '../config.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector';

// --- 改动3.2：initMaterials() 整体替换（删除大理石/白墙/方格天/木纹，换科技材质）---
initMaterials() {
  // 深色镜面地面材质（Reflector 主反射 + 叠加深色半透明）
  this.materials.floor = new THREE.MeshStandardMaterial({
    color: THEME.floor.color, roughness: THEME.floor.roughness,
    metalness: THEME.floor.metalness, envMapIntensity: THEME.floor.envMapIntensity
  });
  // 墙面：暗锐蓝
  this.materials.wall = new THREE.MeshStandardMaterial({
    color: THEME.wall.color, roughness: THEME.wall.roughness,
    metalness: THEME.wall.metalness, envMapIntensity: THEME.wall.envMapIntensity
  });
  // 天花板：暗色
  this.materials.ceiling = new THREE.MeshStandardMaterial({
    color: THEME.surfaceMid, roughness: 0.8, metalness: 0.1, envMapIntensity: 0.2
  });
  // 展板：半透明玻璃数据屏（Slice 5 细化）
  this.materials.panel = new THREE.MeshPhysicalMaterial({
    color: 0x0a1628, roughness: 0.1, metalness: 0.0,
    transparent: true, opacity: 0.55, transmission: 0.4, thickness: 0.2,
    emissive: THEME.neon, emissiveIntensity: 0.15, envMapIntensity: 0.8, ior: 1.4
  });
  this.materials.panelHover = new THREE.MeshPhysicalMaterial({
    color: 0x0a1628, roughness: 0.1, metalness: 0.0,
    transparent: true, opacity: 0.7, transmission: 0.3,
    emissive: THEME.neon, emissiveIntensity: 0.5, envMapIntensity: 0.8, ior: 1.4
  });
  // 发光金属条（线框/边框/发光条）
  this.materials.edgeGlow = new THREE.MeshStandardMaterial({
    color: THEME.neon, roughness: 0.3, metalness: 0.6,
    emissive: THEME.neon, emissiveIntensity: 0.8, envMapIntensity: 0.5
  });
  // 暗色结构金属
  this.materials.edgeDark = new THREE.MeshStandardMaterial({
    color: 0x1a2436, roughness: 0.5, metalness: 0.7, envMapIntensity: 0.4
  });
  // 删除：materials.wood、大理石/白墙/方格天纹理材质
}

// --- 改动3.3：删除写实纹理与构件函数 ---
// 删除整函数：drawMarbleTexture / drawWallTexture / drawCeilingTexture
// 删除整函数：createBaseboard / createCrownMolding / createWainscoting
// 保留：createProceduralTexture（科技纹理复用）

// --- 改动3.4：createFloor() 整体替换（Reflector 镜面反射 + 发光网格）---
createFloor() {
  const { width, depth } = this.config;
  // 镜面反射地面
  const reflectorGeo = new THREE.PlaneGeometry(width, depth);
  this._geometries.push(reflectorGeo);
  this.floor = new Reflector(reflectorGeo, {
    clipBias: 0.003,
    textureWidth: 512,   // 低分辨率省性能
    textureHeight: 512,
    color: THEME.bgDeep,
  });
  this.floor.rotation.x = -Math.PI / 2;
  this.floor.position.y = 0;
  this.scene.add(this.floor);
  // 叠加深色半透明面（让反射不会过亮，且可受阴影）
  const overlayGeo = new THREE.PlaneGeometry(width, depth);
  this._geometries.push(overlayGeo);
  const overlay = new THREE.Mesh(overlayGeo, this.materials.floor);
  overlay.rotation.x = -Math.PI / 2;
  overlay.position.y = 0.005;
  overlay.receiveShadow = true;
  this.scene.add(overlay);
  // 发光网格线
  const grid = new THREE.GridHelper(Math.max(width, depth), 40, THEME.neon, 0x0a1a2e);
  if (grid.material) {
    if (Array.isArray(grid.material)) grid.material.forEach(m => { m.transparent = true; m.opacity = 0.35; });
    else { grid.material.transparent = true; grid.material.opacity = 0.35; }
  }
  grid.position.y = 0.012;
  this.scene.add(grid);
  this._gridHelper = grid;
}

// --- 改动3.5：createWalls() + createWall() 整体替换（暗锐蓝墙 + 嵌入式发光条）---
createWalls() {
  const { width, height, depth, wallThickness } = this.config;
  const wallConfigs = [
    { size: [width, height, wallThickness], position: [0, height/2, -depth/2], rotation: [0,0,0] },
    { size: [width/2-2, height, wallThickness], position: [-width/4-1, height/2, depth/2], rotation: [0,0,0] },
    { size: [width/2-2, height, wallThickness], position: [width/4+1, height/2, depth/2], rotation: [0,0,0] },
    { size: [wallThickness, height, depth], position: [-width/2, height/2, 0], rotation: [0,0,0] },
    { size: [wallThickness, height, depth], position: [width/2, height/2, 0], rotation: [0,0,0] },
  ];
  wallConfigs.forEach(c => this.walls.push(this.createWall(c)));
}
createWall(config) {
  const { size, position, rotation } = config;
  const h = size[1];
  const geometry = new THREE.BoxGeometry(...size);
  this._geometries.push(geometry);
  const wall = new THREE.Mesh(geometry, this.materials.wall);
  wall.position.set(...position);
  wall.rotation.set(...rotation);
  wall.castShadow = true;
  wall.receiveShadow = true;
  this.scene.add(wall);
  // 顶部嵌入式发光条
  const isLongX = size[0] >= size[2];
  const stripGeo = new THREE.BoxGeometry(isLongX ? size[0] : 0.06, 0.04, isLongX ? 0.06 : size[2]);
  this._geometries.push(stripGeo);
  const strip = new THREE.Mesh(stripGeo, this.materials.edgeGlow);
  strip.position.set(position[0], h - 0.08, position[2]);
  this.scene.add(strip);
  // 底部发光踢脚线
  const baseGeo = new THREE.BoxGeometry(isLongX ? size[0] : 0.04, 0.03, isLongX ? 0.04 : size[2]);
  this._geometries.push(baseGeo);
  const base = new THREE.Mesh(baseGeo, this.materials.edgeGlow);
  base.position.set(position[0], 0.03, position[2]);
  this.scene.add(base);
  return wall;
}

// --- 改动3.6：createCeiling() + createCeilingLights() 整体替换（暗色天花 + 青色灯带）---
createCeiling() {
  const { width, height, depth } = this.config;
  const geometry = new THREE.PlaneGeometry(width, depth);
  this._geometries.push(geometry);
  this.ceiling = new THREE.Mesh(geometry, this.materials.ceiling);
  this.ceiling.position.y = height;
  this.ceiling.rotation.x = Math.PI / 2;
  this.scene.add(this.ceiling);
  this.createCeilingLights();
}
createCeilingLights() {
  const { width, height, depth } = this.config;
  const lightColor = THEME.neon;
  const rows = [-depth/4, 0, depth/4];
  const cols = [-width/4, 0, width/4];
  rows.forEach(z => cols.forEach(x => {
    const barGeo = new THREE.BoxGeometry(2.5, 0.04, 0.25);
    this._geometries.push(barGeo);
    const barMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: lightColor, emissiveIntensity: 2.0,
      roughness: 0.1, metalness: 0.0
    });
    this._trackedMaterials.push(barMat);
    this._ceilingBars = this._ceilingBars || [];
    this._ceilingBars.push(barMat);  // 供 Slice 6 灯带呼吸动效引用
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(x, height - 0.08, z);
    this.scene.add(bar);
    const light = new THREE.PointLight(lightColor, 0.5, 12);
    light.position.set(x, height - 0.3, z);
    this.scene.add(light);
  }));
}

// --- 改动3.7：dispose() 增补反射器与网格释放 ---
// 在 dispose() 末尾追加：
//   if (this.floor && this.floor.dispose) this.floor.dispose();
//   if (this._gridHelper) { this._gridHelper.geometry.dispose(); this._gridHelper.material.dispose(); }
```

### Success Criteria:

#### Automated Verification:
- [x] 写实纹理已删：`grep -n "drawMarbleTexture\|drawWallTexture\|drawCeilingTexture" js/objects/ExhibitionHall.js` 无输出
- [x] 墙裙/踢脚线已删：`grep -n "createBaseboard\|createCrownMolding\|createWainscoting" js/objects/ExhibitionHall.js` 无输出
- [x] Reflector 已用：`grep -n "Reflector" js/objects/ExhibitionHall.js` 返回 >= 1
- [x] 网格地面已用：`grep -n "GridHelper" js/objects/ExhibitionHall.js` 返回 1
- [x] 构建通过：`npm run build`

#### Manual Verification:
- [ ] 地面为深色镜面反射，可见上方物体倒影 + 青色发光网格
- [ ] 墙面为暗锐蓝，顶部/底部有青色发光条
- [ ] 天花板暗色，青色灯带发光（Bloom 辉光可见）
- [ ] 无大理石/白墙/墙裙/踢脚线残留

---

## Phase 4: 移除家具 + 中央装置

### Overview
删除 5 类写实家具函数，createDecorations/createEntrance/createFloorAccents 改科技风；新增 TechCenterpiece（盾牌全息+粒子环）；app.js 装配装置并接入渲染循环。

### Changes Required:

#### 1. js/objects/ExhibitionHall.js（MODIFY — Slice 4 段）
**File**: `js/objects/ExhibitionHall.js`
**Changes**: createDecorations 删家具调用；删除 createReceptionDesk/createBenches/createPottedPlants/createWallSconces/createInfoKiosks；createEntrance 改科技门框+全息门帘；createFloorAccents 改青色发光引导线。

```js
// ===== Slice 4: 移除家具 + 中央装置 =====

// --- 改动4.1：createDecorations() 整体替换（删除家具调用）---
createDecorations() {
  this.createEntrance();
  this.createExhibitionSigns();  // Slice 5 改 HUDLabel
  this.createFloorAccents();
  // 删除：createReceptionDesk / createBenches / createPottedPlants / createWallSconces / createInfoKiosks
}

// --- 改动4.2：删除家具函数（整函数删除）---
// 删除整函数：createReceptionDesk / createBenches / createPottedPlants / createWallSconces / createInfoKiosks

// --- 改动4.3：createEntrance() 整体替换（科技门框 + 全息门帘，删玻璃门/门把手/地垫）---
createEntrance() {
  const { width, height, depth } = this.config;
  const frameMat = this.materials.edgeGlow;
  const pillarGeo = new THREE.BoxGeometry(0.15, height, 0.3);
  this._geometries.push(pillarGeo);
  const lp = new THREE.Mesh(pillarGeo, frameMat); lp.position.set(-1.8, height/2, depth/2); this.scene.add(lp);
  const rp = new THREE.Mesh(pillarGeo, frameMat); rp.position.set(1.8, height/2, depth/2); this.scene.add(rp);
  const lintelGeo = new THREE.BoxGeometry(3.8, 0.15, 0.3);
  this._geometries.push(lintelGeo);
  const lintel = new THREE.Mesh(lintelGeo, frameMat); lintel.position.set(0, height-0.08, depth/2); this.scene.add(lintel);
  const veilGeo = new THREE.PlaneGeometry(3.5, height-0.3);
  this._geometries.push(veilGeo);
  const veilMat = new THREE.MeshBasicMaterial({
    color: THEME.neon, transparent: true, opacity: 0.08,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
  });
  this._trackedMaterials.push(veilMat);
  const veil = new THREE.Mesh(veilGeo, veilMat);
  veil.position.set(0, height/2, depth/2 + 0.05);
  this.scene.add(veil);
  // 招牌改用 HUDLabel（Slice 5 替换 createTextSprite 调用）
}

// --- 改动4.4：createFloorAccents() 整体替换（青色发光引导线）---
createFloorAccents() {
  const { width, depth } = this.config;
  const lineMat = this.materials.edgeGlow;
  [{sx:0.04,sy:0.012,sz:depth,px:0,pz:0},{sx:width,sy:0.012,sz:0.04,px:0,pz:0}].forEach(({sx,sy,sz,px,pz})=>{
    const geo = new THREE.BoxGeometry(sx,sy,sz);
    this._geometries.push(geo);
    const line = new THREE.Mesh(geo, lineMat);
    line.position.set(px, 0.013, pz);
    this.scene.add(line);
  });
}
```

#### 2. js/objects/TechCenterpiece.js（NEW）
**File**: `js/objects/TechCenterpiece.js`
**Changes**: 中央盾牌全息（ShapeGeometry+线框+数据核心）+ 数据流粒子环（600 粒子）+ 底部发光环；update(elapsed) 呼吸/旋转/悬浮；dispose 释放资源。

```js
import * as THREE from 'three';
import { THEME } from '../config.js';

/**
 * 中央标志装置 — 盾牌全息 + 数据流粒子环
 * 象征"防护屏障"，数据安全主题视觉锚点
 */
export class TechCenterpiece {
  constructor() {
    this.group = new THREE.Group();
    this.shield = null;
    this.particleRing = null;
    this._coreMesh = null;
    this._baseRing = null;
    this._materials = [];
    this._geometries = [];
    this._lastElapsed = 0;
  }

  create(scene, position = { x: 0, y: 3, z: 0 }) {
    this.scene = scene;
    this._baseY = position.y;
    this.group.position.set(position.x, position.y, position.z);
    this.createShield();
    this.createParticleRing();
    this.createBaseRing();
    scene.add(this.group);
    console.log('中央装置创建完成');
  }

  createShield() {
    const shape = new THREE.Shape();
    shape.moveTo(0, 1.2); shape.lineTo(0.85, 0.85); shape.lineTo(0.85, -0.15);
    shape.quadraticCurveTo(0.85, -0.85, 0, -1.25);
    shape.quadraticCurveTo(-0.85, -0.85, -0.85, -0.15);
    shape.lineTo(-0.85, 0.85); shape.lineTo(0, 1.2);
    const geo = new THREE.ShapeGeometry(shape);
    this._geometries.push(geo);
    const mat = new THREE.MeshBasicMaterial({
      color: THEME.neon, transparent: true, opacity: 0.22,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
    });
    this._materials.push(mat);
    this.shield = new THREE.Mesh(geo, mat);
    this.group.add(this.shield);
    const edges = new THREE.EdgesGeometry(geo);
    this._geometries.push(edges);
    const lineMat = new THREE.LineBasicMaterial({ color: THEME.neon, transparent: true, opacity: 0.9 });
    this._materials.push(lineMat);
    this.shield.add(new THREE.LineSegments(edges, lineMat));
    const coreGeo = new THREE.IcosahedronGeometry(0.32, 0);
    this._geometries.push(coreGeo);
    const coreMat = new THREE.MeshBasicMaterial({ color: THEME.ice, wireframe: true, transparent: true, opacity: 0.85 });
    this._materials.push(coreMat);
    this._coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.shield.add(this._coreMesh);
  }

  createParticleRing() {
    const count = 600;
    const radius = 2.2;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = radius + (Math.random() - 0.5) * 0.4;
      positions[i*3] = Math.cos(a) * r;
      positions[i*3+1] = (Math.random() - 0.5) * 0.3;
      positions[i*3+2] = Math.sin(a) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this._geometries.push(geo);
    const mat = new THREE.PointsMaterial({
      color: THEME.neon, size: 0.06, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    this._materials.push(mat);
    this.particleRing = new THREE.Points(geo, mat);
    this.group.add(this.particleRing);
  }

  createBaseRing() {
    const ringGeo = new THREE.TorusGeometry(2.2, 0.03, 8, 64);
    this._geometries.push(ringGeo);
    const ringMat = new THREE.MeshBasicMaterial({ color: THEME.neon, transparent: true, opacity: 0.6 });
    this._materials.push(ringMat);
    this._baseRing = new THREE.Mesh(ringGeo, ringMat);
    this._baseRing.rotation.x = Math.PI / 2;
    this._baseRing.position.y = -1.3;
    this.group.add(this._baseRing);
  }

  update(elapsed) {
    const delta = this._lastElapsed ? Math.min(elapsed - this._lastElapsed, 0.1) : 0.016;
    this._lastElapsed = elapsed;
    if (this.particleRing) this.particleRing.rotation.y += delta * 0.3;
    if (this.shield) {
      const pulse = 0.5 + Math.sin(elapsed * 1.5) * 0.3;
      this.shield.material.opacity = 0.15 + pulse * 0.2;
    }
    if (this._coreMesh) {
      this._coreMesh.rotation.y += delta * 0.5;
      this._coreMesh.rotation.x += delta * 0.2;
    }
    this.group.position.y = this._baseY + Math.sin(elapsed * 0.8) * 0.15;
  }

  dispose() {
    this._geometries.forEach(g => g && g.dispose());
    this._materials.forEach(m => m && m.dispose());
    if (this.scene) this.scene.remove(this.group);
  }
}
```

#### 3. js/app.js（MODIFY — Slice 4 段）
**File**: `js/app.js`
**Changes**: import TechCenterpiece；声明 techCenterpiece；initApp 创建展厅后实例化装置；渲染循环调 techCenterpiece.update(getElapsedTime)；window.App 导出追加。

```js
// ===== Slice 4: 装配中央装置 =====

// --- 改动4.5：import（在现有 import 块末追加）---
import { TechCenterpiece } from './objects/TechCenterpiece.js';

// --- 改动4.6：模块实例声明（在 `let autoTourMode = null;` 后）---
let techCenterpiece = null;

// --- 改动4.7：initApp() 中 exhibitionHall.create(scene) 之后实例化装置 ---
//   exhibitionHall.create(sceneManager.scene);
// 新增：
techCenterpiece = new TechCenterpiece();
techCenterpiece.create(sceneManager.scene, { x: 0, y: 3, z: 0 });

// --- 改动4.8：startRenderLoop() animate 中 exhibitionHall.updateParticles() 之后追加 ---
//   exhibitionHall.updateParticles();
// 新增（仅用 getElapsedTime，不消耗 getDelta 状态，避免与 PlayerControls 冲突）：
if (techCenterpiece) {
  techCenterpiece.update(sceneManager.clock.getElapsedTime());
}

// --- 改动4.9：window.App 导出追加 ---
//   techCenterpiece: () => techCenterpiece,
```

### Success Criteria:

#### Automated Verification:
- [x] 家具已删：`grep -n "createPottedPlants\|createBenches\|createWallSconces\|createReceptionDesk\|createInfoKiosks" js/objects/ExhibitionHall.js` 无输出
- [x] TechCenterpiece 已建：`grep -n "class TechCenterpiece" js/objects/TechCenterpiece.js` 返回 1
- [x] app.js 已装配：`grep -n "TechCenterpiece" js/app.js` 返回 >= 2
- [x] 渲染循环调用装置 update：`grep -n "techCenterpiece.update" js/app.js` 返回 1
- [x] 构建通过：`npm run build`

#### Manual Verification:
- [ ] 场景内无盆栽/长椅/壁灯/木质前台
- [ ] 中央有悬浮发光盾牌全息 + 旋转数据流粒子环 + 底部发光环
- [ ] 装置呼吸（透明度脉动）+ 悬浮微动
- [ ] 入口为发光金属门框 + 全息门帘（无玻璃门/门把手/地垫）

---

## Phase 5: HUD 标签 + 展板科技化

### Overview
新增 HUDLabel（深色半透明+青色发光描边+矢量图标替代 emoji）；createTextSprite 改 HUD 风格；createPanel 改玻璃数据屏+发光边框+CanvasTexture 缩略图标题；highlightPanel 改 emissive 提亮；删除 getTypeIcon。

### Changes Required:

#### 1. js/objects/HUDLabel.js（NEW）
**File**: `js/objects/HUDLabel.js`
**Changes**: HUDLabel 类（createLabel/createIcon）+ ICON_MAP + drawIcon（shield/document/image/video/chart/model3d 矢量图标）+ roundRect。零依赖系统字体。

```js
import * as THREE from 'three';

const COL = {
  bg: 'rgba(8, 16, 32, 0.78)',
  border: 'rgba(0, 210, 255, 0.7)',
  text: '#cdeeff',
  glow: '#00d2ff',
  dim: '#6f8aab',
};
const FONT_MONO = 'SF Mono, JetBrains Mono, Menlo, Consolas, monospace';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawIcon(ctx, type, cx, cy, s) {
  ctx.save();
  ctx.strokeStyle = COL.glow; ctx.fillStyle = COL.glow;
  ctx.lineWidth = 4; ctx.shadowColor = COL.glow; ctx.shadowBlur = 8;
  switch (type) {
    case 'shield':
      ctx.beginPath();
      ctx.moveTo(cx, cy - s * 0.6); ctx.lineTo(cx + s * 0.5, cy - s * 0.3);
      ctx.lineTo(cx + s * 0.5, cy + s * 0.2);
      ctx.quadraticCurveTo(cx + s * 0.5, cy + s * 0.6, cx, cy + s * 0.7);
      ctx.quadraticCurveTo(cx - s * 0.5, cy + s * 0.6, cx - s * 0.5, cy + s * 0.2);
      ctx.lineTo(cx - s * 0.5, cy - s * 0.3); ctx.closePath(); ctx.stroke();
      break;
    case 'document':
      ctx.strokeRect(cx - s * 0.35, cy - s * 0.5, s * 0.7, s);
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(cx - s * 0.2, cy + i * s * 0.18); ctx.lineTo(cx + s * 0.2, cy + i * s * 0.18); ctx.stroke(); }
      break;
    case 'image':
      ctx.strokeRect(cx - s * 0.4, cy - s * 0.4, s * 0.8, s * 0.8);
      ctx.beginPath(); ctx.arc(cx - s * 0.15, cy - s * 0.1, s * 0.1, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - s * 0.4, cy + s * 0.3); ctx.lineTo(cx, cy - s * 0.1); ctx.lineTo(cx + s * 0.4, cy + s * 0.4); ctx.stroke();
      break;
    case 'video':
      ctx.strokeRect(cx - s * 0.45, cy - s * 0.3, s * 0.9, s * 0.6);
      ctx.beginPath(); ctx.moveTo(cx + s * 0.45, cy); ctx.lineTo(cx + s * 0.7, cy - s * 0.2); ctx.lineTo(cx + s * 0.7, cy + s * 0.2); ctx.closePath(); ctx.stroke();
      break;
    case 'chart':
      ctx.beginPath(); ctx.moveTo(cx - s * 0.4, cy + s * 0.4); ctx.lineTo(cx + s * 0.4, cy + s * 0.4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - s * 0.4, cy + s * 0.4); ctx.lineTo(cx - s * 0.4, cy - s * 0.4); ctx.stroke();
      ctx.fillRect(cx - s * 0.25, cy, s * 0.1, s * 0.4);
      ctx.fillRect(cx - s * 0.05, cy - s * 0.1, s * 0.1, s * 0.5);
      ctx.fillRect(cx + s * 0.15, cy - s * 0.3, s * 0.1, s * 0.7);
      break;
    case 'model3d':
      ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.5); ctx.lineTo(cx + s * 0.45, cy - s * 0.2); ctx.lineTo(cx + s * 0.45, cy + s * 0.2); ctx.lineTo(cx, cy + s * 0.5); ctx.lineTo(cx - s * 0.45, cy + s * 0.2); ctx.lineTo(cx - s * 0.45, cy - s * 0.2); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.5); ctx.lineTo(cx, cy + s * 0.5); ctx.moveTo(cx - s * 0.45, cy - s * 0.2); ctx.lineTo(cx + s * 0.45, cy + s * 0.2); ctx.stroke();
      break;
    default: ctx.strokeRect(cx - s * 0.3, cy - s * 0.3, s * 0.6, s * 0.6);
  }
  ctx.restore();
}

export const ICON_MAP = {
  document: 'document', image: 'image', video: 'video',
  chart: 'chart', model3d: 'model3d', default: 'shield',
};

export class HUDLabel {
  static createLabel(text, options = {}) {
    const { size = 1, color = COL.text, sub = '', icon = null } = options;
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = COL.bg; roundRect(ctx, 6, 6, canvas.width - 12, canvas.height - 12, 14); ctx.fill();
    ctx.strokeStyle = COL.border; ctx.lineWidth = 3;
    ctx.shadowColor = COL.glow; ctx.shadowBlur = 12;
    roundRect(ctx, 6, 6, canvas.width - 12, canvas.height - 12, 14); ctx.stroke();
    ctx.shadowBlur = 0;
    if (icon) { drawIcon(ctx, icon, 50, 64, 40); }
    ctx.fillStyle = color; ctx.font = 'bold 42px ' + FONT_MONO;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(text, icon ? 96 : 40, sub ? 50 : 64);
    if (sub) { ctx.fillStyle = COL.dim; ctx.font = '22px ' + FONT_MONO; ctx.fillText(sub, icon ? 96 : 40, 92); }
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(size * 4, size, 1);
    return sprite;
  }
  static createIcon(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    drawIcon(ctx, type, 64, 64, 56);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1, 1, 1);
    return sprite;
  }
}
```

#### 2. js/objects/ExhibitionHall.js（MODIFY — Slice 5 段）
**File**: `js/objects/ExhibitionHall.js`
**Changes**: import HUDLabel/ICON_MAP；createTextSprite 改 HUD 风格（含 scene.add 副效应）；createPanel 玻璃数据屏+发光边框+CanvasTexture 缩略图标题+HUD标题；新增 applyPanelSurface/truncate；highlightPanel/unhighlightPanel 改 emissive；删除 getTypeIcon。

```js
// ===== Slice 5: HUD 标签 + 展板科技化 =====

// --- 改动5.1：import HUDLabel（顶部 import 区追加）---
import { HUDLabel, ICON_MAP } from './HUDLabel.js';

// --- 改动5.2：createTextSprite() 整体替换为 HUD 风格（保持签名兼容）---
createTextSprite(text, options) {
  const { x, y, z, size = 1 } = options;
  const sprite = HUDLabel.createLabel(text, { size });
  sprite.position.set(x, y, z);
  if (sprite.material && sprite.material.map) this._textures.push(sprite.material.map);
  this._trackedMaterials.push(sprite.material);
  this.scene.add(sprite);  // 保持原 scene.add 副效应，供 createExhibitionSigns/createEntrance 招牌等调用点使用
  return sprite;
}

// --- 改动5.3：createPanel() 整体替换（玻璃数据屏 + 发光边框 + HUD标题 + surface纹理）---
createPanel(panelData, index, total) {
  const { id, type, title, description, tags, thumbnail, contentUrl } = panelData;
  const panelGroup = new THREE.Group();
  panelGroup.userData = { id, type, title, description, tags, thumbnail, contentUrl, isPanel: true };
  const spacing = 3;
  const startX = -(total - 1) * spacing / 2;
  const x = startX + index * spacing;
  const boardGeo = new THREE.BoxGeometry(2.5, 3.5, 0.1);
  this._geometries.push(boardGeo);
  const board = new THREE.Mesh(boardGeo, this.materials.panel);
  board.position.set(x, 1.75, -0.05);
  board.castShadow = true; board.receiveShadow = true;
  board.userData.isBoard = true;
  panelGroup.add(board);
  const borderGeo = new THREE.EdgesGeometry(boardGeo);
  this._geometries.push(borderGeo);
  const borderMat = new THREE.LineBasicMaterial({ color: THEME.neon, transparent: true, opacity: 0.8 });
  this._trackedMaterials.push(borderMat);
  const border = new THREE.LineSegments(borderGeo, borderMat);
  border.position.copy(board.position);
  panelGroup.add(border);
  this.applyPanelSurface(board, panelData);
  const titleLabel = HUDLabel.createLabel(title, { size: 0.32, icon: ICON_MAP[type] || 'shield' });
  titleLabel.position.set(x, 3.8, 0);
  this.scene.add(titleLabel);
  this._trackedMaterials.push(titleLabel.material);
  if (titleLabel.material.map) this._textures.push(titleLabel.material.map);
  const hitboxGeo = new THREE.BoxGeometry(2.5, 3.5, 0.5);
  this._geometries.push(hitboxGeo);
  const hitboxMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide });
  this._trackedMaterials.push(hitboxMat);
  const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
  hitbox.position.set(x, 1.75, 0.2);
  hitbox.userData = panelGroup.userData;
  panelGroup.add(hitbox);
  return panelGroup;
}

// --- 改动5.4：新增 applyPanelSurface() + truncate() ---
applyPanelSurface(board, panelData) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 720;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 720);
  g.addColorStop(0, '#0a1628'); g.addColorStop(1, '#050d1f');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 720);
  ctx.strokeStyle = 'rgba(0,210,255,0.5)'; ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 496, 704);
  ctx.fillStyle = 'rgba(0,210,255,0.15)'; ctx.fillRect(8, 8, 496, 60);
  ctx.fillStyle = '#00d2ff'; ctx.font = 'bold 28px monospace'; ctx.textAlign='left'; ctx.textBaseline='middle';
  ctx.fillText('// ' + (panelData.type || 'data').toUpperCase(), 30, 38);
  ctx.strokeStyle = 'rgba(0,210,255,0.4)'; ctx.lineWidth = 2;
  ctx.strokeRect(60, 110, 392, 320);
  ctx.fillStyle = 'rgba(0,210,255,0.5)'; ctx.font = '24px monospace'; ctx.textAlign='center';
  ctx.fillText('[ DATA PREVIEW ]', 256, 270);
  ctx.fillStyle = '#cdeeff'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign='left';
  ctx.fillText(this.truncate(panelData.title, 16), 40, 490);
  ctx.fillStyle = '#00d2ff'; ctx.font = '22px monospace';
  (panelData.tags || []).slice(0, 3).forEach((t, i) => {
    ctx.fillText('#' + t, 40, 540 + i * 32);
  });
  const tex = new THREE.CanvasTexture(canvas);
  this._textures.push(tex);
  board.material = new THREE.MeshStandardMaterial({
    map: tex, transparent: true, opacity: 0.92,
    emissive: THEME.neon, emissiveIntensity: 0.1, emissiveMap: tex,
    roughness: 0.3, metalness: 0.1, envMapIntensity: 0.5
  });
  this._trackedMaterials.push(board.material);
}
truncate(s, n) { return s && s.length > n ? s.slice(0, n) + '…' : (s || ''); }

// --- 改动5.5：highlightPanel()/unhighlightPanel() 整体替换（emissive 提亮，基于 isBoard）---
highlightPanel(panel) {
  if (!panel) return;
  panel.children.forEach(child => {
    if (child.userData && child.userData.isBoard && child.material) child.material.emissiveIntensity = 0.6;
  });
}
unhighlightPanel(panel) {
  if (!panel) return;
  panel.children.forEach(child => {
    if (child.userData && child.userData.isBoard && child.material) child.material.emissiveIntensity = 0.1;
  });
}

// --- 改动5.6：删除 getTypeIcon()（emoji 移除）---
```

### Success Criteria:

#### Automated Verification:
- [x] emoji 已移除：`grep -rn "📄\|🖼️\|🎬\|📊\|🧊" js/` 无输出
- [x] getTypeIcon 已删：`grep -n "getTypeIcon" js/objects/ExhibitionHall.js` 无输出
- [x] HUDLabel 已建：`grep -n "class HUDLabel" js/objects/HUDLabel.js` 返回 1
- [x] 矢量图标已用：`grep -n "drawIcon" js/objects/HUDLabel.js` 返回 >= 1
- [x] 展板玻璃屏：`grep -n "isBoard" js/objects/ExhibitionHall.js` 返回 >= 1
- [x] 构建通过：`npm run build`

#### Manual Verification:
- [ ] 展板标题为深色半透明 + 青色发光描边 HUD 标签，带矢量图标（无 emoji、无白底）
- [ ] 展板为半透明玻璃数据屏 + 青色发光边框
- [ ] 展板表面显示类型条 + DATA PREVIEW 占位 + 标题 + 标签
- [ ] 悬停展板时 emissive 提亮（发光增强）

---

## Phase 6: 环境动效系统

### Overview
createEntranceParticles 改青色数据流粒子（350 粒子，全空间上升）；updateParticles(elapsed) 整体替换含环境动效；新增 updateAmbience（网格流光+灯带呼吸+展板悬浮）；createExhibitionZone 存基准高度；app.js 渲染循环传 elapsed。

### Changes Required:

#### 1. js/objects/ExhibitionHall.js（MODIFY — Slice 6 段）
**File**: `js/objects/ExhibitionHall.js`
**Changes**: createEntranceParticles 青色数据流粒子；updateParticles(elapsed) 整体替换含 updateAmbience 调用；新增 updateAmbience（网格流光+灯带呼吸+展板悬浮）；createExhibitionZone 追加 zone.userData._baseY。

```js
// ===== Slice 6: 环境动效系统 =====

// --- 改动6.1：createEntranceParticles() 整体替换（青色数据流粒子）---
createEntranceParticles() {
  const particleCount = 350;
  const spread = 6;
  const depth = this.config.depth;
  const positions = new Float32Array(particleCount * 3);
  const velocities = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3;
    positions[i3] = (Math.random() - 0.5) * spread;
    positions[i3 + 1] = 0.5 + Math.random() * 6;
    positions[i3 + 2] = (depth / 2) - 2 + (Math.random() - 0.5) * spread;
    velocities[i3] = (Math.random() - 0.5) * 0.008;
    velocities[i3 + 1] = Math.random() * 0.02 + 0.008;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.008;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  this._geometries.push(geometry);
  const material = new THREE.PointsMaterial({
    color: THEME.neon, size: 0.05, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  this._trackedMaterials.push(material);
  this.particles = new THREE.Points(geometry, material);
  this.particles.userData.velocities = velocities;
  this.scene.add(this.particles);
}

// --- 改动6.2：createCeilingLights() _ceilingBars 接线（已在 Phase 3 改动3.6 内实现，此处无需重复）---

// --- 改动6.3：createExhibitionZone() 内 zone.userData 赋值后追加（存基准高度）---
//   zone.userData._baseY = position.y;

// --- 改动6.4：updateParticles(elapsed) 整体替换（粒子上升 + 环境动效）---
updateParticles(elapsed) {
  if (this.particles) {
    const positions = this.particles.geometry.attributes.position.array;
    const velocities = this.particles.userData.velocities;
    const count = positions.length / 3;
    const topY = this.config.height;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] += velocities[i3];
      positions[i3 + 1] += velocities[i3 + 1];
      positions[i3 + 2] += velocities[i3 + 2];
      if (positions[i3 + 1] > topY) {
        positions[i3 + 1] = 0.5;
        positions[i3] = (Math.random() - 0.5) * 6;
        positions[i3 + 2] = (this.config.depth / 2) - 2 + (Math.random() - 0.5) * 6;
      }
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
  }
  this.updateAmbience(elapsed || 0);
}

// --- 改动6.5：新增 updateAmbience(elapsed)（网格流光 + 灯带呼吸 + 展板悬浮）---
updateAmbience(elapsed) {
  if (this._gridHelper && this._gridHelper.material) {
    const m = this._gridHelper.material;
    const pulse = 0.25 + Math.sin(elapsed * 1.2) * 0.15;
    if (Array.isArray(m)) m.forEach(x => x.opacity = pulse);
    else m.opacity = pulse;
  }
  if (this._ceilingBars) {
    const bp = 0.7 + Math.sin(elapsed * 2) * 0.3;
    this._ceilingBars.forEach(mat => { if (mat) mat.emissiveIntensity = 1.2 + bp; });
  }
  if (this.exhibitions) {
    this.exhibitions.forEach((zone, i) => {
      const baseY = zone.userData._baseY || 0;
      zone.position.y = baseY + Math.sin(elapsed * 0.6 + i) * 0.04;
    });
  }
}
```

#### 2. js/app.js（MODIFY — Slice 6 段）
**File**: `js/app.js`
**Changes**: startRenderLoop 中 updateParticles 改为传 elapsed。

```js
// ===== Slice 6: 环境动效钩入 =====

// --- 改动6.6：startRenderLoop() 中 updateParticles 改为传 elapsed ---
// 原：exhibitionHall.updateParticles();
// 改为：
exhibitionHall.updateParticles(sceneManager.clock.getElapsedTime());
```

### Success Criteria:

#### Automated Verification:
- [x] 粒子青色：`grep -n "THEME.neon" js/objects/ExhibitionHall.js` 返回 >= 1（含粒子）
- [x] 环境动效方法：`grep -n "updateAmbience" js/objects/ExhibitionHall.js` 返回 1
- [x] 渲染循环传 elapsed：`grep -n "updateParticles(sceneManager.clock.getElapsedTime())" js/app.js` 返回 1
- [x] 构建通过：`npm run build`

#### Manual Verification:
- [ ] 入口区域有青色数据流粒子上升
- [ ] 地面网格透明度脉冲流光
- [ ] 天花板灯带亮度呼吸
- [ ] 展板微微悬浮（不明显但可感知）
- [ ] 60fps（Chrome Performance）无明显掉帧

---

## Phase 7: 数据可视化 + UI 统一收尾

### Overview
DataDashboard drawChart 改深色科技样式；css/style.css 全量统一深蓝赛博（合并 Phase 1 tokens + 全部 UI 组件）；css/ui.css 全量科技化收尾。

### Changes Required:

#### 1. js/objects/DataDashboard.js（MODIFY）
**File**: `js/objects/DataDashboard.js`
**Changes**: drawChart 整体替换为深色科技底 + 青色渐变柱 + 顶部高光 + 网格线 + 标题。

```js
// === 改动7.1：drawChart() 整体替换（深色科技样式）===
drawChart(canvas, data) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#0a1628');
  bg.addColorStop(1, '#050d1f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(0,210,255,0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, width - 8, height - 8);
  ctx.fillStyle = '#00d2ff';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('// ' + (data.title || 'DATA METRICS'), 20, 32);
  if (data.labels && data.values) {
    const barCount = data.labels.length;
    const barWidth = Math.min(60, (width - 80) / barCount - 10);
    const maxValue = Math.max(...data.values);
    const chartHeight = height - 110;
    const startX = 50;
    ctx.strokeStyle = 'rgba(0,210,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, 60); ctx.lineTo(startX, chartHeight + 60); ctx.lineTo(width - 20, chartHeight + 60);
    ctx.stroke();
    for (let i = 1; i <= 4; i++) {
      const y = 60 + chartHeight * i / 4;
      ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(width - 20, y);
      ctx.strokeStyle = 'rgba(0,210,255,0.08)'; ctx.stroke();
    }
    data.values.forEach((value, i) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = startX + 10 + i * (barWidth + 10);
      const y = chartHeight + 60 - barHeight;
      const grad = ctx.createLinearGradient(x, y, x, chartHeight + 60);
      grad.addColorStop(0, '#00d2ff');
      grad.addColorStop(1, '#0066ff');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth, barHeight);
      ctx.fillStyle = 'rgba(0,255,255,0.6)';
      ctx.fillRect(x, y, barWidth, 2);
      ctx.fillStyle = '#cdeeff';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(value + '%', x + barWidth / 2, y - 6);
      ctx.fillStyle = '#6f8aab';
      ctx.font = '11px monospace';
      ctx.fillText(data.labels[i], x + barWidth / 2, chartHeight + 78);
    });
  }
}
```

#### 2. css/style.css（MODIFY — 全量最终版，整体替换）
**File**: `css/style.css`
**Changes**: 用以下完整版整体替换 css/style.css（合并 Phase 1 tokens + 全部 UI 组件统一深蓝赛博 + design tokens var() + 等宽字体 + 发光描边）。

```css
/* 主样式文件 — 深蓝赛博 Cyber Blue */

:root {
  --bg-deep: #050d1f;
  --surface-dark: #0d1117;
  --surface-mid: #111722;
  --neon: #00d2ff;
  --ice: #0066ff;
  --safe: #00ff88;
  --threat: #ff00aa;
  --text: #cdeeff;
  --text-dim: #6f8aab;
  --border-glow: rgba(0, 210, 255, 0.4);
  --panel-bg: rgba(8, 16, 32, 0.72);
  --font-mono: 'SF Mono', 'JetBrains Mono', 'Menlo', 'Consolas', monospace;
  --font-sans: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  width: 100%; height: 100%; overflow: hidden;
  font-family: var(--font-sans);
  background: var(--bg-deep);
  color: var(--text);
}

#app { width: 100%; height: 100%; position: relative; }
#canvas3d { width: 100%; height: 100%; display: block; }

/* 加载界面 */
#loading-screen {
  position: fixed; inset: 0; z-index: 1000;
  background: radial-gradient(circle at 50% 40%, #0a1628 0%, var(--bg-deep) 70%);
  display: flex; justify-content: center; align-items: center;
  transition: opacity 0.5s ease;
}
#loading-screen.hidden { opacity: 0; pointer-events: none; }
.loading-content { text-align: center; }
.loading-content h1 {
  font-size: 2.5rem; margin-bottom: 2rem; letter-spacing: 0.1em;
  font-family: var(--font-mono);
  background: linear-gradient(90deg, var(--neon), var(--ice));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  text-shadow: 0 0 30px rgba(0, 210, 255, 0.4);
}
.loading-bar {
  width: 320px; height: 4px; margin: 0 auto 1rem;
  background: rgba(0, 210, 255, 0.1); border-radius: 2px; overflow: hidden;
  border: 1px solid var(--border-glow);
}
.loading-progress {
  width: 0%; height: 100%;
  background: linear-gradient(90deg, var(--neon), var(--ice));
  box-shadow: 0 0 12px var(--neon);
  transition: width 0.3s ease;
}
.loading-text { font-size: 0.9rem; color: var(--text-dim); font-family: var(--font-mono); }

/* UI 层 */
#ui-layer { position: absolute; inset: 0; pointer-events: none; }
#ui-layer > * { pointer-events: auto; }

/* 头部导航 */
.header {
  position: absolute; top: 0; left: 0; width: 100%; height: 60px;
  background: var(--panel-bg); backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-glow);
  box-shadow: 0 0 20px rgba(0, 210, 255, 0.15);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px; z-index: 100;
}
.logo {
  font-size: 1.1rem; font-weight: bold; letter-spacing: 0.12em;
  color: var(--neon); font-family: var(--font-mono);
  text-shadow: 0 0 8px rgba(0, 210, 255, 0.6);
}
.nav { display: flex; gap: 10px; }
.nav-btn {
  padding: 8px 16px; background: transparent;
  border: 1px solid var(--border-glow);
  color: var(--text); border-radius: 4px; cursor: pointer;
  font-family: var(--font-mono); font-size: 0.85rem;
  transition: all 0.3s ease;
}
.nav-btn:hover { background: rgba(0, 210, 255, 0.15); border-color: var(--neon); box-shadow: 0 0 12px rgba(0, 210, 255, 0.3); }
.nav-btn.active { background: var(--neon); border-color: var(--neon); color: var(--bg-deep); font-weight: bold; }
.controls { display: flex; gap: 10px; }
.icon-btn {
  width: 40px; height: 40px; background: transparent;
  border: 1px solid var(--border-glow); color: var(--text);
  border-radius: 4px; cursor: pointer; font-size: 1.2rem;
  transition: all 0.3s ease;
}
.icon-btn:hover { background: rgba(0, 210, 255, 0.15); border-color: var(--neon); box-shadow: 0 0 10px rgba(0, 210, 255, 0.4); }

/* 底部状态栏 */
.footer {
  position: absolute; bottom: 0; left: 0; width: 100%; height: 40px;
  background: var(--panel-bg); backdrop-filter: blur(12px);
  border-top: 1px solid var(--border-glow);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px; font-size: 0.8rem; color: var(--text-dim); font-family: var(--font-mono);
}
.status { display: flex; gap: 20px; }
.status-item { display: flex; align-items: center; gap: 5px; }
.status-item #fps { color: var(--safe); }
.hints { color: var(--text-dim); }

/* 小地图 */
.minimap {
  position: absolute; bottom: 60px; right: 20px; width: 200px; height: 200px;
  background: var(--panel-bg); backdrop-filter: blur(8px);
  border: 1px solid var(--border-glow); border-radius: 8px; overflow: hidden;
  box-shadow: 0 0 16px rgba(0, 210, 255, 0.2);
}
#minimap-canvas { width: 100%; height: 100%; }

/* 模态框 */
.modal { position: fixed; inset: 0; display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal.hidden { display: none; }
.modal-overlay { position: absolute; inset: 0; background: rgba(5, 13, 31, 0.85); backdrop-filter: blur(8px); }
.modal-content {
  position: relative; width: 90%; max-width: 800px; max-height: 90vh;
  background: var(--panel-bg); backdrop-filter: blur(16px);
  border: 1px solid var(--border-glow); border-radius: 12px;
  box-shadow: 0 0 40px rgba(0, 210, 255, 0.25);
  overflow: hidden; display: flex; flex-direction: column;
}
.modal-close { position: absolute; top: 15px; right: 15px; width: 32px; height: 32px;
  background: transparent; border: 1px solid var(--border-glow); color: var(--neon);
  font-size: 1.3rem; border-radius: 4px; cursor: pointer; z-index: 10; transition: all 0.2s; }
.modal-close:hover { background: rgba(0, 210, 255, 0.2); }
.modal-header { padding: 20px; border-bottom: 1px solid var(--border-glow); }
.modal-header h2 { font-size: 1.4rem; color: var(--neon); font-family: var(--font-mono); letter-spacing: 0.05em; }
.modal-tags { display: flex; gap: 8px; margin-top: 10px; }
.tag { padding: 4px 10px; background: rgba(0, 210, 255, 0.12); border: 1px solid var(--neon); border-radius: 12px; font-size: 0.75rem; color: var(--neon); font-family: var(--font-mono); }
.modal-body { padding: 20px; overflow-y: auto; flex: 1; }
.preview { width: 100%; margin-bottom: 20px; }
.preview.hidden { display: none; }
.preview iframe, .preview img, .preview video { width: 100%; max-height: 400px; object-fit: contain; background: var(--bg-deep); border: 1px solid var(--border-glow); border-radius: 8px; }
.modal-description { line-height: 1.7; color: var(--text); }
.modal-footer { padding: 15px 20px; border-top: 1px solid var(--border-glow); display: flex; justify-content: flex-end; gap: 10px; }
.btn { padding: 10px 22px; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-family: var(--font-mono); letter-spacing: 0.05em; transition: all 0.3s ease; }
.btn-primary { background: var(--neon); color: var(--bg-deep); font-weight: bold; }
.btn-primary:hover { background: var(--ice); box-shadow: 0 0 14px rgba(0, 210, 255, 0.5); }
.btn-secondary { background: rgba(255, 255, 255, 0.05); color: var(--text); border: 1px solid var(--border-glow); }
.btn-secondary:hover { background: rgba(0, 210, 255, 0.15); }

/* 帮助弹窗 */
.help-section { margin-bottom: 20px; }
.help-section h3 { color: var(--neon); margin-bottom: 10px; font-family: var(--font-mono); }
.help-section ul { list-style: none; padding-left: 20px; }
.help-section li { margin-bottom: 8px; color: var(--text); }
.help-section kbd { display: inline-block; padding: 2px 8px; background: rgba(0, 210, 255, 0.1); border: 1px solid var(--border-glow); border-radius: 4px; font-family: var(--font-mono); font-size: 0.85rem; color: var(--neon); }

/* 传送菜单 */
.teleport-menu { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--panel-bg); backdrop-filter: blur(16px); border: 1px solid var(--border-glow); border-radius: 12px; padding: 24px; z-index: 500; box-shadow: 0 0 30px rgba(0, 210, 255, 0.3); }
.teleport-menu.hidden { display: none; }
.teleport-menu h3 { color: var(--neon); margin-bottom: 16px; text-align: center; font-family: var(--font-mono); letter-spacing: 0.08em; }
.teleport-options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.teleport-btn { padding: 14px; background: rgba(0, 210, 255, 0.06); border: 1px solid var(--border-glow); border-radius: 8px; color: var(--text); cursor: pointer; font-family: var(--font-mono); transition: all 0.3s ease; }
.teleport-btn:hover { background: rgba(0, 210, 255, 0.18); border-color: var(--neon); box-shadow: 0 0 12px rgba(0, 210, 255, 0.4); }

/* 全屏沉浸模式 */
.modal.immersive .modal-content { width: 100vw; max-width: 100vw; height: 100vh; max-height: 100vh; border-radius: 0; border: none; animation: immersiveExpand 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.modal.immersive .modal-overlay { backdrop-filter: blur(20px); background: rgba(5, 13, 31, 0.95); }
.modal.immersive .modal-body { flex: 1; display: flex; flex-direction: column; }
.modal.immersive .preview { flex: 1; min-height: 0; }
.modal.immersive .preview iframe, .modal.immersive .preview img, .modal.immersive .preview video { max-height: none; height: 100%; }
@keyframes immersiveExpand { from { width: 90%; max-width: 800px; max-height: 90vh; border-radius: 12px; opacity: 0.8; } to { width: 100vw; max-width: 100vw; height: 100vh; border-radius: 0; opacity: 1; } }

#model3d-preview { text-align: center; }
#model3d-preview canvas { border-radius: 8px; cursor: grab; }
#model3d-preview canvas:active { cursor: grabbing; }
.model3d-controls { margin-top: 10px; color: var(--text-dim); font-size: 12px; font-family: var(--font-mono); }

.tooltip { position: absolute; background: var(--panel-bg); border: 1px solid var(--border-glow); border-radius: 6px; padding: 10px 15px; color: var(--text); font-size: 0.85rem; font-family: var(--font-mono); pointer-events: none; z-index: 200; max-width: 200px; box-shadow: 0 0 12px rgba(0, 210, 255, 0.3); }

/* 响应式 */
@media (max-width: 480px) { .header { height: 45px; padding: 0 8px; } .logo { font-size: 0.85rem; } .nav { display: none; } .controls { gap: 6px; } .icon-btn { width: 34px; height: 34px; font-size: 1rem; } .footer { height: 35px; padding: 0 10px; font-size: 0.7rem; } .hints { display: none; } .minimap { width: 120px; height: 120px; bottom: 45px; right: 8px; } .modal-content { width: 98%; max-height: 98vh; border-radius: 8px; } .modal-header h2 { font-size: 1.2rem; } .modal-body { padding: 15px; } .teleport-menu { width: 85%; padding: 15px; } .teleport-options { grid-template-columns: 1fr; } .teleport-btn { padding: 10px; } }
@media (max-width: 768px) { .header { height: 50px; padding: 0 10px; } .logo { font-size: 1rem; } .nav { display: none; } .minimap { width: 150px; height: 150px; bottom: 50px; right: 10px; } .modal-content { width: 95%; max-height: 95vh; } .teleport-options { grid-template-columns: 1fr; } }
@media (min-width: 769px) and (max-width: 1024px) { .header { height: 55px; padding: 0 15px; } .nav-btn { padding: 6px 12px; font-size: 0.85rem; } .minimap { width: 175px; height: 175px; bottom: 55px; right: 15px; } .modal-content { width: 92%; max-width: 700px; } }
@media (max-width: 768px) { .header::after { content: '\2630'; font-size: 1.5rem; color: var(--neon); cursor: pointer; padding: 5px 10px; } }
```

#### 3. css/ui.css（MODIFY — 全量科技化，整体替换）
**File**: `css/ui.css`
**Changes**: 用以下完整版整体替换 css/ui.css（全量色值 var() 化 + 深色科技样式）。

```css
/* UI 组件样式 — 深蓝赛博统一 */

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
@keyframes glow { 0%, 100% { box-shadow: 0 0 8px rgba(0, 210, 255, 0.5); } 50% { box-shadow: 0 0 22px rgba(0, 210, 255, 0.85); } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.loading-spinner { width: 40px; height: 40px; border: 3px solid rgba(0, 210, 255, 0.15); border-top-color: var(--neon); border-radius: 50%; animation: spin 1s linear infinite; }

.notification { position: fixed; top: 80px; right: 20px; padding: 14px 20px; background: var(--panel-bg); backdrop-filter: blur(12px); border: 1px solid var(--border-glow); border-left: 4px solid var(--neon); border-radius: 4px; color: var(--text); z-index: 2000; animation: slideIn 0.3s ease; max-width: 300px; box-shadow: 0 0 16px rgba(0, 210, 255, 0.3); }
.notification.success { border-left-color: var(--safe); }
.notification.error { border-left-color: var(--threat); }
.notification.warning { border-left-color: #ffaa00; }

.progress-indicator { width: 100%; height: 4px; background: rgba(0, 210, 255, 0.1); border-radius: 2px; overflow: hidden; }
.progress-indicator .bar { height: 100%; background: linear-gradient(90deg, var(--neon), var(--safe)); border-radius: 2px; transition: width 0.3s ease; box-shadow: 0 0 8px var(--neon); }

.interaction-hint { position: absolute; bottom: 100px; left: 50%; transform: translateX(-50%); background: var(--panel-bg); border: 1px solid var(--neon); border-radius: 20px; padding: 10px 22px; color: var(--text); font-size: 0.85rem; font-family: var(--font-mono); animation: pulse 2s infinite; pointer-events: none; box-shadow: 0 0 14px rgba(0, 210, 255, 0.4); }

.panel-label { position: absolute; background: var(--panel-bg); border: 1px solid var(--border-glow); border-radius: 6px; padding: 8px 12px; color: var(--text); font-size: 0.85rem; font-family: var(--font-mono); pointer-events: none; transition: all 0.3s ease; }
.panel-label:hover { border-color: var(--neon); background: rgba(0, 210, 255, 0.2); box-shadow: 0 0 10px rgba(0, 210, 255, 0.4); }

.highlight-effect { animation: glow 1.5s ease-in-out infinite; }

.toolbar { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 10px; z-index: 100; }
.toolbar-btn { width: 50px; height: 50px; background: var(--panel-bg); border: 1px solid var(--border-glow); border-radius: 8px; color: var(--text); font-size: 1.2rem; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; }
.toolbar-btn:hover { background: rgba(0, 210, 255, 0.18); border-color: var(--neon); transform: scale(1.1); box-shadow: 0 0 12px rgba(0, 210, 255, 0.4); }
.toolbar-btn.active { background: var(--neon); border-color: var(--neon); color: var(--bg-deep); }

.info-card { background: var(--panel-bg); border: 1px solid var(--border-glow); border-radius: 8px; padding: 15px; margin-bottom: 10px; }
.info-card h4 { color: var(--neon); margin-bottom: 10px; font-family: var(--font-mono); }
.info-card p { color: var(--text); font-size: 0.9rem; line-height: 1.5; }

.tag-cloud { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.tag-cloud .tag { padding: 5px 10px; background: rgba(0, 210, 255, 0.1); border: 1px solid var(--border-glow); border-radius: 15px; font-size: 0.8rem; color: var(--neon); font-family: var(--font-mono); cursor: pointer; transition: all 0.3s ease; }
.tag-cloud .tag:hover { background: rgba(0, 210, 255, 0.25); }

.content-list { list-style: none; }
.content-list li { padding: 12px 15px; border-bottom: 1px solid rgba(0, 210, 255, 0.1); display: flex; align-items: center; gap: 10px; cursor: pointer; transition: background 0.3s ease; }
.content-list li:hover { background: rgba(0, 210, 255, 0.1); }
.content-list li:last-child { border-bottom: none; }
.content-icon { width: 40px; height: 40px; background: rgba(0, 210, 255, 0.15); border: 1px solid var(--border-glow); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: var(--neon); }
.content-info { flex: 1; }
.content-title { font-weight: 500; margin-bottom: 4px; color: var(--text); }
.content-meta { font-size: 0.8rem; color: var(--text-dim); font-family: var(--font-mono); }

.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px; }
.stat-item { background: rgba(0, 210, 255, 0.06); border: 1px solid var(--border-glow); border-radius: 8px; padding: 15px; text-align: center; }
.stat-value { font-size: 2rem; font-weight: bold; color: var(--neon); margin-bottom: 5px; font-family: var(--font-mono); text-shadow: 0 0 10px rgba(0, 210, 255, 0.5); }
.stat-label { font-size: 0.85rem; color: var(--text-dim); }

.search-box { position: relative; margin-bottom: 15px; }
.search-input { width: 100%; padding: 12px 15px 12px 40px; background: rgba(0, 210, 255, 0.06); border: 1px solid var(--border-glow); border-radius: 8px; color: var(--text); font-size: 0.95rem; font-family: var(--font-mono); transition: all 0.3s ease; }
.search-input:focus { outline: none; border-color: var(--neon); background: rgba(0, 210, 255, 0.1); box-shadow: 0 0 10px rgba(0, 210, 255, 0.3); }
.search-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: var(--text-dim); }

.empty-state { text-align: center; padding: 40px 20px; color: var(--text-dim); }
.empty-state .icon { font-size: 3rem; margin-bottom: 15px; color: var(--neon); }
.empty-state p { margin-bottom: 20px; }

.skeleton { background: linear-gradient(90deg, rgba(0,210,255,0.08) 25%, rgba(0,210,255,0.03) 50%, rgba(0,210,255,0.08) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; }

.tooltip { position: relative; }
.tooltip::after { content: attr(data-tooltip); position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); padding: 8px 12px; background: var(--panel-bg); border: 1px solid var(--border-glow); border-radius: 4px; font-size: 0.8rem; white-space: nowrap; opacity: 0; visibility: hidden; transition: all 0.3s ease; }
.tooltip:hover::after { opacity: 1; visibility: visible; bottom: calc(100% + 5px); }

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: rgba(0, 210, 255, 0.05); }
::-webkit-scrollbar-thumb { background: rgba(0, 210, 255, 0.3); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--neon); }
::selection { background: rgba(0, 210, 255, 0.35); color: var(--text); }
```

### Success Criteria:

#### Automated Verification:
- [x] 图表科技样式：`grep -n "#0a1628\|DATA METRICS" js/objects/DataDashboard.js` 返回 >= 1
- [x] style.css 全量 var：`grep -c "var(--" css/style.css` 返回 >= 20
- [x] ui.css 全量 var：`grep -c "var(--" css/ui.css` 返回 >= 15
- [x] 旧硬编码青色已清理：`grep -n "#1a1a2e" css/style.css` 无输出
- [x] 构建通过：`npm run build`（先 `rm -rf node_modules && npm install`）
- [x] 项目级无残留写实：`grep -rn "0xd0d4dc\|大理石\|marble\|wood\|盆栽\|plant\|bench\|sconce" js/ css/` 无输出
- [x] 项目级无残留 emoji：`grep -rn "📄\|🖼️\|🎬\|📊\|🧊" js/` 无输出

#### Manual Verification:
- [ ] 数据图表为深色科技底 + 青色渐变柱 + 顶部高光 + 网格线
- [ ] 全部 UI 组件（导航/弹窗/加载/小地图/传送/按钮）统一深蓝赛博 + 等宽字体 + 发光描边
- [ ] 3D 画布主色为深蓝黑系（Playwright 截图像素采样非浅灰）
- [ ] 整体科技感、数据感、安全感，达到可交付观感

---

## Testing Strategy

### Automated:
- 每个 Phase：`npm run build`（先 `rm -rf node_modules && npm install` 修复 rollup 原生模块损坏）
- Phase 1-7 各自的 grep 校验（见各 Phase Success Criteria）
- 项目级无残留写实材质/家具：`grep -rn "0xd0d4dc\|大理石\|marble\|wood\|盆栽\|plant\|bench\|sconce" js/ css/`
- 项目级无残留 emoji：`grep -rn "📄\|🖼️\|🎬\|📊\|🧊" js/`
- design tokens 单一来源一致性：config.js THEME 色板与 css/style.css :root 变量色值对应

### Manual Testing Steps:
1. `npm run dev` 启动，浏览器无 console error
2. Playwright 截图，3D 画布主色应为深蓝黑系（非浅灰 `(168,170,174)`），可见青色发光元素
3. 60fps 性能校验（Chrome Performance 面板），反射/Bloom 开启下中端显卡达标
4. 各 Phase Manual Verification 逐项检查（地面反射/网格、墙面发光条、中央装置呼吸、展板 HUD 标签、粒子动效、UI 统一）

## Performance Considerations

- Reflector 镜面反射：用低分辨率纹理（512）+ 限制反射距离，避免每帧全分辨率渲染
- Bloom：strength 1.0 / threshold 0.3，只让自发光物体辉光，避免全屏过曝
- 粒子：数据流粒子环控制在 ~800 粒子，PointsMaterial + AdditiveBlending
- 动效：呼吸灯/悬浮用 sin 调制，零额外 draw call；扫描线用全屏后处理 shader（轻量）
- 雾 FogExp2 比线性雾省计算

## Migration Notes

- 视觉重做不涉及数据 schema 变化；content.json 结构不变
- 现有写实材质/家具代码删除，无回滚需求（视觉方向已用户确认）
- CSS 变量化改造向后兼容（旧硬编码色值替换为 var()）
- 落地前建议 `git` 备份当前状态，便于回退对照

## Plan Review (Step 4)

_Independent post-finalization review by artifact-code-reviewer and artifact-coverage-reviewer subagents. Findings triaged at Step 5._

| source   | plan-loc          | codebase-loc | severity | dimension             | finding                                                                                              | recommendation                                                                                                   | resolution         |
| -------- | ----------------- | ------------ | -------- | -------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------ |
| coverage | ## Decision D7     | <n/a>        | blocker  | verification-coverage | D7 用户确认范围含"轻扫描线"，但 7 个 phase 均无扫描线 Success Criteria 也无代码镜像，用户决策项缺失 | Phase 2 createPostProcessing 加扫描线后处理 pass + Phase 6 Manual Verification 加"扫描线可见"；或更新 design 从 D7 移除"轻扫描线" | applied: Phase 2 加 ScanlineShader + scanlinePass + Phase 2 自动/手动验收已加 |
| code     | Phase 7 (CSS)     | <n/a>        | concern  | actionability         | Phase 7 的 css/style.css、css/ui.css 引用 design Architecture 而非内联完整代码，implementer 需跨文档参照 | 将 design Architecture 的完整 CSS 代码块（行 221-411、412-520）内联到 Phase 7 Changes Required，使 phase 可独立实施             | applied: 从 design Architecture 提取完整 CSS 内联到 Phase 7（style.css 183 行/76 var, ui.css 73 行/54 var） |
| coverage | ## Performance §4 | <n/a>        | suggestion | verification-coverage | 扫描线性能建议无 Success Criteria、无代码镜像                                                            | 若保留扫描线，Phase 2 加 `grep -n "ScanLine\|scanline" js/scene/SceneManager.js` 返回 >= 1 的 Automated 校验                        | applied: 随 blocker 一并处理 — Phase 2 自动验收已加 grep ScanlineShader 校验 |

## Developer Context

_Step 4/5 审查交互记录于此。设计阶段已确认 9 项视觉决策（深蓝赛博/色板/镜面地面/玻璃展板/盾牌装置/全删家具/中度动效/系统字体/HUD标签），见 design artifact Developer Context。_

## References

- Design: `.rpiv/artifacts/designs/2026-07-18_visual-redesign-cyber-blue.md`
- 视觉诊断: `.rpiv/artifacts/visual-reviews/2026-07-18_digital-exhibition-hall-visual-review.md`
- 代码研究: `.rpiv/artifacts/research/digital-exhibition-hall.md`
- Three.js 官方示例: postprocessing/bloom、webgl_mirror、webgl_shading_physical
