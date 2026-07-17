/**
 * 玩家控制器
 * 负责第一人称视角的移动和视角控制
 */

class PlayerControls {
  /**
   * 构造函数
   * @param {THREE.Camera} camera - 相机对象
   * @param {HTMLElement} domElement - DOM 元素
   * @param {Object} config - 配置
   */
  constructor(camera, domElement, config) {
    this.camera = camera;
    this.domElement = domElement;
    this.config = config;
    
    // 移动状态
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.isRunning = false;
    
    // 视角控制
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.PI_2 = Math.PI / 2;
    
    // 速度
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    
    // 碰撞检测
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = config.collisionDistance;
    
    // 是否启用控制
    this.enabled = false;
    
    // 鼠标灵敏度
    this.mouseSensitivity = 0.002;
    
    // 绑定事件处理函数
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onPointerlockChange = this.onPointerlockChange.bind(this);
    this.onPointerlockError = this.onPointerlockError.bind(this);
  }
  
  /**
   * 初始化控制器
   */
  init() {
    // 设置相机初始位置
    this.camera.position.set(0, this.config.height, 5);
    
    // 初始化欧拉角
    this.euler.setFromQuaternion(this.camera.quaternion);
    
    // 绑定事件
    this.bindEvents();
    
    // 启用控制
    this.enabled = true;
    
    console.log('玩家控制器初始化完成');
  }
  
  /**
   * 绑定事件
   */
  bindEvents() {
    // 键盘事件
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    
    // 鼠标事件
    this.domElement.addEventListener('click', this.requestPointerLock.bind(this));
    document.addEventListener('mousemove', this.onMouseMove);
    
    // 指针锁定事件
    document.addEventListener('pointerlockchange', this.onPointerlockChange);
    document.addEventListener('pointerlockerror', this.onPointerlockError);
  }
  
  /**
   * 请求指针锁定
   */
  requestPointerLock() {
    if (!this.enabled) return;
    this.domElement.requestPointerLock();
  }
  
  /**
   * 指针锁定状态变化
   */
  onPointerlockChange() {
    if (document.pointerLockElement === this.domElement) {
      // 指针已锁定
      this.isLocked = true;
      this.domElement.style.cursor = 'none';
    } else {
      // 指针已解锁
      this.isLocked = false;
      this.domElement.style.cursor = 'pointer';
    }
  }
  
  /**
   * 指针锁定错误
   */
  onPointerlockError() {
    console.error('指针锁定失败');
  }
  
  /**
   * 键盘按下事件
   * @param {KeyboardEvent} event
   */
  onKeyDown(event) {
    if (!this.enabled) return;
    
    switch (event.keyCode) {
      case 38: // 上
      case 87: // W
        this.moveForward = true;
        break;
        
      case 37: // 左
      case 65: // A
        this.moveLeft = true;
        break;
        
      case 40: // 下
      case 83: // S
        this.moveBackward = true;
        break;
        
      case 39: // 右
      case 68: // D
        this.moveRight = true;
        break;
        
      case 16: // Shift
        this.isRunning = true;
        break;
        
      case 27: // ESC
        this.exitPointerLock();
        break;
    }
  }
  
  /**
   * 键盘抬起事件
   * @param {KeyboardEvent} event
   */
  onKeyUp(event) {
    switch (event.keyCode) {
      case 38: // 上
      case 87: // W
        this.moveForward = false;
        break;
        
      case 37: // 左
      case 65: // A
        this.moveLeft = false;
        break;
        
      case 40: // 下
      case 83: // S
        this.moveBackward = false;
        break;
        
      case 39: // 右
      case 68: // D
        this.moveRight = false;
        break;
        
      case 16: // Shift
        this.isRunning = false;
        break;
    }
  }
  
  /**
   * 鼠标移动事件
   * @param {MouseEvent} event
   */
  onMouseMove(event) {
    if (!this.enabled || !this.isLocked) return;
    
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    
    // 更新欧拉角
    this.euler.y -= movementX * this.mouseSensitivity;
    this.euler.x -= movementY * this.mouseSensitivity;
    
    // 限制垂直视角
    this.euler.x = Math.max(-this.PI_2, Math.min(this.PI_2, this.euler.x));
    
    // 更新相机旋转
    this.camera.quaternion.setFromEuler(this.euler);
  }
  
  /**
   * 退出指针锁定
   */
  exitPointerLock() {
    document.exitPointerLock();
  }
  
  /**
   * 更新控制器
   */
  update() {
    if (!this.enabled) return;
    
    // 计算时间差
    const delta = 0.016; // 假设 60fps
    
    // 计算移动方向
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();
    
    // 计算速度
    const speed = this.isRunning ? this.config.moveSpeed * 2 : this.config.moveSpeed;
    
    // 更新速度
    if (this.moveForward || this.moveBackward) {
      this.velocity.z = this.direction.z * speed;
    } else {
      this.velocity.z = 0;
    }
    
    if (this.moveLeft || this.moveRight) {
      this.velocity.x = this.direction.x * speed;
    } else {
      this.velocity.x = 0;
    }
    
    // 检查碰撞
    if (!this.checkCollision()) {
      // 移动相机
      this.camera.translateX(this.velocity.x * delta);
      this.camera.translateZ(this.velocity.z * delta);
    }
    
    // 保持相机高度
    this.camera.position.y = this.config.height;
    
    // 更新位置显示
    this.updatePositionDisplay();
  }
  
  /**
   * 碰撞检测
   * @returns {boolean} 是否发生碰撞
   */
  checkCollision() {
    // 获取相机方向
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    
    // 检测前方碰撞
    this.raycaster.set(this.camera.position, cameraDirection);
    
    // 获取所有可碰撞对象
    const collidables = window.App?.exhibitionHall()?.walls || [];
    
    const intersections = this.raycaster.intersectObjects(collidables);
    
    if (intersections.length > 0 && intersections[0].distance < this.config.collisionDistance) {
      return true;
    }
    
    // 检测左右碰撞
    const leftDirection = new THREE.Vector3(-1, 0, 0).applyQuaternion(this.camera.quaternion);
    const rightDirection = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    
    this.raycaster.set(this.camera.position, leftDirection);
    const leftIntersections = this.raycaster.intersectObjects(collidables);
    
    this.raycaster.set(this.camera.position, rightDirection);
    const rightIntersections = this.raycaster.intersectObjects(collidables);
    
    if (this.moveLeft && leftIntersections.length > 0 && leftIntersections[0].distance < this.config.collisionDistance) {
      return true;
    }
    
    if (this.moveRight && rightIntersections.length > 0 && rightIntersections[0].distance < this.config.collisionDistance) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 传送到指定位置
   * @param {THREE.Vector3} position - 目标位置
   */
  teleportTo(position) {
    // 保存当前位置
    const oldPosition = this.camera.position.clone();
    
    // 设置新位置
    this.camera.position.set(position.x, this.config.height, position.z);
    
    // 重置速度
    this.velocity.set(0, 0, 0);
    
    console.log(`传送到: ${position.x}, ${position.y}, ${position.z}`);
  }
  
  /**
   * 更新位置显示
   */
  updatePositionDisplay() {
    const positionElement = document.getElementById('position');
    if (positionElement) {
      const x = Math.round(this.camera.position.x * 10) / 10;
      const y = Math.round(this.camera.position.y * 10) / 10;
      const z = Math.round(this.camera.position.z * 10) / 10;
      positionElement.textContent = `位置: ${x}, ${y}, ${z}`;
    }
  }
  
  /**
   * 获取相机位置
   * @returns {THREE.Vector3}
   */
  getPosition() {
    return this.camera.position;
  }
  
  /**
   * 启用控制
   */
  enable() {
    this.enabled = true;
  }
  
  /**
   * 禁用控制
   */
  disable() {
    this.enabled = false;
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
  }
  
  /**
   * 销毁控制器
   */
  dispose() {
    // 移除事件监听
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    this.domElement.removeEventListener('click', this.requestPointerLock);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerlockChange);
    document.removeEventListener('pointerlockerror', this.onPointerlockError);
    
    // 禁用控制
    this.disable();
    
    console.log('玩家控制器已销毁');
  }
}

// 导出
window.PlayerControls = PlayerControls;
