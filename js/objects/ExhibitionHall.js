import * as THREE from 'three';

/**
 * 展厅模型
 * 高质量拟物感 — 环境贴图 + 程序纹理 + 丰富细节
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
   * 创建程序纹理 — 模拟真实材质表面
   */
  createProceduralTexture(width, height, drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    drawFn(ctx, width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this._textures.push(texture);
    return texture;
  }

  /**
   * 生成大理石纹理
   */
  drawMarbleTexture(ctx, w, h) {
    // 浅灰底色
    ctx.fillStyle = '#c8ccd4';
    ctx.fillRect(0, 0, w, h);

    // 纹理线条
    for (let i = 0; i < 40; i++) {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(180, 185, 195, ${0.1 + Math.random() * 0.2})`;
      ctx.lineWidth = 0.5 + Math.random() * 1.5;
      let x = Math.random() * w;
      let y = Math.random() * h;
      ctx.moveTo(x, y);
      for (let j = 0; j < 6; j++) {
        x += (Math.random() - 0.5) * 80;
        y += (Math.random() - 0.5) * 80;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 细微噪点
    for (let i = 0; i < 2000; i++) {
      const px = Math.random() * w;
      const py = Math.random() * h;
      const v = 190 + Math.random() * 30;
      ctx.fillStyle = `rgba(${v}, ${v}, ${v + 5}, 0.15)`;
      ctx.fillRect(px, py, 1, 1);
    }
  }

  /**
   * 生成墙面纹理 — 带细微纹理的白墙
   */
  drawWallTexture(ctx, w, h) {
    ctx.fillStyle = '#eaeaf0';
    ctx.fillRect(0, 0, w, h);

    // 细微噪点模拟墙面质感
    for (let i = 0; i < 5000; i++) {
      const px = Math.random() * w;
      const py = Math.random() * h;
      const v = 220 + Math.random() * 20;
      ctx.fillStyle = `rgba(${v}, ${v}, ${v + 3}, 0.12)`;
      ctx.fillRect(px, py, 1, 1);
    }
  }

  /**
   * 生成天花板纹理
   */
  drawCeilingTexture(ctx, w, h) {
    ctx.fillStyle = '#f2f2f6';
    ctx.fillRect(0, 0, w, h);

    // 方格天花板块
    const tileW = w / 4;
    const tileH = h / 4;
    ctx.strokeStyle = 'rgba(200, 200, 210, 0.3)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += tileW) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y <= h; y += tileH) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }

  initMaterials() {
    // 地面：大理石纹理 + 反射
    const floorTex = this.createProceduralTexture(512, 512, (ctx, w, h) => this.drawMarbleTexture(ctx, w, h));
    floorTex.repeat.set(4, 4);
    this.materials.floor = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.35,
      metalness: 0.05,
      envMapIntensity: 0.5
    });

    // 墙壁：纹理白墙
    const wallTex = this.createProceduralTexture(256, 256, (ctx, w, h) => this.drawWallTexture(ctx, w, h));
    wallTex.repeat.set(2, 1);
    this.materials.wall = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.85,
      metalness: 0.0,
      envMapIntensity: 0.2
    });

    // 天花板：方格天花板
    const ceilTex = this.createProceduralTexture(512, 512, (ctx, w, h) => this.drawCeilingTexture(ctx, w, h));
    ceilTex.repeat.set(2, 2);
    this.materials.ceiling = new THREE.MeshStandardMaterial({
      map: ceilTex,
      roughness: 0.9,
      metalness: 0.0,
      envMapIntensity: 0.1
    });

    // 展板：深色展示面板
    this.materials.panel = new THREE.MeshStandardMaterial({
      color: 0x2c3e50,
      roughness: 0.5,
      metalness: 0.15,
      emissive: 0x0a1628,
      emissiveIntensity: 0.08,
      envMapIntensity: 0.4
    });

    // 展板悬停
    this.materials.panelHover = new THREE.MeshStandardMaterial({
      color: 0x1a5276,
      roughness: 0.35,
      metalness: 0.2,
      emissive: 0x2980b9,
      emissiveIntensity: 0.25,
      envMapIntensity: 0.5
    });

    // 金属装饰条
    this.materials.edgeGlow = new THREE.MeshStandardMaterial({
      color: 0xaab4c4,
      roughness: 0.25,
      metalness: 0.85,
      envMapIntensity: 1.0
    });

    // 木质纹理
    const woodTex = this.createProceduralTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#8b7355';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 60; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(100, 80, 55, ${0.1 + Math.random() * 0.15})`;
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.moveTo(0, Math.random() * h);
        ctx.lineTo(w, Math.random() * h);
        ctx.stroke();
      }
    });
    woodTex.repeat.set(1, 1);
    this.materials.wood = new THREE.MeshStandardMaterial({
      map: woodTex,
      roughness: 0.7,
      metalness: 0.0,
      envMapIntensity: 0.3
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

    this.createBaseboard(wallConfigs);
    this.createCrownMolding();
    this.createWainscoting();
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

  createCrownMolding() {
    const { width, height, depth } = this.config;
    const mat = this.materials.edgeGlow;

    const backGeo = new THREE.BoxGeometry(width, 0.1, 0.06);
    this._geometries.push(backGeo);
    const back = new THREE.Mesh(backGeo, mat);
    back.position.set(0, height - 0.05, -depth / 2 + 0.04);
    this.scene.add(back);

    const sideGeo = new THREE.BoxGeometry(0.06, 0.1, depth);
    this._geometries.push(sideGeo);
    const left = new THREE.Mesh(sideGeo, mat);
    left.position.set(-width / 2 + 0.04, height - 0.05, 0);
    this.scene.add(left);
    const right = new THREE.Mesh(sideGeo, mat);
    right.position.set(width / 2 - 0.04, height - 0.05, 0);
    this.scene.add(right);
  }

  createWainscoting() {
    const { width, depth } = this.config;
    const wainscotMat = new THREE.MeshStandardMaterial({
      color: 0xdadadd,
      roughness: 0.65,
      metalness: 0.05,
      envMapIntensity: 0.3
    });
    this._trackedMaterials.push(wainscotMat);
    const h = 1.0;

    const backGeo = new THREE.BoxGeometry(width - 0.2, h, 0.03);
    this._geometries.push(backGeo);
    const back = new THREE.Mesh(backGeo, wainscotMat);
    back.position.set(0, h / 2, -depth / 2 + 0.16);
    this.scene.add(back);

    const sideGeo = new THREE.BoxGeometry(0.03, h, depth - 0.2);
    this._geometries.push(sideGeo);
    const left = new THREE.Mesh(sideGeo, wainscotMat);
    left.position.set(-width / 2 + 0.16, h / 2, 0);
    this.scene.add(left);
    const right = new THREE.Mesh(sideGeo, wainscotMat);
    right.position.set(width / 2 - 0.16, h / 2, 0);
    this.scene.add(right);

    // 墙裙上沿金属条
    const trimMat = this.materials.edgeGlow;
    const trimBackGeo = new THREE.BoxGeometry(width - 0.2, 0.03, 0.05);
    this._geometries.push(trimBackGeo);
    const trimBack = new THREE.Mesh(trimBackGeo, trimMat);
    trimBack.position.set(0, h + 0.015, -depth / 2 + 0.17);
    this.scene.add(trimBack);

    const trimSideGeo = new THREE.BoxGeometry(0.05, 0.03, depth - 0.2);
    this._geometries.push(trimSideGeo);
    const trimL = new THREE.Mesh(trimSideGeo, trimMat);
    trimL.position.set(-width / 2 + 0.17, h + 0.015, 0);
    this.scene.add(trimL);
    const trimR = new THREE.Mesh(trimSideGeo, trimMat);
    trimR.position.set(width / 2 - 0.17, h + 0.015, 0);
    this.scene.add(trimR);
  }

  createCeiling() {
    const { width, height, depth } = this.config;
    const geometry = new THREE.PlaneGeometry(width, depth);
    this._geometries.push(geometry);

    this.ceiling = new THREE.Mesh(geometry, this.materials.ceiling);
    this.ceiling.position.y = height;
    this.ceiling.rotation.x = Math.PI / 2;
    this.scene.add(this.ceiling);

    this.createCeilingLights();
  }

  createCeilingLights() {
    const { width, height, depth } = this.config;
    const lightColor = 0xfff8ee;

    const rows = [-depth / 4, 0, depth / 4];
    const cols = [-width / 4, 0, width / 4];

    rows.forEach(z => {
      cols.forEach(x => {
        // 灯带面板
        const barGeo = new THREE.BoxGeometry(2.5, 0.04, 0.25);
        this._geometries.push(barGeo);

        const barMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: lightColor,
          emissiveIntensity: 1.5,
          roughness: 0.1,
          metalness: 0.0,
          envMapIntensity: 0.2
        });
        this._trackedMaterials.push(barMat);

        const bar = new THREE.Mesh(barGeo, barMat);
        bar.position.set(x, height - 0.08, z);
        this.scene.add(bar);

        // 灯带边框
        const frameGeo = new THREE.EdgesGeometry(barGeo);
        this._geometries.push(frameGeo);
        const frameMat = new THREE.LineBasicMaterial({ color: 0xcccccc });
        this._trackedMaterials.push(frameMat);
        const frame = new THREE.LineSegments(frameGeo, frameMat);
        frame.position.copy(bar.position);
        this.scene.add(frame);

        // 点光源
        const light = new THREE.PointLight(lightColor, 0.4, 10);
        light.position.set(x, height - 0.3, z);
        this.scene.add(light);
      });
    });
  }

  createDecorations() {
    this.createEntrance();
    this.createExhibitionSigns();
    this.createReceptionDesk();
    this.createBenches();
    this.createPottedPlants();
    this.createWallSconces();
    this.createFloorAccents();
    this.createInfoKiosks();
  }

  createEntrance() {
    const { width, height, depth } = this.config;

    // 门框
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x6b8db5, roughness: 0.25, metalness: 0.75, envMapIntensity: 0.8
    });
    this._trackedMaterials.push(frameMat);

    const pillarGeo = new THREE.BoxGeometry(0.15, height, 0.3);
    this._geometries.push(pillarGeo);
    const lp = new THREE.Mesh(pillarGeo, frameMat);
    lp.position.set(-1.8, height / 2, depth / 2);
    this.scene.add(lp);
    const rp = new THREE.Mesh(pillarGeo, frameMat);
    rp.position.set(1.8, height / 2, depth / 2);
    this.scene.add(rp);

    const lintelGeo = new THREE.BoxGeometry(3.8, 0.2, 0.3);
    this._geometries.push(lintelGeo);
    const lintel = new THREE.Mesh(lintelGeo, frameMat);
    lintel.position.set(0, height - 0.1, depth / 2);
    this.scene.add(lintel);

    // 玻璃门
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xaaddee,
      roughness: 0.05,
      metalness: 0.0,
      transparent: true,
      opacity: 0.2,
      transmission: 0.8,
      thickness: 0.01,
      envMapIntensity: 1.5
    });
    this._trackedMaterials.push(glassMat);
    const glassGeo = new THREE.PlaneGeometry(3.5, height - 0.3);
    this._geometries.push(glassGeo);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, height / 2, depth / 2 + 0.05);
    this.scene.add(glass);

    // 门把手
    const handleMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd, roughness: 0.15, metalness: 0.9, envMapIntensity: 1.2
    });
    this._trackedMaterials.push(handleMat);
    const hGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
    this._geometries.push(hGeo);
    const hL = new THREE.Mesh(hGeo, handleMat);
    hL.position.set(-0.3, 1.3, depth / 2 + 0.1);
    this.scene.add(hL);
    const hR = new THREE.Mesh(hGeo, handleMat);
    hR.position.set(0.3, 1.3, depth / 2 + 0.1);
    this.scene.add(hR);

    // 招牌
    this.createTextSprite('数据安全服务展厅', {
      x: 0, y: height - 0.5, z: depth / 2 + 0.2, size: 0.7, color: '#1a365d'
    });

    // 地垫
    const matGeo = new THREE.PlaneGeometry(3, 1.2);
    this._geometries.push(matGeo);
    const matMat = new THREE.MeshStandardMaterial({
      color: 0x3a5a7c, roughness: 0.95, metalness: 0.0
    });
    this._trackedMaterials.push(matMat);
    const doorMat = new THREE.Mesh(matGeo, matMat);
    doorMat.rotation.x = -Math.PI / 2;
    doorMat.position.set(0, 0.015, depth / 2 - 0.5);
    this.scene.add(doorMat);
  }

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
        x: sign.position[0], y: sign.position[1], z: sign.position[2],
        size: 0.45, color: '#1a365d'
      });
    });
  }

  /**
   * 前台接待台 — 木质台面 + 深色台身
   */
  createReceptionDesk() {
    const { depth } = this.config;
    const y = depth / 2 - 3;

    // 台面（木质）
    const topGeo = new THREE.BoxGeometry(3.5, 0.08, 0.9);
    this._geometries.push(topGeo);
    const top = new THREE.Mesh(topGeo, this.materials.wood);
    top.position.set(0, 1.1, y);
    top.castShadow = true;
    this.scene.add(top);

    // 台身
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2c3e50, roughness: 0.55, metalness: 0.15, envMapIntensity: 0.4
    });
    this._trackedMaterials.push(bodyMat);
    const bodyGeo = new THREE.BoxGeometry(3.3, 1.0, 0.7);
    this._geometries.push(bodyGeo);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0.5, y);
    body.castShadow = true;
    this.scene.add(body);

    // 台面挡板
    const panelGeo = new THREE.BoxGeometry(3.5, 0.3, 0.04);
    this._geometries.push(panelGeo);
    const panel = new THREE.Mesh(panelGeo, bodyMat);
    panel.position.set(0, 1.3, y + 0.35);
    this.scene.add(panel);

    // 标识
    this.createTextSprite('接待处', {
      x: 0, y: 1.6, z: y, size: 0.25, color: '#1a365d'
    });

    // 台面装饰物（花瓶）
    const vaseGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.3, 12);
    this._geometries.push(vaseGeo);
    const vaseMat = new THREE.MeshStandardMaterial({
      color: 0x6b8db5, roughness: 0.3, metalness: 0.4, envMapIntensity: 0.7
    });
    this._trackedMaterials.push(vaseMat);
    const vase = new THREE.Mesh(vaseGeo, vaseMat);
    vase.position.set(1.2, 1.3, y);
    this.scene.add(vase);
  }

  createBenches() {
    const seatMat = new THREE.MeshStandardMaterial({
      color: 0x5b7fa5, roughness: 0.45, metalness: 0.2, envMapIntensity: 0.5
    });
    this._trackedMaterials.push(seatMat);
    const legMat = this.materials.edgeGlow;

    const positions = [{ x: -8, z: 6 }, { x: 8, z: 6 }, { x: 0, z: -6 }];

    positions.forEach(pos => {
      const seatGeo = new THREE.BoxGeometry(2, 0.08, 0.5);
      this._geometries.push(seatGeo);
      const seat = new THREE.Mesh(seatGeo, seatMat);
      seat.position.set(pos.x, 0.5, pos.z);
      seat.castShadow = true;
      this.scene.add(seat);

      const legGeo = new THREE.BoxGeometry(0.05, 0.5, 0.05);
      this._geometries.push(legGeo);
      [[-0.9, -0.2], [-0.9, 0.2], [0.9, -0.2], [0.9, 0.2]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(legGeo, legMat);
        leg.position.set(pos.x + lx, 0.25, pos.z + lz);
        this.scene.add(leg);
      });
    });
  }

  createPottedPlants() {
    const potMat = new THREE.MeshStandardMaterial({
      color: 0x8b6f47, roughness: 0.85, metalness: 0.0, envMapIntensity: 0.2
    });
    this._trackedMaterials.push(potMat);
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x3a7a3a, roughness: 0.8, metalness: 0.0, envMapIntensity: 0.15
    });
    this._trackedMaterials.push(leafMat);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x5a4a3a, roughness: 0.9, metalness: 0.0
    });
    this._trackedMaterials.push(trunkMat);

    const positions = [
      { x: -12, z: -12 }, { x: 12, z: -12 },
      { x: -12, z: 12 }, { x: 12, z: 12 },
      { x: -5, z: 0 }, { x: 5, z: 0 }
    ];

    positions.forEach(pos => {
      const potGeo = new THREE.CylinderGeometry(0.25, 0.2, 0.4, 12);
      this._geometries.push(potGeo);
      const pot = new THREE.Mesh(potGeo, potMat);
      pot.position.set(pos.x, 0.2, pos.z);
      this.scene.add(pot);

      const trunkGeo = new THREE.CylinderGeometry(0.05, 0.07, 1.0, 8);
      this._geometries.push(trunkGeo);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(pos.x, 0.9, pos.z);
      this.scene.add(trunk);

      const crownGeo = new THREE.SphereGeometry(0.5, 12, 10);
      this._geometries.push(crownGeo);
      const crown = new THREE.Mesh(crownGeo, leafMat);
      crown.position.set(pos.x, 1.7, pos.z);
      crown.castShadow = true;
      this.scene.add(crown);
    });
  }

  createWallSconces() {
    const { width, depth } = this.config;
    const sconceMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc, roughness: 0.25, metalness: 0.8, envMapIntensity: 1.0
    });
    this._trackedMaterials.push(sconceMat);
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0xfff5e6, roughness: 0.5, metalness: 0.0,
      emissive: 0xfff5e6, emissiveIntensity: 0.4
    });
    this._trackedMaterials.push(shadeMat);

    const positions = [
      { x: -8, z: -depth / 2 + 0.2, ry: 0 },
      { x: 8, z: -depth / 2 + 0.2, ry: 0 },
      { x: -width / 2 + 0.2, z: -8, ry: Math.PI / 2 },
      { x: -width / 2 + 0.2, z: 8, ry: Math.PI / 2 },
      { x: width / 2 - 0.2, z: -8, ry: -Math.PI / 2 },
      { x: width / 2 - 0.2, z: 8, ry: -Math.PI / 2 }
    ];

    positions.forEach(pos => {
      const baseGeo = new THREE.BoxGeometry(0.15, 0.15, 0.08);
      this._geometries.push(baseGeo);
      const base = new THREE.Mesh(baseGeo, sconceMat);
      base.position.set(pos.x, 2.2, pos.z);
      this.scene.add(base);

      const shadeGeo = new THREE.SphereGeometry(0.12, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      this._geometries.push(shadeGeo);
      const shade = new THREE.Mesh(shadeGeo, shadeMat);
      shade.position.set(pos.x, 2.3, pos.z);
      this.scene.add(shade);

      const light = new THREE.PointLight(0xfff0dd, 0.25, 5);
      light.position.set(pos.x, 2.2, pos.z);
      this.scene.add(light);
    });
  }

  /**
   * 信息展示柱
   */
  createInfoKiosks() {
    const { width, depth } = this.config;
    const kioskMat = new THREE.MeshStandardMaterial({
      color: 0x2c3e50, roughness: 0.4, metalness: 0.3, envMapIntensity: 0.6
    });
    this._trackedMaterials.push(kioskMat);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x1a365d, roughness: 0.2, metalness: 0.1,
      emissive: 0x1a365d, emissiveIntensity: 0.3
    });
    this._trackedMaterials.push(screenMat);

    const positions = [
      { x: -5, z: -depth / 2 + 1.5 },
      { x: 5, z: -depth / 2 + 1.5 }
    ];

    positions.forEach(pos => {
      // 柱身
      const pillarGeo = new THREE.BoxGeometry(0.4, 2.0, 0.3);
      this._geometries.push(pillarGeo);
      const pillar = new THREE.Mesh(pillarGeo, kioskMat);
      pillar.position.set(pos.x, 1.0, pos.z);
      pillar.castShadow = true;
      this.scene.add(pillar);

      // 屏幕
      const screenGeo = new THREE.PlaneGeometry(0.6, 0.4);
      this._geometries.push(screenGeo);
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(pos.x, 1.8, pos.z + 0.16);
      this.scene.add(screen);

      // 底座
      const baseGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.1, 16);
      this._geometries.push(baseGeo);
      const base = new THREE.Mesh(baseGeo, this.materials.edgeGlow);
      base.position.set(pos.x, 0.05, pos.z);
      this.scene.add(base);
    });
  }

  createFloorAccents() {
    const { width, depth } = this.config;
    const lineMat = new THREE.MeshStandardMaterial({
      color: 0x8b9dc3, roughness: 0.35, metalness: 0.4, envMapIntensity: 0.6
    });
    this._trackedMaterials.push(lineMat);

    // 中心十字装饰线
    [{ sx: 0.05, sy: 0.015, sz: depth, px: 0, pz: 0 },
     { sx: width, sy: 0.015, sz: 0.05, px: 0, pz: 0 }
    ].forEach(({ sx, sy, sz, px, pz }) => {
      const geo = new THREE.BoxGeometry(sx, sy, sz);
      this._geometries.push(geo);
      const line = new THREE.Mesh(geo, lineMat);
      line.position.set(px, 0.01, pz);
      this.scene.add(line);
    });
  }

  createTextSprite(text, options) {
    const { x, y, z, size = 1, color = '#2c3e50' } = options;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    context.fillStyle = 'rgba(255, 255, 255, 0.88)';
    context.beginPath();
    context.roundRect(0, 0, canvas.width, canvas.height, 10);
    context.fill();

    // 边框
    context.strokeStyle = 'rgba(139, 157, 195, 0.4)';
    context.lineWidth = 2;
    context.stroke();

    context.font = 'Bold 48px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    this._textures.push(texture);

    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(size * 4, size, 1);
    this.scene.add(sprite);
    return sprite;
  }

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
      color: 0x88bbdd, size: 0.04, transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    this._trackedMaterials.push(material);

    this.particles = new THREE.Points(geometry, material);
    this.particles.userData.velocities = velocities;
    this.scene.add(this.particles);
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
    if (!contentData || !contentData.exhibitions) return;
    contentData.exhibitions.forEach(exhibition => this.createExhibitionZone(exhibition));
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

    const boardGeo = new THREE.BoxGeometry(2.5, 3.5, 0.1);
    this._geometries.push(boardGeo);
    const board = new THREE.Mesh(boardGeo, this.materials.panel);
    board.position.set(x, 1.75, -0.05);
    board.castShadow = true;
    board.receiveShadow = true;
    panelGroup.add(board);

    const borderGeo = new THREE.EdgesGeometry(boardGeo);
    this._geometries.push(borderGeo);
    const borderMat = new THREE.LineBasicMaterial({ color: 0x8b9dc3, transparent: true, opacity: 0.5 });
    this._trackedMaterials.push(borderMat);
    const border = new THREE.LineSegments(borderGeo, borderMat);
    border.position.copy(board.position);
    panelGroup.add(border);

    this.createTextSprite(title, { x, y: 3.8, z: 0, size: 0.3, color: '#1a365d' });
    this.createTextSprite(this.getTypeIcon(type), { x, y: 2.5, z: 0.1, size: 0.5, color: '#2c3e50' });

    const hitboxGeo = new THREE.BoxGeometry(2.5, 3.5, 0.5);
    this._geometries.push(hitboxGeo);
    const hitboxMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide });
    this._trackedMaterials.push(hitboxMat);
    const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
    hitbox.position.set(x, 1.75, 0.2);
    hitbox.userData = panelGroup.userData;
    panelGroup.add(hitbox);

    return panelGroup;
  }

  getTypeIcon(type) {
    const icons = { document: '📄', image: '🖼️', video: '🎬', chart: '📊', model3d: '🧊' };
    return icons[type] || '📋';
  }

  highlightPanel(panel) {
    if (!panel) return;
    panel.children.forEach(child => {
      if (child.isMesh && child.material === this.materials.panel) child.material = this.materials.panelHover;
    });
  }

  unhighlightPanel(panel) {
    if (!panel) return;
    panel.children.forEach(child => {
      if (child.isMesh && child.material === this.materials.panelHover) child.material = this.materials.panel;
    });
  }

  getPanels() { return this.panels; }
  getExhibition(id) { return this.exhibitions.find(ex => ex.userData.id === id); }

  dispose() {
    this._textures.forEach(t => { if (t) t.dispose(); });
    this._textures = [];
    this._geometries.forEach(g => { if (g) g.dispose(); });
    this._geometries = [];
    this._trackedMaterials.forEach(m => { if (m) m.dispose(); });
    this._trackedMaterials = [];
    Object.values(this.materials).forEach(m => { if (m) m.dispose(); });
    if (this.particles) { this.scene.remove(this.particles); this.particles = null; }
    console.log('展厅资源已清理');
  }
}
