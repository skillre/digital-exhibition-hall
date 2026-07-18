---
date: 2026-07-18T00:45:00+0800
author: skillre
commit: 52f7359
branch: main
repository: 数字展厅
topic: "展厅交互增强与科技极简风格升级"
tags: [research, codebase, threejs, postprocessing, collision, interaction, teleport, autotour]
status: ready
last_updated: 2026-07-18T00:45:00+0800
last_updated_by: skillre
---

# Research: 展厅交互增强与科技极简风格升级

## Research Question
验证数字展厅从"初级静态展示"升级为"成熟、高科技、专业"科技极简风格的技术可行性，覆盖：后处理管线集成、材质系统重构、粒子系统、可交互 3D 模型、数据可视化、展板全屏模式、碰撞检测修复、传送系统、自动巡展模式。

## Summary

研究发现 **2 个阻塞性问题** 和 **3 个需重构模块**。阻塞性问题：(1) Three.js r128 的 `outputColorSpace = THREE.SRGBColorSpace` 是 r152+ API，当前代码存在隐性运行时错误；(2) `three.min.js` 作为全局脚本无法使用 ES Module 后处理插件。需重构：碰撞检测系统（遗漏展板、无沿墙滑动）、交互系统（指针锁定状态耦合）。已确认迁移到 npm 安装的 Three.js 是最佳方案，可同时解决版本兼容和模块导入问题。

## Detailed Findings

### 1. 渲染管线与后处理

#### Three.js 模块系统冲突

**问题**: Three.js r128 通过全局 `<script>` 标签加载（`index.html:151`），但应用代码使用 ES Module `import` 语法（`app.js:1-13`）。后处理插件（`three/examples/jsm/postprocessing`）需要 ES Module 导入核心 `three` 包，无法使用全局 `THREE` 变量。

**影响**: 无法直接使用 `EffectComposer`、`RenderPass`、`UnrealBloomPass`、`SSAOPass`。

**解决方案**: 迁移到 npm 安装的 Three.js：
- 移除 `<script src="./lib/three.min.js"></script>`（`index.html:151`）
- 安装 `three` npm 包
- 更新所有代码使用 `import * as THREE from 'three'`
- 后处理插件使用 `import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'`

#### 色彩空间 API 不兼容

**问题**: `SceneManager.js:89` 设置 `this.renderer.outputColorSpace = THREE.SRGBColorSpace`，但 `SRGBColorSpace` 在 r128 中不存在（r152+ 引入）。

**r128 正确用法**:
```javascript
// 替换 SceneManager.js:89
this.renderer.outputEncoding = THREE.sRGBEncoding;
```

**影响**: 当前代码隐性失败，后处理管线将产生错误输出。

#### EffectComposer 集成方案

**修改点**: `SceneManager.js:151-153` 的 `render()` 方法
```javascript
// 当前: this.renderer.render(this.scene, this.camera);
// 改为:
this.composer.render();
```

**初始化流程**:
```javascript
this.composer = new EffectComposer(this.renderer);
this.composer.addPass(new RenderPass(this.scene, this.camera));
this.composer.addPass(new UnrealBloomPass(resolution, strength, radius, threshold));
this.composer.addPass(new SSAOPass(scene, camera, width, height));
```

#### 粒子系统集成

**已有模式**: `ExhibitionHall.js:14-20` 已实现 `_textures` 和 `_geometries` 资源追踪数组。

**实现方案**:
- 使用 `THREE.Points` + `THREE.BufferGeometry` + `THREE.PointsMaterial`
- 入口位置: `ExhibitionHall.createEntrance()` at line 185 (z = depth/2 = 20)
- 粒子区域: `(0, 1-3, 20±5)`
- 材质: `transparent: true, blending: THREE.AdditiveBlending`
- 注册到 `_geometries` 数组确保资源清理

**渲染循环集成**: 粒子位置更新必须在 `app.js:173-194` 的 `animate()` 函数中，位于 `sceneManager.render()` 之前。

### 2. 碰撞检测系统

#### Bug 1: 展板未加入碰撞列表

**问题**: `app.js:57` 只传入 `exhibitionHall.walls`，展板数组 `exhibitionHall.panels` 从未加入碰撞目标。

**修复方案**:
```javascript
// app.js:57 修改
const collisionTargets = [
  ...exhibitionHall.walls,
  ...exhibitionHall.panels.flatMap(panel => 
    panel.children.filter(c => c.isMesh)
  )
];
playerControls.setWalls(collisionTargets);
```

**注意**: `Raycaster.intersectObjects()` 默认不递归，需要提取面板组内的 Mesh 子对象。

#### Bug 2: 碰撞响应无沿墙滑动

**问题**: `PlayerControls.js:193-199` 中 `checkCollision()` 返回单一 boolean，任何方向碰撞都会阻止所有移动。

**当前代码**:
```javascript
if (!this.checkCollision()) {
  this.camera.translateX(this.velocity.x * delta);
  this.camera.translateZ(this.velocity.z * delta);
}
```

**修复方案**: 分离 X/Z 轴碰撞检测
```javascript
const canMoveX = !this.checkAxisCollision('x');
const canMoveZ = !this.checkAxisCollision('z');

if (canMoveX) this.camera.translateX(this.velocity.x * delta);
if (canMoveZ) this.camera.translateZ(this.velocity.z * delta);
```

**射线配置**: `collisionDistance = 0.5`（`config.js:42`），在 60fps 下每帧移动约 0.08 单位，不会产生穿透。

### 3. 可交互 3D 模型系统

#### 指针锁定状态冲突

**核心矛盾**: 
- 现有射线检测需要指针锁定（`InteractionSystem.js:76`）
- 3D 模型拖拽旋转需要自由光标

**状态机设计**:
| 状态 | 指针锁定 | 射线检测 | 鼠标行为 |
|------|---------|---------|---------|
| 导航模式 | 锁定 | 激活(面板) | 相机视角 |
| 面板悬停 | 锁定 | 激活 | Tooltip |
| 模态框打开 | 解锁 | 禁用 | 模态框交互 |
| 模型交互(场景内) | 解锁 | 激活(模型) | 模型拖拽/缩放 |

#### 集成方案

**选项 A**: 注册到现有 `isPanel` 约定
- 创建透明 hitbox mesh，设置 `userData.isPanel: true`
- 添加到 `exhibitionHall.panels` 数组
- `_getHitboxes()` 自动拾取

**选项 B**: 独立注册表
- `InteractionSystem` 维护 `_interactiveModels` 数组
- 独立的射线检测 pass
- 合并 intersection 结果

**推荐**: 选项 A（复用现有基础设施）

#### 拖拽旋转实现

1. 在模型 hitbox 上捕获 `pointerdown`
2. `pointermove` 计算 delta → `model.rotation.y += deltaX * sensitivity`
3. `pointerup` 释放
4. 需要修改 `InteractionSystem.onMouseMove()` 区分"视角模式"和"模型交互模式"

### 4. 数据可视化大屏

#### 渲染策略选择

**CSS2DRenderer**: DOM 元素定位在 3D 空间，但当前项目未使用此渲染器。

**CanvasTexture on PlaneGeometry**: 已有成熟模式。

**推荐**: CanvasTexture（复用 `createTextSprite()` 模式）

#### 已有基础

**`ExhibitionHall.createTextSprite()` at `js/objects/ExhibitionHall.js:154-180`**:
- 创建离屏 canvas → 绘制内容 → `THREE.CanvasTexture` → `SpriteMaterial` → `Sprite`
- 已处理纹理追踪（`this._textures`）

**`UIManager._renderChart()` at `js/ui/UIManager.js:277-334`**:
- 已实现 2D canvas 柱状图渲染
- 使用 `ctx.fillRect()` 和 `ctx.fillText()`
- 可直接适配到离屏 canvas

#### 实现方案

```javascript
// 新建 DataDashboard 类
class DataDashboard {
  createChartPlane(data) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    // 复用 UIManager._renderChart() 的绘制逻辑
    this.drawChart(canvas, data);
    
    const texture = new THREE.CanvasTexture(canvas);
    const geometry = new THREE.PlaneGeometry(2.5, 1.5);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    return new THREE.Mesh(geometry, material);
  }
}
```

**动画更新**: 在 `app.js:173-194` 的渲染循环中设置 `texture.needsUpdate = true`。

#### 面板定位

**参考**: `ExhibitionHall.createPanel()` at line 193-240
- `spacing = 3`（面板间距）
- 面板尺寸: `BoxGeometry(2.5, 3.5, 0.1)`
- 数据大屏可放置在展厅中央或特定展区

### 5. 展板全屏沉浸模式

#### 当前模态框实现

**结构**: `index.html:93-119`
```
#modal (fixed, z-index: 1000)
  ├── .modal-overlay (rgba(0,0,0,0.8))
  └── .modal-content (90% width, max 800px)
       ├── .modal-header (title + tags)
       ├── .modal-body (preview-area + description)
       └── .modal-footer (download + close)
```

**流程**: `InteractionSystem.selectObject()` → `UIManager.showModal()` → 退出指针锁定 → 禁用玩家控制

#### 全屏模式实现

**CSS 扩展**:
```css
.modal.immersive .modal-content {
  width: 100vw;
  max-width: 100vw;
  height: 100vh;
  border-radius: 0;
}

.modal.immersive .modal-overlay {
  backdrop-filter: blur(20px);
  background: rgba(0, 0, 0, 0.95);
}
```

**3D 场景处理**:
- 模态框打开时渲染循环继续（`app.js:173-194`）
- `backdrop-filter: blur()` 产生深度效果
- 或降低渲染质量: `renderer.setPixelRatio(0.5)`

**过渡动画**:
```css
.modal.immersive .modal-content {
  animation: immersiveExpand 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
```

#### model3d 类型集成

**扩展点**:
1. `content.json`: 新增 `type: "model3d"` 字段
2. `ExhibitionHall.createPanel()`: 识别 model3d 类型
3. `ExhibitionHall.getTypeIcon()`: 添加 `model3d: '🧊'`
4. `UIManager.showPreview()`: 新增 `showModel3dPreview()` case
5. `index.html`: 添加 `<div id="model3d-preview">` 容器

### 6. 传送系统

#### 当前实现

**传送菜单**: `index.html:113-121`，使用 `data-position` 属性
**处理函数**: `UIManager.teleportTo()` at `js/ui/UIManager.js:376-383`
**相机瞬移**: `PlayerControls.teleportTo()` at `js/controls/PlayerControls.js:297-302`

#### 小地图点击传送

**坐标映射**:
- 正向: `minimapPx = 100 + worldX * 5`（`Minimap.js:125`）
- 逆向: `worldX = (clickX - 100) / 5`

**实现步骤**:
1. 在 `Minimap.init()` 添加 `canvas.addEventListener('click', ...)`
2. 逆向映射: `worldX = (e.offsetX - 100) / scale`
3. 边界限制: `±config.width/2` = `±20`
4. 调用 `UIManager.teleportTo(`${worldX},0,${worldZ}`)`

**视觉反馈**: 在小地图上绘制脉冲圆圈标记传送目标。

#### 传送动画

**当前**: 瞬间跳转（`camera.position.set`）
**改进**: 使用 `THREE.Vector3.lerp()` 在渲染循环中插值

### 7. 自动巡展模式

#### 控制权转移

**当前架构**: `app.js:173-194` 直接调用 `playerControls.update()`

**集成方案**:
```javascript
// app.js:181-183 修改
if (autoTourMode && autoTourMode.active) {
  autoTourMode.update();
} else if (playerControls) {
  playerControls.update();
}
```

**禁用机制**: `PlayerControls.disable()` at line 304-310 已有 `enabled` 守卫

#### 路径系统

**参考位置**（`UIManager.js:390-397`）:
```javascript
home: { x: 0, y: 0, z: 5 }
plans: { x: -10, y: 0, z: 0 }
cases: { x: 10, y: 0, z: 0 }
training: { x: 0, y: 0, z: -10 }
docs: { x: 0, y: 0, z: 10 }
```

**样条插值**: `THREE.CatmullRomCurve3` 创建平滑曲线
```javascript
const curve = new THREE.CatmullRomCurve3(waypointPositions);
const point = curve.getPoint(t); // t ∈ [0, 1]
```

**相机朝向**: `THREE.Quaternion.slerp()` 平滑旋转

#### 时钟同步问题

**问题**: `PlayerControls.update()` 不调用 `clock.getDelta()` 时，时钟累积时间。恢复控制时第一次 `getDelta()` 返回巨大值，导致跳跃。

**解决**: AutoTourMode 必须调用 `clock.getElapsedTime()` 保持时钟同步。

### 8. UI 增强

#### 小地图增强

**当前功能**: 绘制展区矩形 + 玩家位置/方向
**增强点**:
- 传送目标标记（脉冲圆圈）
- 展区名称标签
- 自动巡展进度路径

#### 加载界面

**当前**: 无加载进度条
**方案**: 添加 CSS 加载动画，在 `app.js:95` 的 `loadContent()` 完成后隐藏

## Code References

- `js/scene/SceneManager.js:77-89` — 渲染器配置（含色彩空间 bug）
- `js/scene/SceneManager.js:151-153` — render() 方法（需接入 EffectComposer）
- `js/objects/ExhibitionHall.js:14-20` — 资源追踪数组（_textures, _geometries）
- `js/objects/ExhibitionHall.js:54-87` — 材质定义（需重构为科技极简风）
- `js/objects/ExhibitionHall.js:154-180` — createTextSprite()（CanvasTexture 可复用模式）
- `js/objects/ExhibitionHall.js:193-283` — createPanel()（需扩展 model3d 类型）
- `js/controls/PlayerControls.js:193-199` — 碰撞响应（需分离 X/Z 轴）
- `js/controls/PlayerControls.js:244-290` — checkCollision()（需重构）
- `js/controls/PlayerControls.js:297-302` — teleportTo()（需添加动画插值）
- `js/controls/PlayerControls.js:304-310` — disable()/enable()（AutoTour 使用）
- `js/interaction/InteractionSystem.js:76-137` — onMouseMove()（指针锁定检查）
- `js/interaction/InteractionSystem.js:99-111` — _getHitboxes()（需扩展 hitbox 来源）
- `js/interaction/InteractionSystem.js:165-183` — findInteractiveParent()（isPanel 约定）
- `js/ui/UIManager.js:147-185` — showModal()（需扩展全屏模式）
- `js/ui/UIManager.js:243-254` — showPreview()（需新增 model3d case）
- `js/ui/UIManager.js:277-334` — _renderChart()（可复用绘制逻辑）
- `js/ui/UIManager.js:376-383` — teleportTo()（传送入口）
- `js/ui/Minimap.js:25-31` — 坐标映射参数（scale, offsetX, offsetY）
- `js/ui/Minimap.js:120-145` — drawPlayer()（正向映射示例）
- `js/app.js:57` — 碰撞目标注入（遗漏展板）
- `js/app.js:173-194` — 渲染循环（新增更新钩子位置）
- `js/config.js:42` — collisionDistance: 0.5
- `index.html:151` — Three.js 全局脚本引入
- `index.html:93-119` — 模态框 DOM 结构
- `index.html:113-121` — 传送菜单 DOM 结构
- `public/content/content.json` — 展示内容数据（需扩展 model3d 类型）

## Integration Points

### Inbound References
- `app.js:57` → `exhibitionHall.walls`（碰撞目标）
- `app.js:181` → `playerControls.update()`（渲染循环调用）
- `InteractionSystem.js:99` → `exhibitionHall.getPanels()`（hitbox 来源）
- `UIManager.js:376` → `playerControls.teleportTo()`（传送调用）

### Outbound Dependencies
- `SceneManager.js` ← `three`（核心库，需迁移）
- `SceneManager.js` ← `three/examples/jsm/postprocessing/*`（后处理插件）
- `ExhibitionHall.js` ← `THREE.Points`（粒子系统）
- `UIManager.js` ← `THREE.CanvasTexture`（数据可视化）

### Infrastructure Wiring
- `index.html:151` — Three.js 加载方式（全局 → npm）
- `app.js:1-13` — ES Module 导入（需添加新模块）
- `vite.config.js` — 构建配置（可能需要调整）

## Architecture Insights

### 已有模式可复用

1. **CanvasTexture 模式**（`ExhibitionHall.js:154-180`）:
   - 创建 canvas → 绘制 → CanvasTexture → Material → Mesh
   - 数据可视化和 3D 模型预览都可复用

2. **资源追踪模式**（`ExhibitionHall.js:14-20`）:
   - `_textures[]` 和 `_geometries[]` 数组
   - `dispose()` 方法统一清理

3. **控制权转移模式**（`UIManager.js:175-182`）:
   - `document.exitPointerLock()` + `playerControls.disable()`
   - AutoTourMode 和全屏模式都需遵循

4. **传送模式**（`UIManager.js:376-383`）:
   - 解析位置字符串 → 构建 Vector3 → 调用 teleportTo()

### 需要新建的架构

1. **交互状态机**: 管理导航/悬停/模态框/模型交互四种状态
2. **后处理管线**: EffectComposer 管理 Bloom/SSAO 效果
3. **AutoTourMode**: 路径插值 + 相机控制 + 时钟同步

## Precedents & Lessons

### Precedent: Vite 引入 + ES Modules 迁移

**Commit(s)**: `68ba701` — "feat: 架构优化 - 引入Vite/ES Modules，修复资源泄漏，补全交互功能" (2026-07-18)

**Blast radius**: 16 files across 8 layers

**Follow-up fixes**:
- `52f7359` — "fix: 修复 Vercel 部署 - 静态资源移至 public/ 目录" (2026-07-18) — 静态资源路径 404

**Takeaway**: 引入构建工具是 cross-module 级变更，静态资源路径必须同步迁移。

### Composite Lessons

1. **后处理管线是 cross-module 级变更** — 上次 Vite 引入触碰 16 文件，后处理管线将修改 SceneManager.js（渲染循环）、ExhibitionHall.js（材质 emissive），可能新建后处理模块。Three.js 从全局脚本迁移到 npm 包是隐性 cross-module 变更。

2. **碰撞检测列表遗漏展板** — `app.js:57` 仅传入 `exhibitionHall.walls`，展板不在碰撞列表中。这是已知未修复的 bug，FRD 5.1 明确要求修复。

3. **资源路径迁移必须同步** — `52f7359` 已证明：构建工具变更后静态资源路径会 404。若引入 Three.js ES Module 版本，`three.min.js` 全局脚本将被替换。

4. **交互系统与指针锁定状态耦合** — `InteractionSystem.js:76` 的指针锁定检查在新增 3D 模型交互时需要重新验证，避免状态冲突。

5. **材质追踪遗漏** — 验证报告已发现局部创建的材质未加入 `_textures` 追踪数组。新增后处理和粒子系统将引入更多材质，需从设计阶段就纳入资源生命周期管理。

## Developer Context

**Q (`SceneManager.js:89`): Three.js r128 的 `outputColorSpace = THREE.SRGBColorSpace` 是 r152+ API，当前代码隐性失败。后处理管线需要 ES Module 导入。您希望如何处理？**
A: 迁移到 npm 安装的 Three.js（移除 public/lib/three.min.js），启用 ES Module 后处理，同时修复色彩空间 API。

## Open Questions
- 无（所有关键决策已确认）

## Suggested Follow-ups

- 移动端触屏适配（未在本次范围）— `index.html` 响应式布局已存在，触屏手势需新增
- 多人协作功能（未在本次范围）— 需要 WebSocket/WebRTC 基础设施
- 真实 API 对接（未在本次范围）— `UIManager._renderChart()` 已有 fetch 逻辑可复用
- 语音导览功能（可后续添加）— Web Speech API 或第三方 TTS

## References
- `.rpiv/artifacts/discover/2026-07-18_00-30-00_digital-exhibition-hall-enhancement.md` — FRD 需求文档
- `.rpiv/artifacts/architecture-reviews/digital-exhibition-hall.md` — 架构评审报告
- `.rpiv/artifacts/validation/2026-07-17_23-04-53_architecture-review-digital-exhibition-hall.md` — 验证报告
