/**
 * 交互系统
 * 负责处理用户与展板的交互
 */

export class InteractionSystem {
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

    // 预绑定事件处理函数
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onClick = this.onClick.bind(this);
    this._onKeyDown = this.onKeyDown.bind(this);

    // 缓存 hitbox 数组（L4-03: 性能优化）
    this._hitboxes = [];
  }

  /**
   * 初始化交互系统
   */
  init() {
    this.createTooltip();
    this.bindEvents();
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
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('click', this._onClick);
    document.addEventListener('keydown', this._onKeyDown);
  }

  /**
   * 鼠标移动事件
   * @param {MouseEvent} event
   */
  onMouseMove(event) {
    if (!this.enabled) return;

    // L4-01: 仅在指针锁定且无模态框时处理射线检测
    if (!document.pointerLockElement) {
      // 未锁定时仅更新工具提示位置
      if (this.hoveredObject) {
        this.updateTooltipPosition(event);
      }
      return;
    }

    // 检查是否有模态框打开
    const modal = document.getElementById('modal');
    if (modal && !modal.classList.contains('hidden')) {
      return;
    }

    // 计算鼠标位置（归一化设备坐标）
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // L4-03: 使用缓存的 hitbox 数组进行非递归检测
    const hitboxes = this._getHitboxes();
    const intersections = this.raycaster.intersectObjects(hitboxes, false);

    if (intersections.length > 0) {
      const intersection = intersections[0];
      const object = this.findInteractiveParent(intersection.object);

      if (object && object !== this.hoveredObject) {
        if (this.hoveredObject) {
          this.exhibitionHall.unhighlightPanel(this.hoveredObject);
        }

        this.hoveredObject = object;
        this.exhibitionHall.highlightPanel(object);

        this.showTooltip(event, object.userData.title);
        document.body.style.cursor = 'pointer';
      }

      this.updateTooltipPosition(event);

    } else {
      if (this.hoveredObject) {
        this.exhibitionHall.unhighlightPanel(this.hoveredObject);
        this.hoveredObject = null;
        this.hideTooltip();
        document.body.style.cursor = 'default';
      }
    }
  }

  /**
   * 获取所有 hitbox（缓存机制）
   * @returns {Array} hitbox 数组
   */
  _getHitboxes() {
    // 每次重新获取，因为面板可能动态变化
    const hitboxes = [];
    const panels = this.exhibitionHall.getPanels();
    panels.forEach(panel => {
      panel.children.forEach(child => {
        if (child.isMesh && child.material && child.material.opacity === 0) {
          hitboxes.push(child);
        }
      });
    });
    this._hitboxes = hitboxes;
    return hitboxes;
  }

  /**
   * 鼠标点击事件
   * @param {MouseEvent} event
   */
  onClick(event) {
    if (!this.enabled) return;

    if (!document.pointerLockElement) {
      return;
    }

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

    if (event.code === 'Escape' && this.selectedObject) {
      this.deselectObject();
    }
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
   * 更新工具提示位置（带边界检查）
   * @param {MouseEvent} event - 鼠标事件
   */
  updateTooltipPosition(event) {
    if (!this.tooltip) return;

    const tooltipWidth = this.tooltip.offsetWidth;
    const tooltipHeight = this.tooltip.offsetHeight;
    const padding = 15;

    let x = event.clientX + padding;
    let y = event.clientY + padding;

    // L4-04: 边界检查，确保工具提示不超出视口
    if (x + tooltipWidth > window.innerWidth) {
      x = event.clientX - tooltipWidth - padding;
    }
    if (y + tooltipHeight > window.innerHeight) {
      y = event.clientY - tooltipHeight - padding;
    }

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
    this.selectedObject = object;
    this.showPanelDetail(object.userData);
    console.log('选中展板:', object.userData.title);
  }

  /**
   * 取消选中对象
   */
  deselectObject() {
    if (!this.selectedObject) return;
    this.exhibitionHall.unhighlightPanel(this.selectedObject);
    this.selectedObject = null;
    this.hidePanelDetail();
    console.log('取消选中');
  }

  /**
   * 显示展板详情
   * @param {Object} data - 展板数据
   */
  showPanelDetail(data) {
    if (window.App && window.App.uiManager()) {
      window.App.uiManager().showModal(data);
    }
  }

  /**
   * 隐藏展板详情
   */
  hidePanelDetail() {
    if (window.App && window.App.uiManager()) {
      window.App.uiManager().hideModal();
    }
  }

  enable() { this.enabled = true; }

  disable() {
    this.enabled = false;
    if (this.hoveredObject) {
      this.exhibitionHall.unhighlightPanel(this.hoveredObject);
      this.hoveredObject = null;
    }
    this.hideTooltip();
  }

  /**
   * 销毁交互系统
   */
  dispose() {
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('click', this._onClick);
    document.removeEventListener('keydown', this._onKeyDown);

    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }

    this.disable();
    console.log('交互系统已销毁');
  }
}
