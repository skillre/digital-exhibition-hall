/**
 * 交互系统
 * 负责处理用户与展板的交互
 */

class InteractionSystem {
  /**
   * 构造函数
   * @param {THREE.Scene} scene - 场景对象
   * @param {THREE.Camera} camera - 相机对象
   * @param {ExhibitionHall} exhibitionHall - 展厅对象
   */
  constructor(scene, camera, exhibitionHall) {
    this.scene = scene;
    this.camera = camera;
    this.exhibitionHall = exhibitionHall;
    
    // 射线检测
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // 交互状态
    this.enabled = false;
    this.hoveredObject = null;
    this.selectedObject = null;
    
    // 工具提示
    this.tooltip = null;
    
    // 绑定事件处理函数
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
  }
  
  /**
   * 初始化交互系统
   */
  init() {
    // 创建工具提示
    this.createTooltip();
    
    // 绑定事件
    this.bindEvents();
    
    // 启用交互
    this.enabled = true;
    
    console.log('交互系统初始化完成');
  }
  
  /**
   * 创建工具提示
   */
  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tooltip';
    this.tooltip.style.display = 'none';
    document.body.appendChild(this.tooltip);
  }
  
  /**
   * 绑定事件
   */
  bindEvents() {
    // 鼠标移动
    document.addEventListener('mousemove', this.onMouseMove);
    
    // 鼠标点击
    document.addEventListener('click', this.onClick);
    
    // 键盘事件
    document.addEventListener('keydown', this.onKeyDown);
  }
  
  /**
   * 鼠标移动事件
   * @param {MouseEvent} event
   */
  onMouseMove(event) {
    if (!this.enabled) return;
    
    // 计算鼠标位置（归一化设备坐标）
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // 更新射线
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    // 获取所有可交互对象
    const interactables = this.getInteractableObjects();
    
    // 检测交叉
    const intersections = this.raycaster.intersectObjects(interactables, true);
    
    if (intersections.length > 0) {
      // 找到最近的交互对象
      const intersection = intersections[0];
      const object = this.findInteractiveParent(intersection.object);
      
      if (object && object !== this.hoveredObject) {
        // 取消之前的高亮
        if (this.hoveredObject) {
          this.exhibitionHall.unhighlightPanel(this.hoveredObject);
        }
        
        // 高亮新对象
        this.hoveredObject = object;
        this.exhibitionHall.highlightPanel(object);
        
        // 显示工具提示
        this.showTooltip(event, object.userData.title);
        
        // 更新鼠标样式
        document.body.style.cursor = 'pointer';
      }
      
      // 更新工具提示位置
      this.updateTooltipPosition(event);
      
    } else {
      // 没有交互对象
      if (this.hoveredObject) {
        // 取消高亮
        this.exhibitionHall.unhighlightPanel(this.hoveredObject);
        this.hoveredObject = null;
        
        // 隐藏工具提示
        this.hideTooltip();
        
        // 恢复鼠标样式
        document.body.style.cursor = 'default';
      }
    }
  }
  
  /**
   * 鼠标点击事件
   * @param {MouseEvent} event
   */
  onClick(event) {
    if (!this.enabled) return;
    
    // 如果指针未锁定，先锁定指针
    if (!document.pointerLockElement) {
      return;
    }
    
    // 如果有悬停对象，选中它
    if (this.hoveredObject) {
      this.selectObject(this.hoveredObject);
    }
  }
  
  /**
   * 键盘事件
   * @param {KeyboardEvent} event
   */
  onKeyDown(event) {
    if (!this.enabled) return;
    
    // ESC 键取消选中
    if (event.keyCode === 27 && this.selectedObject) {
      this.deselectObject();
    }
  }
  
  /**
   * 获取可交互对象
   * @returns {Array} 可交互对象数组
   */
  getInteractableObjects() {
    const objects = [];
    
    // 获取所有展板
    const panels = this.exhibitionHall.getPanels();
    panels.forEach(panel => {
      // 添加展板及其子对象
      objects.push(panel);
      panel.children.forEach(child => {
        if (child.userData && child.userData.isPanel) {
          objects.push(child);
        }
      });
    });
    
    return objects;
  }
  
  /**
   * 查找交互父对象
   * @param {THREE.Object3D} object - 子对象
   * @returns {THREE.Object3D} 交互父对象
   */
  findInteractiveParent(object) {
    let current = object;
    
    while (current) {
      if (current.userData && current.userData.isPanel) {
        return current;
      }
      current = current.parent;
    }
    
    return null;
  }
  
  /**
   * 显示工具提示
   * @param {MouseEvent} event - 鼠标事件
   * @param {string} text - 提示文字
   */
  showTooltip(event, text) {
    if (!this.tooltip) return;
    
    this.tooltip.textContent = text;
    this.tooltip.style.display = 'block';
    this.updateTooltipPosition(event);
  }
  
  /**
   * 更新工具提示位置
   * @param {MouseEvent} event - 鼠标事件
   */
  updateTooltipPosition(event) {
    if (!this.tooltip) return;
    
    const x = event.clientX + 15;
    const y = event.clientY + 15;
    
    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }
  
  /**
   * 隐藏工具提示
   */
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }
  
  /**
   * 选中对象
   * @param {THREE.Object3D} object - 选中的对象
   */
  selectObject(object) {
    if (!object || !object.userData) return;
    
    // 保存选中对象
    this.selectedObject = object;
    
    // 触发展板详情显示
    this.showPanelDetail(object.userData);
    
    console.log('选中展板:', object.userData.title);
  }
  
  /**
   * 取消选中对象
   */
  deselectObject() {
    if (!this.selectedObject) return;
    
    // 取消高亮
    this.exhibitionHall.unhighlightPanel(this.selectedObject);
    
    // 清除选中对象
    this.selectedObject = null;
    
    // 隐藏详情
    this.hidePanelDetail();
    
    console.log('取消选中');
  }
  
  /**
   * 显示展板详情
   * @param {Object} data - 展板数据
   */
  showPanelDetail(data) {
    // 更新 UI 管理器
    if (window.App && window.App.uiManager()) {
      window.App.uiManager().showModal(data);
    }
  }
  
  /**
   * 隐藏展板详情
   */
  hidePanelDetail() {
    // 更新 UI 管理器
    if (window.App && window.App.uiManager()) {
      window.App.uiManager().hideModal();
    }
  }
  
  /**
   * 更新交互系统
   */
  update() {
    // 可以在这里添加持续的交互逻辑
  }
  
  /**
   * 启用交互
   */
  enable() {
    this.enabled = true;
  }
  
  /**
   * 禁用交互
   */
  disable() {
    this.enabled = false;
    
    // 取消所有高亮
    if (this.hoveredObject) {
      this.exhibitionHall.unhighlightPanel(this.hoveredObject);
      this.hoveredObject = null;
    }
    
    // 隐藏工具提示
    this.hideTooltip();
  }
  
  /**
   * 销毁交互系统
   */
  dispose() {
    // 移除事件监听
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('click', this.onClick);
    document.removeEventListener('keydown', this.onKeyDown);
    
    // 移除工具提示
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }
    
    // 禁用交互
    this.disable();
    
    console.log('交互系统已销毁');
  }
}

// 导出
window.InteractionSystem = InteractionSystem;
