/**
 * 玩家控制器
 * 负责第一人称视角的移动和视角控制
 */

export class PlayerControls {
  /**
   * 构造函数
   * @param {THREE.Camera} camera - 相机对象
   * @param {HTMLElement} domElement - DOM 元素
   * @param {Object} config - 配置
   * @param {THREE.Clock} clock - 时钟对象
   */
  constructor(camera, domElement, config, clock) {
    this.camera = camera;
    this.domElement = domElement;
    this.config = config;
    this.clock = clock;

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
    this._walls = [];

    // 是否启用控制
    this.enabled = false;
    this.isLocked = false;

    // 鼠标灵敏度
    this.mouseSensitivity = 0.002;

    // Phase 3: 预绑定事件处理函数（修复事件监听器泄漏）
    this._onKeyDown = this.onKeyDown.bind(this);
    this._onKeyUp = this.onKeyUp.bind(this);
    this._onMouseMove = this.onMouseMove.bind(this);
    this._onPointerlockChange = this.onPointerlockChange.bind(this);
    this._onPointerlockError = this.onPointerlockError.bind(this);
    this._requestPointerLock = this.requestPointerLock.bind(this);
  }

  /**
   * 初始化控制器
   */
  init() {
    this.camera.position.set(0, this.config.height, 5);
    this.euler.setFromQuaternion(this.camera.quaternion);
    this.bindEvents();
    this.enabled = true;
    console.log('玩家控制器初始化完成');
  }

  /**
   * 设置碰撞对象
   * @param {Array} walls - 墙壁数组
   */
  setWalls(walls) {
    this._walls = walls || [];
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    this.domElement.addEventListener('click', this._requestPointerLock);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('pointerlockchange', this._onPointerlockChange);
    document.addEventListener('pointerlockerror', this._onPointerlockError);
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
      this.isLocked = true;
      this.domElement.style.cursor = 'none';
    } else {
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

    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.isRunning = true;
        break;
      case 'Escape':
        this.exitPointerLock();
        break;
    }
  }

  /**
   * 键盘抬起事件
   * @param {KeyboardEvent} event
   */
  onKeyUp(event) {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = false;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
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

    this.euler.y -= movementX * this.mouseSensitivity;
    this.euler.x -= movementY * this.mouseSensitivity;
    this.euler.x = Math.max(-this.PI_2, Math.min(this.PI_2, this.euler.x));

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

    // Phase 3: 使用实际帧时间差
    const delta = this.clock ? this.clock.getDelta() : 0.016;

    // 计算移动方向
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();

    const speed = this.isRunning ? this.config.moveSpeed * 2 : this.config.moveSpeed;

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
      this.camera.translateX(this.velocity.x * delta);
      this.camera.translateZ(this.velocity.z * delta);
    }

    // 保持相机高度
    this.camera.position.y = this.config.height;

    this.updatePositionDisplay();
  }

  /**
   * 碰撞检测
   * @returns {boolean} 是否发生碰撞
   */
  checkCollision() {
    const collidables = this._walls;
    if (collidables.length === 0) return false;

    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);

    // 前方碰撞
    this.raycaster.set(this.camera.position, cameraDirection);
    const intersections = this.raycaster.intersectObjects(collidables);
    if (intersections.length > 0 && intersections[0].distance < this.config.collisionDistance) {
      return true;
    }

    // 左方碰撞
    if (this.moveLeft) {
      const leftDirection = new THREE.Vector3(-1, 0, 0).applyQuaternion(this.camera.quaternion);
      this.raycaster.set(this.camera.position, leftDirection);
      const leftIntersections = this.raycaster.intersectObjects(collidables);
      if (leftIntersections.length > 0 && leftIntersections[0].distance < this.config.collisionDistance) {
        return true;
      }
    }

    // 右方碰撞
    if (this.moveRight) {
      const rightDirection = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
      this.raycaster.set(this.camera.position, rightDirection);
      const rightIntersections = this.raycaster.intersectObjects(collidables);
      if (rightIntersections.length > 0 && rightIntersections[0].distance < this.config.collisionDistance) {
        return true;
      }
    }

    // 后方碰撞
    if (this.moveForward === false && this.moveBackward) {
      const backDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(this.camera.quaternion);
      this.raycaster.set(this.camera.position, backDirection);
      const backIntersections = this.raycaster.intersectObjects(collidables);
      if (backIntersections.length > 0 && backIntersections[0].distance < this.config.collisionDistance) {
        return true;
      }
    }

    return false;
  }

  /**
   * 传送到指定位置
   * @param {THREE.Vector3} position - 目标位置
   */
  teleportTo(position) {
    this.camera.position.set(position.x, this.config.height, position.z);
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

  getPosition() { return this.camera.position; }

  enable() { this.enabled = true; }

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
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    this.domElement.removeEventListener('click', this._requestPointerLock);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('pointerlockchange', this._onPointerlockChange);
    document.removeEventListener('pointerlockerror', this._onPointerlockError);

    this.disable();
    console.log('玩家控制器已销毁');
  }
}
