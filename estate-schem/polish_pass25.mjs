/**
 * Pass 25 — observatory cupola on NW lookout, koi bridge rail upgrade,
 * compost yard, tool shed by stables, lavender ribbon, solar inverter
 * cabinets, final station/trapdoor sync. Mapping +634/-44/-348.
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
  'minecraft:allium',
  'minecraft:lilac',
  'minecraft:azure_bluet',
  'minecraft:oxeye_daisy',
  'minecraft:cornflower',
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
  /grass_block|dirt$|stone$|granite|diorite|andesite|gravel|sand$|cobblestone$|farmland/.test(n);
const isSoft = (n) =>
  /short_grass|tall_grass|dandelion|poppy|allium|cornflower|oxeye|lily_of|azure|azalea|bush|leaf_litter|firefly|fern|wheat|carrot|potato|beet|petal|tulip|lilac/.test(
    n,
  );
const brickMix = (X, Y, Z) => {
  const m = (X + Y * 3 + Z * 7) % 5;
  if (m === 0) return 'minecraft:mossy_stone_bricks';
  if (m === 1) return 'minecraft:cracked_stone_bricks';
  if (m === 2) return 'minecraft:mossy_cobblestone';
  return 'minecraft:stone_bricks';
};

function clearSoft(X, Y, Z, h = 5) {
  for (let y = Y + 1; y <= Y + h; y++) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n.startsWith(STATION) || n.includes('trapdoor')) continue;
    if (/fence|door|gate|wall|pane|plank|log|stair|slab|brick|lantern|glass|panel|battery|sign|banner/.test(n))
      break;
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
  if (r < 40) setW(X, Y + 1, Z, 'minecraft:short_grass');
  else if (r < 60) {
    const f = FLOWERS[hash(X, Z) % FLOWERS.length];
    setW(X, Y + 1, Z, f);
    if (f === 'minecraft:lilac') setW(X, Y + 2, Z, 'minecraft:lilac');
  }
}

function observatoryCupola() {
  const CX = WALL_X1 + 1,
    CZ = WALL_Z1 + 1;
  const base = soilY(CX) + 9;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const X = CX + dx,
        Z = CZ + dz;
      if (!inSchem(X, base, Z)) continue;
      setW(X, base, Z, 'minecraft:stone_brick_slab[type=bottom]');
      if (dx === 0 && dz === 0) {
        setW(X, base + 1, Z, 'minecraft:glass');
        setW(X, base + 2, Z, 'minecraft:glass');
        setW(X, base + 3, Z, 'minecraft:daylight_detector[inverted=false,power=0]');
        setW(X, base + 4, Z, 'minecraft:end_rod[facing=up]');
      } else {
        setW(X, base + 1, Z, brickMix(X, base + 1, Z));
      }
    }
  }
}

function koiBridgeRails() {
  // upgrade reflecting pool bridge rails
  const CZ = 434,
    Y = soilY(-548);
  for (let X = -551; X <= -545; X++) {
    if (isStationCell(X, CZ)) continue;
    setW(X, Y, CZ, 'minecraft:spruce_planks');
    if (X === -548) {
      setW(X, Y + 1, CZ, 'minecraft:lantern[hanging=false]');
    } else {
      setW(X, Y + 1, CZ - 1, 'minecraft:spruce_fence');
      setW(X, Y + 1, CZ + 1, 'minecraft:spruce_fence');
    }
  }
}

function compostYard() {
  const x0 = -586,
    z0 = 436;
  const Y = 64;
  for (let X = x0; X <= x0 + 3; X++) {
    for (let Z = z0; Z <= z0 + 3; Z++) {
      if (isStationCell(X, Z) || HOUSE(X, Z) || !inSchem(X, Y, Z)) continue;
      clearSoft(X, Y, Z, 3);
      const edge = X === x0 || X === x0 + 3 || Z === z0 || Z === z0 + 3;
      setW(X, Y, Z, edge ? 'minecraft:cobblestone' : 'minecraft:dirt');
      if (!edge) setW(X, Y + 1, Z, 'minecraft:composter[level=5]');
      else if ((X + Z) % 2 === 0) setW(X, Y + 1, Z, 'minecraft:oak_fence');
    }
  }
  setW(x0 + 1, Y + 1, z0 + 1, 'minecraft:barrel[facing=up,open=false]');
  setW(x0 + 2, Y + 2, z0, 'minecraft:lantern[hanging=false]');
}

function toolShed() {
  const x0 = -590,
    x1 = -586,
    z0 = 438,
    z1 = 442;
  const Y = 64;
  for (let X = x0; X <= x1; X++) {
    for (let Z = z0; Z <= z1; Z++) {
      if (HOUSE(X, Z) || isStationCell(X, Z) || !inSchem(X, Y, Z)) continue;
      clearSoft(X, Y, Z, 5);
      const edge = X === x0 || X === x1 || Z === z0 || Z === z1;
      const door = Z === z0 && X === -588;
      setW(X, Y, Z, 'minecraft:cobblestone');
      if (edge && !door) {
        for (let y = Y + 1; y <= Y + 3; y++) setW(X, y, Z, 'minecraft:spruce_planks');
      } else if (!edge) {
        setW(X, Y + 1, Z, 'minecraft:air');
        setW(X, Y + 2, Z, 'minecraft:air');
        setW(X, Y + 3, Z, 'minecraft:air');
      }
      setW(X, Y + 4, Z, 'minecraft:spruce_slab[type=bottom]');
    }
  }
  setW(-588, Y + 1, z0, 'minecraft:spruce_door[facing=north,half=lower,hinge=left,open=false,powered=false]');
  setW(-588, Y + 2, z0, 'minecraft:spruce_door[facing=north,half=upper,hinge=left,open=false,powered=false]');
  setW(-587, Y + 1, 440, 'minecraft:crafting_table');
  setW(-589, Y + 1, 440, 'minecraft:chest[facing=east,type=single,waterlogged=false]');
  setW(-588, Y + 3, 440, 'minecraft:lantern[hanging=true]');
}

function lavenderRibbon() {
  for (let X = -580; X <= -536; X++) {
    for (const Z of [376, 472]) {
      if (isStationCell(X, Z) || SOLAR(X, Z) || !inSchem(X, soilY(X), Z)) continue;
      if (getW(X, soilY(X) + 1, Z).startsWith(STATION)) continue;
      const Y = soilY(X);
      placeGrass(X, Y, Z, false);
      setW(X, Y + 1, Z, hash(X, Z) % 2 ? 'minecraft:allium' : 'minecraft:lilac');
      if (getW(X, Y + 1, Z) === 'minecraft:lilac') setW(X, Y + 2, Z, 'minecraft:lilac');
    }
  }
}

function solarInverterCabinets() {
  // surface cabinets near lightning rod
  for (const [X, Z] of [
    [-521, 454],
    [-519, 454],
    [-521, 456],
    [-519, 456],
  ]) {
    if (!inSchem(X, 71, Z)) continue;
    setSolar(X, 71, Z, 'minecraft:iron_block');
    setSolar(X, 72, Z, 'alaindustrial:battery_box');
  }
  setSolar(-520, 72, 454, 'minecraft:redstone_lamp[lit=true]');
  setSolar(-520, 71, 453, 'minecraft:lever[face=wall,facing=north,powered=true]');
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
  // deep farm station
  if (inSchem(-554, 52, 365)) {
    setWForce(-554, 51, 365, 'minecraft:grass_block');
    setWForce(-554, 52, 365, STATION);
    setWForce(
      -554,
      53,
      365,
      'minecraft:spruce_trapdoor[facing=south,half=bottom,open=true,waterlogged=false]',
    );
  }
}

function restoreTrapdoors() {
  for (let x = 0; x < SX; x++)
    for (let y = 0; y < SY; y++)
      for (let z = 0; z < SZ; z++) {
        if (!full(grid.get(x, y, z)).startsWith(STATION)) continue;
        if (!full(grid.get(x, y + 1, z)).includes('trapdoor')) {
          grid.set(
            x,
            y + 1,
            z,
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
            if (/wheat|carrot|potato|beet|grass|flower|poppy|lilac/.test(a))
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
    mapping: 'localX=wx+634, localY=wy-44, localZ=wz-348',
    stations: stations.length,
    lattice: stations.filter(([x, , z]) => LATTICE_X.includes(wx(x)) && LATTICE_Z.includes(wz(z))).length,
    trapOk,
    farm,
    uncovered,
    panels,
    lanterns,
  };
}

console.log('pass25…');
observatoryCupola();
koiBridgeRails();
compostYard();
toolShed();
lavenderRibbon();
solarInverterCabinets();
ensureStations();
restoreTrapdoors();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
