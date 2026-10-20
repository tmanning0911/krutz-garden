/**
 * Pass 4 — restore denser solar array, rose parterre south of path,
 * tower finials, leaf litter sweep; ORIGIN_Y=44.
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
const STATION = 'alaindustrial:garden_drone_station';
const LATTICE_X = [-584, -575, -567, -561, -553, -547, -539, -533];
const LATTICE_Z = [374, 383, 392, 401, 410, 415, 424, 429, 435, 444, 453, 462, 471];
const PANELS = [
  'alaindustrial:radiant_solar_panel',
  'alaindustrial:moonlit_solar_panel',
  'alaindustrial:daylight_solar_panel',
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
    if (isTerrain(n) || n.includes('dirt_path') || /smooth_stone|stone_brick|deepslate/.test(n)) return Y;
  }
  return null;
}

function densifySolar() {
  for (let X = -525; X <= -515; X++) {
    for (let Z = 447; Z <= 463; Z++) {
      if (!inSchem(X, 70, Z)) continue;
      if (Z === 455 || X === -520) continue; // service path / stair
      const surf = topTerrainY(X, Z) ?? 70;
      // skip if structure
      const above = getW(X, surf + 1, Z);
      if (/lightning|campfire|wall|fence|trapdoor|battery/.test(above)) continue;
      setSolar(X, surf, Z, 'minecraft:smooth_stone');
      setSolar(X, surf + 1, Z, PANELS[(X + Z) % PANELS.length]);
      // clear higher clutter
      for (let y = surf + 2; y <= surf + 4; y++) {
        const n = getW(X, y, Z);
        if (n === 'minecraft:air') continue;
        if (/grass|flower|leaf|bush|fern/.test(n)) setSolar(X, y, Z, 'minecraft:air');
      }
    }
  }
  // perimeter fence outside panel cells
  for (let Z = 446; Z <= 464; Z += 2) {
    const ty = topTerrainY(-526, Z) ?? 70;
    if (!getW(-526, ty + 1, Z).includes('solar')) {
      setSolar(-526, ty + 1, Z, 'minecraft:oak_fence');
      if (Z % 4 === 0) setSolar(-526, ty + 2, Z, 'minecraft:lantern[hanging=false]');
    }
  }
}

function roseParterre() {
  // south of main path — formal rose beds without eating stations
  const Ybase = 68;
  for (let X = -558; X <= -542; X++) {
    for (let Z = 428; Z <= 440; Z++) {
      if (isStationCell(X, Z) || HOUSE(X, Z) || !inSchem(X, Ybase, Z)) continue;
      const Y = soilY(X);
      const edge = X === -558 || X === -542 || Z === 428 || Z === 440;
      const path = X === -550 || Z === 434;
      for (let y = Y + 1; y <= Y + 3; y++) {
        const n = getW(X, y, Z);
        if (n.startsWith(STATION) || n.includes('trapdoor')) break;
        if (/wheat|carrot|potato|beet|grass|flower|azalea|fern|leaf_litter/.test(n) || n === 'minecraft:air')
          setW(X, y, Z, 'minecraft:air');
      }
      if (path) {
        setW(X, Y, Z, 'minecraft:gravel');
      } else if (edge) {
        setW(X, Y, Z, 'minecraft:grass_block');
        setW(X, Y + 1, Z, hash(X, Z) % 2 ? 'minecraft:azalea' : 'minecraft:flowering_azalea');
      } else if ((X + Z) % 3 === 0) {
        setW(X, Y, Z, 'minecraft:grass_block');
        setW(X, Y + 1, Z, 'minecraft:rose_bush[half=lower]');
        setW(X, Y + 2, Z, 'minecraft:rose_bush[half=upper]');
      } else {
        setW(X, Y, Z, 'minecraft:grass_block');
        if (hash(X, Z) % 100 < 40) setW(X, Y + 1, Z, 'minecraft:poppy');
        else if (hash(X, Z) % 100 < 70) setW(X, Y + 1, Z, 'minecraft:short_grass');
      }
    }
  }
}

function towerFinials() {
  const corners = [
    [-590, 368],
    [-528, 368],
    [-590, 474],
    [-528, 474],
  ];
  for (const [CX, CZ] of corners) {
    for (let dx = 0; dx <= 1; dx++) {
      for (let dz = 0; dz <= 1; dz++) {
        const X = CX + (CX === -528 ? -dx : dx);
        const Z = CZ + (CZ === 474 ? -dz : dz);
        if (HOUSE(X, Z) || !inSchem(X, 74, Z)) continue;
        setW(X, 75, Z, 'minecraft:stone_bricks');
        setW(X, 76, Z, 'minecraft:stone_brick_wall');
        setW(X, 77, Z, 'minecraft:lantern[hanging=false]');
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
            const above = full(grid.get(x, y + 1, z));
            if (/wheat|carrot|potato|beet|grass|flower/.test(above)) grid.set(x, y + 1, z, 'minecraft:short_grass');
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
  };
}

console.log('pass4…');
densifySolar();
roseParterre();
towerFinials();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
