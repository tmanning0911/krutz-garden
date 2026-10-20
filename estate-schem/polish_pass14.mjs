/**
 * Pass 14 — greenhouse expansion, fountain jet upgrade, wall walk parapet,
 * Japanese stepping-stone garden, icehouse cellar stub, lantern festival posts,
 * NE corner chapel ruin, crop row color breaks. Mapping +634/-44/-348.
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
const isCropish = (n) => /wheat|carrots|potatoes|beetroots|farmland/.test(n);
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
  else if (r < 58) setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
}

function expandGreenhouse() {
  // grow glass house west of pavilion
  const Y = 70;
  for (let X = -542; X <= -537; X++) {
    for (let Z = 408; Z <= 415; Z++) {
      if (isStationCell(X, Z) || !inSchem(X, Y, Z)) continue;
      clearSoft(X, Y, Z, 6);
      const edge = X === -542 || X === -537 || Z === 408 || Z === 415;
      setW(X, Y, Z, 'minecraft:cobblestone');
      for (let y = Y + 1; y <= Y + 3; y++) setW(X, y, Z, edge ? 'minecraft:glass' : 'minecraft:air');
      setW(X, Y + 4, Z, 'minecraft:glass');
      if (!edge) {
        if (hash(X, Z) % 3 === 0) setW(X, Y + 1, Z, 'minecraft:potted_cactus');
        else if (hash(X, Z) % 3 === 1) setW(X, Y + 1, Z, 'minecraft:potted_fern');
        else setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
      }
    }
  }
  // doorway into pavilion
  for (const Z of [411, 412]) {
    setW(-537, Y + 1, Z, 'minecraft:air');
    setW(-537, Y + 2, Z, 'minecraft:air');
  }
}

function fountainJetUpgrade() {
  const CX = -560,
    CZ = 420;
  const Y = soilY(CX);
  // taller jet with sea lantern under + end rod
  setW(CX, Y, CZ, 'minecraft:prismarine_bricks');
  setW(CX, Y + 1, CZ, 'minecraft:water');
  setW(CX, Y + 2, CZ, 'minecraft:water');
  setW(CX, Y + 3, CZ, 'minecraft:cobblestone_wall');
  setW(CX, Y + 4, CZ, 'minecraft:end_rod[facing=up]');
  setW(CX, Y - 1, CZ, 'minecraft:sea_lantern');
  // four corner jets
  for (const [dx, dz] of [
    [-2, -2],
    [2, -2],
    [-2, 2],
    [2, 2],
  ]) {
    setW(CX + dx, Y, CZ + dz, 'minecraft:stone_bricks');
    setW(CX + dx, Y + 1, CZ + dz, 'minecraft:water');
    setW(CX + dx, Y + 2, CZ + dz, 'minecraft:lantern[hanging=false]');
  }
}

function wallWalkParapet() {
  for (let Z = WALL_Z1 + 2; Z <= WALL_Z2 - 2; Z++) {
    for (const X of [WALL_X1, WALL_X2]) {
      if (HOUSE(X, Z)) continue;
      if (Z >= 418 && Z <= 423 && X === WALL_X2) continue; // gate
      const base = soilY(X);
      // walk slab
      if (inSchem(X, base + 5, Z)) {
        const n = getW(X, base + 5, Z);
        if (n === 'minecraft:air' || isSoft(n) || /brick|cobble/.test(n)) {
          setW(X, base + 5, Z, brickMix(X, base + 5, Z));
        }
      }
      if (Z % 2 === 0 && inSchem(X, base + 6, Z)) {
        setW(X, base + 6, Z, 'minecraft:stone_brick_wall');
      }
      if (Z % 8 === 0 && inSchem(X, base + 6, Z)) {
        setW(X, base + 7, Z, 'minecraft:lantern[hanging=false]');
      }
    }
  }
  for (let X = WALL_X1 + 2; X <= WALL_X2 - 2; X++) {
    for (const Z of [WALL_Z1, WALL_Z2]) {
      const base = soilY(X);
      if (inSchem(X, base + 5, Z)) setW(X, base + 5, Z, brickMix(X, base + 5, Z));
      if (X % 2 === 0 && inSchem(X, base + 6, Z)) setW(X, base + 6, Z, 'minecraft:stone_brick_wall');
      if (X % 8 === 0 && inSchem(X, base + 7, Z)) setW(X, base + 7, Z, 'minecraft:lantern[hanging=false]');
    }
  }
}

function steppingStoneGarden() {
  // zen garden west of sundial
  const stones = [
    [-574, 410],
    [-573, 411],
    [-572, 412],
    [-571, 413],
    [-570, 414],
    [-569, 413],
    [-568, 412],
    [-567, 411],
  ];
  for (const [X, Z] of stones) {
    if (isStationCell(X, Z) || HOUSE(X, Z) || !inSchem(X, soilY(X), Z)) continue;
    if (Z >= 418 && Z <= 423) continue;
    const Y = soilY(X);
    clearSoft(X, Y, Z, 2);
    setW(X, Y, Z, 'minecraft:smooth_stone');
    setW(X, Y + 1, Z, 'minecraft:air');
    // gravel/sand raked field neighbors
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const X2 = X + dx,
        Z2 = Z + dz;
      if (isStationCell(X2, Z2) || !inSchem(X2, Y, Z2)) continue;
      if (Z2 >= 418 && Z2 <= 423) continue;
      if (getW(X2, Y + 1, Z2).startsWith(STATION)) continue;
      setW(X2, Y, Z2, hash(X2, Z2) % 2 ? 'minecraft:gravel' : 'minecraft:sand');
      setW(X2, Y + 1, Z2, 'minecraft:air');
    }
  }
  // stone lantern
  setW(-571, soilY(-571), 410, 'minecraft:chiseled_stone_bricks');
  setW(-571, soilY(-571) + 1, 410, 'minecraft:lantern[hanging=false]');
}

function icehouseCellar() {
  // cold storage stub near west water, outside house
  const x0 = -612,
    x1 = -606,
    z0 = 400,
    z1 = 406;
  const floorY = 56;
  for (let X = x0; X <= x1; X++) {
    for (let Z = z0; Z <= z1; Z++) {
      if (HOUSE(X, Z) || !inSchem(X, floorY, Z)) continue;
      for (let Y = floorY; Y <= floorY + 4; Y++) {
        const edge = X === x0 || X === x1 || Z === z0 || Z === z1 || Y === floorY || Y === floorY + 4;
        if (edge) setW(X, Y, Z, 'minecraft:packed_ice');
        else setW(X, Y, Z, 'minecraft:air');
      }
    }
  }
  setW(-609, floorY + 1, 403, 'minecraft:chest[facing=south,type=single,waterlogged=false]');
  setW(-608, floorY + 1, 403, 'minecraft:chest[facing=south,type=single,waterlogged=false]');
  setW(-609, floorY + 3, 403, 'minecraft:sea_lantern');
  // hatch
  setW(-609, 63, 403, 'minecraft:iron_trapdoor[facing=north,half=top,open=false,powered=false,waterlogged=false]');
  for (let i = 0; i < 6; i++) {
    setW(-609, 62 - i, 403, 'minecraft:ladder[facing=south,waterlogged=false]');
  }
}

function lanternFestival() {
  // decorative tall posts at garden room corners
  const posts = [
    [-586, 374],
    [-572, 374],
    [-558, 374],
    [-544, 374],
    [-586, 470],
    [-572, 470],
    [-558, 470],
    [-544, 470],
    [-548, 434],
    [-560, 420],
    [-579, 389],
  ];
  for (const [X, Z] of posts) {
    if (HOUSE(X, Z) || SOLAR(X, Z) || !inSchem(X, soilY(X), Z)) continue;
    if (isStationCell(X, Z)) continue;
    const Y = soilY(X);
    if (getW(X, Y + 1, Z).startsWith(STATION)) continue;
    clearSoft(X, Y, Z, 5);
    setW(X, Y, Z, 'minecraft:grass_block');
    setW(X, Y + 1, Z, 'minecraft:spruce_fence');
    setW(X, Y + 2, Z, 'minecraft:spruce_fence');
    setW(X, Y + 3, Z, 'minecraft:spruce_fence');
    setW(X, Y + 4, Z, 'minecraft:lantern[hanging=false]');
  }
}

function chapelRuin() {
  // romantic ruin NE inside wall
  const x0 = -536,
    x1 = -530,
    z0 = 464,
    z1 = 470;
  const Y = soilY(x0);
  for (let X = x0; X <= x1; X++) {
    for (let Z = z0; Z <= z1; Z++) {
      if (SOLAR(X, Z) || isStationCell(X, Z) || !inSchem(X, Y, Z)) continue;
      clearSoft(X, Y, Z, 6);
      const edge = X === x0 || X === x1 || Z === z0 || Z === z1;
      const broken = hash(X, Z) % 5 === 0;
      setW(X, Y, Z, 'minecraft:stone_bricks');
      if (edge && !broken) {
        for (let y = Y + 1; y <= Y + 3; y++) {
          if (hash(X + y, Z) % 4 === 0) setW(X, y, Z, 'minecraft:air');
          else setW(X, y, Z, brickMix(X, y, Z));
        }
      } else if (!edge) {
        placeGrass(X, Y, Z, true);
      }
    }
  }
  // altar stub
  setW(-533, Y + 1, 467, 'minecraft:chiseled_stone_bricks');
  setW(-533, Y + 2, 467, 'minecraft:lantern[hanging=false]');
  setW(-533, Y + 1, 466, 'minecraft:spruce_stairs[facing=south,half=bottom]');
}

function cropColorBreaks() {
  // extra grass/flower ribbons through east wheat without eating stations
  for (let X = -546; X <= -530; X++) {
    const Y = soilY(X);
    for (let Z = WALL_Z1 + 6; Z <= WALL_Z2 - 6; Z++) {
      if (isStationCell(X, Z) || HOUSE(X, Z) || SOLAR(X, Z)) continue;
      if (Z >= 418 && Z <= 423) continue;
      if (getW(X, Y + 1, Z).startsWith(STATION)) continue;
      if (!isCropish(getW(X, Y, Z)) && !isCropish(getW(X, Y + 1, Z))) continue;
      // diagonal ribbon
      if ((X + Z * 2) % 11 !== 0 && (X * 3 + Z) % 13 !== 0) continue;
      placeGrass(X, Y, Z, true);
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
    lanterns,
  };
}

console.log('pass14…');
expandGreenhouse();
fountainJetUpgrade();
wallWalkParapet();
steppingStoneGarden();
icehouseCellar();
lanternFestival();
chapelRuin();
cropColorBreaks();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
