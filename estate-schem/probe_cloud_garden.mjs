/**
 * Probe krutz-solar-house.schem for garden polish metrics.
 */
import { parseToGrid } from './node_modules/craftmatic/dist/schem/parse.js';

const SCHEM = new URL('../krutz-solar-house.schem', import.meta.url).pathname;
const grid = await parseToGrid(SCHEM);
const { width: SX, height: SY, length: SZ } = grid;

const ORIGIN_X = 634;
const ORIGIN_Y = 44;
const ORIGIN_Z = 348;
const toLX = (X) => X + ORIGIN_X;
const toLY = (Y) => Y - ORIGIN_Y;
const toLZ = (Z) => Z - ORIGIN_Z;
const wx = (lx) => lx - ORIGIN_X;
const wz = (lz) => lz + ORIGIN_Z;

const WALL_X1 = -590, WALL_X2 = -528, WALL_Z1 = 368, WALL_Z2 = 474;
const HOUSE = (X, Z) => X <= -592 && Z >= 410 && Z <= 430;
const SOLAR = (X, Z) => X >= -526 && Z >= 446 && Z <= 464;
const STATION = 'alaindustrial:garden_drone_station';
const LATTICE_X = [-584, -575, -567, -561, -553, -547, -539, -533];
const LATTICE_Z = [374, 383, 392, 401, 410, 415, 424, 429, 435, 444, 453, 462, 471];

const full = (b) => (typeof b === 'string' ? b : String(b ?? 'minecraft:air'));
const getW = (X, Y, Z) => full(grid.get(toLX(X), toLY(Y), toLZ(Z)));
const inSchem = (X, Y, Z) => {
  const lx = toLX(X), ly = toLY(Y), lz = toLZ(Z);
  return lx >= 0 && lx < SX && ly >= 0 && ly < SY && lz >= 0 && lz < SZ;
};
const isTerrain = (n) =>
  /grass_block|dirt$|stone$|granite|diorite|andesite|gravel|sand$|cobblestone$|farmland/.test(n);
const isSoft = (n) =>
  /short_grass|tall_grass|dandelion|poppy|allium|cornflower|oxeye|lily_of|azure|azalea|bush|leaf_litter|firefly|fern|wheat|carrot|potato|beet/.test(
    n,
  );
const isCropish = (n) => /wheat|carrots|potatoes|beetroots|farmland/.test(n);

function topTerrainY(X, Z) {
  for (let Y = 80; Y >= 55; Y--) {
    if (!inSchem(X, Y, Z)) continue;
    const n = getW(X, Y, Z);
    if (isTerrain(n) || n.includes('dirt_path') || /stone_brick|mossy|cracked/.test(n)) return Y;
  }
  return null;
}

const stations = [];
const unknowns = {};
let farm = 0, uncovered = 0, trapOk = 0;
let cliffs = 0;
const cliffSamples = [];
let cropRuns = 0;
let maxCropRun = 0;
let grassCrosses = 0;
let pathCobble = 0, pathDirt = 0, lanterns = 0, benches = 0, posts = 0;
let waterChannelOk = true;

for (let x = 0; x < SX; x++)
  for (let y = 0; y < SY; y++)
    for (let z = 0; z < SZ; z++) {
      const n = full(grid.get(x, y, z));
      if (n.startsWith(STATION)) stations.push([x, y, z]);
      if (n.includes('lantern')) lanterns++;
      if (n.includes('spruce_stairs')) benches++;
      if (n.includes('spruce_fence') && !n.includes('gate')) posts++;
      if (n.includes('dirt_path')) pathDirt++;
      if (n.includes('cobblestone') && !n.includes('mossy') && y > 5) pathCobble++;
      if (n.startsWith('minecraft:') === false && !n.startsWith('alaindustrial:')) {
        unknowns[n] = (unknowns[n] || 0) + 1;
      }
      // hash-colored marker blocks often used as debug
      if (/concrete|wool|glazed|magenta|lime_concrete|pink_concrete|yellow_concrete/.test(n)) {
        unknowns[n] = (unknowns[n] || 0) + 1;
      }
    }

for (const [x, y, z] of stations) {
  if (full(grid.get(x, y + 1, z)).includes('trapdoor')) trapOk++;
}

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

// cliff probe: |ΔY| >= 2 between adjacent OUTSIDE cells only (ignore wall tops)
const isOutside = (X, Z) => X < WALL_X1 || X > WALL_X2 || Z < WALL_Z1 || Z > WALL_Z2;
for (let X = WALL_X1 - 1; X <= WALL_X2 + 14; X++) {
  for (let Z = WALL_Z1 - 14; Z <= WALL_Z2 + 2; Z++) {
    if (!isOutside(X, Z)) continue;
    if (HOUSE(X, Z) || SOLAR(X, Z) || !inSchem(X, 64, Z)) continue;
    const y0 = topTerrainY(X, Z);
    if (y0 == null) continue;
    for (const [dx, dz] of [
      [1, 0],
      [0, 1],
    ]) {
      const X2 = X + dx, Z2 = Z + dz;
      if (!isOutside(X2, Z2)) continue;
      if (!inSchem(X2, 64, Z2) || HOUSE(X2, Z2) || SOLAR(X2, Z2)) continue;
      const y1 = topTerrainY(X2, Z2);
      if (y1 == null) continue;
      const d = Math.abs(y0 - y1);
      if (d >= 2) {
        cliffs++;
        if (cliffSamples.length < 12) cliffSamples.push({ X, Z, y0, X2, Z2, y1, d });
      }
    }
  }
}

// crop monoculture: long runs of same crop along Z at fixed X bands
for (let X = WALL_X1 + 2; X < WALL_X2 - 2; X += 3) {
  let run = 0;
  for (let Z = WALL_Z1 + 4; Z < WALL_Z2 - 4; Z++) {
    const Y = X < -566 ? 64 : X < -552 ? 66 : X < -538 ? 68 : 70;
    const a = getW(X, Y + 1, Z);
    if (isCropish(a) || isCropish(getW(X, Y, Z))) {
      run++;
      maxCropRun = Math.max(maxCropRun, run);
      if (run === 8) cropRuns++;
    } else {
      if (isSoft(a) && !isCropish(a)) grassCrosses++;
      run = 0;
    }
  }
}

// water channel west of house
let waterBlocks = 0;
for (let X = -620; X <= -618; X++) {
  for (let Z = 410; Z <= 430; Z++) {
    for (let Y = 60; Y <= 66; Y++) {
      if (!inSchem(X, Y, Z)) continue;
      if (getW(X, Y, Z).includes('water')) waterBlocks++;
    }
  }
}
if (waterBlocks < 10) waterChannelOk = false;

// house front lawn grade: check steps from -592..-589
const lawnGrades = [];
for (let Z = 416; Z <= 426; Z += 2) {
  const ys = [];
  for (let X = -591; X <= -586; X++) {
    ys.push(topTerrainY(X, Z));
  }
  lawnGrades.push({ Z, ys });
}

const latticeStations = stations.filter(
  ([x, , z]) => LATTICE_X.includes(wx(x)) && LATTICE_Z.includes(wz(z)),
);

console.log(
  JSON.stringify(
    {
      size: { SX, SY, SZ },
      stations: stations.length,
      latticeStations: latticeStations.length,
      trapOk,
      farm,
      uncovered,
      cliffs,
      cliffSamples,
      cropRunsOf8plus: cropRuns,
      maxCropRun,
      softBreaksSampled: grassCrosses,
      lanterns,
      benches,
      posts,
      pathDirt,
      pathCobbleApprox: pathCobble,
      waterBlocks,
      waterChannelOk,
      lawnGrades,
      unknowns,
    },
    null,
    2,
  ),
);
