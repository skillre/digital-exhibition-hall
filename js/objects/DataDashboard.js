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
   * 绘制图表
   */
  drawChart(canvas, data) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

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

        const gradient = ctx.createLinearGradient(x, y, x, chartHeight + 20);
        gradient.addColorStop(0, '#00d2ff');
        gradient.addColorStop(1, '#0066aa');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${value}%`, x + barWidth / 2, y - 5);

        ctx.fillStyle = '#888';
        ctx.font = '11px sans-serif';
        ctx.fillText(data.labels[i], x + barWidth / 2, chartHeight + 38);
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
