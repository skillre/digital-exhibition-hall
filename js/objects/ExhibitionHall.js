import * as THREE from 'three';
import { THEME } from '../config.js';
import { HUDLabel, ICON_MAP } from './HUDLabel.js';

/**
 * 展厅模型
 * 视觉风格：真实展厅物理空间 + 数字化悬浮元素
 * 空间：暖白墙面、深色石材地面、白色天花板、踢脚线/顶线/门框
 * 数字：悬浮全息展板、数据粒子、HUD 标签
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

    // ── 建筑面：统一走「受光」PBR，明度只由灯光+曝光控制 ──
    this.materials.floor = new THREE.MeshStandardMaterial({
      color: THEME.floor, roughness: M.floor.roughness,
      metalness: M.floor.metalness, envMapIntensity: M.floor.envMapIntensity
    });
    this.materials.wall = new THREE.MeshStandardMaterial({
      color: THEME.wall, roughness: M.wall.roughness,
      metalness: M.wall.metalness, envMapIntensity: M.wall.envMapIntensity
    });
    this.materials.ceiling = new THREE.MeshStandardMaterial({
      color: THEME.ceiling, roughness: M.ceiling.roughness,
      metalness: M.ceiling.metalness, envMapIntensity: M.ceiling.envMapIntensity
    });

    // 踢脚线 / 顶线 — 淡蓝灰分隔线（受光）
    this.materials.baseboard = new THREE.MeshStandardMaterial({
      color: 0xd0d7e0, roughness: 0.6, metalness: 0.1
    });
    this.materials.trim = new THREE.MeshStandardMaterial({
      color: 0xd0d7e0, roughness: 0.6, metalness: 0.1
    });

    // ── 展板：明亮玻璃数据屏（受光 + 微反射）──
    this.materials.panel = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.15, metalness: 0.0,
      transparent: true, opacity: 0.9, envMapIntensity: 0.8
    });
    this.materials.panelHover = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, roughness: 0.15, metalness: 0.0,
      transparent: true, opacity: 0.96, envMapIntensity: 0.8
    });

    // ── 自发光元素：不受灯光，用于蓝色科技点缀 ──
    this.materials.edgeGlow = new THREE.MeshStandardMaterial({
      color: THEME.accent, roughness: 0.3, metalness: 0.4,
      emissive: THEME.accent, emissiveIntensity: 0.6, envMapIntensity: 0.4
    });
    this.materials.edgeDark = new THREE.MeshStandardMaterial({
      color: 0xb8c2cf, roughness: 0.5, metalness: 0.2, envMapIntensity: 0.3
    });
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
      this.createWallPanels(c); // 墙面装饰面板
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
    const baseGeo = new THREE.BoxGeometry(isLongX ? len : 0.2, 0.3, isLongX ? 0.2 : len);
    this._geometries.push(baseGeo);
    const base = new THREE.Mesh(baseGeo, this.materials.baseboard);
    if (isLongX) {
      base.position.set(position[0], 0.15, position[2]);
    } else {
      base.position.set(position[0], 0.15, position[2]);
      base.rotation.y = Math.PI / 2;
    }
    base.castShadow = true;
    this.scene.add(base);
  }

  createCrownMolding(wallConfig) {
    const { size, position } = wallConfig;
    const isLongX = size[0] >= size[2];
    const len = isLongX ? size[0] : size[2];
    const moldGeo = new THREE.BoxGeometry(isLongX ? len : 0.15, 0.2, isLongX ? 0.15 : len);
    this._geometries.push(moldGeo);
    const mold = new THREE.Mesh(moldGeo, this.materials.trim);
    if (isLongX) {
      mold.position.set(position[0], size[1] - 0.1, position[2]);
    } else {
      mold.position.set(position[0], size[1] - 0.1, position[2]);
      mold.rotation.y = Math.PI / 2;
    }
    this.scene.add(mold);
  }

  createWallPanels(wallConfig) {
    const { size, position } = wallConfig;
    const isLongX = size[0] >= size[2];
    const len = isLongX ? size[0] : size[2];
    if (len < 5) return;
    const panelCount = Math.floor(len / 4);
    for (let i = 0; i < panelCount; i++) {
      const offset = -len/2 + 2 + i * (len / panelCount) + (len / panelCount) / 2;
      const px = isLongX ? position[0] + offset : position[0];
      const pz = isLongX ? position[2] : position[2] + offset;
      const panelW = isLongX ? (len / panelCount) * 0.55 : 0.02;
      const panelH = size[1] * 0.35;
      const panelD = isLongX ? 0.02 : (len / panelCount) * 0.55;
      const panelGeo = new THREE.BoxGeometry(panelW, panelH, panelD);
      this._geometries.push(panelGeo);
      const panelMat = new THREE.MeshStandardMaterial({ color: 0xd6dce6, roughness: 0.7, metalness: 0.05 });
      this._trackedMaterials.push(panelMat);
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(px, size[1] * 0.5, pz);
      this.scene.add(panel);
      // 白色LED发光边框
      const borderGeo = new THREE.EdgesGeometry(panelGeo);
      this._geometries.push(borderGeo);
      const borderMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
      this._trackedMaterials.push(borderMat);
      const border = new THREE.LineSegments(borderGeo, borderMat);
      border.position.copy(panel.position);
      this.scene.add(border);
    }
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
      // 白色LED灯带（在深色天花板上）
      const barGeo = new THREE.BoxGeometry(2.5, 0.02, 0.15);
      this._geometries.push(barGeo);
      const barMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
      this._trackedMaterials.push(barMat);
      this._ceilingBars.push(barMat);
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(x, height - 0.03, z);
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
    const frameMat = new THREE.MeshBasicMaterial({ color: 0x7aa8c8 });
    const pillarGeo = new THREE.BoxGeometry(0.18, height, 0.3);
    this._geometries.push(pillarGeo);
    const lp = new THREE.Mesh(pillarGeo, frameMat);
    lp.position.set(-2, height / 2, depth / 2);
    this.scene.add(lp);
    const rp = new THREE.Mesh(pillarGeo, frameMat);
    rp.position.set(2, height / 2, depth / 2);
    this.scene.add(rp);
    const lintelGeo = new THREE.BoxGeometry(4.2, 0.15, 0.3);
    this._geometries.push(lintelGeo);
    const lintel = new THREE.Mesh(lintelGeo, frameMat);
    lintel.position.set(0, height - 0.08, depth / 2);
    this.scene.add(lintel);
    // 蓝色发光横条
    const glowGeo = new THREE.BoxGeometry(4.2, 0.02, 0.32);
    this._geometries.push(glowGeo);
    const glowMat = new THREE.MeshBasicMaterial({ color: THEME.accent, transparent: true, opacity: 0.25 });
    this._trackedMaterials.push(glowMat);
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(0, height - 0.02, depth / 2);
    this.scene.add(glow);
  }

  createFloorAccents() {
    const { width, depth } = this.config;
    // 白色LED边线
    const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    this._trackedMaterials.push(whiteMat);
    const wallDist = 0.25;
    [
      { x: 0, z: -depth/2 + wallDist, sx: width, sz: 0.03 },
      { x: 0, z: depth/2 - wallDist, sx: width, sz: 0.03 },
      { x: -width/2 + wallDist, z: 0, sx: 0.03, sz: depth },
      { x: width/2 - wallDist, z: 0, sx: 0.03, sz: depth },
    ].forEach(({ x, z, sx, sz }) => {
      const geo = new THREE.BoxGeometry(sx, 0.015, sz);
      this._geometries.push(geo);
      const line = new THREE.Mesh(geo, whiteMat);
      line.position.set(x, 0.008, z);
      this.scene.add(line);
    });
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

  // 展板 — 悬浮全息屏
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
    const borderMat = new THREE.LineBasicMaterial({ color: THEME.accent, transparent: true, opacity: 0.5 });
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
    // 明亮白底
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 512, 720);
    // 蓝色细边框
    ctx.strokeStyle = '#0a84ff'; ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, 488, 696);
    // 上方色条
    ctx.fillStyle = 'rgba(10,132,255,0.12)'; ctx.fillRect(12, 12, 488, 56);
    ctx.fillStyle = '#0a84ff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText((panelData.type || 'data').toUpperCase(), 30, 40);
    // 预览框
    ctx.strokeStyle = '#0a84ff'; ctx.lineWidth = 1;
    ctx.strokeRect(60, 110, 392, 320);
    ctx.fillStyle = '#8fa8c0'; ctx.font = '20px monospace'; ctx.textAlign = 'center';
    ctx.fillText('[ DATA PREVIEW ]', 256, 270);
    // 标题
    ctx.fillStyle = '#1c2530'; ctx.font = 'bold 32px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(this.truncate(panelData.title, 16), 40, 490);
    // 标签
    ctx.fillStyle = '#0a84ff'; ctx.font = '20px sans-serif';
    (panelData.tags || []).slice(0, 3).forEach((t, i) => {
      ctx.fillText('#' + t, 40, 540 + i * 32);
    });
    const tex = new THREE.CanvasTexture(canvas);
    this._textures.push(tex);
    board.material = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.25, metalness: 0.05, envMapIntensity: 0.4
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

  // ===== 数据粒子 + 动效 =====

  createEntranceParticles() {
    const particleCount = 80;
    const spread = 4;
    const depth = this.config.depth;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * spread;
      positions[i3 + 1] = 0.5 + Math.random() * 6;
      positions[i3 + 2] = (depth / 2) - 2 + (Math.random() - 0.5) * spread;
      velocities[i3] = (Math.random() - 0.5) * 0.005;
      velocities[i3 + 1] = Math.random() * 0.015 + 0.005;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.005;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this._geometries.push(geometry);
    const material = new THREE.PointsMaterial({
      color: THEME.accent, size: 0.03, transparent: true, opacity: 0.15,
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
    // 灯光微呼吸（真实日光灯的细微变化）
    if (this._ceilingBars) {
      const bp = 0.05 * Math.sin(elapsed * 2);
      this._ceilingBars.forEach(mat => { if (mat) mat.emissiveIntensity = 1.2 + bp; });
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
    this.createTextSprite(name, { x: 0, y: 3.2, z: 0, size: 0.6 });
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
    console.log('展厅资源已清理');
  }
}
