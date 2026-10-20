/**
 * Polish krutz-solar-house.schem cloud garden (idempotent-ish).
 * Softens N/E skirts, breaks crop stripes, grades west lawn,
 * path/gate/lantern detail; keeps house + solar hill; uncovered farmland = 0.
 */
import { parseToGrid } from './node_modules/craftmatic/dist/schem/parse.js';
import { writeSchematic } from './node_modules/craftmatic/dist/schem/write.js';

const SCHEM = new URL('../krutz-solar-house.schem', import.meta.url).pathname;
const grid = await parseToGrid(SCHEM);
const { width: SX, height: SY, length: SZ } = grid;

const toLX = (X) => X + 630;
const toLY = (Y) => Y - 58;
const toLZ = (Z) => Z - 352;
const wx = (lx) => lx - 630;
const wz = (lz) => lz + 352;

const WALL_X1 = -590, WALL_X2 = -528, WALL_Z1 = 368, WALL_Z2 = 474;
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
];

const full = (b) => (typeof b === 'string' ? b : String(b ?? 'minecraft:air'));
const getW = (X, Y, Z) => full(grid.get(toLX(X), toLY(Y), toLZ(Z)));
const setW = (X, Y, Z, b) => {
  if (HOUSE(X, Z) || SOLAR(X, Z)) return;
  grid.set(toLX(X), toLY(Y), toLZ(Z), b);
};
const setWForce = (X, Y, Z, b) => grid.set(toLX(X), toLY(Y), toLZ(Z), b);
const inSchem = (X, Y, Z) => {
  const lx = toLX(X), ly = toLY(Y), lz = toLZ(Z);
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
  /short_grass|tall_grass|dandelion|poppy|allium|cornflower|oxeye|lily_of|azure|azalea|bush|leaf_litter|firefly|fern|wheat|carrot|potato|beet/.test(
    n,
  );
const isCropish = (n) => /wheat|carrots|potatoes|beetroots|farmland/.test(n);

function topTerrainY(X, Z) {
  for (let Y = 80; Y >= 55; Y--) {
    if (!inSchem(X, Y, Z)) continue;
    const n = getW(X, Y, Z);
    if (isTerrain(n) || n.includes('dirt_path')) return Y;
  }
  return null;
}

function placeGrass(X, Y, Z, plant = true) {
  if (!inSchem(X, Y, Z) || HOUSE(X, Z) || SOLAR(X, Z)) return;
  for (let y = Math.max(55, Y - 3); y < Y; y++) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n === 'minecraft:air' || isSoft(n) || isTerrain(n)) setW(X, y, Z, 'minecraft:dirt');
  }
  setW(X, Y, Z, 'minecraft:grass_block');
  for (let y = Y + 1; y <= Y + 4; y++) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n.startsWith(STATION) || n.includes('trapdoor') || n.includes('lantern')) break;
    if (/fence|door|gate|wall|pane|plank|log|stair|slab|brick/.test(n)) break;
    if (isSoft(n) || n === 'minecraft:air' || isTerrain(n) || /leaves/.test(n)) setW(X, y, Z, 'minecraft:air');
    else break;
  }
  if (!plant) return;
  const r = hash(X, Z) % 100;
  if (r < 38) setW(X, Y + 1, Z, 'minecraft:short_grass');
  else if (r < 52) setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
}

function reshape(X, Z, target, plant) {
  for (let y = 78; y > target; y--) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n.startsWith(STATION) || n.includes('trapdoor')) continue;
    if (/stone_brick|mossy_stone|cracked_stone|chiseled/.test(n)) continue;
    if (isTerrain(n) || isSoft(n) || n === 'minecraft:air' || /leaves|log|vine/.test(n)) {
      setW(X, y, Z, 'minecraft:air');
    }
  }
  const cur = topTerrainY(X, Z);
  if (cur == null || cur < target) {
    for (let y = (cur ?? target - 3) + 1; y <= target; y++) {
      if (inSchem(X, y, Z)) setW(X, y, Z, 'minecraft:dirt');
    }
  }
  placeGrass(X, target, Z, plant);
}

function softenSkirts() {
  for (let X = WALL_X1; X <= WALL_X2; X++) {
    const base = soilY(X);
    for (let dist = 1; dist <= 14; dist++) {
      const Z = WALL_Z1 - dist;
      if (!inSchem(X, 64, Z) || HOUSE(X, Z) || SOLAR(X, Z)) continue;
      reshape(X, Z, Math.max(61, base - Math.ceil(dist * 0.75)), dist > 1);
    }
  }
  for (let Z = WALL_Z1; Z <= WALL_Z2; Z++) {
    for (let dist = 1; dist <= 14; dist++) {
      const X = WALL_X2 + dist;
      if (!inSchem(X, 64, Z) || HOUSE(X, Z) || SOLAR(X, Z)) continue;
      let target = Math.max(64, 70 - Math.ceil(dist * 0.55));
      if (Z >= 418 && Z <= 423) target = Math.max(target, 69 - Math.floor(dist * 0.3));
      reshape(X, Z, target, true);
    }
  }
  // floating terrain cleanup outside walls
  for (let X = -620; X <= -512; X++) {
    for (let Z = 352; Z <= 490; Z++) {
      if (!inSchem(X, 70, Z) || HOUSE(X, Z) || SOLAR(X, Z)) continue;
      const outside = X < WALL_X1 || X > WALL_X2 || Z < WALL_Z1 || Z > WALL_Z2;
      if (!outside && !(Z <= 370 || X >= -527)) continue;
      for (let Y = 78; Y >= 63; Y--) {
        if (!inSchem(X, Y, Z)) continue;
        const n = getW(X, Y, Z);
        if (!isTerrain(n) && !isSoft(n)) continue;
        const below = getW(X, Y - 1, Z);
        if (below === 'minecraft:air' || isSoft(below)) setW(X, Y, Z, 'minecraft:air');
      }
    }
  }
}

function breakCropStripes() {
  for (let X = WALL_X1 + 1; X < WALL_X2; X++) {
    for (let Z = WALL_Z1 + 1; Z <= WALL_Z1 + 3; Z++) {
      if (HOUSE(X, Z) || SOLAR(X, Z)) continue;
      const Y = soilY(X);
      if (!inSchem(X, Y, Z)) continue;
      if (isCropish(getW(X, Y, Z)) || isCropish(getW(X, Y + 1, Z))) placeGrass(X, Y, Z, true);
    }
  }
  for (let X = WALL_X1 + 2; X <= WALL_X2 - 2; X++) {
    const Y = soilY(X);
    for (let Z = WALL_Z1 + 4; Z <= WALL_Z2 - 4; Z++) {
      if (HOUSE(X, Z) || SOLAR(X, Z)) continue;
      if (Z >= 419 && Z <= 422) continue;
      if (LATTICE_X.includes(X) && LATTICE_Z.some((sz) => Math.abs(sz - Z) <= 1)) continue;
      if (LATTICE_Z.includes(Z) && LATTICE_X.some((sx) => Math.abs(sx - X) <= 1)) continue;
      const h = hash(X, Z);
      const nearStep = [-567, -566, -553, -552, -539, -538].includes(X);
      const stripe = Z % 9 === (X * 3) % 9 || (nearStep && Z % 5 === X % 5);
      if (!stripe && h % 37 !== 0) continue;
      if (!isCropish(getW(X, Y, Z)) && !isCropish(getW(X, Y + 1, Z))) continue;
      if (getW(X, Y + 1, Z).startsWith(STATION)) continue;
      placeGrass(X, Y, Z, true);
      if (stripe && h % 3 === 0) {
        for (const dX of [-1, 1]) {
          const X2 = X + dX;
          if (X2 <= WALL_X1 || X2 >= WALL_X2) continue;
          if (LATTICE_X.includes(X2) && LATTICE_Z.includes(Z)) continue;
          const Y2 = soilY(X2);
          if (getW(X2, Y2 + 1, Z).startsWith(STATION)) continue;
          if (isCropish(getW(X2, Y2, Z)) || isCropish(getW(X2, Y2 + 1, Z))) placeGrass(X2, Y2, Z, true);
        }
      }
    }
  }
  for (let X = WALL_X1 + 1; X < WALL_X2; X++) {
    for (let Z = 418; Z <= 423; Z++) {
      for (const dZ of [-2, -1, 2, 3]) {
        const Z2 = Z + dZ;
        if (Z2 <= WALL_Z1 || Z2 >= WALL_Z2 || HOUSE(X, Z2)) continue;
        const Y = soilY(X);
        if (!inSchem(X, Y, Z2)) continue;
        if (getW(X, Y, Z2).includes('dirt_path') || getW(X, Y + 1, Z2).startsWith(STATION)) continue;
        if (hash(X, Z2) % 100 < 70) placeGrass(X, Y, Z2, true);
      }
    }
  }
}

function gradeWestLawn() {
  for (let Z = 410; Z <= 432; Z++) {
    for (let X = -591; X <= -589; X++) {
      if (HOUSE(X, Z) || !inSchem(X, 64, Z)) continue;
      if (getW(X, 64, Z).includes('dirt_path')) continue;
      for (let y = 65; y <= 68; y++) {
        const n = getW(X, y, Z);
        if (isTerrain(n) || isSoft(n)) setW(X, y, Z, 'minecraft:air');
      }
      placeGrass(X, 64, Z, !(Z >= 419 && Z <= 422));
    }
  }
}

function pathAndGate() {
  for (let X = -586; X <= -532; X += 8) {
    for (const Z of [418, 423]) {
      const Y = soilY(X);
      if (!inSchem(X, Y, Z) || HOUSE(X, Z) || SOLAR(X, Z)) continue;
      if (LATTICE_X.includes(X) && LATTICE_Z.includes(Z)) continue;
      if (getW(X, Y, Z).includes('dirt_path')) continue;
      placeGrass(X, Y, Z, false);
      if (!getW(X, Y + 1, Z).startsWith(STATION)) {
        setW(X, Y + 1, Z, 'minecraft:spruce_fence');
        if ((X + Z) % 16 === 0) setW(X, Y + 2, Z, 'minecraft:lantern[hanging=false]');
      }
    }
  }
  for (let X = -580; X <= -540; X += 12) {
    const Z = 423, Y = soilY(X);
    if (!inSchem(X, Y, Z) || HOUSE(X, Z)) continue;
    if (LATTICE_X.includes(X) && LATTICE_Z.includes(Z)) continue;
    placeGrass(X, Y, Z, false);
    if (!getW(X, Y + 1, Z).startsWith(STATION)) {
      setW(X, Y + 1, Z, 'minecraft:spruce_stairs[facing=north,half=bottom]');
    }
  }
  for (const X of [-529, -527]) {
    for (const Z of [419, 422]) {
      if (SOLAR(X, Z)) continue;
      for (let Y = 70; Y <= 74; Y++) {
        if (!inSchem(X, Y, Z)) continue;
        const mix = (X + Z + Y) % 3;
        setW(
          X,
          Y,
          Z,
          mix === 0
            ? 'minecraft:stone_bricks'
            : mix === 1
              ? 'minecraft:mossy_stone_bricks'
              : 'minecraft:cracked_stone_bricks',
        );
      }
      if (inSchem(X, 75, Z)) setW(X, 75, Z, 'minecraft:stone_brick_slab[type=bottom]');
      if (inSchem(X, 74, Z)) setW(X, 74, Z, 'minecraft:lantern[hanging=false]');
    }
  }
  for (let X = -532; X <= -524; X++) {
    for (const Z of [420, 421]) {
      if (SOLAR(X, Z) || HOUSE(X, Z) || !inSchem(X, 70, Z)) continue;
      if (X === -528) {
        for (let Y = 71; Y <= 74; Y++) {
          if (/stone_brick|mossy|cracked|cobble/.test(getW(X, Y, Z))) setW(X, Y, Z, 'minecraft:air');
        }
      }
      const Y = X <= -528 ? 70 : Math.max(70, topTerrainY(X, Z) ?? 70);
      for (let y = Y - 2; y < Y; y++) if (inSchem(X, y, Z)) setW(X, y, Z, 'minecraft:dirt');
      setW(X, Y, Z, 'minecraft:dirt_path');
      for (let y = Y + 1; y <= Y + 3; y++) {
        if (isSoft(getW(X, y, Z)) || isCropish(getW(X, y, Z))) setW(X, y, Z, 'minecraft:air');
      }
    }
  }
  if (inSchem(-528, 71, 420)) {
    setWForce(-528, 71, 420, 'minecraft:oak_fence_gate[facing=east,open=false,powered=false,in_wall=false]');
  }
  if (inSchem(-528, 71, 421)) {
    setWForce(-528, 71, 421, 'minecraft:oak_fence_gate[facing=east,open=false,powered=false,in_wall=false]');
  }
}

function lanternWalls() {
  const placeWallLantern = (X, Z) => {
    let Y = topTerrainY(X, Z);
    if (Y == null) return;
    const n = getW(X, Y, Z);
    if (!/stone_brick|mossy|cracked|cobble|andesite|slab|stair/.test(n)) {
      if (/stone_brick|mossy|cracked|cobble/.test(getW(X, Y - 1, Z))) Y = Y - 1;
      else return;
    }
    for (const [x, y, z] of [
      [X, Y + 1, Z],
      [X + 1, Y, Z],
      [X - 1, Y, Z],
      [X, Y, Z + 1],
      [X, Y, Z - 1],
    ]) {
      if (!inSchem(x, y, z) || HOUSE(x, z) || SOLAR(x, z)) continue;
      const cur = getW(x, y, z);
      if (cur !== 'minecraft:air' && !isSoft(cur)) continue;
      setW(x, y, z, 'minecraft:lantern[hanging=false]');
      return;
    }
  };
  for (let Z = WALL_Z1; Z <= WALL_Z2; Z += 8) {
    if (Z >= 416 && Z <= 425) continue;
    placeWallLantern(WALL_X1, Z);
    placeWallLantern(WALL_X2, Z);
  }
  for (let X = WALL_X1 + 8; X < WALL_X2; X += 8) {
    placeWallLantern(X, WALL_Z1);
    placeWallLantern(X, WALL_Z2);
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

function convertUncoveredFarmland() {
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
        if (ok) continue;
        const X = wx(x), Z = wz(z);
        if (HOUSE(X, Z) || SOLAR(X, Z)) continue;
        grid.set(x, y, z, 'minecraft:grass_block');
        const above = full(grid.get(x, y + 1, z));
        if (isCropish(above) || isSoft(above)) {
          const r = hash(X, Z) % 100;
          grid.set(x, y + 1, z, r < 40 ? 'minecraft:short_grass' : r < 70 ? FLOWERS[r % FLOWERS.length] : 'minecraft:air');
        }
      }
}

console.log('polishing…');
softenSkirts();
breakCropStripes();
gradeWestLawn();
pathAndGate();
lanternWalls();
ensureStations();
convertUncoveredFarmland();

const stations = [];
for (let x = 0; x < SX; x++)
  for (let y = 0; y < SY; y++)
    for (let z = 0; z < SZ; z++) {
      if (full(grid.get(x, y, z)).startsWith(STATION)) stations.push([x, y, z]);
    }
let uncovered = 0, farm = 0, trapOk = 0;
for (let x = 0; x < SX; x++)
  for (let y = 0; y < SY; y++)
    for (let z = 0; z < SZ; z++) {
      const n = full(grid.get(x, y, z));
      if (!n.startsWith('minecraft:farmland')) continue;
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
for (const [x, y, z] of stations) {
  if (full(grid.get(x, y + 1, z)).includes('trapdoor')) trapOk++;
}
const latticeStations = stations.filter(
  ([x, , z]) => LATTICE_X.includes(wx(x)) && LATTICE_Z.includes(wz(z)),
);

writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify({ stations: stations.length, latticeStations: latticeStations.length, trapOk, farm, uncovered }, null, 2));
