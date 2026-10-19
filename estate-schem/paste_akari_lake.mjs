// Seeded natural landscape + Akari Japanese House on the best flat shore.
// Minecraft must be closed.
import { mkdirSync, writeFileSync, rmSync, existsSync, cpSync } from 'fs';
import { deflateSync, gzipSync } from 'zlib';
import { execSync } from 'child_process';
import nbt from 'prismarine-nbt';
import { parseToGrid } from './node_modules/craftmatic/dist/schem/parse.js';

const HOME = process.env.HOME;
const SAVES = `${HOME}/Library/Application Support/minecraft/saves`;
const WORLD = `${SAVES}/Akari Lake`;
const SCHEM = '/Users/taylormanning/Downloads/Akari_Japanese_House_Original.schem';
const WE_SCHEMS = `${HOME}/Library/Application Support/minecraft/config/worldedit/schematics`;
const DATA_VERSION = 5023;

// World seed — drives all terrain noise
const SEED = 847291563;

const minecraftOpen = /net\.minecraft|minecraft\/runtime|java-runtime-epsilon/.test(
  execSync('ps aux', { encoding: 'utf8' }),
);
if (minecraftOpen) {
  console.error('Minecraft is open — close it first, then re-run.');
  process.exit(1);
}

const AIR = 'minecraft:air';
const WATER = 'minecraft:water[level=0]';
const GRASS = 'minecraft:grass_block[snowy=false]';
const DIRT = 'minecraft:dirt';
const STONE = 'minecraft:stone';
const SAND = 'minecraft:sand';
const GRAVEL = 'minecraft:gravel';
const CLAY = 'minecraft:clay';
const PODZOL = 'minecraft:podzol[snowy=false]';
const BEDROCK = 'minecraft:bedrock';
const OAK_LOG = 'minecraft:oak_log[axis=y]';
const OAK_LEAVES = 'minecraft:oak_leaves[distance=1,persistent=true,waterlogged=false]';
const BIRCH_LOG = 'minecraft:birch_log[axis=y]';
const BIRCH_LEAVES = 'minecraft:birch_leaves[distance=1,persistent=true,waterlogged=false]';
const SPRUCE_LOG = 'minecraft:spruce_log[axis=y]';
const SPRUCE_LEAVES = 'minecraft:spruce_leaves[distance=1,persistent=true,waterlogged=false]';
const CHERRY_LOG = 'minecraft:cherry_log[axis=y]';
const CHERRY_LEAVES = 'minecraft:cherry_leaves[distance=1,persistent=true,waterlogged=false]';
const LILY = 'minecraft:lily_pad';
const SEAGRASS = 'minecraft:seagrass';
const SUGAR = 'minecraft:sugar_cane';
const PINK_PETALS = 'minecraft:pink_petals[facing=east,flower_amount=4]';
const DANDELION = 'minecraft:dandelion';
const CORNFLOWER = 'minecraft:cornflower';
const OXEYE = 'minecraft:oxeye_daisy';
const BLUE_ORCHID = 'minecraft:blue_orchid';
const ANDESITE = 'minecraft:andesite';
const DEEPSLATE = 'minecraft:deepslate';
const GRASS_SNOW = 'minecraft:grass_block[snowy=true]';
const SNOW = 'minecraft:snow_block';
const SNOW_LAYER = 'minecraft:snow[layers=1]';

const grid = await parseToGrid(SCHEM);
const HW = grid.width;
const HH = grid.height;
const HL = grid.length;

const WORLD_X0 = -192;
const WORLD_X1 = 192;
const WORLD_Z0 = -192;
const WORLD_Z1 = 192;
const SEA = 63; // water surface

// ── Seeded noise ───────────────────────────────────────────────────────────
function mix(a, b) {
  let x = (Math.imul(a ^ b, 0x9e3779b9) + SEED) | 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function grad2(ix, iz, x, z) {
  const h = mix(ix, iz);
  const angle = h * Math.PI * 2;
  return Math.cos(angle) * x + Math.sin(angle) * z;
}
function perlin2(x, z) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const u = fade(xf);
  const v = fade(zf);
  const n00 = grad2(xi, zi, xf, zf);
  const n10 = grad2(xi + 1, zi, xf - 1, zf);
  const n01 = grad2(xi, zi + 1, xf, zf - 1);
  const n11 = grad2(xi + 1, zi + 1, xf - 1, zf - 1);
  return lerp(lerp(n00, n10, u), lerp(n01, n11, u), v);
}
function fbm(x, z, octaves = 5, lac = 2, gain = 0.5) {
  let amp = 1;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * perlin2(x * freq, z * freq);
    norm += amp;
    amp *= gain;
    freq *= lac;
  }
  return sum / norm;
}
function hash2(x, z) {
  return mix(x | 0, z | 0);
}

/** Continentalness / hills / moisture → natural height + lakes */
function rawHeight(x, z) {
  const nx = x * 0.0045;
  const nz = z * 0.0045;
  const continent = fbm(nx, nz, 5, 2.05, 0.52); // -1..1-ish
  const hills = fbm(x * 0.012, z * 0.012, 4, 2.1, 0.5);
  const detail = fbm(x * 0.04, z * 0.04, 3, 2.2, 0.45);
  const ridge = 1 - Math.abs(fbm(x * 0.008 + 20, z * 0.008 - 7, 4));

  let h = SEA + 1;
  h += continent * 18;
  h += hills * 10;
  h += detail * 3;
  h += ridge * ridge * 8 * Math.max(0, continent);

  // Moisture basin → lakes & wetlands (natural water bodies)
  const moist = fbm(x * 0.006 + 100, z * 0.006 - 40, 4, 2, 0.55);
  const basin = fbm(x * 0.0035 - 50, z * 0.0035 + 30, 3);
  if (moist < -0.22 && continent < 0.35) {
    // carve lake bowl
    const depth = (-0.22 - moist) * 28 + Math.max(0, -basin) * 6;
    h = Math.min(h, SEA - 1 - depth);
  } else if (moist < -0.08 && continent < 0.2) {
    // river-ish lowlands
    h = Math.min(h, SEA + 1 + moist * 4);
  }

  // Soft beaches near waterline
  if (h > SEA - 2 && h < SEA + 3) {
    h = lerp(h, SEA + (h - SEA) * 0.4, 0.35);
  }

  return h;
}

const heightCache = new Map();
function surfaceY(x, z) {
  const k = `${x},${z}`;
  if (heightCache.has(k)) return heightCache.get(k);
  const v = Math.round(rawHeight(x, z));
  heightCache.set(k, v);
  return v;
}
function isWaterCol(x, z) {
  return surfaceY(x, z) < SEA;
}

function biomeAt(x, z) {
  if (isWaterCol(x, z)) return 'minecraft:river';
  const t = fbm(x * 0.0025 + 3, z * 0.0025 - 9, 3);
  const m = fbm(x * 0.003 - 11, z * 0.003 + 5, 3);
  const h = surfaceY(x, z);
  if (h >= SEA + 28) return t > 0 ? 'minecraft:stony_peaks' : 'minecraft:windswept_hills';
  if (h >= SEA + 18) return 'minecraft:grove';
  if (m < -0.35 && h <= SEA + 3) return 'minecraft:swamp';
  if (t > 0.35 && m > 0.15) return 'minecraft:jungle';
  if (t > 0.25 && m < -0.1) return 'minecraft:savanna';
  if (t < -0.3) return m > 0 ? 'minecraft:taiga' : 'minecraft:snowy_taiga';
  if (m > 0.3) return 'minecraft:forest';
  if (m > 0.1) return hash2(x, z) > 0.5 ? 'minecraft:birch_forest' : 'minecraft:flower_forest';
  if (t > 0.05 && m > -0.05 && h < SEA + 8) return 'minecraft:cherry_grove';
  if (Math.abs(h - SEA) <= 2) return 'minecraft:beach';
  return hash2(x >> 3, z >> 3) > 0.55 ? 'minecraft:meadow' : 'minecraft:plains';
}

console.log('seed', SEED);
console.log('scanning for flat shore sites…');

// ── Find best flat pad next to water for the house ─────────────────────────
function siteScore(ox, oz) {
  // House footprint at (ox..ox+HW-1, oz..oz+HL-1)
  const heights = [];
  for (let z = oz; z < oz + HL; z++) {
    for (let x = ox; x < ox + HW; x++) {
      if (x < WORLD_X0 + 8 || x > WORLD_X1 - 8 || z < WORLD_Z0 + 8 || z > WORLD_Z1 - 8) return -1e9;
      const h = surfaceY(x, z);
      if (h < SEA) return -1e9; // don't put house in water
      heights.push(h);
    }
  }
  const minH = Math.min(...heights);
  const maxH = Math.max(...heights);
  const flat = maxH - minH;
  if (flat > 2) return -1e9; // need nearly flat

  // Water adjacency — scan a ring just outside the footprint
  let waterTouch = 0;
  let openWater = 0;
  const dirs = [
    [0, HL], // south of house
    [0, -1],
    [HW, 0],
    [-1, 0],
  ];
  for (const [dx, dz] of dirs) {
    for (let i = 0; i < Math.max(HW, HL); i++) {
      let x = ox + (dx === 0 ? i : dx < 0 ? -1 : HW);
      let z = oz + (dz === 0 ? i : dz < 0 ? -1 : HL);
      if (dx !== 0) z = oz + (i % HL);
      if (dz !== 0) x = ox + (i % HW);
      if (isWaterCol(x, z)) waterTouch++;
      // look further for open water (scenic)
      for (let d = 2; d <= 18; d++) {
        const fx = ox + Math.floor(HW / 2) + Math.sign(dx || 0) * (dx ? d : 0);
        const fz = oz + Math.floor(HL / 2) + Math.sign(dz || 0) * (dz ? d : 0);
        // also check south bias (prefer water in front)
      }
    }
  }
  // Prefer water mainly to the south of the house (nice lake-house view)
  let southWater = 0;
  for (let z = oz + HL; z < oz + HL + 24; z++) {
    for (let x = ox; x < ox + HW; x++) {
      if (isWaterCol(x, z)) southWater++;
    }
  }
  if (waterTouch < 3 && southWater < 8) return -1e9;

  const avg = heights.reduce((a, b) => a + b, 0) / heights.length;
  // Prefer sitting just above the waterline
  const waterProx = -Math.abs(avg - (SEA + 1)) * 4;
  // Prefer flat
  const flatScore = (2 - flat) * 40;
  const viewScore = Math.min(80, southWater);
  // Prefer cherry/meadow/plains biomes for the Japanese house
  const bio = biomeAt(ox + Math.floor(HW / 2), oz + Math.floor(HL / 2));
  let bioScore = 0;
  if (bio.includes('cherry') || bio.includes('meadow')) bioScore = 30;
  else if (bio.includes('plains') || bio.includes('beach') || bio.includes('birch') || bio.includes('flower'))
    bioScore = 15;
  else if (bio.includes('forest')) bioScore = 5;

  return flatScore + viewScore + waterProx + bioScore + waterTouch;
}

let best = null;
let bestScore = -1e9;
// Coarse scan then refine
for (let oz = WORLD_Z0 + 20; oz < WORLD_Z1 - HL - 30; oz += 4) {
  for (let ox = WORLD_X0 + 20; ox < WORLD_X1 - HW - 20; ox += 4) {
    const s = siteScore(ox, oz);
    if (s > bestScore) {
      bestScore = s;
      best = { ox, oz };
    }
  }
}
if (!best) {
  console.error('No suitable flat shore found — try another seed');
  process.exit(1);
}
// Local refine
for (let oz = best.oz - 3; oz <= best.oz + 3; oz++) {
  for (let ox = best.ox - 3; ox <= best.ox + 3; ox++) {
    const s = siteScore(ox, oz);
    if (s > bestScore) {
      bestScore = s;
      best = { ox, oz };
    }
  }
}

const HOUSE_X = best.ox;
const HOUSE_Z = best.oz;
// Flatten pad height = median of footprint, at least SEA+1
const padHeights = [];
for (let z = HOUSE_Z; z < HOUSE_Z + HL; z++)
  for (let x = HOUSE_X; x < HOUSE_X + HW; x++) padHeights.push(surfaceY(x, z));
padHeights.sort((a, b) => a - b);
const PAD_Y = Math.max(SEA + 1, padHeights[Math.floor(padHeights.length / 2)]);
const HOUSE_Y = PAD_Y; // schem y=0 sits on grass/pad

console.log('house site', [HOUSE_X, HOUSE_Y, HOUSE_Z], 'score', bestScore.toFixed(1));
console.log('shore biome', biomeAt(HOUSE_X + 8, HOUSE_Z + 7));

// Override heights under/around the house to a natural flat terrace
const padOverrides = new Map();
function setPad(x, z, y) {
  padOverrides.set(`${x},${z}`, y);
}
for (let z = HOUSE_Z - 3; z < HOUSE_Z + HL + 5; z++) {
  for (let x = HOUSE_X - 3; x < HOUSE_X + HW + 3; x++) {
    const edge =
      x < HOUSE_X - 1 || x >= HOUSE_X + HW + 1 || z < HOUSE_Z - 1 || z >= HOUSE_Z + HL + 2;
    if (!edge) {
      setPad(x, z, PAD_Y);
    } else {
      // soft blend toward original
      const orig = surfaceY(x, z);
      if (orig >= SEA) setPad(x, z, Math.round(lerp(orig, PAD_Y, 0.55)));
    }
  }
}

function finalSurface(x, z) {
  const o = padOverrides.get(`${x},${z}`);
  if (o !== undefined) return o;
  return surfaceY(x, z);
}

// ── Decor ──────────────────────────────────────────────────────────────────
const decor = new Map();
function putDecor(x, y, z, state) {
  decor.set(`${x},${y},${z}`, state);
}
function placeTree(tx, tz, kind) {
  const surf = finalSurface(tx, tz);
  if (surf < SEA) return;
  // keep yard clear
  if (tx >= HOUSE_X - 2 && tx < HOUSE_X + HW + 2 && tz >= HOUSE_Z - 2 && tz < HOUSE_Z + HL + 4) return;
  const base = surf + 1;
  let log = OAK_LOG;
  let leaf = OAK_LEAVES;
  let h = 4;
  if (kind === 'cherry') {
    log = CHERRY_LOG;
    leaf = CHERRY_LEAVES;
    h = 4 + (hash2(tx, tz) > 0.5 ? 1 : 0);
  } else if (kind === 'birch') {
    log = BIRCH_LOG;
    leaf = BIRCH_LEAVES;
    h = 5;
  } else if (kind === 'spruce') {
    log = SPRUCE_LOG;
    leaf = SPRUCE_LEAVES;
    h = 6;
  }
  for (let dy = 0; dy <= h; dy++) putDecor(tx, base + dy, tz, log);
  for (let dy = h - 2; dy <= h + 1; dy++) {
    const r = dy >= h ? 1 : 2;
    for (let dx = -r; dx <= r; dx++)
      for (let dz = -r; dz <= r; dz++) {
        if (dx === 0 && dz === 0 && dy <= h) continue;
        if (Math.abs(dx) === r && Math.abs(dz) === r && dy === h + 1) continue;
        const key = `${tx + dx},${base + dy},${tz + dz}`;
        if (!decor.has(key)) putDecor(tx + dx, base + dy, tz + dz, leaf);
      }
  }
}

console.log('planting…');
for (let z = WORLD_Z0 + 4; z < WORLD_Z1 - 4; z += 3) {
  for (let x = WORLD_X0 + 4; x < WORLD_X1 - 4; x += 3) {
    const surf = finalSurface(x, z);
    const r = hash2(x * 5, z * 7);
    if (surf < SEA) {
      if (SEA - surf <= 2 && r > 0.93) putDecor(x, SEA + 1, z, LILY);
      continue;
    }
    const bio = biomeAt(x, z);
    let kind = null;
    let chance = 0.03;
    if (bio.includes('cherry')) {
      kind = 'cherry';
      chance = 0.1;
    } else if (bio.includes('birch')) {
      kind = 'birch';
      chance = 0.07;
    } else if (bio.includes('taiga') || bio.includes('grove')) {
      kind = 'spruce';
      chance = 0.08;
    } else if (bio.includes('forest') || bio.includes('flower')) {
      kind = 'oak';
      chance = 0.07;
    } else if (bio.includes('meadow') || bio.includes('plains')) {
      kind = 'oak';
      chance = 0.012;
    }
    if (kind && r < chance) placeTree(x, z, kind);

    const g = hash2(z * 3, x * 9);
    if (bio.includes('cherry') || bio.includes('meadow') || bio.includes('flower')) {
      if (g > 0.86) putDecor(x, surf + 1, z, PINK_PETALS);
      else if (g > 0.78) putDecor(x, surf + 1, z, CORNFLOWER);
      else if (g > 0.7) putDecor(x, surf + 1, z, OXEYE);
    } else if (bio.includes('swamp') && g > 0.85) putDecor(x, surf + 1, z, BLUE_ORCHID);
    else if ((bio.includes('plains') || bio.includes('meadow')) && g > 0.9) putDecor(x, surf + 1, z, DANDELION);
    if (bio.includes('swamp') && g > 0.92 && Math.abs(surf - SEA) <= 2) putDecor(x, surf + 1, z, SUGAR);
  }
}

// Small stepping stones / path from house door toward water (south)
const doorX = HOUSE_X + Math.floor(HW / 2);
for (let z = HOUSE_Z + HL; z < HOUSE_Z + HL + 6; z++) {
  const y = finalSurface(doorX, z);
  if (y >= SEA) putDecor(doorX, y, z, 'minecraft:smooth_stone');
}

function surfaceBlock(biome, x, z, surf) {
  if (biome.includes('beach') || (Math.abs(surf - SEA) <= 1 && !biome.includes('swamp'))) return SAND;
  if (biome.includes('swamp')) return hash2(x, z) > 0.5 ? 'minecraft:mud' : GRASS;
  if (biome.includes('taiga') || biome.includes('grove')) return PODZOL;
  if (biome.includes('peaks') || biome.includes('hills')) {
    if (surf >= SEA + 30) return SNOW;
    if (surf >= SEA + 22) return GRASS_SNOW;
    return STONE;
  }
  return GRASS;
}

function blockAt(x, y, z) {
  const sx = x - HOUSE_X;
  const sy = y - HOUSE_Y;
  const sz = z - HOUSE_Z;
  if (sx >= 0 && sy >= 0 && sz >= 0 && sx < HW && sy < HH && sz < HL) {
    const s = grid.get(sx, sy, sz);
    if (s && s !== AIR) return s;
  }
  const d = decor.get(`${x},${y},${z}`);
  if (d) return d;

  const biome = biomeAt(x, z);
  const surf = finalSurface(x, z);

  if (surf < SEA) {
    // water column
    if (y > SEA) return AIR;
    if (y > surf && y <= SEA) {
      if (SEA - y <= 2 && hash2(x, y + z) > 0.85) return SEAGRASS;
      return WATER;
    }
    if (y === surf) {
      const n = hash2(x, z);
      if (n > 0.65) return SAND;
      if (n > 0.4) return GRAVEL;
      if (n > 0.22) return CLAY;
      return DIRT;
    }
    if (y < surf) {
      const depth = surf - y;
      if (depth < 3) return DIRT;
      if (depth > 24) return DEEPSLATE;
      return hash2(x + y, z) < 0.07 ? ANDESITE : STONE;
    }
  }

  if (y > surf) {
    if (y === surf + 1 && surf >= SEA + 24 && hash2(x, z) > 0.45) return SNOW_LAYER;
    return AIR;
  }
  if (y <= -64) return BEDROCK;
  if (y === surf) return surfaceBlock(biome, x, z, surf);
  const depth = surf - y;
  if (depth < 3) return DIRT;
  if (depth > 24) return DEEPSLATE;
  return hash2(x + y, z) < 0.07 ? ANDESITE : STONE;
}

function pack(indices, paletteSize) {
  const bits = Math.max(4, Math.ceil(Math.log2(Math.max(paletteSize, 2))));
  const per = Math.floor(64 / bits);
  const longs = [];
  let cur = 0n;
  let used = 0;
  for (let i = 0; i < indices.length; i++) {
    if (used === per) {
      longs.push(cur);
      cur = 0n;
      used = 0;
    }
    cur |= BigInt(indices[i]) << BigInt(used * bits);
    used++;
  }
  if (used) longs.push(cur);
  return longs.map(longPair);
}
function longPair(bi) {
  if (bi < 0n) bi += 1n << 64n;
  const hi = Number((bi >> 32n) & 0xffffffffn);
  const lo = Number(bi & 0xffffffffn);
  return [hi > 0x7fffffff ? hi - 0x100000000 : hi, lo > 0x7fffffff ? lo - 0x100000000 : lo];
}
function entry(state) {
  const open = state.indexOf('[');
  const id = open === -1 ? state : state.slice(0, open);
  if (open === -1) return { id: { type: 'string', value: id } };
  const props = {};
  for (const part of state.slice(open + 1, -1).split(',')) {
    const [k, v] = part.split('=');
    props[k] = { type: 'string', value: v };
  }
  return { id: { type: 'string', value: id }, properties: { type: 'compound', value: props } };
}
function heightLongs(heights) {
  const bits = 9;
  const per = 7;
  const longs = [];
  let cur = 0n;
  let used = 0;
  for (const h of heights) {
    if (used === per) {
      longs.push(cur);
      cur = 0n;
      used = 0;
    }
    cur |= BigInt(h) << BigInt(used * bits);
    used++;
  }
  if (used) longs.push(cur);
  while (longs.length < 37) longs.push(0n);
  return longs.map(longPair);
}

function writeChunk(cx, cz) {
  const sections = [];
  const heights = new Array(256).fill(-64);
  for (let sy = -4; sy <= 8; sy++) {
    const palette = [];
    const indexOf = new Map();
    const indices = new Array(4096);
    let biome = 'minecraft:plains';
    for (let ly = 0; ly < 16; ly++) {
      const y = sy * 16 + ly;
      for (let lz = 0; lz < 16; lz++) {
        for (let lx = 0; lx < 16; lx++) {
          const x = cx * 16 + lx;
          const z = cz * 16 + lz;
          if (ly === 0 && lz === 0 && lx === 0) biome = biomeAt(x + 8, z + 8);
          const state = blockAt(x, y, z);
          if (state !== AIR && y >= heights[lz * 16 + lx]) heights[lz * 16 + lx] = y;
          let id = indexOf.get(state);
          if (id === undefined) {
            id = palette.length;
            palette.push(state);
            indexOf.set(state, id);
          }
          indices[ly * 256 + lz * 16 + lx] = id;
        }
      }
    }
    const blockStates = { palette: { type: 'list', value: { type: 'compound', value: palette.map(entry) } } };
    if (palette.length > 1) blockStates.data = { type: 'longArray', value: pack(indices, palette.length) };
    sections.push({
      Y: { type: 'byte', value: sy },
      block_states: { type: 'compound', value: blockStates },
      biomes: {
        type: 'compound',
        value: { palette: { type: 'list', value: { type: 'string', value: [biome] } } },
      },
    });
  }
  const surface = heights.map((h) => h + 1 + 64);
  const hm = () => ({ type: 'longArray', value: heightLongs(surface) });
  const empty = () => ({ type: 'list', value: { type: 'end', value: [] } });
  return {
    type: 'compound',
    name: '',
    value: {
      DataVersion: { type: 'int', value: DATA_VERSION },
      xPos: { type: 'int', value: cx },
      yPos: { type: 'int', value: -4 },
      zPos: { type: 'int', value: cz },
      Status: { type: 'string', value: 'minecraft:full' },
      LastUpdate: { type: 'long', value: [0, 0] },
      InhabitedTime: { type: 'long', value: [0, 0] },
      isLightOn: { type: 'byte', value: 0 },
      sections: { type: 'list', value: { type: 'compound', value: sections } },
      Heightmaps: {
        type: 'compound',
        value: { MOTION_BLOCKING: hm(), MOTION_BLOCKING_NO_LEAVES: hm(), OCEAN_FLOOR: hm(), WORLD_SURFACE: hm() },
      },
      block_entities: empty(),
      block_ticks: empty(),
      fluid_ticks: empty(),
      PostProcessing: { type: 'list', value: { type: 'list', value: Array.from({ length: 24 }, () => empty()) } },
      structures: {
        type: 'compound',
        value: { References: { type: 'compound', value: {} }, starts: { type: 'compound', value: {} } },
      },
    },
  };
}

function writeRegion(chunks) {
  const header = Buffer.alloc(8192);
  const parts = [header];
  let sector = 2;
  for (const [cx, cz, nbtBuf] of chunks) {
    const length = nbtBuf.length + 1;
    const count = Math.ceil((4 + length) / 4096);
    const body = Buffer.alloc(count * 4096);
    body.writeUInt32BE(length, 0);
    body[4] = 2;
    nbtBuf.copy(body, 5);
    parts.push(body);
    header.writeUInt32BE((sector << 8) | count, ((cx & 31) + (cz & 31) * 32) * 4);
    sector += count;
  }
  return Buffer.concat(parts);
}

if (existsSync(WORLD)) rmSync(WORLD, { recursive: true, force: true });
mkdirSync(`${WORLD}/dimensions/minecraft/overworld/region`, { recursive: true });
mkdirSync(`${WORLD}/data/minecraft`, { recursive: true });
mkdirSync(`${WORLD}/playerdata`, { recursive: true });

const regions = new Map();
let chunkCount = 0;
for (let cz = Math.floor(WORLD_Z0 / 16); cz <= Math.floor(WORLD_Z1 / 16); cz++) {
  for (let cx = Math.floor(WORLD_X0 / 16); cx <= Math.floor(WORLD_X1 / 16); cx++) {
    const key = `${cx >> 5},${cz >> 5}`;
    if (!regions.has(key)) regions.set(key, []);
    regions.get(key).push([cx, cz, deflateSync(nbt.writeUncompressed(writeChunk(cx, cz), 'big'))]);
    chunkCount++;
    if (chunkCount % 100 === 0) console.log('  chunks', chunkCount);
  }
}
for (const [key, chunks] of regions) {
  const [rx, rz] = key.split(',').map(Number);
  writeFileSync(`${WORLD}/dimensions/minecraft/overworld/region/r.${rx}.${rz}.mca`, writeRegion(chunks));
}

const spawnX = HOUSE_X + Math.floor(HW / 2);
const spawnY = HOUSE_Y + 2;
const spawnZ = HOUSE_Z - 3;

function seedLong(n) {
  const big = BigInt(n);
  return [Number((big >> 32n) & 0xffffffffn), Number(big & 0xffffffffn)].map((v) =>
    v > 0x7fffffff ? v - 0x100000000 : v,
  );
}

const dimensions = {
  type: 'compound',
  value: {
    'minecraft:overworld': {
      type: 'compound',
      value: {
        type: { type: 'string', value: 'minecraft:overworld' },
        generator: {
          type: 'compound',
          value: {
            type: { type: 'string', value: 'minecraft:flat' },
            settings: {
              type: 'compound',
              value: {
                biome: { type: 'string', value: 'minecraft:plains' },
                layers: {
                  type: 'list',
                  value: {
                    type: 'compound',
                    value: [
                      { height: { type: 'int', value: 1 }, block: { type: 'string', value: 'minecraft:bedrock' } },
                      { height: { type: 'int', value: 60 }, block: { type: 'string', value: 'minecraft:stone' } },
                      { height: { type: 'int', value: 3 }, block: { type: 'string', value: 'minecraft:dirt' } },
                      { height: { type: 'int', value: 1 }, block: { type: 'string', value: 'minecraft:grass_block' } },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const level = {
  type: 'compound',
  name: '',
  value: {
    Data: {
      type: 'compound',
      value: {
        DataVersion: { type: 'int', value: DATA_VERSION },
        LevelName: { type: 'string', value: `Akari Lake` },
        GameType: { type: 'int', value: 1 },
        Difficulty: { type: 'byte', value: 1 },
        hardcore: { type: 'byte', value: 0 },
        allowCommands: { type: 'byte', value: 1 },
        initialized: { type: 'byte', value: 1 },
        version: { type: 'int', value: 19133 },
        DayTime: { type: 'long', value: [0, 3000] },
        Time: { type: 'long', value: [0, 3000] },
        raining: { type: 'byte', value: 0 },
        thundering: { type: 'byte', value: 0 },
        // Legacy spawn (26.3 still honors these)
        SpawnX: { type: 'int', value: spawnX },
        SpawnY: { type: 'int', value: spawnY },
        SpawnZ: { type: 'int', value: spawnZ },
        SpawnAngle: { type: 'float', value: 0 },
        spawn: {
          type: 'compound',
          value: {
            pos: { type: 'intArray', value: [spawnX, spawnY, spawnZ] },
            yaw: { type: 'float', value: 0 },
            pitch: { type: 'float', value: 8 },
          },
        },
        WorldGenSettings: {
          type: 'compound',
          value: {
            bonus_chest: { type: 'byte', value: 0 },
            generate_features: { type: 'byte', value: 0 },
            seed: { type: 'long', value: seedLong(SEED) },
            dimensions,
          },
        },
      },
    },
  },
};
writeFileSync(`${WORLD}/level.dat`, gzipSync(nbt.writeUncompressed(level, 'big')));
writeFileSync(
  `${WORLD}/data/minecraft/world_gen_settings.dat`,
  gzipSync(
    nbt.writeUncompressed(
      {
        type: 'compound',
        name: '',
        value: {
          data: {
            type: 'compound',
            value: {
              generate_structures: { type: 'byte', value: 0 },
              bonus_chest: { type: 'byte', value: 0 },
              seed: { type: 'long', value: seedLong(SEED) },
              dimensions,
            },
          },
        },
      },
      'big',
    ),
  ),
);
writeFileSync(`${WORLD}/session.lock`, Buffer.from([0xef, 0xbf, 0xbd]));

mkdirSync(WE_SCHEMS, { recursive: true });
cpSync(SCHEM, `${WE_SCHEMS}/Akari_Japanese_House.schem`);

console.log('world: Akari Lake');
console.log('seed', SEED);
console.log('chunks', chunkCount, 'house', [HOUSE_X, HOUSE_Y, HOUSE_Z]);
console.log('spawn', [spawnX, spawnY, spawnZ], 'facing south toward the water');
console.log('Open Minecraft → Singleplayer → Akari Lake');
