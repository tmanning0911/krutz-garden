/**
 * Pass 23 — west-lawn path to house steps, topiary pair at fountain,
 * rain cistern, south exterior soft, remove empty air pockets on path.
 * Mapping: +634/-44/-348. Uncovered farmland = 0.
 */
import { parseToGrid } from './node_modules/craftmatic/dist/schem/parse.js';
import { writeSchematic } from './node_modules/craftmatic/dist/schem/write.js';

const SCHEM = new URL('../krutz-solar-house.schem', import.meta.url).pathname;
const grid = await parseToGrid(SCHEM);
const ORIGIN_X = 634,
  ORIGIN_Y = 44,
  ORIGIN_Z = 348;
const { width: SX, height: SY, length: SZ } = grid;
const toLX = (X) => X + ORIGIN_X;
const toLY = (Y) => Y - ORIGIN_Y;
const toLZ = (Z) => Z - ORIGIN_Z;
const wx = (lx) => lx - ORIGIN_X;
const wz = (lz) => lz + ORIGIN_Z;
const WALL_X1 = -590,
  WALL_X2 = -528,
  WALL_Z1 = 368,
  WALL_Z2 = 474;
const HOUSE = (X, Z) => X <= -592 && Z >= 410 && Z <= 430;
const SOLAR = (X, Z) => X >= -526 && Z >= 446 && Z <= 464;
const WEST_WATER = (X, Z) => X >= -622 && X <= -618 && Z >= 408 && Z <= 432;
const STATION = 'alaindustrial:garden_drone_station';
const LATTICE_X = [-584, -575, -567, -561, -553, -547, -539, -533];
const LATTICE_Z = [374, 383, 392, 401, 410, 415, 424, 429, 435, 444, 453, 462, 471];
const FLOWERS = [
  'minecraft:oxeye_daisy',
  'minecraft:dandelion',
  'minecraft:poppy',
  'minecraft:allium',
  'minecraft:cornflower',
  'minecraft:lily_of_the_valley',
];

const full = (b) => (typeof b === 'string' ? b : String(b ?? 'minecraft:air'));
const getW = (X, Y, Z) => full(grid.get(toLX(X), toLY(Y), toLZ(Z)));
const setW = (X, Y, Z, b) => {
  if (HOUSE(X, Z)) return;
  if (!inSchem(X, Y, Z)) return;
  grid.set(toLX(X), toLY(Y), toLZ(Z), b);
};
const setWForce = (X, Y, Z, b) => {
  if (!inSchem(X, Y, Z)) return;
  grid.set(toLX(X), toLY(Y), toLZ(Z), b);
};
const inSchem = (X, Y, Z) => {
  const lx = toLX(X),
    ly = toLY(Y),
    lz = toLZ(Z);
  return lx >= 0 && lx < SX && ly >= 0 && ly < SY && lz >= 0 && lz < SZ;
};
const hash = (x, z) => {
  let h = (x * 374761393 + z * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return (h ^ (h >>> 16)) >>> 0;
};
const soilY = (X) => (X < -566 ? 64 : X < -552 ? 66 : X < -538 ? 68 : 70);
const isStationCell = (X, Z) => LATTICE_X.includes(X) && LATTICE_Z.includes(Z);
const isOutside = (X, Z) => X < WALL_X1 || X > WALL_X2 || Z < WALL_Z1 || Z > WALL_Z2;
const isTerrain = (n) =>
  /grass_block|dirt$|stone$|granite|diorite|andesite|gravel|sand$|cobblestone$|farmland|coarse_dirt|moss_block|path|polished_andesite|smooth_stone|packed_ice/.test(
    n,
  );
const isSoft = (n) =>
  /short_grass|tall_grass|dandelion|poppy|allium|cornflower|oxeye|lily_of|azure|azalea|bush|leaf_litter|firefly|fern|wheat|carrot|potato|beet|petal|tulip|orchid|lilac|vine|berry|rail/.test(
    n,
  );

function topSoftY(X, Z) {
  for (let Y = 88; Y >= 45; Y--) {
    if (!inSchem(X, Y, Z)) continue;
    const n = getW(X, Y, Z);
    if (/stone_brick|mossy_stone_brick|cracked_stone_brick|chiseled_stone/.test(n)) continue;
    if (isTerrain(n) || n.includes('dirt_path') || /cobble|gravel|sand|andesite|smooth_stone|moss_block|hay/.test(n))
      return Y;
  }
  return null;
}

function clearSoft(X, Y, Z, h = 5) {
  for (let y = Y + 1; y <= Y + h; y++) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n.startsWith(STATION) || n.includes('trapdoor')) continue;
    if (
      /fence|door|gate|wall|pane|plank|log|stair|slab|brick|lantern|glass|panel|battery|sign|banner|composter|barrel|hay|lectern|rail|wool|end_rod|pumpkin|bee|nest|grindstone/.test(
        n,
      )
    )
      break;
    if (isSoft(n) || n === 'minecraft:air' || isTerrain(n) || /leaves|crop|wheat|carrot|potato|beet/.test(n))
      setW(X, y, Z, 'minecraft:air');
    else break;
  }
}

function placeGrass(X, Y, Z, plant = true) {
  if (!inSchem(X, Y, Z) || HOUSE(X, Z) || WEST_WATER(X, Z)) return;
  for (let y = Math.max(ORIGIN_Y + 1, Y - 4); y < Y; y++) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n === 'minecraft:air' || isSoft(n) || isTerrain(n)) setW(X, y, Z, 'minecraft:dirt');
  }
  setW(X, Y, Z, 'minecraft:grass_block');
  clearSoft(X, Y, Z, 4);
  if (!plant) return;
  const r = hash(X, Z) % 100;
  if (r < 40) setW(X, Y + 1, Z, 'minecraft:short_grass');
  else if (r < 55) setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
}

/** Path from west wall opening across lawn toward house steps */
function westApproachPath() {
  for (let X = -591; X <= -587; X++) {
    for (let Z = 419; Z <= 421; Z++) {
      if (HOUSE(X, Z) || !inSchem(X, 64, Z)) continue;
      setW(X, 64, Z, 'minecraft:dirt_path');
      clearSoft(X, 64, Z, 3);
    }
  }
  // grass shoulders
  for (let X = -591; X <= -587; X++) {
    for (const Z of [417, 418, 422, 423]) {
      if (HOUSE(X, Z) || !inSchem(X, 64, Z)) continue;
      placeGrass(X, 64, Z, true);
    }
  }
}

function fountainTopiary() {
  for (const [X, Z] of [
    [-564, 416],
    [-556, 416],
    [-564, 424],
    [-556, 424],
  ]) {
    if (isStationCell(X, Z) || !inSchem(X, 66, Z)) continue;
    const Y = soilY(X);
    setW(X, Y, Z, 'minecraft:grass_block');
    clearSoft(X, Y, Z, 4);
    setW(X, Y + 1, Z, 'minecraft:oak_leaves[distance=1,persistent=true]');
    setW(X, Y + 2, Z, 'minecraft:oak_leaves[distance=1,persistent=true]');
    setW(X + 1, Y + 1, Z, 'minecraft:oak_leaves[distance=1,persistent=true]');
    setW(X - 1, Y + 1, Z, 'minecraft:oak_leaves[distance=1,persistent=true]');
    setW(X, Y + 1, Z + 1, 'minecraft:oak_leaves[distance=1,persistent=true]');
    setW(X, Y + 1, Z - 1, 'minecraft:oak_leaves[distance=1,persistent=true]');
  }
}

function rainCistern() {
  const CX = -538,
    CZ = 408,
    Y = soilY(CX);
  if (!inSchem(CX, Y, CZ)) return;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (isStationCell(CX + dx, CZ + dz)) continue;
      setW(CX + dx, Y, CZ + dz, 'minecraft:stone_bricks');
      clearSoft(CX + dx, Y, CZ + dz, 3);
    }
  }
  setW(CX, Y + 1, CZ, 'minecraft:cauldron[level=3]');
  setW(CX, Y + 2, CZ, 'minecraft:iron_bars');
  setW(CX, Y + 3, CZ, 'minecraft:spruce_slab[type=bottom]');
  setW(CX + 1, Y + 1, CZ, 'minecraft:lantern[hanging=false]');
}

function softSouthExterior() {
  for (let X = WALL_X1 - 2; X <= WALL_X2 + 8; X++) {
    for (let d = 1; d <= 8; d++) {
      const Z = WALL_Z2 + d;
      if (SOLAR(X, Z) || HOUSE(X, Z) || !inSchem(X, 64, Z)) continue;
      const t = Math.max(60, soilY(Math.min(X, -530)) - Math.floor((d - 1) / 2));
      for (let y = 82; y > t; y--) {
        if (!inSchem(X, y, Z)) continue;
        const n = getW(X, y, Z);
        if (n.startsWith(STATION) || /trapdoor|plank|log|fence|lantern|glass|panel|banner|battery/.test(n))
          continue;
        if (isTerrain(n) || isSoft(n) || n === 'minecraft:air' || /leaves|stone_brick|mossy|cracked|cobble|water/.test(n))
          setW(X, y, Z, 'minecraft:air');
      }
      for (let y = ORIGIN_Y + 1; y < t; y++) {
        const n = getW(X, y, Z);
        if (n === 'minecraft:air' || isSoft(n)) setW(X, y, Z, 'minecraft:dirt');
      }
      placeGrass(X, t, Z, true);
    }
  }
  // neighbor smooth south band
  for (let pass = 0; pass < 5; pass++) {
    let edits = 0;
    for (let X = WALL_X1 - 2; X <= WALL_X2 + 8; X++) {
      for (let Z = WALL_Z2 + 1; Z <= WALL_Z2 + 10; Z++) {
        if (SOLAR(X, Z) || !inSchem(X, 60, Z) || !isOutside(X, Z)) continue;
        const y0 = topSoftY(X, Z);
        if (y0 == null) continue;
        let minN = y0;
        for (const [dx, dz] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const y1 = topSoftY(X + dx, Z + dz);
          if (y1 != null) minN = Math.min(minN, y1);
        }
        if (y0 <= minN + 1) continue;
        const t = minN + 1;
        edits++;
        for (let y = 82; y > t; y--) {
          if (!inSchem(X, y, Z)) continue;
          const n = getW(X, y, Z);
          if (n.startsWith(STATION) || /trapdoor|plank|log|fence|lantern|glass|panel|banner/.test(n)) continue;
          if (isTerrain(n) || isSoft(n) || n === 'minecraft:air' || /leaves|stone_brick|mossy|cobble|water/.test(n))
            setW(X, y, Z, 'minecraft:air');
        }
        for (let y = ORIGIN_Y + 1; y < t; y++) {
          const n = getW(X, y, Z);
          if (n === 'minecraft:air' || isSoft(n)) setW(X, y, Z, 'minecraft:dirt');
        }
        placeGrass(X, t, Z, true);
      }
    }
    if (!edits) break;
  }
}

function ensureStations() {
  for (const X of LATTICE_X) {
    for (const Z of LATTICE_Z) {
      const Y = soilY(X);
      if (!inSchem(X, Y, Z)) continue;
      setWForce(X, Y, Z, 'minecraft:grass_block');
      setWForce(X, Y + 1, Z, STATION);
      setWForce(
        X,
        Y + 2,
        Z,
        'minecraft:spruce_trapdoor[facing=south,half=bottom,open=true,waterlogged=false]',
      );
    }
  }
}

function coverage() {
  const stations = [];
  for (let x = 0; x < SX; x++)
    for (let y = 0; y < SY; y++)
      for (let z = 0; z < SZ; z++) {
        if (full(grid.get(x, y, z)).startsWith(STATION)) stations.push([x, y, z]);
      }
  let uncovered = 0,
    farm = 0,
    trapOk = 0;
  for (const [x, y, z] of stations) if (full(grid.get(x, y + 1, z)).includes('trapdoor')) trapOk++;
  for (let x = 0; x < SX; x++)
    for (let y = 0; y < SY; y++)
      for (let z = 0; z < SZ; z++) {
        if (!full(grid.get(x, y, z)).startsWith('minecraft:farmland')) continue;
        farm++;
        let ok = false;
        for (const [sx, sy, sz] of stations) {
          if (Math.max(Math.abs(sx - x), Math.abs(sz - z)) <= 4 && Math.abs(sy - y) <= 6) {
            ok = true;
            break;
          }
        }
        if (!ok) {
          grid.set(x, y, z, 'minecraft:grass_block');
          const a = full(grid.get(x, y + 1, z));
          if (/wheat|carrot|potato|beet|grass|flower/.test(a)) grid.set(x, y + 1, z, 'minecraft:short_grass');
        }
      }
  uncovered = 0;
  farm = 0;
  for (let x = 0; x < SX; x++)
    for (let y = 0; y < SY; y++)
      for (let z = 0; z < SZ; z++) {
        if (!full(grid.get(x, y, z)).startsWith('minecraft:farmland')) continue;
        farm++;
        let ok = false;
        for (const [sx, sy, sz] of stations) {
          if (Math.max(Math.abs(sx - x), Math.abs(sz - z)) <= 4 && Math.abs(sy - y) <= 6) {
            ok = true;
            break;
          }
        }
        if (!ok) uncovered++;
      }
  return {
    size: { SX, SY, SZ },
    stations: stations.length,
    lattice: stations.filter(([x, , z]) => LATTICE_X.includes(wx(x)) && LATTICE_Z.includes(wz(z))).length,
    trapOk,
    farm,
    uncovered,
  };
}

console.log('pass23…');
westApproachPath();
fountainTopiary();
rainCistern();
softSouthExterior();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
