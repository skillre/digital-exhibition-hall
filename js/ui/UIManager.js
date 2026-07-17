/**
 * UI 管理器
 * 负责管理界面交互和状态
 */

class UIManager {
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
  }
  
  /**
   * 初始化 UI 管理器
   */
  init() {
    // 绑定事件
    this.bindEvents();
    
    // 初始化导航按钮
    this.initNavigation();
    
    console.log('UI 管理器初始化完成');
  }
  
  /**
   * 绑定事件
   */
  bindEvents() {
    // 模态框关闭
    this.elements.modalClose.addEventListener('click', () => this.hideModal());
    this.elements.btnClose.addEventListener('click', () => this.hideModal());
    
    // 模态框背景点击关闭
    this.elements.modal.querySelector('.modal-overlay').addEventListener('click', () => this.hideModal());
    
    // 下载按钮
    this.elements.btnDownload.addEventListener('click', () => this.downloadContent());
    
    // 帮助按钮
    this.elements.btnHelp.addEventListener('click', () => this.showHelpModal());
    this.elements.helpClose.addEventListener('click', () => this.hideHelpModal());
    
    // 帮助模态框背景点击关闭
    this.elements.helpModal.querySelector('.modal-overlay').addEventListener('click', () => this.hideHelpModal());
    
    // 全屏按钮
    this.elements.btnFullscreen.addEventListener('click', () => this.toggleFullscreen());
    
    // 传送按钮
    document.querySelectorAll('.teleport-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const position = e.currentTarget.dataset.position;
        this.teleportTo(position);
      });
    });
    
    // 导航按钮
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget.dataset.target;
        this.navigateTo(target);
      });
    });
    
    // 键盘事件
    document.addEventListener('keydown', (e) => {
      // M 键打开传送菜单
      if (e.keyCode === 77) {
        this.toggleTeleportMenu();
      }
      
      // H 键打开帮助
      if (e.keyCode === 72) {
        this.showHelpModal();
      }
      
      // F 键切换全屏
      if (e.keyCode === 70) {
        this.toggleFullscreen();
      }
    });
  }
  
  /**
   * 初始化导航
   */
  initNavigation() {
    // 高亮当前展区
    this.updateActiveNav('home');
  }
  
  /**
   * 更新内容列表
   * @param {Object} contentData - 内容数据
   */
  updateContentList(contentData) {
    // 可以在这里更新侧边栏或菜单的内容列表
    console.log('内容列表已更新', contentData);
  }
  
  /**
   * 显示模态框
   * @param {Object} data - 内容数据
   */
  showModal(data) {
    if (!data) return;
    
    // 保存当前内容
    this.currentContent = data;
    
    // 更新标题
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
    
    // 更新描述
    this.elements.modalDescription.textContent = data.description || '';
    
    // 隐藏所有预览
    this.hideAllPreviews();
    
    // 根据类型显示预览
    if (data.contentUrl) {
      this.showPreview(data.type, data.contentUrl);
    }
    
    // 显示模态框
    this.elements.modal.classList.remove('hidden');
    
    // 暂停玩家控制
    if (this.playerControls) {
      this.playerControls.disable();
    }
  }
  
  /**
   * 隐藏模态框
   */
  hideModal() {
    // 隐藏模态框
    this.elements.modal.classList.add('hidden');
    
    // 清除当前内容
    this.currentContent = null;
    
    // 停止视频播放
    if (this.elements.videoPlayer) {
      this.elements.videoPlayer.pause();
    }
    
    // 恢复玩家控制
    if (this.playerControls) {
      this.playerControls.enable();
    }
    
    // 取消选中
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
        
      default:
        console.warn('未知的内容类型:', type);
    }
  }
  
  /**
   * 显示 PDF 预览
   * @param {string} url - PDF URL
   */
  showPdfPreview(url) {
    // 使用 PDF.js 或直接嵌入
    this.elements.pdfViewer.src = url;
    this.elements.pdfPreview.classList.remove('hidden');
  }
  
  /**
   * 显示图片预览
   * @param {string} url - 图片 URL
   */
  showImagePreview(url) {
    this.elements.imageViewer.src = url;
    this.elements.imagePreview.classList.remove('hidden');
  }
  
  /**
   * 显示视频预览
   * @param {string} url - 视频 URL
   */
  showVideoPreview(url) {
    const source = this.elements.videoPlayer.querySelector('source');
    source.src = url;
    this.elements.videoPlayer.load();
    this.elements.videoPreview.classList.remove('hidden');
  }
  
  /**
   * 下载内容
   */
  downloadContent() {
    if (!this.currentContent || !this.currentContent.contentUrl) {
      alert('没有可下载的内容');
      return;
    }
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = this.currentContent.contentUrl;
    link.download = this.currentContent.title || 'download';
    link.click();
  }
  
  /**
   * 显示帮助模态框
   */
  showHelpModal() {
    this.elements.helpModal.classList.remove('hidden');
  }
  
  /**
   * 隐藏帮助模态框
   */
  hideHelpModal() {
    this.elements.helpModal.classList.add('hidden');
  }
  
  /**
   * 切换全屏
   */
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }
  
  /**
   * 切换传送菜单
   */
  toggleTeleportMenu() {
    this.elements.teleportMenu.classList.toggle('hidden');
  }
  
  /**
   * 传送到指定位置
   * @param {string} positionStr - 位置字符串 (x,y,z)
   */
  teleportTo(positionStr) {
    const [x, y, z] = positionStr.split(',').map(Number);
    
    // 传送到位置
    if (this.playerControls) {
      this.playerControls.teleportTo(new THREE.Vector3(x, y, z));
    }
    
    // 隐藏传送菜单
    this.elements.teleportMenu.classList.add('hidden');
    
    // 更新导航高亮
    this.updateActiveNavByPosition(x, z);
  }
  
  /**
   * 导航到展区
   * @param {string} target - 目标展区
   */
  navigateTo(target) {
    // 展区位置映射
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
    
    // 更新导航高亮
    this.updateActiveNav(target);
  }
  
  /**
   * 更新激活的导航按钮
   * @param {string} target - 目标展区
   */
  updateActiveNav(target) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.target === target) {
        btn.classList.add('active');
      }
    });
  }
  
  /**
   * 根据位置更新导航高亮
   * @param {number} x - X 坐标
   * @param {number} z - Z 坐标
   */
  updateActiveNavByPosition(x, z) {
    let target = 'home';
    
    // 判断在哪个展区
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
    // 移除事件监听
    // 注意：实际项目中需要保存引用以便移除
    
    console.log('UI 管理器已销毁');
  }
}

// 导出
window.UIManager = UIManager;
