// Stone-and-timber estate wall around Ironcrest Grand Manor.
// Interior 140×140. Cobble / stone-brick curtain with spruce accents.
// Four 7×7 corner guard towers with spiral stairs, timber framing, and battlements.

import { BlockGrid } from './node_modules/craftmatic/dist/schem/types.js';
import { writeSchematic } from './node_modules/craftmatic/dist/schem/write.js';
import { parseToGrid } from './node_modules/craftmatic/dist/schem/parse.js';

const SIZE = 140;
const WALL = 1;
const X0 = 0;
const X1 = SIZE + WALL;
const Z0 = 0;
const Z1 = SIZE + WALL;
const GY = 1;
const WALL_H = 6;
const TOWER = 7;
const TOWER_H = 16;
const TOWER_TOP = GY + TOWER_H;

const COBBLE = 'minecraft:cobblestone';
const MOSSY = 'minecraft:mossy_cobblestone';
const STONE = 'minecraft:stone';
const BRICK = 'minecraft:stone_bricks';
const BRICK_CRACK = 'minecraft:cracked_stone_bricks';
const BRICK_MOSS = 'minecraft:mossy_stone_bricks';
const ANDESITE = 'minecraft:andesite';
const LOG = 'minecraft:stripped_spruce_log[axis=y]';
const LOG_X = 'minecraft:stripped_spruce_log[axis=x]';
const LOG_Z = 'minecraft:stripped_spruce_log[axis=z]';
const PLANK = 'minecraft:spruce_planks';
const FENCE = 'minecraft:spruce_fence[east=false,north=false,south=false,west=false,waterlogged=false]';
const DOOR_L = (f) => `minecraft:spruce_door[facing=${f},half=lower,hinge=left,open=false,powered=false]`;
const DOOR_U = (f) => `minecraft:spruce_door[facing=${f},half=upper,hinge=left,open=false,powered=false]`;
const LANTERN = 'minecraft:lantern[hanging=true,waterlogged=false]';
const LANTERN_UP = 'minecraft:lantern[hanging=false,waterlogged=false]';
const GRASS = 'minecraft:grass_block[snowy=false]';
const DIRT = 'minecraft:dirt';
const AIR = 'minecraft:air';

const stair = (facing, half = 'bottom') =>
  `minecraft:spruce_stairs[facing=${facing},half=${half},shape=straight,waterlogged=false]`;
const stoneStair = (facing, half = 'bottom') =>
  `minecraft:stone_brick_stairs[facing=${facing},half=${half},shape=straight,waterlogged=false]`;
const slab = (type = 'bottom') => `minecraft:spruce_slab[type=${type},waterlogged=false]`;
const stoneSlab = (type = 'bottom') => `minecraft:stone_brick_slab[type=${type},waterlogged=false]`;
const trap = (facing) =>
  `minecraft:spruce_trapdoor[facing=${facing},half=bottom,open=true,powered=false,waterlogged=false]`;
const trapClosed = (facing) =>
  `minecraft:spruce_trapdoor[facing=${facing},half=top,open=false,powered=false,waterlogged=false]`;
function hash(x, y, z) {
  return Math.abs((x * 73856093) ^ (y * 19349663) ^ (z * 83492791));
}

function stoneMix(x, y, z) {
  const n = hash(x, y, z);
  if (y <= GY + 1) {
    if (n % 5 === 0) return MOSSY;
    if (n % 3 === 0) return COBBLE;
    return BRICK;
  }
  if (n % 17 === 0) return MOSSY;
  if (n % 11 === 0) return ANDESITE;
  if (n % 7 === 0) return STONE;
  if (n % 5 === 0) return BRICK_CRACK;
  if (n % 13 === 0) return BRICK_MOSS;
  if (n % 3 === 0) return COBBLE;
  return BRICK;
}

function fenceConnect(n, e, s, w) {
  return `minecraft:spruce_fence[east=${e},north=${n},south=${s},west=${w},waterlogged=false]`;
}

const MANOR_PATH = '/Users/taylormanning/Downloads/Ironcrest_Grand_Manor_Original.schem';
const manor = await parseToGrid(MANOR_PATH);
const MANOR_W = manor.width;
const MANOR_H = manor.height;
const MANOR_L = manor.length;
const OX = 1 + Math.floor((SIZE - MANOR_W) / 2);
const OZ = 1 + Math.floor((SIZE - MANOR_L) / 2);

const mid = Math.floor((X0 + X1) / 2);

// Little Bastion gatehouse — flipped 180° so the door faces north (outside).
// Wall is gapped to fit; building is not hollowed (you'll do that).
const BASTION_PATH = '/Users/taylormanning/Downloads/Little_Bastion_Original.schem';
const bastion = await parseToGrid(BASTION_PATH);
const BW = bastion.width; // 15
const BH = bastion.height; // 15
const BL = bastion.length; // 11
const BOX = mid - Math.floor(BW / 2); // centered on the north wall
// After 180° flip, door is at local z=1 facing north; push the house further outside
const BOZ = Z0 - 5;

const towers = [
  { x0: X0, x1: X0 + TOWER - 1, z0: Z0, z1: Z0 + TOWER - 1, doorFace: 'east' },
  { x0: X1 - TOWER + 1, x1: X1, z0: Z0, z1: Z0 + TOWER - 1, doorFace: 'west' },
  { x0: X0, x1: X0 + TOWER - 1, z0: Z1 - TOWER + 1, z1: Z1, doorFace: 'east' },
  { x0: X1 - TOWER + 1, x1: X1, z0: Z1 - TOWER + 1, z1: Z1, doorFace: 'west' },
];

const PAD = 10; // room for bastion outside the north wall + tower overhangs
const UNDER = 5; // buried pipes / cables / battery sit below grass
const width = X1 - X0 + 1 + PAD * 2;
const length = Z1 - Z0 + 1 + PAD * 2;
const height = Math.max(TOWER_TOP + 4, GY - 1 + MANOR_H, GY - 1 + BH) + UNDER;
const grid = new BlockGrid(width, height, length);

function set(x, y, z, state) {
  grid.set(x - X0 + PAD, y + UNDER, z - Z0 + PAD, state);
}

function onPerimeter(x, z) {
  return x === X0 || x === X1 || z === Z0 || z === Z1;
}

function inBastion(x, z) {
  return x >= BOX && x < BOX + BW && z >= BOZ && z < BOZ + BL;
}

// After the 180° flip, the gatehouse side walls sit at these X on the curtain line.
// Only the opening BETWEEN them should stay clear of curtain wall.
const BASTION_SIDE_W = BOX + (BW - 1 - 12); // 65
const BASTION_SIDE_E = BOX + (BW - 1 - 2); // 75
function inBastionGateOpening(x, z) {
  return z === Z0 && x > BASTION_SIDE_W && x < BASTION_SIDE_E;
}

function inTower(x, z) {
  return towers.some((t) => x >= t.x0 && x <= t.x1 && z >= t.z0 && z <= t.z1);
}

function isPilaster(x, z) {
  if (x === X0 || x === X1) return z % 7 === 0;
  if (z === Z0 || z === Z1) return x % 7 === 0;
  return false;
}

function merlon(x, z) {
  if (x === X0 || x === X1) return (z % 2) === 0;
  if (z === Z0 || z === Z1) return (x % 2) === 0;
  return false;
}

// Ground
for (let z = Z0; z <= Z1; z++) {
  for (let x = X0; x <= X1; x++) {
    set(x, GY - 1, z, DIRT);
    set(x, GY, z, GRASS);
  }
}

// Curtain wall — stone mix, spruce pilasters, timber walk & battlements
// Runs into the bastion side walls; only the gate opening between them is left clear
for (let z = Z0; z <= Z1; z++) {
  for (let x = X0; x <= X1; x++) {
    if (!onPerimeter(x, z) || inTower(x, z) || inBastionGateOpening(x, z)) continue;

    const pilaster = isPilaster(x, z);
    set(x, GY, z, pilaster ? LOG : stoneMix(x, GY, z));
    for (let y = GY + 1; y <= GY + WALL_H; y++) {
      if (pilaster) set(x, y, z, LOG);
      else if (y === GY + WALL_H) set(x, y, z, BRICK); // stone-brick crown course
      else if (y === GY + 3) set(x, y, z, hash(x, y, z) % 4 === 0 ? PLANK : stoneMix(x, y, z)); // timber band
      else set(x, y, z, stoneMix(x, y, z));
    }

    // Merlons — stone brick with spruce fence between
    if (merlon(x, z)) set(x, GY + WALL_H + 1, z, BRICK);
    else set(x, GY + WALL_H + 1, z, FENCE);

    // Inner wooden wall-walk (one block inside the curtain)
    let wx = x;
    let wz = z;
    if (x === X0) wx = X0 + 1;
    if (x === X1) wx = X1 - 1;
    if (z === Z0) wz = Z0 + 1;
    if (z === Z1) wz = Z1 - 1;
    if (!inTower(wx, wz) && !inBastion(wx, wz) && !onPerimeter(wx, wz)) {
      set(wx, GY + WALL_H, wz, slab('bottom'));
    }
  }
}

// ── Little Bastion gatehouse — 180° flip, no other edits (you'll hollow it) ──
function flipFacing180(facing) {
  return { north: 'south', south: 'north', east: 'west', west: 'east' }[facing] || facing;
}

function flipBastionState(state) {
  if (state.includes('_fence[')) {
    const p = Object.fromEntries(
      state
        .slice(state.indexOf('[') + 1, -1)
        .split(',')
        .map((s) => s.split('=')),
    );
    const id = state.slice(0, state.indexOf('['));
    return `${id}[east=${p.west},north=${p.south},south=${p.north},west=${p.east},waterlogged=${p.waterlogged || 'false'}]`;
  }
  if (state.includes('facing=')) {
    return state.replace(/facing=([a-z]+)/, (_, f) => `facing=${flipFacing180(f)}`);
  }
  return state;
}

let bastionBlocks = 0;
for (let y = 0; y < BH; y++) {
  for (let z = 0; z < BL; z++) {
    for (let x = 0; x < BW; x++) {
      const state = bastion.get(x, y, z);
      if (!state || state === AIR) continue;
      const wx = BOX + (BW - 1 - x);
      const wz = BOZ + (BL - 1 - z);
      set(wx, GY - 1 + y, wz, flipBastionState(state));
      bastionBlocks++;
    }
  }
}

// Finish the join: bond the curtain into the bastion side walls with matching stone
for (const sideX of [BASTION_SIDE_W, BASTION_SIDE_E]) {
  set(sideX, GY, Z0, BRICK);
  for (let y = GY + 1; y <= GY + WALL_H; y++) set(sideX, y, Z0, stoneMix(sideX, y, Z0));
  set(sideX, GY + WALL_H + 1, Z0, BRICK);
  // Carry a short return into the bastion face so the wall reads as built into the house
  for (const dz of [-1, 1]) {
    const z = Z0 + dz;
    if (!inBastion(sideX, z)) continue;
    for (let y = GY; y <= GY + WALL_H; y++) {
      // Don't overwrite bastion air/doors in the opening — only reinforce the side pier
      set(sideX, y, z, y === GY ? BRICK : stoneMix(sideX, y, z));
    }
  }
}

// Guard towers — sealed 7×7 keeps with easy stone-brick spiral stairs
for (const t of towers) {
  const { x0, x1, z0, z1, doorFace } = t;
  const cx = Math.floor((x0 + x1) / 2);
  const cz = Math.floor((z0 + z1) / 2);
  const ix0 = x0 + 1;
  const ix1 = x1 - 1;
  const iz0 = z0 + 1;
  const iz1 = z1 - 1;
  const corners = [
    [x0, z0],
    [x1, z0],
    [x0, z1],
    [x1, z1],
  ];
  const floorYs = [GY, GY + WALL_H, GY + 11, TOWER_TOP];

  // 1. Solid fill, then hollow the interior (walls stay 1 thick)
  for (let z = z0; z <= z1; z++) {
    for (let x = x0; x <= x1; x++) {
      for (let y = GY; y <= TOWER_TOP; y++) set(x, y, z, stoneMix(x, y, z));
    }
  }
  for (let z = iz0; z <= iz1; z++) {
    for (let x = ix0; x <= ix1; x++) {
      for (let y = GY + 1; y <= TOWER_TOP; y++) set(x, y, z, AIR);
      set(x, GY, z, BRICK);
    }
  }

  // 2. Spiral stair path around the 5×5 interior (16 steps / revolution)
  const spiral = [];
  for (let x = ix0; x < ix1; x++) spiral.push([x, iz0, 'east']);
  for (let z = iz0; z < iz1; z++) spiral.push([ix1, z, 'south']);
  for (let x = ix1; x > ix0; x--) spiral.push([x, iz1, 'west']);
  for (let z = iz1; z > iz0; z--) spiral.push([ix0, z, 'north']);

  const stairCells = new Set();
  for (let y = GY + 1; y <= TOWER_TOP; y++) {
    const [sx, sz, facing] = spiral[(y - (GY + 1)) % spiral.length];
    set(sx, y, sz, stoneStair(facing));
    stairCells.add(`${sx},${y},${sz}`);
    // Clear headroom above each step
    if (y + 1 <= TOWER_TOP + 1) {
      const above = `${sx},${y + 1},${sz}`;
      if (!stairCells.has(above)) set(sx, y + 1, sz, AIR);
    }
  }

  // 3. Floors on landings — leave stair cells open so you can walk through
  for (const fy of floorYs) {
    if (fy === GY) continue;
    for (let z = iz0; z <= iz1; z++) {
      for (let x = ix0; x <= ix1; x++) {
        if (stairCells.has(`${x},${fy},${z}`)) continue;
        // Also leave the cell above the stair below clear (landing hatch)
        if (stairCells.has(`${x},${fy - 1},${z}`)) continue;
        set(x, fy, z, fy === TOWER_TOP ? PLANK : BRICK);
      }
    }
  }

  // 4. Spruce corner posts
  for (const [x, z] of corners) {
    for (let y = GY; y <= TOWER_TOP + 2; y++) set(x, y, z, LOG);
  }

  // 5. Timber bands on the outer shell only (corners stay vertical logs)
  for (const bandY of [GY + 3, GY + WALL_H, GY + 11, TOWER_TOP]) {
    for (let x = x0 + 1; x <= x1 - 1; x++) {
      set(x, bandY, z0, LOG_X);
      set(x, bandY, z1, LOG_X);
    }
    for (let z = z0 + 1; z <= z1 - 1; z++) {
      set(x0, bandY, z, LOG_Z);
      set(x1, bandY, z, LOG_Z);
    }
  }

  // 6. Courtyard door (framed)
  let doorX = cx;
  let doorZ = cz;
  if (doorFace === 'east') doorX = x1;
  else if (doorFace === 'west') doorX = x0;
  else if (doorFace === 'south') doorZ = z1;
  else doorZ = z0;
  set(doorX, GY + 1, doorZ, DOOR_L(doorFace));
  set(doorX, GY + 2, doorZ, DOOR_U(doorFace));
  // Stone frame beside the door
  if (doorFace === 'east' || doorFace === 'west') {
    set(doorX, GY + 1, doorZ - 1, BRICK);
    set(doorX, GY + 2, doorZ - 1, BRICK);
    set(doorX, GY + 1, doorZ + 1, BRICK);
    set(doorX, GY + 2, doorZ + 1, BRICK);
    set(doorX, GY + 3, doorZ, LOG_X);
  }

  // 7. Wall-walk doors on the faces that meet the curtain (floor stays solid)
  const walkDoorY = GY + WALL_H + 1;
  const walkOpenings = [];
  if (x0 === X0 && z0 === Z0) {
    walkOpenings.push([x1, cz, 'east'], [cx, z1, 'south']); // NW
  } else if (x1 === X1 && z0 === Z0) {
    walkOpenings.push([x0, cz, 'west'], [cx, z1, 'south']); // NE
  } else if (x0 === X0 && z1 === Z1) {
    walkOpenings.push([x1, cz, 'east'], [cx, z0, 'north']); // SW
  } else if (x1 === X1 && z1 === Z1) {
    walkOpenings.push([x0, cz, 'west'], [cx, z0, 'north']); // SE
  }
  for (const [wx, wz, face] of walkOpenings) {
    if (wx === doorX && wz === doorZ) continue;
    set(wx, walkDoorY, wz, DOOR_L(face));
    set(wx, walkDoorY + 1, wz, DOOR_U(face));
    set(wx, GY + WALL_H, wz, BRICK);
  }

  // 8. Arrow slits — single-block fence windows with solid frame around
  for (const [sx, sz] of [
    [x0, cz],
    [x1, cz],
    [cx, z0],
    [cx, z1],
  ]) {
    const outer =
      (sx === x0 && x0 === X0) ||
      (sx === x1 && x1 === X1) ||
      (sz === z0 && z0 === Z0) ||
      (sz === z1 && z1 === Z1);
    if (!outer) continue;
    if (sx === doorX && sz === doorZ) continue;
    for (const sy of [GY + 4, GY + 9, GY + 13]) {
      set(sx, sy, sz, FENCE);
      // Reinstate solid above/below so the slit is a clean window, not a gap column
      set(sx, sy - 1, sz, BRICK);
      set(sx, sy + 1, sz, BRICK);
    }
  }

  // 9. Center hanging lanterns (where air remains)
  for (const fy of [GY + WALL_H - 1, GY + 10, TOWER_TOP - 1]) {
    if (!stairCells.has(`${cx},${fy},${cz}`)) set(cx, fy, cz, LANTERN);
  }

  // 10. Lookout deck — full planks, corner posts, overhang, sealed rail
  for (let z = z0; z <= z1; z++) {
    for (let x = x0; x <= x1; x++) set(x, TOWER_TOP + 1, z, PLANK);
  }
  for (const [x, z] of corners) set(x, TOWER_TOP + 1, z, LOG);

  for (let x = x0; x <= x1; x++) {
    set(x, TOWER_TOP + 1, z0 - 1, stair('north'));
    set(x, TOWER_TOP + 1, z1 + 1, stair('south'));
  }
  for (let z = z0; z <= z1; z++) {
    set(x0 - 1, TOWER_TOP + 1, z, stair('west'));
    set(x1 + 1, TOWER_TOP + 1, z, stair('east'));
  }
  // Corner overhang fillers
  set(x0 - 1, TOWER_TOP + 1, z0 - 1, trapClosed('north'));
  set(x1 + 1, TOWER_TOP + 1, z0 - 1, trapClosed('north'));
  set(x0 - 1, TOWER_TOP + 1, z1 + 1, trapClosed('south'));
  set(x1 + 1, TOWER_TOP + 1, z1 + 1, trapClosed('south'));

  // Continuous fence rail on the deck rim
  for (let x = x0 + 1; x <= x1 - 1; x++) {
    set(x, TOWER_TOP + 2, z0, fenceConnect(false, true, false, true));
    set(x, TOWER_TOP + 2, z1, fenceConnect(false, true, false, true));
  }
  for (let z = z0 + 1; z <= z1 - 1; z++) {
    set(x0, TOWER_TOP + 2, z, fenceConnect(true, false, true, false));
    set(x1, TOWER_TOP + 2, z, fenceConnect(true, false, true, false));
  }
  // Outer trapdoor shutters for the battlement look
  for (let x = x0 + 1; x <= x1 - 1; x += 2) {
    set(x, TOWER_TOP + 2, z0 - 1, trap('north'));
    set(x, TOWER_TOP + 2, z1 + 1, trap('south'));
  }
  for (let z = z0 + 1; z <= z1 - 1; z += 2) {
    set(x0 - 1, TOWER_TOP + 2, z, trap('west'));
    set(x1 + 1, TOWER_TOP + 2, z, trap('east'));
  }
  for (const [x, z] of corners) {
    set(x, TOWER_TOP + 2, z, LOG);
    set(x, TOWER_TOP + 3, z, stoneSlab('bottom'));
  }
  set(cx, TOWER_TOP + 2, cz, LOG);
  set(cx, TOWER_TOP + 3, cz, LANTERN_UP);
}

// Paste Ironcrest Grand Manor (non-air; y=0 aligns with dirt)
let pasted = 0;
for (let y = 0; y < MANOR_H; y++) {
  for (let z = 0; z < MANOR_L; z++) {
    for (let x = 0; x < MANOR_W; x++) {
      const state = manor.get(x, y, z);
      if (!state || state === AIR) continue;
      set(OX + x, y, OZ + z, state);
      pasted++;
    }
  }
}

// Manor bounds
const MX0 = OX;
const MX1 = OX + MANOR_W - 1;
const MZ0 = OZ;
const MZ1 = OZ + MANOR_L - 1;

// ── Hydrofarm kitchens → labeled pantry chests (all pipes buried) ───────────
const DIRT_PATH = 'minecraft:dirt_path';
const HATCH =
  'minecraft:spruce_trapdoor[facing=south,half=bottom,open=false,powered=false,waterlogged=false]';
const LIGHT = 'minecraft:light[level=15,waterlogged=false]';
const PIPE_Y = GY - 2; // item pipes
const WATER_Y = GY - 3; // liquid pipes one layer deeper
const CABLE = 'energizedpower:copper_cable';
const PANEL = 'energizedpower:solar_panel_4';
const EP_LAMP = 'energizedpower:powered_lamp[level=0]';
const BATTERY = 'energizedpower:battery_box[facing=north]';

function schemPos(x, y, z) {
  return [x - X0 + PAD, y + UNDER, z - Z0 + PAD];
}

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

function plantBed(x, y, z, seed) {
  set(
    x,
    y,
    z,
    'hydrofarm:hydroponics_bed[east=false,north=false,planter_ne=true,planter_nw=true,planter_se=true,planter_sw=true,south=false,west=false]',
  );
  const tags = [];
  for (let q = 0; q < 4; q++) {
    tags.push({ type: 'byte', name: `Installed_${q}`, value: 1 });
    tags.push({ type: 'string', name: `Seed_${q}`, value: seed });
    tags.push({ type: 'int', name: `Growth_${q}`, value: 0 });
  }
  grid.blockEntities.push({
    type: 'hydrofarm_bed',
    pos: schemPos(x, y, z),
    id: 'hydrofarm:hydroponics_bed',
    tags,
  });
}

function namedChest(x, y, z, facing, label) {
  set(x, y, z, `minecraft:chest[facing=${facing},type=single,waterlogged=false]`);
  grid.blockEntities.push({
    type: 'chest',
    pos: schemPos(x, y, z),
    id: 'minecraft:chest',
    items: [],
    tags: [{ type: 'string', name: 'CustomName', value: JSON.stringify({ text: label }) }],
  });
}

function namedBarrel(x, y, z, facing, label, items) {
  set(x, y, z, `minecraft:barrel[facing=${facing},open=false]`);
  grid.blockEntities.push({
    type: 'barrel',
    pos: schemPos(x, y, z),
    id: 'minecraft:barrel',
    items,
    tags: [{ type: 'string', name: 'CustomName', value: JSON.stringify({ text: label }) }],
  });
}

// Pantry: labeled chests on a south-facing interior wall of Ironcrest
const PANTRY_LX = 25; // manor-local
const PANTRY_LZ = 47;
const pantryX0 = OX + PANTRY_LX;
const pantryZ = OZ + PANTRY_LZ;
const pantryY = 2; // standing chest height on manor floor
const pantryCrops = [
  { name: 'Wheat', seed: 'minecraft:wheat_seeds', dx: 0 },
  { name: 'Carrot', seed: 'minecraft:carrot', dx: 1 },
  { name: 'Potato', seed: 'minecraft:potato', dx: 2 },
  { name: 'Beetroot', seed: 'minecraft:beetroot_seeds', dx: 3 },
];

// Item spine under the manor, liquid spine one block west
const itemSpine = mid;
const liquidSpine = mid - 1;

/**
 * Hydrofarm kitchen — 10×10 beds (bigger than the shrunk 8×8).
 * In-ground solar border flush around the path; cables buried.
 */
function placeHydroFarm(cx, cz, seed, cropName) {
  const BED = 12; // bigger than the shrunk 8×8
  const x0 = cx - Math.floor(BED / 2);
  const z0 = cz - Math.floor(BED / 2);
  const x1 = x0 + BED - 1;
  const z1 = z0 + BED - 1;
  const P = 2; // path ring
  const SOLAR = P + 1; // flush panel ring just outside the path
  const pad = SOLAR + 1; // grass fringe outside panels

  const panelSpots = [];

  for (let z = z0 - pad; z <= z1 + pad; z++) {
    for (let x = x0 - pad; x <= x1 + pad; x++) {
      const onBed = x >= x0 && x <= x1 && z >= z0 && z <= z1;
      const onPath = x >= x0 - P && x <= x1 + P && z >= z0 - P && z <= z1 + P;
      const onSolar =
        !onBed &&
        !onPath &&
        x >= x0 - SOLAR &&
        x <= x1 + SOLAR &&
        z >= z0 - SOLAR &&
        z <= z1 + SOLAR;
      set(x, GY - 1, z, DIRT);
      if (onBed) {
        plantBed(x, GY, z, seed);
        if ((x + z) % 4 === 0) set(x, GY + 1, z, LIGHT);
        const edgeN = z === z0;
        const edgeS = z === z1;
        const edgeW = x === x0;
        const edgeE = x === x1;
        set(
          x,
          PIPE_Y,
          z,
          itemPipe({
            up: 'extract',
            north: edgeN ? 'none' : 'pipe',
            south: edgeS ? 'none' : 'pipe',
            west: edgeW ? 'none' : 'pipe',
            east: edgeE ? 'none' : 'pipe',
          }),
        );
      } else if (onPath) {
        set(x, GY, z, DIRT_PATH);
      } else if (onSolar) {
        // In-ground: panel sits at lawn level on buried cable (no raised terrace)
        set(x, GY - 1, z, BRICK);
        panelSpots.push([x, z]);
      } else {
        set(x, GY, z, GRASS);
      }
    }
  }

  // Corner posts on the path ring
  for (const [x, z] of [
    [x0 - P, z0 - P],
    [x1 + P, z0 - P],
    [x0 - P, z1 + P],
    [x1 + P, z1 + P],
  ]) {
    set(x, GY, z, LOG);
    set(x, GY + 1, z, FENCE);
  }

  // Water tank on the east edge — liquid buried (branch north of beds, then rise into tank)
  const tankX = x1 + 1;
  const tankZ = z0 + Math.floor(BED / 2);
  const liquidZ = z0 - 1;
  set(tankX, GY, tankZ, 'hydrofarm:liquid_tank[down=false,east=false,north=false,south=false,up=true,west=false]');
  set(tankX, GY + 1, tankZ, 'hydrofarm:liquid_tank[down=true,east=false,north=false,south=false,up=false,west=false]');
  for (let z = liquidZ; z <= tankZ; z++) {
    set(
      tankX,
      WATER_Y,
      z,
      liquidPipe({
        north: z > liquidZ ? 'pipe' : 'none',
        south: z < tankZ ? 'pipe' : 'none',
        west: z === liquidZ ? 'pipe' : 'none',
        up: z === tankZ ? 'pipe' : 'none',
      }),
    );
  }
  // Rise WATER_Y → PIPE_Y → GY-1, insert into tank at GY
  set(tankX, PIPE_Y, tankZ, liquidPipe({ down: 'pipe', up: 'pipe' }));
  set(tankX, GY - 1, tankZ, liquidPipe({ down: 'pipe', up: 'insert' }));

  // Supply barrel under a hatch
  namedBarrel(x0 - 1, GY, z0 - 1, 'up', `${cropName} supplies`, [
    { slot: 0, id: 'hydrofarm:hydrofarm_planter', count: 16 },
    { slot: 1, id: seed, count: 64 },
    { slot: 2, id: seed, count: 64 },
  ]);
  set(x0 - 1, GY + 1, z0 - 1, HATCH);

  // Item run along the NORTH bed row to the spine — keep extract on every bed cell.
  const jx = x0;
  const jz = z0;
  const step = jx > itemSpine ? -1 : 1;
  for (let x = jx; step < 0 ? x >= itemSpine : x <= itemSpine; x += step) {
    const underBed = x >= x0 && x <= x1;
    const atSpine = x === itemSpine;
    const faces = {
      up: underBed ? 'extract' : 'none',
      north: atSpine ? 'pipe' : 'none',
      south: atSpine || underBed ? 'pipe' : 'none',
      east: 'none',
      west: 'none',
    };
    if (step > 0) {
      faces.east = atSpine ? 'none' : 'pipe';
      faces.west = x === jx ? 'none' : 'pipe';
    } else {
      faces.west = atSpine ? 'none' : 'pipe';
      faces.east = x === jx ? 'none' : 'pipe';
    }
    set(x, PIPE_Y, jz, itemPipe(faces));
  }

  // Liquid branch from spine to this garden (exclude tankX — Z-run owns that column)
  const lStep = tankX > liquidSpine ? 1 : -1;
  for (let x = liquidSpine; lStep > 0 ? x < tankX : x > tankX; x += lStep) {
    const atSpine = x === liquidSpine;
    const towardTank = lStep > 0 ? 'east' : 'west';
    const towardSpine = lStep > 0 ? 'west' : 'east';
    const faces = {
      north: atSpine ? 'pipe' : 'none',
      south: atSpine ? 'pipe' : 'none',
      east: 'none',
      west: 'none',
    };
    faces[towardTank] = 'pipe';
    if (!atSpine) faces[towardSpine] = 'pipe';
    set(x, WATER_Y, liquidZ, liquidPipe(faces));
  }

  return { cropName, cx, cz, jz, liquidZ, tankX, panelSpots };
}

// Lawn quadrant centers — mirrored; clear of corner towers
const FARM_A = 22;
const FARM_B = 118;
const gardens = [
  { cx: FARM_A, cz: FARM_A, seed: 'minecraft:wheat_seeds', name: 'Wheat' },
  { cx: FARM_B, cz: FARM_A, seed: 'minecraft:carrot', name: 'Carrot' },
  { cx: FARM_A, cz: FARM_B, seed: 'minecraft:potato', name: 'Potato' },
  { cx: FARM_B, cz: FARM_B, seed: 'minecraft:beetroot_seeds', name: 'Beetroot' },
];
const farmMeta = gardens.map((g) => placeHydroFarm(g.cx, g.cz, g.seed, g.name));

// ── Stone pathways (player style from the gate: 3-wide bricks + stair curbs) ─
const pathStair = (facing) =>
  `minecraft:stone_brick_stairs[facing=${facing},half=bottom,shape=straight,waterlogged=false]`;

function surfaceAt(x, z) {
  return grid.get(x - X0 + PAD, GY + UNDER, z - Z0 + PAD) || '';
}

function canPave(x, z) {
  if (x <= X0 || x >= X1 || z <= Z0 || z >= Z1) return false;
  if (inTower(x, z)) return false;
  if (x >= MX0 && x <= MX1 && z >= MZ0 && z <= MZ1) return false;
  const here = surfaceAt(x, z);
  if (
    here.includes('hydroponics') ||
    here.includes('solar_panel') ||
    here.includes('liquid_tank') ||
    here.includes('barrel') ||
    here.includes('chest') ||
    here.includes('door') ||
    here.includes('glass') ||
    here.includes('ladder')
  ) {
    return false;
  }
  // Through the bastion courtyard: only pave lawn, never the building shell
  if (inBastion(x, z)) {
    if (
      here.includes('spruce') ||
      here.includes('plank') ||
      here.includes('fence') ||
      here.includes('lantern') ||
      (here.includes('stone') && !here.includes('grass') && !here.includes('dirt'))
    ) {
      return false;
    }
  }
  return true;
}

function paveCell(x, z, kind = 'brick', facing = 'north') {
  if (!canPave(x, z)) return;
  set(x, GY - 1, z, BRICK);
  set(x, GY, z, kind === 'stair' ? pathStair(facing) : BRICK);
  set(x, GY + 1, z, AIR); // clear grass / crop light sitting on the old lawn
}

function paveNS(xCenter, z0, z1) {
  const a = Math.min(z0, z1);
  const b = Math.max(z0, z1);
  for (let z = a; z <= b; z++) {
    paveCell(xCenter - 1, z, 'brick');
    paveCell(xCenter, z, 'brick');
    paveCell(xCenter + 1, z, 'brick');
    paveCell(xCenter - 2, z, 'stair', 'west');
    paveCell(xCenter + 2, z, 'stair', 'east');
  }
}

function paveEW(zCenter, x0, x1) {
  const a = Math.min(x0, x1);
  const b = Math.max(x0, x1);
  for (let x = a; x <= b; x++) {
    paveCell(x, zCenter - 1, 'brick');
    paveCell(x, zCenter, 'brick');
    paveCell(x, zCenter + 1, 'brick');
    paveCell(x, zCenter - 2, 'stair', 'north');
    paveCell(x, zCenter + 2, 'stair', 'south');
  }
}

// Main drive — gate → manor → south lawn
paveNS(mid, Z0 + 3, MZ0 - 2);
paveEW(MZ0 - 4, MX0 - 2, MX1 + 2);
paveNS(MX0 - 4, MZ0 - 2, MZ1 + 2);
paveNS(MX1 + 4, MZ0 - 2, MZ1 + 2);
paveEW(MZ1 + 4, MX0 - 4, MX1 + 4);
paveNS(mid, MZ1 + 4, Z1 - 10);

// Garden wraps — 5-wide stone path just outside each solar ring (touches the square)
const BED = 12;
const SOLAR_R = 3; // matches placeHydroFarm SOLAR
function gardenPathRing(cx, cz) {
  const x0 = cx - Math.floor(BED / 2);
  const z0 = cz - Math.floor(BED / 2);
  const x1 = x0 + BED - 1;
  const z1 = z0 + BED - 1;
  // Path center with a grass gap so lantern pairs fit both sides without eating solar
  const w = x0 - SOLAR_R - 5;
  const e = x1 + SOLAR_R + 5;
  const n = z0 - SOLAR_R - 5;
  const s = z1 + SOLAR_R + 5;
  paveEW(n, w, e);
  paveEW(s, w, e);
  paveNS(w, n, s);
  paveNS(e, n, s);
  return { w, e, n, s, cx, cz };
}

const nwRing = gardenPathRing(FARM_A, FARM_A);
const neRing = gardenPathRing(FARM_B, FARM_A);
const swRing = gardenPathRing(FARM_A, FARM_B);
const seRing = gardenPathRing(FARM_B, FARM_B);

// Link the four squares into one grid (paths continue between gardens)
paveEW(nwRing.n, nwRing.e, neRing.w);
paveEW(nwRing.s, nwRing.e, neRing.w);
paveEW(swRing.n, swRing.e, seRing.w);
paveEW(swRing.s, swRing.e, seRing.w);
paveNS(nwRing.w, nwRing.s, swRing.n);
paveNS(nwRing.e, nwRing.s, swRing.n);
paveNS(neRing.w, neRing.s, seRing.n);
paveNS(neRing.e, neRing.s, seRing.n);

// Tie garden grid into the manor loop / center drive
paveEW(nwRing.s, nwRing.e, mid);
paveEW(neRing.s, mid, neRing.w);
paveEW(swRing.n, swRing.e, mid);
paveEW(seRing.n, mid, seRing.w);
paveNS(nwRing.e, nwRing.s, MZ0 - 4);
paveNS(neRing.w, neRing.s, MZ0 - 4);
paveNS(swRing.e, MZ1 + 4, swRing.n);
paveNS(seRing.w, MZ1 + 4, seRing.n);

// Item spine under the drive / manor into the pantry wall
const joinZs = farmMeta.map((f) => f.jz);
const spineZ0 = Math.min(...joinZs, pantryZ);
const spineZ1 = Math.max(...joinZs, pantryZ);
for (let z = spineZ0; z <= spineZ1; z++) {
  set(itemSpine, PIPE_Y, z, itemPipe({ north: 'pipe', south: 'pipe' }));
}
for (const jz of joinZs) {
  set(itemSpine, PIPE_Y, jz, itemPipe({ north: 'pipe', south: 'pipe', east: 'pipe', west: 'pipe' }));
}

// Lateral into pantry, then up into each labeled chest
const pantryEnd = pantryX0 + 3;
for (let x = Math.min(itemSpine, pantryX0); x <= Math.max(itemSpine, pantryEnd); x++) {
  set(
    x,
    PIPE_Y,
    pantryZ,
    itemPipe({
      east: x < Math.max(itemSpine, pantryEnd) ? 'pipe' : 'none',
      west: x > Math.min(itemSpine, pantryX0) ? 'pipe' : 'none',
      north: x === itemSpine ? 'pipe' : 'none',
      south: x === itemSpine ? 'pipe' : 'none',
      up: x >= pantryX0 && x <= pantryEnd ? 'pipe' : 'none',
    }),
  );
}
for (const c of pantryCrops) {
  const x = pantryX0 + c.dx;
  set(x, GY - 1, pantryZ, itemPipe({ down: 'pipe', up: 'pipe' }));
  set(x, GY, pantryZ, itemPipe({ down: 'pipe', up: 'insert' }));
  namedChest(x, pantryY, pantryZ, 'south', c.name);
}

// Cistern + liquid spine (buried). Stay off the item-pipe spine at (mid, PIPE_Y,*)
// by crossing under mid on WATER_Y only.
const cisternX = mid + 2;
const cisternZ = Math.floor((MZ0 + MZ1) / 2);
set(cisternX, WATER_Y - 1, cisternZ, 'minecraft:water[level=0]');
set(cisternX, WATER_Y, cisternZ, 'hydrofarm:liquid_siphon');
// Extract above the siphon, then drop under the item spine to reach liquidSpine
set(cisternX, PIPE_Y, cisternZ, liquidPipe({ down: 'extract', west: 'pipe' }));
set(mid + 1, PIPE_Y, cisternZ, liquidPipe({ east: 'pipe', down: 'pipe' }));
set(mid + 1, WATER_Y, cisternZ, liquidPipe({ up: 'pipe', west: 'pipe' }));
set(mid, WATER_Y, cisternZ, liquidPipe({ east: 'pipe', west: 'pipe' })); // under item spine
set(liquidSpine, WATER_Y, cisternZ, liquidPipe({ east: 'pipe', north: 'pipe', south: 'pipe' }));

const liquidZMin = Math.min(...farmMeta.map((f) => f.liquidZ), cisternZ);
const liquidZMax = Math.max(...farmMeta.map((f) => f.liquidZ), cisternZ);
for (let z = liquidZMin; z <= liquidZMax; z++) {
  if (z === cisternZ) continue; // already set with east junction
  set(liquidSpine, WATER_Y, z, liquidPipe({ north: 'pipe', south: 'pipe' }));
}
for (const f of farmMeta) {
  set(liquidSpine, WATER_Y, f.liquidZ, liquidPipe({ north: 'pipe', south: 'pipe', east: 'pipe', west: 'pipe' }));
}

// ── In-ground solar rings around each garden → buried battery → house lamps ─
const powerNodes = new Set();
const cableCells = [];
function powerKey(x, y, z) {
  return `${x},${y},${z}`;
}
function addCable(x, y, z) {
  const k = powerKey(x, y, z);
  if (powerNodes.has(k)) return;
  powerNodes.add(k);
  cableCells.push([x, y, z]);
}
function addPowerMachine(x, y, z, state) {
  set(x, y, z, state);
  powerNodes.add(powerKey(x, y, z));
}
function nearPower(x, y, z) {
  return powerNodes.has(powerKey(x, y, z));
}
function flushCables() {
  for (const [x, y, z] of cableCells) {
    const bit = (v) => (v ? 'true' : 'false');
    set(
      x,
      y,
      z,
      `${CABLE}[down=${bit(nearPower(x, y - 1, z))},east=${bit(nearPower(x + 1, y, z))},north=${bit(nearPower(x, y, z - 1))},south=${bit(nearPower(x, y, z + 1))},up=${bit(nearPower(x, y + 1, z))},west=${bit(nearPower(x - 1, y, z))}]`,
    );
  }
}

// Cables live at GY-4 so they never overwrite item pipes (GY-2) or liquid (GY-3)
const batY = GY - 4;
const cableY = GY - 4;
let panelCount = 0;

const dropZs = [];
for (const f of farmMeta) {
  if (!f.panelSpots.length) continue;
  // Flush panels around this garden
  for (const [x, z] of f.panelSpots) {
    addPowerMachine(x, GY, z, PANEL);
    addCable(x, GY - 1, z);
    panelCount++;
  }
  // Drop from the south edge of each ring into the buried cable grid
  // Skip GY-2 (item pipes) and GY-3 (liquid) — jump via GY-1 → GY-4 only if clear,
  // otherwise use a dedicated drop X just south of beds that has no pipes.
  const dropX = f.cx;
  const dropZ = Math.max(...f.panelSpots.map(([, z]) => z));
  dropZs.push(dropZ);
  addCable(dropX, GY - 1, dropZ);
  // Side-step one block south of the ring so the vertical drop misses farm pipes
  const dropZ2 = dropZ + 1;
  addCable(dropX, GY - 1, dropZ2);
  for (let y = GY - 1; y >= cableY; y--) addCable(dropX, y, dropZ2);
  addCable(dropX, cableY, dropZ);
  // Run to the estate mid spine on the cable layer only
  const step = dropX > mid ? -1 : 1;
  for (let x = dropX; step < 0 ? x >= mid : x <= mid; x += step) addCable(x, cableY, dropZ);
}

// Shared buried battery under the manor mid-line (between the four gardens)
const batX = mid;
const batZ = Math.floor((MZ0 + MZ1) / 2);
addPowerMachine(batX, batY, batZ, BATTERY);
addCable(batX, cableY, batZ);

// Tie garden drops into the N–S cable spine through the battery
const powerZ0 = Math.min(batZ, pantryZ - 1, ...(dropZs.length ? dropZs : [batZ]));
const powerZ1 = Math.max(batZ, pantryZ - 1, ...(dropZs.length ? dropZs : [batZ]));
for (let z = powerZ0; z <= powerZ1; z++) addCable(batX, cableY, z);

// Into the house — rise on pantryZ-1 (not pantryZ) so item inserts stay intact
const powerZ = pantryZ - 1;
const pantryMidX = pantryX0 + 1;
const lampXs = [pantryMidX - 3, pantryX0, pantryX0 + 1, pantryX0 + 2, pantryX0 + 3, pantryMidX + 4];
for (let x = Math.min(mid, ...lampXs); x <= Math.max(mid, ...lampXs); x++) {
  addCable(x, cableY, powerZ);
}
function riseToLamp(x, z) {
  for (let y = cableY; y <= pantryY; y++) addCable(x, y, z);
  addPowerMachine(x, pantryY + 1, z, EP_LAMP);
}
for (const lx of lampXs) riseToLamp(lx, powerZ);
flushCables();

// Re-stamp the item spine last so no cable/path write can eat it
for (let z = spineZ0; z <= spineZ1; z++) {
  set(itemSpine, PIPE_Y, z, itemPipe({ north: 'pipe', south: 'pipe' }));
}
for (const jz of joinZs) {
  set(itemSpine, PIPE_Y, jz, itemPipe({ north: 'pipe', south: 'pipe', east: 'pipe', west: 'pipe' }));
}
for (let x = Math.min(itemSpine, pantryX0); x <= Math.max(itemSpine, pantryEnd); x++) {
  set(
    x,
    PIPE_Y,
    pantryZ,
    itemPipe({
      east: x < Math.max(itemSpine, pantryEnd) ? 'pipe' : 'none',
      west: x > Math.min(itemSpine, pantryX0) ? 'pipe' : 'none',
      north: x === itemSpine ? 'pipe' : 'none',
      south: x === itemSpine ? 'pipe' : 'none',
      up: x >= pantryX0 && x <= pantryEnd ? 'pipe' : 'none',
    }),
  );
}
for (const c of pantryCrops) {
  const x = pantryX0 + c.dx;
  set(x, GY - 1, pantryZ, itemPipe({ down: 'pipe', up: 'pipe' }));
  set(x, GY, pantryZ, itemPipe({ down: 'pipe', up: 'insert' }));
}

writeSchematic(grid, 'plot40.schem', 5023);
console.log('plot40.schem');
console.log('interior', SIZE, 'x', SIZE);
console.log('outer', width, 'x', length, 'height', height);
console.log('towers', TOWER + 'x' + TOWER, 'h', TOWER_H, 'stone+spruce');
console.log('manor', MANOR_W, 'x', MANOR_L, 'at', OX, OZ, 'pasted', pasted);
console.log('outdoor lantern posts', 0);
console.log(
  'farms',
  farmMeta.map((f) => f.cropName).join(', '),
  '12x12 hydro + solar rings at',
  FARM_A,
  '&',
  FARM_B,
);
console.log('pantry chests at', pantryX0, pantryZ, '→', pantryCrops.map((c) => c.name).join(', '));
console.log('in-ground solar rings', panelCount, 'panels; battery buried at', batX, batY, batZ);
console.log('bastion gate', BW + 'x' + BL + 'x' + BH, 'at', BOX, BOZ, 'blocks', bastionBlocks);
console.log('blocks', grid.countNonAir());
