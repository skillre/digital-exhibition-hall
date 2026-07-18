---
date: "2026-07-18T11:40:00+08:00"
author: skillre
commit: d37c3d9
branch: main
repository: 数字展厅
target: /Users/skillre/claude/系统开发/数字展厅/
target_kind: directory
evidence:
  - 实测截图: .rpiv/artifacts/visual-reviews/01-initial-view.png
  - 实测截图: .rpiv/artifacts/visual-reviews/02-after-forward.png
  - 实测截图: .rpiv/artifacts/visual-reviews/03-turned-right.png
  - 实测截图: .rpiv/artifacts/visual-reviews/04-teleport-menu.png
  - 实测截图: .rpiv/artifacts/visual-reviews/05-modal.png
  - 像素采样: 3D 画布主色 (168,170,174) ≈ 背景色 0xd0d4dc
status: ready
tags: [visual-review, threejs, 3d-exhibition, design-direction, tech-aesthetic]
last_updated: "2026-07-18T11:40:00+08:00"
last_updated_by: skillre
---

# Visual Review: 数字展厅视觉诊断

## Methodology

本次审查针对**视觉/美感维度**（区别于已完成的针对代码结构的 architecture-review）。
方法：逐层审查证据 → 实测启动 `vite dev` 并用 Playwright + SwiftShader 软件渲染截取 5 张运行时画面 → 像素采样验证 → 对照需求文档定位差距。
每个发现包含：ID、Evidence（file:line + 截图）、Current state、Desired state、Proposed improvement、Severity、Effort、Blast radius、Class。
Severity 分级：**Blocker**（阻断交付）、High、Med、Low。

## Executive Summary — 一句话结论

> **视觉方向跑偏了。** 项目目标是"科技、专业、数据安全"的数字展厅，但实际 3D 场景被做成了一个"传统现实展厅"——浅灰白墙 + 大理石地板 + 木质前台 + 盆栽 + 长椅 + 壁灯，像售楼处或传统博物馆；而叠加的 UI 又是深蓝赛博霓虹风。两套风格割裂、且都不贴合"数据安全服务"主题，导致整体观感简陋、无科技感、无法交付。
>
> 根因不是"细节不够精致"，而是 **Style Direction 选错了**。需要在视觉层面重新定调，而不是在现有拟物写实方向上继续加细节。

证据快照：
- `01-initial-view.png` / `02-after-forward.png`：3D 画布主色经像素采样为 `(168,170,174)` ≈ `config.js` 背景色 `0xd0d4dc`，整屏一片浅灰，几乎没有可辨识的科技元素。
- `03-turned-right.png`：转向后主色 `(131,130,132)` 偏暗灰，所见为墙壁/展板深灰块面，依然无色彩层次、无科技元素。

---

## Layer V1 — 风格方向定位（Style Direction）

### V1-01: 3D 场景走"传统拟物写实"方向，与"数据安全/科技"主题严重错位
- **Evidence**: `js/objects/ExhibitionHall.js` 全文 — 大理石地板 `drawMarbleTexture`(:126)、白墙纹理 `drawWallTexture`(:144)、方格天花板 `drawCeilingTexture`(:156)、木质前台 `materials.wood`(:191)、盆栽 `createPottedPlants`(:391)、长椅 `createBenches`(:363)、壁灯 `createWallSconces`(:416)；背景 `0xd0d4dc` 浅灰、雾 `0xd0d4dc` 浅灰（`js/config.js:7-12`）。
- **Current state**: 3D 空间是一个明亮、白灰调的传统室内展厅，材质语言是"大理石+木材+白墙+绿植"，是售楼处/企业大堂/传统博物馆的视觉语言。它传达的是"实体物理空间"，不是"数据/网络/安全"。
- **Desired state**: 数据安全服务数字展厅应传达**科技感、数据感、安全感、专业感**——深色基调、数据流网格、全息/线框、发光节点、加密/盾/锁的抽象意象。
- **Proposed improvement**: 重定视觉方向为"科技数据风"（深色基调 + 青/蓝霓虹 + 线框/全息 + 数据流粒子）。这不是加细节，是换语言。
- **Severity**: **Blocker**
- **Effort**: L
- **Blast radius**: cross-module（ExhibitionHall / SceneManager / config / CSS 全部要联动）
- **Class**: redesign

### V1-02: 前序 design 文档定的"科技极简风格"在落地时偏离为"拟物写实"
- **Evidence**: `.rpiv/artifacts/designs/2026-07-18_01-00-00_exhibition-hall-enhancement.md` 标题与 Summary 明确写"科技极简风格升级""浅灰+蓝色点缀"；但 `ExhibitionHall.js` 实际产出大理石+木材+盆栽。
- **Current state**: 设计意图与实现产物背离。文档说"科技极简"，代码做"拟物写实"。后续若继续在拟物方向优化，会越走越远。
- **Desired state**: 实现与既定设计方向一致；若要改方向，应先更新 design artifact 并经确认。
- **Proposed improvement**: 以本次审查结论更新设计方向，重做视觉；或在现有方向上做"科技化改造"（见 V1-01）。
- **Severity**: **Blocker**
- **Effort**: M（对齐 + 决策）
- **Blast radius**: cross-module
- **Class**: redesign

---

## Layer V2 — 3D 空间视觉（色彩/材质/光影）

### V2-01: 整体浅灰单调，无视觉焦点与色彩层次
- **Evidence**: `config.js:8` 背景 `0xd0d4dc`、`:10` 雾 `0xd0d4dc`；`SceneManager.js:88` toneMappingExposure `0.8`；实测 `01-initial-view.png` 主色 `(168,170,174)`，`02-after-forward.png` 主色 `(168,170,174)`。
- **Current state**: 背景色、雾色、地面、墙面都是浅灰系，曝光偏低，整屏低对比、灰蒙蒙，没有视觉焦点，没有品牌主色在 3D 空间里体现。
- **Desired state**: 科技展厅应有深色高对比基调 + 1~2 个高饱和强调色（青/蓝霓虹）作为视觉焦点（数据节点、灯带、地面的发光引导线）。
- **Proposed improvement**: 背景改深色（如 `#0a0e1a` / `#070b14`），雾色同步；曝光适当提高；地板改深色反射面 + 发光网格线；墙面深色 + 科技纹理/全息投影。
- **Severity**: **Blocker**
- **Effort**: M
- **Blast radius**: cross-module
- **Class**: redesign

### V2-02: 材质语言偏"家居/办公"，缺"科技材质"
- **Evidence**: `ExhibitionHall.js:181-191` 大理石 `roughness:0.35`、白墙 `roughness:0.85`、木材 `#8b7355`；展板 `0x2c3e50` 仅一块深色板。
- **Current state**: 地板大理石、前台木纹、墙面乳胶漆——全是实体建材语言，与"数据安全"无联想。
- **Desired state**: 科技材质——发光金属、半透明玻璃/亚克力、全息线框、自发光数据面板、网格地面。
- **Proposed improvement**: 地板→深色镜面反射 + 网格线（emissive）；展板→自发光半透明数据屏（带边框灯条）；前台→金属/玻璃 + LOGO 投影；删除盆栽/长椅/壁灯等生活化物件，换成科技装置（数据柱、全息投影、加密符号装置）。
- **Severity**: High
- **Effort**: L
- **Blast radius**: internal
- **Class**: redesign

### V2-03: 后处理只做了 Bloom，缺深度/科技氛围效果
- **Evidence**: `SceneManager.js:118-130` 仅 `UnrealBloomPass`（strength 0.15，很轻）；design 文档提到 SSAO 但未实现。
- **Current state**: Bloom 强度极低几乎不可见；无 SSAO、无边缘发光、无扫描线/故障感等科技氛围后处理。
- **Desired state**: 科技展厅需要可感知的 Bloom（灯带/数据点发光）、可选 SSAO 增强深度、轻微胶片/扫描感。
- **Proposed improvement**: 提高 Bloom（strength 0.4~0.6，threshold 0.6）；补 SSAO；为发光元素单独设高强度自发光让 Bloom 有内容可抓。
- **Severity**: Med
- **Effort**: M
- **Blast radius**: internal
- **Class**: polish

---

## Layer V3 — 3D 内容与科技元素

### V3-01: 展板内容用 emoji + 白底圆角招牌，极度"简陋感"
- **Evidence**: `ExhibitionHall.js:847` `getTypeIcon` 返回 `📄🖼️🎬📊🧊`；`createTextSprite`(:770) 生成"白底 + `rgba(139,157,195,0.4)` 边框 + 深蓝字"的圆角招牌；展区标牌同款白底蓝字。
- **Current state**: 3D 里的标题/图标是 emoji + Word 文本框既视感的白底招牌，非常初学者/默认感，是最直接的"简陋"来源之一。
- **Desired state**: 科技展厅的标题/图标应是发光 HUD 风格——半透明深色面板 + 青色描边发光 + 矢量线图标，而非 emoji 和白底。
- **Proposed improvement**: 用 Canvas 绘制 HUD 标签（深色半透明 + 青色发光描边 + 无衬线/等宽字体 + 矢量图标），替换所有 emoji 与白底招牌；展板标题贴在展板上方做发光铭牌。
- **Severity**: **Blocker**
- **Effort**: M
- **Blast radius**: internal
- **Class**: redesign

### V3-02: 缺少"数据安全"主题的标志性视觉符号
- **Evidence**: `content.json` 主题是分类分级/合规/架构/案例/培训/白皮书，但 3D 里没有任何安全/加密/数据主题的视觉装置。
- **Current state**: 没有盾牌、锁、密钥、数据流、网络拓扑、加密网格等能让人一眼联想到"数据安全"的标志性元素。
- **Desired state**: 入口/中心应有标志性科技装置（如悬浮的加密球、数据流环、安全拓扑全息投影）作为展厅"视觉锚点"。
- **Proposed improvement**: 增设中央科技装置（数据流粒子环/全息盾/发光拓扑球）作为主视觉锚；各展区入口设主题图标装置。
- **Severity**: High
- **Effort**: L
- **Blast radius**: internal
- **Class**: redesign

---

## Layer V4 — UI 叠加层视觉

### V4-01: UI 本身是深色赛博风，单看尚可，但与 3D 完全割裂
- **Evidence**: `css/style.css:20` body `#1a1a2e`、`:67` header `rgba(0,0,0,0.7)` backdrop-blur、主色 `#00d2ff`；而 3D 是浅灰白展厅（V2）。
- **Current state**: 叠加层深蓝霓虹 + 3D 浅灰白墙，两层明度/色温/风格完全对不上，像两个项目拼在一起。
- **Desired state**: UI 与 3D 应是同一套视觉语言——同色系、同明度基调、同强调色。
- **Proposed improvement**: 以"3D 跟 UI 走深色科技风"统一（推荐），或反之；关键是两端基调一致。
- **Severity**: **Blocker**
- **Effort**: M（若 V2 落地则自然统一）
- **Blast radius**: cross-module
- **Class**: redesign

### V4-02: UI 组件偏"通用模板感"，缺品牌识别度
- **Evidence**: `css/style.css` 大量 `rgba(255,255,255,0.1)` 通用描边、`#00d2ff` 单一强调色、圆角 4~12px；图标用 emoji `❓⛶☰`。
- **Current state**: 导航栏/按钮/弹窗是标准"深色控制台模板"，没有数据安全品牌定制（无 LOGO 图形、无专属字体、无品牌辅助图形）。
- **Desired state**: 交付级 UI 应有品牌系统——LOGO、专属字体配比、品牌辅助图形/分隔线、状态指示器等微设计。
- **Proposed improvement**: 引入品牌字体、LOGO 图形、统一的 HUD 角标/分隔线组件、状态徽标；图标用 SVG 矢量集替代 emoji。
- **Severity**: High
- **Effort**: M
- **Blast radius**: internal
- **Class**: polish

### V4-03: 加载界面、空状态等留有占位感
- **Evidence**: `index.html:9-17` 加载界面仅标题+进度条+`加载中...`；模态框内描述为纯文本块。
- **Current state**: 加载/空态缺少品牌动效与视觉打磨，首屏印象偏弱。
- **Desired improvement**: 加载界面做品牌化（LOGO 动画 + 科技进度环 + 加载阶段文案）。
- **Proposed improvement**: 重做 loading 为品牌动效。
- **Severity**: Med
- **Effort**: S
- **Blast radius**: internal
- **Class**: polish

---

## Layer V5 — 精致度 / 可交付性

### V5-01: 缺乏一致的视觉设计系统（色彩/字体/间距/圆角令牌）
- **Evidence**: 全项目无 design tokens，颜色硬编码散落（`#00d2ff`/`#1a1a2e`/`0x2c3e50`/`0xd0d4dc` …）；字体仅 `'Segoe UI','Microsoft YaHei'`。
- **Current state**: 无设计令牌，视觉靠各处零散硬编码，难保持一致、难交付、难维护。
- **Desired state**: 交付级前端应有统一 design tokens（色板、字体阶梯、间距/圆角/阴影）。
- **Proposed improvement**: 建立 CSS 变量 + JS 配色的单一来源；定义字体阶梯与间距令牌。
- **Severity**: High
- **Effort**: M
- **Blast radius**: cross-module
- **Class**: polish

### V5-02: 交付障碍 — node_modules 原生模块损坏（已临时修复）
- **Evidence**: 实测 `npx vite build` 报 `rollup-darwin-arm64 ... segment '__TEXT' load command content extends beyond end of file`（`ERR_DLOPEN_FAILED`）；经 `rm -rf node_modules && npm install` 修复后 dev 可跑。
- **Current state**: 仓库 clone 后首次安装可能命中损坏的 rollup 原生包，构建直接失败，影响交付/CI。
- **Desired improvement**: 交付前应保证干净环境下 `npm install && npm run build` 一次通过。
- **Proposed improvement**: 复核 `package-lock.json`；锁定/升级 rollup/vite 版本；CI 加构建校验。
- **Severity**: Med
- **Effort**: S
- **Blast radius**: on-disk
- **Class**: polish

---

## Layer V6 — 动态 / 动效 / 数据可视化

### V6-01: 动态效果单薄，仅入口粒子
- **Evidence**: `ExhibitionHall.js:693` `createEntranceParticles` 仅 200 粒子在入口上升；无其他持续动效。
- **Current state**: 场景静态感强，除入口粒子外几乎无动态，缺乏科技展厅该有的"活着"的感觉。
- **Desired improvement**: 全局数据流粒子、地面/墙面呼吸灯、展板悬浮微动、巡视扫描线等持续动效。
- **Proposed improvement**: 增加环境级动效（地面网格流光、悬浮数据点、扫描线），让场景"活"起来。
- **Severity**: Med
- **Effort**: M
- **Blast radius**: internal
- **Class**: polish

### V6-02: 数据可视化过于基础
- **Evidence**: `DataDashboard.js:50` `drawChart` 仅画一个柱状图（`#00d2ff→#0066aa` 渐变、`#444` 坐标轴），无标题/图例/动效；`content.json` 仅有 1 个 chart 面板。
- **Current state**: "数据安全服务"展厅却几乎没有像样的数据可视化，本该是亮点的能力被弱化。
- **Desired improvement**: 多类型图表（环形/雷达/拓扑）、动效进场、统一科技图表样式；作为案例成果区核心。
- **Proposed improvement**: 升级 DataDashboard 支持多图表类型 + 科技样式 + 进场动效。
- **Severity**: Med
- **Effort**: M
- **Blast radius**: internal
- **Class**: polish

---

## 改进路线（按优先级）

### P0 — 定调（阻断交付，必须先决策）
1. **V1-01 / V1-02**：确认视觉方向从"拟物写实"转为"科技数据风"。这是所有后续工作的前提。
2. **V2-01 / V4-01**：3D 与 UI 统一到深色科技基调 + 青蓝强调色。

### P1 — 视觉重做（高价值）
3. **V3-01**：替换 emoji + 白底招牌为 HUD 发光标签（最直接消除"简陋感"）。
4. **V2-02 / V3-02**：科技材质 + 标志性安全主题装置（中央视觉锚）。
5. **V4-02**：UI 品牌系统（LOGO/字体/矢量图标/微组件）。

### P2 — 打磨（提升交付感）
6. **V5-01**：建立 design tokens。
7. **V2-03 / V6-01**：后处理 + 环境动效。
8. **V6-02**：数据可视化升级。
9. **V4-03**：加载界面品牌化。
10. **V5-02**：构建链路修复与 CI 校验。

---

## 结论

当前视觉问题**不是"加几个细节"能解决的**，而是**整体视觉方向选错**：做了一个"传统现实展厅"去承载"数据安全科技"主题，方向性跑偏导致即便细节做得再多，也只会是"精致的售楼处"，而非"可交付的科技数字展厅"。

建议：**先就"科技数据风"方向做一次视觉设计定调**（可走 rpiv 的 design/explore 流程产出方案），再分阶段重做 3D 场景与 UI，最后打磨动效与数据可视化。

## 证据附录

实测运行环境：`vite dev` @ 127.0.0.1:3019 + Playwright Chromium (SwiftShader 软件渲染)。
- `01-initial-view.png`：初始视角，主色 (168,170,174) ≈ 背景浅灰
- `02-after-forward.png`：前进后，主色 (168,170,174)
- `03-turned-right.png`：右转后，主色 (131,130,132) 偏暗灰
- `04-teleport-menu.png`：传送菜单（深色 UI 叠浅灰 3D，可见割裂）
- `05-modal.png`：内容弹窗
