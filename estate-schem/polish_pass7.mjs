/**
 * Pass 7 — aggressive outside-wall 1-block slope pass + path verge flowers;
 * protect house/solar/water; ORIGIN_Y=44.
 */
import { parseToGrid } from './node_modules/craftmatic/dist/schem/parse.js';
import { writeSchematic } from './node_modules/craftmatic/dist/schem/write.js';

const SCHEM = new URL('../krutz-solar-house.schem', import.meta.url).pathname;
const grid = await parseToGrid(SCHEM);
const ORIGIN_Y = 44;
const { width: SX, height: SY, length: SZ } = grid;
const toLX = (X) => X + 630;
const toLY = (Y) => Y - ORIGIN_Y;
const toLZ = (Z) => Z - 352;
const wx = (lx) => lx - 630;
const wz = (lz) => lz + 352;
const WALL_X1 = -590,
  WALL_X2 = -528,
  WALL_Z1 = 368,
  WALL_Z2 = 474;
const HOUSE = (X, Z) => X <= -592 && Z >= 410 && Z <= 430;
const SOLAR = (X, Z) => X >= -526 && Z >= 446 && Z <= 464;
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
  'minecraft:azure_bluet',
];
const full = (b) => (typeof b === 'string' ? b : String(b ?? 'minecraft:air'));
const getW = (X, Y, Z) => full(grid.get(toLX(X), toLY(Y), toLZ(Z)));
const setW = (X, Y, Z, b) => {
  if (HOUSE(X, Z)) return;
  grid.set(toLX(X), toLY(Y), toLZ(Z), b);
};
const setWForce = (X, Y, Z, b) => grid.set(toLX(X), toLY(Y), toLZ(Z), b);
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
const isTerrain = (n) =>
  /grass_block|dirt$|stone$|granite|diorite|andesite|gravel|sand$|cobblestone$|farmland/.test(n);
const isSoft = (n) =>
  /short_grass|tall_grass|dandelion|poppy|allium|cornflower|oxeye|lily_of|azure|azalea|bush|leaf_litter|firefly|fern|wheat|carrot|potato|beet/.test(
    n,
  );
const isCropish = (n) => /wheat|carrots|potatoes|beetroots|farmland/.test(n);

function topSoftTerrainY(X, Z) {
  for (let Y = 82; Y >= 50; Y--) {
    if (!inSchem(X, Y, Z)) continue;
    const n = getW(X, Y, Z);
    // ignore walls / structures
    if (/stone_brick|mossy_stone|cracked_stone|deepslate|glass|panel|battery|banner|door|plank|log|fence|wall\[|lantern|solar/.test(n))
      continue;
    if (isTerrain(n) || n.includes('dirt_path')) return Y;
  }
  return null;
}

function placeGrass(X, Y, Z) {
  if (!inSchem(X, Y, Z) || HOUSE(X, Z) || SOLAR(X, Z)) return;
  for (let y = Y - 2; y < Y; y++) if (inSchem(X, y, Z)) setW(X, y, Z, 'minecraft:dirt');
  setW(X, Y, Z, 'minecraft:grass_block');
  for (let y = Y + 1; y <= Y + 2; y++) {
    const n = getW(X, y, Z);
    if (n === 'minecraft:air' || isSoft(n) || isCropish(n)) setW(X, y, Z, 'minecraft:air');
  }
  const r = hash(X, Z) % 100;
  if (r < 40) setW(X, Y + 1, Z, 'minecraft:short_grass');
  else if (r < 62) setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
}

function slopeSkirts() {
  // North
  for (let X = WALL_X1; X <= WALL_X2; X++) {
    const base = soilY(X);
    for (let dist = 1; dist <= 18; dist++) {
      const Z = WALL_Z1 - dist;
      if (!inSchem(X, 60, Z) || HOUSE(X, Z)) continue;
      const target = Math.max(56, base - dist);
      // clear down
      for (let y = 80; y > target; y--) {
        if (!inSchem(X, y, Z)) continue;
        const n = getW(X, y, Z);
        if (/stone_brick|mossy_stone|cracked|deepslate|panel|battery|banner|glass|lantern/.test(n)) continue;
        if (isTerrain(n) || isSoft(n) || n === 'minecraft:air' || /leaves|log/.test(n)) setW(X, y, Z, 'minecraft:air');
      }
      for (let y = target - 2; y < target; y++) if (inSchem(X, y, Z)) setW(X, y, Z, 'minecraft:dirt');
      placeGrass(X, target, Z);
    }
  }
  // East (not solar)
  for (let Z = WALL_Z1; Z <= WALL_Z2; Z++) {
    for (let dist = 1; dist <= 16; dist++) {
      const X = WALL_X2 + dist;
      if (!inSchem(X, 64, Z) || HOUSE(X, Z) || SOLAR(X, Z)) continue;
      let target = Math.max(64, 70 - dist);
      if (Z >= 416 && Z <= 425) target = Math.max(target, 69 - Math.floor(dist * 0.4));
      for (let y = 80; y > target; y--) {
        if (!inSchem(X, y, Z)) continue;
        const n = getW(X, y, Z);
        if (/stone_brick|mossy_stone|cracked|deepslate|panel|battery|banner|glass|lantern|smooth_stone|solar/.test(n))
          continue;
        if (isTerrain(n) || isSoft(n) || n === 'minecraft:air') setW(X, y, Z, 'minecraft:air');
      }
      for (let y = target - 2; y < target; y++) if (inSchem(X, y, Z)) setW(X, y, Z, 'minecraft:dirt');
      placeGrass(X, target, Z);
    }
  }
  // South
  for (let X = WALL_X1; X <= WALL_X2; X++) {
    const base = soilY(X);
    for (let dist = 1; dist <= 10; dist++) {
      const Z = WALL_Z2 + dist;
      if (!inSchem(X, 64, Z) || HOUSE(X, Z) || SOLAR(X, Z)) continue;
      const target = Math.max(64, base - Math.floor(dist * 0.7));
      for (let y = 80; y > target; y--) {
        if (!inSchem(X, y, Z)) continue;
        const n = getW(X, y, Z);
        if (/stone_brick|mossy_stone|cracked|deepslate|panel|battery|banner|glass|lantern/.test(n)) continue;
        if (isTerrain(n) || isSoft(n) || n === 'minecraft:air') setW(X, y, Z, 'minecraft:air');
      }
      for (let y = target - 2; y < target; y++) if (inSchem(X, y, Z)) setW(X, y, Z, 'minecraft:dirt');
      placeGrass(X, target, Z);
    }
  }
}

function pathVerges() {
  for (let X = -588; X <= -530; X++) {
    for (const Z of [417, 418, 423, 424]) {
      if (HOUSE(X, Z) || !inSchem(X, soilY(X), Z)) continue;
      if (LATTICE_X.includes(X) && LATTICE_Z.includes(Z)) continue;
      const Y = soilY(X);
      const n = getW(X, Y, Z);
      if (n.includes('dirt_path') || n.includes('cobble') || n.includes('water') || n.includes('stone_brick')) continue;
      if (getW(X, Y + 1, Z).startsWith(STATION)) continue;
      if (isCropish(n) || isCropish(getW(X, Y + 1, Z)) || n.includes('grass')) {
        placeGrass(X, Y, Z);
      }
    }
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
    panels = 0;
  for (let x = 0; x < SX; x++)
    for (let y = 0; y < SY; y++)
      for (let z = 0; z < SZ; z++) {
        const n = full(grid.get(x, y, z));
        if (n.includes('solar_panel')) panels++;
        if (!n.startsWith('minecraft:farmland')) continue;
        farm++;
        let ok = false;
        for (const [sx, sy, sz] of stations) {
          if (Math.max(Math.abs(sx - x), Math.abs(sz - z)) <= 4 && Math.abs(sy - y) <= 6) {
            ok = true;
            break;
          }
        }
        if (!ok) {
          const X = wx(x),
            Z = wz(z);
          if (!HOUSE(X, Z)) {
            grid.set(x, y, z, 'minecraft:grass_block');
            const a = full(grid.get(x, y + 1, z));
            if (/wheat|carrot|potato|beet|grass|flower/.test(a)) grid.set(x, y + 1, z, 'minecraft:short_grass');
          }
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
  // cliff recount outside
  let cliffs = 0;
  for (let X = WALL_X1 - 1; X <= WALL_X2 + 14; X++) {
    for (let Z = WALL_Z1 - 14; Z <= WALL_Z2 + 8; Z++) {
      const outside = X < WALL_X1 || X > WALL_X2 || Z < WALL_Z1 || Z > WALL_Z2;
      if (!outside || HOUSE(X, Z) || SOLAR(X, Z)) continue;
      const y0 = topSoftTerrainY(X, Z);
      if (y0 == null) continue;
      for (const [dx, dz] of [
        [1, 0],
        [0, 1],
      ]) {
        const y1 = topSoftTerrainY(X + dx, Z + dz);
        if (y1 != null && Math.abs(y0 - y1) >= 2) cliffs++;
      }
    }
  }
  return {
    stations: stations.length,
    lattice: stations.filter(([x, , z]) => LATTICE_X.includes(wx(x)) && LATTICE_Z.includes(wz(z))).length,
    farm,
    uncovered,
    panels,
    cliffs,
  };
}

console.log('pass7…');
slopeSkirts();
pathVerges();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
