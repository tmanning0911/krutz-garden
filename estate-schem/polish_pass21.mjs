/**
 * Pass 21 — dirt path down the north slope to the summerhouse door,
 * fern edge, and two cold frames off the lattice.
 * Mapping: localX = worldX + 634, localY = worldY - 44, localZ = worldZ - 348.
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
const HOUSE = (X, Z) => X <= -592 && Z >= 410 && Z <= 430;
const SOLAR = (X, Z) => X >= -526 && Z >= 446 && Z <= 464;
const STATION = 'alaindustrial:garden_drone_station';
const LATTICE_X = [-584, -575, -567, -561, -553, -547, -539, -533];
const LATTICE_Z = [374, 383, 392, 401, 410, 415, 424, 429, 435, 444, 453, 462, 471];
const full = (b) => (typeof b === 'string' ? b : String(b ?? 'minecraft:air'));
const getW = (X, Y, Z) => full(grid.get(toLX(X), toLY(Y), toLZ(Z)));
const setW = (X, Y, Z, b) => {
  if (HOUSE(X, Z) || SOLAR(X, Z) || !inSchem(X, Y, Z)) return;
  grid.set(toLX(X), toLY(Y), toLZ(Z), b);
};
const setWForce = (X, Y, Z, b) => {
  if (!inSchem(X, Y, Z)) return;
  grid.set(toLX(X), toLY(Y), toLZ(Z), b);
};
const inSchem = (X, Y, Z) => {
  const lx = toLX(X),
    ly = toLY(Y),
    lz = toLZ(Z);
  return lx >= 0 && lx < SX && ly >= 0 && ly < SY && lz >= 0 && lz < SZ;
};
const soilY = (X) => (X < -566 ? 64 : X < -552 ? 66 : X < -538 ? 68 : 70);
const isStationCell = (X, Z) => LATTICE_X.includes(X) && LATTICE_Z.includes(Z);
const isSoft = (n) =>
  /short_grass|tall_grass|dandelion|poppy|allium|cornflower|oxeye|lily_of|azure|fern|air$|dirt_path/.test(n);

function surfaceGrass(X, Z) {
  for (let Y = 72; Y >= 54; Y--) {
    if (!inSchem(X, Y, Z)) continue;
    const n = getW(X, Y, Z);
    if (n === 'minecraft:grass_block' || n === 'minecraft:dirt_path') return { Y, n };
    if (n !== 'minecraft:air' && !isSoft(n)) return null;
  }
  return null;
}

function hillPath() {
  const cells = [];
  for (let Z = 475; Z <= 481; Z++) cells.push([-582, Z]);
  for (let X = -581; X <= -578; X++) cells.push([X, 481]);
  let laid = 0;
  for (const [X, Z] of cells) {
    if (HOUSE(X, Z) || isStationCell(X, Z)) continue;
    const s = surfaceGrass(X, Z);
    if (!s) continue;
    const above = getW(X, s.Y + 1, Z);
    if (!(above === 'minecraft:air' || isSoft(above) || above === 'minecraft:dirt_path')) continue;
    if (s.n !== 'minecraft:dirt_path') {
      setW(X, s.Y, Z, 'minecraft:dirt_path');
      if (isSoft(above)) setW(X, s.Y + 1, Z, 'minecraft:air');
      laid++;
    }
  }
  let ferns = 0;
  for (let Z = 475; Z <= 481; Z++) {
    const s = surfaceGrass(-583, Z);
    if (!s || s.n !== 'minecraft:grass_block') continue;
    const above = getW(-583, s.Y + 1, Z);
    const want = Z % 2 === 0 ? 'minecraft:fern' : 'minecraft:short_grass';
    if (above === 'minecraft:air' || /short_grass|oxeye|dandelion|poppy|allium|cornflower|azure|lily|fern/.test(above)) {
      if (above !== want) {
        setW(-583, s.Y + 1, Z, want);
        ferns++;
      }
    }
  }
  return { laid, ferns };
}

function coldFrames() {
  for (let X = -570; X <= -540; X++) {
    for (let Z = 430; Z <= 460; Z++) {
      const Y = soilY(X);
      if (getW(X, Y, Z) === 'minecraft:coarse_dirt' && getW(X, Y + 1, Z).includes('spruce_trapdoor')) {
        return { X, Z, Y, existing: true };
      }
    }
  }
  const near = (X, Z) =>
    LATTICE_X.some((sx) => Math.abs(sx - X) <= 1) && LATTICE_Z.some((sz) => Math.abs(sz - Z) <= 1);
  for (let X = -570; X <= -540; X++) {
    for (let Z = 430; Z <= 460; Z++) {
      const Y = soilY(X);
      let ok = true;
      for (let dx = 0; dx < 3; dx++) {
        for (let dz = 0; dz < 2; dz++) {
          const xx = X + dx,
            zz = Z + dz;
          if (near(xx, zz) || HOUSE(xx, zz) || SOLAR(xx, zz) || isStationCell(xx, zz)) ok = false;
          if (getW(xx, Y, zz) !== 'minecraft:grass_block') ok = false;
          const a = getW(xx, Y + 1, zz);
          if (!(a === 'minecraft:air' || isSoft(a))) ok = false;
          if (getW(xx, Y + 2, zz) !== 'minecraft:air') ok = false;
        }
      }
      if (!ok) continue;
      for (let dx = 0; dx < 3; dx++) {
        for (let dz = 0; dz < 2; dz++) {
          const xx = X + dx,
            zz = Z + dz;
          setW(xx, Y, zz, 'minecraft:coarse_dirt');
          setW(xx, Y + 1, zz, 'minecraft:spruce_trapdoor[facing=south,half=bottom,open=true,waterlogged=false]');
        }
      }
      return { X, Z, Y };
    }
  }
  return null;
}

function ensureStations() {
  for (const X of LATTICE_X) {
    for (const Z of LATTICE_Z) {
      const Y = soilY(X);
      if (!inSchem(X, Y, Z)) continue;
      setWForce(X, Y, Z, 'minecraft:grass_block');
      setWForce(X, Y + 1, Z, STATION);
      setWForce(X, Y + 2, Z, 'minecraft:spruce_trapdoor[facing=south,half=bottom,open=true,waterlogged=false]');
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
  for (let x = 0; x < SX; x++)
    for (let y = 0; y < SY; y++)
      for (let z = 0; z < SZ; z++) {
        if (!full(grid.get(x, y, z)).startsWith('minecraft:farmland')) continue;
        let ok = false;
        for (const [sx, sy, sz] of stations) {
          if (Math.max(Math.abs(sx - x), Math.abs(sz - z)) <= 4 && Math.abs(sy - y) <= 6) {
            ok = true;
            break;
          }
        }
        if (!ok && !HOUSE(wx(x), wz(z))) {
          grid.set(x, y, z, 'minecraft:grass_block');
          const a = full(grid.get(x, y + 1, z));
          if (/wheat|carrot|potato|beet|grass|flower|poppy/.test(a)) grid.set(x, y + 1, z, 'minecraft:short_grass');
        }
      }
  let uncovered = 0,
    farm = 0,
    trapOk = 0;
  for (const [x, y, z] of stations) if (full(grid.get(x, y + 1, z)).includes('trapdoor')) trapOk++;
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
  };
}

console.log('pass21…');
const report = { path: hillPath(), frames: coldFrames() };
ensureStations();
const metrics = coverage();
if (metrics.uncovered !== 0 || metrics.lattice !== 104) {
  console.error('coverage guard failed', metrics);
  process.exit(1);
}
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify({ report, metrics }, null, 2));
