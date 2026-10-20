/**
 * Pass 19 — knot garden, water mill on west channel, aviary dome,
 * statue court, wine-cellar cutaway, secret tunnel repair, bath house,
 * taller gatehouse. Mapping: +634/-44/-348.
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
  'minecraft:blue_orchid',
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
  else if (r < 58) setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
}

function knotGarden() {
  // Celtic-ish knot of hedges + gravel paths south of sundial
  const CX = -562,
    CZ = 408;
  const Y = soilY(CX);
  for (let dx = -5; dx <= 5; dx++) {
    for (let dz = -5; dz <= 5; dz++) {
      const X = CX + dx,
        Z = CZ + dz;
      if (HOUSE(X, Z) || isStationCell(X, Z) || !inSchem(X, Y, Z)) continue;
      if (Z >= 418 && Z <= 423) continue;
      if (getW(X, Y + 1, Z).startsWith(STATION)) continue;
      clearSoft(X, Y, Z, 3);
      const ax = Math.abs(dx),
        az = Math.abs(dz);
      const ring = ax === 5 || az === 5 || (ax === 3 && az <= 3) || (az === 3 && ax <= 3);
      const cross = dx === 0 || dz === 0;
      if (ring && !cross) {
        setW(X, Y, Z, 'minecraft:grass_block');
        setW(X, Y + 1, Z, hash(X, Z) % 2 ? 'minecraft:azalea' : 'minecraft:flowering_azalea');
      } else if (cross || (ax <= 1 && az <= 1)) {
        setW(X, Y, Z, 'minecraft:gravel');
        setW(X, Y + 1, Z, 'minecraft:air');
      } else {
        placeGrass(X, Y, Z, false);
        setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
      }
    }
  }
  setW(CX, Y, CZ, 'minecraft:chiseled_stone_bricks');
  setW(CX, Y + 1, CZ, 'minecraft:flower_pot');
  setW(CX, Y + 2, CZ, 'minecraft:lantern[hanging=false]');
}

function waterMill() {
  // wheel + mill house on west water south of dock
  const OX = -618,
    OZ = 404;
  if (!inSchem(OX, 63, OZ) || HOUSE(OX, OZ)) return;
  // mill house
  for (let X = -616; X <= -612; X++) {
    for (let Z = 400; Z <= 405; Z++) {
      if (HOUSE(X, Z) || !inSchem(X, 63, Z)) continue;
      const edge = X === -616 || X === -612 || Z === 400 || Z === 405;
      setW(X, 62, Z, 'minecraft:cobblestone');
      setW(X, 63, Z, 'minecraft:cobblestone');
      for (let y = 64; y <= 66; y++) {
        if (edge) setW(X, y, Z, y === 65 && Z !== 400 ? 'minecraft:glass_pane' : 'minecraft:spruce_planks');
        else setW(X, y, Z, 'minecraft:air');
      }
      setW(X, 67, Z, 'minecraft:spruce_stairs[facing=north,half=bottom]');
    }
  }
  setW(-614, 64, 405, 'minecraft:air');
  setW(-614, 65, 405, 'minecraft:air');
  setW(-614, 64, 403, 'minecraft:crafting_table');
  setW(-613, 64, 403, 'minecraft:barrel[facing=up,open=false]');
  setW(-614, 66, 402, 'minecraft:lantern[hanging=true]');
  // water wheel (vertical ring of stairs/slabs)
  for (let t = 0; t < 8; t++) {
    const ang = (t / 8) * Math.PI * 2;
    const dy = Math.round(Math.sin(ang) * 2);
    const dz = Math.round(Math.cos(ang) * 2);
    setW(-618, 64 + dy, 403 + dz, 'minecraft:oak_stairs[facing=east,half=bottom]');
  }
  setW(-618, 64, 403, 'minecraft:oak_log[axis=z]');
  setW(-619, 63, 403, 'minecraft:water');
  setW(-619, 62, 403, 'minecraft:water');
}

function aviaryDome() {
  const CX = -544,
    CZ = 440;
  const Y = soilY(CX);
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      const X = CX + dx,
        Z = CZ + dz;
      if (isStationCell(X, Z) || SOLAR(X, Z) || !inSchem(X, Y, Z)) continue;
      if (getW(X, Y + 1, Z).startsWith(STATION)) continue;
      const d = Math.hypot(dx, dz);
      clearSoft(X, Y, Z, 6);
      if (d <= 3.2) {
        setW(X, Y, Z, 'minecraft:moss_block');
        if (d > 2.4) {
          for (let y = Y + 1; y <= Y + 3; y++) setW(X, y, Z, 'minecraft:iron_bars');
          setW(X, Y + 4, Z, 'minecraft:glass');
        } else {
          setW(X, Y + 1, Z, 'minecraft:air');
          setW(X, Y + 2, Z, 'minecraft:air');
          setW(X, Y + 3, Z, 'minecraft:air');
          setW(X, Y + 4, Z, d < 1.2 ? 'minecraft:glass' : 'minecraft:glass_pane');
          if (hash(X, Z) % 4 === 0) setW(X, Y + 1, Z, 'minecraft:oak_leaves[distance=1,persistent=true]');
        }
      }
    }
  }
  setW(CX, Y + 1, CZ, 'minecraft:hay_block[axis=y]');
  setW(CX, Y + 5, CZ, 'minecraft:lantern[hanging=false]');
  // door gap south
  for (const X of [CX - 1, CX, CX + 1]) {
    setW(X, Y + 1, CZ + 3, 'minecraft:air');
    setW(X, Y + 2, CZ + 3, 'minecraft:air');
  }
}

function statueCourt() {
  const CX = -570,
    CZ = 428;
  const Y = soilY(CX);
  for (let X = CX - 3; X <= CX + 3; X++) {
    for (let Z = CZ - 3; Z <= CZ + 3; Z++) {
      if (isStationCell(X, Z) || HOUSE(X, Z) || !inSchem(X, Y, Z)) continue;
      if (Z >= 418 && Z <= 423) continue;
      clearSoft(X, Y, Z, 4);
      const edge = Math.abs(X - CX) === 3 || Math.abs(Z - CZ) === 3;
      if (edge) {
        setW(X, Y, Z, brickMix(X, Y, Z));
        if ((X + Z) % 2 === 0) setW(X, Y + 1, Z, 'minecraft:stone_brick_wall');
      } else {
        setW(X, Y, Z, 'minecraft:smooth_stone');
        setW(X, Y + 1, Z, 'minecraft:air');
      }
    }
  }
  // statue: armor stand substitute with quartz pillar + player head vibe
  setW(CX, Y + 1, CZ, 'minecraft:quartz_pillar[axis=y]');
  setW(CX, Y + 2, CZ, 'minecraft:quartz_pillar[axis=y]');
  setW(CX, Y + 3, CZ, 'minecraft:player_head[rotation=8]');
  setW(CX, Y + 2, CZ - 1, 'minecraft:quartz_stairs[facing=south,half=top]');
  setW(CX, Y + 2, CZ + 1, 'minecraft:quartz_stairs[facing=north,half=top]');
  for (const [X, Z] of [
    [CX - 2, CZ - 2],
    [CX + 2, CZ - 2],
    [CX - 2, CZ + 2],
    [CX + 2, CZ + 2],
  ]) {
    setW(X, Y + 1, Z, 'minecraft:potted_azalea_bush');
  }
}

function wineCellarCutaway() {
  const x0 = -582,
    x1 = -574,
    z0 = 362,
    z1 = 366;
  const floorY = 50;
  for (let X = x0; X <= x1; X++) {
    for (let Z = z0; Z <= z1; Z++) {
      if (!inSchem(X, floorY, Z)) continue;
      for (let Y = floorY; Y <= floorY + 5; Y++) {
        const edge = X === x0 || X === x1 || Z === z0 || Z === z1 || Y === floorY || Y === floorY + 5;
        const glass = Z === z0 && Y > floorY && Y < floorY + 5 && X > x0 && X < x1;
        if (glass) setW(X, Y, Z, 'minecraft:tinted_glass');
        else if (edge) setW(X, Y, Z, 'minecraft:spruce_planks');
        else setW(X, Y, Z, 'minecraft:air');
      }
      if (X > x0 && X < x1 && Z > z0 && Z < z1) {
        if (X % 2 === 0) {
          setW(X, floorY + 1, Z, 'minecraft:barrel[facing=south,open=false]');
          setW(X, floorY + 2, Z, 'minecraft:barrel[facing=south,open=false]');
        } else {
          setW(X, floorY + 1, Z, 'minecraft:spruce_stairs[facing=north,half=bottom]');
        }
      }
    }
  }
  setW(-578, floorY + 4, 364, 'minecraft:lantern[hanging=true]');
  setW(-578, 64, 366, 'minecraft:cobblestone');
  setW(-578, 65, 366, 'minecraft:oak_sign[rotation=0,waterlogged=false]');
}

function repairSecretTunnel() {
  const floorY = 58;
  for (let X = -590; X <= -534; X++) {
    for (const Z of [427, 428]) {
      if (!inSchem(X, floorY, Z) || X <= -592) continue;
      if (isStationCell(X, Z) && Z === 427) continue;
      for (let Y = floorY; Y <= floorY + 3; Y++) {
        const wall = Y === floorY || Y === floorY + 3 || Z === 427;
        if (wall) setW(X, Y, Z, 'minecraft:deepslate_bricks');
        else setW(X, Y, Z, 'minecraft:air');
      }
      if (X % 5 === 0) setW(X, floorY + 3, 428, 'minecraft:sea_lantern');
    }
  }
  setW(-589, 64, 428, 'minecraft:spruce_trapdoor[facing=east,half=top,open=false,waterlogged=false]');
  setW(-534, soilY(-534), 428, 'minecraft:spruce_trapdoor[facing=west,half=top,open=false,waterlogged=false]');
  for (let i = 0; i < 5; i++) {
    setW(-589, 63 - i, 428, 'minecraft:ladder[facing=west,waterlogged=false]');
    setW(-534, soilY(-534) - 1 - i, 428, 'minecraft:ladder[facing=east,waterlogged=false]');
  }
}

function bathHouse() {
  const x0 = -588,
    x1 = -582,
    z0 = 432,
    z1 = 438;
  const Y = 64;
  for (let X = x0; X <= x1; X++) {
    for (let Z = z0; Z <= z1; Z++) {
      if (HOUSE(X, Z) || isStationCell(X, Z) || !inSchem(X, Y, Z)) continue;
      clearSoft(X, Y, Z, 6);
      const edge = X === x0 || X === x1 || Z === z0 || Z === z1;
      setW(X, Y, Z, 'minecraft:smooth_stone');
      if (edge) {
        for (let y = Y + 1; y <= Y + 3; y++) setW(X, y, Z, 'minecraft:prismarine_bricks');
        if ((X + Z) % 2 === 0) setW(X, Y + 2, Z, 'minecraft:glass_pane');
      } else {
        setW(X, Y + 1, Z, 'minecraft:air');
        setW(X, Y + 2, Z, 'minecraft:air');
        setW(X, Y + 3, Z, 'minecraft:air');
      }
      setW(X, Y + 4, Z, edge ? 'minecraft:prismarine_brick_slab[type=bottom]' : 'minecraft:prismarine_bricks');
    }
  }
  // pool
  for (let X = -586; X <= -584; X++) {
    for (let Z = 434; Z <= 436; Z++) {
      setW(X, Y, Z, 'minecraft:water');
      setW(X, Y - 1, Z, 'minecraft:sea_lantern');
    }
  }
  setW(-585, Y + 1, 433, 'minecraft:cauldron[level=3]');
  setW(-583, Y + 1, 435, 'minecraft:lantern[hanging=false]');
  // doorway north
  setW(-585, Y + 1, z0, 'minecraft:air');
  setW(-585, Y + 2, z0, 'minecraft:air');
}

function tallerGatehouse() {
  for (const [X, Z] of [
    [-529, 419],
    [-529, 422],
    [-527, 419],
    [-527, 422],
  ]) {
    if (!inSchem(X, 70, Z)) continue;
    for (let Y = 70; Y <= 78; Y++) setW(X, Y, Z, brickMix(X, Y, Z));
    setW(X, 79, Z, 'minecraft:stone_brick_slab[type=bottom]');
    setW(X, 78, Z, 'minecraft:lantern[hanging=false]');
    setW(X, 77, Z, 'minecraft:white_banner[rotation=4]');
  }
  // connecting arch over gate
  for (const Z of [420, 421]) {
    setW(-528, 76, Z, brickMix(-528, 76, Z));
    setW(-528, 77, Z, 'minecraft:stone_brick_slab[type=bottom]');
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

console.log('pass19…');
knotGarden();
waterMill();
aviaryDome();
statueCourt();
wineCellarCutaway();
repairSecretTunnel();
bathHouse();
tallerGatehouse();
ensureStations();
const m = coverage();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
