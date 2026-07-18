import * as THREE from 'three';

/**
 * 可交互 3D 模型
 * 支持拖拽旋转、滚轮缩放、悬停信息标签
 */
export class InteractiveModel {
  constructor(geometry, material, options = {}) {
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.userData.isInteractiveModel = true;
    this.mesh.userData.isPanel = true; // 集成到现有 isPanel 约定

    this.options = {
      enableDragRotation: true,
      enableScrollZoom: true,
      rotationSensitivity: 0.005,
      zoomSensitivity: 0.001,
      minScale: 0.5,
      maxScale: 2.0,
      ...options
    };

    // 交互状态
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.currentScale = 1;

    // 创建透明 hitbox 用于射线检测
    this.createHitbox();

    // 绑定事件
    this.bindEvents();
  }

  createHitbox() {
    const bbox = new THREE.Box3().setFromObject(this.mesh);
    const size = bbox.getSize(new THREE.Vector3());

    const hitboxGeometry = new THREE.BoxGeometry(size.x * 1.2, size.y * 1.2, size.z * 1.2);
    const hitboxMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });

    this.hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    this.hitbox.userData = this.mesh.userData;
    this.mesh.add(this.hitbox);
  }

  bindEvents() {
    // 事件在 InteractionSystem 中统一处理
  }

  /**
   * 处理拖拽旋转
   */
  handleDrag(event) {
    if (!this.options.enableDragRotation) return;

    const deltaMove = {
      x: event.movementX || 0,
      y: event.movementY || 0
    };

    this.mesh.rotation.y += deltaMove.x * this.options.rotationSensitivity;
    this.mesh.rotation.x += deltaMove.y * this.options.rotationSensitivity;
  }

  /**
   * 处理滚轮缩放
   */
  handleZoom(event) {
    if (!this.options.enableScrollZoom) return;

    const delta = event.deltaY * this.options.zoomSensitivity;
    this.currentScale = Math.max(
      this.options.minScale,
      Math.min(this.options.maxScale, this.currentScale - delta)
    );

    this.mesh.scale.setScalar(this.currentScale);
  }

  /**
   * 获取 Three.js 对象
   */
  getObject() {
    return this.mesh;
  }

  dispose() {
    if (this.hitbox.geometry) this.hitbox.geometry.dispose();
    if (this.hitbox.material) this.hitbox.material.dispose();
  }
}
