// Hongmenbao, the west castle of the Wang Family Compound, Lingshi, Shanxi.
// Measured plan: 105 m east-west, 180 m north-south, one gate in the south wall
// set slightly east of center. Grey brick wall a little over 2 m thick, 8 m
// high on the outside and about 4 m high from the upper courts. The main street
// is the cobbled Dragon Scale Street, 133 m by 3.6 m, and it sits about 4.5 m
// east of the geometric center because the western courts are narrower.
// Three cross lanes and that street draw the character 王. Four rows
// (底甲, 二甲, 三甲, 顶甲) hold 27 courtyards: 7, 7, 7, and 6.
// A Kobe University of Design survey measured the ordinary courts at
// 13.5–14 m wide and 36.8–37.6 m deep, and the street climbing 16.8 m
// from the south gate to the north end. 1 block = 1 meter.
//
// Historic materials of the Qing Shanxi merchant castle:
//   青砖 grey brick walls
//   灰瓦 slate-grey roof tiles
//   卵石 river cobbles on Dragon Scale Street
//   红漆 red lacquer on the fortress gate
//   carved wood lattice, dark timber floors and beams
//   chiselled stone plaques and thresholds

const cells = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, state) => cells.set(key(x, y, z), state);
const carve = (x, y, z) => cells.delete(key(x, y, z));

const BRICK = 'minecraft:polished_andesite';
const BRICK_ROUGH = 'minecraft:andesite';
const BRICK_AGED = 'minecraft:stone';
const FOUND = 'minecraft:cobblestone';
const TILE = 'minecraft:andesite';
const TILE_SMOOTH = 'minecraft:polished_andesite';
const COBBLE = 'minecraft:cobblestone';
const STONE = 'minecraft:stone';
const WOOD = 'minecraft:dark_oak_planks';
const FLOOR = 'minecraft:spruce_planks';
const BEAM = 'minecraft:stripped_dark_oak_log[axis=y]';
const BEAM_X = 'minecraft:stripped_dark_oak_log[axis=x]';
const BEAM_Z = 'minecraft:stripped_dark_oak_log[axis=z]';
const RED = 'minecraft:crimson_planks';
const RED_PILLAR = 'minecraft:stripped_crimson_stem[axis=y]';
const LATTICE = 'minecraft:dark_oak_trapdoor[facing=south,half=bottom,open=true,powered=false,waterlogged=false]';
const LATTICE_N = 'minecraft:dark_oak_trapdoor[facing=north,half=bottom,open=true,powered=false,waterlogged=false]';
const LATTICE_E = 'minecraft:dark_oak_trapdoor[facing=east,half=bottom,open=true,powered=false,waterlogged=false]';
const LATTICE_W = 'minecraft:dark_oak_trapdoor[facing=west,half=bottom,open=true,powered=false,waterlogged=false]';
const HANG = 'minecraft:lantern[hanging=true,waterlogged=false]';
const PLAQUE = 'minecraft:chiseled_stone_bricks';
const SMOOTH = 'minecraft:smooth_stone';
const AIR = 'minecraft:air';

const stair = (block, facing, half = 'bottom') =>
  `minecraft:${block}[facing=${facing},half=${half},shape=straight,waterlogged=false]`;
const slab = (block, type = 'bottom') =>
  `minecraft:${block}[type=${type},waterlogged=false]`;
const door = (facing, half, red = false) =>
  `minecraft:${red ? 'crimson' : 'dark_oak'}_door[facing=${facing},half=${half},hinge=left,open=false,powered=false]`;

function brick(x, y, z) {
  const n = Math.abs((x * 73856093) ^ (y * 19349663) ^ (z * 83492791));
  if (y <= 65) return FOUND;
  if (n % 11 === 0) return BRICK_ROUGH;
  if (n % 29 === 0) return BRICK_AGED;
  return BRICK;
}

function cobble(x, z) {
  return ((x * 3 + z * 5) & 3) === 0 ? STONE : COBBLE;
}

export const X0 = -52;
export const X1 = 52;
export const Z0 = -90;
export const Z1 = 89;

const bands = [
  { name: 'di', z0: 48, z1: 86, feet: 65 },
  { name: 'lane1', z0: 42, z1: 47, lane: true, low: 65, high: 70 },
  { name: 'er', z0: 4, z1: 41, feet: 70 },
  { name: 'lane2', z0: -2, z1: 3, lane: true, low: 70, high: 75 },
  { name: 'san', z0: -40, z1: -3, feet: 75 },
  { name: 'lane3', z0: -46, z1: -41, lane: true, low: 75, high: 80 },
  { name: 'ding', z0: -87, z1: -47, feet: 80 },
];

function bandAt(z) {
  return bands.find((b) => z >= b.z0 && z <= b.z1);
}
function feetAt(z) {
  if (z >= 87) return 65;
  const b = bandAt(z);
  if (!b) return 65;
  if (b.lane) return b.high;
  return b.feet;
}
export function grassTop(z) {
  if (z >= Z1) return 64;
  if (z >= Z0) return 64 + Math.round(((Z1 - z) / (Z1 - Z0)) * 12);
  const t = Math.min(1, (Z0 - z) / 28);
  return Math.round(76 - t * 12);
}
export function parapetY(z) {
  return Math.max(grassTop(z) + 8, feetAt(z) + 3);
}

const GATE_X = [3, 4, 5, 6];
const walkZ = 60;
export const PLAN = {
  gateX: GATE_X,
  gateZ: Z1,
  outZ: 91,
  inZ: [84, 80],
  spawn: [4, 65, 112],
  solar: { x: -51, y: parapetY(walkZ) - 1, z: [60, 61, 62, 63] },
  lamp: { x: -50, z: [60, 63] },
};

function fill(x0, x1, y0, y1, z0, z1, state) {
  for (let y = y0; y <= y1; y++) {
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) put(x, y, z, typeof state === 'function' ? state(x, y, z) : state);
    }
  }
}
function box(x0, x1, y0, y1, z0, z1) {
  fill(x0, x1, y0, y1, z0, z1, brick);
}
function pave(x0, x1, y, z0, z1, state) {
  fill(x0, x1, y, y, z0, z1, state);
}
function support(x0, x1, y, z0, z1) {
  for (let yy = 64; yy < y; yy++) fill(x0, x1, yy, yy, z0, z1, 'minecraft:dirt');
}

function roofEW(x0, x1, z0, z1, eave) {
  const mid = Math.floor((z0 + z1) / 2);
  const rise = Math.max(1, mid - z0);
  for (let x = x0 - 1; x <= x1 + 1; x++) {
    const edge = x < x0 || x > x1;
    for (let s = 0; s <= rise; s++) {
      const y = eave + s;
      const south = z1 + 1 - s;
      const north = z0 - 1 + s;
      if (north >= south) {
        put(x, y, mid, edge ? BRICK_ROUGH : TILE_SMOOTH);
        continue;
      }
      if (edge) {
        put(x, y, south, stair('andesite_stairs', 'south'));
        put(x, y, north, stair('andesite_stairs', 'north'));
      } else {
        put(x, y, south, stair('andesite_stairs', 'south'));
        put(x, y, north, stair('andesite_stairs', 'north'));
        if (s === 0) {
          put(x, eave - 1, south, BEAM_Z);
          put(x, eave - 1, north, BEAM_Z);
        }
      }
    }
  }
  for (let x = x0; x <= x1; x++) put(x, eave + rise + 1, mid, slab('andesite', 'bottom'));
}

function horseHead(x, z0, z1, eave) {
  const mid = Math.floor((z0 + z1) / 2);
  for (let s = 0; s <= 3; s++) {
    const y = eave + 1 + s;
    const half = Math.max(0, Math.floor((z1 - z0) / 2) - s * 2);
    for (let z = mid - half; z <= mid + half; z++) put(x, y, z, s === 3 ? TILE_SMOOTH : brick(x, y, z));
  }
}

function wallRun(z, xOuter, inward) {
  const top = parapetY(z);
  const base = 65;
  if (z % 8 === 4) {
    for (let y = base; y <= top - 1; y++) put(xOuter - inward, y, z, brick(xOuter - inward, y, z));
  }
  for (let x = xOuter; x !== xOuter + inward * 3; x += inward) {
    const layer = Math.abs(x - xOuter);
    for (let y = base; y <= top - 2; y++) put(x, y, z, brick(x, y, z));
    if (layer === 0) {
      put(x, top - 1, z, brick(x, top - 1, z));
      if (((z + x) & 1) === 0) put(x, top, z, brick(x, top, z));
    } else if (layer === 1) {
      put(x, top - 1, z, slab('andesite'));
    } else {
      put(x, top - 1, z, stair('andesite_stairs', inward > 0 ? 'east' : 'west'));
    }
  }
}
function wallRunZ(x, zOuter, inward) {
  const top = parapetY(zOuter);
  if (x % 8 === 4 && (x < -2 || x > 12)) {
    for (let y = 65; y <= top - 1; y++) put(x, y, zOuter - inward, brick(x, y, zOuter - inward));
  }
  for (let z = zOuter; z !== zOuter + inward * 3; z += inward) {
    const layer = Math.abs(z - zOuter);
    for (let y = 65; y <= top - 2; y++) put(x, y, z, brick(x, y, z));
    if (layer === 0) {
      put(x, top - 1, z, brick(x, top - 1, z));
      if (((x + z) & 1) === 0) put(x, top, z, brick(x, top, z));
    } else if (layer === 1) {
      put(x, top - 1, z, slab('andesite'));
    } else {
      put(x, top - 1, z, stair('andesite_stairs', inward > 0 ? 'south' : 'north'));
    }
  }
}

function openDoor(x, z, y, facing, red = false) {
  put(x, y, z, door(facing, 'lower', red));
  put(x, y + 1, z, door(facing, 'upper', red));
}

function lattice(x, y, z, facing) {
  if (facing === 'south') put(x, y, z, LATTICE);
  else if (facing === 'north') put(x, y, z, LATTICE_N);
  else if (facing === 'east') put(x, y, z, LATTICE_E);
  else put(x, y, z, LATTICE_W);
}

function court(x0, x1, z0, z1, feet, entrance) {
  const F = feet - 1;
  const depth = z1 - z0 + 1;
  const southD = 5;
  const frontD = Math.max(6, Math.floor(depth * 0.22));
  const midD = 3;
  const hallD = 9;
  const backD = depth - southD - frontD - midD - hallD;
  const south1 = z1;
  const south0 = z1 - southD + 1;
  const front1 = south0 - 1;
  const front0 = front1 - frontD + 1;
  const mid1 = front0 - 1;
  const mid0 = mid1 - midD + 1;
  const back1 = mid0 - 1;
  const back0 = back1 - backD + 1;
  const hall1 = back0 - 1;
  const hall0 = z0;
  const wide = x1 - x0 >= 12;
  const cx = Math.floor((x0 + x1) / 2);

  support(x0, x1, F, z0, z1);
  pave(x0, x1, F, z0, z1, (x, _y, z) => {
    if (x === x0 || x === x1 || z === z0 || z === z1) return FOUND;
    if ((x + z) % 5 === 0) return SMOOTH;
    return cobble(x, z);
  });

  // front gatehouse bay of the courtyard
  box(x0, x1, F + 1, F + 4, south0, south1);
  for (let z = south0 + 1; z <= south1 - 1; z++) {
    for (let x = x0 + 1; x <= x1 - 1; x++) {
      carve(x, F + 1, z);
      carve(x, F + 2, z);
      carve(x, F + 3, z);
    }
  }
  for (let x = x0 + 2; x <= x1 - 2; x += 2) {
    put(x, F + 1, south1 - 1, BEAM);
    put(x, F + 2, south1 - 1, BEAM);
    put(x, F + 3, south1 - 1, BEAM);
  }
  for (let x = x0 + 1; x <= x1 - 1; x++) put(x, F + 4, south1 - 1, BEAM_X);
  roofEW(x0, x1, south0, south1, F + 5);
  put(cx, F + 3, Math.floor((south0 + south1) / 2), HANG);

  if (entrance === 'south') openDoor(cx, south1, F + 1, 'south', true);
  if (entrance === 'west') openDoor(x0, south0 + 2, F + 1, 'west', true);
  if (entrance === 'east') openDoor(x1, south0 + 2, F + 1, 'east', true);
  openDoor(cx, south0, F + 1, 'north');

  const wing = (xa, xb, zA, zB, look) => {
    box(xa, xb, F + 1, F + 3, zA, zB);
    for (let z = zA + 1; z <= zB - 1; z++) {
      for (let x = xa + 1; x <= xb - 1; x++) {
        carve(x, F + 1, z);
        carve(x, F + 2, z);
        put(x, F + 1, z, AIR);
      }
    }
    const face = look === 'east' ? xb : xa;
    openDoor(face, Math.floor((zA + zB) / 2), F + 1, look);
    lattice(Math.floor((xa + xb) / 2), F + 2, face, look);
    for (let z = zA + 1; z <= zB - 1; z += 2) {
      put(xa === x0 + 1 ? xa : xb, F + 1, z, BEAM);
      put(xa === x0 + 1 ? xa : xb, F + 2, z, BEAM);
    }
    roofEW(xa, xb, zA, zB, F + 4);
  };
  if (wide) {
    wing(x0 + 1, x0 + 3, front0, front1, 'east');
    wing(x1 - 3, x1 - 1, front0, front1, 'west');
    wing(x0 + 1, x0 + 3, back0, back1, 'east');
    wing(x1 - 3, x1 - 1, back0, back1, 'west');
  }

  // moon gate between the yards
  box(x0, x1, F + 1, F + 4, mid0, mid1);
  for (let x = cx - 1; x <= cx + 1; x++) {
    for (let y = F + 1; y <= F + 3; y++) {
      for (let z = mid0; z <= mid1; z++) carve(x, y, z);
    }
  }
  put(cx - 2, F + 4, mid1, stair('andesite_stairs', 'east'));
  put(cx + 2, F + 4, mid1, stair('andesite_stairs', 'west'));
  put(cx, F + 4, mid1, TILE_SMOOTH);
  put(cx - 2, F + 1, mid1, PLAQUE);
  put(cx + 2, F + 1, mid1, PLAQUE);

  // north cave hall with wooden upper room
  box(x0, x1, F + 1, F + 7, hall0, hall1);
  for (let z = hall0 + 1; z <= hall1 - 1; z++) {
    for (let x = x0 + 1; x <= x1 - 1; x++) {
      carve(x, F + 1, z);
      carve(x, F + 2, z);
      carve(x, F + 3, z);
      put(x, F + 4, z, FLOOR);
      carve(x, F + 5, z);
      carve(x, F + 6, z);
    }
  }
  for (let x = cx - 1; x <= cx + 1; x++) {
    for (let y = F + 1; y <= F + 3; y++) carve(x, y, hall1);
  }
  put(cx - 2, F + 4, hall1, stair('andesite_stairs', 'east'));
  put(cx + 2, F + 4, hall1, stair('andesite_stairs', 'west'));
  put(cx, F + 3, hall1 - 1, HANG);
  for (const x of [cx - 3, cx + 3]) {
    carve(x, F + 5, hall1);
    carve(x, F + 6, hall1);
    lattice(x, F + 5, hall1, 'south');
    lattice(x, F + 6, hall1, 'south');
  }
  for (const x of [x0 + 1, x1 - 1]) {
    put(x, F + 1, hall1 + 1, BEAM);
    put(x, F + 2, hall1 + 1, BEAM);
    put(x, F + 3, hall1 + 1, BEAM);
  }
  put(cx, F + 1, hall1 + 1, stair('andesite_stairs', 'north'));
  const eave = wide ? F + 8 : F + 5;
  roofEW(x0, x1, hall0, hall1, eave);
  horseHead(x0, hall0, hall1, eave);
  horseHead(x1, hall0, hall1, eave);

  // a little planted court life
  if (wide && (x0 + z0) % 3 === 0) {
    put(cx, F + 1, Math.floor((front0 + front1) / 2), 'minecraft:potted_bamboo');
  }
  if (wide && (x0 + z0) % 4 === 0) {
    put(cx - 2, F + 1, Math.floor((back0 + back1) / 2), 'minecraft:flower_pot');
  }
}

function climb(x, zStart, zDir, steps, y0) {
  for (let i = 0; i < steps; i++) {
    const z = zStart + zDir * i;
    const y = y0 + i;
    put(x, y, z, stair('andesite_stairs', zDir < 0 ? 'north' : 'south'));
    for (let yy = 64; yy < y; yy++) put(x, yy, z, FOUND);
  }
}

function tower(x, z) {
  const base = parapetY(z) - 1;
  box(x - 2, x + 2, base, base + 3, z - 2, z + 2);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      carve(x + dx, base + 1, z + dz);
      carve(x + dx, base + 2, z + dz);
    }
  }
  for (const [dx, dz] of [[-2, -2], [-2, 2], [2, -2], [2, 2]]) {
    put(x + dx, base + 4, z + dz, 'minecraft:dark_oak_fence[east=false,north=false,south=false,waterlogged=false,west=false]');
    put(x + dx, base + 5, z + dz, 'minecraft:dark_oak_fence[east=false,north=false,south=false,waterlogged=false,west=false]');
  }
  put(x, base + 3, z, HANG);
  roofEW(x - 2, x + 2, z - 2, z + 2, base + 4);
}

function screenWall() {
  // brick-carved照壁 on the grass south of the gate
  for (let y = 65; y <= 70; y++) {
    for (let x = 0; x <= 8; x++) {
      if (y === 68 && x >= 3 && x <= 5) put(x, y, 104, PLAQUE);
      else if (y === 67 && (x === 2 || x === 6)) put(x, y, 104, PLAQUE);
      else put(x, y, 104, brick(x, y, 104));
    }
  }
  for (let x = 0; x <= 8; x++) {
    put(x, 71, 104, TILE);
    put(x, 71, 103, stair('andesite_stairs', 'north'));
    put(x, 71, 105, stair('andesite_stairs', 'south'));
  }
  put(4, 72, 104, slab('andesite'));
  for (const x of [0, 8]) {
    put(x, 65, 103, FOUND);
    put(x, 66, 103, FOUND);
    put(x, 67, 103, FOUND);
  }
}

function gatehouse() {
  // two-storey red gate towers with a wooden watch room over the street
  box(-1, 2, 65, 78, 89, 95);
  box(7, 11, 65, 78, 89, 95);
  box(-1, 11, 71, 74, 89, 95);
  for (let z = 80; z <= 95; z++) {
    for (const x of GATE_X) {
      for (let y = 65; y <= 70; y++) carve(x, y, z);
    }
  }
  for (let z = 90; z <= 94; z++) {
    if (z === 91) continue;
    for (let x = 3; x <= 6; x++) put(x, 64, z, FOUND);
  }
  for (const x of [2, 7]) {
    for (let y = 65; y <= 70; y++) put(x, y, 95, RED_PILLAR);
  }
  for (const x of [3, 4, 5, 6]) {
    put(x, 71, 95, RED);
  }
  put(4, 71, 95, PLAQUE);
  put(5, 71, 95, PLAQUE);
  for (const x of [3, 6]) {
    put(x, 65, 96, RED_PILLAR);
    put(x, 66, 96, RED_PILLAR);
    put(x, 67, 96, RED_PILLAR);
    put(x, 68, 96, RED_PILLAR);
  }
  for (let x = 1; x <= 9; x++) {
    put(x, 70, 90, BEAM_X);
    put(x, 70, 94, BEAM_X);
  }
  put(4, 70, 92, HANG);
  for (let y = 72; y <= 74; y++) {
    for (let x = 1; x <= 9; x++) {
      for (let z = 90; z <= 94; z++) {
        if (x === 1 || x === 9 || z === 90 || z === 94) put(x, y, z, WOOD);
        else if (y === 72) put(x, y, z, FLOOR);
        else carve(x, y, z);
      }
    }
  }
  for (const x of [2, 8]) {
    lattice(x, 73, 94, 'south');
    lattice(x, 74, 94, 'south');
  }
  roofEW(-2, 12, 88, 96, 79);
  horseHead(-1, 89, 95, 79);
  horseHead(11, 89, 95, 79);
}

function generate() {
  for (let z = Z0; z <= Z1; z++) {
    wallRun(z, X0, 1);
    wallRun(z, X1, -1);
  }
  for (let x = X0; x <= X1; x++) {
    wallRunZ(x, Z0, 1);
    wallRunZ(x, Z1, -1);
  }

  for (let z = -87; z <= 86; z++) {
    const b = bandAt(z);
    if (!b) continue;
    const y = (b.lane ? b.low : b.feet) - 1;
    support(-49, 49, y, z, z);
    if (!b.lane) {
      pave(2, 7, y, z, z, (x, _yy, zz) => (x >= 3 && x <= 6 ? cobble(x, zz) : FOUND));
      pave(-49, 1, y, z, z, BRICK);
      pave(8, 49, y, z, z, BRICK);
    }
  }

  const laneStair = (b) => {
    const rise = b.high - b.low;
    const top = b.high - 1;
    for (let x = -49; x <= 49; x++) {
      const street = x >= 2 && x <= 7;
      if (street) {
        for (let i = 0; i < rise; i++) {
          const z = b.z1 - i;
          const y = b.low - 1 + i;
          put(x, y, z, stair('andesite_stairs', 'north'));
          for (let yy = 64; yy < y; yy++) put(x, yy, z, 'minecraft:dirt');
        }
      } else {
        for (let z = b.z0; z <= b.z1; z++) {
          for (let yy = 64; yy < top; yy++) put(x, yy, z, 'minecraft:dirt');
          put(x, top, z, BRICK);
        }
      }
      for (let yy = 64; yy < top; yy++) put(x, yy, b.z0, 'minecraft:dirt');
      put(x, top, b.z0, street ? cobble(x, b.z0) : BRICK);
    }
  };
  for (const b of bands) if (b.lane) laneStair(b);

  const rows = [
    { z0: 48, z1: 78, feet: 65 },
    { z0: 4, z1: 41, feet: 70 },
    { z0: -40, z1: -3, feet: 75 },
  ];
  const east = [[7, 20], [21, 34], [35, 48]];
  const west = [[-49, -41], [-40, -27], [-26, -13], [-12, 1]];
  for (const row of rows) {
    court(east[0][0], east[0][1], row.z0, row.z1, row.feet, 'west');
    for (let i = 1; i < east.length; i++) court(east[i][0], east[i][1], row.z0, row.z1, row.feet, 'south');
    for (let i = 0; i < west.length - 1; i++) court(west[i][0], west[i][1], row.z0, row.z1, row.feet, 'south');
    const last = west[west.length - 1];
    court(last[0], last[1], row.z0, row.z1, row.feet, 'east');
  }
  const dingX = [[-47, -34], [-31, -18], [-15, -2], [1, 14], [17, 30], [33, 46]];
  for (const [a, b] of dingX) court(a, b, -87, -47, 80, 'south');

  gatehouse();
  screenWall();
  pave(2, 7, 64, 90, 90, (x, _y, z) => cobble(x, z));

  tower(-50, -88);
  tower(50, -88);

  const well = (x, z, y) => {
    box(x - 1, x + 1, y, y, z - 1, z + 1);
    put(x, y, z, 'minecraft:cauldron[level=3]');
    put(x, y + 1, z, 'minecraft:dark_oak_fence[east=false,north=false,south=false,waterlogged=false,west=false]');
  };
  well(46, 80, 64);
  well(-48, -84, 79);

  climb(12, 79, 1, 8, 64);
  climb(-8, 79, 1, 8, 64);

  for (const x of GATE_X) {
    for (let y = 65; y <= 68; y++) {
      for (let z = 87; z <= 89; z++) carve(x, y, z);
    }
    for (let z = 80; z <= 89; z++) put(x, 64, z, FOUND);
  }

  kitchenFarms();
}

// Hydrofarm kitchens in the 底甲 courts, pipes buried under the floors, pantry
// in the first east court cave hall. Surfaces stay planted; the feed is hidden.
export const blockEntities = [];

function itemPipe(faces) {
  const p = {
    face_down: 'none',
    face_up: 'none',
    face_north: 'none',
    face_south: 'none',
    face_east: 'none',
    face_west: 'none',
  };
  for (const [k, v] of Object.entries(faces)) p[`face_${k}`] = v;
  const body = ['face_down', 'face_east', 'face_north', 'face_south', 'face_up', 'face_west']
    .map((k) => `${k}=${p[k]}`)
    .join(',');
  return `hydrofarm:item_pipe[${body}]`;
}

function liquidPipe(faces) {
  const p = {
    face_down: 'none',
    face_up: 'none',
    face_north: 'none',
    face_south: 'none',
    face_east: 'none',
    face_west: 'none',
  };
  for (const [k, v] of Object.entries(faces)) p[`face_${k}`] = v;
  const body = ['face_down', 'face_east', 'face_north', 'face_south', 'face_up', 'face_west']
    .map((k) => `${k}=${p[k]}`)
    .join(',');
  return `hydrofarm:liquid_pipe[${body}]`;
}

function bedState() {
  return 'hydrofarm:hydroponics_bed[east=false,north=false,planter_ne=true,planter_nw=true,planter_se=true,planter_sw=true,south=false,west=false]';
}

function plantBed(x, y, z, seed) {
  put(x, y, z, bedState());
  const tags = [];
  for (let q = 0; q < 4; q++) {
    tags.push({ type: 'byte', name: `Installed_${q}`, value: 1 });
    tags.push({ type: 'string', name: `Seed_${q}`, value: seed });
    tags.push({ type: 'int', name: `Growth_${q}`, value: 0 });
  }
  blockEntities.push({ id: 'hydrofarm:hydroponics_bed', x, y, z, tags });
}

function namedBarrel(x, y, z, facing, label, items) {
  put(x, y, z, `minecraft:barrel[facing=${facing},open=false]`);
  blockEntities.push({
    id: 'minecraft:barrel',
    x,
    y,
    z,
    customName: label,
    items,
  });
}

function kitchenFarms() {
  // Front yards of four 底甲 courts. Pantry lives in the first east cave hall.
  // Item spine under street x=5; liquid spine under x=4. Beds pull water from
  // a tank beside each plot, so liquid never overwrites the item extract pipes.
  const gardens = [
    { name: 'Wheat', seed: 'minecraft:wheat_seeds', cx: 13, cz: 70 },
    { name: 'Carrot', seed: 'minecraft:carrot', cx: 27, cz: 70 },
    { name: 'Potato', seed: 'minecraft:potato', cx: -19, cz: 70 },
    { name: 'Beetroot', seed: 'minecraft:beetroot_seeds', cx: -6, cz: 70 },
  ];
  const F = 64;
  const pipeY = 62; // item pipes
  const waterY = 61; // liquid pipes one layer deeper so they never collide
  const itemSpine = 5;
  const liquidSpine = 4;
  const pantryZ = 49;
  const pantryY = 65;
  const joinZs = [];

  for (const g of gardens) {
    const beds = [];
    for (let dz = 0; dz <= 1; dz++) {
      for (let dx = 0; dx <= 1; dx++) {
        const x = g.cx + dx;
        const z = g.cz + dz;
        plantBed(x, F, z, g.seed);
        beds.push([x, z]);
        // Extract under each bed.
        put(
          x,
          pipeY,
          z,
          itemPipe({
            up: 'extract',
            north: dz === 0 ? 'none' : 'pipe',
            south: dz === 1 ? 'none' : 'pipe',
            east: dx === 1 ? 'none' : 'pipe',
            west: dx === 0 ? 'none' : 'pipe',
          }),
        );
      }
    }
    // Path ring around the plot.
    for (let dz = -1; dz <= 2; dz++) {
      for (let dx = -1; dx <= 2; dx++) {
        if (dx >= 0 && dx <= 1 && dz >= 0 && dz <= 1) continue;
        const x = g.cx + dx;
        const z = g.cz + dz;
        put(x, F, z, 'minecraft:dirt_path');
        put(x, F - 1, z, 'minecraft:dirt');
      }
    }
    // Water tank beside the plot — beds drink from this cluster.
    // Liquid runs on z = cz-1 so it never overwrites item extracts under beds.
    const tankX = g.cx + 2;
    const tankZ = g.cz;
    const liquidZ = g.cz - 1;
    put(tankX, F, tankZ, 'hydrofarm:liquid_tank[down=false,east=false,north=false,south=false,up=true,west=false]');
    put(tankX, F + 1, tankZ, 'hydrofarm:liquid_tank[down=true,east=false,north=false,south=false,up=false,west=false]');
    put(tankX, waterY, liquidZ, liquidPipe({ north: 'pipe', west: 'pipe', east: 'none' }));
    put(tankX, waterY, tankZ, liquidPipe({ up: 'insert', south: 'pipe' }));
    // Rise from waterY into the tank base.
    put(tankX, pipeY, tankZ, liquidPipe({ down: 'pipe', up: 'insert' }));

    // Item run from the SW bed under the plot toward the street spine.
    const [jx, jz] = beds[0];
    joinZs.push(jz);
    const step = jx > itemSpine ? -1 : 1;
    for (let x = jx + step; step < 0 ? x >= itemSpine : x <= itemSpine; x += step) {
      put(
        x,
        pipeY,
        jz,
        itemPipe({
          east: step > 0 || x > itemSpine ? 'pipe' : 'none',
          west: step < 0 || x < itemSpine ? 'pipe' : 'none',
          north: x === itemSpine ? 'pipe' : 'none',
          south: x === itemSpine ? 'pipe' : 'none',
        }),
      );
    }
    // Re-mark the SW bed pipe so it also feeds west/east toward the street.
    put(
      jx,
      pipeY,
      jz,
      itemPipe({
        up: 'extract',
        east: step > 0 ? 'pipe' : beds.some(([bx]) => bx > jx) ? 'pipe' : 'none',
        west: step < 0 ? 'pipe' : beds.some(([bx]) => bx < jx) ? 'pipe' : 'none',
        south: 'pipe',
        north: 'none',
      }),
    );

    // Liquid branch from the street spine to this garden (one row north of beds).
    const lStep = tankX > liquidSpine ? 1 : -1;
    for (let x = liquidSpine; lStep > 0 ? x < tankX : x > tankX; x += lStep) {
      put(
        x,
        waterY,
        liquidZ,
        liquidPipe({
          east: lStep > 0 || x < tankX ? 'pipe' : 'none',
          west: lStep < 0 || x > tankX ? 'pipe' : 'none',
          north: x === liquidSpine ? 'pipe' : 'none',
          south: x === liquidSpine ? 'pipe' : 'none',
        }),
      );
    }

    namedBarrel(g.cx - 1, F, g.cz - 1, 'up', `${g.name} supplies`, [
      { slot: 0, id: 'hydrofarm:hydrofarm_planter', count: 16 },
      { slot: 1, id: g.seed, count: 64 },
      { slot: 2, id: g.seed, count: 64 },
    ]);
    put(
      g.cx - 1,
      F + 1,
      g.cz - 1,
      'minecraft:spruce_trapdoor[facing=south,half=bottom,open=false,powered=false,waterlogged=false]',
    );
  }

  // Item spine under Dragon Scale Street into the pantry hall.
  const northMost = Math.min(...joinZs, pantryZ);
  const southMost = Math.max(...joinZs, pantryZ);
  for (let z = northMost; z <= southMost; z++) {
    put(itemSpine, pipeY, z, itemPipe({ north: 'pipe', south: 'pipe' }));
  }
  for (const jz of joinZs) {
    put(itemSpine, pipeY, jz, itemPipe({ north: 'pipe', south: 'pipe', east: 'pipe', west: 'pipe' }));
  }
  for (let x = itemSpine; x <= 11; x++) {
    put(
      x,
      pipeY,
      pantryZ,
      itemPipe({
        east: x < 11 ? 'pipe' : 'none',
        west: x > itemSpine ? 'pipe' : 'none',
        south: x === itemSpine ? 'pipe' : 'none',
        up: x === 11 ? 'pipe' : 'none',
      }),
    );
  }
  put(11, pipeY + 1, pantryZ, itemPipe({ down: 'pipe', east: 'pipe' }));

  const pantryCrops = [
    { name: 'Wheat', x: 11 },
    { name: 'Carrot', x: 13 },
    { name: 'Potato', x: 15 },
    { name: 'Beetroot', x: 17 },
  ];
  for (let i = 0; i < pantryCrops.length; i++) {
    const c = pantryCrops[i];
    namedBarrel(c.x, pantryY, pantryZ, 'south', c.name, []);
    put(
      c.x,
      pipeY + 1,
      pantryZ,
      itemPipe({
        west: 'pipe',
        east: i < pantryCrops.length - 1 ? 'pipe' : 'none',
        up: 'insert',
        down: i === 0 ? 'pipe' : 'none',
      }),
    );
  }

  // Cistern + siphon under the pantry court, feeding the liquid spine at waterY.
  const wx = 12;
  const wz = 52;
  put(wx, 60, wz, 'minecraft:water[level=0]');
  put(wx, waterY, wz, 'hydrofarm:liquid_siphon');
  put(wx, pipeY, wz, liquidPipe({ down: 'extract', west: 'pipe' }));
  for (let x = liquidSpine; x < wx; x++) {
    put(
      x,
      pipeY,
      wz,
      liquidPipe({
        east: 'pipe',
        west: x > liquidSpine ? 'pipe' : 'none',
        down: x === liquidSpine ? 'pipe' : 'none',
      }),
    );
  }
  for (let z = Math.min(wz, 70); z <= Math.max(wz, 70); z++) {
    put(
      liquidSpine,
      waterY,
      z,
      liquidPipe({ north: 'pipe', south: 'pipe', up: z === wz ? 'pipe' : 'none' }),
    );
  }
  put(liquidSpine, pipeY, wz, liquidPipe({ east: 'pipe', down: 'pipe' }));
  put(liquidSpine, waterY, wz, liquidPipe({ up: 'pipe', north: 'pipe', south: 'pipe' }));
  for (const g of gardens) {
    put(
      liquidSpine,
      waterY,
      g.cz - 1,
      liquidPipe({ north: 'pipe', south: 'pipe', east: 'pipe', west: 'pipe' }),
    );
  }
}

generate();

export function at(x, y, z) {
  return cells.get(key(x, y, z));
}
export function inside(x, z) {
  return x >= X0 && x <= X1 && z >= Z0 && z <= Z1;
}
export const blockCount = cells.size;
