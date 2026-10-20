/**
 * Pass 20 — west lawn joined to the y=64 terrace, channel banks eased,
 * east-skirt flower mounds, north-slope summerhouse, berry cage,
 * compost bins, quieter path benches, extra crop breaks.
 * Mapping: localX = worldX + 634, localY = worldY - 44, localZ = worldZ - 348.
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
  if (HOUSE(X, Z) || SOLAR(X, Z)) return;
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
const isNatural = (n) =>
  /grass_block|dirt$|coarse_dirt|podzol|moss_block|stone$|granite|diorite|andesite|gravel|sand$|farmland|dirt_path|mud$/.test(
    n,
  );
const isSoft = (n) =>
  /short_grass|tall_grass|dandelion|poppy|allium|cornflower|oxeye|lily_of|azure|azalea|bush|leaf_litter|firefly|fern|wheat|carrot|potato|beet|petal|tulip|orchid|lilac|vine|sweet_berry|air$/.test(
    n,
  );
const isWater = (n) => n.includes('water') || n.includes('lily_pad');

function topNatural(X, Z) {
  for (let Y = 82; Y >= 50; Y--) {
    if (!inSchem(X, Y, Z)) continue;
    const n = getW(X, Y, Z);
    if (isNatural(n)) return { Y, n };
  }
  return null;
}

function columnClear(X, Z, fromY, toY) {
  for (let y = fromY; y <= toY; y++) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n.startsWith(STATION) || n.includes('trapdoor') || isWater(n)) return false;
    if (!isSoft(n) && n !== 'minecraft:air' && !isNatural(n)) return false;
  }
  return true;
}

function placeGrass(X, Y, Z, plant = true) {
  if (!inSchem(X, Y, Z) || HOUSE(X, Z) || SOLAR(X, Z) || isStationCell(X, Z)) return;
  if (!columnClear(X, Z, Y, Y + 3)) return;
  for (let y = Y + 1; y <= Y + 3; y++) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (isSoft(n) || n === 'minecraft:air') setW(X, y, Z, 'minecraft:air');
  }
  for (let y = Math.max(ORIGIN_Y + 1, Y - 3); y < Y; y++) {
    const n = getW(X, y, Z);
    if (n === 'minecraft:air' || isSoft(n) || isNatural(n)) setW(X, y, Z, 'minecraft:dirt');
  }
  setW(X, Y, Z, 'minecraft:grass_block');
  if (!plant) return;
  const r = hash(X, Z) % 100;
  if (r < 45) setW(X, Y + 1, Z, 'minecraft:short_grass');
  else if (r < 70) setW(X, Y + 1, Z, FLOWERS[hash(X + 3, Z) % FLOWERS.length]);
}

function westLawnGrade() {
  let raised = 0;
  for (let Z = 412; Z <= 428; Z++) {
    if (Z >= 419 && Z <= 422) continue;
    for (let X = -589; X <= -586; X++) {
      if (HOUSE(X, Z) || isStationCell(X, Z)) continue;
      const top = topNatural(X, Z);
      if (!top || top.Y >= 64 || top.Y < 61) continue;
      if (!/grass_block|dirt$/.test(top.n)) continue;
      if (isWater(getW(X, top.Y, Z)) || isWater(getW(X, top.Y + 1, Z))) continue;
      if (!columnClear(X, Z, top.Y, top.Y + 3)) continue;
      placeGrass(X, 64, Z, true);
      raised++;
    }
  }
  return raised;
}

function softenChannelBanks() {
  // Grass batter around the west water, leaving the channel and mill house alone.
  const inMill = (X, Z) => X >= -620 && X <= -611 && Z >= 399 && Z <= 406;
  const inChannel = (X, Z) => X >= -622 && X <= -618 && Z >= 408 && Z <= 432;
  let eased = 0;
  for (let pass = 0; pass < 3; pass++) {
    const edits = [];
    for (let X = -628; X <= -610; X++) {
      for (let Z = 400; Z <= 440; Z++) {
        if (HOUSE(X, Z) || inMill(X, Z) || inChannel(X, Z) || !inSchem(X, 60, Z)) continue;
        const top = topNatural(X, Z);
        if (!top || !/grass_block|dirt$/.test(top.n)) continue;
        if (!columnClear(X, Z, top.Y, top.Y + 2)) continue;
        let high = top.Y;
        for (const [dx, dz] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const X2 = X + dx,
            Z2 = Z + dz;
          if (inMill(X2, Z2) || HOUSE(X2, Z2)) continue;
          const n2 = topNatural(X2, Z2);
          if (!n2) continue;
          if (inChannel(X2, Z2) || /grass_block|dirt$/.test(n2.n)) high = Math.max(high, n2.Y);
        }
        if (top.Y <= high - 2) edits.push([X, Z, top.Y + 1]);
      }
    }
    for (const [X, Z, Y] of edits) {
      placeGrass(X, Y, Z, pass === 2);
      eased++;
    }
    if (edits.length === 0) break;
  }
  return eased;
}

function eastFlowerMounds() {
  let mounds = 0;
  for (let X = -523; X <= -515; X++) {
    for (let Z = 430; Z <= 444; Z++) {
      if (SOLAR(X, Z) || HOUSE(X, Z) || isStationCell(X, Z)) continue;
      const top = topNatural(X, Z);
      if (!top || top.Y !== 64 || top.n !== 'minecraft:grass_block') continue;
      if (!columnClear(X, Z, 65, 67)) continue;
      let flat = true;
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const n = topNatural(X + dx, Z + dz);
        if (!n || Math.abs(n.Y - 64) > 1) flat = false;
      }
      if (!flat) continue;
      if (hash(X, Z) % 4 === 0) {
        placeGrass(X, 65, Z, true);
        mounds++;
      } else if (getW(X, 65, Z) === 'minecraft:air' && hash(X, Z) % 3 === 0) {
        setW(X, 65, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
      }
    }
  }
  return mounds;
}

function northSummerhouse() {
  const x0 = -580,
    x1 = -575,
    z0 = 478,
    z1 = 480;
  const already = getW(x0, 59, z0).includes('spruce_planks') || getW(x0, 60, z0).includes('spruce_planks');
  if (!already) {
  for (let X = x0; X <= x1; X++) {
    for (let Z = z0; Z <= z1; Z++) {
      if (!inSchem(X, 60, Z) || HOUSE(X, Z)) return 0;
      const top = topNatural(X, Z);
      if (!top || top.Y < 58 || top.Y > 62 || !/grass_block|dirt$/.test(top.n)) return 0;
      if (!columnClear(X, Z, top.Y + 1, top.Y + 5)) return 0;
    }
  }
  for (let X = x0; X <= x1; X++) {
    for (let Z = z0; Z <= z1; Z++) {
      const floor = topNatural(X, Z).Y;
      const edge = X === x0 || X === x1 || Z === z0 || Z === z1;
      const corner = (X === x0 || X === x1) && (Z === z0 || Z === z1);
      if (edge) setW(X, floor, Z, 'minecraft:spruce_planks');
      for (let y = floor + 1; y <= floor + 4; y++) {
        if (corner && y <= floor + 3) setW(X, y, Z, 'minecraft:spruce_fence');
        else if (getW(X, y, Z) !== 'minecraft:air' && isSoft(getW(X, y, Z))) setW(X, y, Z, 'minecraft:air');
        else if (!corner) setW(X, y, Z, 'minecraft:air');
      }
      setW(X, floor + 4, Z, 'minecraft:spruce_slab[type=bottom]');
    }
  }
  }
  const floorAt = (X, Z) => {
    for (let y = 66; y >= 56; y--) {
      const n = getW(X, y, Z);
      if (n.includes('spruce_planks') || n === 'minecraft:grass_block') return y;
    }
    return null;
  };
  // benches on the south eave, facing downhill; barrel and lantern sit on the local floor
  for (const X of [x0 + 2, x0 + 3]) {
    const y = floorAt(X, z1);
    if (y != null) setW(X, y + 1, z1, 'minecraft:spruce_stairs[facing=south,half=bottom]');
  }
  const barrelY = floorAt(x0 + 1, z0 + 1);
  if (barrelY != null) {
    if (getW(x0 + 1, barrelY - 1, z0 + 1).includes('barrel')) setW(x0 + 1, barrelY - 1, z0 + 1, 'minecraft:dirt');
    setW(x0 + 1, barrelY + 1, z0 + 1, 'minecraft:barrel[facing=up,open=false]');
  }
  const lampY = floorAt(x0 + 3, z0 + 1);
  if (lampY != null) {
    if (getW(x0 + 3, lampY + 1, z0 + 1).includes('lantern')) setW(x0 + 3, lampY + 1, z0 + 1, 'minecraft:air');
    setW(x0 + 3, lampY + 3, z0 + 1, 'minecraft:lantern[hanging=true]');
  }
  return 1;
}

function berryCage() {
  const X0 = -573,
    Z0 = 454,
    Y = 64;
  for (let dx = 0; dx < 4; dx++) {
    for (let dz = 0; dz < 4; dz++) {
      const X = X0 + dx,
        Z = Z0 + dz;
      if (isStationCell(X, Z) || HOUSE(X, Z) || !inSchem(X, Y, Z)) return 0;
      if (getW(X, Y + 1, Z).startsWith(STATION)) return 0;
    }
  }
  for (let dx = 0; dx < 4; dx++) {
    for (let dz = 0; dz < 4; dz++) {
      const X = X0 + dx,
        Z = Z0 + dz;
      const edge = dx === 0 || dx === 3 || dz === 0 || dz === 3;
      if (!/farmland|grass_block|dirt$/.test(getW(X, Y, Z))) return 0;
      for (let y = Y + 1; y <= Y + 3; y++) {
        const n = getW(X, y, Z);
        if (!(n === 'minecraft:air' || isSoft(n) || /wheat|carrot|potato|beet/.test(n))) return 0;
      }
      setW(X, Y, Z, 'minecraft:grass_block');
      if (edge) {
        setW(X, Y + 1, Z, 'minecraft:spruce_fence');
        setW(X, Y + 2, Z, 'minecraft:air');
      } else {
        setW(X, Y + 1, Z, 'minecraft:sweet_berry_bush[age=3]');
        setW(X, Y + 2, Z, 'minecraft:air');
      }
    }
  }
  // gate gap on the south side
  setW(X0 + 1, Y + 1, Z0 + 3, 'minecraft:air');
  setW(X0 + 2, Y + 1, Z0 + 3, 'minecraft:air');
  return 1;
}

function compostBins() {
  const spots = [
    [-588, 440],
    [-588, 442],
    [-588, 444],
  ];
  for (const [X, Z] of spots) {
    const Y = soilY(X);
    if (isStationCell(X, Z) || HOUSE(X, Z) || !inSchem(X, Y, Z)) return 0;
    if (!/grass_block|dirt$|coarse_dirt|podzol/.test(getW(X, Y, Z))) return 0;
    if (!columnClear(X, Z, Y + 1, Y + 2)) return 0;
  }
  for (const [X, Z] of spots) {
    const Y = soilY(X);
    setW(X, Y, Z, 'minecraft:podzol');
    setW(X, Y + 1, Z, 'minecraft:composter[level=4]');
    for (const side of [X - 1, X + 1]) {
      const n = getW(side, Y + 1, Z);
      if (n === 'minecraft:air' || isSoft(n)) setW(side, Y + 1, Z, 'minecraft:spruce_fence');
    }
  }
  const signZ = 439;
  if (getW(-588, soilY(-588) + 1, signZ) === 'minecraft:air' || isSoft(getW(-588, soilY(-588) + 1, signZ)))
    setW(-588, soilY(-588) + 1, signZ, 'minecraft:oak_sign[rotation=8,waterlogged=false]');
  return 1;
}

function pathBenches() {
  let benches = 0,
    cleared = 0;
  for (const Z of [418, 423]) {
    const facing = Z === 418 ? 'south' : 'north';
    for (let X = -584; X <= -534; X++) {
      if (isStationCell(X, Z) || HOUSE(X, Z)) continue;
      const Y = soilY(X);
      let slabY = null;
      for (let y = Y; y <= Y + 8; y++) {
        if (getW(X, y, Z).includes('oak_slab')) slabY = y;
      }
      if (slabY == null) continue;
      const h = hash(X, Z);
      if (h % 9 === 0) {
        setW(X, slabY, Z, `minecraft:spruce_stairs[facing=${facing},half=bottom]`);
        benches++;
      } else if (h % 4 === 0) {
        setW(X, slabY, Z, 'minecraft:air');
        if (getW(X, slabY - 1, Z).includes('grass') || getW(X, slabY - 1, Z).includes('dirt')) {
          setW(X, slabY, Z, h % 8 === 0 ? FLOWERS[h % FLOWERS.length] : 'minecraft:short_grass');
        }
        cleared++;
      }
    }
  }
  return { benches, cleared };
}

function cropFlowerBreaks() {
  let breaks = 0;
  for (let X = WALL_X1 + 2; X < WALL_X2 - 1; X++) {
    for (let Z = WALL_Z1 + 2; Z < WALL_Z2 - 1; Z++) {
      if (isStationCell(X, Z) || HOUSE(X, Z) || SOLAR(X, Z)) continue;
      const Y = soilY(X);
      if (!getW(X, Y, Z).startsWith('minecraft:farmland')) continue;
      const above = getW(X, Y + 1, Z);
      if (!/wheat|carrots|potatoes|beetroots/.test(above)) continue;
      if (hash(X, Z) % 6 !== 0) continue;
      setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
      breaks++;
    }
  }
  return breaks;
}

function ensureStations() {
  for (const X of LATTICE_X) {
    for (const Z of LATTICE_Z) {
      const Y = soilY(X);
      if (!inSchem(X, Y, Z)) continue;
      setWForce(X, Y, Z, 'minecraft:grass_block');
      setWForce(X, Y + 1, Z, STATION);
      setWForce(X, Y + 2, Z, 'minecraft:spruce_trapdoor[facing=south,half=bottom,open=true,waterlogged=false]');
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
  let trapOk = 0;
  for (const [x, y, z] of stations) if (full(grid.get(x, y + 1, z)).includes('trapdoor')) trapOk++;
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
        if (!ok) {
          const X = wx(x),
            Z = wz(z);
          if (!HOUSE(X, Z)) {
            grid.set(x, y, z, 'minecraft:grass_block');
            const a = full(grid.get(x, y + 1, z));
            if (/wheat|carrot|potato|beet|grass|flower|poppy/.test(a)) grid.set(x, y + 1, z, 'minecraft:short_grass');
          }
        }
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
        if (!ok) uncovered++;
      }
  return {
    stations: stations.length,
    lattice: stations.filter(([x, , z]) => LATTICE_X.includes(wx(x)) && LATTICE_Z.includes(wz(z))).length,
    trapOk,
    farm,
    uncovered,
  };
}

console.log('pass20…');
const report = {
  westLawn: westLawnGrade(),
  channelBanks: softenChannelBanks(),
  eastMounds: eastFlowerMounds(),
  summerhouse: northSummerhouse(),
  berryCage: berryCage(),
  compost: compostBins(),
  path: pathBenches(),
  cropBreaks: cropFlowerBreaks(),
};
ensureStations();
const metrics = coverage();
if (metrics.uncovered !== 0 || metrics.lattice < 100 || metrics.lattice > 110) {
  console.error('coverage guard failed', metrics);
  process.exit(1);
}
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify({ report, metrics }, null, 2));
