/**
 * Pass 20 — expand schem +3H for spires, conservatory glass dome,
 * folly ruin tower, hot-spring pool, lavender fields, cable bridge
 * to solar hill, music pavilion. Mapping stays +634/-44/-348 (height only).
 */
import { parseToGrid } from './node_modules/craftmatic/dist/schem/parse.js';
import { writeSchematic } from './node_modules/craftmatic/dist/schem/write.js';
import { BlockGrid } from './node_modules/craftmatic/dist/schem/types.js';

const SCHEM = new URL('../krutz-solar-house.schem', import.meta.url).pathname;
const old = await parseToGrid(SCHEM);
const EXTRA_H = 3;
const grid = new BlockGrid(old.width, old.height + EXTRA_H, old.length);
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
  'minecraft:allium',
  'minecraft:cornflower',
  'minecraft:lilac',
  'minecraft:azure_bluet',
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
  /grass_block|dirt$|stone$|granite|diorite|andesite|gravel|sand$|cobblestone$|farmland|coarse_dirt|moss_block|path/.test(
    n,
  );
const isSoft = (n) =>
  /short_grass|tall_grass|dandelion|poppy|allium|cornflower|oxeye|lily_of|azure|azalea|bush|leaf_litter|firefly|fern|wheat|carrot|potato|beet|petal|tulip|orchid|lilac|vine/.test(
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
  else if (r < 60) {
    const f = FLOWERS[hash(X, Z) % FLOWERS.length];
    setW(X, Y + 1, Z, f);
    if (f === 'minecraft:lilac') setW(X, Y + 2, Z, 'minecraft:lilac');
  }
}

function conservatoryDome() {
  // glass dome north of pavilion greenhouse
  const CX = -534,
    CZ = 402;
  const Y = 70;
  for (let dx = -4; dx <= 4; dx++) {
    for (let dz = -4; dz <= 4; dz++) {
      const X = CX + dx,
        Z = CZ + dz;
      if (isStationCell(X, Z) || !inSchem(X, Y, Z)) continue;
      const d = Math.hypot(dx, dz);
      if (d > 4.2) continue;
      clearSoft(X, Y, Z, 8);
      setW(X, Y, Z, 'minecraft:polished_andesite');
      const h = Math.max(1, Math.round(4 - d * 0.7));
      for (let y = Y + 1; y <= Y + h; y++) {
        const edge = d > 3.2 || y === Y + h;
        setW(X, y, Z, edge ? 'minecraft:glass' : 'minecraft:air');
      }
      if (d < 2.5 && hash(X, Z) % 3 === 0) {
        setW(X, Y + 1, Z, 'minecraft:potted_bamboo');
      }
    }
  }
  setW(CX, Y + 1, CZ, 'minecraft:water');
  setW(CX, Y, CZ, 'minecraft:sea_lantern');
  setW(CX, Y + 5, CZ, 'minecraft:lantern[hanging=false]');
}

function follyTower() {
  // romantic folly NW outside wall
  const CX = -598,
    CZ = 360;
  const base = 60;
  if (!inSchem(CX, base, CZ)) return;
  for (let dx = 0; dx <= 3; dx++) {
    for (let dz = 0; dz <= 3; dz++) {
      const X = CX + dx,
        Z = CZ + dz;
      if (HOUSE(X, Z) || !inSchem(X, base, Z)) continue;
      const edge = dx === 0 || dx === 3 || dz === 0 || dz === 3;
      for (let Y = base; Y <= base + 14; Y++) {
        if (Y < base + 12) {
          if (edge) {
            // ruined gaps
            if (hash(X + Y, Z) % 7 === 0 && Y > base + 4) setW(X, Y, Z, 'minecraft:air');
            else setW(X, Y, Z, brickMix(X, Y, Z));
          } else setW(X, Y, Z, 'minecraft:air');
        } else if (Y === base + 12 && edge) setW(X, Y, Z, 'minecraft:stone_brick_stairs[facing=north,half=bottom]');
      }
      if (edge && hash(X, Z) % 2 === 0) setW(X, base + 13, Z, 'minecraft:stone_brick_wall');
    }
  }
  for (let Y = base + 1; Y <= base + 11; Y++) {
    setW(CX + 1, Y, CZ + 1, 'minecraft:vine[north=true]');
    setW(CX + 2, Y, CZ + 2, 'minecraft:ladder[facing=north,waterlogged=false]');
  }
  setW(CX + 2, base + 14, CZ + 2, 'minecraft:lantern[hanging=false]');
  // ivy carpet around
  for (let X = CX - 1; X <= CX + 4; X++) {
    for (let Z = CZ - 1; Z <= CZ + 4; Z++) {
      if (HOUSE(X, Z) || !inSchem(X, base - 1, Z)) continue;
      if (getW(X, base - 1, Z) === 'minecraft:air') setW(X, base - 1, Z, 'minecraft:dirt');
      if (isTerrain(getW(X, base, Z)) || getW(X, base, Z) === 'minecraft:air') {
        placeGrass(X, base, Z, true);
      }
    }
  }
}

function hotSpring() {
  const CX = -608,
    CZ = 440;
  const Y = 62;
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      const X = CX + dx,
        Z = CZ + dz;
      if (HOUSE(X, Z) || !inSchem(X, Y, Z)) continue;
      const d = Math.hypot(dx, dz);
      if (d > 3.3) continue;
      clearSoft(X, Y, Z, 4);
      if (d <= 2) {
        setW(X, Y - 1, Z, 'minecraft:magma_block');
        setW(X, Y, Z, 'minecraft:water');
        if (hash(X, Z) % 5 === 0) setW(X, Y + 1, Z, 'minecraft:bubble_column[drag=false]');
      } else {
        setW(X, Y, Z, 'minecraft:stone');
        if (hash(X, Z) % 3 === 0) setW(X, Y + 1, Z, 'minecraft:fern');
      }
    }
  }
  setW(CX, Y + 1, CZ - 3, 'minecraft:campfire[facing=north,lit=true,signal_fire=false,waterlogged=false]');
  setW(CX + 3, Y + 1, CZ, 'minecraft:lantern[hanging=false]');
}

function lavenderFields() {
  for (let X = -556; X <= -542; X++) {
    for (let Z = 388; Z <= 398; Z++) {
      if (isStationCell(X, Z) || HOUSE(X, Z) || !inSchem(X, soilY(X), Z)) continue;
      if (getW(X, soilY(X) + 1, Z).startsWith(STATION)) continue;
      const Y = soilY(X);
      // don't wipe existing structures
      if (/brick|plank|glass|log|panel|battery/.test(getW(X, Y + 1, Z))) continue;
      placeGrass(X, Y, Z, false);
      const r = hash(X, Z) % 100;
      if (r < 55) setW(X, Y + 1, Z, 'minecraft:allium');
      else if (r < 75) setW(X, Y + 1, Z, 'minecraft:lilac');
      if (getW(X, Y + 1, Z) === 'minecraft:lilac') setW(X, Y + 2, Z, 'minecraft:lilac');
      else if (r < 85) setW(X, Y + 1, Z, 'minecraft:cornflower');
    }
  }
}

function cableBridgeToSolar() {
  // rope/wood bridge from east gate toward solar service path
  for (let i = 0; i <= 12; i++) {
    const X = -526 + i;
    const Z = 455;
    if (!inSchem(X, 70, Z)) continue;
    const Y = Math.max(68, 71 - Math.floor(i * 0.15));
    setSolar(X, Y, Z, 'minecraft:oak_slab[type=bottom]');
    setSolar(X, Y - 1, Z, 'minecraft:oak_fence');
    if (i % 3 === 0) {
      setSolar(X, Y + 1, Z + 1, 'minecraft:oak_fence');
      setSolar(X, Y + 1, Z - 1, 'minecraft:oak_fence');
      setSolar(X, Y + 2, Z + 1, 'minecraft:lantern[hanging=false]');
    }
  }
}

function musicPavilion() {
  // open bandstand near reflecting pool
  const CX = -552,
    CZ = 428;
  const Y = soilY(CX);
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      const X = CX + dx,
        Z = CZ + dz;
      if (isStationCell(X, Z) || !inSchem(X, Y, Z)) continue;
      const d = Math.max(Math.abs(dx), Math.abs(dz));
      clearSoft(X, Y, Z, 6);
      if (d === 3) {
        // posts at corners only
        if (Math.abs(dx) === 3 && Math.abs(dz) === 3) {
          setW(X, Y, Z, 'minecraft:spruce_planks');
          for (let y = Y + 1; y <= Y + 3; y++) setW(X, y, Z, 'minecraft:spruce_log[axis=y]');
        } else {
          setW(X, Y, Z, 'minecraft:spruce_stairs[facing=north,half=bottom]');
        }
      } else {
        setW(X, Y, Z, 'minecraft:spruce_planks');
        setW(X, Y + 1, Z, 'minecraft:air');
      }
      // roof
      if (d <= 3) {
        const roofY = Y + 4 + (d === 0 ? 1 : 0);
        setW(X, Y + 4, Z, d === 0 ? 'minecraft:spruce_planks' : 'minecraft:spruce_slab[type=bottom]');
        if (d === 0) setW(X, roofY, Z, 'minecraft:lantern[hanging=false]');
      }
    }
  }
  setW(CX, Y + 1, CZ, 'minecraft:note_block[instrument=harp,note=0,powered=false]');
  setW(CX + 1, Y + 1, CZ, 'minecraft:jukebox');
  setW(CX - 1, Y + 1, CZ, 'minecraft:spruce_stairs[facing=east,half=bottom]');
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
            if (/wheat|carrot|potato|beet|grass|flower|poppy|allium|lilac/.test(a))
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

console.log('pass20…');
conservatoryDome();
follyTower();
hotSpring();
lavenderFields();
cableBridgeToSolar();
musicPavilion();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
