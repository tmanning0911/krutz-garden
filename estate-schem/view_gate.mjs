import express from 'express';
import { parseToGrid } from './node_modules/craftmatic/dist/schem/parse.js';

const X0 = -120;
const Z0 = -136;
const Y0 = 60;
const x1 = -70;
const x2 = 70;
const z1 = -110;
const z2 = 120;
const y1 = 64;
const y2 = 100;
const src = await parseToGrid('green_property.schem');
const solid = new Set();
const raw = [];
for (let y = y1; y <= y2; y++) {
  for (let z = z1; z <= z2; z++) {
    for (let x = x1; x <= x2; x++) {
      const state = src.get(x - X0, y - Y0, z - Z0);
      if (!state || state === 'minecraft:air' || state.startsWith('minecraft:redstone') || state.startsWith('minecraft:repeater')) continue;
      if (state.startsWith('energizedpower:') && !state.includes('solar_panel') && !state.includes('powered_lamp')) continue;
      solid.add(`${x},${y},${z}`);
      raw.push([x, y, z, state]);
    }
  }
}
const blocks = [];
for (const [x, y, z, state] of raw) {
  const buried = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].every(([dx, dy, dz]) => solid.has(`${x + dx},${y + dy},${z + dz}`));
  if (buried) continue;
  blocks.push([x - x1, y - y1, z - z1, state]);
}

const width = x2 - x1 + 1;
const height = y2 - y1 + 1;
const length = z2 - z1 + 1;
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Wall gate</title>
<style>
  html,body{margin:0;height:100%;background:#8ea4b8;overflow:hidden;font-family:system-ui,sans-serif}
  #hint{position:fixed;left:12px;bottom:12px;color:#243040;background:rgba(255,255,255,.78);padding:6px 10px;border-radius:6px;font-size:12px}
</style>
</head>
<body>
<div id="hint">Drag to turn · scroll to zoom · right-drag to slide</div>
<script type="importmap">
{"imports":{"three":"/vendor/three/build/three.module.js","three/addons/":"/vendor/three/examples/jsm/"}}
</script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const blocks = ${JSON.stringify(blocks)};
const W = ${width}, H = ${height}, L = ${length};
const halfW = W / 2, halfL = L / 2;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ea4b8);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.5, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(1);
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x6a7a58, 0.85));
const sun = new THREE.DirectionalLight(0xfff4e0, 1.15);
sun.position.set(-18, 28, -12);
scene.add(sun);

const mats = new Map();
function mat(hex, opts = {}) {
  const k = hex + JSON.stringify(opts);
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color: hex, roughness: 0.86, metalness: 0.02, ...opts }));
  return mats.get(k);
}
const box = new THREE.BoxGeometry(1, 1, 1);
const buckets = new Map();
function cube(color, x, y, z, sx, sy, sz, ox, oy, oz) {
  const k = color + '|' + sx + '|' + sy + '|' + sz;
  let list = buckets.get(k);
  if (!list) buckets.set(k, list = []);
  list.push(x - halfW + ox, y + oy, z - halfL + oz);
}
function propsOf(state) {
  const p = {};
  const i = state.indexOf('[');
  if (i < 0) return p;
  for (const part of state.slice(i + 1, -1).split(',')) {
    const [k, v] = part.split('=');
    p[k] = v;
  }
  return p;
}
function idOf(state) { return state.split('[')[0]; }

const STONE = 0x8a8e8a;
const ROOF = 0x6e7470;
const WOOD = 0x3a2a1c;
const SPRUCE = 0x6b5130;
const OAK = 0xc2a36a;
const GRASS = 0x5f9e3a;
const RED = 0x8f2d2a;
const COBBLE = 0x7a7a72;

function stair(color, x, y, z, facing, half) {
  const top = half === 'top';
  const y0 = top ? 0.75 : 0.25;
  cube(color, x, y, z, 1, 0.5, 1, 0.5, y0, 0.5);
  const tall = top ? 0.25 : 0.75;
  if (facing === 'north') cube(color, x, y, z, 1, 0.5, 0.5, 0.5, tall, 0.25);
  if (facing === 'south') cube(color, x, y, z, 1, 0.5, 0.5, 0.5, tall, 0.75);
  if (facing === 'west') cube(color, x, y, z, 0.5, 0.5, 1, 0.25, tall, 0.5);
  if (facing === 'east') cube(color, x, y, z, 0.5, 0.5, 1, 0.75, tall, 0.5);
}
function fence(color, x, y, z, p) {
  cube(color, x, y, z, 0.25, 1, 0.25, 0.5, 0.5, 0.5);
  const rail = (ox, oz, sx, sz) => {
    cube(color, x, y, z, sx, 0.12, sz, ox, 0.42, oz);
    cube(color, x, y, z, sx, 0.12, sz, ox, 0.78, oz);
  };
  if (p.east === 'true') rail(0.75, 0.5, 0.5, 0.12);
  if (p.west === 'true') rail(0.25, 0.5, 0.5, 0.12);
  if (p.south === 'true') rail(0.5, 0.75, 0.12, 0.5);
  if (p.north === 'true') rail(0.5, 0.25, 0.12, 0.5);
}
function gate(color, x, y, z) {
  cube(color, x, y, z, 0.12, 0.9, 0.12, 0.12, 0.45, 0.5);
  cube(color, x, y, z, 0.12, 0.9, 0.12, 0.88, 0.45, 0.5);
  cube(color, x, y, z, 0.76, 0.1, 0.08, 0.5, 0.32, 0.5);
  cube(color, x, y, z, 0.76, 0.1, 0.08, 0.5, 0.68, 0.5);
}
function trap(color, x, y, z, facing) {
  if (facing === 'south') cube(color, x, y, z, 1, 1, 0.08, 0.5, 0.5, 0.96);
  else if (facing === 'north') cube(color, x, y, z, 1, 1, 0.08, 0.5, 0.5, 0.04);
  else if (facing === 'east') cube(color, x, y, z, 0.08, 1, 1, 0.96, 0.5, 0.5);
  else cube(color, x, y, z, 0.08, 1, 1, 0.04, 0.5, 0.5);
}
function lantern(x, y, z) {
  cube(0x3a3a3a, x, y, z, 0.08, 0.25, 0.08, 0.5, 0.88, 0.5);
  cube(0xf2c14e, x, y, z, 0.28, 0.36, 0.28, 0.5, 0.58, 0.5);
}

for (const [x, y, z, state] of blocks) {
  const id = idOf(state);
  const p = propsOf(state);
  if (id.endsWith('_stairs')) stair(id.includes('spruce') || id.includes('dark_oak') ? WOOD : id.includes('andesite') ? ROOF : STONE, x, y, z, p.facing || 'north', p.half || 'bottom');
  else if (id.endsWith('_slab')) {
    const top = p.type === 'top';
    cube(id.includes('andesite') ? ROOF : id.includes('spruce') || id.includes('dark_oak') ? WOOD : 0xc4c4c4, x, y, z, 1, 0.5, 1, 0.5, top ? 0.75 : 0.25, 0.5);
  } else if (id.includes('solar_panel')) cube(0x16325c, x, y, z, 0.92, 0.25, 0.92, 0.5, 0.12, 0.5);
  else if (id.includes('powered_lamp')) cube(0xf6e27a, x, y, z, 0.7, 0.7, 0.7, 0.5, 0.5, 0.5);
  else if (id.endsWith('_fence')) fence(WOOD, x, y, z, p);
  else if (id.endsWith('_fence_gate')) gate(id.includes('crimson') ? RED : WOOD, x, y, z);
  else if (id.endsWith('_trapdoor')) trap(WOOD, x, y, z, p.facing || 'north');
  else if (id.includes('_door')) cube(id.includes('crimson') ? RED : WOOD, x, y, z, 0.2, 1, 1, 0.5, 0.5, 0.5);
  else if (id === 'minecraft:lantern') lantern(x, y, z);
  else if (id.includes('log') || id.includes('stem')) cube(id.includes('crimson') ? RED : WOOD, x, y, z, 1, 1, 1, 0.5, 0.5, 0.5);
  else if (id === 'minecraft:grass_block') cube(GRASS, x, y, z, 1, 1, 1, 0.5, 0.5, 0.5);
  else if (id === 'minecraft:dirt_path') cube(0x9a7a4a, x, y, z, 1, 0.94, 1, 0.5, 0.47, 0.5);
  else if (id.includes('hydroponics_bed') || id.includes('planter')) cube(0x4f8f2e, x, y, z, 1, 0.7, 1, 0.5, 0.35, 0.5);
  else if (id.includes('liquid_tank')) cube(0x3a8ec8, x, y, z, 0.85, 1, 0.85, 0.5, 0.5, 0.5);
  else if (id.includes('barrel')) cube(SPRUCE, x, y, z, 1, 1, 1, 0.5, 0.5, 0.5);
  else if (id.includes('pressure_plate')) cube(STONE, x, y, z, 0.8, 0.06, 0.8, 0.5, 0.03, 0.5);
  else if (id.includes('planks')) cube(id.includes('crimson') ? RED : id.includes('spruce') ? SPRUCE : WOOD, x, y, z, 1, 1, 1, 0.5, 0.5, 0.5);
  else if (id.includes('cobble')) cube(COBBLE, x, y, z, 1, 1, 1, 0.5, 0.5, 0.5);
  else if (id.includes('andesite') || id.includes('chiseled')) cube(id.includes('polished') ? STONE : ROOF, x, y, z, 1, 1, 1, 0.5, 0.5, 0.5);
  else cube(STONE, x, y, z, 1, 1, 1, 0.5, 0.5, 0.5);
}

const matrix = new THREE.Matrix4();
const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();
const scl = new THREE.Vector3();
for (const [k, list] of buckets) {
  const [color, sx, sy, sz] = k.split('|');
  const count = list.length / 3;
  const mesh = new THREE.InstancedMesh(box, mat(Number(color)), count);
  scl.set(Number(sx), Number(sy), Number(sz));
  for (let i = 0; i < count; i++) {
    pos.set(list[i * 3], list[i * 3 + 1], list[i * 3 + 2]);
    matrix.compose(pos, quat, scl);
    mesh.setMatrixAt(i, matrix);
  }
  scene.add(mesh);
}

const ground = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), mat(0x6aa344));
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);

camera.position.set(8, 40, 150);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(4, 10, 40);
controls.maxDistance = 1600;
controls.enableDamping = true;
controls.update();
globalThis.__view = { camera, controls };
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});
</script>
</body>
</html>`;

const app = express();
app.use('/vendor/three', express.static(new URL('./node_modules/three', import.meta.url).pathname));
app.get('/', (_req, res) => res.type('html').send(html));
app.listen(3000, () => console.log('gate viewer http://localhost:3000', blocks.length, 'blocks'));
