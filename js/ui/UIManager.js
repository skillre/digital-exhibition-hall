import * as THREE from 'three';

/**
 * UI 管理器
 * 负责管理界面交互和状态
 */

export class UIManager {
  /**
   * 构造函数
   * @param {ExhibitionHall} exhibitionHall - 展厅对象
   * @param {PlayerControls} playerControls - 玩家控制对象
   * @param {InteractionSystem} interactionSystem - 交互系统对象
   */
  constructor(exhibitionHall, playerControls, interactionSystem) {
    this.exhibitionHall = exhibitionHall;
    this.playerControls = playerControls;
    this.interactionSystem = interactionSystem;

    // DOM 元素
    this.elements = {
      modal: document.getElementById('modal'),
      modalTitle: document.getElementById('modal-title'),
      modalTags: document.getElementById('modal-tags'),
      modalDescription: document.getElementById('modal-description'),
      modalClose: document.getElementById('modal-close'),
      btnClose: document.getElementById('btn-close'),
      btnDownload: document.getElementById('btn-download'),
      helpModal: document.getElementById('help-modal'),
      helpClose: document.getElementById('help-close'),
      btnHelp: document.getElementById('btn-help'),
      btnFullscreen: document.getElementById('btn-fullscreen'),
      teleportMenu: document.getElementById('teleport-menu'),
      previewArea: document.getElementById('preview-area'),
      pdfPreview: document.getElementById('pdf-preview'),
      imagePreview: document.getElementById('image-preview'),
      videoPreview: document.getElementById('video-preview'),
      pdfViewer: document.getElementById('pdf-viewer'),
      imageViewer: document.getElementById('image-viewer'),
      videoPlayer: document.getElementById('video-player')
    };

    // 当前内容数据
    this.currentContent = null;

    // L5-01: 预绑定事件处理函数（修复匿名函数泄漏）
    this._hideModal = this.hideModal.bind(this);
    this._hideHelpModal = this.hideHelpModal.bind(this);
    this._downloadContent = this.downloadContent.bind(this);
    this._showHelpModal = this.showHelpModal.bind(this);
    this._toggleFullscreen = this.toggleFullscreen.bind(this);
    this._onKeyDown = this._handleKeyDown.bind(this);
  }

  /**
   * 初始化 UI 管理器
   */
  init() {
    this.bindEvents();
    this.initNavigation();
    console.log('UI 管理器初始化完成');
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 模态框关闭
    this.elements.modalClose.addEventListener('click', this._hideModal);
    this.elements.btnClose.addEventListener('click', this._hideModal);
    this.elements.modal.querySelector('.modal-overlay').addEventListener('click', this._hideModal);

    // 下载按钮
    this.elements.btnDownload.addEventListener('click', this._downloadContent);

    // 帮助按钮
    this.elements.btnHelp.addEventListener('click', this._showHelpModal);
    this.elements.helpClose.addEventListener('click', this._hideHelpModal);
    this.elements.helpModal.querySelector('.modal-overlay').addEventListener('click', this._hideHelpModal);

    // 全屏按钮
    this.elements.btnFullscreen.addEventListener('click', this._toggleFullscreen);

    // 传送按钮
    this._teleportHandlers = [];
    document.querySelectorAll('.teleport-btn').forEach(btn => {
      const handler = (e) => {
        const position = e.currentTarget.dataset.position;
        this.teleportTo(position);
      };
      btn.addEventListener('click', handler);
      this._teleportHandlers.push({ btn, handler });
    });

    // 导航按钮
    this._navHandlers = [];
    document.querySelectorAll('.nav-btn').forEach(btn => {
      const handler = (e) => {
        const target = e.currentTarget.dataset.target;
        this.navigateTo(target);
      };
      btn.addEventListener('click', handler);
      this._navHandlers.push({ btn, handler });
    });

    // 键盘事件
    document.addEventListener('keydown', this._onKeyDown);
  }

  /**
   * 键盘事件处理
   * @param {KeyboardEvent} e
   */
  _handleKeyDown(e) {
    if (e.code === 'KeyM') {
      this.toggleTeleportMenu();
    }
    if (e.code === 'KeyH') {
      this.showHelpModal();
    }
    if (e.code === 'KeyF') {
      this.toggleFullscreen();
    }
  }

  /**
   * 初始化导航
   */
  initNavigation() {
    this.updateActiveNav('home');
  }

  /**
   * 更新内容列表
   * @param {Object} contentData - 内容数据
   */
  updateContentList(contentData) {
    console.log('内容列表已更新', contentData);
  }

  /**
   * 显示模态框
   * @param {Object} data - 内容数据
   */
  showModal(data) {
    if (!data) return;

    this.currentContent = data;

    this.elements.modalTitle.textContent = data.title || '详情';

    // 更新标签
    this.elements.modalTags.innerHTML = '';
    if (data.tags && data.tags.length > 0) {
      data.tags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.textContent = tag;
        this.elements.modalTags.appendChild(tagElement);
      });
    }

    this.elements.modalDescription.textContent = data.description || '';

    this.hideAllPreviews();

    if (data.contentUrl) {
      this.showPreview(data.type, data.contentUrl);
    }

    this.elements.modal.classList.remove('hidden');

    // L5-03: 退出指针锁定，让用户能看到鼠标
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }

    // 暂停玩家控制
    if (this.playerControls) {
      this.playerControls.disable();
    }
  }

  /**
   * 隐藏模态框
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

    // 恢复玩家控制
    if (this.playerControls) {
      this.playerControls.enable();
    }

    if (this.interactionSystem) {
      this.interactionSystem.deselectObject();
    }
  }

  /**
   * 隐藏所有预览
   */
  hideAllPreviews() {
    this.elements.pdfPreview.classList.add('hidden');
    this.elements.imagePreview.classList.add('hidden');
    this.elements.videoPreview.classList.add('hidden');
  }

  /**
   * 显示预览
   * @param {string} type - 内容类型
   * @param {string} url - 内容 URL
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

  showPdfPreview(url) {
    this.elements.pdfViewer.src = url;
    this.elements.pdfPreview.classList.remove('hidden');
  }

  showImagePreview(url) {
    this.elements.imageViewer.src = url;
    this.elements.imagePreview.classList.remove('hidden');
  }

  showVideoPreview(url) {
    const source = this.elements.videoPlayer.querySelector('source');
    source.src = url;
    this.elements.videoPlayer.load();
    this.elements.videoPreview.classList.remove('hidden');
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

    // 降低 3D 场景渲染质量以节省性能
    if (window.App && window.App.sceneManager()) {
      this._originalPixelRatio = window.App.sceneManager().renderer.getPixelRatio();
      window.App.sceneManager().renderer.setPixelRatio(0.5);
    }
  }

  /**
   * L5-02: 显示图表预览
   * @param {string} url - 图表数据 URL
   */
  showChartPreview(url) {
    // 创建一个 canvas 元素用于图表渲染
    let chartPreview = document.getElementById('chart-preview');
    if (!chartPreview) {
      chartPreview = document.createElement('div');
      chartPreview.id = 'chart-preview';
      chartPreview.className = 'preview';
      chartPreview.innerHTML = '<canvas id="chart-canvas" style="width:100%;max-height:400px;background:#111;border-radius:8px;"></canvas>';
      this.elements.previewArea.appendChild(chartPreview);
    }
    chartPreview.classList.remove('hidden');

    // 加载图表数据并渲染
    this._renderChart(url);
  }

  /**
   * 渲染图表
   * @param {string} url - 图表数据 URL
   */
  async _renderChart(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      const canvas = document.getElementById('chart-canvas');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = 400 * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const width = canvas.offsetWidth;
      const height = 400;

      // 清空画布
      ctx.clearRect(0, 0, width, height);

      // 简单的柱状图渲染
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

          // 柱状图
          const gradient = ctx.createLinearGradient(x, y, x, chartHeight + 20);
          gradient.addColorStop(0, '#0a84ff');
          gradient.addColorStop(1, '#4aa3ff');
          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth, barHeight);

          // 数值
          ctx.fillStyle = '#1c2530';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${value}%`, x + barWidth / 2, y - 5);

          // 标签
          ctx.fillStyle = '#888';
          ctx.font = '11px sans-serif';
          ctx.fillText(data.labels[i], x + barWidth / 2, chartHeight + 38);
        });
      }
    } catch (error) {
      console.error('图表渲染失败:', error);
    }
  }

  downloadContent() {
    if (!this.currentContent || !this.currentContent.contentUrl) {
      alert('没有可下载的内容');
      return;
    }

    const link = document.createElement('a');
    link.href = this.currentContent.contentUrl;
    link.download = this.currentContent.title || 'download';
    link.click();
  }

  showHelpModal() {
    this.elements.helpModal.classList.remove('hidden');
  }

  hideHelpModal() {
    this.elements.helpModal.classList.add('hidden');
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  toggleTeleportMenu() {
    this.elements.teleportMenu.classList.toggle('hidden');
  }

  teleportTo(positionStr) {
    const [x, y, z] = positionStr.split(',').map(Number);

    if (this.playerControls) {
      this.playerControls.teleportTo(new THREE.Vector3(x, y, z));
    }

    this.elements.teleportMenu.classList.add('hidden');
    this.updateActiveNavByPosition(x, z);
  }

  navigateTo(target) {
    const positions = {
      home: { x: 0, y: 0, z: 5 },
      plans: { x: -10, y: 0, z: 0 },
      cases: { x: 10, y: 0, z: 0 },
      training: { x: 0, y: 0, z: -10 },
      docs: { x: 0, y: 0, z: 10 }
    };

    const position = positions[target];
    if (position) {
      this.teleportTo(`${position.x},${position.y},${position.z}`);
    }

    this.updateActiveNav(target);
  }

  updateActiveNav(target) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.target === target) {
        btn.classList.add('active');
      }
    });
  }

  updateActiveNavByPosition(x, z) {
    let target = 'home';
    if (Math.abs(x) > Math.abs(z)) {
      if (x < -5) target = 'plans';
      else if (x > 5) target = 'cases';
    } else {
      if (z < -5) target = 'training';
      else if (z > 5) target = 'docs';
    }
    this.updateActiveNav(target);
  }

  /**
   * 销毁 UI 管理器
   */
  dispose() {
    // 移除预绑定的事件监听器
    this.elements.modalClose.removeEventListener('click', this._hideModal);
    this.elements.btnClose.removeEventListener('click', this._hideModal);
    this.elements.modal.querySelector('.modal-overlay').removeEventListener('click', this._hideModal);
    this.elements.btnDownload.removeEventListener('click', this._downloadContent);
    this.elements.btnHelp.removeEventListener('click', this._showHelpModal);
    this.elements.helpClose.removeEventListener('click', this._hideHelpModal);
    this.elements.helpModal.querySelector('.modal-overlay').removeEventListener('click', this._hideHelpModal);
    this.elements.btnFullscreen.removeEventListener('click', this._toggleFullscreen);

    this._teleportHandlers.forEach(({ btn, handler }) => {
      btn.removeEventListener('click', handler);
    });

    this._navHandlers.forEach(({ btn, handler }) => {
      btn.removeEventListener('click', handler);
    });

    document.removeEventListener('keydown', this._onKeyDown);

    console.log('UI 管理器已销毁');
  }
}
