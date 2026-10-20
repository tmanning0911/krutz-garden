/**
 * Pass 6 — orchard well, battery-hall signage barrels, more leaf litter,
 * south skirt flowers, gate banner posts; ORIGIN_Y=44.
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
  'minecraft:azure_bluet',
];
const full = (b) => (typeof b === 'string' ? b : String(b ?? 'minecraft:air'));
const getW = (X, Y, Z) => full(grid.get(toLX(X), toLY(Y), toLZ(Z)));
const setW = (X, Y, Z, b) => {
  if (HOUSE(X, Z)) return;
  grid.set(toLX(X), toLY(Y), toLZ(Z), b);
};
const setSolar = (X, Y, Z, b) => grid.set(toLX(X), toLY(Y), toLZ(Z), b);
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

function topTerrainY(X, Z) {
  for (let Y = 85; Y >= 45; Y--) {
    if (!inSchem(X, Y, Z)) continue;
    const n = getW(X, Y, Z);
    if (isTerrain(n) || n.includes('dirt_path')) return Y;
  }
  return null;
}

function orchardWell() {
  const CX = -560,
    CZ = 392,
    Y = soilY(CX);
  if (isStationCell(CX, CZ)) return;
  for (let X = CX - 1; X <= CX + 1; X++) {
    for (let Z = CZ - 1; Z <= CZ + 1; Z++) {
      if (isStationCell(X, Z)) continue;
      setW(X, Y, Z, 'minecraft:cobblestone');
      if (X === CX && Z === CZ) {
        setW(X, Y - 1, Z, 'minecraft:water');
        setW(X, Y, Z, 'minecraft:air');
        setW(X, Y - 2, Z, 'minecraft:cobblestone');
      } else {
        setW(X, Y + 1, Z, 'minecraft:cobblestone_wall');
      }
    }
  }
  setW(CX, Y + 2, CZ - 1, 'minecraft:oak_fence');
  setW(CX, Y + 2, CZ + 1, 'minecraft:oak_fence');
  setW(CX, Y + 3, CZ - 1, 'minecraft:oak_slab[type=bottom]');
  setW(CX, Y + 3, CZ, 'minecraft:oak_slab[type=bottom]');
  setW(CX, Y + 3, CZ + 1, 'minecraft:oak_slab[type=bottom]');
  setW(CX, Y + 2, CZ, 'minecraft:lantern[hanging=true]');
}

function batterySignage() {
  // barrels + lectern-like marker in battery hall
  setSolar(-522, 53, 451, 'minecraft:barrel[facing=south]');
  setSolar(-518, 53, 451, 'minecraft:barrel[facing=south]');
  setSolar(-520, 53, 459, 'minecraft:oak_planks');
  setSolar(-520, 54, 459, 'minecraft:lantern[hanging=false]');
  setSolar(-521, 53, 459, 'minecraft:barrel[facing=east]');
  setSolar(-519, 53, 459, 'minecraft:barrel[facing=west]');
  // cable spine clarity
  for (let X = -523; X <= -517; X++) {
    setSolar(X, 52, 455, 'minecraft:deepslate_tiles');
    if (X % 2 === 0) setSolar(X, 53, 455, 'alaindustrial:insulated_copper_cable');
  }
}

function southSkirtFlowers() {
  for (let X = -590; X <= -528; X++) {
    for (let dist = 1; dist <= 8; dist++) {
      const Z = 474 + dist;
      if (SOLAR(X, Z) || HOUSE(X, Z) || !inSchem(X, 64, Z)) continue;
      const ty = topTerrainY(X, Z);
      if (ty == null) continue;
      if (!getW(X, ty, Z).includes('grass')) continue;
      if (getW(X, ty + 1, Z) !== 'minecraft:air' && !/grass|flower|dandelion|poppy/.test(getW(X, ty + 1, Z)))
        continue;
      const r = hash(X, Z) % 100;
      if (r < 45) setW(X, ty + 1, Z, 'minecraft:short_grass');
      else if (r < 70) setW(X, ty + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
    }
  }
}

function leafLitterSweep() {
  for (let X = -620; X <= -514; X++) {
    for (let Z = 360; Z <= 488; Z++) {
      if (!inSchem(X, 70, Z) || HOUSE(X, Z)) continue;
      let leaves = false;
      for (let Y = 68; Y <= 80; Y++) {
        if (getW(X, Y, Z).includes('leaves')) {
          leaves = true;
          break;
        }
      }
      if (!leaves) continue;
      const ty = topTerrainY(X, Z);
      if (ty == null) continue;
      if (getW(X, ty + 1, Z) === 'minecraft:air' && hash(X, Z) % 100 < 55) {
        setW(X, ty + 1, Z, 'minecraft:leaf_litter');
      }
    }
  }
}

function gateBanners() {
  for (const Z of [419, 422]) {
    for (const X of [-529, -527]) {
      if (!inSchem(X, 72, Z)) continue;
      setW(X, 72, Z, 'minecraft:oak_fence');
      setW(X, 73, Z, 'minecraft:oak_fence');
      setW(X, 74, Z, 'minecraft:white_banner[rotation=4]');
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
    lanterns = 0,
    litter = 0;
  for (let x = 0; x < SX; x++)
    for (let y = 0; y < SY; y++)
      for (let z = 0; z < SZ; z++) {
        const n = full(grid.get(x, y, z));
        if (n.includes('solar_panel')) panels++;
        if (n.includes('lantern')) lanterns++;
        if (n.includes('leaf_litter')) litter++;
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
    stations: stations.length,
    lattice: stations.filter(([x, , z]) => LATTICE_X.includes(wx(x)) && LATTICE_Z.includes(wz(z))).length,
    farm,
    uncovered,
    panels,
    lanterns,
    litter,
    size: [SX, SY, SZ],
  };
}

console.log('pass6…');
orchardWell();
batterySignage();
southSkirtFlowers();
leafLitterSweep();
gateBanners();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
