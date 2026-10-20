/**
 * Pass 16 — market stall row, stepping-stone brook, herb-wheel beds,
 * observatory pad, cart track spur, espalier pear wall, scarecrow posts,
 * deeper cliff soften near wall feet. Mapping: +634/-44/-348.
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
];
const CROPS = [
  'minecraft:wheat[age=7]',
  'minecraft:carrots[age=7]',
  'minecraft:potatoes[age=7]',
  'minecraft:beetroots[age=3]',
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
const isTerrain = (n) =>
  /grass_block|dirt$|stone$|granite|diorite|andesite|gravel|sand$|cobblestone$|farmland|coarse_dirt|moss_block|path/.test(
    n,
  );
const isSoft = (n) =>
  /short_grass|tall_grass|dandelion|poppy|allium|cornflower|oxeye|lily_of|azure|azalea|bush|leaf_litter|firefly|fern|wheat|carrot|potato|beet|petal|tulip|orchid|lilac|vine|berry/.test(
    n,
  );
const brickMix = (X, Y, Z) => {
  const m = (X + Y * 3 + Z * 7) % 5;
  if (m === 0) return 'minecraft:mossy_stone_bricks';
  if (m === 1) return 'minecraft:cracked_stone_bricks';
  if (m === 2) return 'minecraft:mossy_cobblestone';
  return 'minecraft:stone_bricks';
};

function topTerrainY(X, Z) {
  for (let Y = 88; Y >= 45; Y--) {
    if (!inSchem(X, Y, Z)) continue;
    const n = getW(X, Y, Z);
    if (isTerrain(n) || n.includes('dirt_path') || /stone_brick|mossy|cracked|cobble|hay/.test(n)) return Y;
  }
  return null;
}

function clearSoft(X, Y, Z, h = 5) {
  for (let y = Y + 1; y <= Y + h; y++) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n.startsWith(STATION) || n.includes('trapdoor')) continue;
    if (/fence|door|gate|wall|pane|plank|log|stair|slab|brick|lantern|glass|panel|battery|sign|banner|composter|barrel|target|hay|lectern|bookshelf|rail/.test(n))
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
  else if (r < 55) setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
}

function reshape(X, Z, target, plant) {
  if (HOUSE(X, Z) || WEST_WATER(X, Z)) return;
  for (let y = 85; y > target; y--) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n.startsWith(STATION) || n.includes('trapdoor')) continue;
    if (/stone_brick|mossy_stone|cracked_stone|chiseled|glass|panel|battery|lantern|deepslate|water|spruce_|oak_|bookshelf|composter|barrel|hay|target|banner|lectern|rail|ladder/.test(n))
      continue;
    if (isTerrain(n) || isSoft(n) || n === 'minecraft:air' || /leaves|log|vine|petal/.test(n))
      setW(X, y, Z, 'minecraft:air');
  }
  for (let y = ORIGIN_Y + 1; y < target; y++) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n === 'minecraft:air' || isSoft(n)) setW(X, y, Z, 'minecraft:dirt');
  }
  placeGrass(X, target, Z, plant);
}

/** Force 1-block max slope outside walls (except protected zones) */
function forceGentleSkirts() {
  for (let pass = 0; pass < 6; pass++) {
    for (let X = -633; X <= -512; X++) {
      for (let Z = 348; Z <= 490; Z++) {
        const outside = X < WALL_X1 || X > WALL_X2 || Z < WALL_Z1 || Z > WALL_Z2;
        if (!outside || HOUSE(X, Z) || SOLAR(X, Z) || WEST_WATER(X, Z) || !inSchem(X, 56, Z)) continue;
        const y0 = topTerrainY(X, Z);
        if (y0 == null) continue;
        for (const [dx, dz] of [
          [1, 0],
          [0, 1],
          [-1, 0],
          [0, -1],
        ]) {
          const X2 = X + dx,
            Z2 = Z + dz;
          if (HOUSE(X2, Z2) || SOLAR(X2, Z2) || WEST_WATER(X2, Z2) || !inSchem(X2, 56, Z2)) continue;
          // don't reshape inside walls via neighbor
          const out2 = X2 < WALL_X1 || X2 > WALL_X2 || Z2 < WALL_Z1 || Z2 > WALL_Z2;
          if (!out2) continue;
          const y1 = topTerrainY(X2, Z2);
          if (y1 == null) continue;
          if (y0 - y1 >= 2) reshape(X2, Z2, y0 - 1, true);
          else if (y1 - y0 >= 2) reshape(X, Z, y1 - 1, true);
        }
      }
    }
  }
  // wall foot ramp: cells adjacent to wall match soilY - 0/1
  for (let X = WALL_X1; X <= WALL_X2; X++) {
    const base = soilY(X);
    for (let d = 1; d <= 8; d++) {
      for (const Z of [WALL_Z1 - d, WALL_Z2 + d]) {
        if (!inSchem(X, 56, Z) || HOUSE(X, Z) || SOLAR(X, Z) || WEST_WATER(X, Z)) continue;
        reshape(X, Z, Math.max(56, base - d), d > 1);
      }
    }
  }
  for (let Z = WALL_Z1; Z <= WALL_Z2; Z++) {
    for (let d = 1; d <= 8; d++) {
      const X = WALL_X2 + d;
      if (!inSchem(X, 56, Z) || HOUSE(X, Z) || SOLAR(X, Z)) continue;
      let t = Math.max(64, 70 - d);
      if (Z >= 416 && Z <= 425) t = Math.max(t, 69 - Math.floor(d * 0.35));
      reshape(X, Z, t, true);
    }
    for (let d = 1; d <= 8; d++) {
      const X = WALL_X1 - d;
      if (!inSchem(X, 56, Z) || HOUSE(X, Z) || WEST_WATER(X, Z)) continue;
      reshape(X, Z, Math.max(56, 64 - Math.ceil(d * 0.5)), true);
    }
  }
  // west water restore
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

function marketStalls() {
  // east-gate market stalls north of apron
  for (let i = 0; i < 3; i++) {
    const CX = -524,
      CZ = 412 + i * 3,
      Y = 69;
    if (SOLAR(CX, CZ) || !inSchem(CX, Y, CZ)) continue;
    for (let dx = 0; dx <= 2; dx++) {
      for (let dz = 0; dz <= 1; dz++) {
        setW(CX + dx, Y, CZ + dz, 'minecraft:spruce_planks');
        clearSoft(CX + dx, Y, CZ + dz, 3);
      }
    }
    setW(CX, Y + 1, CZ, 'minecraft:oak_fence');
    setW(CX + 2, Y + 1, CZ, 'minecraft:oak_fence');
    setW(CX, Y + 2, CZ, 'minecraft:oak_fence');
    setW(CX + 2, Y + 2, CZ, 'minecraft:oak_fence');
    setW(CX + 1, Y + 2, CZ, 'minecraft:white_wool');
    setW(CX + 1, Y + 1, CZ, 'minecraft:barrel[facing=up,open=false]');
    setW(CX + 1, Y + 3, CZ, 'minecraft:lantern[hanging=true]');
  }
}

function steppingBrook() {
  // brook from lily ponds toward reflecting pool area
  for (let i = 0; i < 12; i++) {
    const X = -556 + (i % 3);
    const Z = 432 + Math.floor(i / 2);
    const Y = soilY(X);
    if (isStationCell(X, Z) || HOUSE(X, Z) || Z >= 418 && Z <= 423) continue;
    if (!inSchem(X, Y, Z)) continue;
    clearSoft(X, Y, Z, 2);
    if (i % 2 === 0) {
      setW(X, Y - 1, Z, 'minecraft:dirt');
      setW(X, Y, Z, 'minecraft:water');
    } else {
      setW(X, Y, Z, 'minecraft:smooth_stone');
    }
  }
}

function herbWheel() {
  // circular herb wheel near house kitchen
  const CX = -584,
    CZ = 408,
    Y = 64;
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      const X = CX + dx,
        Z = CZ + dz;
      if (HOUSE(X, Z) || isStationCell(X, Z) || !inSchem(X, Y, Z)) continue;
      const d = Math.hypot(dx, dz);
      if (d > 3.2) continue;
      clearSoft(X, Y, Z, 2);
      if (d < 0.5) {
        setW(X, Y, Z, 'minecraft:water');
      } else if (Math.abs(dx) < 0.5 || Math.abs(dz) < 0.5) {
        setW(X, Y, Z, 'minecraft:dirt_path');
      } else {
        setW(X, Y, Z, 'minecraft:farmland[moisture=7]');
        setW(X, Y + 1, Z, CROPS[hash(X, Z) % CROPS.length]);
      }
    }
  }
}

function observatoryPad() {
  // small star-pad on NW lookout approach
  const CX = -588,
    CZ = 466,
    Y = soilY(CX);
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      const X = CX + dx,
        Z = CZ + dz;
      if (isStationCell(X, Z) || HOUSE(X, Z) || !inSchem(X, Y, Z)) continue;
      if (Math.abs(dx) + Math.abs(dz) > 3) continue;
      setW(X, Y, Z, 'minecraft:polished_andesite');
      clearSoft(X, Y, Z, 3);
    }
  }
  setW(CX, Y + 1, CZ, 'minecraft:end_rod[facing=up]');
  setW(CX, Y + 2, CZ, 'minecraft:glass');
  setW(CX + 1, Y + 1, CZ, 'minecraft:spruce_stairs[facing=west,half=bottom]');
  setW(CX - 1, Y + 1, CZ, 'minecraft:spruce_stairs[facing=east,half=bottom]');
}

function cartTrack() {
  // decorative cart spur from gate toward solar hill
  for (let i = 0; i < 14; i++) {
    const X = -526 + Math.floor(i / 2);
    const Z = 430 + i;
    if (SOLAR(X, Z) || !inSchem(X, 68, Z)) continue;
    const Y = topTerrainY(X, Z) ?? 68;
    setW(X, Y, Z, 'minecraft:cobblestone');
    clearSoft(X, Y, Z, 2);
    setW(X, Y + 1, Z, 'minecraft:rail');
  }
  // buffer stop
  setW(-520, 69, 443, 'minecraft:oak_fence');
  setW(-520, 70, 443, 'minecraft:lantern[hanging=false]');
}

function espalierPear() {
  // fruit espalier on inside of east wall south of gate
  for (let Z = 426; Z <= 438; Z += 2) {
    const X = -529;
    if (isStationCell(X, Z) || !inSchem(X, 70, Z)) continue;
    const Y = soilY(X);
    setW(X, Y + 1, Z, 'minecraft:oak_fence');
    setW(X, Y + 2, Z, 'minecraft:oak_leaves[persistent=true]');
    setW(X, Y + 3, Z, 'minecraft:oak_leaves[persistent=true]');
    if (hash(X, Z) % 2 === 0) setW(X - 1, Y + 2, Z, 'minecraft:vine');
  }
}

function scarecrows() {
  for (const [X, Z] of [
    [-560, 390],
    [-548, 450],
    [-572, 440],
  ]) {
    if (isStationCell(X, Z) || HOUSE(X, Z) || !inSchem(X, 64, Z)) continue;
    const Y = soilY(X);
    clearSoft(X, Y, Z, 4);
    setW(X, Y + 1, Z, 'minecraft:oak_fence');
    setW(X, Y + 2, Z, 'minecraft:hay_block');
    setW(X, Y + 3, Z, 'minecraft:carved_pumpkin[facing=south]');
    setW(X - 1, Y + 2, Z, 'minecraft:oak_fence');
    setW(X + 1, Y + 2, Z, 'minecraft:oak_fence');
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
    panels = 0,
    cliffs = 0,
    water = 0;
  for (const [x, y, z] of stations) if (full(grid.get(x, y + 1, z)).includes('trapdoor')) trapOk++;
  for (let x = 0; x < SX; x++)
    for (let y = 0; y < SY; y++)
      for (let z = 0; z < SZ; z++) {
        const n = full(grid.get(x, y, z));
        if (n.includes('solar_panel')) panels++;
        if (n.includes('water') && wx(x) >= -622 && wx(x) <= -618 && wz(z) >= 408 && wz(z) <= 432) water++;
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
  for (let X = WALL_X1 - 1; X <= WALL_X2 + 14; X++) {
    for (let Z = WALL_Z1 - 14; Z <= WALL_Z2 + 2; Z++) {
      const outside = X < WALL_X1 || X > WALL_X2 || Z < WALL_Z1 || Z > WALL_Z2;
      if (!outside || HOUSE(X, Z) || SOLAR(X, Z) || !inSchem(X, 64, Z)) continue;
      const y0 = topTerrainY(X, Z);
      if (y0 == null) continue;
      for (const [dx, dz] of [
        [1, 0],
        [0, 1],
      ]) {
        const X2 = X + dx,
          Z2 = Z + dz;
        if (!inSchem(X2, 64, Z2) || HOUSE(X2, Z2) || SOLAR(X2, Z2)) continue;
        const y1 = topTerrainY(X2, Z2);
        if (y1 != null && Math.abs(y0 - y1) >= 2) cliffs++;
      }
    }
  }
  return {
    size: { SX, SY, SZ },
    mapping: `localX=wx+${ORIGIN_X}, localY=wy-${ORIGIN_Y}, localZ=wz-${ORIGIN_Z}`,
    stations: stations.length,
    lattice: stations.filter(([x, , z]) => LATTICE_X.includes(wx(x)) && LATTICE_Z.includes(wz(z))).length,
    trapOk,
    farm,
    uncovered,
    panels,
    cliffs,
    westWaterBlocks: water,
  };
}

console.log('pass16…');
forceGentleSkirts();
marketStalls();
steppingBrook();
herbWheel();
observatoryPad();
cartTrack();
espalierPear();
scarecrows();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
