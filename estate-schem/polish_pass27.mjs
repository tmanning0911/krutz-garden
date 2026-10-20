/**
 * Pass 27 — glasshouse palm court, cartographer loft, iris rill,
 * bee hotel wall, bone-farm chimney polish, SE scrapyard art,
 * night wall cressets, crop path checkerboard. Mapping +634/-44/-348.
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
  'minecraft:blue_orchid',
  'minecraft:cornflower',
  'minecraft:azure_bluet',
  'minecraft:allium',
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
  /grass_block|dirt$|stone$|granite|diorite|andesite|gravel|sand$|cobblestone$|farmland|coarse_dirt|moss_block|path|podzol/.test(
    n,
  );
const isSoft = (n) =>
  /short_grass|tall_grass|dandelion|poppy|allium|cornflower|oxeye|lily_of|azure|azalea|bush|leaf_litter|firefly|fern|wheat|carrot|potato|beet|petal|tulip|orchid|lilac|vine|mushroom|candle|sapling/.test(
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
    if (/fence|door|gate|wall|pane|plank|log|stair|slab|brick|lantern|glass|panel|battery|sign|banner|ladder/.test(n))
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

function palmCourt() {
  // indoor palm stubs in conservatory area
  for (const [X, Z] of [
    [-536, 400],
    [-532, 400],
    [-534, 404],
  ]) {
    if (isStationCell(X, Z) || !inSchem(X, 70, Z)) continue;
    setW(X, 70, Z, 'minecraft:podzol');
    setW(X, 71, Z, 'minecraft:jungle_log[axis=y]');
    setW(X, 72, Z, 'minecraft:jungle_log[axis=y]');
    for (const [dx, dy, dz] of [
      [0, 3, 0],
      [1, 3, 0],
      [-1, 3, 0],
      [0, 3, 1],
      [0, 3, -1],
      [0, 4, 0],
    ]) {
      setW(X + dx, 70 + dy, Z + dz, 'minecraft:jungle_leaves[distance=1,persistent=true]');
    }
  }
}

function cartographerLoft() {
  // loft over visitor pavilion
  const Y = 70;
  for (let X = -535; X <= -531; X++) {
    for (let Z = 409; Z <= 414; Z++) {
      if (isStationCell(X, Z) || !inSchem(X, Y + 5, Z)) continue;
      setW(X, Y + 5, Z, 'minecraft:spruce_slab[type=bottom]');
    }
  }
  setW(-533, Y + 6, 411, 'minecraft:cartography_table');
  setW(-532, Y + 6, 411, 'minecraft:bookshelf');
  setW(-534, Y + 6, 412, 'minecraft:lantern[hanging=false]');
  setW(-533, Y + 6, 413, 'minecraft:oak_stairs[facing=north,half=bottom]');
}

function irisRill() {
  // tiny water rill with iris from fountain toward reflecting pool
  for (let i = 0; i <= 10; i++) {
    const X = -558 + Math.floor(i * 0.9);
    const Z = 422 + Math.floor(i * 0.9);
    if (isStationCell(X, Z) || !inSchem(X, soilY(X), Z)) continue;
    if (Z >= 418 && Z <= 421 && i < 3) continue;
    const Y = soilY(X);
    clearSoft(X, Y, Z, 2);
    setW(X, Y - 1, Z, 'minecraft:stone_bricks');
    setW(X, Y, Z, 'minecraft:water');
    if (hash(X, Z) % 2 === 0) {
      placeGrass(X + 1, Y, Z, false);
      setW(X + 1, Y + 1, Z, 'minecraft:blue_orchid');
    }
  }
}

function beeHotelWall() {
  // stacked log bee hotels near apiary
  for (let X = -558; X <= -554; X++) {
    const Z = 452;
    if (isStationCell(X, Z) || !inSchem(X, soilY(X), Z)) continue;
    const Y = soilY(X);
    clearSoft(X, Y, Z, 4);
    setW(X, Y, Z, 'minecraft:grass_block');
    setW(X, Y + 1, Z, 'minecraft:oak_log[axis=z]');
    setW(X, Y + 2, Z, 'minecraft:oak_log[axis=z]');
    setW(X, Y + 3, Z, 'minecraft:bee_nest[facing=south,honey_level=2]');
  }
  for (let Z = 450; Z <= 454; Z++) {
    placeGrass(-553, soilY(-553), Z, false);
    setW(-553, soilY(-553) + 1, Z, FLOWERS[hash(-553, Z) % FLOWERS.length]);
  }
}

function boneChimneyPolish() {
  // dress solar hill chimney
  for (let Y = 48; Y <= 74; Y++) {
    if (!inSchem(-520, Y, 452)) continue;
    if (Y < 70) setSolar(-520, Y, 452, 'minecraft:cobblestone');
  }
  setSolar(-520, 75, 452, 'minecraft:campfire[facing=north,lit=true,signal_fire=true,waterlogged=false]');
  setSolar(-521, 72, 452, 'minecraft:cobblestone_wall');
  setSolar(-519, 72, 452, 'minecraft:cobblestone_wall');
  setSolar(-520, 72, 451, 'minecraft:cobblestone_wall');
  setSolar(-520, 73, 451, 'minecraft:lantern[hanging=false]');
}

function scrapyardArt() {
  // playful scrap sculpture SE outside wall
  const CX = -520,
    CZ = 478;
  if (!inSchem(CX, 66, CZ)) return;
  const bits = [
    'minecraft:iron_block',
    'minecraft:copper_block',
    'minecraft:anvil[facing=north]',
    'minecraft:cauldron[level=0]',
    'minecraft:blast_furnace[facing=south,lit=false]',
  ];
  for (let i = 0; i < 8; i++) {
    const X = CX + (i % 3);
    const Z = CZ + Math.floor(i / 3);
    const Y = 66 + (i % 2);
    setW(X, Y, Z, bits[i % bits.length]);
  }
  setW(CX + 1, 68, CZ + 1, 'minecraft:lantern[hanging=false]');
  placeGrass(CX - 1, 66, CZ, true);
}

function wallCressets() {
  for (let Z = 372; Z <= 470; Z += 10) {
    for (const X of [-590, -528]) {
      if (Z >= 418 && Z <= 423 && X === -528) continue;
      const Y = soilY(X) + 4;
      if (!inSchem(X, Y, Z)) continue;
      setW(X, Y, Z, brickMix(X, Y, Z));
      setW(X, Y + 1, Z, 'minecraft:campfire[facing=east,lit=true,signal_fire=false,waterlogged=false]');
    }
  }
}

function cropCheckerboard() {
  // gentle checker of grass into east crops without eating stations
  for (let X = -546; X <= -530; X++) {
    const Y = soilY(X);
    for (let Z = 380; Z <= 460; Z++) {
      if (isStationCell(X, Z) || HOUSE(X, Z) || SOLAR(X, Z)) continue;
      if (Z >= 418 && Z <= 423) continue;
      if (getW(X, Y + 1, Z).startsWith(STATION)) continue;
      if (!isCropish(getW(X, Y, Z)) && !isCropish(getW(X, Y + 1, Z))) continue;
      if ((X + Z) % 9 !== 0) continue;
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
            if (/wheat|carrot|potato|beet|grass|flower|poppy|allium|lilac|mushroom|orchid/.test(a))
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
  };
}

console.log('pass27…');
palmCourt();
cartographerLoft();
irisRill();
beeHotelWall();
boneChimneyPolish();
scrapyardArt();
wallCressets();
cropCheckerboard();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
