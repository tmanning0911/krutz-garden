// A square grass close. Kakitho's wall runs all four sides, with one gate on the north.
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { deflateSync, gunzipSync, gzipSync } from 'zlib';
import { execSync } from 'child_process';
import nbt from 'prismarine-nbt';
import { BlockGrid } from './node_modules/craftmatic/dist/schem/types.js';
import { writeSchematic } from './node_modules/craftmatic/dist/schem/write.js';
import { at, PLAN, inside, grassTop, blockCount, blockEntities } from './castle.mjs';

const HOME = process.env.HOME;
const SAVES = `${HOME}/Library/Application Support/minecraft/saves`;
const SRC = `${SAVES}/New World`;
const WORLD = `${SAVES}/Green Property`;

const minecraftOpen = /net\.minecraft|minecraft\/runtime|java-runtime-epsilon/.test(execSync('ps aux', { encoding: 'utf8' }));

const GY = 64;
const X0 = -120;
const X1 = 120;
const Z0 = -120;
const Z1 = 120;
const GATE = 0;

const BRICK = 'minecraft:bricks';
const SLAB = 'minecraft:brick_slab[type=bottom,waterlogged=false]';
const PLINTH = 'minecraft:stone_bricks';
const GRASS = 'minecraft:grass_block[snowy=false]';
const DIRT = 'minecraft:dirt';
const STONE = 'minecraft:stone';
const BEDROCK = 'minecraft:bedrock';
const AIR = 'minecraft:air';
const LANTERN = 'minecraft:lantern[hanging=false,waterlogged=false]';
const PLATE = 'minecraft:stone_pressure_plate[powered=false]';
const CABLE = 'energizedpower:copper_cable';
const PANEL = 'energizedpower:solar_panel_4';
const LAMP = 'energizedpower:powered_lamp[level=0]';
const BATTERY = 'energizedpower:battery_box[facing=south]';
function depth(x, z) {
  if (x < X0 || x > X1 || z < Z0 || z > Z1) return null;
  const d = Math.min(x - X0, X1 - x, z - Z0, Z1 - z);
  return d <= 3 ? d : null;
}
function onWall(x, z) {
  return depth(x, z) !== null;
}
function gatePassage() {
  return false;
}
const key = (x, y, z) => `${x},${y},${z}`;
const dust = new Set();
const outputDust = new Set();
const repeater = new Map();
const extra = new Map();
const cables = new Set();
const machines = new Set();
const carve = new Set();

function addDust(x, y, z) { dust.add(key(x, y, z)); }
function addOut(x, y, z) { addDust(x, y, z); outputDust.add(key(x, y, z)); }
function addCable(x, y, z) { cables.add(key(x, y, z)); }

const DOOR_X = PLAN.gateX;
const DOOR_Z = PLAN.gateZ;
const GATE_BLOCK = 'minecraft:crimson_fence_gate[facing=north,in_wall=false,open=false,powered=false]';
const PLATE_Z = [PLAN.outZ, ...PLAN.inZ];

for (const z of PLATE_Z) {
  for (let x = DOOR_X[0]; x <= 8; x++) addDust(x, 63, z);
}
for (let z = PLATE_Z[0] - 1; z >= PLAN.inZ[1]; z--) addDust(8, 63, z);
addDust(9, 63, PLAN.outZ);
carve.add(key(9, 63, PLAN.outZ + 1));
addDust(9, 62, PLAN.outZ + 1);
carve.add(key(9, 62, PLAN.outZ + 2));
addDust(9, 61, PLAN.outZ + 2);
carve.add(key(9, 61, PLAN.outZ + 1));
addDust(9, 60, PLAN.outZ + 1);
addDust(9, 60, PLAN.outZ);
addDust(9, 60, PLAN.outZ + 2);
for (const x of [8, 7]) {
  repeater.set(key(x, 60, PLAN.outZ), 'minecraft:repeater[delay=1,facing=west,locked=false,powered=false]');
}
for (let x = 6; x >= DOOR_X[0]; x--) addDust(x, 60, PLAN.outZ);
for (const x of [8, 7, 6, 5]) {
  repeater.set(key(x, 60, PLAN.outZ + 2), 'minecraft:repeater[delay=4,facing=west,locked=false,powered=false]');
}
addDust(4, 60, PLAN.outZ + 2);
addDust(4, 60, PLAN.outZ + 1);
for (const x of DOOR_X) {
  repeater.set(key(x, 60, DOOR_Z + 1), 'minecraft:repeater[delay=1,facing=north,locked=false,powered=false]');
  extra.set(key(x, 61, DOOR_Z), 'minecraft:redstone_torch[lit=true]');
  extra.set(key(x, 63, DOOR_Z), 'minecraft:redstone_torch[lit=false]');
  extra.set(key(x, GY + 1, DOOR_Z), GATE_BLOCK);
}
for (const z of PLATE_Z) {
  for (const x of DOOR_X) extra.set(key(x, GY + 1, z), PLATE);
}

const PANEL_X = PLAN.solar.x;
const PANEL_Y = PLAN.solar.y;
for (const z of PLAN.solar.z) {
  extra.set(key(PANEL_X, PANEL_Y, z), PANEL);
  machines.add(key(PANEL_X, PANEL_Y, z));
  addCable(PANEL_X, PANEL_Y - 1, z);
}
for (let y = PANEL_Y - 2; y >= 60; y--) addCable(PANEL_X, y, PLAN.solar.z[0]);
for (let z = PLAN.solar.z[0]; z <= PLAN.solar.z[0] + 7; z++) if (z !== PLAN.solar.z[0] + 4) addCable(PANEL_X, 60, z);
extra.set(key(PANEL_X, 60, PLAN.solar.z[0] + 4), BATTERY);
machines.add(key(PANEL_X, 60, PLAN.solar.z[0] + 4));
for (const z of PLAN.lamp.z) {
  extra.set(key(PLAN.lamp.x, PANEL_Y - 1, z), LAMP);
  machines.add(key(PLAN.lamp.x, PANEL_Y - 1, z));
}

for (const k of dust) {
  if (repeater.has(k) || extra.has(k) || cables.has(k) || carve.has(k)) throw new Error(`dust overlaps ${k}`);
}
for (const k of cables) {
  if (extra.has(k) || repeater.has(k) || carve.has(k)) throw new Error(`cable overlaps ${k}`);
}

function occupied(x, y, z) {
  const k = key(x, y, z);
  return dust.has(k) || repeater.has(k) || extra.has(k) || cables.has(k) || carve.has(k);
}
function solidTerrain(x, y, z) {
  if (occupied(x, y, z) || y < -64 || y > GY) return false;
  return true;
}
function wireLink(x, y, z, dx, dz) {
  const nx = x + dx;
  const nz = z + dz;
  const same = key(nx, y, nz);
  const beside = extra.get(same) || '';
  if (dust.has(same) || repeater.has(same) || beside.includes('torch')) return 'side';
  if (solidTerrain(nx, y, nz) && !solidTerrain(x, y + 1, z) && dust.has(key(nx, y + 1, nz))) return 'up';
  if (!solidTerrain(nx, y, nz) && dust.has(key(nx, y - 1, nz))) return 'side';
  return 'none';
}
function dustState(x, y, z) {
  const north = wireLink(x, y, z, 0, -1);
  const south = wireLink(x, y, z, 0, 1);
  const east = wireLink(x, y, z, 1, 0);
  const west = wireLink(x, y, z, -1, 0);
  const power = outputDust.has(key(x, y, z)) ? 15 : 0;
  return `minecraft:redstone_wire[east=${east},north=${north},power=${power},south=${south},west=${west}]`;
}
function nearPower(x, y, z) {
  return cables.has(key(x, y, z)) || machines.has(key(x, y, z));
}
function cableState(x, y, z) {
  const bit = (v) => (v ? 'true' : 'false');
  return `${CABLE}[down=${bit(nearPower(x, y - 1, z))},east=${bit(nearPower(x + 1, y, z))},north=${bit(nearPower(x, y, z - 1))},south=${bit(nearPower(x, y, z + 1))},up=${bit(nearPower(x, y + 1, z))},west=${bit(nearPower(x - 1, y, z))}]`;
}
function mechanism(x, y, z) {
  const k = key(x, y, z);
  if (carve.has(k)) return AIR;
  if (extra.has(k)) return extra.get(k);
  if (repeater.has(k)) return repeater.get(k);
  if (dust.has(k)) return dustState(x, y, z);
  if (cables.has(k)) return cableState(x, y, z);
  return undefined;
}

function blockAt(x, y, z) {
  if (y < -64 || y > 120) return AIR;
  const mech = mechanism(x, y, z);
  if (mech !== undefined) return mech;
  const built = at(x, y, z);
  if (built !== undefined) return built;
  if (inside(x, z) && y >= 64) return AIR;
  if (y === -64) return BEDROCK;
  if (y >= -63 && y <= 60) return STONE;
  const g = grassTop(z);
  if (y > g) return AIR;
  if (y === g) return GRASS;
  if (y >= 61) return DIRT;
  return STONE;
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
  return {
    id: { type: 'string', value: id },
    properties: { type: 'compound', value: props },
  };
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

const beAt = new Map(blockEntities.map((be) => [`${be.x},${be.y},${be.z}`, be]));

function writeChunk(cx, cz) {
  const sections = [];
  const heights = new Array(256).fill(-64);
  const entities = [];
  for (let sy = -4; sy <= 6; sy++) {
    const palette = [];
    const indexOf = new Map();
    const indices = new Array(4096);
    for (let ly = 0; ly < 16; ly++) {
      const y = sy * 16 + ly;
      for (let lz = 0; lz < 16; lz++) {
        for (let lx = 0; lx < 16; lx++) {
          const x = cx * 16 + lx;
          const z = cz * 16 + lz;
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
            const entry = {
              id: { type: 'string', value: be.id },
              x: { type: 'int', value: x },
              y: { type: 'int', value: y },
              z: { type: 'int', value: z },
            };
            if (be.tags) {
              for (const tag of be.tags) {
                if (tag.type === 'byte') entry[tag.name] = { type: 'byte', value: tag.value };
                else if (tag.type === 'int') entry[tag.name] = { type: 'int', value: tag.value };
                else if (tag.type === 'string') entry[tag.name] = { type: 'string', value: tag.value };
              }
            }
            if (be.customName) {
              entry.CustomName = {
                type: 'string',
                value: JSON.stringify({ text: be.customName }),
              };
            }
            if (be.items && be.items.length) {
              entry.Items = {
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
            entities.push(entry);
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
        value: { palette: { type: 'list', value: { type: 'string', value: ['minecraft:plains'] } } },
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
      block_entities: entities.length
        ? { type: 'list', value: { type: 'compound', value: entities } }
        : empty(),
      block_ticks: empty(),
      fluid_ticks: empty(),
      PostProcessing: {
        type: 'list',
        value: { type: 'list', value: Array.from({ length: 24 }, () => empty()) },
      },
      structures: {
        type: 'compound',
        value: {
          References: { type: 'compound', value: {} },
          starts: { type: 'compound', value: {} },
        },
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

function dustReach(starts) {
  const seen = new Set();
  const queue = starts.map(([x, y, z]) => key(x, y, z));
  while (queue.length) {
    const current = queue.pop();
    if (seen.has(current)) continue;
    seen.add(current);
    const [x, y, z] = current.split(',').map(Number);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const link = wireLink(x, y, z, dx, dz);
      if (link === 'none') continue;
      const nx = x + dx;
      const nz = z + dz;
      const next = link === 'up' ? key(nx, y + 1, nz) : (dust.has(key(nx, y, nz)) ? key(nx, y, nz) : key(nx, y - 1, nz));
      if (dust.has(next) && !seen.has(next)) queue.push(next);
    }
  }
  return seen;
}
function auditGate() {
  const fail = (msg) => { throw new Error(`gate circuit: ${msg}`); };
  const plates = [];
  for (const z of PLATE_Z) {
    for (const x of DOOR_X) {
      if (extra.get(key(x, GY + 1, z)) !== PLATE) fail(`missing plate ${x},${z}`);
      const floor = blockAt(x, GY, z);
      if (z === PLAN.outZ) {
        if (floor !== GRASS) fail(`outside plate ${x},${z} is on ${floor}`);
      } else if (!floor || floor === AIR || floor === GRASS) fail(`inside plate ${x},${z} is on ${floor}`);
      if (!dust.has(key(x, 63, z))) fail(`no dust under plate ${x},${z}`);
      plates.push([x, 63, z]);
    }
  }
  if (!String(blockAt(DOOR_X[0], 65, DOOR_Z)).includes('fence_gate')) fail('the red gate is missing');
  for (const z of [91, 88, 85, 80]) {
    if (blockAt(4, 66, z) !== AIR || blockAt(4, 67, z) !== AIR) fail(`the gate passage is blocked at z=${z}`);
  }
  if (!String(blockAt(4, 68, 104)).includes('chiseled')) fail('the carved screen wall is missing');
  if (!String(blockAt(-52, 70, 0)).includes('andesite') && !String(blockAt(-52, 70, 0)).includes('stone') && !String(blockAt(-52, 70, 0)).includes('cobble')) fail('the grey brick west wall is missing');
  if (!String(blockAt(0, 70, -90)).includes('andesite') && !String(blockAt(0, 70, -90)).includes('stone') && !String(blockAt(0, 70, -90)).includes('cobble')) fail('the grey brick north wall is missing');
  if (!String(blockAt(12, 64, 79)).includes('stairs')) fail('the stair onto the wall is missing');
  if (!String(blockAt(7, 65, 76)).includes('door')) fail('the courtyard door is missing');
  if (!String(blockAt(27, 65, 78)).includes('crimson_door')) fail('the red lacquer door is missing');
  if (blockAt(10, 66, 52) !== AIR) fail('the cave hall cannot be walked into');
  if (!String(blockAt(13, 67, 55)).includes('lantern')) fail('the cave hall is dark');
  if (!String(blockAt(4, 79, 87)).includes('andesite_stairs')) fail('the grey tile roof is missing');
  if (!String(blockAt(4, 64, 70)).includes('cobble') && !String(blockAt(4, 64, 70)).includes('stone')) fail('Dragon Scale Street is not cobbled');
  if (!String(blockAt(2, 65, 95)).includes('crimson')) fail('the red lacquer gate pillars are missing');
  if (blockAt(PANEL_X, PANEL_Y, PLAN.solar.z[0]) !== PANEL) fail('solar panels are not in the wall walk');
  if (blockAt(PANEL_X, PANEL_Y + 1, PLAN.solar.z[0]) !== AIR) fail('solar panels have no sky');
  if (!String(blockAt(PANEL_X, PANEL_Y - 1, PLAN.solar.z[0])).startsWith(CABLE)) fail('solar panels are not sitting on cable');
  if (blockAt(4, GY, 112) !== GRASS) fail('the approach is not grass');
  for (const x of DOOR_X) {
    const lower = extra.get(key(x, 61, DOOR_Z)) || '';
    const upper = extra.get(key(x, 63, DOOR_Z)) || '';
    if (!lower.includes('lit=true')) fail(`lower torch ${x} is not holding the gate shut`);
    if (!upper.includes('lit=false')) fail(`gate torch ${x} is missing`);
    if (dust.has(key(x, 63, DOOR_Z - 1)) || dust.has(key(x, 63, DOOR_Z + 1))) fail(`gate torch ${x} touches input dust`);
    if (occupied(x, 62, DOOR_Z) || occupied(x, 60, DOOR_Z)) fail(`gate ${x} support is not solid`);
  }
  const input = dustReach(plates);
  if (!input.has(key(9, 60, PLAN.outZ))) fail('plates do not reach the repeater');
  const sides = ['8,60,91', '7,60,91', '8,60,93', '7,60,93', '6,60,93', '5,60,93', ...DOOR_X.map((x) => `${x},60,${DOOR_Z + 1}`)];
  for (const cell of sides) {
    const [x, y, z] = cell.split(',').map(Number);
    const facing = repeater.get(key(x, y, z)) || '';
    if (!facing) fail(`repeater ${cell} is missing`);
    const dirs = facing.includes('facing=west') || facing.includes('facing=east') ? [[0, -1], [0, 1]] : [[1, 0], [-1, 0]];
    for (const [dx, dz] of dirs) {
      if (dust.has(key(x + dx, y, z + dz))) fail(`repeater ${cell} is locked by dust`);
    }
  }
  const passable = (x, y, z) => {
    const s = blockAt(x, y, z) || AIR;
    return s === AIR || s.includes('door') || s.includes('fence_gate') || s.includes('pressure_plate') || s.includes('lantern') || s.includes('glass_pane');
  };
  const start = key(4, 65, 100);
  const goal = key(10, 65, 52);
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length && !seen.has(goal)) {
    const current = queue.shift();
    const [x, y, z] = current.split(',').map(Number);
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]]) {
      const nx = x + dx;
      const ny = y + dy;
      const nz = z + dz;
      if (ny < 65 || ny > 90 || Math.abs(nx) > 60 || Math.abs(nz) > 120) continue;
      const next = key(nx, ny, nz);
      if (seen.has(next)) continue;
      if (!passable(nx, ny, nz) || !passable(nx, ny + 1, nz)) continue;
      const below = blockAt(nx, ny - 1, nz) || AIR;
      if (below === AIR || below.includes('lantern') || below.includes('glass_pane')) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  if (!seen.has(goal)) fail('the cave hall cannot be reached from the grass');
  if (!String(blockAt(13, 64, 70)).includes('hydroponics_bed')) fail('the wheat kitchen garden is missing');
  if (!String(blockAt(27, 64, 70)).includes('hydroponics_bed')) fail('the carrot kitchen garden is missing');
  if (!String(blockAt(-19, 64, 70)).includes('hydroponics_bed')) fail('the potato kitchen garden is missing');
  if (!String(blockAt(-6, 64, 70)).includes('hydroponics_bed')) fail('the beetroot kitchen garden is missing');
  if (!String(blockAt(13, 62, 70)).includes('item_pipe')) fail('the buried item extract under the wheat bed is missing');
  if (!String(blockAt(5, 62, 60)).includes('item_pipe')) fail('the buried item spine under the street is missing');
  if (!String(blockAt(11, 65, 49)).includes('barrel')) fail('the pantry wheat barrel is missing');
  if (!String(blockAt(17, 65, 49)).includes('barrel')) fail('the pantry beetroot barrel is missing');
  if (!String(blockAt(11, 63, 49)).includes('item_pipe')) fail('the pantry insert pipe is missing');
  if (!String(blockAt(15, 64, 70)).includes('liquid_tank')) fail('the wheat garden water tank is missing');
  const bedEnts = blockEntities.filter((e) => e.id === 'hydrofarm:hydroponics_bed');
  if (bedEnts.length < 16) fail(`expected 16 planted beds, got ${bedEnts.length}`);
  if (!bedEnts.every((e) => e.tags?.some((t) => t.name === 'Installed_0' && t.value === 1))) {
    fail('hydroponics beds are missing installed planters');
  }
  console.log('gate circuit ok');
}
auditGate();

const [spawnX, spawnY, spawnZ] = PLAN.spawn;
let chunkCount = 0;
if (minecraftOpen) {
  console.log('Minecraft is open, so the world file was left alone');
} else {
const regions = new Map();
for (let cz = Math.floor(Z0 / 16) - 1; cz <= Math.floor(Z1 / 16) + 1; cz++) {
  for (let cx = Math.floor(X0 / 16) - 1; cx <= Math.floor(X1 / 16) + 1; cx++) {
    const key = `${cx >> 5},${cz >> 5}`;
    if (!regions.has(key)) regions.set(key, []);
    const compressed = deflateSync(nbt.writeUncompressed(writeChunk(cx, cz), 'big'));
    regions.get(key).push([cx, cz, compressed]);
    chunkCount++;
  }
}
mkdirSync(`${WORLD}/data/minecraft`, { recursive: true });
mkdirSync(`${WORLD}/dimensions/minecraft/overworld/region`, { recursive: true });
for (const [key, chunks] of regions) {
  const [rx, rz] = key.split(',').map(Number);
  const file = `${WORLD}/dimensions/minecraft/overworld/region/r.${rx}.${rz}.mca`;
  writeFileSync(file, writeRegion(chunks));
}

const levelBuf = gunzipSync(readFileSync(`${SRC}/level.dat`));
const { parsed: level } = await nbt.parse(levelBuf);
const data = level.value.Data.value;
data.LevelName.value = 'Green Property';
data.spawn.value.pos.value = [spawnX, spawnY, spawnZ];
data.spawn.value.yaw.value = 180;
data.spawn.value.pitch.value = 0;
data.GameType.value = 0;
data.allowCommands.value = 1;
delete data.Player;
if (data.Time) data.Time.value = [0, 1000];
if (data.DayTime) data.DayTime.value = [0, 1000];
if (data.DataPacks?.value?.Enabled?.value?.value) {
  data.DataPacks.value.Enabled.value.value = data.DataPacks.value.Enabled.value.value.filter((id) => !String(id).includes('cottage'));
}
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
              { height: { type: 'int', value: 124 }, block: { type: 'string', value: 'minecraft:stone' } },
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

rmSync(`${WORLD}/playerdata`, { recursive: true, force: true });
rmSync(`${WORLD}/players/data`, { recursive: true, force: true });
}
const width = X1 - X0 + 1;
const zSchem0 = Z0 - 16;
const length = Z1 - zSchem0 + 1;
const ySchem0 = 60;
const yTop = 110;
const height = yTop - ySchem0 + 1;
const grid = new BlockGrid(width, height, length);
for (let z = zSchem0; z <= Z1; z++) {
  for (let x = X0; x <= X1; x++) {
    for (let y = ySchem0; y <= yTop; y++) {
      const state = blockAt(x, y, z);
      if (state !== AIR) grid.set(x - X0, y - ySchem0, z - zSchem0, state);
    }
  }
}
for (const be of blockEntities) {
  const sx = be.x - X0;
  const sy = be.y - ySchem0;
  const sz = be.z - zSchem0;
  if (sx < 0 || sy < 0 || sz < 0 || sx >= width || sy >= height || sz >= length) continue;
  const entry = { pos: [sx, sy, sz], id: be.id };
  if (be.tags) entry.tags = be.tags;
  if (be.customName) entry.tags = [...(entry.tags || []), { type: 'string', name: 'CustomName', value: JSON.stringify({ text: be.customName }) }];
  if (be.items) entry.items = be.items;
  grid.blockEntities.push(entry);
}
writeSchematic(grid, 'green_property.schem', 5023);

const sample = writeChunk(0, Math.floor(Z0 / 16));
const back = await nbt.parse(nbt.writeUncompressed(sample, 'big'));
const top = back.parsed.value.sections.value.value.find((s) => s.Y.value === 4);
const names = top.block_states.value.palette.value.value.map((e) => e.id?.value || e['']?.value);
console.log('world Green Property');
console.log('lawn', width, 'by', Z1 - Z0 + 1, 'chunks', chunkCount);
console.log('castle blocks', blockCount);
console.log('farm entities', blockEntities.length);
console.log('spawn', [spawnX, spawnY, spawnZ], 'facing the south gate');
console.log('section palette', names.join(', '));
console.log('schematic blocks', grid.countNonAir());
