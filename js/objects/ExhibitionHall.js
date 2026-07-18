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
    this.createCrownMolding();
    this.createWainscoting();
    this.createReceptionDesk();
    this.createBenches();
    this.createPottedPlants();
    this.createWallSconces();
    this.createFloorAccents();
  }

  /**
   * 入口大门 — 玻璃门+金属框架
   */
  createEntrance() {
    const { width, height, depth } = this.config;

    // 门框（金属）
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x5b7fa5, roughness: 0.3, metalness: 0.7
    });
    this._trackedMaterials.push(frameMat);

    // 左门柱
    const pillarGeo = new THREE.BoxGeometry(0.15, height, 0.3);
    this._geometries.push(pillarGeo);
    const leftPillar = new THREE.Mesh(pillarGeo, frameMat);
    leftPillar.position.set(-1.8, height / 2, depth / 2);
    this.scene.add(leftPillar);
    const rightPillar = new THREE.Mesh(pillarGeo, frameMat);
    rightPillar.position.set(1.8, height / 2, depth / 2);
    this.scene.add(rightPillar);

    // 门楣
    const lintelGeo = new THREE.BoxGeometry(3.8, 0.2, 0.3);
    this._geometries.push(lintelGeo);
    const lintel = new THREE.Mesh(lintelGeo, frameMat);
    lintel.position.set(0, height - 0.1, depth / 2);
    this.scene.add(lintel);

    // 玻璃门（半透明）
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xaad4ee, roughness: 0.05, metalness: 0.1,
      transparent: true, opacity: 0.25
    });
    this._trackedMaterials.push(glassMat);
    const glassGeo = new THREE.PlaneGeometry(3.5, height - 0.3);
    this._geometries.push(glassGeo);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, height / 2, depth / 2 + 0.05);
    this.scene.add(glass);

    // 门把手
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc, roughness: 0.2, metalness: 0.9
    });
    this._trackedMaterials.push(handleMat);
    const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
    this._geometries.push(handleGeo);
    const handleL = new THREE.Mesh(handleGeo, handleMat);
    handleL.position.set(-0.3, 1.3, depth / 2 + 0.1);
    this.scene.add(handleL);
    const handleR = new THREE.Mesh(handleGeo, handleMat);
    handleR.position.set(0.3, 1.3, depth / 2 + 0.1);
    this.scene.add(handleR);

    // 招牌
    this.createTextSprite('数据安全服务展厅', {
      x: 0, y: height - 0.5, z: depth / 2 + 0.2, size: 0.7, color: '#1a365d'
    });

    // 入口地垫
    const matGeo = new THREE.PlaneGeometry(3, 1.2);
    this._geometries.push(matGeo);
    const matMat = new THREE.MeshStandardMaterial({
      color: 0x3a5a7c, roughness: 0.9, metalness: 0.0
    });
    this._trackedMaterials.push(matMat);
    const doorMat = new THREE.Mesh(matGeo, matMat);
    doorMat.rotation.x = -Math.PI / 2;
    doorMat.position.set(0, 0.02, depth / 2 - 0.5);
    this.scene.add(doorMat);
  }

  /**
   * 展区标识牌
   */
  createExhibitionSigns() {
    const { width, depth } = this.config;

    const signs = [
      { text: '服务方案', position: [-width / 4, 3.2, -depth / 2 + 0.12] },
      { text: '案例成果', position: [width / 4, 3.2, -depth / 2 + 0.12] },
      { text: '培训教育', position: [-width / 2 + 0.12, 3.2, 0] },
      { text: '技术文档', position: [width / 2 - 0.12, 3.2, 0] }
    ];

    signs.forEach(sign => {
      this.createTextSprite(sign.text, {
        x: sign.position[0],
        y: sign.position[1],
        z: sign.position[2],
        size: 0.45,
        color: '#1a365d'
      });
    });
  }

  /**
   * 顶角线 — 墙壁与天花板交界处的装饰线条
   */
  createCrownMolding() {
    const { width, height, depth } = this.config;
    const moldingMat = new THREE.MeshStandardMaterial({
      color: 0xe0e0e0, roughness: 0.6, metalness: 0.05
    });
    this._trackedMaterials.push(moldingMat);

    // 后墙
    const backGeo = new THREE.BoxGeometry(width, 0.12, 0.08);
    this._geometries.push(backGeo);
    const back = new THREE.Mesh(backGeo, moldingMat);
    back.position.set(0, height - 0.06, -depth / 2 + 0.05);
    this.scene.add(back);

    // 左墙
    const sideGeo = new THREE.BoxGeometry(0.08, 0.12, depth);
    this._geometries.push(sideGeo);
    const left = new THREE.Mesh(sideGeo, moldingMat);
    left.position.set(-width / 2 + 0.05, height - 0.06, 0);
    this.scene.add(left);
    const right = new THREE.Mesh(sideGeo, moldingMat);
    right.position.set(width / 2 - 0.05, height - 0.06, 0);
    this.scene.add(right);
  }

  /**
   * 墙裙 / 护墙板 — 墙壁下半部分装饰
   */
  createWainscoting() {
    const { width, depth } = this.config;
    const wainscotMat = new THREE.MeshStandardMaterial({
      color: 0xd5d5d8, roughness: 0.7, metalness: 0.05
    });
    this._trackedMaterials.push(wainscotMat);

    const wainscotH = 1.0;

    // 后墙墙裙
    const backGeo = new THREE.BoxGeometry(width - 0.2, wainscotH, 0.04);
    this._geometries.push(backGeo);
    const back = new THREE.Mesh(backGeo, wainscotMat);
    back.position.set(0, wainscotH / 2, -depth / 2 + 0.16);
    this.scene.add(back);

    // 左墙墙裙
    const sideGeo = new THREE.BoxGeometry(0.04, wainscotH, depth - 0.2);
    this._geometries.push(sideGeo);
    const left = new THREE.Mesh(sideGeo, wainscotMat);
    left.position.set(-width / 2 + 0.16, wainscotH / 2, 0);
    this.scene.add(left);
    const right = new THREE.Mesh(sideGeo, wainscotMat);
    right.position.set(width / 2 - 0.16, wainscotH / 2, 0);
    this.scene.add(right);

    // 墙裙上沿装饰条
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x8b9dc3, roughness: 0.3, metalness: 0.6
    });
    this._trackedMaterials.push(trimMat);

    const trimBackGeo = new THREE.BoxGeometry(width - 0.2, 0.04, 0.06);
    this._geometries.push(trimBackGeo);
    const trimBack = new THREE.Mesh(trimBackGeo, trimMat);
    trimBack.position.set(0, wainscotH, -depth / 2 + 0.17);
    this.scene.add(trimBack);

    const trimSideGeo = new THREE.BoxGeometry(0.06, 0.04, depth - 0.2);
    this._geometries.push(trimSideGeo);
    const trimL = new THREE.Mesh(trimSideGeo, trimMat);
    trimL.position.set(-width / 2 + 0.17, wainscotH, 0);
    this.scene.add(trimL);
    const trimR = new THREE.Mesh(trimSideGeo, trimMat);
    trimR.position.set(width / 2 - 0.17, wainscotH, 0);
    this.scene.add(trimR);
  }

  /**
   * 前台接待台
   */
  createReceptionDesk() {
    const { depth } = this.config;

    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x3a5a7c, roughness: 0.4, metalness: 0.2
    });
    this._trackedMaterials.push(deskMat);

    // 台面
    const topGeo = new THREE.BoxGeometry(3, 0.08, 0.8);
    this._geometries.push(topGeo);
    const top = new THREE.Mesh(topGeo, deskMat);
    top.position.set(0, 1.1, depth / 2 - 3);
    top.castShadow = true;
    this.scene.add(top);

    // 台身
    const bodyGeo = new THREE.BoxGeometry(2.8, 1.0, 0.6);
    this._geometries.push(bodyGeo);
    const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({
      color: 0x2c3e50, roughness: 0.6, metalness: 0.15
    }));
    this._trackedMaterials.push(body.material);
    body.position.set(0, 0.5, depth / 2 - 3);
    body.castShadow = true;
    this.scene.add(body);

    // 台面标识
    this.createTextSprite('接待处', {
      x: 0, y: 1.5, z: depth / 2 - 3, size: 0.25, color: '#1a365d'
    });
  }

  /**
   * 休息座椅
   */
  createBenches() {
    const benchMat = new THREE.MeshStandardMaterial({
      color: 0x5b7fa5, roughness: 0.5, metalness: 0.2
    });
    this._trackedMaterials.push(benchMat);
    const legMat = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa, roughness: 0.3, metalness: 0.7
    });
    this._trackedMaterials.push(legMat);

    const positions = [
      { x: -8, z: 5 },
      { x: 8, z: 5 },
      { x: 0, z: -5 }
    ];

    positions.forEach(pos => {
      // 座面
      const seatGeo = new THREE.BoxGeometry(2, 0.08, 0.5);
      this._geometries.push(seatGeo);
      const seat = new THREE.Mesh(seatGeo, benchMat);
      seat.position.set(pos.x, 0.5, pos.z);
      seat.castShadow = true;
      this.scene.add(seat);

      // 椅腿
      const legGeo = new THREE.BoxGeometry(0.05, 0.5, 0.05);
      this._geometries.push(legGeo);
      [[-0.9, -0.2], [-0.9, 0.2], [0.9, -0.2], [0.9, 0.2]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(pos.x + lx, 0.25, pos.z + lz);
        this.scene.add(leg);
      });
    });
  }

  /**
   * 盆栽绿植
   */
  createPottedPlants() {
    const potMat = new THREE.MeshStandardMaterial({
      color: 0x8b6f47, roughness: 0.8, metalness: 0.0
    });
    this._trackedMaterials.push(potMat);
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x3a7a3a, roughness: 0.8, metalness: 0.0
    });
    this._trackedMaterials.push(leafMat);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5a4a3a, roughness: 0.9, metalness: 0.0
    });
    this._trackedMaterials.push(trunkMat);

    const positions = [
      { x: -12, z: -12 },
      { x: 12, z: -12 },
      { x: -12, z: 12 },
      { x: 12, z: 12 },
      { x: -5, z: 0 },
      { x: 5, z: 0 }
    ];

    positions.forEach(pos => {
      // 花盆
      const potGeo = new THREE.CylinderGeometry(0.25, 0.2, 0.4, 12);
      this._geometries.push(potGeo);
      const pot = new THREE.Mesh(potGeo, potMat);
      pot.position.set(pos.x, 0.2, pos.z);
      this.scene.add(pot);

      // 树干
      const trunkGeo = new THREE.CylinderGeometry(0.05, 0.07, 1.0, 8);
      this._geometries.push(trunkGeo);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(pos.x, 0.9, pos.z);
      this.scene.add(trunk);

      // 树冠
      const crownGeo = new THREE.SphereGeometry(0.5, 12, 10);
      this._geometries.push(crownGeo);
      const crown = new THREE.Mesh(crownGeo, leafMat);
      crown.position.set(pos.x, 1.7, pos.z);
      crown.castShadow = true;
      this.scene.add(crown);
    });
  }

  /**
   * 壁灯装饰
   */
  createWallSconces() {
    const { width, depth } = this.config;

    const sconceMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc, roughness: 0.3, metalness: 0.7
    });
    this._trackedMaterials.push(sconceMat);
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0xfff5e6, roughness: 0.5, metalness: 0.0,
      emissive: 0xfff5e6, emissiveIntensity: 0.5
    });
    this._trackedMaterials.push(shadeMat);

    const positions = [
      // 后墙
      { x: -8, z: -depth / 2 + 0.2, ry: 0 },
      { x: 8, z: -depth / 2 + 0.2, ry: 0 },
      // 左墙
      { x: -width / 2 + 0.2, z: -8, ry: Math.PI / 2 },
      { x: -width / 2 + 0.2, z: 8, ry: Math.PI / 2 },
      // 右墙
      { x: width / 2 - 0.2, z: -8, ry: -Math.PI / 2 },
      { x: width / 2 - 0.2, z: 8, ry: -Math.PI / 2 }
    ];

    positions.forEach(pos => {
      // 灯座
      const baseGeo = new THREE.BoxGeometry(0.15, 0.15, 0.08);
      this._geometries.push(baseGeo);
      const base = new THREE.Mesh(baseGeo, sconceMat);
      base.position.set(pos.x, 2.2, pos.z);
      this.scene.add(base);

      // 灯罩
      const shadeGeo = new THREE.SphereGeometry(0.12, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      this._geometries.push(shadeGeo);
      const shade = new THREE.Mesh(shadeGeo, shadeMat);
      shade.position.set(pos.x, 2.3, pos.z);
      shade.rotation.y = pos.ry;
      this.scene.add(shade);

      // 暖光
      const light = new THREE.PointLight(0xfff0dd, 0.3, 6);
      light.position.set(pos.x, 2.2, pos.z);
      this.scene.add(light);
    });
  }

  /**
   * 地面装饰线 — 展区边界标识
   */
  createFloorAccents() {
    const { width, depth } = this.config;
    const lineMat = new THREE.MeshStandardMaterial({
      color: 0x5b7fa5, roughness: 0.4, metalness: 0.3
    });
    this._trackedMaterials.push(lineMat);

    // 展区之间的装饰地面线条
    const accentPositions = [
      // 中心十字线
      { sx: 0.06, sy: 0.02, sz: depth, px: 0, pz: 0 },
      { sx: width, sy: 0.02, sz: 0.06, px: 0, pz: 0 }
    ];

    accentPositions.forEach(({ sx, sy, sz, px, pz }) => {
      const geo = new THREE.BoxGeometry(sx, sy, sz);
      this._geometries.push(geo);
      const line = new THREE.Mesh(geo, lineMat);
      line.position.set(px, 0.015, pz);
      this.scene.add(line);
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
