/**
 * Pass 15 — west landing pier upgrade, secret tunnel house→pantry,
 * library alcove in pavilion, topiary animals, clock tower SE,
 * crop mosaic art, rain cistern, maple grove. Mapping +634/-44/-348.
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

function westLandingPier() {
  // wider pier with boat berths
  for (let X = -624; X <= -612; X++) {
    for (let Z = 414; Z <= 426; Z++) {
      if (HOUSE(X, Z) || !inSchem(X, 63, Z)) continue;
      const onDeck = (Z >= 416 && Z <= 424 && X >= -620) || (Z >= 418 && Z <= 422);
      if (!onDeck && !(X >= -624 && X <= -620 && Z >= 418 && Z <= 422)) continue;
      setW(X, 62, Z, 'minecraft:oak_log[axis=x]');
      setW(X, 63, Z, 'minecraft:oak_planks');
      setW(X, 64, Z, X % 2 === 0 && (Z === 416 || Z === 424) ? 'minecraft:oak_fence' : 'minecraft:air');
    }
  }
  for (const [X, Z] of [
    [-624, 416],
    [-624, 424],
    [-612, 416],
    [-612, 424],
  ]) {
    if (HOUSE(X, Z)) continue;
    setW(X, 64, Z, 'minecraft:oak_fence');
    setW(X, 65, Z, 'minecraft:lantern[hanging=false]');
  }
  // boat shapes (oak + chest)
  setW(-622, 63, 420, 'minecraft:oak_stairs[facing=east,half=bottom]');
  setW(-623, 63, 420, 'minecraft:chest[facing=east,type=single,waterlogged=false]');
}

function secretTunnel() {
  // buried corridor from near house front to pantry stub
  const floorY = 58;
  for (let X = -590; X <= -533; X++) {
    for (const Z of [427, 428]) {
      if (!inSchem(X, floorY, Z)) continue;
      // don't carve through house protect — start at -591 edge
      if (X <= -592) continue;
      for (let Y = floorY; Y <= floorY + 3; Y++) {
        const edge = Y === floorY || Y === floorY + 3 || Z === 427;
        if (edge) setW(X, Y, Z, 'minecraft:deepslate_bricks');
        else setW(X, Y, Z, 'minecraft:air');
      }
      if (X % 6 === 0) setW(X, floorY + 2, 428, 'minecraft:lantern[hanging=true]');
      setW(X, floorY + 1, 428, 'minecraft:air');
      setW(X, floorY + 2, 428, getW(X, floorY + 2, 428).includes('lantern') ? getW(X, floorY + 2, 428) : 'minecraft:air');
    }
  }
  // hatches both ends
  setW(-589, 64, 428, 'minecraft:spruce_trapdoor[facing=east,half=top,open=false,waterlogged=false]');
  setW(-534, 70, 428, 'minecraft:spruce_trapdoor[facing=west,half=top,open=false,waterlogged=false]');
  for (let i = 0; i < 5; i++) {
    setW(-589, 63 - i, 428, 'minecraft:ladder[facing=west,waterlogged=false]');
    setW(-534, 69 - i, 428, 'minecraft:ladder[facing=east,waterlogged=false]');
  }
}

function libraryAlcove() {
  const Y = 70;
  for (let Z = 409; Z <= 414; Z++) {
    setW(-535, Y + 1, Z, 'minecraft:bookshelf');
    setW(-535, Y + 2, Z, 'minecraft:bookshelf');
  }
  setW(-534, Y + 1, 410, 'minecraft:lectern[facing=east,has_book=true,powered=false]');
  setW(-534, Y + 1, 413, 'minecraft:enchanting_table');
  setW(-533, Y + 3, 412, 'minecraft:lantern[hanging=true]');
}

function topiaryAnimals() {
  // simple hedgehog / bird shapes from leaves near rose garden
  const shapes = [
    // hedgehog body at -562,388
    ...[-562, -561, -560].flatMap((X) =>
      [387, 388, 389].map((Z) => [X, Z, 1]),
    ),
    [-561, 388, 2],
    [-560, 388, 2],
    // bird at -566,380
    [-566, 380, 1],
    [-566, 380, 2],
    [-565, 380, 2],
    [-567, 380, 2],
    [-566, 379, 3],
  ];
  for (const [X, Z, h] of shapes) {
    if (isStationCell(X, Z) || !inSchem(X, soilY(X), Z)) continue;
    const Y = soilY(X);
    placeGrass(X, Y, Z, false);
    for (let dy = 1; dy <= h; dy++) {
      setW(X, Y + dy, Z, 'minecraft:oak_leaves[distance=1,persistent=true]');
    }
  }
}

function clockTower() {
  // SE near gate approach outside wall a bit
  const CX = -524,
    CZ = 420;
  if (SOLAR(CX, CZ)) return;
  const base = 70;
  for (let dx = 0; dx <= 2; dx++) {
    for (let dz = 0; dz <= 2; dz++) {
      const X = CX + dx,
        Z = CZ + dz;
      if (!inSchem(X, base, Z) || SOLAR(X, Z)) continue;
      const edge = dx === 0 || dx === 2 || dz === 0 || dz === 2;
      for (let Y = base; Y <= base + 12; Y++) {
        if (Y < base + 10) {
          if (edge) setW(X, Y, Z, brickMix(X, Y, Z));
          else setW(X, Y, Z, 'minecraft:air');
        } else if (Y === base + 10) setW(X, Y, Z, 'minecraft:stone_brick_slab[type=bottom]');
      }
      if (edge) setW(X, base + 11, Z, 'minecraft:stone_brick_wall');
    }
  }
  // clock faces
  setW(CX + 1, base + 7, CZ, 'minecraft:glowstone');
  setW(CX + 1, base + 7, CZ + 2, 'minecraft:glowstone');
  setW(CX, base + 7, CZ + 1, 'minecraft:glowstone');
  setW(CX + 2, base + 7, CZ + 1, 'minecraft:glowstone');
  setW(CX + 1, base + 12, CZ + 1, 'minecraft:lantern[hanging=false]');
  for (let Y = base + 1; Y <= base + 9; Y++) {
    setW(CX + 1, Y, CZ + 1, 'minecraft:ladder[facing=south,waterlogged=false]');
  }
}

function cropMosaic() {
  // small crop art heart/diamond near center beds using grass breaks — avoid stations
  const CX = -552,
    CZ = 444;
  const Y = soilY(CX);
  const pattern = [
    '  ##  ##  ',
    ' ######## ',
    '##########',
    ' ######## ',
    '  ######  ',
    '   ####   ',
    '    ##    ',
  ];
  for (let row = 0; row < pattern.length; row++) {
    for (let col = 0; col < pattern[row].length; col++) {
      const X = CX + col - 5,
        Z = CZ + row - 3;
      if (isStationCell(X, Z) || HOUSE(X, Z) || SOLAR(X, Z) || !inSchem(X, Y, Z)) continue;
      if (getW(X, Y + 1, Z).startsWith(STATION)) continue;
      clearSoft(X, Y, Z, 2);
      if (pattern[row][col] === '#') {
        setW(X, Y, Z, 'minecraft:farmland[moisture=7]');
        setW(X, Y + 1, Z, 'minecraft:poppy');
      } else {
        placeGrass(X, Y, Z, false);
        setW(X, Y + 1, Z, 'minecraft:short_grass');
      }
    }
  }
}

function rainCistern() {
  const CX = -576,
    CZ = 430;
  const Y = 64;
  for (let X = CX - 2; X <= CX + 2; X++) {
    for (let Z = CZ - 2; Z <= CZ + 2; Z++) {
      if (isStationCell(X, Z) || HOUSE(X, Z) || !inSchem(X, Y, Z)) continue;
      clearSoft(X, Y, Z, 4);
      const edge = Math.abs(X - CX) === 2 || Math.abs(Z - CZ) === 2;
      if (edge) {
        setW(X, Y, Z, brickMix(X, Y, Z));
        setW(X, Y + 1, Z, brickMix(X, Y + 1, Z));
      } else {
        setW(X, Y, Z, 'minecraft:water');
        setW(X, Y - 1, Z, 'minecraft:stone_bricks');
      }
    }
  }
  setW(CX, Y + 2, CZ, 'minecraft:iron_bars');
  setW(CX, Y + 3, CZ, 'minecraft:cauldron[level=3]');
  setW(CX + 2, Y + 2, CZ, 'minecraft:lantern[hanging=false]');
}

function mapleGrove() {
  for (let X = -588; X <= -576; X += 3) {
    for (let Z = 456; Z <= 466; Z += 3) {
      if (isStationCell(X, Z) || HOUSE(X, Z) || !inSchem(X, 64, Z)) continue;
      if (getW(X, 65, Z).startsWith(STATION)) continue;
      const Y = soilY(X);
      placeGrass(X, Y, Z, false);
      setW(X, Y + 1, Z, 'minecraft:stripped_oak_log[axis=y]');
      setW(X, Y + 2, Z, 'minecraft:stripped_oak_log[axis=y]');
      for (const [dx, dy, dz] of [
        [0, 3, 0],
        [1, 3, 0],
        [-1, 3, 0],
        [0, 3, 1],
        [0, 3, -1],
        [0, 4, 0],
        [1, 2, 1],
        [-1, 2, -1],
      ]) {
        setW(X + dx, Y + dy, Z + dz, 'minecraft:oak_leaves[distance=1,persistent=true]');
      }
      // autumn litter
      if (hash(X, Z) % 100 < 70) setW(X + 1, Y + 1, Z, 'minecraft:leaf_litter');
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
  };
}

console.log('pass15…');
westLandingPier();
secretTunnel();
libraryAlcove();
topiaryAnimals();
clockTower();
cropMosaic();
rainCistern();
mapleGrove();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
