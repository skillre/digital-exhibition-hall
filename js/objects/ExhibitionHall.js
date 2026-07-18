import * as THREE from 'three';

/**
 * 展厅模型
 * 负责创建 3D 展厅空间
 * 视觉风格：拟物感 — 模拟真实展厅的材质和光照
 */

export class ExhibitionHall {
  constructor(config) {
    this.config = config;
    this.scene = null;

    this.floor = null;
    this.ceiling = null;
    this.walls = [];
    this.panels = [];
    this.exhibitions = [];
    this.particles = null;

    this.materials = {
      floor: null,
      wall: null,
      ceiling: null,
      panel: null,
      panelHover: null
    };

    this._textures = [];
    this._geometries = [];
    this._trackedMaterials = [];
  }

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
   * 初始化材质 — 拟物感：模拟真实展厅材料
   */
  initMaterials() {
    // 地面：浅灰大理石质感
    this.materials.floor = new THREE.MeshStandardMaterial({
      color: 0xc8c8d0,
      roughness: 0.4,
      metalness: 0.05
    });

    // 墙壁：白色墙面
    this.materials.wall = new THREE.MeshStandardMaterial({
      color: 0xe8e8ec,
      roughness: 0.85,
      metalness: 0.0
    });

    // 天花板：白色天花板
    this.materials.ceiling = new THREE.MeshStandardMaterial({
      color: 0xf0f0f4,
      roughness: 0.9,
      metalness: 0.0
    });

    // 展板：深色展示面板（对比白色墙面）
    this.materials.panel = new THREE.MeshStandardMaterial({
      color: 0x2c3e50,
      roughness: 0.6,
      metalness: 0.1,
      emissive: 0x0a1628,
      emissiveIntensity: 0.1
    });

    // 展板悬停：蓝色高光
    this.materials.panelHover = new THREE.MeshStandardMaterial({
      color: 0x1a5276,
      roughness: 0.4,
      metalness: 0.2,
      emissive: 0x2980b9,
      emissiveIntensity: 0.3
    });

    // 墙壁装饰线条（金属条）
    this.materials.edgeGlow = new THREE.MeshStandardMaterial({
      color: 0x8b9dc3,
      roughness: 0.3,
      metalness: 0.8
    });
  }

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

  addGridHelper(width, depth) {
    // 浅色细线网格 — 模拟地砖缝线
    const gridHelper = new THREE.GridHelper(
      Math.max(width, depth),
      20,
      0xaaaaaa,
      0xcccccc
    );
    gridHelper.position.y = 0.01;
    gridHelper.material.opacity = 0.15;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);
  }

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

    // 墙壁底部踢脚线
    this.createBaseboard(wallConfigs);
  }

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
   * 创建踢脚线 — 模拟真实展厅
   */
  createBaseboard(wallConfigs) {
    wallConfigs.forEach(config => {
      const { size, position } = config;
      const stripWidth = Math.max(size[0], size[2]);
      const stripGeometry = new THREE.BoxGeometry(stripWidth, 0.12, 0.06);
      this._geometries.push(stripGeometry);

      const strip = new THREE.Mesh(stripGeometry, this.materials.edgeGlow);
      if (size[2] < size[0]) {
        strip.position.set(position[0], 0.06, position[2] > 0 ? position[2] + 0.15 : position[2] - 0.15);
      } else {
        strip.position.set(position[0] > 0 ? position[0] + 0.15 : position[0] - 0.15, 0.06, position[2]);
        strip.rotation.y = Math.PI / 2;
      }
      this.scene.add(strip);
    });
  }

  createCeiling() {
    const { width, height, depth } = this.config;
    const geometry = new THREE.PlaneGeometry(width, depth);
    this._geometries.push(geometry);

    this.ceiling = new THREE.Mesh(geometry, this.materials.ceiling);
    this.ceiling.position.y = height;
    this.ceiling.rotation.x = Math.PI / 2;
    this.scene.add(this.ceiling);

    // 天花板灯带 — 模拟真实日光灯
    this.createCeilingLights();
  }

  /**
   * 天花板灯带 — 模拟真实展厅照明
   */
  createCeilingLights() {
    const { width, height, depth } = this.config;
    const lightColor = 0xfff5e6; // 暖白色

    // 灯带位置（3 排 × 3 列）
    const rows = [-depth / 4, 0, depth / 4];
    const cols = [-width / 4, 0, width / 4];

    rows.forEach(z => {
      cols.forEach(x => {
        // 灯带几何体
        const barGeometry = new THREE.BoxGeometry(3, 0.05, 0.3);
        this._geometries.push(barGeometry);

        const barMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: lightColor,
          emissiveIntensity: 2.0,
          roughness: 0.1,
          metalness: 0.0
        });
        this._trackedMaterials.push(barMaterial);

        const bar = new THREE.Mesh(barGeometry, barMaterial);
        bar.position.set(x, height - 0.1, z);
        this.scene.add(bar);

        // 每个灯带配一个点光源
        const pointLight = new THREE.PointLight(lightColor, 0.6, 12);
        pointLight.position.set(x, height - 0.3, z);
        this.scene.add(pointLight);
      });
    });
  }

  createDecorations() {
    this.createEntrance();
    this.createExhibitionSigns();
  }

  createEntrance() {
    const { depth } = this.config;

    const doorFrameGeometry = new THREE.BoxGeometry(4, 3.5, 0.2);
    this._geometries.push(doorFrameGeometry);

    const doorFrameMaterial = new THREE.MeshStandardMaterial({
      color: 0x5b7fa5,
      roughness: 0.3,
      metalness: 0.6
    });
    this._trackedMaterials.push(doorFrameMaterial);

    const doorFrame = new THREE.Mesh(doorFrameGeometry, doorFrameMaterial);
    doorFrame.position.set(0, 1.75, depth / 2);
    this.scene.add(doorFrame);

    this.createTextSprite('数据安全服务展厅', {
      x: 0, y: 3.8, z: depth / 2, size: 0.8, color: '#1a365d'
    });
  }

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
        color: '#2c3e50'
      });
    });
  }

  createTextSprite(text, options) {
    const { x, y, z, size = 1, color = '#2c3e50' } = options;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    // 半透明白色背景
    context.fillStyle = 'rgba(255, 255, 255, 0.85)';
    context.beginPath();
    context.roundRect(0, 0, canvas.width, canvas.height, 10);
    context.fill();

    // 深色文字
    context.font = 'Bold 48px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

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
   * 入口粒子效果
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
      color: 0x88bbdd,
      size: 0.04,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this._trackedMaterials.push(material);

    this.particles = new THREE.Points(geometry, material);
    this.particles.userData.velocities = velocities;
    this.scene.add(this.particles);
    console.log('入口粒子效果创建完成');
  }

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

  createExhibitionZone(exhibition) {
    const { id, name, description, position, panels } = exhibition;

    const zone = new THREE.Group();
    zone.position.set(position.x, position.y, position.z);
    zone.userData = { id, name, description };

    this.createTextSprite(name, {
      x: 0, y: 3.2, z: 0, size: 0.6, color: '#1a365d'
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

    // 展板边框（金属银色）
    const borderGeometry = new THREE.EdgesGeometry(boardGeometry);
    this._geometries.push(borderGeometry);

    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0x8b9dc3,
      transparent: true,
      opacity: 0.6
    });
    this._trackedMaterials.push(borderMaterial);
    const border = new THREE.LineSegments(borderGeometry, borderMaterial);
    border.position.copy(board.position);
    panelGroup.add(border);

    // 标题文字
    this.createTextSprite(title, {
      x: x, y: 3.8, z: 0, size: 0.3, color: '#1a365d'
    });

    // 类型图标
    const icon = this.getTypeIcon(type);
    this.createTextSprite(icon, {
      x: x, y: 2.5, z: 0.1, size: 0.5, color: '#2c3e50'
    });

    // 交互区域（用于射线检测）
    const hitboxGeometry = new THREE.BoxGeometry(2.5, 3.5, 0.5);
    this._geometries.push(hitboxGeometry);

    const hitboxMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    this._trackedMaterials.push(hitboxMaterial);
    const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
    hitbox.position.set(x, 1.75, 0.2);
    hitbox.userData = panelGroup.userData;
    panelGroup.add(hitbox);

    return panelGroup;
  }

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

  highlightPanel(panel) {
    if (!panel) return;
    panel.children.forEach(child => {
      if (child.isMesh && child.material === this.materials.panel) {
        child.material = this.materials.panelHover;
      }
    });
  }

  unhighlightPanel(panel) {
    if (!panel) return;
    panel.children.forEach(child => {
      if (child.isMesh && child.material === this.materials.panelHover) {
        child.material = this.materials.panel;
      }
    });
  }

  getPanels() { return this.panels; }

  getExhibition(id) {
    return this.exhibitions.find(ex => ex.userData.id === id);
  }

  dispose() {
    this._textures.forEach(texture => { if (texture) texture.dispose(); });
    this._textures = [];

    this._geometries.forEach(geometry => { if (geometry) geometry.dispose(); });
    this._geometries = [];

    this._trackedMaterials.forEach(material => { if (material) material.dispose(); });
    this._trackedMaterials = [];

    Object.values(this.materials).forEach(material => { if (material) material.dispose(); });

    if (this.particles) {
      this.scene.remove(this.particles);
      this.particles = null;
    }

    console.log('展厅资源已清理');
  }
}
