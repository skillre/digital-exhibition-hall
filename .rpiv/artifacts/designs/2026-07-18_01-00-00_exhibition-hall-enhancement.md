---
date: 2026-07-18T01:00:00+0800
author: skillre
commit: 52f7359
branch: main
repository: 数字展厅
topic: "展厅交互增强与科技极简风格升级"
tags: [design, threejs, postprocessing, interaction, state-machine, particles]
status: in-progress
parent: .rpiv/artifacts/research/2026-07-18_00-45-00_exhibition-hall-enhancement.md
last_updated: 2026-07-18T01:00:00+0800
last_updated_by: skillre
---

# Design: 展厅交互增强与科技极简风格升级

## Summary
将数字展厅从初级静态展示升级为成熟、高科技、专业的科技极简风格。通过迁移 Three.js 到 npm 获得 ES Module 后处理能力，实现 Bloom+SSAO 辉光效果；引入显式交互状态机管理导航/悬停/模态框/模型交互四种状态；修复碰撞检测 bug 实现沿墙滑动；新增可交互 3D 模型、数据可视化大屏、全屏沉浸模式、传送动画和自动巡展功能。

## Requirements
- 视觉升级：科技极简风格（浅灰 + 蓝色点缀），Bloom+SSAO 后处理，粒子系统
- 交互增强：可交互 3D 模型（程序化生成），实时数据可视化（静态 JSON），3D 模型嵌入展板，全屏沉浸模式
- 控制优化：碰撞检测修复，沿墙滑动，传送系统（小地图点击+动画），自动巡展模式
- 性能目标：60fps（GTX 1060 级别），加载 < 3 秒

## Current State Analysis

### Key Discoveries
- `SceneManager.js:89` 使用 r152+ API `outputColorSpace = THREE.SRGBColorSpace`，r128 中不存在
- `index.html:151` 全局加载 `three.min.js`，无法使用 ES Module 后处理插件
- `app.js:57` 碰撞目标仅包含 `exhibitionHall.walls`，遗漏展板
- `PlayerControls.js:193-199` 碰撞响应返回单一 boolean，无沿墙滑动
- `InteractionSystem.js:76` 射线检测依赖指针锁定，与模型拖拽交互冲突
- `ExhibitionHall.js:14-20` 资源追踪遗漏 `_materials` 数组

### Patterns to Follow
- `ExhibitionHall.createTextSprite()` at `ExhibitionHall.js:154-180` — CanvasTexture 模式
- `ExhibitionHall._textures/_geometries` at `ExhibitionHall.js:14-20` — 资源追踪模式
- `UIManager.showModal()` at `UIManager.js:175-182` — 控制权转移模式
- `UIManager.teleportTo()` at `UIManager.js:376-383` — 传送模式

### Constraints
- Three.js r128 → 需迁移到 npm 安装的版本
- 静态前端应用，无后端服务
- 程序化生成 3D 模型，不加载外部文件
- 60fps 性能目标

## Scope

### Building
- Three.js npm 迁移 + 后处理管线（Bloom + SSAO）
- 粒子系统（入口光点飘浮）
- 显式交互状态机（4 种状态）
- 碰撞检测修复 + 沿墙滑动
- InteractiveModel 类（拖拽旋转、缩放）
- DataDashboard 类（CanvasTexture 图表）
- model3d 展板类型 + 全屏沉浸模式
- 传送系统增强（小地图点击 + 动画）
- AutoTourMode（路径插值 + 定时停留）
- UI 增强（加载界面、小地图增强）

### Not Building
- 移动端触屏适配
- 多人协作/社交功能
- 真实 API 对接
- 语音导览功能
- 外部 glTF/GLB 模型加载

## Decisions

### Three.js 模块系统
**Ambiguity**: 全局脚本 vs ES Module
**Explored**: 全局脚本（当前，无法使用后处理插件）vs npm 安装（可使用完整功能）
**Decision**: 迁移到 npm 安装的 Three.js
**Rationale**: 研究阶段确认，用户批准

### SSAO 效果
**Ambiguity**: 性能影响 vs 视觉效果
**Decision**: 包含 SSAO（Bloom + SSAO 完整管线）
**Rationale**: 用户确认，科技极简风格需要深度感

### 传送动画
**Ambiguity**: 瞬间跳转 vs 平滑过渡
**Decision**: 平滑过渡（约 0.5 秒）
**Rationale**: 用户确认，提升用户体验

### 状态管理
**Ambiguity**: 显式状态机 vs 隐式状态管理
**Decision**: 显式状态机（InteractionStateMachine 类）
**Rationale**: 用户确认，降低模块耦合，便于扩展

### 数据可视化渲染
**Ambiguity**: CSS2DRenderer vs CanvasTexture
**Decision**: CanvasTexture on PlaneGeometry
**Rationale**: 复用 `createTextSprite()` 模式，已有成熟实现

### InteractiveModel 集成
**Ambiguity**: isPanel 约定 vs 独立注册表
**Decision**: 注册到现有 isPanel 约定
**Rationale**: 复用 `_getHitboxes()` 和 `findInteractiveParent()`

## Architecture

### js/scene/SceneManager.js — MODIFY

```javascript
// [Slice 1: 将填充完整代码]
```

### js/objects/ExhibitionHall.js — MODIFY

```javascript
// [Slice 2, 5: 将填充完整代码]
```

### js/interaction/InteractionStateMachine.js — NEW

```javascript
// [Slice 3: 将填充完整代码]
```

### js/interaction/InteractionSystem.js — MODIFY

```javascript
// [Slice 3, 4: 将填充完整代码]
```

### js/controls/PlayerControls.js — MODIFY

```javascript
// [Slice 3, 6: 将填充完整代码]
```

### js/objects/InteractiveModel.js — NEW

```javascript
// [Slice 4: 将填充完整代码]
```

### js/objects/DataDashboard.js — NEW

```javascript
// [Slice 4: 将填充完整代码]
```

### js/ui/UIManager.js — MODIFY

```javascript
// [Slice 5, 6: 将填充完整代码]
```

### js/ui/Minimap.js — MODIFY

```javascript
// [Slice 6, 7: 将填充完整代码]
```

### js/controls/AutoTourMode.js — NEW

```javascript
// [Slice 7: 将填充完整代码]
```

### js/app.js — MODIFY

```javascript
// [Slice 2, 3, 7: 将填充完整代码]
```

### js/config.js — MODIFY

```javascript
// [Slice 7: 将填充完整代码]
```

### index.html — MODIFY

```html
<!-- [Slice 1, 5: 将填充完整代码] -->
```

### public/content/content.json — MODIFY

```json
// [Slice 5: 将填充完整代码]
```

### css/style.css — MODIFY

```css
// [Slice 5: 将填充完整代码]
```

### package.json — MODIFY

```json
// [Slice 1: 将填充完整代码]
```

## Slices

### Slice 1: Three.js 迁移 + 后处理管线

**Files**: `package.json`, `index.html`, `js/scene/SceneManager.js`, `js/objects/ExhibitionHall.js`, `js/controls/PlayerControls.js`, `js/interaction/InteractionSystem.js`, `js/ui/UIManager.js`, `js/ui/Minimap.js`, `js/app.js`

#### Automated Verification:
- [ ] `npm install` 成功安装 `three` 依赖
- [ ] `npm run dev` 启动成功，无控制台错误
- [ ] 所有文件都有 `import * as THREE from 'three'`
- [ ] Bloom 辉光效果可见（门框、灯光装饰球发光）

#### Manual Verification:
- [ ] 展厅正常渲染，无黑屏
- [ ] 发光元素有辉光效果
- [ ] 窗口调整大小后效果正常

---

### Slice 2: 粒子系统 + 资源管理修复

**Files**: `js/objects/ExhibitionHall.js`, `js/app.js`

#### Automated Verification:
- [ ] `ExhibitionHall._materials` 数组存在
- [ ] 粒子系统在入口区域可见
- [ ] `dispose()` 正确清理所有资源

#### Manual Verification:
- [ ] 入口区域有光点飘浮效果
- [ ] 粒子动画流畅
- [ ] 页面关闭时无资源泄漏警告

---

### Slice 3: 交互状态机 + 碰撞修复

**Files**: `js/interaction/InteractionStateMachine.js` (NEW), `js/interaction/InteractionSystem.js`, `js/controls/PlayerControls.js`, `js/app.js`

#### Automated Verification:
- [ ] `InteractionStateMachine` 类可导入
- [ ] 状态转换规则正确（NAVIGATE ↔ HOVER ↔ MODAL）
- [ ] 玩家无法穿过展板
- [ ] 碰撞时可沿墙滑动

#### Manual Verification:
- [ ] 面板悬停时显示 tooltip
- [ ] 点击面板进入模态框
- [ ] ESC 关闭模态框后恢复正常控制
- [ ] 碰撞时可沿墙滑动而非卡住

---

### Slice 4: InteractiveModel + DataDashboard

**Files**: `js/objects/InteractiveModel.js` (NEW), `js/objects/DataDashboard.js` (NEW), `js/interaction/InteractionSystem.js`

#### Automated Verification:
- [ ] `InteractiveModel` 类可导入
- [ ] `DataDashboard` 类可导入
- [ ] 模型 hitbox 被射线检测到
- [ ] 图表 CanvasTexture 正确渲染

#### Manual Verification:
- [ ] 可交互 3D 模型可拖拽旋转
- [ ] 滚轮可缩放模型
- [ ] 数据大屏显示图表
- [ ] 图表悬停显示数值

---

### Slice 5: model3d 展板 + 全屏模式

**Files**: `js/objects/ExhibitionHall.js`, `js/ui/UIManager.js`, `public/content/content.json`, `css/style.css`, `index.html`

#### Automated Verification:
- [ ] `content.json` 包含 `type: "model3d"` 展板
- [ ] `ExhibitionHall.getTypeIcon()` 返回 model3d 图标
- [ ] `UIManager.showPreview()` 处理 model3d 类型
- [ ] 全屏模式 CSS 类 `.immersive` 生效

#### Manual Verification:
- [ ] model3d 展板显示 3D 模型
- [ ] 点击展板进入全屏沉浸模式
- [ ] ESC 退出全屏模式
- [ ] 全屏模式有过渡动画

---

### Slice 6: 传送系统增强

**Files**: `js/ui/Minimap.js`, `js/controls/PlayerControls.js`, `js/ui/UIManager.js`

#### Automated Verification:
- [ ] `Minimap.minimapToWorld()` 方法存在
- [ ] 小地图点击事件已绑定
- [ ] 传送动画使用 `Vector3.lerp()`
- [ ] 边界检查正确（±20 单位）

#### Manual Verification:
- [ ] 点击小地图可传送
- [ ] 传送有平滑过渡动画
- [ ] 传送目标标记可见
- [ ] 传送到边界外被阻止

---

### Slice 7: AutoTourMode + UI 增强

**Files**: `js/controls/AutoTourMode.js` (NEW), `js/app.js`, `js/config.js`, `js/ui/Minimap.js`

#### Automated Verification:
- [ ] `AutoTourMode` 类可导入
- [ ] 路径插值使用 `CatmullRomCurve3`
- [ ] 渲染循环正确调用 `autoTourMode.update()`
- [ ] 加载界面有进度条

#### Manual Verification:
- [ ] 自动巡展模式可启动
- [ ] 相机沿路径平滑移动
- [ ] 每个展区停留 5 秒
- [ ] ESC 可停止巡展
- [ ] 加载界面显示进度

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

## File Map
- `package.json` — MODIFY — 添加 three 依赖
- `index.html` — MODIFY — 移除全局 three.min.js，添加 model3d-preview 容器
- `js/scene/SceneManager.js` — MODIFY — 集成 EffectComposer，修复色彩空间
- `js/objects/ExhibitionHall.js` — MODIFY — 添加粒子系统、_materials 追踪、model3d 支持
- `js/interaction/InteractionStateMachine.js` — NEW — 显式状态机
- `js/interaction/InteractionSystem.js` — MODIFY — 集成状态机、扩展 hitbox
- `js/controls/PlayerControls.js` — MODIFY — 碰撞修复、传送动画
- `js/objects/InteractiveModel.js` — NEW — 可交互 3D 模型
- `js/objects/DataDashboard.js` — NEW — 数据可视化大屏
- `js/ui/UIManager.js` — MODIFY — 全屏模式、model3d 预览
- `js/ui/Minimap.js` — MODIFY — 点击传送、坐标映射
- `js/controls/AutoTourMode.js` — NEW — 自动巡展模式
- `js/app.js` — MODIFY — 渲染循环集成、新模块初始化
- `js/config.js` — MODIFY — 新增自动巡展配置
- `public/content/content.json` — MODIFY — 扩展 model3d 类型
- `css/style.css` — MODIFY — 全屏模式样式

## Ordering Constraints
1. **Slice 1 必须最先执行** — Three.js 迁移是所有后处理的基础
2. **Slice 2 依赖 Slice 1** — 粒子系统需要 ES Module
3. **Slice 3 依赖 Slice 1** — 状态机需要 Three.js
4. **Slice 4 依赖 Slice 3** — InteractiveModel 需要状态机
5. **Slice 5 依赖 Slice 4** — model3d 展板需要 InteractiveModel
6. **Slice 6 依赖 Slice 3** — 传送系统独立于模型
7. **Slice 7 依赖 Slice 3** — AutoTourMode 独立于模型

**并行可能**: Slice 6 和 Slice 7 可并行执行（都依赖 Slice 3，但互不依赖）

## Verification Notes
- **Three.js 版本**: 确认安装的版本支持 EffectComposer（r128+ 即可）
- **色彩空间**: `outputEncoding = THREE.sRGBEncoding` 在 r128 中正确
- **碰撞检测**: 展板 mesh 需要提取（`panel.children.filter(c => c.isMesh)`）
- **指针锁定**: InteractiveModel 需要条件性抑制 pointer lock
- **资源清理**: 新增的材质/几何体/纹理必须加入追踪数组
- **性能**: Bloom + SSAO 在 GTX 1060 上预计 ~45-55fps，需调优参数

## Performance Considerations
- **Bloom**: strength=0.8, radius=0.3, threshold=0.2 — 平衡效果与性能
- **SSAO**: kernelRadius=16, minDistance=0.005, maxDistance=0.1 — 中等质量
- **粒子**: 200 个粒子，AdditiveBlending — 性能影响小
- **降级**: 可通过 `performance.deviceMemory` 检测设备，低端设备禁用 SSAO

## Migration Notes
- **Three.js 迁移**: 移除 `public/lib/three.min.js`，安装 `three` npm 包
- **静态资源**: `content.json` 路径已正确（`public/content/`）
- **向后兼容**: 新增功能不影响现有功能，可渐进式启用

## Pattern References
- `ExhibitionHall.js:154-180` — CanvasTexture 模式（数据可视化复用）
- `ExhibitionHall.js:14-20` — 资源追踪模式（_materials 补全）
- `UIManager.js:175-182` — 控制权转移模式（AutoTourMode 复用）
- `InteractionSystem.js:132-145` — hitbox 收集模式（InteractiveModel 集成）

## Developer Context
**Q (`SceneManager.js:89`): Three.js r128 色彩空间 API 不兼容，如何处理？**
A: 迁移到 npm 安装的 Three.js，启用 ES Module 后处理。

**Q: SSAO 效果是否包含？**
A: 包含 SSAO（Bloom + SSAO 完整管线）。

**Q: 传送动画方式？**
A: 平滑过渡（约 0.5 秒）。

**Q: 状态管理方式？**
A: 显式状态机（InteractionStateMachine 类）。

## Design History
- Slice 1: Three.js 迁移 + 后处理管线 — approved as generated (2026-07-18)
- Slice 2: 粒子系统 + 资源管理修复 — pending
- Slice 3: 交互状态机 + 碰撞修复 — pending
- Slice 4: InteractiveModel + DataDashboard — pending
- Slice 5: model3d 展板 + 全屏模式 — pending
- Slice 6: 传送系统增强 — pending
- Slice 7: AutoTourMode + UI 增强 — pending

## References
- `.rpiv/artifacts/research/2026-07-18_00-45-00_exhibition-hall-enhancement.md` — 研究文档
- `.rpiv/artifacts/discover/2026-07-18_00-30-00_digital-exhibition-hall-enhancement.md` — FRD 需求文档
- Three.js 后处理文档: https://threejs.org/examples/#webgl_postprocessing
