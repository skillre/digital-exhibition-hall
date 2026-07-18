import * as THREE from 'three';
import { THEME } from '../config.js';

/**
 * 中央标志装置 — 盾牌全息 + 数据流粒子环
 * 象征"防护屏障"，数据安全主题视觉锚点
 */
export class TechCenterpiece {
  constructor() {
    this.group = new THREE.Group();
    this.shield = null;
    this.particleRing = null;
    this._coreMesh = null;
    this._baseRing = null;
    this._materials = [];
    this._geometries = [];
    this._lastElapsed = 0;
  }

  create(scene, position = { x: 0, y: 3, z: 0 }) {
    this.scene = scene;
    this._baseY = position.y;
    this.group.position.set(position.x, position.y, position.z);
    this.createShield();
    this.createParticleRing();
    this.createBaseRing();
    scene.add(this.group);
    console.log('中央装置创建完成');
  }

  createShield() {
    const shape = new THREE.Shape();
    shape.moveTo(0, 1.2); shape.lineTo(0.85, 0.85); shape.lineTo(0.85, -0.15);
    shape.quadraticCurveTo(0.85, -0.85, 0, -1.25);
    shape.quadraticCurveTo(-0.85, -0.85, -0.85, -0.15);
    shape.lineTo(-0.85, 0.85); shape.lineTo(0, 1.2);
    const geo = new THREE.ShapeGeometry(shape);
    this._geometries.push(geo);
    const mat = new THREE.MeshBasicMaterial({
      color: THEME.neon, transparent: true, opacity: 0.22,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
    });
    this._materials.push(mat);
    this.shield = new THREE.Mesh(geo, mat);
    this.group.add(this.shield);
    const edges = new THREE.EdgesGeometry(geo);
    this._geometries.push(edges);
    const lineMat = new THREE.LineBasicMaterial({ color: THEME.neon, transparent: true, opacity: 0.9 });
    this._materials.push(lineMat);
    this.shield.add(new THREE.LineSegments(edges, lineMat));
    const coreGeo = new THREE.IcosahedronGeometry(0.32, 0);
    this._geometries.push(coreGeo);
    const coreMat = new THREE.MeshBasicMaterial({ color: THEME.ice, wireframe: true, transparent: true, opacity: 0.85 });
    this._materials.push(coreMat);
    this._coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.shield.add(this._coreMesh);
  }

  createParticleRing() {
    const count = 600;
    const radius = 2.2;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const r = radius + (Math.random() - 0.5) * 0.4;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this._geometries.push(geo);
    const mat = new THREE.PointsMaterial({
      color: THEME.neon, size: 0.06, transparent: true, opacity: 0.8,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    this._materials.push(mat);
    this.particleRing = new THREE.Points(geo, mat);
    this.group.add(this.particleRing);
  }

  createBaseRing() {
    const ringGeo = new THREE.TorusGeometry(2.2, 0.03, 8, 64);
    this._geometries.push(ringGeo);
    const ringMat = new THREE.MeshBasicMaterial({ color: THEME.neon, transparent: true, opacity: 0.6 });
    this._materials.push(ringMat);
    this._baseRing = new THREE.Mesh(ringGeo, ringMat);
    this._baseRing.rotation.x = Math.PI / 2;
    this._baseRing.position.y = -1.3;
    this.group.add(this._baseRing);
  }

  update(elapsed) {
    const delta = this._lastElapsed ? Math.min(elapsed - this._lastElapsed, 0.1) : 0.016;
    this._lastElapsed = elapsed;
    if (this.particleRing) this.particleRing.rotation.y += delta * 0.3;
    if (this.shield) {
      const pulse = 0.5 + Math.sin(elapsed * 1.5) * 0.3;
      this.shield.material.opacity = 0.15 + pulse * 0.2;
    }
    if (this._coreMesh) {
      this._coreMesh.rotation.y += delta * 0.5;
      this._coreMesh.rotation.x += delta * 0.2;
    }
    this.group.position.y = this._baseY + Math.sin(elapsed * 0.8) * 0.15;
  }

  dispose() {
    this._geometries.forEach(g => g && g.dispose());
    this._materials.forEach(m => m && m.dispose());
    if (this.scene) this.scene.remove(this.group);
  }
}
