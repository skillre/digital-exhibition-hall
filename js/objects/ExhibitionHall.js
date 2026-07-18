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
    // 纯色材质（不用程序纹理，确保颜色可见）
    this.materials.floor = new THREE.MeshStandardMaterial({
      color: 0x0c1a30, roughness: 0.2, metalness: 0.3, envMapIntensity: 0.8
    });

    this.materials.wall = new THREE.MeshStandardMaterial({
      color: 0xd0dce8, roughness: 0.85, metalness: 0.0, envMapIntensity: 0.2
    });

    this.materials.ceiling = new THREE.MeshStandardMaterial({
      color: 0xdce6f0, roughness: 0.85, metalness: 0.0, envMapIntensity: 0.1
    });

    // 踢脚线/顶线 — 蓝色
    this.materials.baseboard = new THREE.MeshStandardMaterial({
      color: 0x0066cc, roughness: 0.3, metalness: 0.4, envMapIntensity: 0.5
    });
    this.materials.trim = new THREE.MeshStandardMaterial({
      color: 0x0055bb, roughness: 0.3, metalness: 0.4, envMapIntensity: 0.5
    });

    // 展板：半透明玻璃数据屏（数字化元素）
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
    // 青色发光金属（数字化元素）
    this.materials.edgeGlow = new THREE.MeshStandardMaterial({
      color: THEME.neon, roughness: 0.3, metalness: 0.6,
      emissive: THEME.neon, emissiveIntensity: 0.8, envMapIntensity: 0.5
    });
    this.materials.edgeDark = new THREE.MeshStandardMaterial({
      color: 0x2a2820, roughness: 0.5, metalness: 0.7, envMapIntensity: 0.4
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
      this.createWallBlueStrip(c); // 科技蓝装饰条
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

  createWallBlueStrip(wallConfig) {
    const { size, position } = wallConfig;
    const isLongX = size[0] >= size[2];
    const len = isLongX ? size[0] : size[2];
    // 墙面中间蓝色发光条
    const stripGeo = new THREE.BoxGeometry(isLongX ? len - 0.2 : 0.08, 0.06, isLongX ? 0.08 : len - 0.2);
    this._geometries.push(stripGeo);
    const stripMat = new THREE.MeshStandardMaterial({
      color: 0x00a0ff, roughness: 0.2, metalness: 0.5,
      emissive: 0x00a0ff, emissiveIntensity: 0.5
    });
    this._trackedMaterials.push(stripMat);
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(position[0], size[1] * 0.35, position[2]);
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
    const lightColor = 0xeef4ff;
    const rows = [-depth / 4, 0, depth / 4];
    const cols = [-width / 4, 0, width / 4];
    rows.forEach(z => cols.forEach(x => {
      // 嵌入式灯框
      const frameGeo = new THREE.BoxGeometry(3.0, 0.1, 0.4);
      this._geometries.push(frameGeo);
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0xe8e4dc, roughness: 0.6, metalness: 0.3, envMapIntensity: 0.3
      });
      this._trackedMaterials.push(frameMat);
      const frame = new THREE.Mesh(frameGeo, frameMat);
      frame.position.set(x, height - 0.05, z);
      this.scene.add(frame);
      // 灯面板（发光面）
      const panelGeo = new THREE.BoxGeometry(2.8, 0.04, 0.2);
      this._geometries.push(panelGeo);
      const panelMat = new THREE.MeshStandardMaterial({
        color: 0xffffff, emissive: lightColor, emissiveIntensity: 1.2,
        roughness: 0.1, metalness: 0.0
      });
      this._trackedMaterials.push(panelMat);
      this._ceilingBars.push(panelMat);
      const panel = new THREE.Mesh(panelGeo, panelMat);
      panel.position.set(x, height - 0.08, z);
      this.scene.add(panel);
      // 实际光源
      const light = new THREE.PointLight(lightColor, 0.6, 14);
      light.position.set(x, height - 0.3, z);
      this.scene.add(light);
    }));
  }

  // ===== 数字化元素（叠加在真实空间上）=====

  createDecorations() {
    this.createEntrance();
    this.createExhibitionSigns();
    this.createFloorAccents();
    this.createTechPillars();
  }

  createEntrance() {
    const { width, height, depth } = this.config;
    // 真实门框（白色木质）
    const frameMat = this.materials.trim;
    const pillarGeo = new THREE.BoxGeometry(0.2, height, 0.35);
    this._geometries.push(pillarGeo);
    const lp = new THREE.Mesh(pillarGeo, frameMat);
    lp.position.set(-2, height / 2, depth / 2);
    lp.castShadow = true;
    this.scene.add(lp);
    const rp = new THREE.Mesh(pillarGeo, frameMat);
    rp.position.set(2, height / 2, depth / 2);
    rp.castShadow = true;
    this.scene.add(rp);
    const lintelGeo = new THREE.BoxGeometry(4.2, 0.2, 0.35);
    this._geometries.push(lintelGeo);
    const lintel = new THREE.Mesh(lintelGeo, frameMat);
    lintel.position.set(0, height - 0.1, depth / 2);
    this.scene.add(lintel);
    // 数字化全息门帘（叠加在真实门框上）
    const veilGeo = new THREE.PlaneGeometry(3.8, height - 0.3);
    this._geometries.push(veilGeo);
    const veilMat = new THREE.MeshBasicMaterial({
      color: THEME.neon, transparent: true, opacity: 0.06,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
    });
    this._trackedMaterials.push(veilMat);
    const veil = new THREE.Mesh(veilGeo, veilMat);
    veil.position.set(0, height / 2, depth / 2 + 0.05);
    this.scene.add(veil);
  }

  createFloorAccents() {
    // 数字化地面引导线（青色细线）
    const { width, depth } = this.config;
    const lineMat = this.materials.edgeGlow;
    [{ sx: 0.03, sy: 0.008, sz: depth, px: 0, pz: 0 },
     { sx: width, sy: 0.008, sz: 0.03, px: 0, pz: 0 }
    ].forEach(({ sx, sy, sz, px, pz }) => {
      const geo = new THREE.BoxGeometry(sx, sy, sz);
      this._geometries.push(geo);
      const line = new THREE.Mesh(geo, lineMat);
      line.position.set(px, 0.01, pz);
      this.scene.add(line);
    });
  }

  createTechPillars() {
    const { width, height, depth } = this.config;
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0xf0f4f8, roughness: 0.3, metalness: 0.2, envMapIntensity: 0.5
    });
    this._trackedMaterials.push(pillarMat);
    const pillarGlow = new THREE.MeshStandardMaterial({
      color: 0x00a0ff, roughness: 0.2, metalness: 0.6,
      emissive: 0x00a0ff, emissiveIntensity: 0.6
    });
    this._trackedMaterials.push(pillarGlow);
    const positions = [
      { x: -10, z: -10 }, { x: 10, z: -10 },
      { x: -10, z: 10 }, { x: 10, z: 10 }
    ];
    positions.forEach(pos => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.5, height, 0.5), pillarMat);
      pillar.position.set(pos.x, height / 2, pos.z);
      pillar.castShadow = true;
      this._geometries.push(pillar.geometry);
      this.scene.add(pillar);
      for (let y = 1; y < height - 0.5; y += 2) {
        const glowGeo = new THREE.BoxGeometry(0.06, 1.2, 0.52);
        this._geometries.push(glowGeo);
        const glow = new THREE.Mesh(glowGeo, pillarGlow);
        glow.position.set(pos.x + 0.28, y, pos.z);
        this.scene.add(glow);
        const glow2 = new THREE.Mesh(glowGeo, pillarGlow);
        glow2.position.set(pos.x - 0.28, y, pos.z);
        this.scene.add(glow2);
      }
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

  // ===== 数据粒子 + 动效 =====

  createEntranceParticles() {
    const particleCount = 200;
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
      color: THEME.neon, size: 0.05, transparent: true, opacity: 0.6,
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
