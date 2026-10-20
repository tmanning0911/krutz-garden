/**
 * Pass 8 — final polish: crop checkerboard breaks, dock rails,
 * fountain lily pads, station hatch consistency; ORIGIN_Y=44.
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
const isCropish = (n) => /wheat|carrots|potatoes|beetroots|farmland/.test(n);
const isSoft = (n) =>
  /short_grass|tall_grass|dandelion|poppy|allium|cornflower|oxeye|lily_of|azure|azalea|bush|leaf_litter|fern|wheat|carrot|potato|beet/.test(
    n,
  );

function checkerboardBreaks() {
  for (let X = -588; X <= -532; X++) {
    const Y = soilY(X);
    for (let Z = 374; Z <= 470; Z++) {
      if (HOUSE(X, Z) || isStationCell(X, Z)) continue;
      if (Z >= 417 && Z <= 424) continue;
      if ((X + Z) % 6 !== 0) continue;
      if (!inSchem(X, Y, Z)) continue;
      if (!isCropish(getW(X, Y, Z)) && !isCropish(getW(X, Y + 1, Z))) continue;
      if (getW(X, Y + 1, Z).startsWith(STATION)) continue;
      setW(X, Y, Z, 'minecraft:grass_block');
      for (let y = Y + 1; y <= Y + 2; y++) {
        if (isSoft(getW(X, y, Z)) || isCropish(getW(X, y, Z))) setW(X, y, Z, 'minecraft:air');
      }
      const r = hash(X, Z) % 100;
      if (r < 45) setW(X, Y + 1, Z, 'minecraft:short_grass');
      else if (r < 75) setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
    }
  }
}

function dockRails() {
  for (let X = -619; X <= -612; X++) {
    for (const Z of [408, 409]) {
      if (HOUSE(X, Z) || !inSchem(X, 64, Z)) continue;
      if (!getW(X, 64, Z).includes('oak') && !getW(X, 64, Z).includes('slab') && !getW(X, 63, Z).includes('oak'))
        continue;
      setW(X, 65, Z, 'minecraft:oak_fence');
    }
  }
  setW(-615, 66, 408, 'minecraft:lantern[hanging=false]');
  setW(-615, 66, 409, 'minecraft:lantern[hanging=false]');
}

function fountainLilies() {
  for (let X = -561; X <= -559; X++) {
    for (let Z = 419; Z <= 421; Z++) {
      if (X === -560 && Z === 420) continue;
      if (getW(X, 67, Z).includes('water') || getW(X, 66, Z).includes('water')) {
        if (hash(X, Z) % 2 === 0) setW(X, 67, Z, 'minecraft:lily_pad');
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
    trapOk = 0;
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
    stations: stations.length,
    lattice: stations.filter(([x, , z]) => LATTICE_X.includes(wx(x)) && LATTICE_Z.includes(wz(z))).length,
    trapOk,
    farm,
    uncovered,
    panels,
  };
}

console.log('pass8…');
checkerboardBreaks();
dockRails();
fountainLilies();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
