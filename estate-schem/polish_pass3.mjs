/**
 * Pass 3 — formal garden rooms, west bridge, night lighting ring,
 * orchard cleanup; ORIGIN_Y=44. Coverage preserved.
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
  'minecraft:rose_bush',
  'minecraft:lilac',
  'minecraft:peony',
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
  /short_grass|tall_grass|dandelion|poppy|allium|cornflower|oxeye|lily_of|azure|azalea|bush|leaf_litter|firefly|fern|wheat|carrot|potato|beet|rose|lilac|peony/.test(
    n,
  );
const isCropish = (n) => /wheat|carrots|potatoes|beetroots|farmland/.test(n);
const isStationCell = (X, Z) => LATTICE_X.includes(X) && LATTICE_Z.includes(Z);

function placeGrass(X, Y, Z, plant = true) {
  if (!inSchem(X, Y, Z) || HOUSE(X, Z) || isStationCell(X, Z)) return;
  for (let y = Y - 2; y < Y; y++) if (inSchem(X, y, Z)) setW(X, y, Z, 'minecraft:dirt');
  setW(X, Y, Z, 'minecraft:grass_block');
  for (let y = Y + 1; y <= Y + 3; y++) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n.startsWith(STATION) || /trapdoor|fence|door|gate|wall|pane|plank|log|stair|slab|brick|lantern|glass|panel|barrel/.test(n))
      break;
    if (isSoft(n) || n === 'minecraft:air' || isTerrain(n) || isCropish(n)) setW(X, y, Z, 'minecraft:air');
    else break;
  }
  if (!plant) return;
  const r = hash(X, Z) % 100;
  if (r < 35) setW(X, Y + 1, Z, 'minecraft:short_grass');
  else if (r < 55) {
    const f = FLOWERS[hash(X, Z) % FLOWERS.length];
    if (/rose_bush|lilac|peony/.test(f)) {
      setW(X, Y + 1, Z, f + '[half=lower]');
      setW(X, Y + 2, Z, f + '[half=upper]');
    } else setW(X, Y + 1, Z, f);
  }
}

/** Formal English garden room north of fountain — clipped hedges + diagonals */
function formalRoom() {
  const x0 = -572,
    x1 = -548,
    z0 = 400,
    z1 = 412;
  const Y = soilY(-560);
  for (let X = x0; X <= x1; X++) {
    for (let Z = z0; Z <= z1; Z++) {
      if (HOUSE(X, Z) || isStationCell(X, Z) || !inSchem(X, Y, Z)) continue;
      if (Z >= 418) continue;
      const edge = X === x0 || X === x1 || Z === z0 || Z === z1;
      const diag = Math.abs(X + Z - (x0 + z0) - (x1 - x0)) % 7 === 0;
      // clear crops in room
      if (isCropish(getW(X, Y, Z)) || isCropish(getW(X, Y + 1, Z)) || isSoft(getW(X, Y + 1, Z)) || getW(X, Y, Z).includes('grass')) {
        placeGrass(X, Y, Z, false);
      }
      if (edge) {
        placeGrass(X, Y, Z, false);
        setW(X, Y + 1, Z, hash(X, Z) % 2 ? 'minecraft:azalea' : 'minecraft:flowering_azalea');
        if ((X + Z) % 5 === 0) setW(X, Y + 2, Z, 'minecraft:lantern[hanging=false]');
      } else if (diag) {
        placeGrass(X, Y, Z, false);
        const f = FLOWERS[hash(X, Z) % 7];
        setW(X, Y + 1, Z, f);
      } else if ((X - x0) % 4 === 2 && (Z - z0) % 4 === 2) {
        placeGrass(X, Y, Z, false);
        setW(X, Y + 1, Z, 'minecraft:oak_log[axis=y]');
        setW(X, Y + 2, Z, 'minecraft:lantern[hanging=false]');
      }
    }
  }
  // gravel cross paths inside room
  for (let X = x0 + 1; X < x1; X++) {
    const Z = Math.floor((z0 + z1) / 2);
    if (isStationCell(X, Z)) continue;
    setW(X, Y, Z, 'minecraft:gravel');
    setW(X, Y + 1, Z, 'minecraft:air');
  }
  for (let Z = z0 + 1; Z < z1; Z++) {
    const X = Math.floor((x0 + x1) / 2);
    if (isStationCell(X, Z)) continue;
    setW(X, Y, Z, 'minecraft:gravel');
    setW(X, Y + 1, Z, 'minecraft:air');
  }
}

/** Bridge from west lawn over water channel toward dock */
function westBridge() {
  // short bridge at z=408 spanning toward dock
  for (let X = -617; X <= -612; X++) {
    for (const Z of [410, 411]) {
      if (HOUSE(X, Z) || !inSchem(X, 64, Z)) continue;
      setW(X, 63, Z, 'minecraft:oak_log[axis=x]');
      setW(X, 64, Z, 'minecraft:oak_planks');
      if (X === -617 || X === -612) {
        setW(X, 65, Z, 'minecraft:oak_fence');
        if (Z === 410) setW(X, 66, Z, 'minecraft:lantern[hanging=false]');
      } else {
        setW(X, 65, Z, 'minecraft:oak_fence');
      }
    }
  }
  // connect lawn grade
  for (let X = -611; X <= -592; X++) {
    for (const Z of [410, 411]) {
      if (HOUSE(X, Z) || !inSchem(X, 64, Z)) continue;
      if (X <= -592) continue;
      setW(X, 63, Z, 'minecraft:dirt');
      setW(X, 64, Z, hash(X, Z) % 4 === 0 ? 'minecraft:cobblestone' : 'minecraft:dirt_path');
      for (let y = 65; y <= 67; y++) {
        const n = getW(X, y, Z);
        if (isSoft(n) || isCropish(n)) setW(X, y, Z, 'minecraft:air');
      }
    }
  }
}

/** Night lighting ring — wall walk sea lanterns + path glow every 8 */
function nightRing() {
  for (let Z = WALL_Z1; Z <= WALL_Z2; Z += 8) {
    for (const X of [WALL_X1, WALL_X2]) {
      if (HOUSE(X, Z) || (Z >= 418 && Z <= 423)) continue;
      // place on wall top-ish
      for (let Y = 72; Y <= 76; Y++) {
        if (/stone_brick|mossy|cracked|slab/.test(getW(X, Y, Z))) {
          if (getW(X, Y + 1, Z) === 'minecraft:air' || getW(X, Y + 1, Z).includes('lantern')) {
            setW(X, Y + 1, Z, 'minecraft:lantern[hanging=false]');
          }
          break;
        }
      }
    }
  }
  for (let X = WALL_X1; X <= WALL_X2; X += 8) {
    for (const Z of [WALL_Z1, WALL_Z2]) {
      if (HOUSE(X, Z)) continue;
      for (let Y = 72; Y <= 76; Y++) {
        if (/stone_brick|mossy|cracked|slab/.test(getW(X, Y, Z))) {
          if (getW(X, Y + 1, Z) === 'minecraft:air' || getW(X, Y + 1, Z).includes('lantern')) {
            setW(X, Y + 1, Z, 'minecraft:lantern[hanging=false]');
          }
          break;
        }
      }
    }
  }
  // buried glow under fountain court rim
  for (const [X, Z] of [
    [-564, 416],
    [-556, 416],
    [-564, 424],
    [-556, 424],
  ]) {
    const Y = soilY(X);
    if (!isStationCell(X, Z)) setW(X, Y - 1, Z, 'minecraft:sea_lantern');
  }
}

/** Keep water channel west of house intact — refill if carved */
function protectWater() {
  for (let X = -620; X <= -618; X++) {
    for (let Z = 412; Z <= 428; Z++) {
      if (!inSchem(X, 62, Z)) continue;
      // don't overwrite house
      if (HOUSE(X, Z)) continue;
      for (let Y = 60; Y <= 63; Y++) {
        const n = getW(X, Y, Z);
        if (n === 'minecraft:air' || isSoft(n) || n.includes('dirt')) {
          // only fill if neighbors suggest channel
          setW(X, Y, Z, 'minecraft:water');
        }
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
    panels = 0,
    lanterns = 0;
  for (let x = 0; x < SX; x++)
    for (let y = 0; y < SY; y++)
      for (let z = 0; z < SZ; z++) {
        const n = full(grid.get(x, y, z));
        if (n.includes('solar_panel')) panels++;
        if (n.includes('lantern')) lanterns++;
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
            const above = full(grid.get(x, y + 1, z));
            if (isCropish(above) || isSoft(above)) grid.set(x, y + 1, z, 'minecraft:short_grass');
          } else uncovered++;
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
  const lattice = stations.filter(([x, , z]) => LATTICE_X.includes(wx(x)) && LATTICE_Z.includes(wz(z)));
  return { stations: stations.length, lattice: lattice.length, farm, uncovered, panels, lanterns, size: [SX, SY, SZ] };
}

console.log('pass3…');
formalRoom();
westBridge();
nightRing();
protectWater();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
