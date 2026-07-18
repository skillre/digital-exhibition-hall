import * as THREE from 'three';
import { THEME } from '../config.js';
import { HUDLabel, ICON_MAP } from './HUDLabel.js';

/**
 * 展厅模型
 * 视觉风格：深色科技沉浸 + 数字化悬浮元素
 * 空间：深色墙面带纹理、深色石材地面带网格、深色天花板、踢脚线/顶线
 * 数字：发光展板、数据粒子、HUD 标签、区域标识
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
      floor: null, wall: null, ceiling: null,
      panel: null, panelHover: null,
      trim: null, baseboard: null, edgeGlow: null, edgeDark: null,
    };
    this._textures = [];
    this._geometries = [];
    this._trackedMaterials = [];
    this._ceilingBars = [];
  }

  create(scene) {
    this.scene = scene;
    this.initMaterials();
    this.createFloor();
    this.createWalls();
    this.createCeiling();
    this.createDecorations();
    this.createZoneStructures();
    this.createFloorGrid();
    this.createEntranceParticles();
    console.log('展厅创建完成');
  }

  createProceduralTexture(width, height, drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    drawFn(ctx, width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this._textures.push(texture);
    return texture;
  }

  // ===== 真实材质 =====

  initMaterials() {
    const M = THEME.material;

    // ── 建筑面：统一走「受光」PBR（明亮科技）──
    // 地面带网格纹理
    const floorTex = this.createProceduralTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#1a2838'; ctx.fillRect(0, 0, w, h);
      // 亮色网格线
      ctx.strokeStyle = 'rgba(42, 63, 90, 0.9)'; ctx.lineWidth = 1;
      for (let i = 0; i <= w; i += 32) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
      for (let j = 0; j <= h; j += 32) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(w, j); ctx.stroke(); }
      // 噪点（更亮）
      for (let k = 0; k < 2000; k++) {
        const x = Math.random() * w, y = Math.random() * h;
        ctx.fillStyle = `rgba(30, 45, 66, ${Math.random() * 0.3})`;
        ctx.fillRect(x, y, 1, 1);
      }
    });
    floorTex.repeat.set(8, 8);
    this.materials.floor = new THREE.MeshStandardMaterial({
      map: floorTex, color: THEME.floor, roughness: M.floor.roughness,
      metalness: M.floor.metalness, envMapIntensity: M.floor.envMapIntensity
    });

    // 墙面带微弱纹理
    const wallTex = this.createProceduralTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#1e2d42'; ctx.fillRect(0, 0, w, h);
      // 水平细线纹理
      ctx.strokeStyle = 'rgba(30, 45, 66, 0.4)'; ctx.lineWidth = 0.5;
      for (let i = 0; i <= h; i += 8) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }
      // 噪点
      for (let k = 0; k < 1000; k++) {
        const x = Math.random() * w, y = Math.random() * h;
        ctx.fillStyle = `rgba(25, 38, 55, ${Math.random() * 0.2})`;
        ctx.fillRect(x, y, 1, 1);
      }
    });
    wallTex.repeat.set(4, 2);
    this.materials.wall = new THREE.MeshStandardMaterial({
      map: wallTex, color: THEME.wall, roughness: M.wall.roughness,
      metalness: M.wall.metalness, envMapIntensity: M.wall.envMapIntensity
    });

    this.materials.ceiling = new THREE.MeshStandardMaterial({
      color: THEME.ceiling, roughness: M.ceiling.roughness,
      metalness: M.ceiling.metalness, envMapIntensity: M.ceiling.envMapIntensity
    });

    // 踢脚线 / 顶线 — 蓝灰金属（更亮）
    this.materials.baseboard = new THREE.MeshStandardMaterial({
      color: 0x2a3f5a, roughness: 0.4, metalness: 0.3
    });
    this.materials.trim = new THREE.MeshStandardMaterial({
      color: 0x2a3f5a, roughness: 0.4, metalness: 0.3
    });

    // ── 展板：发光玻璃数据屏（增强发光）──
    this.materials.panel = new THREE.MeshPhysicalMaterial({
      color: 0x1e2d42, roughness: 0.1, metalness: 0.0,
      transparent: true, opacity: 0.92, envMapIntensity: 0.8,
      emissive: 0x0a1a30, emissiveIntensity: 0.3
    });
    this.materials.panelHover = new THREE.MeshPhysicalMaterial({
      color: 0x1e2d42, roughness: 0.1, metalness: 0.0,
      transparent: true, opacity: 0.96, envMapIntensity: 0.8,
      emissive: 0x0a84ff, emissiveIntensity: 0.6
    });

    // ── 自发光元素：双色科技点缀 ──
    this.materials.edgeGlow = new THREE.MeshStandardMaterial({
      color: THEME.accent, roughness: 0.3, metalness: 0.4,
      emissive: THEME.accent, emissiveIntensity: 1.2, envMapIntensity: 0.5
    });
    this.materials.edgeDark = new THREE.MeshStandardMaterial({
      color: 0x2a3f5a, roughness: 0.4, metalness: 0.25, envMapIntensity: 0.4
    });
    // 青绿色发光材质（第二强调色）
    this.materials.cyanGlow = new THREE.MeshBasicMaterial({
      color: THEME.cyan, transparent: true, opacity: 0.4
    });
    this._trackedMaterials.push(this.materials.cyanGlow);
  }

  // ===== 真实建筑 =====

  createFloor() {
    const { width, depth } = this.config;
    const floorGeo = new THREE.PlaneGeometry(width, depth);
    this._geometries.push(floorGeo);
    this.floor = new THREE.Mesh(floorGeo, this.materials.floor);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = 0;
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
      { size: [wallThickness, height, depth], position: [width / 2, height / 2, 0], rotation: [0, 0, 0] },
    ];
    wallConfigs.forEach(c => {
      this.walls.push(this.createWallMesh(c));
      this.createBaseboard(c);
      this.createCrownMolding(c);
      this.createWallAccentStrip(c);
    });
  }

  createWallMesh(config) {
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

  createBaseboard(wallConfig) {
    const { size, position } = wallConfig;
    const isLongX = size[0] >= size[2];
    const len = isLongX ? size[0] : size[2];
    const baseGeo = new THREE.BoxGeometry(isLongX ? len : 0.25, 0.35, isLongX ? 0.25 : len);
    this._geometries.push(baseGeo);
    const base = new THREE.Mesh(baseGeo, this.materials.baseboard);
    if (isLongX) {
      base.position.set(position[0], 0.175, position[2]);
    } else {
      base.position.set(position[0], 0.175, position[2]);
      base.rotation.y = Math.PI / 2;
    }
    base.castShadow = true;
    this.scene.add(base);
  }

  createCrownMolding(wallConfig) {
    const { size, position } = wallConfig;
    const isLongX = size[0] >= size[2];
    const len = isLongX ? size[0] : size[2];
    const moldGeo = new THREE.BoxGeometry(isLongX ? len : 0.2, 0.25, isLongX ? 0.2 : len);
    this._geometries.push(moldGeo);
    const mold = new THREE.Mesh(moldGeo, this.materials.trim);
    if (isLongX) {
      mold.position.set(position[0], size[1] - 0.125, position[2]);
    } else {
      mold.position.set(position[0], size[1] - 0.125, position[2]);
      mold.rotation.y = Math.PI / 2;
    }
    this.scene.add(mold);
  }

  /**
   * 墙面蓝色发光装饰条（水平LED灯带）
   */
  createWallAccentStrip(wallConfig) {
    const { size, position } = wallConfig;
    const isLongX = size[0] >= size[2];
    const len = isLongX ? size[0] : size[2];
    if (len < 5) return;

    // 中间高度的蓝色LED灯带
    const stripGeo = new THREE.BoxGeometry(isLongX ? len * 0.85 : 0.04, 0.05, isLongX ? 0.04 : len * 0.85);
    this._geometries.push(stripGeo);
    const stripMat = new THREE.MeshBasicMaterial({
      color: THEME.accent, transparent: true, opacity: 0.5
    });
    this._trackedMaterials.push(stripMat);
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(position[0], size[1] * 0.45, position[2]);
    this.scene.add(strip);
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
    const rows = [-depth / 4, 0, depth / 4];
    const cols = [-width / 4, 0, width / 4];
    rows.forEach(z => cols.forEach(x => {
      // 蓝色LED灯带（在天花板上，更亮）
      const barGeo = new THREE.BoxGeometry(3, 0.04, 0.25);
      this._geometries.push(barGeo);
      const barMat = new THREE.MeshBasicMaterial({
        color: 0x4ac0ff, transparent: true, opacity: 0.8
      });
      this._trackedMaterials.push(barMat);
      this._ceilingBars.push(barMat);
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(x, height - 0.04, z);
      this.scene.add(bar);
    }));
  }

  // ===== 数字化元素（叠加在真实空间上）=====

  createDecorations() {
    this.createEntrance();
    this.createExhibitionSigns();
    this.createFloorAccents();
  }

  createEntrance() {
    const { width, height, depth } = this.config;
    // 入口门框 — 发光蓝色（更亮）
    const frameMat = new THREE.MeshBasicMaterial({ color: 0x2a3f5a });
    const pillarGeo = new THREE.BoxGeometry(0.22, height, 0.35);
    this._geometries.push(pillarGeo);
    const lp = new THREE.Mesh(pillarGeo, frameMat);
    lp.position.set(-2.2, height / 2, depth / 2);
    this.scene.add(lp);
    const rp = new THREE.Mesh(pillarGeo, frameMat);
    rp.position.set(2.2, height / 2, depth / 2);
    this.scene.add(rp);
    const lintelGeo = new THREE.BoxGeometry(4.6, 0.2, 0.35);
    this._geometries.push(lintelGeo);
    const lintel = new THREE.Mesh(lintelGeo, frameMat);
    lintel.position.set(0, height - 0.1, depth / 2);
    this.scene.add(lintel);
    // 蓝色发光横条（更亮）
    const glowGeo = new THREE.BoxGeometry(4.6, 0.05, 0.38);
    this._geometries.push(glowGeo);
    const glowMat = new THREE.MeshBasicMaterial({ color: THEME.accent, transparent: true, opacity: 0.7 });
    this._trackedMaterials.push(glowMat);
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(0, height - 0.02, depth / 2);
    this.scene.add(glow);

    // 入口地面蓝色引导条（更亮）
    const guideGeo = new THREE.BoxGeometry(1.5, 0.02, 8);
    this._geometries.push(guideGeo);
    const guideMat = new THREE.MeshBasicMaterial({ color: THEME.accent, transparent: true, opacity: 0.25 });
    this._trackedMaterials.push(guideMat);
    const guide = new THREE.Mesh(guideGeo, guideMat);
    guide.position.set(0, 0.01, depth / 2 - 4);
    this.scene.add(guide);
  }

  createFloorAccents() {
    const { width, depth } = this.config;
    // 蓝色LED边线（沿墙根，更亮）
    const blueMat = new THREE.MeshBasicMaterial({ color: THEME.accent, transparent: true, opacity: 0.35 });
    this._trackedMaterials.push(blueMat);
    const wallDist = 0.3;
    [
      { x: 0, z: -depth/2 + wallDist, sx: width, sz: 0.04 },
      { x: 0, z: depth/2 - wallDist, sx: width, sz: 0.04 },
      { x: -width/2 + wallDist, z: 0, sx: 0.04, sz: depth },
      { x: width/2 - wallDist, z: 0, sx: 0.04, sz: depth },
    ].forEach(({ x, z, sx, sz }) => {
      const geo = new THREE.BoxGeometry(sx, 0.02, sz);
      this._geometries.push(geo);
      const line = new THREE.Mesh(geo, blueMat);
      line.position.set(x, 0.01, z);
      this.scene.add(line);
    });

    // 中心十字引导线（蓝 + 青双色）
    const crossMat = new THREE.MeshBasicMaterial({ color: THEME.accent, transparent: true, opacity: 0.18 });
    this._trackedMaterials.push(crossMat);
    const crossH = new THREE.BoxGeometry(width * 0.6, 0.015, 0.05);
    this._geometries.push(crossH);
    const ch = new THREE.Mesh(crossH, crossMat);
    ch.position.set(0, 0.008, 0);
    this.scene.add(ch);
    const crossV = new THREE.BoxGeometry(0.05, 0.015, depth * 0.6);
    this._geometries.push(crossV);
    const cv = new THREE.Mesh(crossV, crossMat);
    cv.position.set(0, 0.008, 0);
    this.scene.add(cv);
  }

  /**
   * 地面网格（大面积装饰，打破空白）
   */
  createFloorGrid() {
    const { width, depth } = this.config;
    const gridMat = new THREE.MeshBasicMaterial({ color: THEME.floorGrid, transparent: true, opacity: 0.2 });
    this._trackedMaterials.push(gridMat);

    // 横线
    for (let z = -depth / 2 + 2; z <= depth / 2 - 2; z += 4) {
      const geo = new THREE.BoxGeometry(width - 4, 0.008, 0.02);
      this._geometries.push(geo);
      const line = new THREE.Mesh(geo, gridMat);
      line.position.set(0, 0.004, z);
      this.scene.add(line);
    }
    // 竖线
    for (let x = -width / 2 + 2; x <= width / 2 - 2; x += 4) {
      const geo = new THREE.BoxGeometry(0.02, 0.008, depth - 4);
      this._geometries.push(geo);
      const line = new THREE.Mesh(geo, gridMat);
      line.position.set(x, 0.004, 0);
      this.scene.add(line);
    }
  }

  createExhibitionSigns() {
    const { width, depth } = this.config;
    const signs = [
      { text: '服务方案', position: [-11, 3.5, -3] },
      { text: '案例成果', position: [11, 3.5, -3] },
      { text: '培训教育', position: [-3, 3.5, -11] },
      { text: '技术文档', position: [-3, 3.5, 11] }
    ];
    signs.forEach(sign => {
      this.createTextSprite(sign.text, {
        x: sign.position[0], y: sign.position[1], z: sign.position[2],
        size: 0.6
      });
    });
  }

  createTextSprite(text, options) {
    const { x, y, z, size = 1 } = options;
    const sprite = HUDLabel.createLabel(text, { size });
    sprite.position.set(x, y, z);
    if (sprite.material && sprite.material.map) this._textures.push(sprite.material.map);
    this._trackedMaterials.push(sprite.material);
    this.scene.add(sprite);
    return sprite;
  }

  /**
   * 创建展区结构（柱子、围合、地面标识）
   */
  createZoneStructures() {
    const zones = [
      { id: 'plans', x: -11, z: 0, label: '服务方案' },
      { id: 'cases', x: 11, z: 0, label: '案例成果' },
      { id: 'training', x: 0, z: -11, label: '培训教育' },
      { id: 'docs', x: 0, z: 11, label: '技术文档' },
    ];

    zones.forEach(zone => {
      this.createZoneBoundary(zone.x, zone.z, zone.label);
    });
  }

  /**
   * 为每个展区创建边界柱子和地面标识
   */
  createZoneBoundary(cx, cz, label) {
    const { height } = this.config;
    const pillarSize = 0.25;
    const spread = 5;

    // 四角柱子
    const corners = [
      { x: cx - spread / 2, z: cz - spread / 2 },
      { x: cx + spread / 2, z: cz - spread / 2 },
      { x: cx - spread / 2, z: cz + spread / 2 },
      { x: cx + spread / 2, z: cz + spread / 2 },
    ];

    corners.forEach(corner => {
      // 柱子主体（更亮）
      const pGeo = new THREE.BoxGeometry(pillarSize, height * 0.95, pillarSize);
      this._geometries.push(pGeo);
      const pMat = new THREE.MeshStandardMaterial({
        color: 0x2a3f5a, roughness: 0.5, metalness: 0.2
      });
      this._trackedMaterials.push(pMat);
      const pillar = new THREE.Mesh(pGeo, pMat);
      pillar.position.set(corner.x, height * 0.475, corner.z);
      pillar.castShadow = true;
      this.scene.add(pillar);
      this.walls.push(pillar);

      // 柱子顶部蓝色发光帽（更亮）
      const capGeo = new THREE.BoxGeometry(pillarSize + 0.08, 0.1, pillarSize + 0.08);
      this._geometries.push(capGeo);
      const capMat = new THREE.MeshBasicMaterial({ color: THEME.accent, transparent: true, opacity: 0.7 });
      this._trackedMaterials.push(capMat);
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(corner.x, height * 0.95, corner.z);
      this.scene.add(cap);

      // 柱子底部青绿色发光底座（双色）
      const baseGeo = new THREE.BoxGeometry(pillarSize + 0.08, 0.1, pillarSize + 0.08);
      this._geometries.push(baseGeo);
      const baseMat = new THREE.MeshBasicMaterial({ color: THEME.cyan, transparent: true, opacity: 0.4 });
      this._trackedMaterials.push(baseMat);
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.set(corner.x, 0.04, corner.z);
      this.scene.add(base);
    });

    // 地面区域标识（蓝色发光矩形框，更亮）
    const borderSize = spread + 0.5;
    const borderMat = new THREE.MeshBasicMaterial({ color: THEME.accent, transparent: true, opacity: 0.2 });
    this._trackedMaterials.push(borderMat);
    const bw = 0.06;
    [
      { x: cx, z: cz - borderSize / 2, sx: borderSize, sz: bw },
      { x: cx, z: cz + borderSize / 2, sx: borderSize, sz: bw },
      { x: cx - borderSize / 2, z: cz, sx: bw, sz: borderSize },
      { x: cx + borderSize / 2, z: cz, sx: bw, sz: borderSize },
    ].forEach(({ x, z, sx, sz }) => {
      const geo = new THREE.BoxGeometry(sx, 0.015, sz);
      this._geometries.push(geo);
      const line = new THREE.Mesh(geo, borderMat);
      line.position.set(x, 0.008, z);
      this.scene.add(line);
    });

    // 展区之间的引导路径（青绿色，更亮）
    const pathMat = new THREE.MeshBasicMaterial({ color: THEME.cyan, transparent: true, opacity: 0.12 });
    this._trackedMaterials.push(pathMat);
    const pathLen = Math.sqrt(cx * cx + cz * cz) - 3;
    if (pathLen > 2) {
      const pathGeo = new THREE.BoxGeometry(0.8, 0.01, pathLen);
      this._geometries.push(pathGeo);
      const path = new THREE.Mesh(pathGeo, pathMat);
      path.position.set(cx / 2, 0.005, cz / 2);
      if (Math.abs(cx) > Math.abs(cz)) path.rotation.y = Math.PI / 2;
      this.scene.add(path);
    }
  }

  // 展板 — 发光悬浮屏
  createPanel(panelData, index, total) {
    const { id, type, title, description, tags, thumbnail, contentUrl } = panelData;
    const panelGroup = new THREE.Group();
    panelGroup.userData = { id, type, title, description, tags, thumbnail, contentUrl, isPanel: true };

    const spacing = 3.2;
    const startX = -(total - 1) * spacing / 2;
    const x = startX + index * spacing;

    // 展板主体 — 更大尺寸
    const boardGeo = new THREE.BoxGeometry(2.8, 4, 0.12);
    this._geometries.push(boardGeo);
    const board = new THREE.Mesh(boardGeo, this.materials.panel);
    board.position.set(x, 2, -0.06);
    board.castShadow = true;
    board.receiveShadow = true;
    board.userData.isBoard = true;
    panelGroup.add(board);

    // 蓝色发光边框（更亮）
    const borderGeo = new THREE.EdgesGeometry(boardGeo);
    this._geometries.push(borderGeo);
    const borderMat = new THREE.LineBasicMaterial({ color: THEME.accent, transparent: true, opacity: 0.9 });
    this._trackedMaterials.push(borderMat);
    const border = new THREE.LineSegments(borderGeo, borderMat);
    border.position.copy(board.position);
    panelGroup.add(border);

    // 背光面板（增强可见度 + 青绿色光晕）
    const backGeo = new THREE.BoxGeometry(3.1, 4.3, 0.03);
    this._geometries.push(backGeo);
    const backMat = new THREE.MeshBasicMaterial({
      color: THEME.accent, transparent: true, opacity: 0.1
    });
    this._trackedMaterials.push(backMat);
    const back = new THREE.Mesh(backGeo, backMat);
    back.position.set(x, 2, -0.15);
    panelGroup.add(back);

    // 青绿色第二层背光（增加视觉深度）
    const back2Geo = new THREE.BoxGeometry(3.3, 4.5, 0.02);
    this._geometries.push(back2Geo);
    const back2Mat = new THREE.MeshBasicMaterial({
      color: THEME.cyan, transparent: true, opacity: 0.04
    });
    this._trackedMaterials.push(back2Mat);
    const back2 = new THREE.Mesh(back2Geo, back2Mat);
    back2.position.set(x, 2, -0.2);
    panelGroup.add(back2);

    this.applyPanelSurface(board, panelData);

    // 标题标签（更大更亮）
    const titleLabel = HUDLabel.createLabel(title, { size: 0.4, icon: ICON_MAP[type] || 'shield' });
    titleLabel.position.set(x, 4.3, 0.1);
    this.scene.add(titleLabel);
    this._trackedMaterials.push(titleLabel.material);
    if (titleLabel.material.map) this._textures.push(titleLabel.material.map);

    // 碰撞检测用不可见hitbox
    const hitboxGeo = new THREE.BoxGeometry(2.8, 4, 0.6);
    this._geometries.push(hitboxGeo);
    const hitboxMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide });
    this._trackedMaterials.push(hitboxMat);
    const hitbox = new THREE.Mesh(hitboxGeo, hitboxMat);
    hitbox.position.set(x, 2, 0.25);
    hitbox.userData = panelGroup.userData;
    panelGroup.add(hitbox);

    return panelGroup;
  }

  applyPanelSurface(board, panelData) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 720;
    const ctx = canvas.getContext('2d');
    // 明亮深色底
    ctx.fillStyle = '#14202e'; ctx.fillRect(0, 0, 512, 720);
    // 渐变背景（蓝到青）
    const bgGrad = ctx.createLinearGradient(0, 0, 512, 720);
    bgGrad.addColorStop(0, 'rgba(10,132,255,0.08)');
    bgGrad.addColorStop(1, 'rgba(0,212,170,0.04)');
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, 512, 720);
    // 蓝色发光边框（更亮）
    ctx.strokeStyle = '#0a84ff'; ctx.lineWidth = 3;
    ctx.shadowColor = '#0a84ff'; ctx.shadowBlur = 16;
    ctx.strokeRect(10, 10, 492, 700);
    ctx.shadowBlur = 0;
    // 青绿色内边框
    ctx.strokeStyle = 'rgba(0,212,170,0.3)'; ctx.lineWidth = 1;
    ctx.strokeRect(16, 16, 480, 688);
    // 上方色条（渐变）
    const topGrad = ctx.createLinearGradient(10, 10, 502, 10);
    topGrad.addColorStop(0, 'rgba(10,132,255,0.2)');
    topGrad.addColorStop(1, 'rgba(0,212,170,0.1)');
    ctx.fillStyle = topGrad; ctx.fillRect(10, 10, 492, 60);
    ctx.fillStyle = '#4ac0ff'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#0a84ff'; ctx.shadowBlur = 8;
    ctx.fillText((panelData.type || 'data').toUpperCase(), 30, 42);
    ctx.shadowBlur = 0;
    // 预览框（更亮）
    ctx.strokeStyle = 'rgba(10,132,255,0.5)'; ctx.lineWidth = 1;
    ctx.strokeRect(50, 110, 412, 320);
    ctx.fillStyle = '#1a2a3e'; ctx.fillRect(51, 111, 410, 318);
    // 预览框内装饰线
    ctx.strokeStyle = 'rgba(10,132,255,0.2)'; ctx.lineWidth = 0.5;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath(); ctx.moveTo(51, 111 + i * 40); ctx.lineTo(461, 111 + i * 40); ctx.stroke();
    }
    // 垂直装饰线
    for (let i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(51 + i * 103, 111); ctx.lineTo(51 + i * 103, 429); ctx.stroke();
    }
    ctx.fillStyle = '#4ac0ff'; ctx.font = '22px monospace'; ctx.textAlign = 'center';
    ctx.shadowColor = '#0a84ff'; ctx.shadowBlur = 10;
    ctx.fillText('[ DATA PREVIEW ]', 256, 275);
    ctx.shadowBlur = 0;
    // 标题
    ctx.fillStyle = '#f0f4fa'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(this.truncate(panelData.title, 14), 40, 500);
    // 描述
    ctx.fillStyle = '#8a9cb5'; ctx.font = '20px sans-serif';
    ctx.fillText(this.truncate(panelData.description || '', 20), 40, 545);
    // 标签（蓝到青渐变）
    ctx.font = '18px sans-serif';
    (panelData.tags || []).slice(0, 3).forEach((t, i) => {
      ctx.fillStyle = i % 2 === 0 ? '#4ac0ff' : '#00d4aa';
      ctx.shadowColor = i % 2 === 0 ? '#0a84ff' : '#00d4aa'; ctx.shadowBlur = 4;
      ctx.fillText('#' + t, 40, 590 + i * 30);
    });
    ctx.shadowBlur = 0;
    // 底部装饰条（渐变）
    const bottomGrad = ctx.createLinearGradient(10, 680, 502, 680);
    bottomGrad.addColorStop(0, 'rgba(10,132,255,0.25)');
    bottomGrad.addColorStop(1, 'rgba(0,212,170,0.15)');
    ctx.fillStyle = bottomGrad; ctx.fillRect(10, 680, 492, 30);

    const tex = new THREE.CanvasTexture(canvas);
    this._textures.push(tex);
    board.material = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.2, metalness: 0.05, envMapIntensity: 0.4,
      emissive: 0x0a1a30, emissiveIntensity: 0.15
    });
    this._trackedMaterials.push(board.material);
  }

  truncate(s, n) { return s && s.length > n ? s.slice(0, n) + '…' : (s || ''); }

  highlightPanel(panel) {
    if (!panel) return;
    panel.children.forEach(child => {
      if (child.userData && child.userData.isBoard && child.material) {
        child.material.emissiveIntensity = 0.5;
        child.material.emissive.set(0x0a84ff);
      }
    });
  }

  unhighlightPanel(panel) {
    if (!panel) return;
    panel.children.forEach(child => {
      if (child.userData && child.userData.isBoard && child.material) {
        child.material.emissiveIntensity = 0.15;
        child.material.emissive.set(0x0a1a30);
      }
    });
  }

  // ===== 数据粒子 + 动效 =====

  createEntranceParticles() {
    const particleCount = 200;
    const spread = 6;
    const depth = this.config.depth;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // 分布在整个展厅空间
      positions[i3] = (Math.random() - 0.5) * this.config.width * 0.8;
      positions[i3 + 1] = 0.3 + Math.random() * (this.config.height - 1);
      positions[i3 + 2] = (Math.random() - 0.5) * this.config.depth * 0.8;
      velocities[i3] = (Math.random() - 0.5) * 0.003;
      velocities[i3 + 1] = Math.random() * 0.01 + 0.003;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.003;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this._geometries.push(geometry);
    const material = new THREE.PointsMaterial({
      color: THEME.accent, size: 0.06, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    this._trackedMaterials.push(material);
    this.particles = new THREE.Points(geometry, material);
    this.particles.userData.velocities = velocities;
    this.scene.add(this.particles);

    // 额外：中心区域密集粒子环
    this.createCenterParticleRing();
  }

  /**
   * 中心区域密集蓝色粒子环
   */
  createCenterParticleRing() {
    const count = 300;
    const radius = 3;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = radius + (Math.random() - 0.5) * 0.8;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = 0.1 + Math.random() * 0.4;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this._geometries.push(geo);
    const mat = new THREE.PointsMaterial({
      color: THEME.accent, size: 0.07, transparent: true, opacity: 0.4,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    this._trackedMaterials.push(mat);
    const ring = new THREE.Points(geo, mat);
    ring.userData.isCenterRing = true;
    this.scene.add(ring);
    this._centerRing = ring;
  }

  updateParticles(elapsed) {
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      const velocities = this.particles.userData.velocities;
      const count = positions.length / 3;
      const topY = this.config.height;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        positions[i3] += velocities[i3];
        positions[i3 + 1] += velocities[i3 + 1];
        positions[i3 + 2] += velocities[i3 + 2];
        if (positions[i3 + 1] > topY) {
          positions[i3 + 1] = 0.3;
          positions[i3] = (Math.random() - 0.5) * this.config.width * 0.8;
          positions[i3 + 2] = (Math.random() - 0.5) * this.config.depth * 0.8;
        }
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // 中心粒子环旋转
    if (this._centerRing) {
      this._centerRing.rotation.y = elapsed * 0.15;
    }

    this.updateAmbience(elapsed || 0);
  }

  updateAmbience(elapsed) {
    // 灯光微呼吸
    if (this._ceilingBars) {
      const bp = 0.08 * Math.sin(elapsed * 1.5);
      this._ceilingBars.forEach(mat => { if (mat) mat.opacity = 0.5 + bp; });
    }
    // 展板悬浮微动
    if (this.exhibitions) {
      this.exhibitions.forEach((zone, i) => {
        const baseY = zone.userData._baseY || 0;
        zone.position.y = baseY + Math.sin(elapsed * 0.6 + i) * 0.03;
      });
    }
  }

  // ===== 数据加载 =====

  loadContent(contentData) {
    if (!contentData || !contentData.exhibitions) return;
    contentData.exhibitions.forEach(exhibition => this.createExhibitionZone(exhibition));
    console.log('展示内容加载完成');
  }

  createExhibitionZone(exhibition) {
    const { id, name, description, position, panels } = exhibition;
    const zone = new THREE.Group();
    zone.position.set(position.x, position.y, position.z);
    zone.userData = { id, name, description, _baseY: position.y };
    this.createTextSprite(name, { x: 0, y: 3.5, z: 0, size: 0.7 });
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
    if (this._centerRing) { this.scene.remove(this._centerRing); this._centerRing = null; }
    console.log('展厅资源已清理');
  }
}
