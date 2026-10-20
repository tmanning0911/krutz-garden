/**
 * Pass 12 — cherry orchard expansion, west boardwalk bridge, SE duck pond,
 * gatehouse banners, espalier fruit wall, material study courtyard,
 * story plaque ring, SE corner turret. Mapping: +634 / -44 / -348.
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
  /grass_block|dirt$|stone$|granite|diorite|andesite|gravel|sand$|cobblestone$|farmland/.test(n);
const isSoft = (n) =>
  /short_grass|tall_grass|dandelion|poppy|allium|cornflower|oxeye|lily_of|azure|azalea|bush|leaf_litter|firefly|fern|wheat|carrot|potato|beet|tulip/.test(
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
    if (isTerrain(n) || n.includes('dirt_path') || /stone_brick|mossy|cracked|cobble/.test(n)) return Y;
  }
  return null;
}

function clearSoft(X, Y, Z, h = 5) {
  for (let y = Y + 1; y <= Y + h; y++) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n.startsWith(STATION) || n.includes('trapdoor')) continue;
    if (/fence|door|gate|wall|pane|plank|log|stair|slab|brick|lantern|glass|panel|battery/.test(n)) break;
    if (isSoft(n) || n === 'minecraft:air' || isTerrain(n) || /leaves|crop|wheat|carrot|potato|beet/.test(n))
      setW(X, y, Z, 'minecraft:air');
    else break;
  }
}

function placeGrass(X, Y, Z, plant = true) {
  if (!inSchem(X, Y, Z) || HOUSE(X, Z)) return;
  for (let y = Math.max(ORIGIN_Y + 1, Y - 3); y < Y; y++) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n === 'minecraft:air' || isSoft(n) || isTerrain(n)) setW(X, y, Z, 'minecraft:dirt');
  }
  setW(X, Y, Z, 'minecraft:grass_block');
  clearSoft(X, Y, Z, 4);
  if (!plant) return;
  const r = hash(X, Z) % 100;
  if (r < 36) setW(X, Y + 1, Z, 'minecraft:short_grass');
  else if (r < 55) setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
}

function cherryTree(X, Z) {
  const Y = soilY(X);
  if (!inSchem(X, Y, Z) || HOUSE(X, Z) || isStationCell(X, Z)) return;
  if (getW(X, Y + 1, Z).startsWith(STATION)) return;
  placeGrass(X, Y, Z, false);
  setW(X, Y + 1, Z, 'minecraft:cherry_log[axis=y]');
  setW(X, Y + 2, Z, 'minecraft:cherry_log[axis=y]');
  setW(X, Y + 3, Z, 'minecraft:cherry_log[axis=y]');
  for (const [dx, dy, dz] of [
    [0, 4, 0],
    [1, 4, 0],
    [-1, 4, 0],
    [0, 4, 1],
    [0, 4, -1],
    [1, 3, 1],
    [-1, 3, -1],
    [1, 3, -1],
    [-1, 3, 1],
    [0, 5, 0],
    [2, 4, 0],
    [-2, 4, 0],
  ]) {
    if (inSchem(X + dx, Y + dy, Z + dz))
      setW(X + dx, Y + dy, Z + dz, 'minecraft:cherry_leaves[distance=1,persistent=true]');
  }
  if (hash(X, Z) % 100 < 60) setW(X + 1, Y + 1, Z, 'minecraft:pink_petals');
}

function cherryOrchard() {
  for (let X = -578; X <= -548; X += 4) {
    for (let Z = 400; Z <= 408; Z += 4) {
      if (Z >= 418) continue;
      if (isStationCell(X, Z)) continue;
      cherryTree(X, Z);
    }
  }
  // blossom litter path through orchard
  for (let X = -576; X <= -550; X++) {
    const Z = 404;
    if (isStationCell(X, Z)) continue;
    const Y = soilY(X);
    if (!inSchem(X, Y, Z)) continue;
    if (getW(X, Y + 1, Z).startsWith(STATION)) continue;
    if (!getW(X, Y + 1, Z).includes('log')) {
      setW(X, Y, Z, 'minecraft:dirt_path');
      if (hash(X, Z) % 3 === 0) setW(X, Y + 1, Z, 'minecraft:pink_petals');
    }
  }
}

function westBoardwalk() {
  // bridge across west water toward dock
  for (let X = -622; X <= -612; X++) {
    for (const Z of [418, 419, 422, 423]) {
      if (HOUSE(X, Z) || !inSchem(X, 63, Z)) continue;
      setW(X, 63, Z, 'minecraft:oak_log[axis=x]');
      setW(X, 64, Z, 'minecraft:oak_slab[type=bottom]');
      if (X % 3 === 0) {
        setW(X, 65, Z, 'minecraft:oak_fence');
        if (Z === 418 || Z === 423) setW(X, 66, Z, 'minecraft:lantern[hanging=false]');
      }
    }
  }
  // center deck
  for (let X = -618; X <= -614; X++) {
    for (let Z = 419; Z <= 422; Z++) {
      if (HOUSE(X, Z)) continue;
      setW(X, 63, Z, 'minecraft:oak_planks');
      setW(X, 64, Z, 'minecraft:oak_slab[type=bottom]');
    }
  }
  setW(-616, 65, 420, 'minecraft:oak_fence');
  setW(-616, 66, 420, 'minecraft:lantern[hanging=false]');
}

function duckPond() {
  const CX = -540,
    CZ = 460;
  const Y = soilY(CX);
  for (let X = CX - 4; X <= CX + 4; X++) {
    for (let Z = CZ - 3; Z <= CZ + 3; Z++) {
      if (HOUSE(X, Z) || SOLAR(X, Z) || !inSchem(X, Y, Z)) continue;
      if (isStationCell(X, Z)) continue;
      clearSoft(X, Y, Z, 4);
      const d = Math.hypot(X - CX, Z - CZ);
      if (d <= 2.4) {
        setW(X, Y - 1, Z, 'minecraft:dirt');
        setW(X, Y, Z, 'minecraft:water');
        if (hash(X, Z) % 4 === 0) setW(X, Y + 1, Z, 'minecraft:lily_pad');
        if ((X + Z) % 5 === 0) setW(X, Y - 1, Z, 'minecraft:sea_lantern');
      } else if (d <= 3.6) {
        setW(X, Y, Z, brickMix(X, Y, Z));
        if (hash(X, Z) % 3 === 0) setW(X, Y + 1, Z, 'minecraft:short_grass');
      } else {
        placeGrass(X, Y, Z, true);
      }
    }
  }
  // reed corner
  for (const [X, Z] of [
    [CX - 3, CZ - 2],
    [CX + 3, CZ + 2],
  ]) {
    if (isStationCell(X, Z)) continue;
    setW(X, Y + 1, Z, 'minecraft:sugar_cane');
    setW(X, Y + 2, Z, 'minecraft:sugar_cane');
  }
}

function gatehouseBanners() {
  for (const [X, Z] of [
    [-529, 419],
    [-529, 422],
    [-527, 419],
    [-527, 422],
  ]) {
    if (!inSchem(X, 72, Z)) continue;
    setW(X, 72, Z, brickMix(X, 72, Z));
    setW(X, 73, Z, 'minecraft:oak_fence');
    setW(X, 74, Z, 'minecraft:white_banner[rotation=4]');
  }
  // gate lanterns
  for (const Z of [419, 422]) {
    setW(-528, 73, Z, 'minecraft:lantern[hanging=false]');
  }
}

function espalierFruitWall() {
  // trained fruit trees along inside of south wall
  for (let X = -580; X <= -540; X += 3) {
    const Z = WALL_Z2 - 2;
    if (isStationCell(X, Z) || SOLAR(X, Z)) continue;
    const Y = soilY(X);
    if (!inSchem(X, Y, Z)) continue;
    if (getW(X, Y + 1, Z).startsWith(STATION)) continue;
    placeGrass(X, Y, Z, false);
    setW(X, Y + 1, Z, 'minecraft:oak_fence');
    setW(X, Y + 2, Z, 'minecraft:oak_leaves[distance=1,persistent=true]');
    setW(X - 1, Y + 2, Z, 'minecraft:oak_leaves[distance=1,persistent=true]');
    setW(X + 1, Y + 2, Z, 'minecraft:oak_leaves[distance=1,persistent=true]');
    setW(X, Y + 3, Z, 'minecraft:oak_leaves[distance=1,persistent=true]');
    if (hash(X, Z) % 2 === 0) setW(X, Y + 1, Z + 1, FLOWERS[hash(X, Z) % FLOWERS.length]);
  }
}

function materialStudyCourt() {
  // small material swatch courtyard near greenhouse
  const samples = [
    'minecraft:stone_bricks',
    'minecraft:mossy_stone_bricks',
    'minecraft:cracked_stone_bricks',
    'minecraft:chiseled_stone_bricks',
    'minecraft:cobblestone',
    'minecraft:mossy_cobblestone',
    'minecraft:andesite',
    'minecraft:polished_andesite',
    'minecraft:deepslate_bricks',
    'minecraft:deepslate_tiles',
    'minecraft:spruce_planks',
    'minecraft:oak_planks',
  ];
  let i = 0;
  for (let X = -542; X <= -537; X++) {
    for (let Z = 404; Z <= 407; Z++) {
      if (isStationCell(X, Z) || !inSchem(X, 70, Z)) continue;
      clearSoft(X, 70, Z, 3);
      setW(X, 70, Z, samples[i % samples.length]);
      setW(X, 71, Z, 'minecraft:air');
      i++;
    }
  }
  setW(-539, 71, 405, 'minecraft:oak_sign[rotation=0,waterlogged=false]');
  setW(-540, 71, 403, 'minecraft:lantern[hanging=false]');
}

function storyPlaques() {
  // small stone markers naming garden rooms
  const spots = [
    [-579, 389], // maze
    [-548, 434], // reflecting
    [-564, 382], // rose
    [-560, 420], // fountain
    [-585, 375], // meditation
    [-554, 366], // cutaway
  ];
  for (const [X, Z] of spots) {
    if (!inSchem(X, soilY(X), Z) || HOUSE(X, Z)) continue;
    const Y = soilY(X);
    // don't smash stations
    if (getW(X, Y + 1, Z).startsWith(STATION)) continue;
    // plaque on adjacent grass
    const px = X + 1,
      pz = Z;
    if (isStationCell(px, pz)) continue;
    if (!inSchem(px, Y, pz)) continue;
    setW(px, Y, pz, 'minecraft:stone_bricks');
    setW(px, Y + 1, pz, 'minecraft:oak_wall_sign[facing=west,waterlogged=false]');
  }
}

function seCornerTurret() {
  const CX = WALL_X2,
    CZ = WALL_Z2;
  const base = soilY(CX);
  for (let dx = -2; dx <= 0; dx++) {
    for (let dz = -2; dz <= 0; dz++) {
      const X = CX + dx,
        Z = CZ + dz;
      if (HOUSE(X, Z) || SOLAR(X, Z) || !inSchem(X, base, Z)) continue;
      const edge = dx === -2 || dx === 0 || dz === -2 || dz === 0;
      for (let Y = base; Y <= base + 10; Y++) {
        if (Y < base + 8) {
          if (edge) setW(X, Y, Z, brickMix(X, Y, Z));
          else setW(X, Y, Z, 'minecraft:air');
        } else if (Y === base + 8) setW(X, Y, Z, 'minecraft:stone_brick_slab[type=bottom]');
      }
      if (edge) {
        setW(X, base + 9, Z, 'minecraft:stone_brick_wall');
        if ((dx + dz) % 2 === 0) setW(X, base + 10, Z, 'minecraft:lantern[hanging=false]');
      }
    }
  }
  for (let Y = base + 1; Y <= base + 7; Y++) {
    setW(CX - 1, Y, CZ - 1, 'minecraft:ladder[facing=north,waterlogged=false]');
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
    panels = 0;
  for (const [x, y, z] of stations) if (full(grid.get(x, y + 1, z)).includes('trapdoor')) trapOk++;
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
  return {
    size: { SX, SY, SZ },
    stations: stations.length,
    lattice: stations.filter(([x, , z]) => LATTICE_X.includes(wx(x)) && LATTICE_Z.includes(wz(z))).length,
    trapOk,
    farm,
    uncovered,
    panels,
  };
}

console.log('pass12…');
cherryOrchard();
westBoardwalk();
duckPond();
gatehouseBanners();
espalierFruitWall();
materialStudyCourt();
storyPlaques();
seCornerTurret();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
