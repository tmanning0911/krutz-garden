/**
 * Pass 9 — hedge maze stub, bird bath near carriage, wall moss patches,
 * east approach flower beds; ORIGIN_Y=44.
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

function hedgeMazeStub() {
  // small U-shaped hedge near NE beds — not eating stations
  const cells = [];
  for (let X = -542; X <= -534; X++) cells.push([X, 448], [X, 456]);
  for (let Z = 448; Z <= 456; Z++) cells.push([-542, Z], [-534, Z]);
  for (const [X, Z] of cells) {
    if (HOUSE(X, Z) || SOLAR(X, Z) || isStationCell(X, Z) || !inSchem(X, 70, Z)) continue;
    const Y = soilY(X);
    if (getW(X, Y + 1, Z).startsWith(STATION)) continue;
    if (Z >= 418 && Z <= 423) continue;
    setW(X, Y, Z, 'minecraft:grass_block');
    for (let y = Y + 1; y <= Y + 2; y++) {
      const n = getW(X, y, Z);
      if (isCropish(n) || /grass|flower|wheat|carrot|potato|beet|air/.test(n) || n === 'minecraft:air')
        setW(X, y, Z, 'minecraft:air');
    }
    setW(X, Y + 1, Z, hash(X, Z) % 2 ? 'minecraft:azalea' : 'minecraft:flowering_azalea');
  }
  // opening on west side
  for (const Z of [451, 452, 453]) {
    setW(-542, soilY(-542) + 1, Z, 'minecraft:air');
    setW(-542, soilY(-542), Z, 'minecraft:dirt_path');
  }
}

function birdBath() {
  const X = -588,
    Z = 426,
    Y = 64;
  if (!inSchem(X, Y, Z) || HOUSE(X, Z)) return;
  setW(X, Y, Z, 'minecraft:stone_bricks');
  setW(X, Y + 1, Z, 'minecraft:water');
  setW(X - 1, Y, Z, 'minecraft:stone_brick_stairs[facing=east,half=bottom]');
  setW(X + 1, Y, Z, 'minecraft:stone_brick_stairs[facing=west,half=bottom]');
  setW(X, Y, Z - 1, 'minecraft:stone_brick_stairs[facing=south,half=bottom]');
  setW(X, Y, Z + 1, 'minecraft:stone_brick_stairs[facing=north,half=bottom]');
  setW(X, Y + 2, Z, 'minecraft:lantern[hanging=false]');
}

function wallMoss() {
  for (let Z = 368; Z <= 474; Z++) {
    for (const X of [-590, -528]) {
      for (let Y = 66; Y <= 74; Y++) {
        if (!inSchem(X, Y, Z)) continue;
        if (getW(X, Y, Z) === 'minecraft:stone_bricks' && hash(X + Y, Z) % 4 === 0) {
          setW(X, Y, Z, hash(X, Z) % 2 ? 'minecraft:mossy_stone_bricks' : 'minecraft:cracked_stone_bricks');
        }
      }
    }
  }
}

function eastApproachBeds() {
  for (let dist = 2; dist <= 9; dist++) {
    const X = -528 + dist;
    for (const Z of [418, 423]) {
      if (SOLAR(X, Z) || !inSchem(X, 70, Z)) continue;
      // find path height neighbor
      let Y = 70;
      for (let y = 72; y >= 66; y--) {
        if (/dirt_path|cobble|grass_block/.test(getW(X, y, Z + (Z === 418 ? 2 : -2)))) {
          Y = y;
          break;
        }
      }
      setW(X, Y, Z, 'minecraft:grass_block');
      setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
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

console.log('pass9…');
hedgeMazeStub();
birdBath();
wallMoss();
eastApproachBeds();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
