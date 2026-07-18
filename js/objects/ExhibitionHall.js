import * as THREE from 'three';
import { THEME } from '../config.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector';
import { HUDLabel, ICON_MAP } from './HUDLabel.js';

/**
 * 展厅模型
 * 视觉风格：深蓝赛博 Cyber Blue
 * 技术：Reflector 镜面反射 + 发光网格 + 玻璃数据屏 + 环境动效
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
      panelHover: null,
      edgeGlow: null,
      edgeDark: null,
    };

    this._textures = [];
    this._geometries = [];
    this._trackedMaterials = [];
    this._ceilingBars = [];
    this._gridHelper = null;
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
   * 创建程序纹理
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

  // ===== Slice 3: 科技空间骨架 =====

  initMaterials() {
    // 地面：深色石纹 + 微反射
    const floorTex = this.createProceduralTexture(512, 512, (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#1a2840'); bg.addColorStop(1, '#1e2e48');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      // 石纹纹理
      for (let i = 0; i < 80; i++) {
        ctx.beginPath(); ctx.strokeStyle = `rgba(60,80,110,${0.08 + Math.random() * 0.12})`;
        ctx.lineWidth = 0.5 + Math.random() * 2;
        let x = Math.random() * w, y = Math.random() * h;
        ctx.moveTo(x, y);
        for (let j = 0; j < 5; j++) { x += (Math.random() - 0.5) * 100; y += (Math.random() - 0.5) * 100; ctx.lineTo(x, y); }
        ctx.stroke();
      }
      // 网格线
      ctx.strokeStyle = 'rgba(0,210,255,0.06)'; ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    });
    floorTex.repeat.set(8, 8);
    this.materials.floor = new THREE.MeshStandardMaterial({
      map: floorTex, color: THEME.floor.color, roughness: THEME.floor.roughness,
      metalness: THEME.floor.metalness, envMapIntensity: THEME.floor.envMapIntensity
    });

    // 墙面：暗纹面板 + 嵌入线条
    const wallTex = this.createProceduralTexture(512, 512, (ctx, w, h) => {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#223850'); bg.addColorStop(0.5, '#2a4468'); bg.addColorStop(1, '#1e3050');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
      // 面板分割线
      ctx.strokeStyle = 'rgba(0,210,255,0.12)'; ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, w - 40, h - 40);
      ctx.strokeStyle = 'rgba(0,210,255,0.06)'; ctx.lineWidth = 1;
      const panelH = h / 4;
      for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(20, i * panelH); ctx.lineTo(w - 20, i * panelH); ctx.stroke(); }
      // 细微噪点
      for (let i = 0; i < 1500; i++) {
        const px = Math.random() * w, py = Math.random() * h;
        ctx.fillStyle = `rgba(80,110,150,${0.03 + Math.random() * 0.05})`;
        ctx.fillRect(px, py, 1, 1);
      }
    });
    wallTex.repeat.set(4, 2);
    this.materials.wall = new THREE.MeshStandardMaterial({
      map: wallTex, color: THEME.wall.color, roughness: THEME.wall.roughness,
      metalness: THEME.wall.metalness, envMapIntensity: THEME.wall.envMapIntensity
    });

    // 天花板：方格面板
    const ceilTex = this.createProceduralTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#253a58'; ctx.fillRect(0, 0, w, h);
      // 方格线
      ctx.strokeStyle = 'rgba(0,210,255,0.1)'; ctx.lineWidth = 2;
      const tileSize = w / 4;
      for (let x = 0; x <= w; x += tileSize) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y <= h; y += tileSize) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      // 面板中心微光点
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const cx = (i + 0.5) * tileSize, cy = (j + 0.5) * tileSize;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, tileSize * 0.3);
        grad.addColorStop(0, 'rgba(0,210,255,0.08)'); grad.addColorStop(1, 'rgba(0,210,255,0)');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      }
    });
    ceilTex.repeat.set(4, 4);
    this.materials.ceiling = new THREE.MeshStandardMaterial({
      map: ceilTex, color: THEME.surfaceMid, roughness: 0.7, metalness: 0.1, envMapIntensity: 0.3
    });
    // 展板：半透明玻璃数据屏（Slice 5 细化）
    this.materials.panel = new THREE.MeshPhysicalMaterial({
      color: 0x0a1628, roughness: 0.1, metalness: 0.0,
      transparent: true, opacity: 0.55, transmission: 0.4, thickness: 0.2,
      emissive: THEME.neon, emissiveIntensity: 0.15, envMapIntensity: 0.8, ior: 1.4
    });
    this.materials.panelHover = new THREE.MeshPhysicalMaterial({
      color: 0x0a1628, roughness: 0.1, metalness: 0.0,
      transparent: true, opacity: 0.7, transmission: 0.3,
      emissive: THEME.neon, emissiveIntensity: 0.5, envMapIntensity: 0.8, ior: 1.4
    });
    // 发光金属条（线框/边框/发光条）
    this.materials.edgeGlow = new THREE.MeshStandardMaterial({
      color: THEME.neon, roughness: 0.3, metalness: 0.6,
      emissive: THEME.neon, emissiveIntensity: 0.8, envMapIntensity: 0.5
    });
    // 暗色结构金属
    this.materials.edgeDark = new THREE.MeshStandardMaterial({
      color: 0x1a2436, roughness: 0.5, metalness: 0.7, envMapIntensity: 0.4
    });
  }

  createFloor() {
    const { width, depth } = this.config;
    // 深色镜面地面（普通 MeshStandardMaterial，不用 Reflector）
    const floorGeo = new THREE.PlaneGeometry(width, depth);
    this._geometries.push(floorGeo);
    this.floor = new THREE.Mesh(floorGeo, this.materials.floor);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = 0;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);
    // 发光网格线
    const grid = new THREE.GridHelper(Math.max(width, depth), 40, THEME.neon, 0x152030);
    if (grid.material) {
      if (Array.isArray(grid.material)) grid.material.forEach(m => { m.transparent = true; m.opacity = 0.35; });
      else { grid.material.transparent = true; grid.material.opacity = 0.35; }
    }
    grid.position.y = 0.012;
    this.scene.add(grid);
    this._gridHelper = grid;
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
    wallConfigs.forEach(c => this.walls.push(this.createWall(c)));
  }

  createWall(config) {
    const { size, position, rotation } = config;
    const h = size[1];
    const geometry = new THREE.BoxGeometry(...size);
    this._geometries.push(geometry);
    const wall = new THREE.Mesh(geometry, this.materials.wall);
    wall.position.set(...position);
    wall.rotation.set(...rotation);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.scene.add(wall);
    // 顶部嵌入式发光条
    const isLongX = size[0] >= size[2];
    const stripGeo = new THREE.BoxGeometry(isLongX ? size[0] : 0.06, 0.04, isLongX ? 0.06 : size[2]);
    this._geometries.push(stripGeo);
    const strip = new THREE.Mesh(stripGeo, this.materials.edgeGlow);
    strip.position.set(position[0], h - 0.08, position[2]);
    this.scene.add(strip);
    // 底部发光踢脚线
    const baseGeo = new THREE.BoxGeometry(isLongX ? size[0] : 0.04, 0.03, isLongX ? 0.04 : size[2]);
    this._geometries.push(baseGeo);
    const base = new THREE.Mesh(baseGeo, this.materials.edgeGlow);
    base.position.set(position[0], 0.03, position[2]);
    this.scene.add(base);
    return wall;
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
    const lightColor = 0xfff8ee;  // 白色日光灯
    const rows = [-depth / 4, 0, depth / 4];
    const cols = [-width / 4, 0, width / 4];
    rows.forEach(z => cols.forEach(x => {
      const barGeo = new THREE.BoxGeometry(2.5, 0.04, 0.25);
      this._geometries.push(barGeo);
      const barMat = new THREE.MeshStandardMaterial({
        color: 0xffffff, emissive: lightColor, emissiveIntensity: 1.5,
        roughness: 0.1, metalness: 0.0
      });
      this._trackedMaterials.push(barMat);
      this._ceilingBars.push(barMat);
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(x, height - 0.08, z);
      this.scene.add(bar);
      const light = new THREE.PointLight(lightColor, 0.4, 12);
      light.position.set(x, height - 0.3, z);
      this.scene.add(light);
    }));
  }

  // ===== Slice 4: 移除家具 + 中央装置 =====

  createDecorations() {
    this.createEntrance();
    this.createExhibitionSigns();
    this.createFloorAccents();
  }

  createEntrance() {
    const { width, height, depth } = this.config;
    const frameMat = this.materials.edgeGlow;
    const pillarGeo = new THREE.BoxGeometry(0.15, height, 0.3);
    this._geometries.push(pillarGeo);
    const lp = new THREE.Mesh(pillarGeo, frameMat);
    lp.position.set(-1.8, height / 2, depth / 2);
    this.scene.add(lp);
    const rp = new THREE.Mesh(pillarGeo, frameMat);
    rp.position.set(1.8, height / 2, depth / 2);
    this.scene.add(rp);
    const lintelGeo = new THREE.BoxGeometry(3.8, 0.15, 0.3);
    this._geometries.push(lintelGeo);
    const lintel = new THREE.Mesh(lintelGeo, frameMat);
    lintel.position.set(0, height - 0.08, depth / 2);
    this.scene.add(lintel);
    const veilGeo = new THREE.PlaneGeometry(3.5, height - 0.3);
    this._geometries.push(veilGeo);
    const veilMat = new THREE.MeshBasicMaterial({
      color: THEME.neon, transparent: true, opacity: 0.08,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
    });
    this._trackedMaterials.push(veilMat);
    const veil = new THREE.Mesh(veilGeo, veilMat);
    veil.position.set(0, height / 2, depth / 2 + 0.05);
    this.scene.add(veil);
  }

  createFloorAccents() {
    const { width, depth } = this.config;
    const lineMat = this.materials.edgeGlow;
    [{ sx: 0.04, sy: 0.012, sz: depth, px: 0, pz: 0 },
     { sx: width, sy: 0.012, sz: 0.04, px: 0, pz: 0 }
    ].forEach(({ sx, sy, sz, px, pz }) => {
      const geo = new THREE.BoxGeometry(sx, sy, sz);
      this._geometries.push(geo);
      const line = new THREE.Mesh(geo, lineMat);
      line.position.set(px, 0.013, pz);
      this.scene.add(line);
    });
  }

  // ===== Slice 5: HUD 标签 + 展板科技化 =====

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
        size: 0.45
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

  createPanel(panelData, index, total) {
    const { id, type, title, description, tags, thumbnail, contentUrl } = panelData;
    const panelGroup = new THREE.Group();
    panelGroup.userData = { id, type, title, description, tags, thumbnail, contentUrl, isPanel: true };
    const spacing = 3;
    const startX = -(total - 1) * spacing / 2;
    const x = startX + index * spacing;
    const boardGeo = new THREE.BoxGeometry(2.5, 3.5, 0.1);
    this._geometries.push(boardGeo);
    const board = new THREE.Mesh(boardGeo, this.materials.panel);
    board.position.set(x, 1.75, -0.05);
    board.castShadow = true;
    board.receiveShadow = true;
    board.userData.isBoard = true;
    panelGroup.add(board);
    const borderGeo = new THREE.EdgesGeometry(boardGeo);
    this._geometries.push(borderGeo);
    const borderMat = new THREE.LineBasicMaterial({ color: THEME.neon, transparent: true, opacity: 0.8 });
    this._trackedMaterials.push(borderMat);
    const border = new THREE.LineSegments(borderGeo, borderMat);
    border.position.copy(board.position);
    panelGroup.add(border);
    this.applyPanelSurface(board, panelData);
    const titleLabel = HUDLabel.createLabel(title, { size: 0.32, icon: ICON_MAP[type] || 'shield' });
    titleLabel.position.set(x, 3.8, 0);
    this.scene.add(titleLabel);
    this._trackedMaterials.push(titleLabel.material);
    if (titleLabel.material.map) this._textures.push(titleLabel.material.map);
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

  applyPanelSurface(board, panelData) {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 720;
    const ctx = canvas.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 720);
    g.addColorStop(0, '#0a1628'); g.addColorStop(1, '#050d1f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 720);
    ctx.strokeStyle = 'rgba(0,210,255,0.5)'; ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, 496, 704);
    ctx.fillStyle = 'rgba(0,210,255,0.15)'; ctx.fillRect(8, 8, 496, 60);
    ctx.fillStyle = '#00d2ff'; ctx.font = 'bold 28px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('// ' + (panelData.type || 'data').toUpperCase(), 30, 38);
    ctx.strokeStyle = 'rgba(0,210,255,0.4)'; ctx.lineWidth = 2;
    ctx.strokeRect(60, 110, 392, 320);
    ctx.fillStyle = 'rgba(0,210,255,0.5)'; ctx.font = '24px monospace'; ctx.textAlign = 'center';
    ctx.fillText('[ DATA PREVIEW ]', 256, 270);
    ctx.fillStyle = '#cdeeff'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(this.truncate(panelData.title, 16), 40, 490);
    ctx.fillStyle = '#00d2ff'; ctx.font = '22px monospace';
    (panelData.tags || []).slice(0, 3).forEach((t, i) => {
      ctx.fillText('#' + t, 40, 540 + i * 32);
    });
    const tex = new THREE.CanvasTexture(canvas);
    this._textures.push(tex);
    board.material = new THREE.MeshStandardMaterial({
      map: tex, transparent: true, opacity: 0.92,
      emissive: THEME.neon, emissiveIntensity: 0.1, emissiveMap: tex,
      roughness: 0.3, metalness: 0.1, envMapIntensity: 0.5
    });
    this._trackedMaterials.push(board.material);
  }

  truncate(s, n) { return s && s.length > n ? s.slice(0, n) + '…' : (s || ''); }

  highlightPanel(panel) {
    if (!panel) return;
    panel.children.forEach(child => {
      if (child.userData && child.userData.isBoard && child.material) child.material.emissiveIntensity = 0.6;
    });
  }

  unhighlightPanel(panel) {
    if (!panel) return;
    panel.children.forEach(child => {
      if (child.userData && child.userData.isBoard && child.material) child.material.emissiveIntensity = 0.1;
    });
  }

  // ===== Slice 6: 环境动效系统 =====

  createEntranceParticles() {
    const particleCount = 350;
    const spread = 6;
    const depth = this.config.depth;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * spread;
      positions[i3 + 1] = 0.5 + Math.random() * 6;
      positions[i3 + 2] = (depth / 2) - 2 + (Math.random() - 0.5) * spread;
      velocities[i3] = (Math.random() - 0.5) * 0.008;
      velocities[i3 + 1] = Math.random() * 0.02 + 0.008;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.008;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this._geometries.push(geometry);
    const material = new THREE.PointsMaterial({
      color: THEME.neon, size: 0.05, transparent: true, opacity: 0.7,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    this._trackedMaterials.push(material);
    this.particles = new THREE.Points(geometry, material);
    this.particles.userData.velocities = velocities;
    this.scene.add(this.particles);
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
          positions[i3 + 1] = 0.5;
          positions[i3] = (Math.random() - 0.5) * 6;
          positions[i3 + 2] = (this.config.depth / 2) - 2 + (Math.random() - 0.5) * 6;
        }
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
    this.updateAmbience(elapsed || 0);
  }

  updateAmbience(elapsed) {
    // 网格流光
    if (this._gridHelper && this._gridHelper.material) {
      const m = this._gridHelper.material;
      const pulse = 0.25 + Math.sin(elapsed * 1.2) * 0.15;
      if (Array.isArray(m)) m.forEach(x => x.opacity = pulse);
      else m.opacity = pulse;
    }
    // 灯带呼吸
    if (this._ceilingBars) {
      const bp = 0.7 + Math.sin(elapsed * 2) * 0.3;
      this._ceilingBars.forEach(mat => { if (mat) mat.emissiveIntensity = 1.2 + bp; });
    }
    // 展板悬浮
    if (this.exhibitions) {
      this.exhibitions.forEach((zone, i) => {
        const baseY = zone.userData._baseY || 0;
        zone.position.y = baseY + Math.sin(elapsed * 0.6 + i) * 0.04;
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

    this.createTextSprite(name, {
      x: 0, y: 3.2, z: 0, size: 0.6
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
    if (this.floor && this.floor.dispose) this.floor.dispose();
    if (this._gridHelper) { this._gridHelper.geometry.dispose(); this._gridHelper.material.dispose(); }
    console.log('展厅资源已清理');
  }
}
