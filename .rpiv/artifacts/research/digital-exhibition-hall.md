---
date: "2026-07-17T14:17:23+08:00"
author: skillre
commit: 4d109fe18aa3433a07093d136c390fa676d43722
branch: main
repository: 数字展厅
topic: "数字展厅项目全面架构分析"
tags: [research, codebase, threejs, 3d-exhibition, architecture]
status: ready
last_updated: "2026-07-17T14:17:23+08:00"
last_updated_by: skillre
---

# Research: 数字展厅项目全面架构分析

## Research Question

对当前目录下的 Three.js 3D 数字展厅项目进行全面的代码库分析，识别架构模式、潜在问题、性能瓶颈和改进方向。

## Summary

这是一个基于 Three.js 的纯前端 3D 虚拟展厅项目，采用原生 ES6 类 + 全局变量耦合的架构模式。项目存在 **1 个致命缺陷**（缺失的 Panel.js 文件）、**1 个数据流断裂**（content.json 未被使用）、**多个资源泄漏点**（事件监听器、纹理、几何体）、以及 **若干未实现的功能**（小地图、图表预览）。项目处于早期开发阶段（仅 1 次提交），文档完整但代码实现与文档描述存在偏差。

## Detailed Findings

### 1. 致命缺陷：缺失的 Panel.js 文件

`index.html:87` 通过 `<script src="js/objects/Panel.js">` 加载了一个不存在的文件。该文件在磁盘上不存在，浏览器会产生 404 错误。由于脚本是同步加载（无 `defer`/`async`），这个 404 **可能阻断后续脚本的执行**。

实际的面板创建逻辑内联在 `ExhibitionHall.js:createPanel()` 方法中（`ExhibitionHall.js:230`），返回一个包含 userData 的 `THREE.Group`。这表明 Panel.js 是计划中但从未创建的独立类。

**影响**：在某些浏览器中，同步脚本 404 会导致后续脚本（PlayerControls.js、InteractionSystem.js、UIManager.js）无法执行，使整个应用崩溃。

### 2. 数据流断裂：content.json 未被使用

`content/content.json` 定义了 4 个展区共 12 个面板，但 `js/main.js:loadExhibitionContent()` 完全忽略了这个文件，转而使用一个硬编码的 `contentData` 对象（仅 7 个面板）。

两处数据存在差异：
- **content.json**: panel-001 到 panel-012，每区 3 个面板
- **main.js 硬编码**: panel-001 到 panel-007，面板数量不一致

`UIManager.updateContentList()` 接收数据后仅输出日志，未实际更新 UI。content.json 应该是权威数据源，main.js 中的硬编码是开发占位符，从未被替换为 `fetch('content/content.json')` 调用。

### 3. 全局变量耦合架构

所有模块通过 `window.*` 导出，跨模块通信依赖 `window.App` 全局对象（`main.js:229`）：

```
main.js → window.App = { sceneManager, exhibitionHall, playerControls, interactionSystem, uiManager }
PlayerControls → window.App.exhibitionHall().walls (碰撞检测)
InteractionSystem → window.App.uiManager().showModal() (显示详情)
```

这种模式创建了紧密的双向耦合，模块初始化顺序变得关键，且无法进行单元测试。

### 4. 碰撞检测系统缺陷

`PlayerControls.js:checkCollision()` 存在多个问题：
- 通过 `window.App?.exhibitionHall()?.walls` 获取碰撞对象，全局访问链脆弱
- 仅检测前方、左方、右方射线，**不检测后方碰撞**
- 不检测天花板和地板边界
- `update()` 使用硬编码 `const delta = 0.016` 而非实际帧时间差
- 在非 60Hz 显示器上会导致移动速度不一致

### 5. 指针锁定生命周期冲突

`PlayerControls` 和 `InteractionSystem` 之间存在指针锁定状态冲突：

```
画布点击 → requestPointerLock() → pointerlockchange → isLocked=true
→ 鼠标移动射线检测（InteractionSystem 不检查锁定状态）
→ 点击检测（需要指针锁定才能触发）
→ 模态框打开 → playerControls.disable()
→ 但指针仍然锁定！→ 模态框关闭 → playerControls.enable()
```

问题点：
- `InteractionSystem.onMouseMove()` 不检查指针锁定状态，始终处理射线检测
- `UIManager.showModal()` 调用 `playerControls.disable()` 但不调用 `document.exitPointerLock()`
- 模态框打开时鼠标移动仍会触发射线检测和高亮

### 6. 资源泄漏清单

**纹理泄漏**：`ExhibitionHall.createTextSprite()` 每次调用创建 canvas + CanvasTexture + SpriteMaterial，约调用 17 次（入口文字 + 4 展区标识 + 12 面板标题 + 12 类型图标），这些纹理从未被追踪或释放。

**几何体泄漏**：`ExhibitionHall.dispose()` 仅清理材质，不清理几何体（PlaneGeometry、BoxGeometry、SphereGeometry、EdgesGeometry）。

**事件监听器泄漏**：
- `UIManager.bindEvents()` 使用匿名箭头函数注册事件，`dispose()` 中无法移除（代码注释承认了这一点）
- `PlayerControls.bindEvents()` 在 addEventListener 中内联 `.bind(this)`，创建新函数引用，`dispose()` 中的 removeEventListener 无法匹配

**每初始化/销毁周期泄漏**：约 17 个纹理 + N 个几何体 + 9+ 个事件监听器。

### 7. 每帧性能开销

渲染循环（`main.js:startRenderLoop()`）每帧执行：
- `playerControls.update()`: 4 次射线检测（前、左、右 + 方向检查）
- `interactionSystem.update()`: **空方法**，死代码
- `updateFPS()`: 每秒 1 次 DOM 写入
- `sceneManager.render()`: 标准 Three.js 渲染

渲染器配置了 `PCFSoftShadowMap` 阴影，地板和 5 面墙启用了阴影投射/接收。4 个 PointLight 创建了但未启用阴影。

`SceneManager.clock` 已创建但从未使用（`SceneManager.js:35`）。

### 8. 未实现的功能

**小地图**：`index.html:67-70` 定义了小地图容器和 canvas，CSS 中有完整样式，但 JS 代码中**没有任何引用** `minimap-canvas` 的代码。这是计划中但未实现的功能。

**图表预览**：`content.json` 定义了 `type: "chart"` 的面板，但 `UIManager.showPreview()` 仅处理 document/image/video 三种类型，chart 类型会进入 default 分支仅输出警告。

**OrbitControls 加载但未使用**：`index.html` 加载了 `lib/OrbitControls.js`，但 PlayerControls 实现了自己的 FPS 控制器，OrbitControls 从未被实例化。

### 9. 资源路径问题

content.json 中的资源路径（如 `content/documents/data-classification.pdf`、`assets/images/finance-case.jpg`）都是相对路径。实际上 `assets/images/` 目录中仅存在 `data-classification.jpg` 一个文件，其他 12+ 个引用的图片缩略图均不存在。

在 GitHub Pages 子目录部署时（`https://user.github.io/repo-name/`），这些相对路径可能解析失败。

### 10. 代码风格与规范

- 使用 `keyCode`（已废弃）而非 `key` 或 `code` 属性
- `PlayerControls.onKeyDown` 使用 switch-case 而非映射表
- 缺少 ESLint/Prettier 配置
- 无 TypeScript 类型定义
- 文档中提到的 `Camera.js`、`Lighting.js`、`Wall.js`、`Panel.js`、`Navigation.js`、`Raycaster.js`、`Modal.js`、`Loader.js`、`Helpers.js` 等文件均不存在

## Code References

- `index.html:87` — 加载不存在的 Panel.js
- `js/main.js:83-183` — 硬编码内容数据，忽略 content.json
- `js/main.js:229-238` — window.App 全局耦合点
- `js/main.js:137-158` — 渲染循环
- `js/scene/SceneManager.js:35` — 未使用的 clock
- `js/scene/SceneManager.js:72` — 渲染器配置
- `js/objects/ExhibitionHall.js:176-210` — createTextSprite 纹理泄漏
- `js/objects/ExhibitionHall.js:230-300` — createPanel 内联逻辑
- `js/objects/ExhibitionHall.js:310-325` — 不完整的 dispose
- `js/controls/PlayerControls.js:53-62` — 事件绑定（内联 bind）
- `js/controls/PlayerControls.js:143` — 硬编码 delta
- `js/controls/PlayerControls.js:175-210` — 碰撞检测
- `js/interaction/InteractionSystem.js:75` — 不检查指针锁定的鼠标处理
- `js/interaction/InteractionSystem.js:117-121` — 指针锁定检查
- `js/interaction/InteractionSystem.js:222` — 空 update 方法
- `js/ui/UIManager.js:41-70` — 匿名函数事件绑定
- `js/ui/UIManager.js:123-135` — 缺少 chart 类型处理
- `content/content.json` — 12 个面板定义（未被使用）
- `css/style.css:142-153` — 小地图样式（无 JS 实现）

## Integration Points

### Inbound References
- `main.js:94` → `ExhibitionHall` 实例化
- `main.js:103` → `PlayerControls` 实例化
- `main.js:113` → `InteractionSystem` 实例化
- `main.js:123` → `UIManager` 实例化

### Outbound Dependencies
- `PlayerControls.js:183` → `window.App.exhibitionHall().walls`（碰撞检测）
- `InteractionSystem.js:217` → `window.App.uiManager().showModal()`（详情显示）
- `UIManager.js:95` → `playerControls.disable()/enable()`（控制状态）
- `UIManager.js:100` → `interactionSystem.deselectObject()`（取消选中）

### Infrastructure Wiring
- `index.html` — 同步脚本加载链（Three.js → OrbitControls → GLTFLoader → DRACOLoader → main.js → 各模块）
- `.github/workflows/deploy.yml` — GitHub Pages 自动部署
- `scripts/serve.sh` — Python 本地服务器

## Architecture Insights

1. **单页应用 + 全局耦合**：所有模块通过 window 全局变量通信，无依赖注入或事件总线
2. **同步脚本加载**：无模块打包器，依赖 `<script>` 标签顺序加载
3. **文档驱动开发**：文档完整（需求、技术要求、开发指南、启动说明），但实现滞后于文档
4. **Three.js r128 时代代码**：使用 `outputEncoding`（已更名为 `outputColorSpace`）、`keyCode`（已废弃）
5. **零外部依赖**：纯静态文件，无 npm/package.json，适合 GitHub Pages 部署

## Precedents & Lessons

仅 1 次提交（`4d109fe` — "初始化数字展厅项目"），无历史变更可参考。

### Composite Lessons
- 项目处于初始提交阶段，所有发现的问题都是初始实现中的遗漏
- 文档先行的开发方式导致了文档与实现的偏差
- 缺少构建工具和代码检查工具，导致代码质量问题难以在早期发现

## Historical Context (from `.rpiv/artifacts/`)
_首次分析，无历史文档。_

## Developer Context

**Q (`index.html:87`): Panel.js 被引用但不存在，如何处理？**
A: 删除 script 标签。面板逻辑已内联在 ExhibitionHall.js 中，无需独立文件。

**Q (`js/main.js:83`): content.json 定义了 12 个面板但 main.js 使用硬编码数据，如何统一？**
A: 修改 main.js 使用 fetch('content/content.json') 动态加载，删除硬编码数据。

**Q (全局): 是否引入构建工具？**
A: 引入 Vite 作为开发服务器和构建工具，支持 ES Modules、热更新、代码检查。

## Related Research
_无。_

## Open Questions

1. 小地图功能是否为优先需求？
2. 图表预览是否需要集成 ECharts？
