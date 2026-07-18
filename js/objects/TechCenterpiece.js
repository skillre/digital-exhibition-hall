import * as THREE from 'three';
import { THEME } from '../config.js';

/**
 * 中央标志装置 — 盾牌全息 + 数据流粒子环
 * 象征"防护屏障"，数据安全主题视觉锚点
 * 增强版：更亮、更大、更多粒子
 */
export class TechCenterpiece {
  constructor() {
    this.group = new THREE.Group();
    this.shield = null;
    this.particleRing = null;
    this._coreMesh = null;
    this._baseRing = null;
    this._rings = [];
    this._materials = [];
    this._geometries = [];
    this._lastElapsed = 0;
  }

  create(scene, position = { x: 0, y: 3.5, z: 0 }) {
    this.scene = scene;
    this._baseY = position.y;
    this.group.position.set(position.x, position.y, position.z);
    this.createShield();
    this.createParticleRing();
    this.createBaseRing();
    this.createOrbitRings();
    this.createVerticalBeam();
    scene.add(this.group);
    console.log('中央装置创建完成');
  }

  createShield() {
    const shape = new THREE.Shape();
    shape.moveTo(0, 1.5); shape.lineTo(1.05, 1.05); shape.lineTo(1.05, -0.2);
    shape.quadraticCurveTo(1.05, -1.05, 0, -1.55);
    shape.quadraticCurveTo(-1.05, -1.05, -1.05, -0.2);
    shape.lineTo(-1.05, 1.05); shape.lineTo(0, 1.5);
    const geo = new THREE.ShapeGeometry(shape);
    this._geometries.push(geo);

    // 盾牌填充（半透明蓝色）
    const mat = new THREE.MeshBasicMaterial({
      color: THEME.accent, transparent: true, opacity: 0.12,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
    });
    this._materials.push(mat);
    this.shield = new THREE.Mesh(geo, mat);
    this.group.add(this.shield);

    // 盾牌边缘发光
    const edges = new THREE.EdgesGeometry(geo);
    this._geometries.push(edges);
    const lineMat = new THREE.LineBasicMaterial({ color: THEME.accent, transparent: true, opacity: 0.8 });
    this._materials.push(lineMat);
    this.shield.add(new THREE.LineSegments(edges, lineMat));

    // 核心球体（线框）
    const coreGeo = new THREE.IcosahedronGeometry(0.4, 1);
    this._geometries.push(coreGeo);
    const coreMat = new THREE.MeshBasicMaterial({
      color: THEME.accentDim, wireframe: true, transparent: true, opacity: 0.8
    });
    this._materials.push(coreMat);
    this._coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.shield.add(this._coreMesh);

    // 内部实心发光球
    const innerGeo = new THREE.SphereGeometry(0.15, 16, 16);
    this._geometries.push(innerGeo);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x4ac0ff, transparent: true, opacity: 0.6
    });
    this._materials.push(innerMat);
    const inner = new THREE.Mesh(innerGeo, innerMat);
    this.shield.add(inner);
  }

  createParticleRing() {
    const count = 800;
    const radius = 2.8;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = radius + (Math.random() - 0.5) * 0.5;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this._geometries.push(geo);
    const mat = new THREE.PointsMaterial({
      color: THEME.accent, size: 0.06, transparent: true, opacity: 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    this._materials.push(mat);
    this.particleRing = new THREE.Points(geo, mat);
    this.group.add(this.particleRing);
  }

  createBaseRing() {
    const ringGeo = new THREE.TorusGeometry(2.8, 0.04, 8, 80);
    this._geometries.push(ringGeo);
    const ringMat = new THREE.MeshBasicMaterial({
      color: THEME.accent, transparent: true, opacity: 0.3
    });
    this._materials.push(ringMat);
    this._baseRing = new THREE.Mesh(ringGeo, ringMat);
    this._baseRing.rotation.x = Math.PI / 2;
    this._baseRing.position.y = -1.6;
    this.group.add(this._baseRing);
  }

  /**
   * 额外轨道环（增强视觉层次）
   */
  createOrbitRings() {
    const radii = [1.8, 3.5];
    radii.forEach((r, i) => {
      const geo = new THREE.TorusGeometry(r, 0.02, 8, 64);
      this._geometries.push(geo);
      const mat = new THREE.MeshBasicMaterial({
        color: THEME.accentDim, transparent: true, opacity: 0.15 + i * 0.05
      });
      this._materials.push(mat);
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = Math.PI / 2 + (i * 0.3);
      ring.position.y = -0.5 + i * 0.8;
      this.group.add(ring);
      this._rings.push(ring);
    });
  }

  /**
   * 垂直光束（从底部到顶部）
   */
  createVerticalBeam() {
    const beamGeo = new THREE.CylinderGeometry(0.025, 0.025, 5, 8);
    this._geometries.push(beamGeo);
    const beamMat = new THREE.MeshBasicMaterial({
      color: THEME.accent, transparent: true, opacity: 0.2,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    this._materials.push(beamMat);
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 0;
    this.group.add(beam);
  }

  update(elapsed) {
    const delta = this._lastElapsed ? Math.min(elapsed - this._lastElapsed, 0.1) : 0.016;
    this._lastElapsed = elapsed;

    if (this.particleRing) this.particleRing.rotation.y += delta * 0.25;

    if (this.shield) {
      const pulse = 0.5 + Math.sin(elapsed * 1.2) * 0.3;
      this.shield.material.opacity = 0.2 + pulse * 0.25;
    }

    if (this._coreMesh) {
      this._coreMesh.rotation.y += delta * 0.4;
      this._coreMesh.rotation.x += delta * 0.15;
    }

    // 轨道环旋转
    this._rings.forEach((ring, i) => {
      ring.rotation.z = elapsed * (0.2 + i * 0.1) * (i % 2 === 0 ? 1 : -1);
    });

    this.group.position.y = this._baseY + Math.sin(elapsed * 0.6) * 0.2;
  }

  dispose() {
    this._geometries.forEach(g => g && g.dispose());
    this._materials.forEach(m => m && m.dispose());
    if (this.scene) this.scene.remove(this.group);
  }
}
