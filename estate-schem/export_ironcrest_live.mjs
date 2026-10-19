// Snapshot the live Ironcrest Estate world (including in-game edits) → live_ironcrest.schem
import { readFileSync, existsSync, readdirSync } from 'fs';
import { inflateSync, gunzipSync } from 'zlib';
import nbt from 'prismarine-nbt';
import { BlockGrid } from './node_modules/craftmatic/dist/schem/types.js';
import { writeSchematic } from './node_modules/craftmatic/dist/schem/write.js';

const WORLD = `${process.env.HOME}/Library/Application Support/minecraft/saves/Ironcrest Estate`;
const REG = `${WORLD}/dimensions/minecraft/overworld/region`;

// Same footprint as the paste
const WX0 = 0;
const WY0 = 58;
const WZ0 = 0;
const W = 162;
const H = 57;
const L = 162;

function stateFromEntry(e) {
  // 26.3 single-block sections store a bare string; multi-block use {id, properties}
  if (typeof e === 'string') return e;
  const name = e?.id?.value || e?.Name?.value || e?.['']?.value;
  if (!name) return 'minecraft:air';
  let id = name;
  const props = e.properties?.value;
  if (props && Object.keys(props).length) {
    const body = Object.entries(props)
      .map(([k, v]) => `${k}=${v.value}`)
      .join(',');
    id += `[${body}]`;
  }
  return id;
}

function readLong(word) {
  if (typeof word === 'bigint') return word < 0n ? word + (1n << 64n) : word;
  if (Array.isArray(word)) {
    const his = BigInt(word[0]);
    const los = BigInt(word[1]);
    const uhi = his < 0n ? his + 0x100000000n : his;
    const ulo = los < 0n ? los + 0x100000000n : los;
    return ((uhi & 0xffffffffn) << 32n) | (ulo & 0xffffffffn);
  }
  return BigInt(word);
}

function paletteIndex(data, paletteSize, idx) {
  if (paletteSize <= 1) return 0;
  const bits = Math.max(4, Math.ceil(Math.log2(paletteSize)));
  const per = Math.floor(64 / bits);
  const longIndex = Math.floor(idx / per);
  const bitIndex = (idx % per) * bits;
  const word = readLong(data[longIndex]);
  const mask = (1n << BigInt(bits)) - 1n;
  return Number((word >> BigInt(bitIndex)) & mask);
}

async function loadChunk(cx, cz) {
  const rx = cx >> 5;
  const rz = cz >> 5;
  const path = `${REG}/r.${rx}.${rz}.mca`;
  if (!existsSync(path)) return null;
  const buf = readFileSync(path);
  const i = ((cx & 31) + (cz & 31) * 32) * 4;
  const loc = buf.readUInt32BE(i);
  if (!loc) return null;
  const offset = (loc >> 8) * 4096;
  const len = buf.readUInt32BE(offset);
  const compression = buf[offset + 4];
  const data = buf.subarray(offset + 5, offset + 4 + len);
  const raw = compression === 2 ? inflateSync(data) : gunzipSync(data);
  return (await nbt.parse(raw)).parsed.value;
}

function blockAt(chunk, x, y, z) {
  if (!chunk) return 'minecraft:air';
  const sections = chunk.sections?.value?.value || [];
  const sy = Math.floor(y / 16);
  const sec = sections.find((s) => s.Y.value === sy);
  if (!sec?.block_states?.value) return 'minecraft:air';
  const pal = sec.block_states.value.palette.value.value;
  const lx = x & 15;
  const ly = y & 15;
  const lz = z & 15;
  const idx = ly * 256 + lz * 16 + lx;
  if (pal.length === 1) return stateFromEntry(pal[0]);
  const data = sec.block_states.value.data?.value;
  if (!data) return stateFromEntry(pal[0]);
  const pid = paletteIndex(data, pal.length, idx);
  return stateFromEntry(pal[pid] || pal[0]);
}

const chunkCache = new Map();
async function worldBlock(x, y, z) {
  const cx = Math.floor(x / 16);
  const cz = Math.floor(z / 16);
  const key = `${cx},${cz}`;
  if (!chunkCache.has(key)) chunkCache.set(key, await loadChunk(cx, cz));
  return blockAt(chunkCache.get(key), x, y, z);
}

const grid = new BlockGrid(W, H, L);
let nonAir = 0;
let windows = 0;
for (let y = 0; y < H; y++) {
  for (let z = 0; z < L; z++) {
    for (let x = 0; x < W; x++) {
      const state = await worldBlock(WX0 + x, WY0 + y, WZ0 + z);
      if (!state || state === 'minecraft:air' || state === 'minecraft:cave_air') continue;
      // Skip flat-world filler under the estate
      if (state === 'minecraft:bedrock') continue;
      if ((state === 'minecraft:stone' || state === 'minecraft:dirt') && y < 5) continue;
      grid.set(x, y, z, state);
      nonAir++;
      if (state.includes('blackstone_window')) windows++;
    }
  }
}

writeSchematic(grid, 'live_ironcrest.schem', 5023);
console.log('live_ironcrest.schem');
console.log('size', W, H, L, 'blocks', nonAir, 'blackstone_windows', windows);
