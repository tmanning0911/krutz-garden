/**
 * Pass 26 — expand +4 east for orchard nursery, candle labyrinth,
 * boat house loft, herb drying loft, redstone-free lighthouse on SE,
 * fairy-ring mushrooms, path mosaic at fountain. Mapping update if expand.
 */
import { parseToGrid } from './node_modules/craftmatic/dist/schem/parse.js';
import { writeSchematic } from './node_modules/craftmatic/dist/schem/write.js';
import { BlockGrid } from './node_modules/craftmatic/dist/schem/types.js';

const SCHEM = new URL('../krutz-solar-house.schem', import.meta.url).pathname;
const old = await parseToGrid(SCHEM);
const DX = 0; // keep X origin; expand east by appending width
const EXTRA_W = 6;
const grid = new BlockGrid(old.width + EXTRA_W, old.height, old.length);
for (let y = 0; y < old.height; y++) {
  for (let z = 0; z < old.length; z++) {
    for (let x = 0; x < old.width; x++) {
      grid.set(x, y, z, old.get(x, y, z));
    }
  }
}
for (const be of old.blockEntities) {
  grid.blockEntities.push({ ...be, pos: [...be.pos] });
}

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
  /grass_block|dirt$|stone$|granite|diorite|andesite|gravel|sand$|cobblestone$|farmland|coarse_dirt|moss_block|path/.test(
    n,
  );
const isSoft = (n) =>
  /short_grass|tall_grass|dandelion|poppy|allium|cornflower|oxeye|lily_of|azure|azalea|bush|leaf_litter|firefly|fern|wheat|carrot|potato|beet|petal|tulip|orchid|lilac|vine|mushroom/.test(
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

function fillEastMargin() {
  // grade new east columns into solar/approach
  for (let X = -512; X <= -508; X++) {
    for (let Z = 348; Z <= 490; Z++) {
      if (!inSchem(X, 64, Z) || HOUSE(X, Z)) continue;
      const dist = X + 528; // from east wall
      let target = Math.max(64, 70 - Math.floor(Math.max(0, dist) * 0.4));
      if (SOLAR(X, Z)) target = Math.max(target, 70);
      for (let y = ORIGIN_Y + 1; y < target; y++) {
        if (getW(X, y, Z) === 'minecraft:air') setW(X, y, Z, 'minecraft:dirt');
      }
      if (!SOLAR(X, Z)) placeGrass(X, target, Z, true);
    }
  }
}

function orchardNursery() {
  // sapling beds in new east margin south of solar
  for (let X = -512; X <= -508; X++) {
    for (let Z = 430; Z <= 444; Z++) {
      if (SOLAR(X, Z) || !inSchem(X, 68, Z)) continue;
      const Y = 68;
      clearSoft(X, Y, Z, 4);
      if ((X + Z) % 2 === 0) {
        setW(X, Y, Z, 'minecraft:podzol');
        setW(X, Y + 1, Z, hash(X, Z) % 2 ? 'minecraft:oak_sapling' : 'minecraft:cherry_sapling');
      } else {
        placeGrass(X, Y, Z, true);
      }
    }
  }
  // nursery shed
  for (let X = -512; X <= -509; X++) {
    for (let Z = 426; Z <= 429; Z++) {
      if (!inSchem(X, 68, Z)) continue;
      const edge = X === -512 || X === -509 || Z === 426 || Z === 429;
      setW(X, 68, Z, 'minecraft:cobblestone');
      for (let y = 69; y <= 71; y++) setW(X, y, Z, edge ? 'minecraft:spruce_planks' : 'minecraft:air');
      setW(X, 72, Z, 'minecraft:spruce_slab[type=bottom]');
    }
  }
  setW(-510, 69, 427, 'minecraft:composter[level=5]');
  setW(-511, 69, 427, 'minecraft:barrel[facing=up,open=false]');
  setW(-510, 71, 427, 'minecraft:lantern[hanging=true]');
}

function candleLabyrinth() {
  // small candle spiral near meditation pavilion
  const CX = -584,
    CZ = 380;
  const Y = 64;
  for (let t = 0; t < 48; t++) {
    const ang = t * 0.45;
    const r = 0.4 + t * 0.08;
    const X = Math.round(CX + Math.cos(ang) * r);
    const Z = Math.round(CZ + Math.sin(ang) * r);
    if (isStationCell(X, Z) || HOUSE(X, Z) || !inSchem(X, Y, Z)) continue;
    clearSoft(X, Y, Z, 2);
    setW(X, Y, Z, 'minecraft:gravel');
    if (t % 3 === 0) {
      setW(X, Y + 1, Z, 'minecraft:candle[candles=1,lit=true,waterlogged=false]');
    } else setW(X, Y + 1, Z, 'minecraft:air');
  }
  setW(CX, Y, CZ, 'minecraft:chiseled_stone_bricks');
  setW(CX, Y + 1, CZ, 'minecraft:lantern[hanging=false]');
}

function boatHouseLoft() {
  // loft over west pier
  for (let X = -622; X <= -616; X++) {
    for (let Z = 416; Z <= 422; Z++) {
      if (HOUSE(X, Z) || !inSchem(X, 64, Z)) continue;
      setW(X, 64, Z, 'minecraft:oak_planks');
      const edge = X === -622 || X === -616 || Z === 416 || Z === 422;
      if (edge) {
        setW(X, 65, Z, 'minecraft:oak_fence');
        setW(X, 66, Z, 'minecraft:oak_fence');
      } else {
        setW(X, 65, Z, 'minecraft:air');
        setW(X, 66, Z, 'minecraft:air');
      }
      setW(X, 67, Z, edge ? 'minecraft:oak_slab[type=bottom]' : 'minecraft:oak_planks');
    }
  }
  setW(-619, 65, 419, 'minecraft:chest[facing=south,type=single,waterlogged=false]');
  setW(-618, 65, 419, 'minecraft:crafting_table');
  setW(-619, 66, 419, 'minecraft:lantern[hanging=false]');
}

function herbDryingLoft() {
  // racks near herb spiral / kitchen
  for (let X = -586; X <= -582; X++) {
    const Z = 408;
    if (HOUSE(X, Z) || isStationCell(X, Z) || !inSchem(X, 64, Z)) continue;
    clearSoft(X, 64, Z, 4);
    setW(X, 64, Z, 'minecraft:grass_block');
    setW(X, 65, Z, 'minecraft:oak_fence');
    setW(X, 66, Z, 'minecraft:oak_fence');
    setW(X, 67, Z, 'minecraft:oak_slab[type=bottom]');
    setW(X, 66, Z + 1, 'minecraft:vine[north=true]');
  }
  setW(-584, 65, 407, 'minecraft:flower_pot');
  setW(-584, 66, 408, 'minecraft:lantern[hanging=true]');
}

function seLighthouse() {
  const CX = -514,
    CZ = 474;
  if (!inSchem(CX, 68, CZ)) return;
  for (let dx = 0; dx <= 2; dx++) {
    for (let dz = 0; dz <= 2; dz++) {
      const X = CX + dx,
        Z = CZ + dz;
      if (!inSchem(X, 68, Z)) continue;
      const edge = dx === 0 || dx === 2 || dz === 0 || dz === 2;
      for (let Y = 68; Y <= 82; Y++) {
        if (Y < 80) {
          if (edge) setSolar(X, Y, Z, brickMix(X, Y, Z));
          else setSolar(X, Y, Z, 'minecraft:air');
        } else if (Y === 80) setSolar(X, Y, Z, 'minecraft:stone_brick_slab[type=bottom]');
      }
    }
  }
  setSolar(CX + 1, 81, CZ + 1, 'minecraft:sea_lantern');
  setSolar(CX + 1, 82, CZ + 1, 'minecraft:lantern[hanging=false]');
  setSolar(CX + 1, 83, CZ + 1, 'minecraft:end_rod[facing=up]');
  for (let Y = 69; Y <= 79; Y++) {
    setSolar(CX + 1, Y, CZ + 1, 'minecraft:ladder[facing=south,waterlogged=false]');
  }
}

function fairyRings() {
  for (const [CX, CZ] of [
    [-578, 450],
    [-560, 390],
    [-548, 450],
  ]) {
    const Y = soilY(CX);
    for (let t = 0; t < 12; t++) {
      const ang = (t / 12) * Math.PI * 2;
      const X = Math.round(CX + Math.cos(ang) * 2.5);
      const Z = Math.round(CZ + Math.sin(ang) * 2.5);
      if (isStationCell(X, Z) || HOUSE(X, Z) || SOLAR(X, Z) || !inSchem(X, Y, Z)) continue;
      if (getW(X, Y + 1, Z).startsWith(STATION)) continue;
      placeGrass(X, Y, Z, false);
      setW(X, Y + 1, Z, hash(X, Z) % 2 ? 'minecraft:brown_mushroom' : 'minecraft:red_mushroom');
    }
    if (!isStationCell(CX, CZ) && inSchem(CX, Y, CZ)) {
      placeGrass(CX, Y, CZ, false);
      setW(CX, Y + 1, CZ, 'minecraft:lantern[hanging=false]');
    }
  }
}

function fountainMosaic() {
  const CX = -560,
    CZ = 420;
  const Y = soilY(CX);
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      if (Math.abs(dx) <= 1 && Math.abs(dz) <= 1) continue; // keep basin
      const X = CX + dx,
        Z = CZ + dz;
      if (isStationCell(X, Z) || !inSchem(X, Y, Z)) continue;
      const d = Math.max(Math.abs(dx), Math.abs(dz));
      if (d === 2) {
        setW(X, Y, Z, (dx + dz) % 2 === 0 ? 'minecraft:polished_andesite' : 'minecraft:smooth_stone');
        clearSoft(X, Y, Z, 2);
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
            if (/wheat|carrot|potato|beet|grass|flower|poppy|allium|lilac|mushroom/.test(a))
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
    mapping: `localX=wx+${ORIGIN_X}, localY=wy-${ORIGIN_Y}, localZ=wz-${ORIGIN_Z}`,
    stations: stations.length,
    lattice: stations.filter(([x, , z]) => LATTICE_X.includes(wx(x)) && LATTICE_Z.includes(wz(z))).length,
    trapOk,
    farm,
    uncovered,
    panels,
  };
}

console.log('pass26…');
fillEastMargin();
orchardNursery();
candleLabyrinth();
boatHouseLoft();
herbDryingLoft();
seLighthouse();
fairyRings();
fountainMosaic();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
