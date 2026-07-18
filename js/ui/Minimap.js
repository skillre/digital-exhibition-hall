import * as THREE from 'three';

/**
 * 小地图
 * 使用 2D canvas 绘制展厅俯视图和玩家位置
 * Phase 6: 支持点击传送
 */

export class Minimap {
  /**
   * 构造函数
   * @param {Object} config - 展厅配置
   * @param {PlayerControls} playerControls - 玩家控制器
   */
  constructor(config, playerControls) {
    this.config = config;
    this.playerControls = playerControls;

    this.canvas = document.getElementById('minimap-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    // 缩放比例：展厅尺寸 -> 小地图尺寸
    this.scale = this.canvas ? this.canvas.width / config.width : 5;
    this.offsetX = this.canvas ? this.canvas.width / 2 : 100;
    this.offsetY = this.canvas ? this.canvas.height / 2 : 100;

    // 展区位置
    this.exhibitionZones = [];

    // 传送目标
    this.teleportTarget = null;
  }

  /**
   * 初始化
   */
  init() {
    if (!this.canvas || !this.ctx) {
      console.warn('小地图画布未找到');
      return;
    }

    // 添加点击传送事件
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const minimapX = e.clientX - rect.left;
      const minimapY = e.clientY - rect.top;

      const worldPos = this.minimapToWorld(minimapX, minimapY);

      // 边界检查
      const halfW = this.config.width / 2;
      const halfD = this.config.depth / 2;
      if (Math.abs(worldPos.x) <= halfW && Math.abs(worldPos.z) <= halfD) {
        this.teleportTarget = worldPos;
        if (this.playerControls) {
          this.playerControls.teleportTo({ x: worldPos.x, y: 0, z: worldPos.z });
        }
      }
    });

    console.log('小地图初始化完成');
  }

  /**
   * 小地图坐标 → 世界坐标
   */
  minimapToWorld(minimapX, minimapY) {
    return {
      x: (minimapX - this.offsetX) / this.scale,
      z: (minimapY - this.offsetY) / this.scale
    };
  }

  /**
   * 世界坐标 → 小地图坐标
   */
  worldToMinimap(worldX, worldZ) {
    return {
      x: this.offsetX + worldX * this.scale,
      y: this.offsetY + worldZ * this.scale
    };
  }

  /**
   * 设置展区位置
   * @param {Array} zones - 展区数据数组
   */
  setExhibitionZones(zones) {
    this.exhibitionZones = zones || [];
  }

  /**
   * 更新小地图
   */
  update() {
    if (!this.ctx || !this.playerControls) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, width, height);

    // 绘制展厅边界
    this.drawExhibitionBounds(ctx);

    // 绘制展区
    this.drawExhibitionZones(ctx);

    // 绘制传送目标标记
    this.drawTeleportTarget(ctx);

    // 绘制玩家位置
    this.drawPlayer(ctx);
  }

  /**
   * 绘制展厅边界
   * @param {CanvasRenderingContext2D} ctx
   */
  drawExhibitionBounds(ctx) {
    const { width, depth } = this.config;
    const w = width * this.scale;
    const h = depth * this.scale;
    const x = this.offsetX - w / 2;
    const y = this.offsetY - h / 2;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // 绘制网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;
    const gridSize = 5 * this.scale;
    for (let gx = x; gx <= x + w; gx += gridSize) {
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + h);
      ctx.stroke();
    }
    for (let gy = y; gy <= y + h; gy += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();
    }
  }

  /**
   * 绘制展区
   * @param {CanvasRenderingContext2D} ctx
   */
  drawExhibitionZones(ctx) {
    const colors = {
      plans: '#0a84ff',
      cases: '#ff6b6b',
      training: '#ffd93d',
      docs: '#6bcb77'
    };

    this.exhibitionZones.forEach(zone => {
      const x = this.offsetX + zone.x * this.scale - 8;
      const y = this.offsetY + zone.z * this.scale - 8;

      ctx.fillStyle = colors[zone.id] || '#0a84ff';
      ctx.globalAlpha = 0.6;
      ctx.fillRect(x, y, 16, 16);
      ctx.globalAlpha = 1;

      // 标签
      ctx.fillStyle = '#fff';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(zone.name.replace('区', ''), x + 8, y + 24);
    });
  }

  /**
   * 绘制传送目标标记
   */
  drawTeleportTarget(ctx) {
    if (!this.teleportTarget) return;

    const pos = this.worldToMinimap(this.teleportTarget.x, this.teleportTarget.z);

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * 绘制玩家位置
   * @param {CanvasRenderingContext2D} ctx
   */
  drawPlayer(ctx) {
    const position = this.playerControls.getPosition();
    const x = this.offsetX + position.x * this.scale;
    const y = this.offsetY + position.z * this.scale;

    // 玩家方向
    const camera = this.playerControls.camera;
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);

    // 方向指示线
    const lineLength = 12;
    const endX = x + direction.x * lineLength;
    const endY = y + direction.z * lineLength;

    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // 玩家点
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    // 外圈
    ctx.strokeStyle = 'rgba(255, 68, 68, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * 销毁
   */
  dispose() {
    this.ctx = null;
    this.canvas = null;
    console.log('小地图已销毁');
  }
}
