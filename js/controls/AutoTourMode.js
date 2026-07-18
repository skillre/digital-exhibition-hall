import * as THREE from 'three';

/**
 * 自动巡展模式
 * 按预设路径自动移动，定时停留展示
 */
export class AutoTourMode {
  constructor(camera, config) {
    this.camera = camera;
    this.config = config;

    this.active = false;
    this.clock = new THREE.Clock();

    // 路径系统
    this.waypoints = [
      { position: new THREE.Vector3(0, 1.6, 14), lookAt: new THREE.Vector3(0, 1.6, 0), duration: 3000 },
      { position: new THREE.Vector3(-8, 1.6, -3), lookAt: new THREE.Vector3(-11, 2, 0), duration: 5000 },
      { position: new THREE.Vector3(8, 1.6, -3), lookAt: new THREE.Vector3(11, 2, 0), duration: 5000 },
      { position: new THREE.Vector3(0, 1.6, -8), lookAt: new THREE.Vector3(0, 2, -11), duration: 5000 },
      { position: new THREE.Vector3(0, 1.6, 8), lookAt: new THREE.Vector3(0, 2, 11), duration: 5000 }
    ];

    this.currentIndex = 0;
    this.progress = 0;
    this.waiting = false;
    this.waitTime = 0;

    // 样条曲线
    this.curve = null;
    this.buildCurve();
  }

  buildCurve() {
    const points = this.waypoints.map(wp => wp.position);
    this.curve = new THREE.CatmullRomCurve3(points);
  }

  start() {
    this.active = true;
    this.currentIndex = 0;
    this.progress = 0;
    this.waiting = false;
    this.waitTime = 0;
    this.clock.start();
    console.log('自动巡展模式启动');
  }

  stop() {
    this.active = false;
    console.log('自动巡展模式停止');
  }

  update() {
    if (!this.active) return;

    const delta = this.clock.getDelta();

    if (this.waiting) {
      this.waitTime += delta * 1000;
      const waypoint = this.waypoints[this.currentIndex];
      if (this.waitTime >= waypoint.duration) {
        this.waiting = false;
        this.waitTime = 0;
        this.currentIndex = (this.currentIndex + 1) % this.waypoints.length;
        this.progress = this.currentIndex / this.waypoints.length;
      }
      return;
    }

    // 更新进度
    this.progress += delta * 0.1; // 速度控制
    if (this.progress >= 1) {
      this.progress = 1;
    }

    // 获取当前位置
    const position = this.curve.getPoint(this.progress);
    this.camera.position.copy(position);
    this.camera.position.y = 1.6;

    // 计算朝向
    const waypoint = this.waypoints[this.currentIndex];
    const lookAt = waypoint.lookAt;
    this.camera.lookAt(lookAt);

    // 检查是否到达当前航点
    const distance = position.distanceTo(waypoint.position);
    if (distance < 0.1) {
      this.waiting = true;
      this.waitTime = 0;
    }
  }

  isActive() {
    return this.active;
  }
}
