/**
 * Pass 19 — heal west-of-wall cliffs, grade house-front lawn into y=64 terrace,
 * north/east skirt soft, path posts+benches, lavender walk, clock-tower stub,
 * dovecote, crop grass breaks. Mapping: +634/-44/-348. Uncovered farmland = 0.
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
  'minecraft:azure_bluet',
  'minecraft:pink_tulip',
  'minecraft:white_tulip',
  'minecraft:blue_orchid',
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
const isWallish = (n) =>
  /stone_brick|mossy_stone_brick|cracked_stone_brick|chiseled_stone|stone_brick_slab|stone_brick_stairs|mossy_stone_brick_slab|mossy_stone_brick_stairs/.test(
    n,
  );

function topTerrainY(X, Z) {
  for (let Y = 88; Y >= 45; Y--) {
    if (!inSchem(X, Y, Z)) continue;
    const n = getW(X, Y, Z);
    if (isTerrain(n) || n.includes('dirt_path') || /stone_brick|mossy|cracked|cobble|hay|andesite|smooth_stone/.test(n))
      return Y;
  }
  return null;
}

/** Soft surface only — ignore wall tops so cliff probe/heal don't fight parapets */
function topSoftY(X, Z) {
  for (let Y = 88; Y >= 45; Y--) {
    if (!inSchem(X, Y, Z)) continue;
    const n = getW(X, Y, Z);
    if (isWallish(n)) continue;
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
      /fence|door|gate|wall|pane|plank|log|stair|slab|brick|lantern|glass|panel|battery|sign|banner|composter|barrel|hay|lectern|rail|wool|end_rod|pumpkin|bee|nest/.test(
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
  if (r < 38) setW(X, Y + 1, Z, 'minecraft:short_grass');
  else if (r < 56) setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
  else if (r < 62) setW(X, Y + 1, Z, 'minecraft:fern');
}

function stripMarkers() {
  for (let x = 0; x < SX; x++)
    for (let y = 0; y < SY; y++)
      for (let z = 0; z < SZ; z++) {
        const n = full(grid.get(x, y, z));
        if (/concrete|glazed|magenta_wool|lime_wool|pink_wool|yellow_wool|white_wool|orange_wool/.test(n)) {
          grid.set(x, y, z, 'minecraft:air');
        }
      }
}

/** Grade west lawn: house edge → terrace at y=64 up to wall foot */
function gradeHouseFrontLawn() {
  for (let Z = 412; Z <= 428; Z++) {
    for (let X = -591; X <= -587; X++) {
      if (HOUSE(X, Z) || WEST_WATER(X, Z) || !inSchem(X, 64, Z)) continue;
      // leave wall column alone
      if (X === WALL_X1) continue;
      const target = 64;
      // clear anything above target that isn't structure
      for (let y = 78; y > target; y--) {
        if (!inSchem(X, y, Z)) continue;
        const n = getW(X, y, Z);
        if (n.startsWith(STATION) || isWallish(n)) continue;
        if (/trapdoor|panel|battery|glass|lantern|fence|plank|log|door|gate|banner|rail|wool|end_rod/.test(n))
          continue;
        if (isTerrain(n) || isSoft(n) || n === 'minecraft:air' || /leaves|vine|crop/.test(n))
          setW(X, y, Z, 'minecraft:air');
      }
      for (let y = ORIGIN_Y + 1; y < target; y++) {
        const n = getW(X, y, Z);
        if (n === 'minecraft:air' || isSoft(n) || isTerrain(n)) setW(X, y, Z, 'minecraft:dirt');
      }
      // path strip near doors (center Z)
      if (Z >= 418 && Z <= 422 && X >= -590 && X <= -588) {
        setW(X, target, Z, 'minecraft:dirt_path');
        clearSoft(X, target, Z, 3);
      } else {
        placeGrass(X, target, Z, true);
      }
    }
  }
  // wall-foot stepped cobble skirt at X=-591 (outside), soft y=63→64
  for (let Z = 370; Z <= 472; Z++) {
    const X = -591;
    if (HOUSE(X, Z) || WEST_WATER(X, Z) || !inSchem(X, 63, Z)) continue;
    const mid = Z >= 410 && Z <= 430;
    const t = mid ? 63 : 63 + (hash(X, Z) % 2);
    for (let y = 78; y > t; y--) {
      if (!inSchem(X, y, Z)) continue;
      const n = getW(X, y, Z);
      if (isWallish(n) || n.startsWith(STATION)) continue;
      if (/trapdoor|panel|battery|glass|lantern|fence|plank|log|door|gate|banner|rail/.test(n)) continue;
      if (isTerrain(n) || isSoft(n) || n === 'minecraft:air' || /leaves|vine/.test(n)) setW(X, y, Z, 'minecraft:air');
    }
    for (let y = ORIGIN_Y + 1; y < t; y++) {
      const n = getW(X, y, Z);
      if (n === 'minecraft:air' || isSoft(n)) setW(X, y, Z, 'minecraft:dirt');
    }
    if (hash(X, Z) % 5 === 0) {
      setW(X, t, Z, 'minecraft:mossy_cobblestone');
      clearSoft(X, t, Z, 2);
    } else placeGrass(X, t, Z, !mid);
  }
}

/** Multi-pass exterior softener using soft tops only */
function softenExterior() {
  for (let pass = 0; pass < 10; pass++) {
    const edits = [];
    for (let X = -633; X <= -512; X++) {
      for (let Z = 348; Z <= 490; Z++) {
        if (!isOutside(X, Z) || HOUSE(X, Z) || SOLAR(X, Z) || WEST_WATER(X, Z) || !inSchem(X, 56, Z))
          continue;
        const y0 = topSoftY(X, Z);
        if (y0 == null) continue;
        let minN = y0;
        for (const [dx, dz] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const X2 = X + dx,
            Z2 = Z + dz;
          if (!isOutside(X2, Z2) || !inSchem(X2, 56, Z2) || HOUSE(X2, Z2) || WEST_WATER(X2, Z2)) continue;
          const y1 = topSoftY(X2, Z2);
          if (y1 != null) minN = Math.min(minN, y1);
        }
        if (y0 > minN + 1) edits.push([X, Z, minN + 1]);
      }
    }
    for (const [X, Z, t] of edits) {
      for (let y = 85; y > t; y--) {
        if (!inSchem(X, y, Z)) continue;
        const n = getW(X, y, Z);
        if (n.startsWith(STATION) || isWallish(n)) continue;
        if (
          /trapdoor|plank|log|fence|lantern|glass|panel|wool|rail|hay|pumpkin|lectern|barrel|banner|door|gate|bee|nest/.test(
            n,
          )
        )
          continue;
        if (isTerrain(n) || isSoft(n) || n === 'minecraft:air' || /leaves|vine/.test(n)) setW(X, y, Z, 'minecraft:air');
      }
      for (let y = ORIGIN_Y + 1; y < t; y++) {
        const n = getW(X, y, Z);
        if (n === 'minecraft:air' || isSoft(n)) setW(X, y, Z, 'minecraft:dirt');
      }
      placeGrass(X, t, Z, true);
    }
    if (!edits.length) break;
  }
  // restore west water
  for (let X = -622; X <= -618; X++) {
    for (let Z = 408; Z <= 432; Z++) {
      if (HOUSE(X, Z) || !inSchem(X, 60, Z)) continue;
      for (let y = ORIGIN_Y + 1; y <= 59; y++) setW(X, y, Z, 'minecraft:dirt');
      setW(X, 60, Z, 'minecraft:dirt');
      setW(X, 61, Z, 'minecraft:water');
      setW(X, 62, Z, 'minecraft:water');
      setW(X, 63, Z, hash(X, Z) % 8 === 0 ? 'minecraft:lily_pad' : 'minecraft:air');
    }
  }
}

/** North skirt: gentle fall away from wall z=368 */
function northEastSkirts() {
  for (let X = WALL_X1 - 2; X <= WALL_X2 + 12; X++) {
    for (let d = 1; d <= 12; d++) {
      const Z = WALL_Z1 - d;
      if (HOUSE(X, Z) || SOLAR(X, Z) || !inSchem(X, 60, Z)) continue;
      const t = Math.max(58, 64 - Math.floor(d / 2) - (hash(X, Z) % 2));
      for (let y = 80; y > t; y--) {
        if (!inSchem(X, y, Z)) continue;
        const n = getW(X, y, Z);
        if (isWallish(n) || n.startsWith(STATION)) continue;
        if (/trapdoor|plank|log|fence|lantern|glass|panel|banner|rail|wool/.test(n)) continue;
        if (isTerrain(n) || isSoft(n) || n === 'minecraft:air' || /leaves/.test(n)) setW(X, y, Z, 'minecraft:air');
      }
      for (let y = ORIGIN_Y + 1; y < t; y++) {
        const n = getW(X, y, Z);
        if (n === 'minecraft:air' || isSoft(n)) setW(X, y, Z, 'minecraft:dirt');
      }
      placeGrass(X, t, Z, true);
    }
  }
  // east outside wall
  for (let Z = WALL_Z1 - 2; Z <= WALL_Z2 + 2; Z++) {
    for (let d = 1; d <= 10; d++) {
      const X = WALL_X2 + d;
      if (SOLAR(X, Z) || HOUSE(X, Z) || !inSchem(X, 64, Z)) continue;
      const base = Z >= 446 && Z <= 464 ? 68 : 66;
      const t = Math.max(60, base - Math.floor(d / 2) - (hash(X, Z) % 2));
      for (let y = 80; y > t; y--) {
        if (!inSchem(X, y, Z)) continue;
        const n = getW(X, y, Z);
        if (isWallish(n) || n.startsWith(STATION) || /panel|battery/.test(n)) continue;
        if (/trapdoor|plank|log|fence|lantern|glass|banner|rail|wool/.test(n)) continue;
        if (isTerrain(n) || isSoft(n) || n === 'minecraft:air' || /leaves/.test(n)) setW(X, y, Z, 'minecraft:air');
      }
      for (let y = ORIGIN_Y + 1; y < t; y++) {
        const n = getW(X, y, Z);
        if (n === 'minecraft:air' || isSoft(n)) setW(X, y, Z, 'minecraft:dirt');
      }
      placeGrass(X, t, Z, true);
    }
  }
}

function cropGrassBreaks() {
  for (let X = WALL_X1 + 3; X < WALL_X2 - 3; X++) {
    const Y = soilY(X);
    for (let Z = WALL_Z1 + 6; Z < WALL_Z2 - 6; Z++) {
      if (HOUSE(X, Z) || isStationCell(X, Z)) continue;
      // keep main path corridor
      if (Z >= 418 && Z <= 423) continue;
      if (LATTICE_X.includes(X) && LATTICE_Z.some((sz) => Math.abs(sz - Z) <= 1)) continue;
      const above = getW(X, Y + 1, Z);
      if (!/wheat|carrot|potato|beet/.test(above)) continue;
      // break long stripes every ~11 with staggered offset
      if ((Z + X * 3) % 11 !== 0 && hash(X, Z) % 29 !== 0) continue;
      placeGrass(X, Y, Z, true);
    }
  }
}

function pathFurniture() {
  // posts + benches along main E-W path ~z=420-421
  const spots = [
    [-580, 419],
    [-572, 422],
    [-564, 419],
    [-556, 422],
    [-548, 419],
    [-540, 422],
  ];
  for (const [X, Z] of spots) {
    if (isStationCell(X, Z) || !inSchem(X, 64, Z)) continue;
    const Y = soilY(X);
    setW(X, Y, Z, 'minecraft:dirt_path');
    clearSoft(X, Y, Z, 3);
    // post
    setW(X, Y + 1, Z, 'minecraft:spruce_fence');
    setW(X, Y + 2, Z, 'minecraft:lantern[hanging=false]');
    // bench beside
    const bx = X,
      bz = Z === 419 ? 418 : 423;
    if (!isStationCell(bx, bz) && inSchem(bx, Y, bz)) {
      setW(bx, Y, bz, 'minecraft:dirt_path');
      clearSoft(bx, Y, bz, 2);
      setW(bx, Y + 1, bz, 'minecraft:spruce_stairs[facing=north,half=bottom]');
    }
  }
}

function lavenderWalk() {
  // purple flower ribbon N of fountain court
  for (let X = -566; X <= -554; X++) {
    for (const Z of [412, 413]) {
      if (isStationCell(X, Z) || !inSchem(X, 64, Z)) continue;
      const Y = soilY(X);
      if (getW(X, Y, Z).includes('farmland')) continue;
      placeGrass(X, Y, Z, false);
      setW(X, Y + 1, Z, hash(X, Z) % 2 === 0 ? 'minecraft:allium' : 'minecraft:lilac[half=lower]');
      if (hash(X, Z) % 2 === 1) setW(X, Y + 2, Z, 'minecraft:lilac[half=upper]');
    }
  }
}

function clockTowerStub() {
  // small stone clock tower near NE chapel area
  const CX = -532,
    CZ = 378,
    Y = soilY(CX);
  if (!inSchem(CX, Y, CZ) || isStationCell(CX, CZ)) return;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (isStationCell(CX + dx, CZ + dz)) continue;
      setW(CX + dx, Y, CZ + dz, 'minecraft:stone_bricks');
      clearSoft(CX + dx, Y, CZ + dz, 6);
      for (let h = 1; h <= 4; h++) setW(CX + dx, Y + h, CZ + dz, 'minecraft:stone_bricks');
    }
  }
  // hollow + window
  setW(CX, Y + 1, CZ, 'minecraft:air');
  setW(CX, Y + 2, CZ, 'minecraft:air');
  setW(CX, Y + 3, CZ, 'minecraft:lantern[hanging=true]');
  setW(CX, Y + 5, CZ, 'minecraft:stone_brick_slab[type=bottom]');
  setW(CX, Y + 4, CZ - 1, 'minecraft:oak_wall_sign[facing=north]');
  setW(CX + 1, Y + 5, CZ, 'minecraft:stone_brick_stairs[facing=east,half=bottom]');
  setW(CX - 1, Y + 5, CZ, 'minecraft:stone_brick_stairs[facing=west,half=bottom]');
}

function dovecote() {
  const CX = -578,
    CZ = 456,
    Y = soilY(CX);
  if (!inSchem(CX, Y, CZ) || isStationCell(CX, CZ)) return;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (isStationCell(CX + dx, CZ + dz)) continue;
      setW(CX + dx, Y, CZ + dz, 'minecraft:spruce_planks');
      clearSoft(CX + dx, Y, CZ + dz, 4);
    }
  }
  for (let h = 1; h <= 3; h++) {
    setW(CX - 1, Y + h, CZ - 1, 'minecraft:spruce_planks');
    setW(CX + 1, Y + h, CZ - 1, 'minecraft:spruce_planks');
    setW(CX - 1, Y + h, CZ + 1, 'minecraft:spruce_planks');
    setW(CX + 1, Y + h, CZ + 1, 'minecraft:spruce_planks');
    setW(CX, Y + h, CZ - 1, 'minecraft:spruce_planks');
    setW(CX, Y + h, CZ + 1, 'minecraft:spruce_planks');
    setW(CX - 1, Y + h, CZ, 'minecraft:spruce_planks');
    setW(CX + 1, Y + h, CZ, 'minecraft:spruce_planks');
  }
  setW(CX, Y + 1, CZ, 'minecraft:air');
  setW(CX, Y + 2, CZ, 'minecraft:air');
  setW(CX, Y + 3, CZ, 'minecraft:hay_block');
  setW(CX, Y + 4, CZ, 'minecraft:spruce_stairs[facing=south,half=bottom]');
  setW(CX, Y + 1, CZ - 1, 'minecraft:spruce_trapdoor[facing=north,half=bottom,open=true,waterlogged=false]');
  setW(CX + 2, Y + 1, CZ, 'minecraft:lantern[hanging=false]');
}

function flowerVergeBoost() {
  // denser flowers against inside of N/S walls
  for (let X = WALL_X1 + 2; X < WALL_X2 - 2; X++) {
    for (const Z of [WALL_Z1 + 2, WALL_Z1 + 3, WALL_Z2 - 2, WALL_Z2 - 3]) {
      if (isStationCell(X, Z) || !inSchem(X, 64, Z)) continue;
      const Y = soilY(X);
      if (getW(X, Y, Z).includes('farmland') || getW(X, Y, Z).includes('dirt_path')) continue;
      if (hash(X, Z) % 3 !== 0) continue;
      placeGrass(X, Y, Z, false);
      setW(X, Y + 1, Z, FLOWERS[hash(X + Z, Z) % FLOWERS.length]);
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
    trapOk = 0,
    cliffs = 0;
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
  for (let X = WALL_X1 - 1; X <= WALL_X2 + 14; X++) {
    for (let Z = WALL_Z1 - 14; Z <= WALL_Z2 + 2; Z++) {
      if (!isOutside(X, Z) || HOUSE(X, Z) || SOLAR(X, Z) || !inSchem(X, 64, Z)) continue;
      const y0 = topSoftY(X, Z);
      if (y0 == null) continue;
      for (const [dx, dz] of [
        [1, 0],
        [0, 1],
      ]) {
        const X2 = X + dx,
          Z2 = Z + dz;
        if (!isOutside(X2, Z2) || !inSchem(X2, 64, Z2) || HOUSE(X2, Z2) || SOLAR(X2, Z2)) continue;
        const y1 = topSoftY(X2, Z2);
        if (y1 != null && Math.abs(y0 - y1) >= 2) cliffs++;
      }
    }
  }
  return {
    size: { SX, SY, SZ },
    stations: stations.length,
    lattice: stations.filter(([x, , z]) => LATTICE_X.includes(wx(x)) && LATTICE_Z.includes(wz(z))).length,
    trapOk,
    farm,
    uncovered,
    softExteriorCliffs: cliffs,
  };
}

console.log('pass19…');
stripMarkers();
gradeHouseFrontLawn();
softenExterior();
northEastSkirts();
cropGrassBreaks();
pathFurniture();
lavenderWalk();
clockTowerStub();
dovecote();
flowerVergeBoost();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
