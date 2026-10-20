/**
 * Pass 2 polish after ambition build. ORIGIN_Y=44 (expanded schem).
 * Fixes pavilion, fountain edges, pantry stub, orchard spacing,
 * more night lights, skirt slopes; keeps stations/coverage.
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
];

const full = (b) => (typeof b === 'string' ? b : String(b ?? 'minecraft:air'));
const getW = (X, Y, Z) => full(grid.get(toLX(X), toLY(Y), toLZ(Z)));
const setW = (X, Y, Z, b) => {
  if (HOUSE(X, Z)) return;
  grid.set(toLX(X), toLY(Y), toLZ(Z), b);
};
const setWForce = (X, Y, Z, b) => grid.set(toLX(X), toLY(Y), toLZ(Z), b);
const setSolar = (X, Y, Z, b) => grid.set(toLX(X), toLY(Y), toLZ(Z), b);
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
const isTerrain = (n) =>
  /grass_block|dirt$|stone$|granite|diorite|andesite|gravel|sand$|cobblestone$|farmland/.test(n);
const isSoft = (n) =>
  /short_grass|tall_grass|dandelion|poppy|allium|cornflower|oxeye|lily_of|azure|azalea|bush|leaf_litter|firefly|fern|wheat|carrot|potato|beet/.test(
    n,
  );
const isCropish = (n) => /wheat|carrots|potatoes|beetroots|farmland/.test(n);

function topTerrainY(X, Z) {
  for (let Y = 85; Y >= 45; Y--) {
    if (!inSchem(X, Y, Z)) continue;
    const n = getW(X, Y, Z);
    if (isTerrain(n) || n.includes('dirt_path') || /stone_brick|mossy|cracked|cobble|deepslate/.test(n))
      return Y;
  }
  return null;
}

function clearColumn(X, y0, y1, Z) {
  for (let Y = y0; Y <= y1; Y++) {
    if (!inSchem(X, Y, Z)) continue;
    const n = getW(X, Y, Z);
    if (n.startsWith(STATION) || n.includes('trapdoor')) continue;
    setW(X, Y, Z, 'minecraft:air');
  }
}

function placeGrass(X, Y, Z, plant = true) {
  if (!inSchem(X, Y, Z) || HOUSE(X, Z)) return;
  for (let y = Y - 2; y < Y; y++) if (inSchem(X, y, Z)) setW(X, y, Z, 'minecraft:dirt');
  setW(X, Y, Z, 'minecraft:grass_block');
  for (let y = Y + 1; y <= Y + 3; y++) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n.startsWith(STATION) || /trapdoor|fence|door|gate|wall|pane|plank|log|stair|slab|brick|lantern|glass|panel/.test(n))
      break;
    if (isSoft(n) || n === 'minecraft:air' || isTerrain(n) || isCropish(n)) setW(X, y, Z, 'minecraft:air');
    else break;
  }
  if (!plant) return;
  const r = hash(X, Z) % 100;
  if (r < 40) setW(X, Y + 1, Z, 'minecraft:short_grass');
  else if (r < 58) setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
}

// Fix pavilion interior — clear junk stairs from floor, add furniture properly
function fixPavilion() {
  const Y = 70;
  for (let X = -535; X <= -531; X++) {
    for (let Z = 409; Z <= 414; Z++) {
      if (LATTICE_X.includes(X) && LATTICE_Z.includes(Z)) continue;
      // floor
      setW(X, Y, Z, 'minecraft:spruce_planks');
      // clear interior volume
      for (let y = Y + 1; y <= Y + 3; y++) {
        const edge = X === -536 || X === -530 || Z === 408 || Z === 415;
        if (!edge) setW(X, y, Z, 'minecraft:air');
      }
    }
  }
  // walls again
  for (let X = -536; X <= -530; X++) {
    for (let Z = 408; Z <= 415; Z++) {
      const edge = X === -536 || X === -530 || Z === 408 || Z === 415;
      if (!edge) continue;
      setW(X, Y, Z, 'minecraft:cobblestone');
      for (let y = Y + 1; y <= Y + 3; y++) {
        if ((X === -536 || X === -530) && Z > 408 && Z < 415 && y === Y + 2 && Z !== 411) {
          setW(X, y, Z, 'minecraft:glass_pane');
        } else if ((X + Z + y) % 4 === 0) setW(X, y, Z, 'minecraft:spruce_log[axis=y]');
        else setW(X, y, Z, 'minecraft:oak_planks');
      }
    }
  }
  // doors to path
  setW(-534, Y + 1, 415, 'minecraft:air');
  setW(-533, Y + 1, 415, 'minecraft:air');
  setW(-534, Y + 2, 415, 'minecraft:air');
  setW(-533, Y + 2, 415, 'minecraft:air');
  setW(-534, Y + 1, 415, 'minecraft:oak_door[facing=north,half=lower,hinge=left,open=false,powered=false]');
  setW(-534, Y + 2, 415, 'minecraft:oak_door[facing=north,half=upper,hinge=left,open=false,powered=false]');
  // furniture
  setW(-533, Y + 1, 411, 'minecraft:spruce_stairs[facing=south,half=bottom]');
  setW(-532, Y + 1, 411, 'minecraft:spruce_stairs[facing=south,half=bottom]');
  setW(-534, Y + 1, 410, 'minecraft:oak_fence');
  setW(-534, Y + 2, 410, 'minecraft:lantern[hanging=false]');
  setW(-531, Y + 1, 412, 'minecraft:barrel[facing=up]');
  setW(-531, Y + 1, 413, 'minecraft:crafting_table');
  // hanging lanterns for night
  setW(-533, Y + 3, 412, 'minecraft:lantern[hanging=true]');
  // roof clean peak
  for (let X = -536; X <= -530; X++) {
    for (let Z = 408; Z <= 415; Z++) {
      const mid = 411.5;
      if (Z <= 411) setW(X, Y + 4, Z, 'minecraft:spruce_stairs[facing=south,half=bottom]');
      else setW(X, Y + 4, Z, 'minecraft:spruce_stairs[facing=north,half=bottom]');
      setW(X, Y + 5, Z, Math.abs(Z - mid) < 0.6 ? 'minecraft:spruce_slab[type=bottom]' : 'minecraft:air');
    }
  }
}

// Pantry wing stub against west-inner wall (labeled barrels)
function pantryStub() {
  const Y = 64;
  // near house but outside protect: x=-591 is borderline; use -590..-588 south of door
  for (let X = -590; X <= -588; X++) {
    for (let Z = 432; Z <= 436; Z++) {
      if (HOUSE(X, Z) || !inSchem(X, Y, Z)) continue;
      if (LATTICE_X.includes(X) && LATTICE_Z.includes(Z)) continue;
      clearColumn(X, Y + 1, Y + 5, Z);
      for (let y = Y - 1; y < Y; y++) setW(X, y, Z, 'minecraft:dirt');
      const edge = X === -590 || X === -588 || Z === 432 || Z === 436;
      setW(X, Y, Z, 'minecraft:cobblestone');
      if (edge) {
        for (let y = Y + 1; y <= Y + 3; y++) setW(X, y, Z, 'minecraft:oak_planks');
        setW(X, Y + 4, Z, 'minecraft:spruce_stairs[facing=east,half=bottom]');
      } else {
        setW(X, Y + 1, Z, 'minecraft:air');
        setW(X, Y + 2, Z, 'minecraft:air');
        setW(X, Y + 3, Z, 'minecraft:air');
        setW(X, Y + 4, Z, 'minecraft:oak_slab[type=bottom]');
      }
    }
  }
  // doorway
  setW(-589, Y + 1, 432, 'minecraft:air');
  setW(-589, Y + 2, 432, 'minecraft:air');
  // barrels (pantry)
  setW(-589, Y + 1, 434, 'minecraft:barrel[facing=south]');
  setW(-589, Y + 1, 435, 'minecraft:barrel[facing=south]');
  setW(-588, Y + 1, 434, 'minecraft:barrel[facing=west]');
  setW(-590, Y + 2, 434, 'minecraft:lantern[hanging=false]');
  // sign-like chiseled marker
  setW(-589, Y + 2, 436, 'minecraft:oak_wall_sign[facing=south,waterlogged=false]');
}

// Fountain polish — stone rim seats + sea lantern underwater glow
function polishFountain() {
  const CX = -560,
    CZ = 420,
    Y = soilY(CX);
  for (let X = CX - 1; X <= CX + 1; X++) {
    for (let Z = CZ - 1; Z <= CZ + 1; Z++) {
      if (X === CX && Z === CZ) {
        setW(X, Y, Z, 'minecraft:sea_lantern');
        setW(X, Y + 1, Z, 'minecraft:water');
        setW(X, Y + 2, Z, 'minecraft:water');
        setW(X, Y + 3, Z, 'minecraft:cobblestone_wall');
        setW(X, Y + 4, Z, 'minecraft:lantern[hanging=false]');
      } else {
        setW(X, Y, Z, 'minecraft:stone_bricks');
        setW(X, Y + 1, Z, 'minecraft:water');
      }
    }
  }
  // benches on court edge
  for (const [X, Z, face] of [
    [-560, 417, 'south'],
    [-560, 423, 'north'],
    [-563, 420, 'east'],
    [-557, 420, 'west'],
  ]) {
    if (LATTICE_X.includes(X) && LATTICE_Z.includes(Z)) continue;
    setW(X, Y, Z, 'minecraft:grass_block');
    setW(X, Y + 1, Z, `minecraft:spruce_stairs[facing=${face},half=bottom]`);
  }
}

// Soften remaining 2+ cliffs outside walls (ignore wall itself)
function softenCliffs() {
  for (let X = WALL_X1 - 1; X <= WALL_X2 + 14; X++) {
    for (let Z = WALL_Z1 - 14; Z <= WALL_Z2 + 8; Z++) {
      const outside = X < WALL_X1 || X > WALL_X2 || Z < WALL_Z1 || Z > WALL_Z2;
      if (!outside || HOUSE(X, Z) || SOLAR(X, Z) || !inSchem(X, 64, Z)) continue;
      const y0 = topTerrainY(X, Z);
      if (y0 == null) continue;
      for (const [dx, dz] of [
        [1, 0],
        [0, 1],
        [-1, 0],
        [0, -1],
      ]) {
        const X2 = X + dx,
          Z2 = Z + dz;
        if (!inSchem(X2, 64, Z2) || HOUSE(X2, Z2) || SOLAR(X2, Z2)) continue;
        // don't flatten into garden wall columns
        if (
          (X2 === WALL_X1 || X2 === WALL_X2 || Z2 === WALL_Z1 || Z2 === WALL_Z2) &&
          /stone_brick|mossy|cracked/.test(getW(X2, topTerrainY(X2, Z2) ?? 70, Z2))
        )
          continue;
        const y1 = topTerrainY(X2, Z2);
        if (y1 == null) continue;
        if (Math.abs(y0 - y1) >= 2) {
          const mid = Math.floor((y0 + y1) / 2);
          // raise lower / lower higher gently
          const target = y0 < y1 ? Math.min(y0 + 1, mid) : Math.max(y0 - 1, mid);
          for (let y = 80; y > target; y--) {
            if (!inSchem(X, y, Z)) continue;
            const n = getW(X, y, Z);
            if (/stone_brick|mossy_stone|cracked|panel|battery|lantern|glass|deepslate/.test(n)) continue;
            if (isTerrain(n) || isSoft(n) || n === 'minecraft:air') setW(X, y, Z, 'minecraft:air');
          }
          for (let y = target - 2; y < target; y++) if (inSchem(X, y, Z)) setW(X, y, Z, 'minecraft:dirt');
          placeGrass(X, target, Z, true);
        }
      }
    }
  }
}

// More crop grass crosses + keep lily ponds
function moreGardenTexture() {
  for (let X = WALL_X1 + 3; X < WALL_X2 - 3; X++) {
    const Y = soilY(X);
    for (let Z = WALL_Z1 + 5; Z < WALL_Z2 - 5; Z++) {
      if (HOUSE(X, Z) || Z >= 418 && Z <= 423) continue;
      if (LATTICE_X.includes(X) && LATTICE_Z.some((sz) => Math.abs(sz - Z) <= 1)) continue;
      if ((X + Z * 3) % 13 !== 0) continue;
      if (!isCropish(getW(X, Y, Z)) && !isCropish(getW(X, Y + 1, Z))) continue;
      if (getW(X, Y + 1, Z).startsWith(STATION)) continue;
      placeGrass(X, Y, Z, true);
    }
  }
  // preserve / rim lily ponds near path if water exists
  for (let X = -575; X <= -545; X++) {
    for (let Z = 400; Z <= 440; Z++) {
      if (!inSchem(X, 64, Z)) continue;
      for (let Y = 63; Y <= 68; Y++) {
        if (getW(X, Y, Z).includes('water') && !getW(X, Y + 1, Z).includes('water')) {
          // stone rim neighbor
          for (const [dx, dz] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ]) {
            const n = getW(X + dx, Y, Z + dz);
            if (isTerrain(n) || n.includes('grass') || n.includes('dirt_path') || isCropish(n)) {
              if (!(LATTICE_X.includes(X + dx) && LATTICE_Z.includes(Z + dz))) {
                setW(X + dx, Y, Z + dz, 'minecraft:stone');
              }
            }
          }
          if (hash(X, Z) % 5 === 0) setW(X, Y + 1, Z, 'minecraft:lily_pad');
        }
      }
    }
  }
}

// Solar farm polish — cable run visible at edge, more moonlit mix, fence perimeter
function polishSolar() {
  for (let X = -526; X <= -514; X++) {
    setSolar(X, (topTerrainY(X, 446) ?? 70) + 1, 446, 'minecraft:oak_fence');
    setSolar(X, (topTerrainY(X, 464) ?? 70) + 1, 464, 'minecraft:oak_fence');
  }
  for (let Z = 446; Z <= 464; Z++) {
    const ty = topTerrainY(-526, Z) ?? 70;
    setSolar(-526, ty + 1, Z, 'minecraft:oak_fence');
  }
  // buried cable markers along service path
  for (let Z = 448; Z <= 462; Z += 2) {
    const ty = topTerrainY(-520, Z) ?? 70;
    if (getW(-520, ty, Z).includes('dirt_path')) {
      setSolar(-520, ty - 1, Z, 'alaindustrial:insulated_copper_cable');
    }
  }
  // night lights on perimeter posts
  for (let Z = 448; Z <= 462; Z += 4) {
    const ty = topTerrainY(-526, Z) ?? 70;
    setSolar(-526, ty + 1, Z, 'minecraft:oak_fence');
    setSolar(-526, ty + 2, Z, 'minecraft:lantern[hanging=false]');
  }
}

// Carriage loop denser cobble + flower beds
function polishCarriage() {
  for (let Z = 414; Z <= 426; Z++) {
    for (let X = -591; X <= -587; X++) {
      if (HOUSE(X, Z) || !inSchem(X, 64, Z)) continue;
      if (Z >= 418 && Z <= 422 && X >= -590) {
        setW(X, 63, Z, 'minecraft:dirt');
        setW(X, 64, Z, hash(X, Z) % 2 ? 'minecraft:cobblestone' : 'minecraft:mossy_cobblestone');
        clearColumn(X, 65, 68, Z);
      }
    }
  }
  for (const Z of [413, 427]) {
    for (let X = -590; X <= -588; X++) {
      if (HOUSE(X, Z)) continue;
      placeGrass(X, 64, Z, false);
      setW(X, 65, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
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

function convertUncovered() {
  const stations = [];
  for (let x = 0; x < SX; x++)
    for (let y = 0; y < SY; y++)
      for (let z = 0; z < SZ; z++) {
        if (full(grid.get(x, y, z)).startsWith(STATION)) stations.push([x, y, z]);
      }
  let uncovered = 0,
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
        if (!ok) {
          uncovered++;
          const X = wx(x),
            Z = wz(z);
          if (HOUSE(X, Z)) continue;
          grid.set(x, y, z, 'minecraft:grass_block');
          const above = full(grid.get(x, y + 1, z));
          if (isCropish(above) || isSoft(above)) grid.set(x, y + 1, z, 'minecraft:short_grass');
          uncovered--; // converted
        }
      }
  // recount
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
  const lattice = stations.filter(([x, , z]) => LATTICE_X.includes(wx(x)) && LATTICE_Z.includes(wz(z)));
  return { stations: stations.length, lattice: lattice.length, farm, uncovered };
}

console.log('pass2…');
fixPavilion();
pantryStub();
polishFountain();
softenCliffs();
moreGardenTexture();
polishSolar();
polishCarriage();
ensureStations();
const m = convertUncovered();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
