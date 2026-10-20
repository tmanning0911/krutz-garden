/**
 * Pass 28 — final polish: soft remaining exterior cliffs, path verge
 * flower density, gate welcome mats, solar panel polish rows, station
 * hatch audit, overview metrics dump. Mapping +634/-44/-348.
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
];
const PANELS = [
  'alaindustrial:radiant_solar_panel',
  'alaindustrial:moonlit_solar_panel',
  'alaindustrial:daylight_solar_panel',
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
const setSolar = (X, Y, Z, b) => {
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
  /grass_block|dirt$|stone$|granite|diorite|andesite|gravel|sand$|cobblestone$|farmland|coarse_dirt|moss_block|path|podzol/.test(
    n,
  );
const isSoft = (n) =>
  /short_grass|tall_grass|dandelion|poppy|allium|cornflower|oxeye|lily_of|azure|azalea|bush|leaf_litter|firefly|fern|wheat|carrot|potato|beet|petal|tulip|orchid|lilac|vine|mushroom|candle|sapling/.test(
    n,
  );

function topTerrainY(X, Z) {
  for (let Y = 90; Y >= 45; Y--) {
    if (!inSchem(X, Y, Z)) continue;
    const n = getW(X, Y, Z);
    if (isTerrain(n) || n.includes('dirt_path') || /stone_brick|mossy|cracked|cobble|andesite|smooth_stone/.test(n))
      return Y;
  }
  return null;
}

function clearSoft(X, Y, Z, h = 5) {
  for (let y = Y + 1; y <= Y + h; y++) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n.startsWith(STATION) || n.includes('trapdoor')) continue;
    if (/fence|door|gate|wall|pane|plank|log|stair|slab|brick|lantern|glass|panel|battery|sign|banner|ladder|campfire/.test(n))
      break;
    if (isSoft(n) || n === 'minecraft:air' || isTerrain(n) || /leaves|crop|wheat|carrot|potato|beet/.test(n))
      setW(X, y, Z, 'minecraft:air');
    else break;
  }
}

function placeGrass(X, Y, Z, plant = true) {
  if (!inSchem(X, Y, Z) || HOUSE(X, Z)) return;
  for (let y = Math.max(ORIGIN_Y + 1, Y - 4); y < Y; y++) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n === 'minecraft:air' || isSoft(n) || isTerrain(n)) setW(X, y, Z, 'minecraft:dirt');
  }
  setW(X, Y, Z, 'minecraft:grass_block');
  clearSoft(X, Y, Z, 4);
  if (!plant) return;
  const r = hash(X, Z) % 100;
  if (r < 42) setW(X, Y + 1, Z, 'minecraft:short_grass');
  else if (r < 62) setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
}

function reshape(X, Z, target, plant) {
  for (let y = 88; y > target; y--) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n.startsWith(STATION) || n.includes('trapdoor')) continue;
    if (/stone_brick|mossy_stone|cracked_stone|chiseled|glass|panel|battery|lantern|deepslate|campfire/.test(n))
      continue;
    if (isTerrain(n) || isSoft(n) || n === 'minecraft:air' || /leaves|log|vine|petal/.test(n)) setW(X, y, Z, 'minecraft:air');
  }
  for (let y = ORIGIN_Y + 1; y < target; y++) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n === 'minecraft:air' || isSoft(n)) setW(X, y, Z, 'minecraft:dirt');
  }
  placeGrass(X, target, Z, plant);
}

function softenExterior() {
  // only outside wall, ignore wall-face cliff vs wall top
  for (let X = WALL_X1 - 12; X <= WALL_X2 + 18; X++) {
    for (let Z = WALL_Z1 - 14; Z <= WALL_Z2 + 8; Z++) {
      const outside = X < WALL_X1 || X > WALL_X2 || Z < WALL_Z1 || Z > WALL_Z2;
      if (!outside || HOUSE(X, Z) || SOLAR(X, Z) || !inSchem(X, 60, Z)) continue;
      if (X >= -622 && X <= -618 && Z >= 408 && Z <= 432) continue; // water
      const y0 = topTerrainY(X, Z);
      if (y0 == null) continue;
      for (const [dx, dz] of [
        [1, 0],
        [0, 1],
      ]) {
        const X2 = X + dx,
          Z2 = Z + dz;
        if (!inSchem(X2, 60, Z2) || HOUSE(X2, Z2) || SOLAR(X2, Z2)) continue;
        const outside2 = X2 < WALL_X1 || X2 > WALL_X2 || Z2 < WALL_Z1 || Z2 > WALL_Z2;
        if (!outside2) continue;
        const y1 = topTerrainY(X2, Z2);
        if (y1 == null) continue;
        if (Math.abs(y0 - y1) >= 2) {
          const mid = Math.floor((y0 + y1) / 2);
          reshape(X, Z, mid, true);
          reshape(X2, Z2, mid, true);
        }
      }
    }
  }
}

function pathVerges() {
  for (let X = -588; X <= -530; X++) {
    for (const Z of [417, 418, 423, 424]) {
      if (HOUSE(X, Z) || isStationCell(X, Z) || !inSchem(X, soilY(X), Z)) continue;
      if (getW(X, soilY(X) + 1, Z).startsWith(STATION)) continue;
      const Y = soilY(X);
      const n = getW(X, Y + 1, Z);
      if (/fence|lantern|stair|log|brick|panel|glass|door|gate/.test(n)) continue;
      if (hash(X, Z) % 100 < 55) {
        placeGrass(X, Y, Z, false);
        setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
      }
    }
  }
}

function gateWelcome() {
  for (const Z of [420, 421]) {
    for (const X of [-527, -526, -525]) {
      if (SOLAR(X, Z) || !inSchem(X, 70, Z)) continue;
      setW(X, 70, Z, hash(X, Z) % 2 ? 'minecraft:dirt_path' : 'minecraft:cobblestone');
      clearSoft(X, 70, Z, 2);
    }
  }
  for (const Z of [419, 422]) {
    setW(-526, 70, Z, 'minecraft:grass_block');
    setW(-526, 71, Z, 'minecraft:potted_flowering_azalea_bush');
  }
}

function solarPanelPolish() {
  for (let X = -526; X <= -514; X++) {
    for (let Z = 446; Z <= 464; Z++) {
      if (!inSchem(X, 70, Z)) continue;
      if (Z === 455 || X === -520) continue; // service
      const surf = topTerrainY(X, Z) ?? 70;
      if ((X + Z) % 2 === 0) {
        setSolar(X, surf, Z, 'minecraft:smooth_stone');
        setSolar(X, surf + 1, Z, PANELS[hash(X, Z) % PANELS.length]);
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
    trapOk = 0,
    panels = 0,
    lanterns = 0;
  for (const [x, y, z] of stations) if (full(grid.get(x, y + 1, z)).includes('trapdoor')) trapOk++;
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
            const a = full(grid.get(x, y + 1, z));
            if (/wheat|carrot|potato|beet|grass|flower|poppy|allium|lilac|mushroom|orchid/.test(a))
              grid.set(x, y + 1, z, 'minecraft:short_grass');
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
    mapping: `localX=wx+${ORIGIN_X}, localY=wy-${ORIGIN_Y}, localZ=wz-${ORIGIN_Z}`,
    stations: stations.length,
    lattice: stations.filter(([x, , z]) => LATTICE_X.includes(wx(x)) && LATTICE_Z.includes(wz(z))).length,
    trapOk,
    farm,
    uncovered,
    panels,
    lanterns,
  };
}

console.log('pass28 final polish…');
softenExterior();
pathVerges();
gateWelcome();
solarPanelPolish();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
