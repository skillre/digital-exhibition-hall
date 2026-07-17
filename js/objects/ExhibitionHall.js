/**
 * 展厅模型
 * 负责创建 3D 展厅空间
 */

class ExhibitionHall {
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
  }
  
  /**
   * 创建展厅
   * @param {THREE.Scene} scene - 场景对象
   */
  create(scene) {
    this.scene = scene;
    
    // 初始化材质
    this.initMaterials();
    
    // 创建地面
    this.createFloor();
    
    // 创建墙壁
    this.createWalls();
    
    // 创建天花板
    this.createCeiling();
    
    // 创建装饰元素
    this.createDecorations();
    
    console.log('展厅创建完成');
  }
  
  /**
   * 初始化材质
   */
  initMaterials() {
    // 地面材质
    this.materials.floor = new THREE.MeshStandardMaterial({
      color: 0x333344,
      roughness: 0.8,
      metalness: 0.2
    });
    
    // 墙壁材质
    this.materials.wall = new THREE.MeshStandardMaterial({
      color: 0x444455,
      roughness: 0.9,
      metalness: 0.1
    });
    
    // 天花板材质
    this.materials.ceiling = new THREE.MeshStandardMaterial({
      color: 0x222233,
      roughness: 0.9,
      metalness: 0.1
    });
    
    // 展板材质
    this.materials.panel = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.5,
      metalness: 0.3
    });
    
    // 展板悬停材质
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
    
    // 创建地面几何体
    const geometry = new THREE.PlaneGeometry(width, depth);
    
    // 创建地面网格
    this.floor = new THREE.Mesh(geometry, this.materials.floor);
    
    // 旋转地面使其水平
    this.floor.rotation.x = -Math.PI / 2;
    
    // 启用阴影接收
    this.floor.receiveShadow = true;
    
    // 添加到场景
    this.scene.add(this.floor);
    
    // 添加网格辅助线
    this.addGridHelper(width, depth);
  }
  
  /**
   * 添加网格辅助线
   * @param {number} width - 宽度
   * @param {number} depth - 深度
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
    
    // 墙壁配置
    const wallConfigs = [
      // 后墙
      {
        size: [width, height, wallThickness],
        position: [0, height / 2, -depth / 2],
        rotation: [0, 0, 0]
      },
      // 前墙（留出入口）
      {
        size: [width / 2 - 2, height, wallThickness],
        position: [-width / 4 - 1, height / 2, depth / 2],
        rotation: [0, 0, 0]
      },
      {
        size: [width / 2 - 2, height, wallThickness],
        position: [width / 4 + 1, height / 2, depth / 2],
        rotation: [0, 0, 0]
      },
      // 左墙
      {
        size: [wallThickness, height, depth],
        position: [-width / 2, height / 2, 0],
        rotation: [0, 0, 0]
      },
      // 右墙
      {
        size: [wallThickness, height, depth],
        position: [width / 2, height / 2, 0],
        rotation: [0, 0, 0]
      }
    ];
    
    // 创建每面墙
    wallConfigs.forEach(config => {
      const wall = this.createWall(config);
      this.walls.push(wall);
    });
  }
  
  /**
   * 创建单面墙
   * @param {Object} config - 墙壁配置
   * @returns {THREE.Mesh} 墙壁网格
   */
  createWall(config) {
    const { size, position, rotation } = config;
    
    // 创建几何体
    const geometry = new THREE.BoxGeometry(...size);
    
    // 创建网格
    const wall = new THREE.Mesh(geometry, this.materials.wall);
    
    // 设置位置
    wall.position.set(...position);
    
    // 设置旋转
    wall.rotation.set(...rotation);
    
    // 启用阴影
    wall.castShadow = true;
    wall.receiveShadow = true;
    
    // 添加到场景
    this.scene.add(wall);
    
    return wall;
  }
  
  /**
   * 创建天花板
   */
  createCeiling() {
    const { width, height, depth } = this.config;
    
    // 创建天花板几何体
    const geometry = new THREE.PlaneGeometry(width, depth);
    
    // 创建天花板网格
    this.ceiling = new THREE.Mesh(geometry, this.materials.ceiling);
    
    // 设置位置和旋转
    this.ceiling.position.y = height;
    this.ceiling.rotation.x = Math.PI / 2;
    
    // 添加到场景
    this.scene.add(this.ceiling);
  }
  
  /**
   * 创建装饰元素
   */
  createDecorations() {
    // 创建入口标识
    this.createEntrance();
    
    // 创建展区标识
    this.createExhibitionSigns();
    
    // 创建灯光装饰
    this.createLightDecorations();
  }
  
  /**
   * 创建入口
   */
  createEntrance() {
    const { depth } = this.config;
    
    // 入口门框
    const doorFrameGeometry = new THREE.BoxGeometry(4, 3.5, 0.2);
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
    
    // 入口文字
    this.createTextSprite('数据安全服务展厅', {
      x: 0,
      y: 3.5,
      z: depth / 2,
      size: 0.8,
      color: '#00d2ff'
    });
  }
  
  /**
   * 创建展区标识
   */
  createExhibitionSigns() {
    const { width, depth } = this.config;
    
    // 各展区标识位置
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
    
    // 创建画布
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;
    
    // 绘制背景
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.roundRect(0, 0, canvas.width, canvas.height, 10);
    context.fill();
    
    // 绘制文字
    context.font = 'Bold 48px Microsoft YaHei';
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // 创建纹理
    const texture = new THREE.CanvasTexture(canvas);
    
    // 创建材质
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });
    
    // 创建精灵
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(size * 4, size, 1);
    
    // 添加到场景
    this.scene.add(sprite);
    
    return sprite;
  }
  
  /**
   * 创建灯光装饰
   */
  createLightDecorations() {
    const { width, height, depth } = this.config;
    
    // 创建点光源装饰
    const lightPositions = [
      { x: -width / 4, y: height - 0.5, z: -depth / 4 },
      { x: width / 4, y: height - 0.5, z: -depth / 4 },
      { x: -width / 4, y: height - 0.5, z: depth / 4 },
      { x: width / 4, y: height - 0.5, z: depth / 4 }
    ];
    
    lightPositions.forEach(pos => {
      // 灯光
      const light = new THREE.PointLight(0x00d2ff, 0.5, 15);
      light.position.set(pos.x, pos.y, pos.z);
      this.scene.add(light);
      
      // 灯光模型
      const lightGeometry = new THREE.SphereGeometry(0.1, 16, 16);
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
    
    // 创建展区容器
    const zone = new THREE.Group();
    zone.position.set(position.x, position.y, position.z);
    zone.userData = { id, name, description };
    
    // 创建展区标题
    this.createTextSprite(name, {
      x: 0,
      y: 3,
      z: 0,
      size: 0.6,
      color: '#00d2ff'
    });
    
    // 创建展板
    if (panels && panels.length > 0) {
      panels.forEach((panelData, index) => {
        const panel = this.createPanel(panelData, index, panels.length);
        zone.add(panel);
        this.panels.push(panel);
      });
    }
    
    // 添加到场景
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
    
    // 创建展板组
    const panelGroup = new THREE.Group();
    panelGroup.userData = {
      id,
      type,
      title,
      description,
      tags,
      thumbnail,
      contentUrl,
      isPanel: true
    };
    
    // 计算位置（均匀分布）
    const spacing = 3;
    const startX = -(total - 1) * spacing / 2;
    const x = startX + index * spacing;
    
    // 展板底板
    const boardGeometry = new THREE.BoxGeometry(2.5, 3.5, 0.1);
    const board = new THREE.Mesh(boardGeometry, this.materials.panel);
    board.position.set(x, 1.75, -0.05);
    board.castShadow = true;
    board.receiveShadow = true;
    panelGroup.add(board);
    
    // 展板边框
    const borderGeometry = new THREE.EdgesGeometry(boardGeometry);
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
      x: x,
      y: 3.8,
      z: 0,
      size: 0.3,
      color: '#ffffff'
    });
    
    // 类型图标
    const icon = this.getTypeIcon(type);
    this.createTextSprite(icon, {
      x: x,
      y: 2.5,
      z: 0.1,
      size: 0.5,
      color: '#00d2ff'
    });
    
    // 交互区域（用于射线检测）
    const hitboxGeometry = new THREE.BoxGeometry(2.5, 3.5, 0.5);
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
   * @param {string} type - 内容类型
   * @returns {string} 图标
   */
  getTypeIcon(type) {
    const icons = {
      document: '📄',
      image: '🖼️',
      video: '🎬',
      chart: '📊'
    };
    return icons[type] || '📋';
  }
  
  /**
   * 高亮展板
   * @param {THREE.Object3D} panel - 展板对象
   */
  highlightPanel(panel) {
    if (!panel) return;
    
    // 遍历展板子对象
    panel.children.forEach(child => {
      if (child.isMesh && child.material === this.materials.panel) {
        child.material = this.materials.panelHover;
      }
    });
  }
  
  /**
   * 取消高亮展板
   * @param {THREE.Object3D} panel - 展板对象
   */
  unhighlightPanel(panel) {
    if (!panel) return;
    
    // 遍历展板子对象
    panel.children.forEach(child => {
      if (child.isMesh && child.material === this.materials.panelHover) {
        child.material = this.materials.panel;
      }
    });
  }
  
  /**
   * 获取所有展板
   * @returns {Array} 展板数组
   */
  getPanels() {
    return this.panels;
  }
  
  /**
   * 获取展区
   * @param {string} id - 展区 ID
   * @returns {THREE.Group} 展区组
   */
  getExhibition(id) {
    return this.exhibitions.find(ex => ex.userData.id === id);
  }
  
  /**
   * 清理资源
   */
  dispose() {
    // 清理材质
    Object.values(this.materials).forEach(material => {
      if (material) {
        material.dispose();
      }
    });
    
    console.log('展厅资源已清理');
  }
}

// 导出
window.ExhibitionHall = ExhibitionHall;
