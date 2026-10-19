// Paste plot40.schem into Ironcrest Estate, reshape the land around it,
// and raise one mountain south of the walls (behind the manor). MC must be closed.
import { mkdirSync, readFileSync, writeFileSync, rmSync, cpSync, existsSync } from 'fs';
import { deflateSync, gunzipSync, gzipSync } from 'zlib';
import { execSync } from 'child_process';
import nbt from 'prismarine-nbt';
import { parseToGrid } from './node_modules/craftmatic/dist/schem/parse.js';

const HOME = process.env.HOME;
const SAVES = `${HOME}/Library/Application Support/minecraft/saves`;
const SRC = `${SAVES}/New World`;
const WORLD = `${SAVES}/Ironcrest Estate`;
const SCHEM = 'plot40.schem';
const WE_SCHEMS = `${HOME}/Library/Application Support/minecraft/config/worldedit/schematics`;

const minecraftOpen = /net\.minecraft|minecraft\/runtime|java-runtime-epsilon/.test(
  execSync('ps aux', { encoding: 'utf8' }),
);
if (minecraftOpen) {
  console.error('Minecraft is open — close it first, then re-run this paste.');
  process.exit(1);
}

const AIR = 'minecraft:air';
const GRASS = 'minecraft:grass_block[snowy=false]';
const GRASS_SNOW = 'minecraft:grass_block[snowy=true]';
const DIRT = 'minecraft:dirt';
const STONE = 'minecraft:stone';
const ANDESITE = 'minecraft:andesite';
const DIORITE = 'minecraft:diorite';
const CALCITE = 'minecraft:calcite';
const SNOW = 'minecraft:snow_block';
const SNOW_LAYER = 'minecraft:snow[layers=1]';
const BEDROCK = 'minecraft:bedrock';
const WATER = 'minecraft:water[level=0]';
const OAK_LOG = 'minecraft:oak_log[axis=y]';
const OAK_LEAVES = 'minecraft:oak_leaves[distance=1,persistent=true,waterlogged=false]';
const SPRUCE_LOG = 'minecraft:spruce_log[axis=y]';
const SPRUCE_LEAVES = 'minecraft:spruce_leaves[distance=1,persistent=true,waterlogged=false]';

const grid = await parseToGrid(SCHEM);
const W = grid.width;
const H = grid.height;
const L = grid.length;

// Grass in the schem sits at local y≈6 (GY=1 + UNDER=5). Pin that to world y=64.
const WX0 = 0;
const WY0 = 64 - 6;
const WZ0 = 0;
const ESTATE_GRASS = 63; // world surface under / around the walls

// Landscape extent — room north of the gate, then a long southern approach to the mountain
const PAD_N = 48;
const PAD_S = 220;
const PAD_EW = 96;
const WORLD_X0 = WX0 - PAD_EW;
const WORLD_X1 = WX0 + W + PAD_EW;
const WORLD_Z0 = WZ0 - PAD_N;
const WORLD_Z1 = WZ0 + L + PAD_S;

// One mountain behind the estate (south of the south wall)
const MTN_X = WX0 + Math.floor(W / 2);
const MTN_Z = WZ0 + L + 130;
const MTN_PEAK = 188;
const MTN_RX = 95;
const MTN_RZ = 120;

const beAt = new Map();
for (const be of grid.blockEntities) {
  const [sx, sy, sz] = be.pos;
  const x = WX0 + sx;
  const y = WY0 + sy;
  const z = WZ0 + sz;
  beAt.set(`${x},${y},${z}`, { ...be, x, y, z });
}

function hash2(x, z) {
  let n = (x * 374761393 + z * 668265263) | 0;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967296;
}

function smoothstep(t) {
  t = Math.max(0, Math.min(1, t));
  return t * t * (3 - 2 * t);
}

function mountainHeight(x, z) {
  const dx = (x - MTN_X) / MTN_RX;
  const dz = (z - MTN_Z) / MTN_RZ;
  const r = Math.sqrt(dx * dx + dz * dz);
  if (r >= 1.85) return 0;
  const t = 1 - r / 1.85;
  const dome = smoothstep(t);
  const spire = Math.pow(t, 1.65);
  let h = (MTN_PEAK - ESTATE_GRASS) * (0.62 * dome + 0.38 * spire);
  // Secondary shoulder ridge (west) for a prettier silhouette
  const ridge = Math.exp(-((dx + 0.42) ** 2) / 0.18 - ((dz + 0.15) ** 2) / 0.35);
  h += 28 * ridge * dome;
  // Rocky noise on the flanks
  h += 4.5 * Math.sin(x * 0.11 + z * 0.07) * Math.cos(z * 0.09) * dome;
  h += 2.2 * (hash2(x, z) - 0.5) * dome;
  return Math.max(0, h);
}

function estateBlend(x, z) {
  // 1 inside the estate footprint, 0 well outside — keeps the plateau flat under the schem
  const margin = 28;
  const ix0 = WX0 + 6;
  const ix1 = WX0 + W - 7;
  const iz0 = WZ0 + 6;
  const iz1 = WZ0 + L - 7;
  let d = 0;
  if (x < ix0) d = Math.max(d, ix0 - x);
  if (x > ix1) d = Math.max(d, x - ix1);
  if (z < iz0) d = Math.max(d, iz0 - z);
  if (z > iz1) d = Math.max(d, z - iz1);
  if (d === 0) return 1;
  return 1 - smoothstep(d / margin);
}

function plainsRipple(x, z) {
  return (
    1.6 * Math.sin(x * 0.035) * Math.cos(z * 0.028) +
    0.9 * Math.sin((x + z) * 0.02) +
    0.5 * (hash2(Math.floor(x / 3), Math.floor(z / 3)) - 0.5)
  );
}

const surfaceCache = new Map();
function surfaceY(x, z) {
  const key = `${x},${z}`;
  const hit = surfaceCache.get(key);
  if (hit !== undefined) return hit;
  const blend = estateBlend(x, z);
  const mtn = mountainHeight(x, z);
  const plains = ESTATE_GRASS + plainsRipple(x, z) * (1 - blend * 0.85);
  // Soft foothills between the south wall and the mountain
  const southDist = z - (WZ0 + L);
  let foothill = 0;
  if (southDist > 0 && southDist < 160) {
    foothill = 6 * smoothstep(southDist / 40) * (1 - smoothstep((southDist - 80) / 80));
  }
  let h = plains * blend + (plains + foothill) * (1 - blend);
  h = Math.max(h, ESTATE_GRASS + mtn);
  // Tiny tarn on the east shoulder (carved after height)
  const lx = (x - (MTN_X + 38)) / 14;
  const lz = (z - (MTN_Z - 18)) / 10;
  if (lx * lx + lz * lz < 1) {
    const lakeFloor = ESTATE_GRASS + mtn * 0.55 + 8;
    h = Math.min(h, lakeFloor);
  }
  const out = Math.round(h);
  surfaceCache.set(key, out);
  return out;
}

function slopeStone(x, z, surf) {
  const n = surfaceY(x, z - 1);
  const s = surfaceY(x, z + 1);
  const e = surfaceY(x + 1, z);
  const w = surfaceY(x - 1, z);
  const g = Math.max(Math.abs(surf - n), Math.abs(surf - s), Math.abs(surf - e), Math.abs(surf - w));
  return g >= 3;
}

// Precompute tree voxels once (lookup by x,y,z — not scanned per block)
const treeBlocks = new Map();
let treeCount = 0;
for (let z = WZ0 + L + 20; z < MTN_Z + 40; z += 4) {
  for (let x = MTN_X - 110; x < MTN_X + 110; x += 4) {
    const surf = surfaceY(x, z);
    if (surf < ESTATE_GRASS + 4 || surf > 118) continue;
    if (slopeStone(x, z, surf)) continue;
    if (hash2(x * 3, z * 5) > 0.055) continue;
    const kind = surf > 95 ? 'spruce' : 'oak';
    const th = kind === 'spruce' ? 5 + Math.floor(hash2(x, z) * 3) : 4 + Math.floor(hash2(z, x) * 2);
    const base = surf + 1;
    const log = kind === 'spruce' ? SPRUCE_LOG : OAK_LOG;
    const leaf = kind === 'spruce' ? SPRUCE_LEAVES : OAK_LEAVES;
    for (let dy = 0; dy <= th; dy++) treeBlocks.set(`${x},${base + dy},${z}`, log);
    for (let dy = th - 2; dy <= th + 1; dy++) {
      const r = dy >= th ? 1 : 2;
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (dx === 0 && dz === 0 && dy <= th) continue;
          if (Math.abs(dx) === r && Math.abs(dz) === r && (dy === th + 1 || hash2(x + dx, z + dz) > 0.5)) continue;
          const key = `${x + dx},${base + dy},${z + dz}`;
          if (!treeBlocks.has(key)) treeBlocks.set(key, leaf);
        }
      }
    }
    treeCount++;
  }
}

function terrainColumn(x, y, z) {
  const surf = surfaceY(x, z);
  // Alpine tarn water
  const lx = (x - (MTN_X + 38)) / 14;
  const lz = (z - (MTN_Z - 18)) / 10;
  const inTarn = lx * lx + lz * lz < 1;
  const waterY = ESTATE_GRASS + Math.floor(mountainHeight(MTN_X + 38, MTN_Z - 18) * 0.55) + 10;

  if (inTarn && y <= waterY && y > surf) return WATER;
  if (y > surf) {
    const tree = treeBlocks.get(`${x},${y},${z}`);
    if (tree) return tree;
    if (y === surf + 1 && surf >= 145 && !slopeStone(x, z, surf) && hash2(x, z) > 0.35) return SNOW_LAYER;
    return AIR;
  }
  if (y <= -64) return BEDROCK;
  if (y === surf) {
    if (inTarn && surf < waterY) return DIRT;
    if (slopeStone(x, z, surf) || surf >= 125) {
      const n = hash2(x, z);
      if (surf >= 155) return SNOW;
      if (n < 0.2) return ANDESITE;
      if (n < 0.35) return DIORITE;
      if (n < 0.42) return CALCITE;
      return STONE;
    }
    if (surf >= 140) return SNOW;
    if (surf >= 128) return GRASS_SNOW;
    return GRASS;
  }
  if (y >= surf - 3) return DIRT;
  const depth = surf - y;
  const n = hash2(x + y * 3, z - y);
  if (depth < 12 && n < 0.08) return ANDESITE;
  if (depth < 18 && n < 0.04) return DIORITE;
  if (surf > 140 && depth < 8 && n < 0.12) return CALCITE;
  return STONE;
}

function blockAt(x, y, z) {
  const sx = x - WX0;
  const sy = y - WY0;
  const sz = z - WZ0;
  if (sx >= 0 && sy >= 0 && sz >= 0 && sx < W && sy < H && sz < L) {
    const s = grid.get(sx, sy, sz);
    if (s && s !== AIR) return s;
    // Above schem air: stay air so roofs / courtyards stay open
    // Below / beside empty schem cells: fill with landscape so the plateau is solid
    const localGrass = 6; // GY+UNDER
    if (sy > localGrass) return AIR;
  }
  return terrainColumn(x, y, z);
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

function biomeAt(x, z) {
  const mtn = mountainHeight(x, z);
  if (mtn > 90) return 'minecraft:frozen_peaks';
  if (mtn > 45) return 'minecraft:stony_peaks';
  if (mtn > 15) return 'minecraft:windswept_hills';
  if (mtn > 4) return 'minecraft:grove';
  return 'minecraft:plains';
}

function writeChunk(cx, cz) {
  const sections = [];
  const heights = new Array(256).fill(-64);
  const entities = [];
  // Cover bedrock (−64) up through mountain peak (~188) → sections −4 .. 12
  for (let sy = -4; sy <= 12; sy++) {
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
          if (state.startsWith('energizedpower:')) {
            const id = state.includes('[') ? state.slice(0, state.indexOf('[')) : state;
            entities.push({
              id: { type: 'string', value: id },
              x: { type: 'int', value: x },
              y: { type: 'int', value: y },
              z: { type: 'int', value: z },
            });
          }
          const be = beAt.get(`${x},${y},${z}`);
          if (be) {
            const ent = {
              id: { type: 'string', value: be.id },
              x: { type: 'int', value: x },
              y: { type: 'int', value: y },
              z: { type: 'int', value: z },
            };
            if (be.tags) {
              for (const tag of be.tags) {
                if (tag.type === 'byte') ent[tag.name] = { type: 'byte', value: tag.value };
                else if (tag.type === 'int') ent[tag.name] = { type: 'int', value: tag.value };
                else if (tag.type === 'string') ent[tag.name] = { type: 'string', value: tag.value };
              }
            }
            if (be.items && be.items.length) {
              ent.Items = {
                type: 'list',
                value: {
                  type: 'compound',
                  value: be.items.map((item) => ({
                    Slot: { type: 'byte', value: item.slot },
                    id: { type: 'string', value: item.id },
                    count: { type: 'int', value: item.count },
                  })),
                },
              };
            }
            entities.push(ent);
          }
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
      DataVersion: { type: 'int', value: 5023 },
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
      block_entities: entities.length ? { type: 'list', value: { type: 'compound', value: entities } } : empty(),
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
    const total = 4 + length;
    const count = Math.ceil(total / 4096);
    const body = Buffer.alloc(count * 4096);
    body.writeUInt32BE(length, 0);
    body[4] = 2;
    nbtBuf.copy(body, 5);
    parts.push(body);
    const loc = ((cx & 31) + (cz & 31) * 32) * 4;
    header.writeUInt32BE((sector << 8) | count, loc);
    sector += count;
  }
  return Buffer.concat(parts);
}

console.log('building landscape… mountain peak', MTN_PEAK, 'at', [MTN_X, MTN_Z]);
console.log('world bounds', [WORLD_X0, WORLD_Z0], '→', [WORLD_X1, WORLD_Z1]);

if (existsSync(WORLD)) rmSync(WORLD, { recursive: true, force: true });
cpSync(SRC, WORLD, { recursive: true });
rmSync(`${WORLD}/playerdata`, { recursive: true, force: true });
rmSync(`${WORLD}/players/data`, { recursive: true, force: true });
rmSync(`${WORLD}/dimensions/minecraft/overworld/region`, { recursive: true, force: true });
mkdirSync(`${WORLD}/dimensions/minecraft/overworld/region`, { recursive: true });
mkdirSync(`${WORLD}/data/minecraft`, { recursive: true });

const regions = new Map();
let chunkCount = 0;
const cx0 = Math.floor(WORLD_X0 / 16);
const cx1 = Math.floor(WORLD_X1 / 16);
const cz0 = Math.floor(WORLD_Z0 / 16);
const cz1 = Math.floor(WORLD_Z1 / 16);
for (let cz = cz0; cz <= cz1; cz++) {
  for (let cx = cx0; cx <= cx1; cx++) {
    const key = `${cx >> 5},${cz >> 5}`;
    if (!regions.has(key)) regions.set(key, []);
    const compressed = deflateSync(nbt.writeUncompressed(writeChunk(cx, cz), 'big'));
    regions.get(key).push([cx, cz, compressed]);
    chunkCount++;
    if (chunkCount % 100 === 0) console.log('  chunks', chunkCount);
  }
}
for (const [key, chunks] of regions) {
  const [rx, rz] = key.split(',').map(Number);
  writeFileSync(`${WORLD}/dimensions/minecraft/overworld/region/r.${rx}.${rz}.mca`, writeRegion(chunks));
}

const spawnX = WX0 + Math.floor(W / 2);
const spawnY = 66;
const spawnZ = WZ0 + 4;

const levelBuf = gunzipSync(readFileSync(`${SRC}/level.dat`));
const { parsed: level } = await nbt.parse(levelBuf);
const data = level.value.Data.value;
data.LevelName.value = 'Ironcrest Estate';
data.spawn.value.pos.value = [spawnX, spawnY, spawnZ];
data.spawn.value.yaw.value = 0; // face +Z into the estate
data.spawn.value.pitch.value = 0;
data.GameType.value = 1;
data.allowCommands.value = 1;
delete data.Player;
if (data.Time) data.Time.value = [0, 1000];
if (data.DayTime) data.DayTime.value = [0, 1000];
writeFileSync(`${WORLD}/level.dat`, gzipSync(nbt.writeUncompressed(level, 'big')));

const genBuf = gunzipSync(readFileSync(`${SRC}/data/minecraft/world_gen_settings.dat`));
const { parsed: gen } = await nbt.parse(genBuf);
const over = gen.value.data.value.dimensions.value['minecraft:overworld'].value;
over.generator = {
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
              { height: { type: 'int', value: 123 }, block: { type: 'string', value: 'minecraft:stone' } },
              { height: { type: 'int', value: 3 }, block: { type: 'string', value: 'minecraft:dirt' } },
              { height: { type: 'int', value: 1 }, block: { type: 'string', value: 'minecraft:grass_block' } },
            ],
          },
        },
      },
    },
  },
};
gen.value.data.value.generate_structures.value = 0;
writeFileSync(`${WORLD}/data/minecraft/world_gen_settings.dat`, gzipSync(nbt.writeUncompressed(gen, 'big')));

mkdirSync(WE_SCHEMS, { recursive: true });
cpSync(SCHEM, `${WE_SCHEMS}/plot40.schem`);

console.log('world: Ironcrest Estate');
console.log('estate origin', [WX0, WY0, WZ0], 'size', W, H, L);
console.log('mountain', [MTN_X, MTN_PEAK, MTN_Z], 'trees', treeCount);
console.log('chunks', chunkCount, 'schem blocks', grid.countNonAir());
console.log('spawn', [spawnX, spawnY, spawnZ], 'facing south into the gate — mountain is beyond the south wall');
console.log('Open Minecraft → Singleplayer → Ironcrest Estate');
console.log('If pipes look dead: //schem load plot40 then //paste -e at ~[10, 58, 10] for neighbor updates');
