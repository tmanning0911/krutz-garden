/**
 * Pass 11 — expand schem (+4W west, +3H, +4L north), waterfall cascade,
 * rose garden room, pergola walk, apiary, meditation pavilion, stables stub,
 * cutaway deep-farm window, night path glow ring. ORIGIN_Y shifts with expand.
 */
import { parseToGrid } from './node_modules/craftmatic/dist/schem/parse.js';
import { writeSchematic } from './node_modules/craftmatic/dist/schem/write.js';
import { BlockGrid } from './node_modules/craftmatic/dist/schem/types.js';

const SCHEM = new URL('../krutz-solar-house.schem', import.meta.url).pathname;
const old = await parseToGrid(SCHEM);

const DX = 4; // extra west (local x shift)
const DY = 0; // keep ORIGIN_Y=44 (no deep shift this pass)
const DZ = 4; // extra north
const EXTRA_H = 3;
const grid = new BlockGrid(old.width + DX, old.height + DY + EXTRA_H, old.length + DZ);
for (let y = 0; y < old.height; y++) {
  for (let z = 0; z < old.length; z++) {
    for (let x = 0; x < old.width; x++) {
      grid.set(x + DX, y + DY, z + DZ, old.get(x, y, z));
    }
  }
}
for (const be of old.blockEntities) {
  const [x, y, z] = be.pos;
  grid.blockEntities.push({ ...be, pos: [x + DX, y + DY, z + DZ] });
}

// Mapping updates: localX = wx + 630 + DX → ORIGIN_X effective = -(630+DX)
// Keep world mapping: localX = wx + 634, localZ = wz - 348, localY = wy - 44
const ORIGIN_Y = 44;
const ORIGIN_X = 630 + DX; // 634
const ORIGIN_Z = 352 - DZ; // 348
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
  'minecraft:red_tulip',
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
const isCropish = (n) => /wheat|carrots|potatoes|beetroots|farmland/.test(n);
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

function reshape(X, Z, target, plant) {
  for (let y = 85; y > target; y--) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n.startsWith(STATION) || n.includes('trapdoor')) continue;
    if (/stone_brick|mossy_stone|cracked_stone|chiseled|glass|panel|battery|lantern/.test(n)) continue;
    if (isTerrain(n) || isSoft(n) || n === 'minecraft:air' || /leaves|log|vine/.test(n)) setW(X, y, Z, 'minecraft:air');
  }
  const cur = topTerrainY(X, Z);
  if (cur == null || cur < target) {
    for (let y = (cur ?? target - 3) + 1; y <= target; y++) {
      if (inSchem(X, y, Z)) setW(X, y, Z, 'minecraft:dirt');
    }
  }
  placeGrass(X, target, Z, plant);
}

// Fill newly expanded west/north margin with graded grass
function fillExpandMargin() {
  for (let X = -634; X < -620; X++) {
    for (let Z = 348; Z <= 490; Z++) {
      if (!inSchem(X, 60, Z) || HOUSE(X, Z)) continue;
      const distW = -620 - X;
      const target = Math.max(56, 63 - Math.floor(distW * 0.4));
      reshape(X, Z, target, true);
      // keep/enhance water channel
      if (X >= -622 && X <= -618 && Z >= 408 && Z <= 432) {
        for (let Y = 60; Y <= 62; Y++) setW(X, Y, Z, 'minecraft:water');
        setW(X, 63, Z, hash(X, Z) % 6 === 0 ? 'minecraft:lily_pad' : 'minecraft:air');
      }
    }
  }
  for (let X = -634; X <= -512; X++) {
    for (let Z = 348; Z < 360; Z++) {
      if (!inSchem(X, 60, Z) || HOUSE(X, Z)) continue;
      const dist = 360 - Z;
      reshape(X, Z, Math.max(56, 62 - dist), true);
    }
  }
}

function waterfallCascade() {
  // spill from NW wall into western approach
  for (let i = 0; i < 8; i++) {
    const X = -591 - i;
    const Z = 372;
    const Y = 70 - i;
    if (!inSchem(X, Y, Z)) continue;
    setW(X, Y, Z, 'minecraft:water');
    setW(X, Y - 1, Z, brickMix(X, Y, Z));
    if (inSchem(X, Y, Z - 1)) setW(X, Y - 1, Z - 1, brickMix(X, Y, Z));
    if (inSchem(X, Y, Z + 1)) setW(X, Y - 1, Z + 1, brickMix(X, Y, Z));
  }
  // pool at base
  for (let X = -600; X <= -594; X++) {
    for (let Z = 370; Z <= 374; Z++) {
      if (!inSchem(X, 58, Z) || HOUSE(X, Z)) continue;
      setW(X, 57, Z, 'minecraft:stone_bricks');
      setW(X, 58, Z, 'minecraft:water');
      if (hash(X, Z) % 4 === 0) setW(X, 59, Z, 'minecraft:lily_pad');
    }
  }
}

function roseGarden() {
  // formal rose room NE of maze, avoid stations
  const x0 = -570,
    x1 = -558,
    z0 = 378,
    z1 = 386;
  const Y = soilY(x0);
  for (let X = x0; X <= x1; X++) {
    for (let Z = z0; Z <= z1; Z++) {
      if (HOUSE(X, Z) || !inSchem(X, Y, Z)) continue;
      if (isStationCell(X, Z)) continue;
      clearSoft(X, Y, Z, 4);
      const edge = X === x0 || X === x1 || Z === z0 || Z === z1;
      if (edge) {
        setW(X, Y, Z, brickMix(X, Y, Z));
        if ((X + Z) % 2 === 0) setW(X, Y + 1, Z, 'minecraft:oak_fence');
      } else if ((X + Z) % 2 === 0) {
        setW(X, Y, Z, 'minecraft:grass_block');
        const rose = ['minecraft:poppy', 'minecraft:red_tulip', 'minecraft:pink_tulip', 'minecraft:rose_bush'][
          hash(X, Z) % 4
        ];
        setW(X, Y + 1, Z, rose);
        if (rose === 'minecraft:rose_bush') setW(X, Y + 2, Z, 'minecraft:rose_bush');
      } else {
        setW(X, Y, Z, 'minecraft:dirt_path');
        setW(X, Y + 1, Z, 'minecraft:air');
      }
    }
  }
  // center urn
  setW(-564, Y, 382, 'minecraft:chiseled_stone_bricks');
  setW(-564, Y + 1, 382, 'minecraft:flower_pot');
  setW(-564, Y + 2, 382, 'minecraft:lantern[hanging=false]');
}

function pergolaWalk() {
  // arbor along north side of main path
  for (let X = -582; X <= -542; X += 2) {
    for (const Z of [417, 424]) {
      if (HOUSE(X, Z) || !inSchem(X, soilY(X), Z)) continue;
      if (isStationCell(X, Z)) continue;
      const Y = soilY(X);
      if (getW(X, Y + 1, Z).startsWith(STATION)) continue;
      clearSoft(X, Y, Z, 5);
      placeGrass(X, Y, Z, false);
      setW(X, Y + 1, Z, 'minecraft:oak_fence');
      setW(X, Y + 2, Z, 'minecraft:oak_fence');
      setW(X, Y + 3, Z, 'minecraft:oak_slab[type=bottom]');
      if (hash(X, Z) % 3 === 0) setW(X, Y + 3, Z + (Z === 417 ? 1 : -1), 'minecraft:oak_leaves[distance=1,persistent=true]');
      if (X % 6 === 0) setW(X, Y + 2, Z, 'minecraft:lantern[hanging=true]');
    }
  }
  // cross beams
  for (let X = -582; X <= -542; X++) {
    const Y = soilY(X);
    if (!inSchem(X, Y + 3, 420)) continue;
    if (X % 2 === 0) {
      setW(X, Y + 3, 418, 'minecraft:oak_slab[type=bottom]');
      setW(X, Y + 3, 423, 'minecraft:oak_slab[type=bottom]');
    }
  }
}

function apiary() {
  const CX = -556,
    CZ = 448;
  const Y = soilY(CX);
  for (let X = CX - 2; X <= CX + 2; X++) {
    for (let Z = CZ - 2; Z <= CZ + 2; Z++) {
      if (HOUSE(X, Z) || SOLAR(X, Z) || !inSchem(X, Y, Z)) continue;
      if (isStationCell(X, Z)) continue;
      clearSoft(X, Y, Z, 4);
      const edge = Math.abs(X - CX) === 2 || Math.abs(Z - CZ) === 2;
      if (edge) {
        setW(X, Y, Z, 'minecraft:oak_planks');
        setW(X, Y + 1, Z, 'minecraft:oak_fence');
      } else {
        setW(X, Y, Z, 'minecraft:grass_block');
        setW(X, Y + 1, Z, 'minecraft:beehive[facing=south,honey_level=5]');
        if (hash(X, Z) % 2 === 0) setW(X, Y + 1, Z, 'minecraft:bee_nest[facing=south,honey_level=3]');
      }
    }
  }
  setW(CX, Y + 1, CZ, 'minecraft:campfire[facing=north,lit=false,signal_fire=false,waterlogged=false]');
  setW(CX, Y + 2, CZ, 'minecraft:lantern[hanging=false]');
  // flower ring for bees
  for (let t = 0; t < 360; t += 30) {
    const rad = (t * Math.PI) / 180;
    const X = Math.round(CX + Math.cos(rad) * 3);
    const Z = Math.round(CZ + Math.sin(rad) * 3);
    if (isStationCell(X, Z) || !inSchem(X, Y, Z)) continue;
    placeGrass(X, Y, Z, false);
    setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
  }
}

function meditationPavilion() {
  // small open pavilion SW corner inside wall
  const x0 = -588,
    x1 = -582,
    z0 = 372,
    z1 = 378;
  const Y = 64;
  for (let X = x0; X <= x1; X++) {
    for (let Z = z0; Z <= z1; Z++) {
      if (HOUSE(X, Z) || !inSchem(X, Y, Z)) continue;
      if (isStationCell(X, Z)) continue;
      clearSoft(X, Y, Z, 7);
      const corner = (X === x0 || X === x1) && (Z === z0 || Z === z1);
      const edge = X === x0 || X === x1 || Z === z0 || Z === z1;
      setW(X, Y, Z, 'minecraft:smooth_stone');
      if (corner) {
        for (let y = Y + 1; y <= Y + 3; y++) setW(X, y, Z, 'minecraft:spruce_log[axis=y]');
        setW(X, Y + 4, Z, 'minecraft:spruce_stairs[facing=north,half=bottom]');
      } else if (!edge) {
        setW(X, Y + 1, Z, 'minecraft:air');
        setW(X, Y + 2, Z, 'minecraft:air');
        setW(X, Y + 3, Z, 'minecraft:air');
      }
      // roof
      if (edge) setW(X, Y + 4, Z, 'minecraft:spruce_slab[type=bottom]');
      else setW(X, Y + 4, Z, 'minecraft:spruce_planks');
    }
  }
  setW(-585, Y + 1, 375, 'minecraft:spruce_stairs[facing=east,half=bottom]');
  setW(-585, Y + 1, 376, 'minecraft:spruce_stairs[facing=east,half=bottom]');
  setW(-584, Y + 1, 375, 'minecraft:carpet'); // may be invalid — use white_carpet
  setW(-584, Y + 1, 375, 'minecraft:white_carpet');
  setW(-584, Y + 1, 376, 'minecraft:white_carpet');
  setW(-585, Y + 3, 375, 'minecraft:lantern[hanging=true]');
}

function carriageStables() {
  // stub south of carriage loop
  const x0 = -590,
    x1 = -585,
    z0 = 430,
    z1 = 436;
  const Y = 64;
  for (let X = x0; X <= x1; X++) {
    for (let Z = z0; Z <= z1; Z++) {
      if (HOUSE(X, Z) || !inSchem(X, Y, Z)) continue;
      if (isStationCell(X, Z)) continue;
      clearSoft(X, Y, Z, 6);
      const edge = X === x0 || X === x1 || Z === z0 || Z === z1;
      const openFace = Z === z0 && X >= -588 && X <= -586;
      setW(X, Y, Z, 'minecraft:cobblestone');
      if (edge && !openFace) {
        for (let y = Y + 1; y <= Y + 3; y++) {
          setW(X, y, Z, y === Y + 2 && !((X + Z) % 2) ? 'minecraft:oak_fence' : 'minecraft:spruce_planks');
        }
      } else if (!edge) {
        setW(X, Y + 1, Z, 'minecraft:air');
        setW(X, Y + 2, Z, 'minecraft:air');
        setW(X, Y + 3, Z, 'minecraft:air');
      }
      setW(X, Y + 4, Z, 'minecraft:spruce_stairs[facing=south,half=bottom]');
    }
  }
  // hay + trough
  setW(-587, Y + 1, 433, 'minecraft:hay_block[axis=y]');
  setW(-586, Y + 1, 433, 'minecraft:hay_block[axis=y]');
  setW(-588, Y + 1, 434, 'minecraft:cauldron[level=3]');
  setW(-587, Y + 3, 433, 'minecraft:lantern[hanging=true]');
}

function cutawayDeepFarm() {
  // glass cutaway window on north exterior showing underground farm beds
  const x0 = -560,
    x1 = -548,
    z0 = 364,
    z1 = 367;
  const floorY = 50;
  for (let X = x0; X <= x1; X++) {
    for (let Z = z0; Z <= z1; Z++) {
      if (!inSchem(X, floorY, Z)) continue;
      for (let Y = floorY; Y <= floorY + 6; Y++) {
        const edge = X === x0 || X === x1 || Z === z0 || Z === z1 || Y === floorY || Y === floorY + 6;
        const glassFace = Z === z0 && Y > floorY && Y < floorY + 6 && X > x0 && X < x1;
        if (glassFace) setW(X, Y, Z, 'minecraft:glass');
        else if (edge) setW(X, Y, Z, 'minecraft:deepslate_bricks');
        else setW(X, Y, Z, 'minecraft:air');
      }
      // farm rows inside
      if (X > x0 && X < x1 && Z > z0 && Z < z1) {
        setW(X, floorY + 1, Z, 'minecraft:farmland[moisture=7]');
        const crops = ['minecraft:wheat[age=7]', 'minecraft:carrots[age=7]', 'minecraft:potatoes[age=7]', 'minecraft:beetroots[age=3]'];
        setW(X, floorY + 2, Z, crops[hash(X, Z) % 4]);
      }
    }
  }
  // water channel for farmland
  for (let X = x0 + 1; X <= x1 - 1; X += 3) {
    setW(X, floorY + 1, z0 + 2, 'minecraft:water');
  }
  setW(-554, floorY + 5, 365, 'minecraft:sea_lantern');
  // surface hatch plaque
  const surf = 64;
  setW(-554, surf, 366, 'minecraft:cobblestone');
  setW(-554, surf + 1, 366, 'minecraft:oak_sign[rotation=8,waterlogged=false]');
}

function nightPathGlow() {
  // buried glow under path every 5
  for (let X = -588; X <= -530; X += 5) {
    for (const Z of [420, 421]) {
      const Y = soilY(X);
      if (!inSchem(X, Y - 1, Z) || HOUSE(X, Z)) continue;
      setW(X, Y - 1, Z, 'minecraft:sea_lantern');
      // keep path surface
      const surf = getW(X, Y, Z);
      if (!/dirt_path|cobble|mossy_cobble|spruce/.test(surf)) setW(X, Y, Z, 'minecraft:dirt_path');
    }
  }
  // wall walk glowstones every 8
  for (let Z = WALL_Z1 + 4; Z <= WALL_Z2 - 4; Z += 8) {
    for (const X of [WALL_X1, WALL_X2]) {
      const ty = topTerrainY(X, Z) ?? soilY(X);
      if (!inSchem(X, ty + 1, Z)) continue;
      if (getW(X, ty, Z).includes('brick') || getW(X, ty, Z).includes('cobble')) {
        setW(X, ty + 1, Z, 'minecraft:lantern[hanging=false]');
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

function convertUncovered() {
  const stations = [];
  for (let x = 0; x < SX; x++)
    for (let y = 0; y < SY; y++)
      for (let z = 0; z < SZ; z++) {
        if (full(grid.get(x, y, z)).startsWith(STATION)) stations.push([x, y, z]);
      }
  for (let x = 0; x < SX; x++)
    for (let y = 0; y < SY; y++)
      for (let z = 0; z < SZ; z++) {
        if (!full(grid.get(x, y, z)).startsWith('minecraft:farmland')) continue;
        let ok = false;
        for (const [sx, sy, sz] of stations) {
          if (Math.max(Math.abs(sx - x), Math.abs(sz - z)) <= 4 && Math.abs(sy - y) <= 6) {
            ok = true;
            break;
          }
        }
        if (ok) continue;
        // cutaway deep farm is intentional showpiece — leave if underground glass room
        const X = wx(x),
          Y = y + ORIGIN_Y,
          Z = wz(z);
        if (Y <= 56 && Z >= 364 && Z <= 367 && X >= -560 && X <= -548) continue;
        if (HOUSE(X, Z)) continue;
        grid.set(x, y, z, 'minecraft:grass_block');
        const a = full(grid.get(x, y + 1, z));
        if (/wheat|carrot|potato|beet|grass|flower/.test(a)) grid.set(x, y + 1, z, 'minecraft:short_grass');
      }
}

function metrics() {
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
        if (!ok) uncovered++;
      }
  return {
    size: { SX, SY, SZ, ORIGIN_X, ORIGIN_Y, ORIGIN_Z },
    mapping: `localX=wx+${ORIGIN_X}, localY=wy-${ORIGIN_Y}, localZ=wz-${ORIGIN_Z}`,
    stations: stations.length,
    lattice: stations.filter(([x, , z]) => LATTICE_X.includes(wx(x)) && LATTICE_Z.includes(wz(z))).length,
    trapOk,
    farm,
    uncovered,
    panels,
  };
}

console.log('pass11 expand…');
fillExpandMargin();
waterfallCascade();
roseGarden();
pergolaWalk();
apiary();
meditationPavilion();
carriageStables();
cutawayDeepFarm();
nightPathGlow();
ensureStations();
convertUncovered();
const m = metrics();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
