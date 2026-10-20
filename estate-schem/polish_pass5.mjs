/**
 * Pass 5 — visitor courtyard flagstones, greenhouse benches,
 * path cobble rhythm, hedge gates into formal room; ORIGIN_Y=44.
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

function pavilionCourtyard() {
  // flagstone apron north of pavilion toward gate
  for (let X = -536; X <= -530; X++) {
    for (let Z = 416; Z <= 419; Z++) {
      if (isStationCell(X, Z) || !inSchem(X, 70, Z)) continue;
      const Y = 70;
      setW(X, Y - 1, Z, 'minecraft:dirt');
      setW(X, Y, Z, hash(X, Z) % 3 === 0 ? 'minecraft:mossy_cobblestone' : 'minecraft:cobblestone');
      for (let y = Y + 1; y <= Y + 2; y++) {
        const n = getW(X, y, Z);
        if (/grass|flower|wheat|carrot|potato|beet|azalea|leaf_litter/.test(n)) setW(X, y, Z, 'minecraft:air');
      }
    }
  }
  // greenhouse interior benches
  for (const Z of [410, 413]) {
    for (let X = -539; X <= -537; X++) {
      if (!inSchem(X, 71, Z)) continue;
      setW(X, 70, Z, 'minecraft:cobblestone');
      setW(X, 71, Z, 'minecraft:spruce_stairs[facing=east,half=bottom]');
      setW(X, 72, Z, 'minecraft:potted_oak_sapling');
    }
  }
}

function hedgeGates() {
  // openings in formal room hedge toward fountain
  for (const X of [-561, -560, -559]) {
    const Z = 412,
      Y = soilY(X);
    if (isStationCell(X, Z)) continue;
    setW(X, Y, Z, 'minecraft:dirt_path');
    setW(X, Y + 1, Z, 'minecraft:air');
    setW(X, Y + 2, Z, 'minecraft:air');
  }
  // spruce arch
  setW(-561, soilY(-561) + 1, 412, 'minecraft:spruce_fence');
  setW(-559, soilY(-559) + 1, 412, 'minecraft:spruce_fence');
  setW(-561, soilY(-561) + 2, 412, 'minecraft:spruce_fence');
  setW(-559, soilY(-559) + 2, 412, 'minecraft:spruce_fence');
  setW(-560, soilY(-560) + 3, 412, 'minecraft:spruce_slab[type=bottom]');
  setW(-560, soilY(-560) + 2, 412, 'minecraft:lantern[hanging=true]');
}

function pathRhythm() {
  for (let X = -588; X <= -530; X++) {
    for (const Z of [420, 421]) {
      if (HOUSE(X, Z) || !inSchem(X, soilY(X), Z)) continue;
      // skip fountain basin cells
      if (Math.abs(X + 560) <= 1 && Math.abs(Z - 420) <= 1) continue;
      const Y = soilY(X);
      const m = hash(X, Z) % 100;
      if (getW(X, Y, Z).includes('water') || getW(X, Y, Z).includes('sea_lantern')) continue;
      if (m < 18) setW(X, Y, Z, 'minecraft:cobblestone');
      else if (m < 30) setW(X, Y, Z, 'minecraft:mossy_cobblestone');
      else if (!getW(X, Y, Z).includes('dirt_path') && !getW(X, Y, Z).includes('cobble') && !getW(X, Y, Z).includes('stone_brick'))
        setW(X, Y, Z, 'minecraft:dirt_path');
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
  };
}

console.log('pass5…');
pavilionCourtyard();
hedgeGates();
pathRhythm();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
