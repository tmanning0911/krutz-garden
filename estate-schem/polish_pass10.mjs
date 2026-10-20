/**
 * Pass 10 — NW cliff soften, formal hedge maze, reflecting pool court,
 * herb spiral, sundial garden, pantry sorting stub, NW lookout tower.
 * ORIGIN_Y=44. Keeps ~104 lattice stations + uncovered farmland = 0.
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
const HERBS = [
  'minecraft:fern',
  'minecraft:short_grass',
  'minecraft:azure_bluet',
  'minecraft:allium',
  'minecraft:oxeye_daisy',
  'minecraft:poppy',
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
const isStationCell = (X, Z) => LATTICE_X.includes(X) && LATTICE_Z.includes(Z);
const isTerrain = (n) =>
  /grass_block|dirt$|stone$|granite|diorite|andesite|gravel|sand$|cobblestone$|farmland/.test(n);
const isSoft = (n) =>
  /short_grass|tall_grass|dandelion|poppy|allium|cornflower|oxeye|lily_of|azure|azalea|bush|leaf_litter|firefly|fern|wheat|carrot|potato|beet/.test(
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
  for (let Y = 85; Y >= 45; Y--) {
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
  else if (r < 52) setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
  else if (r < 58) setW(X, Y + 1, Z, 'minecraft:leaf_litter');
}

function reshape(X, Z, target, plant) {
  for (let y = 82; y > target; y--) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n.startsWith(STATION) || n.includes('trapdoor')) continue;
    if (/stone_brick|mossy_stone|cracked_stone|chiseled|glass|panel|battery|lantern/.test(n)) continue;
    if (isTerrain(n) || isSoft(n) || n === 'minecraft:air' || /leaves|log|vine/.test(n)) {
      setW(X, y, Z, 'minecraft:air');
    }
  }
  const cur = topTerrainY(X, Z);
  if (cur == null || cur < target) {
    for (let y = (cur ?? target - 3) + 1; y <= target; y++) {
      if (inSchem(X, y, Z)) setW(X, y, Z, 'minecraft:dirt');
    }
  }
  placeGrass(X, target, Z, plant);
}

// ─── Soften NW/W cliffs outside wall ───
function softenNWCliffs() {
  // West of west wall: blend from wall soil down
  for (let Z = WALL_Z1 - 12; Z <= WALL_Z2 + 2; Z++) {
    for (let dist = 1; dist <= 14; dist++) {
      const X = WALL_X1 - dist;
      if (!inSchem(X, 64, Z) || HOUSE(X, Z)) continue;
      const base = soilY(WALL_X1);
      const target = Math.max(56, base - Math.ceil(dist * 0.55));
      reshape(X, Z, target, dist > 1);
    }
  }
  // North of north wall: gentler steps
  for (let X = WALL_X1 - 8; X <= WALL_X2 + 4; X++) {
    for (let dist = 1; dist <= 14; dist++) {
      const Z = WALL_Z1 - dist;
      if (!inSchem(X, 64, Z) || HOUSE(X, Z)) continue;
      const base = soilY(Math.max(X, WALL_X1));
      reshape(X, Z, Math.max(56, base - dist), dist > 1);
    }
  }
  // NW corner bowl fill — kill the 6–10 block drops
  for (let X = -600; X <= -588; X++) {
    for (let Z = 352; Z <= 370; Z++) {
      if (!inSchem(X, 60, Z) || HOUSE(X, Z)) continue;
      const dx = Math.max(0, WALL_X1 - X);
      const dz = Math.max(0, WALL_Z1 - Z);
      const d = Math.max(dx, dz);
      const target = Math.max(56, 64 - Math.ceil(d * 0.7));
      reshape(X, Z, target, true);
    }
  }
}

// ─── Formal hedge maze (SW beds, avoid stations) ───
function formalHedgeMaze() {
  // 15×15 maze footprint centered ~(-580, 390)
  const x0 = -586,
    x1 = -572,
    z0 = 382,
    z1 = 396;
  const paths = new Set();
  // outer ring path
  for (let X = x0; X <= x1; X++) {
    paths.add(`${X},${z0}`);
    paths.add(`${X},${z1}`);
  }
  for (let Z = z0; Z <= z1; Z++) {
    paths.add(`${x0},${Z}`);
    paths.add(`${x1},${Z}`);
  }
  // cross corridors + dead ends (readable plan)
  for (let X = x0; X <= x1; X++) paths.add(`${X},${389}`);
  for (let Z = z0; Z <= z1; Z++) paths.add(`${-579},${Z}`);
  // side arms
  for (let X = -585; X <= -581; X++) paths.add(`${X},385`);
  for (let X = -577; X <= -573; X++) paths.add(`${X},393`);
  for (let Z = 383; Z <= 387; Z++) paths.add(`-583,${Z}`);
  for (let Z = 391; Z <= 395; Z++) paths.add(`-575,${Z}`);
  // entrance from south (toward path)
  for (let Z = 396; Z <= 400; Z++) paths.add(`-579,${Z}`);

  for (let X = x0; X <= x1; X++) {
    for (let Z = z0; Z <= z1; Z++) {
      if (HOUSE(X, Z) || !inSchem(X, 64, Z)) continue;
      if (isStationCell(X, Z)) continue;
      if (getW(X, soilY(X) + 1, Z).startsWith(STATION)) continue;
      const Y = soilY(X);
      const key = `${X},${Z}`;
      clearSoft(X, Y, Z, 4);
      if (paths.has(key)) {
        setW(X, Y, Z, hash(X, Z) % 4 === 0 ? 'minecraft:cobblestone' : 'minecraft:dirt_path');
        setW(X, Y + 1, Z, 'minecraft:air');
      } else {
        // hedge wall
        setW(X, Y, Z, 'minecraft:grass_block');
        const bush = hash(X, Z) % 3 === 0 ? 'minecraft:flowering_azalea' : 'minecraft:azalea';
        setW(X, Y + 1, Z, bush);
        if (hash(X, Z) % 5 === 0) setW(X, Y + 2, Z, 'minecraft:oak_leaves[distance=1,persistent=true]');
      }
    }
  }
  // center plinth with lantern
  const CX = -579,
    CZ = 389,
    Y = soilY(CX);
  setW(CX, Y, CZ, 'minecraft:chiseled_stone_bricks');
  setW(CX, Y + 1, CZ, 'minecraft:lantern[hanging=false]');
  setW(CX - 1, Y, CZ, 'minecraft:stone_brick_stairs[facing=east,half=bottom]');
  setW(CX + 1, Y, CZ, 'minecraft:stone_brick_stairs[facing=west,half=bottom]');
}

// ─── Reflecting pool court (SE of fountain, avoid stations) ───
function reflectingPool() {
  const CX = -548,
    CZ = 434;
  const Y = soilY(CX);
  for (let X = CX - 5; X <= CX + 5; X++) {
    for (let Z = CZ - 4; Z <= CZ + 4; Z++) {
      if (HOUSE(X, Z) || SOLAR(X, Z) || !inSchem(X, Y, Z)) continue;
      if (isStationCell(X, Z)) continue;
      if (Z >= 418 && Z <= 423) continue;
      clearSoft(X, Y, Z, 5);
      const edge = Math.abs(X - CX) === 5 || Math.abs(Z - CZ) === 4;
      const water = Math.abs(X - CX) <= 3 && Math.abs(Z - CZ) <= 2;
      for (let y = Y - 2; y < Y; y++) setW(X, y, Z, 'minecraft:dirt');
      if (edge) {
        setW(X, Y, Z, brickMix(X, Y, Z));
        if ((X + Z) % 3 === 0) setW(X, Y + 1, Z, 'minecraft:stone_brick_wall');
        else if ((X + Z) % 3 === 1) setW(X, Y + 1, Z, 'minecraft:lantern[hanging=false]');
      } else if (water) {
        setW(X, Y - 1, Z, 'minecraft:stone_bricks');
        setW(X, Y, Z, 'minecraft:water');
        if (hash(X, Z) % 5 === 0) setW(X, Y + 1, Z, 'minecraft:lily_pad');
        // sea lantern glow under water for night
        if ((X + Z) % 4 === 0) setW(X, Y - 1, Z, 'minecraft:sea_lantern');
      } else {
        setW(X, Y, Z, 'minecraft:grass_block');
        setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
      }
    }
  }
  // bridge across short axis
  for (let X = CX - 3; X <= CX + 3; X++) {
    setW(X, Y, CZ, 'minecraft:spruce_slab[type=bottom]');
    setW(X, Y + 1, CZ, 'minecraft:air');
  }
  setW(CX, Y, CZ, 'minecraft:spruce_planks');
  setW(CX, Y + 1, CZ, 'minecraft:lantern[hanging=false]');
}

// ─── Herb spiral near house pantry (west lawn, outside house) ───
function herbSpiral() {
  const CX = -588,
    CZ = 404;
  const Y = 64;
  if (!inSchem(CX, Y, CZ) || HOUSE(CX, CZ)) return;
  // raised spiral of dirt/grass rings
  for (let r = 0; r <= 3; r++) {
    for (let t = 0; t < 360; t += 20) {
      const rad = (t * Math.PI) / 180;
      const X = Math.round(CX + Math.cos(rad) * r);
      const Z = Math.round(CZ + Math.sin(rad) * r);
      if (HOUSE(X, Z) || !inSchem(X, Y, Z)) continue;
      if (isStationCell(X, Z)) continue;
      const h = Y + Math.floor(r * 0.6);
      clearSoft(X, h, Z, 3);
      for (let y = Y - 1; y < h; y++) setW(X, y, Z, 'minecraft:dirt');
      setW(X, h, Z, 'minecraft:grass_block');
      setW(X, h + 1, Z, HERBS[hash(X, Z) % HERBS.length]);
    }
  }
  setW(CX, Y + 2, CZ, 'minecraft:composter[level=4]');
  setW(CX, Y + 3, CZ, 'minecraft:flower_pot');
}

// ─── Sundial garden north of path ───
function sundialGarden() {
  const CX = -568,
    CZ = 412;
  const Y = soilY(CX);
  for (let X = CX - 3; X <= CX + 3; X++) {
    for (let Z = CZ - 3; Z <= CZ + 3; Z++) {
      if (HOUSE(X, Z) || !inSchem(X, Y, Z)) continue;
      if (isStationCell(X, Z)) continue;
      if (Z >= 418 && Z <= 423) continue;
      clearSoft(X, Y, Z, 4);
      const d = Math.max(Math.abs(X - CX), Math.abs(Z - CZ));
      if (d === 3) {
        setW(X, Y, Z, brickMix(X, Y, Z));
        if ((X + Z) % 2 === 0) setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
      } else if (d === 0) {
        setW(X, Y, Z, 'minecraft:chiseled_stone_bricks');
        setW(X, Y + 1, Z, 'minecraft:daylight_detector[inverted=false,power=0]');
        setW(X, Y + 2, Z, 'minecraft:end_rod[facing=up]');
      } else {
        setW(X, Y, Z, 'minecraft:smooth_stone');
        setW(X, Y + 1, Z, 'minecraft:air');
      }
    }
  }
  // hour marks
  for (const [dx, dz] of [
    [0, -2],
    [2, 0],
    [0, 2],
    [-2, 0],
    [1, -1],
    [1, 1],
    [-1, 1],
    [-1, -1],
  ]) {
    setW(CX + dx, Y, CZ + dz, 'minecraft:stone_brick_slab[type=bottom]');
  }
}

// ─── Pantry / sorting stub under east pavilion approach ───
function pantrySortingStub() {
  const x0 = -536,
    x1 = -530,
    z0 = 426,
    z1 = 432;
  const floorY = 62;
  for (let X = x0; X <= x1; X++) {
    for (let Z = z0; Z <= z1; Z++) {
      if (!inSchem(X, floorY, Z) || HOUSE(X, Z) || SOLAR(X, Z)) continue;
      if (isStationCell(X, Z)) continue;
      for (let Y = floorY; Y <= floorY + 4; Y++) {
        const edge = X === x0 || X === x1 || Z === z0 || Z === z1 || Y === floorY || Y === floorY + 4;
        if (edge) setW(X, Y, Z, Y === floorY ? 'minecraft:spruce_planks' : 'minecraft:cobblestone');
        else setW(X, Y, Z, 'minecraft:air');
      }
    }
  }
  // barrels / sorting labels as barrels + item frames via chests
  const labels = [
    [-534, 428, 'minecraft:barrel[facing=up,open=false]'],
    [-533, 428, 'minecraft:barrel[facing=up,open=false]'],
    [-532, 428, 'minecraft:barrel[facing=up,open=false]'],
    [-534, 430, 'minecraft:chest[facing=south,type=single,waterlogged=false]'],
    [-533, 430, 'minecraft:chest[facing=south,type=single,waterlogged=false]'],
    [-532, 430, 'minecraft:hopper[facing=down,enabled=true]'],
  ];
  for (const [X, Z, b] of labels) {
    if (inSchem(X, floorY + 1, Z)) setW(X, floorY + 1, Z, b);
  }
  setW(-533, floorY + 3, 429, 'minecraft:lantern[hanging=true]');
  // hatch up to surface near path
  const surf = soilY(-533);
  setW(-533, surf, 425, 'minecraft:spruce_trapdoor[facing=north,half=top,open=false,waterlogged=false]');
  for (let i = 0; i < 4; i++) {
    const Y = surf - i;
    if (inSchem(-533, Y, 426 + i)) {
      setW(-533, Y, 426 + i, 'minecraft:spruce_stairs[facing=north,half=bottom]');
    }
  }
}

// ─── NW lookout tower on wall corner ───
function nwLookout() {
  const CX = WALL_X1,
    CZ = WALL_Z1;
  const base = soilY(CX);
  for (let dx = 0; dx <= 2; dx++) {
    for (let dz = 0; dz <= 2; dz++) {
      const X = CX + dx,
        Z = CZ + dz;
      if (HOUSE(X, Z) || !inSchem(X, base, Z)) continue;
      const edge = dx === 0 || dx === 2 || dz === 0 || dz === 2;
      for (let Y = base; Y <= base + 11; Y++) {
        if (Y < base + 9) {
          if (edge) setW(X, Y, Z, brickMix(X, Y, Z));
          else setW(X, Y, Z, 'minecraft:air');
        } else if (Y === base + 9) {
          setW(X, Y, Z, 'minecraft:stone_brick_slab[type=bottom]');
        }
      }
      if (edge) {
        setW(X, base + 10, Z, 'minecraft:stone_brick_wall');
        if ((dx + dz) % 2 === 0) setW(X, base + 11, Z, 'minecraft:lantern[hanging=false]');
      }
    }
  }
  // interior ladder
  for (let Y = base + 1; Y <= base + 8; Y++) {
    setW(CX + 1, Y, CZ + 1, 'minecraft:ladder[facing=south,waterlogged=false]');
  }
  setW(CX + 1, base, CZ + 1, 'minecraft:spruce_planks');
  // spyglass perch
  setW(CX + 1, base + 9, CZ + 1, 'minecraft:spruce_slab[type=bottom]');
  setW(CX + 1, base + 10, CZ + 1, 'minecraft:lantern[hanging=false]');
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

console.log('pass10…');
softenNWCliffs();
formalHedgeMaze();
reflectingPool();
herbSpiral();
sundialGarden();
pantrySortingStub();
nwLookout();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
