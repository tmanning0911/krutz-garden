/**
 * Pass 16 — polish: restore deep-farm trapdoor, soft-light columns,
 * visitor welcome mat, SE vineyard gate, north wildflower meadow,
 * battery hall plaque room, path centerline mosaic. Mapping +634/-44/-348.
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
const FLOWERS = [
  'minecraft:oxeye_daisy',
  'minecraft:dandelion',
  'minecraft:poppy',
  'minecraft:allium',
  'minecraft:cornflower',
  'minecraft:lily_of_the_valley',
  'minecraft:azure_bluet',
  'minecraft:orange_tulip',
  'minecraft:pink_tulip',
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
  else if (r < 62) setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
}

function restoreAllTrapdoors() {
  // every station gets a trapdoor
  for (let x = 0; x < SX; x++)
    for (let y = 0; y < SY; y++)
      for (let z = 0; z < SZ; z++) {
        if (!full(grid.get(x, y, z)).startsWith(STATION)) continue;
        const above = full(grid.get(x, y + 1, z));
        if (!above.includes('trapdoor')) {
          grid.set(
            x,
            y + 1,
            z,
            'minecraft:spruce_trapdoor[facing=south,half=bottom,open=true,waterlogged=false]',
          );
        }
      }
}

function softLightColumns() {
  // subtle glowstone buried under key courts
  const spots = [
    [-560, 420],
    [-548, 434],
    [-579, 389],
    [-564, 382],
    [-585, 375],
    [-556, 448],
    [-533, 411],
  ];
  for (const [X, Z] of spots) {
    if (!inSchem(X, soilY(X) - 1, Z)) continue;
    const Y = soilY(X);
    setW(X, Y - 1, Z, 'minecraft:glowstone');
  }
}

function welcomeMat() {
  // east gate welcome apron
  for (let X = -527; X <= -522; X++) {
    for (const Z of [419, 420, 421, 422]) {
      if (SOLAR(X, Z) || !inSchem(X, 70, Z)) continue;
      clearSoft(X, 70, Z, 3);
      const checker = (X + Z) % 2 === 0;
      setW(X, 70, Z, checker ? 'minecraft:polished_andesite' : 'minecraft:andesite');
    }
  }
  setW(-525, 71, 418, 'minecraft:lantern[hanging=false]');
  setW(-525, 71, 423, 'minecraft:lantern[hanging=false]');
  setW(-524, 71, 420, 'minecraft:oak_sign[rotation=12,waterlogged=false]');
}

function vineyardGate() {
  const X = -540,
    Z = 456;
  const Y = soilY(X);
  if (isStationCell(X, Z)) return;
  clearSoft(X, Y, Z, 4);
  setW(X, Y, Z, 'minecraft:cobblestone');
  setW(X, Y + 1, Z, 'minecraft:oak_fence_gate[facing=south,open=false,powered=false,in_wall=false]');
  setW(X - 1, Y + 1, Z, 'minecraft:oak_fence');
  setW(X + 1, Y + 1, Z, 'minecraft:oak_fence');
  setW(X - 1, Y + 2, Z, 'minecraft:lantern[hanging=false]');
  setW(X + 1, Y + 2, Z, 'minecraft:lantern[hanging=false]');
}

function northWildflowerMeadow() {
  for (let X = -586; X <= -540; X++) {
    for (let Z = 360; Z <= 366; Z++) {
      if (!inSchem(X, 60, Z) || HOUSE(X, Z)) continue;
      const Y = Math.max(58, 64 - (368 - Z));
      placeGrass(X, Y, Z, false);
      const r = hash(X, Z) % 100;
      if (r < 55) setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
      else if (r < 75) setW(X, Y + 1, Z, 'minecraft:short_grass');
      else if (r < 82) setW(X, Y + 1, Z, 'minecraft:tall_grass');
    }
  }
}

function batteryPlaqueRoom() {
  const floorY = 52;
  setSolar(-520, floorY + 1, 458, 'minecraft:lectern[facing=north,has_book=true,powered=false]');
  setSolar(-521, floorY + 1, 458, 'minecraft:bookshelf');
  setSolar(-519, floorY + 1, 458, 'minecraft:bookshelf');
  setSolar(-520, floorY + 3, 458, 'minecraft:lantern[hanging=true]');
  // cable art on wall
  for (let Y = floorY + 1; Y <= floorY + 3; Y++) {
    setSolar(-524, Y, 455, 'alaindustrial:insulated_copper_cable');
  }
}

function pathCenterlineMosaic() {
  for (let X = -586; X <= -532; X++) {
    for (const Z of [420, 421]) {
      if (HOUSE(X, Z) || !inSchem(X, soilY(X), Z)) continue;
      const Y = soilY(X);
      if (X % 7 === 0) {
        setW(X, Y, Z, 'minecraft:chiseled_stone_bricks');
      } else if (X % 7 === 3) {
        setW(X, Y, Z, 'minecraft:mossy_cobblestone');
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
  // deep farm showpiece station
  setWForce(-554, 51, 365, 'minecraft:grass_block');
  setWForce(-554, 52, 365, STATION);
  setWForce(
    -554,
    53,
    365,
    'minecraft:spruce_trapdoor[facing=south,half=bottom,open=true,waterlogged=false]',
  );
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
            if (/wheat|carrot|potato|beet|grass|flower|poppy/.test(a))
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
    stations: stations.length,
    lattice: stations.filter(([x, , z]) => LATTICE_X.includes(wx(x)) && LATTICE_Z.includes(wz(z))).length,
    trapOk,
    farm,
    uncovered,
    panels,
    lanterns,
  };
}

console.log('pass16…');
ensureStations();
restoreAllTrapdoors();
softLightColumns();
welcomeMat();
vineyardGate();
northWildflowerMeadow();
batteryPlaqueRoom();
pathCenterlineMosaic();
ensureStations();
restoreAllTrapdoors();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
