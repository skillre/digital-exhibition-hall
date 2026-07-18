import * as THREE from 'three';

/**
 * 展厅模型
 * 负责创建 3D 展厅空间
 */

export class ExhibitionHall {
  /**
   * 构造函数
   * @param {Object} config - 展厅配置
   */
  constructor(config) {
    this.config = config;
    this.scene = null;

    // 展厅组件
    this.floor = null;
    this.ceiling = null;
    this.walls = [];
    this.panels = [];
    this.exhibitions = [];

    // 材质
    this.materials = {
      floor: null,
      wall: null,
      ceiling: null,
      panel: null,
      panelHover: null
    };

    // 粒子系统
    this.particles = null;

    // 资源追踪（Phase 3: 修复资源泄漏）
    this._textures = [];
    this._geometries = [];
    this._trackedMaterials = [];  // 追踪局部创建的材质
  }

  /**
   * 创建展厅
   * @param {THREE.Scene} scene - 场景对象
   */
  create(scene) {
    this.scene = scene;

    this.initMaterials();
    this.createFloor();
    this.createWalls();
    this.createCeiling();
    this.createDecorations();
    this.createEntranceParticles();

    console.log('展厅创建完成');
  }

  /**
   * 初始化材质
   */
  initMaterials() {
    this.materials.floor = new THREE.MeshStandardMaterial({
      color: 0x556677,
      roughness: 0.6,
      metalness: 0.2
    });

    this.materials.wall = new THREE.MeshStandardMaterial({
      color: 0x667788,
      roughness: 0.7,
      metalness: 0.1
    });

    this.materials.ceiling = new THREE.MeshStandardMaterial({
      color: 0x445566,
      roughness: 0.8,
      metalness: 0.1
    });

    this.materials.panel = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.5,
      metalness: 0.3
    });

    this.materials.panelHover = new THREE.MeshStandardMaterial({
      color: 0x00d2ff,
      roughness: 0.3,
      metalness: 0.5,
      emissive: 0x00d2ff,
      emissiveIntensity: 0.2
    });
  }

  /**
   * 创建地面
   */
  createFloor() {
    const { width, depth } = this.config;

    const geometry = new THREE.PlaneGeometry(width, depth);
    this._geometries.push(geometry);

    this.floor = new THREE.Mesh(geometry, this.materials.floor);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);

    this.addGridHelper(width, depth);
  }

  /**
   * 添加网格辅助线
   */
  addGridHelper(width, depth) {
    const gridHelper = new THREE.GridHelper(
      Math.max(width, depth),
      Math.max(width, depth) / 2,
      0x444455,
      0x333344
    );
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);
  }

  /**
   * 创建墙壁
   */
  createWalls() {
    const { width, height, depth, wallThickness } = this.config;

    const wallConfigs = [
      { size: [width, height, wallThickness], position: [0, height / 2, -depth / 2], rotation: [0, 0, 0] },
      { size: [width / 2 - 2, height, wallThickness], position: [-width / 4 - 1, height / 2, depth / 2], rotation: [0, 0, 0] },
      { size: [width / 2 - 2, height, wallThickness], position: [width / 4 + 1, height / 2, depth / 2], rotation: [0, 0, 0] },
      { size: [wallThickness, height, depth], position: [-width / 2, height / 2, 0], rotation: [0, 0, 0] },
      { size: [wallThickness, height, depth], position: [width / 2, height / 2, 0], rotation: [0, 0, 0] }
    ];

    wallConfigs.forEach(config => {
      const wall = this.createWall(config);
      this.walls.push(wall);
    });
  }

  /**
   * 创建单面墙
   */
  createWall(config) {
    const { size, position, rotation } = config;

    const geometry = new THREE.BoxGeometry(...size);
    this._geometries.push(geometry);

    const wall = new THREE.Mesh(geometry, this.materials.wall);
    wall.position.set(...position);
    wall.rotation.set(...rotation);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.scene.add(wall);

    return wall;
  }

  /**
   * 创建天花板
   */
  createCeiling() {
    const { width, height, depth } = this.config;

    const geometry = new THREE.PlaneGeometry(width, depth);
    this._geometries.push(geometry);

    this.ceiling = new THREE.Mesh(geometry, this.materials.ceiling);
    this.ceiling.position.y = height;
    this.ceiling.rotation.x = Math.PI / 2;
    this.scene.add(this.ceiling);
  }

  /**
   * 创建装饰元素
   */
  createDecorations() {
    this.createEntrance();
    this.createExhibitionSigns();
    this.createLightDecorations();
  }

  /**
   * 创建入口
   */
  createEntrance() {
    const { depth } = this.config;

    const doorFrameGeometry = new THREE.BoxGeometry(4, 3.5, 0.2);
    this._geometries.push(doorFrameGeometry);

    const doorFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0x00d2ff,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0x00d2ff,
      emissiveIntensity: 0.1
    });

    const doorFrame = new THREE.Mesh(doorFrameGeometry, doorFrameMaterial);
    doorFrame.position.set(0, 1.75, depth / 2);
    this.scene.add(doorFrame);

    this.createTextSprite('数据安全服务展厅', {
      x: 0, y: 3.5, z: depth / 2, size: 0.8, color: '#00d2ff'
    });
  }

  /**
   * 创建展区标识
   */
  createExhibitionSigns() {
    const { width, depth } = this.config;

    const signs = [
      { text: '服务方案', position: [-width / 4, 3, -depth / 2 + 0.1] },
      { text: '案例成果', position: [width / 4, 3, -depth / 2 + 0.1] },
      { text: '培训教育', position: [-width / 2 + 0.1, 3, 0] },
      { text: '技术文档', position: [width / 2 - 0.1, 3, 0] }
    ];

    signs.forEach(sign => {
      this.createTextSprite(sign.text, {
        x: sign.position[0],
        y: sign.position[1],
        z: sign.position[2],
        size: 0.5,
        color: '#ffffff'
      });
    });
  }

  /**
   * 创建文字精灵
   * @param {string} text - 文字内容
   * @param {Object} options - 配置选项
   */
  createTextSprite(text, options) {
    const { x, y, z, size = 1, color = '#ffffff' } = options;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    // 绘制背景
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.beginPath();
    context.roundRect(0, 0, canvas.width, canvas.height, 10);
    context.fill();

    // 绘制文字
    context.font = 'Bold 48px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    // 创建纹理并追踪
    const texture = new THREE.CanvasTexture(canvas);
    this._textures.push(texture);

    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(size * 4, size, 1);
    this.scene.add(sprite);

    return sprite;
  }

  /**
   * 创建灯光装饰
   */
  createLightDecorations() {
    const { width, height, depth } = this.config;

    const lightPositions = [
      { x: -width / 4, y: height - 0.5, z: -depth / 4 },
      { x: width / 4, y: height - 0.5, z: -depth / 4 },
      { x: -width / 4, y: height - 0.5, z: depth / 4 },
      { x: width / 4, y: height - 0.5, z: depth / 4 }
    ];

    lightPositions.forEach(pos => {
      const light = new THREE.PointLight(0x00d2ff, 0.5, 15);
      light.position.set(pos.x, pos.y, pos.z);
      this.scene.add(light);

      const lightGeometry = new THREE.SphereGeometry(0.1, 16, 16);
      this._geometries.push(lightGeometry);

      const lightMaterial = new THREE.MeshStandardMaterial({
        color: 0x00d2ff,
        emissive: 0x00d2ff,
        emissiveIntensity: 1
      });

      const lightMesh = new THREE.Mesh(lightGeometry, lightMaterial);
      lightMesh.position.set(pos.x, pos.y, pos.z);
      this.scene.add(lightMesh);
    });
  }

  /**
   * 加载展示内容
   * @param {Object} contentData - 内容数据
   */
  loadContent(contentData) {
    if (!contentData || !contentData.exhibitions) {
      console.warn('没有可加载的内容');
      return;
    }

    contentData.exhibitions.forEach(exhibition => {
      this.createExhibitionZone(exhibition);
    });

    console.log('展示内容加载完成');
  }

  /**
   * 创建展区
   * @param {Object} exhibition - 展区配置
   */
  createExhibitionZone(exhibition) {
    const { id, name, description, position, panels } = exhibition;

    const zone = new THREE.Group();
    zone.position.set(position.x, position.y, position.z);
    zone.userData = { id, name, description };

    this.createTextSprite(name, {
      x: 0, y: 3, z: 0, size: 0.6, color: '#00d2ff'
    });

    if (panels && panels.length > 0) {
      panels.forEach((panelData, index) => {
        const panel = this.createPanel(panelData, index, panels.length);
        zone.add(panel);
        this.panels.push(panel);
      });
    }

    this.scene.add(zone);
    this.exhibitions.push(zone);

    return zone;
  }

  /**
   * 创建展板
   * @param {Object} panelData - 展板数据
   * @param {number} index - 索引
   * @param {number} total - 总数
   * @returns {THREE.Group} 展板组
   */
  createPanel(panelData, index, total) {
    const { id, type, title, description, tags, thumbnail, contentUrl } = panelData;

    const panelGroup = new THREE.Group();
    panelGroup.userData = {
      id, type, title, description, tags, thumbnail, contentUrl, isPanel: true
    };

    const spacing = 3;
    const startX = -(total - 1) * spacing / 2;
    const x = startX + index * spacing;

    // 展板底板
    const boardGeometry = new THREE.BoxGeometry(2.5, 3.5, 0.1);
    this._geometries.push(boardGeometry);

    const board = new THREE.Mesh(boardGeometry, this.materials.panel);
    board.position.set(x, 1.75, -0.05);
    board.castShadow = true;
    board.receiveShadow = true;
    panelGroup.add(board);

    // 展板边框
    const borderGeometry = new THREE.EdgesGeometry(boardGeometry);
    this._geometries.push(borderGeometry);

    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0x00d2ff,
      transparent: true,
      opacity: 0.5
    });
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);
    border.position.copy(board.position);
    panelGroup.add(border);

    // 标题文字
    this.createTextSprite(title, {
      x: x, y: 3.8, z: 0, size: 0.3, color: '#ffffff'
    });

    // 类型图标
    const icon = this.getTypeIcon(type);
    this.createTextSprite(icon, {
      x: x, y: 2.5, z: 0.1, size: 0.5, color: '#00d2ff'
    });

    // 交互区域（用于射线检测）
    const hitboxGeometry = new THREE.BoxGeometry(2.5, 3.5, 0.5);
    this._geometries.push(hitboxGeometry);

    const hitboxMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    hitbox.position.set(x, 1.75, 0.2);
    hitbox.userData = panelGroup.userData;
    panelGroup.add(hitbox);

    return panelGroup;
  }

  /**
   * 获取类型图标
   */
  getTypeIcon(type) {
    const icons = {
      document: '📄',
      image: '🖼️',
      video: '🎬',
      chart: '📊',
      model3d: '🧊'
    };
    return icons[type] || '📋';
  }

  /**
   * 高亮展板
   */
  highlightPanel(panel) {
    if (!panel) return;
    panel.children.forEach(child => {
      if (child.isMesh && child.material === this.materials.panel) {
        child.material = this.materials.panelHover;
      }
    });
  }

  /**
   * 取消高亮展板
   */
  unhighlightPanel(panel) {
    if (!panel) return;
    panel.children.forEach(child => {
      if (child.isMesh && child.material === this.materials.panelHover) {
        child.material = this.materials.panel;
      }
    });
  }

  /**
   * 获取所有展板
   */
  getPanels() {
    return this.panels;
  }

  /**
   * 获取展区
   */
  getExhibition(id) {
    return this.exhibitions.find(ex => ex.userData.id === id);
  }

  /**
   * 创建入口粒子效果
   */
  createEntranceParticles() {
    const particleCount = 200;
    const spread = 5;
    const depth = this.config.depth;

    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * spread;
      positions[i3 + 1] = 1 + Math.random() * 2;
      positions[i3 + 2] = (depth / 2) + (Math.random() - 0.5) * spread;

      velocities[i3] = (Math.random() - 0.5) * 0.01;
      velocities[i3 + 1] = Math.random() * 0.02 + 0.01;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this._geometries.push(geometry);

    const material = new THREE.PointsMaterial({
      color: 0x00d2ff,
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this._trackedMaterials.push(material);

    this.particles = new THREE.Points(geometry, material);
    this.particles.userData.velocities = velocities;
    this.scene.add(this.particles);

    console.log('入口粒子效果创建完成');
  }

  /**
   * 更新粒子动画
   */
  updateParticles() {
    if (!this.particles) return;

    const positions = this.particles.geometry.attributes.position.array;
    const velocities = this.particles.userData.velocities;
    const count = positions.length / 3;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] += velocities[i3];
      positions[i3 + 1] += velocities[i3 + 1];
      positions[i3 + 2] += velocities[i3 + 2];

      if (positions[i3 + 1] > 4) {
        positions[i3 + 1] = 1;
        positions[i3] = (Math.random() - 0.5) * 5;
        positions[i3 + 2] = (this.config.depth / 2) + (Math.random() - 0.5) * 5;
      }
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * 清理资源（Phase 3: 完整资源清理）
   */
  dispose() {
    // 清理所有追踪的纹理
    this._textures.forEach(texture => {
      if (texture) texture.dispose();
    });
    this._textures = [];

    // 清理所有追踪的几何体
    this._geometries.forEach(geometry => {
      if (geometry) geometry.dispose();
    });
    this._geometries = [];

    // 清理追踪的材质
    this._trackedMaterials.forEach(material => {
      if (material) material.dispose();
    });
    this._trackedMaterials = [];

    // 清理材质
    Object.values(this.materials).forEach(material => {
      if (material) material.dispose();
    });

    // 清理粒子系统
    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles = null;
    }

    console.log('展厅资源已清理');
  }
}
