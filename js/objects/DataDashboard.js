import * as THREE from 'three';

/**
 * 数据可视化大屏
 * 使用 CanvasTexture 在 3D 场景中渲染图表
 */
export class DataDashboard {
  constructor(options = {}) {
    this.options = {
      width: 512,
      height: 256,
      planeWidth: 2.5,
      planeHeight: 1.5,
      ...options
    };

    this.chartMeshes = [];
  }

  /**
   * 创建图表平面
   */
  createChartPlane(data, position = { x: 0, y: 2.5, z: 0 }) {
    const canvas = document.createElement('canvas');
    canvas.width = this.options.width;
    canvas.height = this.options.height;

    this.drawChart(canvas, data);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const geometry = new THREE.PlaneGeometry(this.options.planeWidth, this.options.planeHeight);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);

    this.chartMeshes.push({ mesh, canvas, texture, data });
    return mesh;
  }

  /**
   * 绘制图表 — 深色科技样式
   */
  drawChart(canvas, data) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    // 白底
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    // 细蓝边框
    ctx.strokeStyle = 'rgba(10,132,255,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, width - 8, height - 8);
    // 标题
    ctx.fillStyle = '#0a84ff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText((data.title || 'DATA METRICS').toUpperCase(), 20, 30);
    if (data.labels && data.values) {
      const barCount = data.labels.length;
      const barWidth = Math.min(60, (width - 80) / barCount - 10);
      const maxValue = Math.max(...data.values);
      const chartHeight = height - 110;
      const startX = 50;
      // 坐标轴
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX, 55); ctx.lineTo(startX, chartHeight + 55); ctx.lineTo(width - 20, chartHeight + 55);
      ctx.stroke();
      // 水平网格
      for (let i = 1; i <= 4; i++) {
        const y = 55 + chartHeight * i / 4;
        ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(width - 20, y);
        ctx.strokeStyle = 'rgba(0,0,0,0.05)'; ctx.stroke();
      }
      data.values.forEach((value, i) => {
        const barHeight = (value / maxValue) * chartHeight;
        const x = startX + 10 + i * (barWidth + 10);
        const y = chartHeight + 55 - barHeight;
        const grad = ctx.createLinearGradient(x, y, x, chartHeight + 55);
        grad.addColorStop(0, '#0a84ff');
        grad.addColorStop(1, '#4aa3ff');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth, barHeight);
        // 顶部高亮
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.fillRect(x, y, barWidth, 2);
        // 数值
        ctx.fillStyle = '#1c2530'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
        ctx.fillText(value + '%', x + barWidth / 2, y - 5);
        // 标签
        ctx.fillStyle = '#6e7a8a'; ctx.font = '11px sans-serif';
        ctx.fillText(data.labels[i], x + barWidth / 2, chartHeight + 72);
      });
    }
  }

  /**
   * 更新图表数据
   */
  updateChart(index, newData) {
    if (index < 0 || index >= this.chartMeshes.length) return;

    const chart = this.chartMeshes[index];
    chart.data = newData;
    this.drawChart(chart.canvas, newData);
    chart.texture.needsUpdate = true;
  }

  dispose() {
    this.chartMeshes.forEach(({ mesh, texture }) => {
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (mesh.material.map) mesh.material.map.dispose();
        mesh.material.dispose();
      }
      if (texture) texture.dispose();
    });
    this.chartMeshes = [];
  }
}
