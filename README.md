# 数据安全服务数字展厅

基于 Three.js 的 3D 虚拟展厅，用于展示数据安全服务过程中产出的各类内容。

## 功能特性

- 🏛️ **3D 展厅场景**：沉浸式的虚拟展厅空间
- 🖼️ **展示墙系统**：多种内容格式展示（PDF、图片、视频）
- 🚶 **自由漫游**：第一人称视角漫游控制
- 🖱️ **交互体验**：点击展板查看详细信息
- 📱 **响应式设计**：支持 PC 和移动端访问

## 快速开始

### 本地开发
```bash
# 克隆仓库
git clone https://github.com/your-username/digital-exhibition-hall.git
cd digital-exhibition-hall

# 使用本地服务器运行（推荐 VS Code Live Server）
# 或者使用 Python
python -m http.server 8000

# 访问 http://localhost:8000
```

### 部署到 GitHub Pages
1. 创建 GitHub 仓库
2. 推送代码到仓库
3. 在仓库设置中启用 GitHub Pages
4. 访问 `https://your-username.github.io/repository-name/`

## 项目结构

```
digital-exhibition-hall/
├── index.html              # 主入口
├── css/                    # 样式文件
├── js/                     # JavaScript 源码
├── assets/                 # 静态资源
├── content/                # 展示内容
├── lib/                    # 第三方库
└── docs/                   # 文档
```

## 技术栈

- Three.js - 3D 渲染引擎
- JavaScript ES6+ - 主要编程语言
- HTML5/CSS3 - 页面结构和样式
- PDF.js - PDF 文档预览

## 操作指南

| 操作 | 按键 | 说明 |
|------|------|------|
| 移动 | W/A/S/D 或方向键 | 控制角色移动 |
| 视角 | 鼠标移动 | 旋转视角 |
| 交互 | 鼠标左键 | 点击展板查看详情 |
| 退出 | ESC | 关闭弹窗 |

## 内容管理

### 添加新展区
1. 编辑 `content.json` 文件
2. 添加展区配置
3. 添加展板内容

### 支持的内容类型
- **文档**：PDF、Word、PPT（在线预览或下载）
- **图片**：JPG、PNG、SVG（放大查看）
- **视频**：MP4、WebM（在线播放）

## 开发计划

- [x] 项目初始化
- [ ] 基础 3D 场景搭建
- [ ] 展厅模型创建
- [ ] 展板交互系统
- [ ] 漫游控制系统
- [ ] 内容预览功能
- [ ] 性能优化
- [ ] 部署上线

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

---

📧 联系方式：your-email@example.com
🌐 项目地址：https://github.com/your-username/digital-exhibition-hall
