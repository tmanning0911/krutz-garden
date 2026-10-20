/**
 * Pass 13 — heal floating exterior islands, connect NW skirts, upgrade
 * solar battery cutaway glass, visitor pavilion interior, kitchen beds,
 * moon-gate arch, firefly glade, SE amphitheatre steps.
 * Mapping: +634 / -44 / -348.
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
  'minecraft:oxeye_daisy',
  'minecraft:dandelion',
  'minecraft:poppy',
  'minecraft:allium',
  'minecraft:cornflower',
  'minecraft:lily_of_the_valley',
  'minecraft:azure_bluet',
];
const CROPS = [
  'minecraft:wheat[age=7]',
  'minecraft:carrots[age=7]',
  'minecraft:potatoes[age=7]',
  'minecraft:beetroots[age=3]',
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
  /short_grass|tall_grass|dandelion|poppy|allium|cornflower|oxeye|lily_of|azure|azalea|bush|leaf_litter|firefly|fern|wheat|carrot|potato|beet|petal|tulip/.test(
    n,
  );
const brickMix = (X, Y, Z) => {
  const m = (X + Y * 3 + Z * 7) % 5;
  if (m === 0) return 'minecraft:mossy_stone_bricks';
  if (m === 1) return 'minecraft:cracked_stone_bricks';
  if (m === 2) return 'minecraft:mossy_cobblestone';
  return 'minecraft:stone_bricks';
};

function topTerrainY(X, Z) {
  for (let Y = 88; Y >= 45; Y--) {
    if (!inSchem(X, Y, Z)) continue;
    const n = getW(X, Y, Z);
    if (isTerrain(n) || n.includes('dirt_path') || /stone_brick|mossy|cracked|cobble/.test(n)) return Y;
  }
  return null;
}

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
  for (let y = Math.max(ORIGIN_Y + 1, Y - 4); y < Y; y++) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n === 'minecraft:air' || isSoft(n) || isTerrain(n)) setW(X, y, Z, 'minecraft:dirt');
  }
  setW(X, Y, Z, 'minecraft:grass_block');
  clearSoft(X, Y, Z, 4);
  if (!plant) return;
  const r = hash(X, Z) % 100;
  if (r < 40) setW(X, Y + 1, Z, 'minecraft:short_grass');
  else if (r < 58) setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
}

function reshape(X, Z, target, plant) {
  for (let y = 85; y > target; y--) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n.startsWith(STATION) || n.includes('trapdoor')) continue;
    if (/stone_brick|mossy_stone|cracked_stone|chiseled|glass|panel|battery|lantern|deepslate/.test(n)) continue;
    if (isTerrain(n) || isSoft(n) || n === 'minecraft:air' || /leaves|log|vine|petal/.test(n)) setW(X, y, Z, 'minecraft:air');
  }
  const cur = topTerrainY(X, Z);
  if (cur == null || cur < target) {
    for (let y = ORIGIN_Y + 1; y <= target; y++) {
      if (!inSchem(X, y, Z)) continue;
      const n = getW(X, y, Z);
      if (n === 'minecraft:air' || isSoft(n) || isTerrain(n) || cur == null || y > cur)
        setW(X, y, Z, y === target ? 'minecraft:dirt' : 'minecraft:dirt');
    }
  }
  // fill column from bedrock of schem up so no floaters
  for (let y = ORIGIN_Y + 1; y < target; y++) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n === 'minecraft:air' || isSoft(n)) setW(X, y, Z, 'minecraft:dirt');
  }
  placeGrass(X, target, Z, plant);
}

// ─── Heal floating exterior islands ───
function healFloaters() {
  // North skirt continuous grade
  for (let X = -630; X <= -514; X++) {
    for (let Z = 348; Z < WALL_Z1; Z++) {
      if (!inSchem(X, 56, Z) || HOUSE(X, Z)) continue;
      const dist = WALL_Z1 - Z;
      const base = soilY(Math.min(Math.max(X, WALL_X1), WALL_X2));
      const target = Math.max(56, base - Math.ceil(dist * 0.55));
      reshape(X, Z, target, dist > 2);
    }
  }
  // West skirt continuous grade
  for (let X = -634; X < WALL_X1; X++) {
    for (let Z = 348; Z <= 490; Z++) {
      if (!inSchem(X, 56, Z) || HOUSE(X, Z)) continue;
      // preserve water channel
      if (X >= -622 && X <= -618 && Z >= 408 && Z <= 432) {
        for (let y = ORIGIN_Y + 1; y <= 59; y++) setW(X, y, Z, 'minecraft:dirt');
        setW(X, 60, Z, 'minecraft:dirt');
        setW(X, 61, Z, 'minecraft:water');
        setW(X, 62, Z, 'minecraft:water');
        setW(X, 63, Z, hash(X, Z) % 7 === 0 ? 'minecraft:lily_pad' : 'minecraft:air');
        continue;
      }
      const dist = WALL_X1 - X;
      const target = Math.max(56, 64 - Math.ceil(dist * 0.5));
      reshape(X, Z, target, true);
    }
  }
  // East approach continuous
  for (let X = WALL_X2 + 1; X <= -512; X++) {
    for (let Z = 360; Z <= 480; Z++) {
      if (!inSchem(X, 60, Z) || HOUSE(X, Z) || SOLAR(X, Z)) continue;
      // skip battery hall volume
      if (X >= -524 && X <= -514 && Z >= 450 && Z <= 464) continue;
      const dist = X - WALL_X2;
      let target = Math.max(64, 70 - Math.floor(dist * 0.45));
      if (Z >= 416 && Z <= 425) target = Math.max(target, 69 - Math.floor(dist * 0.3));
      reshape(X, Z, target, true);
    }
  }
}

function solarBatteryCutaway() {
  // open a glass face on south of battery hall for readability
  const floorY = 52;
  for (let X = -523; X <= -517; X++) {
    for (let Y = floorY + 1; Y <= floorY + 4; Y++) {
      setSolar(X, Y, 450, 'minecraft:glass');
    }
  }
  // interior accent lighting + labeled cable run
  for (let X = -523; X <= -517; X++) {
    setSolar(X, floorY + 1, 455, 'alaindustrial:insulated_copper_cable');
  }
  setSolar(-520, floorY + 4, 455, 'minecraft:sea_lantern');
  setSolar(-518, floorY + 1, 452, 'minecraft:barrel[facing=up,open=false]');
  setSolar(-522, floorY + 1, 452, 'minecraft:crafting_table');
  // surface plaque
  setSolar(-520, 71, 449, 'minecraft:cobblestone');
  setSolar(-520, 72, 449, 'minecraft:oak_sign[rotation=8,waterlogged=false]');
}

function pavilionInterior() {
  // upgrade visitor pavilion ~(-533,411)
  const Y = 70;
  for (const [X, Z, b] of [
    [-533, 410, 'minecraft:spruce_stairs[facing=south,half=bottom]'],
    [-532, 410, 'minecraft:spruce_stairs[facing=south,half=bottom]'],
    [-533, 413, 'minecraft:bookshelf'],
    [-532, 413, 'minecraft:bookshelf'],
    [-534, 411, 'minecraft:cartography_table'],
    [-531, 412, 'minecraft:flower_pot'],
    [-533, 412, 'minecraft:oak_pressure_plate[powered=false]'],
  ]) {
    if (!inSchem(X, Y + 1, Z) || isStationCell(X, Z)) continue;
    setW(X, Y + 1, Z, b);
  }
  setW(-532, Y + 3, 411, 'minecraft:lantern[hanging=true]');
  // apron flagstones
  for (let X = -536; X <= -529; X++) {
    for (let Z = 416; Z <= 417; Z++) {
      if (isStationCell(X, Z)) continue;
      setW(X, Y, Z, hash(X, Z) % 2 ? 'minecraft:cobblestone' : 'minecraft:mossy_cobblestone');
      clearSoft(X, Y, Z, 2);
    }
  }
}

function kitchenBeds() {
  // mixed kitchen garden near herb spiral / house front
  for (let X = -586; X <= -580; X++) {
    for (let Z = 400; Z <= 406; Z++) {
      if (HOUSE(X, Z) || isStationCell(X, Z) || !inSchem(X, 64, Z)) continue;
      if (getW(X, 65, Z).startsWith(STATION)) continue;
      clearSoft(X, 64, Z, 3);
      if ((X + Z) % 3 === 0) {
        setW(X, 64, Z, 'minecraft:farmland[moisture=7]');
        setW(X, 65, Z, CROPS[hash(X, Z) % CROPS.length]);
      } else if ((X + Z) % 3 === 1) {
        placeGrass(X, 64, Z, false);
        setW(X, 65, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
      } else {
        setW(X, 64, Z, 'minecraft:dirt_path');
        setW(X, 65, Z, 'minecraft:air');
      }
    }
  }
  // water source for beds
  setW(-583, 64, 403, 'minecraft:water');
}

function moonGate() {
  // circular moon gate in hedge between maze and rose garden
  const CX = -571,
    CZ = 385;
  const Y = soilY(CX);
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = 0; dy <= 4; dy++) {
      const X = CX + dx;
      const dist = Math.hypot(dx, dy - 2);
      if (!inSchem(X, Y + dy, CZ)) continue;
      if (isStationCell(X, CZ)) continue;
      if (dist <= 2.3 && dist >= 1.4) {
        setW(X, Y + dy, CZ, brickMix(X, Y + dy, CZ));
      } else if (dist < 1.4) {
        setW(X, Y + dy, CZ, 'minecraft:air');
      }
    }
  }
  setW(CX, Y, CZ, 'minecraft:dirt_path');
  setW(CX, Y + 4, CZ, 'minecraft:lantern[hanging=false]');
}

function fireflyGlade() {
  // quiet glade NW inside wall with firefly bushes
  for (let X = -588; X <= -576; X++) {
    for (let Z = 444; Z <= 452; Z++) {
      if (HOUSE(X, Z) || isStationCell(X, Z) || !inSchem(X, 64, Z)) continue;
      if (Z >= 418 && Z <= 423) continue;
      if (getW(X, 65, Z).startsWith(STATION)) continue;
      const Y = soilY(X);
      placeGrass(X, Y, Z, false);
      const r = hash(X, Z) % 100;
      if (r < 25) setW(X, Y + 1, Z, 'minecraft:firefly_bush');
      else if (r < 45) setW(X, Y + 1, Z, 'minecraft:short_grass');
      else if (r < 55) setW(X, Y + 1, Z, 'minecraft:lilac');
      if (r < 55 && getW(X, Y + 1, Z) === 'minecraft:lilac') setW(X, Y + 2, Z, 'minecraft:lilac');
    }
  }
  // clearing path
  for (let X = -586; X <= -578; X++) {
    const Z = 448;
    if (isStationCell(X, Z)) continue;
    const Y = soilY(X);
    setW(X, Y, Z, 'minecraft:dirt_path');
    setW(X, Y + 1, Z, 'minecraft:air');
  }
  setW(-582, soilY(-582) + 1, 448, 'minecraft:lantern[hanging=false]');
}

function amphitheatre() {
  // SE outside wall — stepped seating looking at solar hill
  for (let step = 0; step < 5; step++) {
    const Y = 68 - step;
    for (let X = -526 + step; X <= -514; X++) {
      for (let Z = 438 - step; Z <= 444 - step; Z++) {
        if (SOLAR(X, Z) || !inSchem(X, Y, Z)) continue;
        setW(X, Y, Z, step % 2 ? 'minecraft:stone_brick_stairs[facing=south,half=bottom]' : 'minecraft:stone_bricks');
        clearSoft(X, Y, Z, 3);
      }
    }
  }
  // center aisle
  for (let Z = 434; Z <= 444; Z++) {
    for (const X of [-520, -519]) {
      if (SOLAR(X, Z) || !inSchem(X, 66, Z)) continue;
      setW(X, 66, Z, 'minecraft:dirt_path');
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
    trapOk = 0,
    panels = 0;
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
    size: { SX, SY, SZ },
    stations: stations.length,
    lattice: stations.filter(([x, , z]) => LATTICE_X.includes(wx(x)) && LATTICE_Z.includes(wz(z))).length,
    trapOk,
    farm,
    uncovered,
    panels,
  };
}

console.log('pass13…');
healFloaters();
solarBatteryCutaway();
pavilionInterior();
kitchenBeds();
moonGate();
fireflyGlade();
amphitheatre();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
