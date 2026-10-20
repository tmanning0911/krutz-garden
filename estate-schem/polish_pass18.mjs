/**
 * Pass 18 — fill schem undercroft to remove floating columns, soft NW
 * saddle, rose-arch walk, beehive expansion, tool rack, quarry overlook,
 * crop stripe micro-breaks. Mapping: +634/-44/-348.
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
const setHouseSafe = (X, Y, Z, b) => {
  // allow fill under house footprint underground only
  if (!inSchem(X, Y, Z)) return;
  if (HOUSE(X, Z) && Y >= 64) return;
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
  /grass_block|dirt$|stone$|granite|diorite|andesite|gravel|sand$|cobblestone$|farmland|coarse_dirt|moss_block|path|polished_andesite|smooth_stone|packed_ice/.test(
    n,
  );
const isSoft = (n) =>
  /short_grass|tall_grass|dandelion|poppy|allium|cornflower|oxeye|lily_of|azure|azalea|bush|leaf_litter|firefly|fern|wheat|carrot|potato|beet|petal|tulip|orchid|lilac|vine|berry|rail/.test(
    n,
  );
const isOutside = (X, Z) => X < WALL_X1 || X > WALL_X2 || Z < WALL_Z1 || Z > WALL_Z2;

function topTerrainY(X, Z) {
  for (let Y = 88; Y >= 45; Y--) {
    if (!inSchem(X, Y, Z)) continue;
    const n = getW(X, Y, Z);
    if (isTerrain(n) || n.includes('dirt_path') || /stone_brick|mossy|cracked|cobble|hay|andesite|smooth_stone/.test(n))
      return Y;
  }
  return null;
}

function clearSoft(X, Y, Z, h = 5) {
  for (let y = Y + 1; y <= Y + h; y++) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n.startsWith(STATION) || n.includes('trapdoor')) continue;
    if (/fence|door|gate|wall|pane|plank|log|stair|slab|brick|lantern|glass|panel|battery|sign|banner|composter|barrel|hay|lectern|rail|wool|end_rod|pumpkin/.test(n))
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
  else if (r < 58) setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
}

/** Fill every column from schem floor up to surface — kills floating look */
function fillUndercroft() {
  for (let lx = 0; lx < SX; lx++) {
    for (let lz = 0; lz < SZ; lz++) {
      const X = wx(lx),
        Z = wz(lz);
      if (WEST_WATER(X, Z)) {
        // keep water column: dirt to 60, water 61-62
        for (let ly = 1; ly <= toLY(60); ly++) {
          const n = full(grid.get(lx, ly, lz));
          if (n === 'minecraft:air' || isSoft(n)) grid.set(lx, ly, lz, 'minecraft:dirt');
        }
        continue;
      }
      let top = null;
      for (let ly = SY - 1; ly >= 1; ly--) {
        const n = full(grid.get(lx, ly, lz));
        if (isTerrain(n) || n.includes('dirt_path') || /stone_brick|mossy|cracked|cobble|plank|log|deepslate|andesite|farmland|packed_ice|polished/.test(n)) {
          top = ly;
          break;
        }
      }
      if (top == null) continue;
      for (let ly = 1; ly < top; ly++) {
        const n = full(grid.get(lx, ly, lz));
        // preserve intentional basements
        if (/battery|panel|packed_ice|barrel|chest|ladder|rail|sea_lantern|cable|glass|lantern|crafting|furnace|blast|smoker|hopper|torch/.test(n))
          continue;
        if (n === 'minecraft:air' || isSoft(n) || n.includes('water')) {
          // don't overwrite west water already handled
          if (HOUSE(X, Z) && ly >= toLY(64)) continue;
          grid.set(lx, ly, lz, 'minecraft:dirt');
        }
      }
    }
  }
}

function softenExterior() {
  const isOut = isOutside;
  for (let pass = 0; pass < 8; pass++) {
    const edits = [];
    for (let X = -633; X <= -512; X++) {
      for (let Z = 348; Z <= 490; Z++) {
        if (!isOut(X, Z) || HOUSE(X, Z) || SOLAR(X, Z) || WEST_WATER(X, Z) || !inSchem(X, 56, Z)) continue;
        const y0 = topTerrainY(X, Z);
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
          if (!isOut(X2, Z2) || !inSchem(X2, 56, Z2) || HOUSE(X2, Z2) || WEST_WATER(X2, Z2)) continue;
          const y1 = topTerrainY(X2, Z2);
          if (y1 != null) minN = Math.min(minN, y1);
        }
        if (y0 > minN + 1) edits.push([X, Z, minN + 1]);
      }
    }
    for (const [X, Z, t] of edits) {
      for (let y = 85; y > t; y--) {
        if (!inSchem(X, y, Z)) continue;
        const n = getW(X, y, Z);
        if (n.startsWith(STATION) || /trapdoor|brick|plank|log|fence|lantern|glass|panel|wool|rail|hay|pumpkin|lectern|barrel/.test(n))
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

function roseArchWalk() {
  for (let i = 0; i < 8; i++) {
    const X = -568 + i;
    const Z = 388;
    if (isStationCell(X, Z) || !inSchem(X, 64, Z)) continue;
    const Y = soilY(X);
    setW(X, Y, Z, 'minecraft:dirt_path');
    clearSoft(X, Y, Z, 3);
    if (i % 2 === 0) {
      setW(X, Y + 1, Z - 1, 'minecraft:oak_fence');
      setW(X, Y + 2, Z - 1, 'minecraft:oak_fence');
      setW(X, Y + 3, Z - 1, 'minecraft:oak_fence');
      setW(X, Y + 1, Z + 1, 'minecraft:oak_fence');
      setW(X, Y + 2, Z + 1, 'minecraft:oak_fence');
      setW(X, Y + 3, Z + 1, 'minecraft:oak_fence');
      setW(X, Y + 3, Z, 'minecraft:oak_fence');
      setW(X, Y + 4, Z, 'minecraft:pink_petals');
      setW(X, Y + 2, Z - 1, 'minecraft:vine');
      setW(X, Y + 2, Z + 1, 'minecraft:vine');
    }
  }
}

function moreBeehives() {
  for (const [X, Z] of [
    [-574, 448],
    [-570, 452],
    [-566, 448],
  ]) {
    if (isStationCell(X, Z) || !inSchem(X, 64, Z)) continue;
    const Y = soilY(X);
    setW(X, Y + 1, Z, 'minecraft:oak_log');
    setW(X, Y + 2, Z, 'minecraft:bee_nest[facing=south,honey_level=3]');
    placeGrass(X + 1, Y, Z, false);
    setW(X + 1, Y + 1, Z, 'minecraft:oxeye_daisy');
  }
}

function toolRack() {
  const CX = -548,
    CZ = 404,
    Y = soilY(CX);
  for (let dx = -1; dx <= 1; dx++) {
    if (isStationCell(CX + dx, CZ)) continue;
    setW(CX + dx, Y, CZ, 'minecraft:spruce_planks');
    clearSoft(CX + dx, Y, CZ, 2);
    setW(CX + dx, Y + 1, CZ, 'minecraft:spruce_fence');
  }
  setW(CX, Y + 2, CZ, 'minecraft:lantern[hanging=false]');
  setW(CX - 1, Y + 2, CZ, 'minecraft:flower_pot');
  setW(CX + 1, Y + 1, CZ + 1, 'minecraft:barrel[facing=up,open=false]');
}

function quarryOverlook() {
  // stone bench overlook east of amphitheatre
  for (let X = -518; X <= -514; X++) {
    for (let Z = 432; Z <= 436; Z++) {
      if (SOLAR(X, Z) || !inSchem(X, 66, Z)) continue;
      const Y = 67;
      setW(X, Y, Z, 'minecraft:cobblestone');
      clearSoft(X, Y, Z, 2);
    }
  }
  setW(-516, 68, 434, 'minecraft:spruce_stairs[facing=west,half=bottom]');
  setW(-516, 68, 435, 'minecraft:spruce_stairs[facing=west,half=bottom]');
  setW(-515, 68, 433, 'minecraft:lantern[hanging=false]');
}

function cropMicroBreaks() {
  for (let X = WALL_X1 + 3; X < WALL_X2 - 3; X += 2) {
    const Y = soilY(X);
    for (let Z = WALL_Z1 + 5; Z < WALL_Z2 - 5; Z++) {
      if (HOUSE(X, Z) || Z >= 418 && Z <= 423 || isStationCell(X, Z)) continue;
      if (LATTICE_X.includes(X) && LATTICE_Z.some((sz) => Math.abs(sz - Z) <= 1)) continue;
      if (!/wheat|carrot|potato|beet/.test(getW(X, Y + 1, Z))) continue;
      if (hash(X, Z) % 37 !== 0) continue;
      placeGrass(X, Y, Z, true);
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
      if (!isOutside(X, Z) || HOUSE(X, Z) || SOLAR(X, Z) || !inSchem(X, 64, Z)) continue;
      const y0 = topTerrainY(X, Z);
      if (y0 == null) continue;
      for (const [dx, dz] of [
        [1, 0],
        [0, 1],
      ]) {
        const X2 = X + dx,
          Z2 = Z + dz;
        if (!isOutside(X2, Z2) || !inSchem(X2, 64, Z2) || HOUSE(X2, Z2) || SOLAR(X2, Z2)) continue;
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
    exteriorCliffs: cliffs,
    westWaterBlocks: water,
  };
}

console.log('pass18…');
softenExterior();
fillUndercroft();
roseArchWalk();
moreBeehives();
toolRack();
quarryOverlook();
cropMicroBreaks();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
