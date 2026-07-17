---
date: "2026-07-17T14:17:23+08:00"
author: skillre
commit: 4d109fe18aa3433a07093d136c390fa676d43722
branch: main
repository: 数字展厅
target: /Users/skillre/claude/系统开发/数字展厅/
target_kind: directory
layer_count: 8
phases: [{n: 1, title: "致命缺陷修复", depends_on: [], blast_radius: internal, effort: S}, {n: 2, title: "引入构建工具", depends_on: [1], blast_radius: cross-module, effort: L}, {n: 3, title: "资源生命周期修复", depends_on: [2], blast_radius: internal, effort: M}, {n: 4, title: "交互状态机统一", depends_on: [2], blast_radius: internal, effort: M}, {n: 5, title: "功能补全与清理", depends_on: [3, 4], blast_radius: internal, effort: M}]
unresolved_finding_count: 0
status: ready
tags: [architecture-review, threejs, 3d-exhibition, vanilla-js]
last_updated: "2026-07-17T14:17:23+08:00"
last_updated_by: skillre
---

# Architecture Review: 数字展厅

## Conventions

每个发现包含：ID、Evidence（file:line + 引用）、Current state、Desired state、Proposed improvement、Severity (Low/Med/High)、Effort (S/M/L)、Blast radius (internal/public-API/on-disk/cross-module)、Class (polish/redesign)、Status。

## Methodology Principles

_在逐层审查过程中捕获。_

## Layer 0 — 入口/门面

### L0-01: 缺失的 Panel.js 脚本引用
- [x] 已修复：删除了该 script 标签
- **Evidence**: `index.html:87` — `<script src="js/objects/Panel.js"></script>`
- **Current state**: 引用了一个不存在的文件，浏览器产生 404 错误。由于同步加载，可能阻断后续脚本执行。
- **Desired state**: 所有 script 标签引用的文件都应存在。
- **Proposed improvement**: 删除该 script 标签（面板逻辑已在 ExhibitionHall.js 中）。
- **Severity**: High
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### L0-02: 同步脚本加载链
- [x] 已修复：改为 ES Modules，仅保留 three.min.js 作为全局脚本
- **Evidence**: `index.html:83-95` — 7 个 `<script>` 标签同步加载
- **Current state**: 所有脚本同步加载，无 defer/async。加载顺序即依赖顺序，任何一个失败会阻断后续。
- **Desired state**: 使用 ES Modules 或 defer 加载，避免阻塞渲染。
- **Proposed improvement**: 引入 Vite 后改为 ES Modules 导入。
- **Severity**: Med
- **Effort**: M
- **Blast radius**: internal
- **Class**: redesign

### L0-03: main.js 职责过多
- [x] 已修复：拆分为 config.js、app.js、各模块独立文件
- **Evidence**: `js/main.js` — 248 行，包含配置、状态、初始化、内容加载、FPS 计算、渲染循环
- **Current state**: 单文件承担了应用配置、模块初始化、内容加载、渲染循环、FPS 统计等多个职责。
- **Desired state**: 按职责拆分为 config.js、app.js、renderer.js 等。
- **Proposed improvement**: 拆分为 3-4 个文件，使用 ES Modules 导入。
- **Severity**: Med
- **Effort**: M
- **Blast radius**: internal
- **Class**: redesign

### L0-04: 硬编码内容数据
- [x] 已修复：改为 fetch('content/content.json') 动态加载
- **Evidence**: `js/main.js:83-183` — loadExhibitionContent() 使用硬编码数据
- **Current state**: content.json 定义了 12 个面板，但 main.js 使用硬编码的 7 个面板。数据不一致。
- **Desired state**: 使用 fetch('content/content.json') 动态加载。
- **Proposed improvement**: 替换为 fetch 调用，删除硬编码数据。
- **Severity**: High
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### L0-05: 全局变量耦合
- [x] 已修复：使用 ES Modules import/export，保留 window.App 仅用于跨模块回调
- **Evidence**: `js/main.js:229-238` — window.App 全局对象
- **Current state**: 所有模块通过 window.* 导出，跨模块通信依赖 window.App。无法进行单元测试。
- **Desired state**: 使用 ES Modules 导入/导出，消除全局变量。
- **Proposed improvement**: 引入 Vite 后改为 import/export。
- **Severity**: Med
- **Effort**: L
- **Blast radius**: cross-module
- **Class**: redesign

### L0-06: 使用已废弃的 keyCode
- [x] 已修复：替换为 event.code
- **Evidence**: `js/controls/PlayerControls.js:87-114` — switch(event.keyCode)
- **Current state**: keyCode 已从 Web 标准中废弃。
- **Desired state**: 使用 event.key 或 event.code。
- **Proposed improvement**: 替换为 event.code 映射表。
- **Severity**: Low
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### Layer 0 — tally

| Status | Count |
|---|---|
| accepted | 6 |
| rejected | 0 |
| deferred | 0 |
| pending | 0 |

## Layer 1 — 场景管理

### L1-01: 未使用的 Clock 对象
- [x] 已修复：传递给 PlayerControls，使用 getDelta()
- **Evidence**: `js/scene/SceneManager.js:35` — this.clock = new THREE.Clock()
- **Current state**: Clock 已创建但从未使用。PlayerControls 使用硬编码 delta。
- **Desired state**: 使用 Clock.getDelta() 获取实际帧时间差。
- **Proposed improvement**: 将 clock 传递给 PlayerControls，使用 getDelta() 替代硬编码值。
- **Severity**: Low
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### L1-02: 渲染器使用已废弃 API
- [x] 已修复：改为 outputColorSpace = THREE.SRGBColorSpace
- **Evidence**: `js/scene/SceneManager.js:85` — this.renderer.outputEncoding = THREE.sRGBEncoding
- **Current state**: Three.js r150+ 中 outputEncoding 已更名为 outputColorSpace。
- **Desired state**: 使用新 API。
- **Proposed improvement**: 更新为 renderer.outputColorSpace = THREE.SRGBColorSpace。
- **Severity**: Low
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### L1-03: 缺少性能监控
- **Evidence**: `js/scene/SceneManager.js` — 无性能监控
- **Current state**: 无 draw call 统计、无内存使用监控、无 GPU 信息。
- **Desired state**: 可选的性能监控面板。
- **Proposed improvement**: 添加 renderer.info 读取和可选的 Stats.js 集成。
- **Severity**: Low
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### Layer 1 — tally

| Status | Count |
|---|---|
| accepted | 3 |
| rejected | 0 |
| deferred | 0 |
| pending | 0 |

## Layer 2 — 3D 对象

### L2-01: createTextSprite 纹理泄漏
- [x] 已修复：维护 _textures 数组，dispose 时遍历清理
- **Evidence**: `js/objects/ExhibitionHall.js:176-210` — 每次调用创建 canvas + CanvasTexture + SpriteMaterial
- **Current state**: 约调用 17 次，创建 17 个 canvas、17 个纹理、17 个材质。dispose() 不清理这些资源。
- **Desired state**: 复用 canvas/纹理，或在 dispose 时正确清理。
- **Proposed improvement**: 维护纹理池，dispose 时遍历清理所有创建的纹理。
- **Severity**: Med
- **Effort**: M
- **Blast radius**: internal
- **Class**: polish

### L2-02: dispose() 不清理几何体
- [x] 已修复：维护 _geometries 数组，dispose 时遍历清理
- **Evidence**: `js/objects/ExhibitionHall.js:310-325` — 仅清理 materials，不清理几何体
- **Current state**: createFloor/createWalls/createCeiling/createDecorations/createPanel 创建了大量几何体，dispose 时未释放。
- **Desired state**: dispose() 应清理所有 GPU 资源（几何体 + 材质 + 纹理）。
- **Proposed improvement**: 遍历 scene 中所有对象，递归清理几何体和材质。
- **Severity**: Med
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### L2-03: 展板布局硬编码
- **Evidence**: `js/objects/ExhibitionHall.js:247-250` — spacing = 3, startX 计算
- **Current state**: 展板间距和位置计算硬编码在 createPanel 方法中。
- **Desired state**: 布局参数应可配置。
- **Proposed improvement**: 将布局参数提取到配置对象中。
- **Severity**: Low
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### L2-04: 文字精灵中文渲染依赖系统字体
- [x] 已修复：使用通用字体栈 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif
- **Evidence**: `js/objects/ExhibitionHall.js:193` — context.font = 'Bold 48px Microsoft YaHei'
- **Current state**: 硬编码 Microsoft YaHei 字体，在非 Windows 系统上可能回退到其他字体，导致渲染不一致。
- **Desired state**: 使用通用字体栈或 Web Font。
- **Proposed improvement**: 使用 'sans-serif' 回退或加载 Web Font。
- **Severity**: Low
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### Layer 2 — tally

| Status | Count |
|---|---|
| accepted | 4 |
| rejected | 0 |
| deferred | 0 |
| pending | 0 |

## Layer 3 — 控制系统

### L3-01: 硬编码帧时间差
- [x] 已修复：使用 clock.getDelta() 获取实际帧时间差
- **Evidence**: `js/controls/PlayerControls.js:143` — const delta = 0.016
- **Current state**: 假设 60fps 固定帧率。在非 60Hz 显示器上移动速度不一致。
- **Desired state**: 使用实际帧时间差。
- **Proposed improvement**: 使用 SceneManager.clock.getDelta() 或 performance.now() 计算实际 delta。
- **Severity**: Med
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### L3-02: 碰撞检测不完整
- **Evidence**: `js/controls/PlayerControls.js:175-210` — 仅检测前方、左方、右方
- **Current state**: 不检测后方碰撞，不检测天花板和地板边界。玩家可以穿过某些方向。
- **Desired state**: 360 度碰撞检测 + 垂直边界检查。
- **Proposed improvement**: 添加后方射线检测和地板/天花板边界约束。
- **Severity**: Med
- **Effort**: M
- **Blast radius**: internal
- **Class**: polish

### L3-03: 碰撞检测依赖全局变量
- [x] 已修复：通过 setWalls() 方法注入碰撞对象
- **Evidence**: `js/controls/PlayerControls.js:183` — window.App?.exhibitionHall()?.walls
- **Current state**: 通过全局访问链获取碰撞对象，脆弱且不可测试。
- **Desired state**: 通过构造函数注入碰撞对象。
- **Proposed improvement**: 将 walls 数组作为参数传入或通过依赖注入获取。
- **Severity**: Med
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### L3-04: 事件监听器泄漏
- [x] 已修复：在构造函数中预绑定，保存引用
- **Evidence**: `js/controls/PlayerControls.js:59` — this.domElement.addEventListener('click', this.requestPointerLock.bind(this))
- **Current state**: .bind(this) 创建新函数引用，dispose() 中的 removeEventListener 无法匹配。
- **Desired state**: 保存绑定后的引用，dispose 时正确移除。
- **Proposed improvement**: 在构造函数中预绑定，保存引用。
- **Severity**: Med
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### Layer 3 — tally

| Status | Count |
|---|---|
| accepted | 4 |
| rejected | 0 |
| deferred | 0 |
| pending | 0 |

## Layer 4 — 交互层

### L4-01: 鼠标移动不检查指针锁定状态
- [x] 已修复：添加 pointerLockElement 和模态框检查
- **Evidence**: `js/interaction/InteractionSystem.js:75` — onMouseMove 始终处理射线检测
- **Current state**: 即使指针未锁定或模态框打开，仍处理射线检测和高亮。
- **Desired state**: 仅在指针锁定且无模态框时处理。
- **Proposed improvement**: 添加 pointerLockElement 和 isModalOpen 检查。
- **Severity**: Med
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### L4-02: 空的 update 方法
- [x] 已修复：移除空方法，从渲染循环中移除调用
- **Evidence**: `js/interaction/InteractionSystem.js:222` — update() { }
- **Current state**: 空方法在渲染循环中每帧调用。
- **Desired state**: 移除或实现实际逻辑。
- **Proposed improvement**: 删除空方法，从渲染循环中移除调用。
- **Severity**: Low
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### L4-03: intersectObjects 递归标志性能问题
- [x] 已修复：收集 hitbox 数组，使用非递归检测
- **Evidence**: `js/interaction/InteractionSystem.js:80` — raycaster.intersectObjects(interactables, true)
- **Current state**: 递归标志=true 会测试每个面板组的所有子对象（mesh、line、sprite），增加不必要的计算。
- **Desired state**: 仅测试 hitbox 对象。
- **Proposed improvement**: 收集所有 hitbox mesh 到一个数组，非递归检测。
- **Severity**: Low
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### L4-04: 工具提示不跟随窗口大小变化
- [x] 已修复：添加边界检查，确保不超出视口
- **Evidence**: `js/interaction/InteractionSystem.js:130-135` — 使用 event.clientX/Y 定位
- **Current state**: 工具提示使用鼠标事件坐标定位，窗口大小变化后坐标系不变但工具提示可能溢出。
- **Desired state**: 工具提示应限制在视口内。
- **Proposed improvement**: 添加边界检查，确保工具提示不超出视口。
- **Severity**: Low
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### Layer 4 — tally

| Status | Count |
|---|---|
| accepted | 4 |
| rejected | 0 |
| deferred | 0 |
| pending | 0 |

## Layer 5 — UI 层

### L5-01: 匿名函数事件绑定导致泄漏
- [x] 已修复：预绑定所有事件处理函数
- **Evidence**: `js/ui/UIManager.js:41-70` — 多处使用 () => this.hideModal() 匿名函数
- **Current state**: 匿名函数无法在 dispose() 中移除（代码注释承认了这一点）。
- **Desired state**: 使用预绑定的命名方法引用。
- **Proposed improvement**: 在构造函数中预绑定所有事件处理函数。
- **Severity**: Med
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### L5-02: 缺少 chart 类型预览
- [x] 已修复：添加 chart case，实现 canvas 柱状图渲染
- **Evidence**: `js/ui/UIManager.js:123-135` — showPreview 仅处理 document/image/video
- **Current state**: content.json 定义了 type: "chart" 的面板，但预览逻辑无此分支，仅输出警告。
- **Desired state**: 支持图表预览（集成 ECharts 或类似库）。
- **Proposed improvement**: 添加 chart case，集成图表渲染库。
- **Severity**: Med
- **Effort**: M
- **Blast radius**: internal
- **Class**: polish

### L5-03: 模态框不退出指针锁定
- [x] 已修复：在 showModal() 中调用 document.exitPointerLock()
- **Evidence**: `js/ui/UIManager.js:95` — playerControls.disable() 但不 exitPointerLock()
- **Current state**: 模态框打开时指针仍然锁定，用户无法看到鼠标光标。
- **Desired state**: 模态框打开时退出指针锁定，关闭时恢复。
- **Proposed improvement**: 在 showModal() 中调用 document.exitPointerLock()。
- **Severity**: Med
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### L5-04: 小地图未实现
- [x] 已修复：创建 Minimap.js，实现 2D canvas 小地图
- **Evidence**: `index.html:67-70` + `css/style.css:142-153` — HTML 和 CSS 已定义，但 JS 无实现
- **Current state**: 小地图容器和样式存在，但无 JS 代码驱动。
- **Desired state**: 实现 2D 小地图，显示展厅俯视图和玩家位置。
- **Proposed improvement**: 创建 Minimap.js，使用 2D canvas 绘制。
- **Severity**: Low
- **Effort**: M
- **Blast radius**: internal
- **Class**: polish

### L5-05: OrbitControls 加载但未使用
- [x] 已修复：移除未使用的库加载
- **Evidence**: `index.html:84` — `<script src="lib/OrbitControls.js"></script>`
- **Current state**: 加载了 OrbitControls 库但从未实例化。PlayerControls 实现了自己的 FPS 控制器。
- **Desired state**: 移除未使用的库加载。
- **Proposed improvement**: 删除 OrbitControls.js 的 script 标签。
- **Severity**: Low
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### Layer 5 — tally

| Status | Count |
|---|---|
| accepted | 5 |
| rejected | 0 |
| deferred | 0 |
| pending | 0 |

## Layer 6 — 样式

### L6-01: 响应式设计不完整
- [x] 已修复：添加 480px、768px、1024px 多断点
- **Evidence**: `css/style.css:228-248` — 仅有 768px 断点
- **Current state**: 仅有一个媒体查询断点（768px），移动端导航直接隐藏（display:none）。
- **Desired state**: 多断点响应式设计，移动端有替代导航方案。
- **Proposed improvement**: 添加 480px、1024px 断点，移动端使用汉堡菜单。
- **Severity**: Low
- **Effort**: M
- **Blast radius**: internal
- **Class**: polish

### L6-02: UI 层指针事件处理
- [x] 已审查：pointer-events: none + children auto 模式正确
- **Evidence**: `css/style.css:47-51` — #ui-layer pointer-events: none, children auto
- **Current state**: UI 层使用 pointer-events: none 透传点击到 3D 画布，子元素 auto 恢复。但某些覆盖元素可能意外拦截点击。
- **Desired state**: 明确的指针事件层级管理。
- **Proposed improvement**: 审查所有 UI 元素的 pointer-events 设置。
- **Severity**: Low
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### Layer 6 — tally

| Status | Count |
|---|---|
| accepted | 2 |
| rejected | 0 |
| deferred | 0 |
| pending | 0 |

## Layer 7 — 数据/配置

### L7-01: 资源文件缺失
- **Evidence**: `content/content.json` 引用了 12+ 个图片缩略图，`assets/images/` 仅含 1 个文件
- **Current state**: content.json 引用的 thumbnail 路径对应的文件几乎全部不存在。
- **Desired state**: 所有引用的资源文件都应存在，或使用占位图。
- **Proposed improvement**: 生成占位图或提供默认缩略图逻辑。
- **Severity**: Med
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### L7-02: GitHub Pages 子目录路径问题
- **Evidence**: `content/content.json` — 相对路径如 "content/documents/data-classification.pdf"
- **Current state**: 在 GitHub Pages 子目录部署时，相对路径可能解析失败。
- **Desired state**: 使用相对于站点根目录的路径。
- **Proposed improvement**: 使用绝对路径（以 / 开头）或在构建时注入 base URL。
- **Severity**: Med
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

### Layer 7 — tally

| Status | Count |
|---|---|
| accepted | 2 |
| rejected | 0 |
| deferred | 0 |
| pending | 0 |

## Cross-cutting Themes

### T1 — 资源生命周期管理 (active)

**Findings**: L2-01, L2-02, L3-04, L5-01

纹理、几何体、事件监听器的创建和销毁不对称。每次初始化/销毁周期都会泄漏 GPU 资源和 DOM 事件监听器。需要建立统一的资源追踪和清理机制。

### T2 — 全局耦合与模块化 (active)

**Findings**: L0-02, L0-03, L0-05, L3-03

所有模块通过 window 全局变量通信，同步脚本加载链，单文件职责过多。引入 Vite + ES Modules 是根本解决方案。

### T3 — 输入状态管理 (active)

**Findings**: L3-01, L4-01, L5-03

指针锁定、模态框状态、玩家控制状态之间缺乏统一的状态机。各模块独立管理自己的状态，导致状态冲突和输入丢失。

### T4 — 文档与实现偏差 (active)

**Findings**: L0-01, L0-04, L5-02, L5-04, L7-01

文档描述了多个不存在的文件和未实现的功能。需要同步文档和实现，或以实现为准更新文档。

## Consolidated Polish Plan

### Phase 1 — 致命缺陷修复 (Foundation)
- **Findings**: L0-01, L0-04
- **Files**: index.html, js/main.js
- **Blast radius**: internal
- **Effort**: S
- **Class**: 100% polish

删除不存在的 Panel.js script 标签，将硬编码数据替换为 fetch content.json。

### Phase 2 — 引入构建工具 (Structural)
- **Findings**: L0-02, L0-03, L0-05
- **Files**: 新增 vite.config.js, package.json; 重构所有 JS 文件
- **Blast radius**: cross-module
- **Effort**: L
- **Class**: 100% redesign

引入 Vite，将全局变量耦合改为 ES Modules，拆分 main.js。

### Phase 3 — 资源生命周期修复 (Behavioural)
- **Findings**: L2-01, L2-02, L3-04, L5-01
- **Files**: js/objects/ExhibitionHall.js, js/controls/PlayerControls.js, js/ui/UIManager.js
- **Blast radius**: internal
- **Effort**: M
- **Class**: 100% polish

修复纹理泄漏、几何体泄漏、事件监听器泄漏。

### Phase 4 — 交互状态机统一 (Behavioural)
- **Findings**: L3-01, L3-02, L3-03, L4-01, L5-03
- **Files**: js/controls/PlayerControls.js, js/interaction/InteractionSystem.js, js/ui/UIManager.js
- **Blast radius**: internal
- **Effort**: M
- **Class**: 100% polish

统一指针锁定/模态框/玩家控制状态管理，修复碰撞检测。

### Phase 5 — 功能补全与清理 (Polish)
- **Findings**: L1-01, L1-02, L1-03, L4-02, L4-03, L4-04, L5-02, L5-04, L5-05, L6-01, L6-02, L7-01, L7-02
- **Files**: 多个文件
- **Blast radius**: internal
- **Effort**: M
- **Class**: 100% polish

清理死代码、更新废弃 API、补全小地图和图表预览、修复资源路径。

```
Phase 1 (Foundation — 致命缺陷)
   ↓
Phase 2 (Structural — 引入 Vite)
   ↓
   ├──► Phase 3 (Behavioural — 资源生命周期)
   └──► Phase 4 (Behavioural — 交互状态机)
              ↓
        Phase 5 (Polish — 功能补全)
```
