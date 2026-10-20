/**
 * Rebuild the solar-house main house from the other builds.
 *
 * Massing and rooms follow the enterable-house rules in ESTATE-NOTES
 * (real stair, set-back windows, no lanterns in the middle of a room).
 * Materials mix the spruce/oak cabin already on this pad, Biltmore dark oak
 * floors and deepslate roof, and the garden's stone brick.
 * Machines are the mod blocks that actually appear in the other schematics:
 *   Agritech planters
 *   Ala Industrial roof panels + insulated cable (separate from power)
 *   Energized Power battery, elite battery, copper cable, solar tier 4, powered lamp
 *   Hydrofarm bed, item pipe, liquid pipe, tank, siphon
 *   Macaw's Japanese door and blackstone window
 *
 * Stays west of the garden wall. Does not touch the west water channel
 * (x=-620..-618) or the drone lattice.
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

const STATION = 'alaindustrial:garden_drone_station';
const LATTICE_X = [-584, -575, -567, -561, -553, -547, -539, -533];
const LATTICE_Z = [374, 383, 392, 401, 410, 415, 424, 429, 435, 444, 453, 462, 471];
const HOUSE_BOX = { x0: -615, x1: -596, z0: 413, z1: 427 };

const full = (b) => (typeof b === 'string' ? b : String(b ?? 'minecraft:air'));
const inSchem = (X, Y, Z) => {
  const lx = toLX(X),
    ly = toLY(Y),
    lz = toLZ(Z);
  return lx >= 0 && lx < SX && ly >= 0 && ly < SY && lz >= 0 && lz < SZ;
};
const getW = (X, Y, Z) => (inSchem(X, Y, Z) ? full(grid.get(toLX(X), toLY(Y), toLZ(Z))) : 'oob');
const setW = (X, Y, Z, b) => {
  if (!inSchem(X, Y, Z)) return;
  if (X >= -622 && X <= -618 && Z >= 408 && Z <= 432) return;
  grid.set(toLX(X), toLY(Y), toLZ(Z), b);
};

const LOG = 'minecraft:stripped_oak_log[axis=y]';
const FLOOR = 'minecraft:dark_oak_planks';
const WALL = 'minecraft:spruce_planks';
const BRICK = 'minecraft:stone_bricks';
const ROOF = 'minecraft:deepslate_tiles';
const BED = 'hydrofarm:hydroponics_bed[east=false,north=false,planter_ne=true,planter_nw=true,planter_se=true,planter_sw=true,south=false,west=false]';
const ITEM_PIPE = 'hydrofarm:item_pipe[face_down=none,face_east=pipe,face_north=none,face_south=pipe,face_up=extract,face_west=none]';
const LIQUID_PIPE = 'hydrofarm:liquid_pipe[face_down=none,face_east=none,face_north=pipe,face_south=none,face_up=none,face_west=pipe]';
const TANK = 'hydrofarm:liquid_tank[down=false,east=false,north=false,south=false,up=true,west=false]';
const SIPHON = 'hydrofarm:liquid_siphon';
const CABLE = 'energizedpower:copper_cable[down=false,east=true,north=false,south=false,up=true,west=true]';
const LAMP = 'energizedpower:powered_lamp[level=0]';
const PANEL4 = 'energizedpower:solar_panel_4';
const BATT = 'energizedpower:battery_box[facing=south]';
const ELITE = 'energizedpower:elite_battery_box[powered=false,working=false,facing=east]';
const ALA = 'alaindustrial:insulated_copper_cable';
const WINDOW = 'mcwwindows:blackstone_window[part=bot_r,facing=north]';
const DOOR_L = 'mcwdoors:dark_oak_japanese2_door[half=lower,powered=false,open=true,hinge=left,facing=east]';
const DOOR_U = 'mcwdoors:dark_oak_japanese2_door[half=upper,powered=false,open=true,hinge=left,facing=east]';

const inside = (X, Z) => X > HOUSE_BOX.x0 && X < HOUSE_BOX.x1 && Z > HOUSE_BOX.z0 && Z < HOUSE_BOX.z1;
const edge = (X, Z) =>
  X === HOUSE_BOX.x0 || X === HOUSE_BOX.x1 || Z === HOUSE_BOX.z0 || Z === HOUSE_BOX.z1;
const inBox = (X, Z) =>
  X >= HOUSE_BOX.x0 && X <= HOUSE_BOX.x1 && Z >= HOUSE_BOX.z0 && Z <= HOUSE_BOX.z1;

function clearHouse() {
  for (let X = HOUSE_BOX.x0; X <= HOUSE_BOX.x1; X++) {
    for (let Z = HOUSE_BOX.z0; Z <= HOUSE_BOX.z1; Z++) {
      for (let Y = 64; Y <= 84; Y++) {
        const n = getW(X, Y, Z);
        if (n.startsWith(STATION) && LATTICE_X.includes(X) && LATTICE_Z.includes(Z)) {
          throw new Error(`lattice station inside house at ${X},${Y},${Z}`);
        }
        setW(X, Y, Z, 'minecraft:air');
      }
    }
  }
}

function windowState(facing) {
  return `mcwwindows:blackstone_window[part=bot_r,facing=${facing}]`;
}

function shell() {
  for (let X = HOUSE_BOX.x0; X <= HOUSE_BOX.x1; X++) {
    for (let Z = HOUSE_BOX.z0; Z <= HOUSE_BOX.z1; Z++) {
      if (!inBox(X, Z)) continue;
      setW(X, 63, Z, 'minecraft:cobblestone');
      if (inside(X, Z)) setW(X, 64, Z, FLOOR);
      else if (edge(X, Z)) setW(X, 64, Z, BRICK);
      const corner =
        (X === HOUSE_BOX.x0 || X === HOUSE_BOX.x1) && (Z === HOUSE_BOX.z0 || Z === HOUSE_BOX.z1);
      if (edge(X, Z)) {
        for (let Y = 65; Y <= 71; Y++) setW(X, Y, Z, corner ? LOG : WALL);
      }
    }
  }
  // set-back windows: sill and lintel on the wall, one stair outside
  const windows = [];
  for (const X of [-610, -606, -602]) {
    windows.push([X, HOUSE_BOX.z0, 'north'], [X, HOUSE_BOX.z1, 'south']);
  }
  for (const Z of [417, 423]) {
    windows.push([HOUSE_BOX.x0, Z, 'west'], [HOUSE_BOX.x1, Z, 'east']);
  }
  for (const [X, Z, facing] of windows) {
    setW(X, 66, Z, windowState(facing));
    setW(X, 65, Z, BRICK);
    setW(X, 67, Z, BRICK);
    const ox = X === HOUSE_BOX.x0 ? X - 1 : X === HOUSE_BOX.x1 ? X + 1 : X;
    const oz = Z === HOUSE_BOX.z0 ? Z - 1 : Z === HOUSE_BOX.z1 ? Z + 1 : Z;
    if (getW(ox, 65, oz) === 'minecraft:air' || /grass|dirt|path|short_/.test(getW(ox, 65, oz))) {
      setW(ox, 64, oz, `minecraft:stone_brick_stairs[facing=${facing},half=bottom]`);
    }
  }
  // front door, east wall, facing the garden
  setW(HOUSE_BOX.x1, 65, 420, DOOR_L);
  setW(HOUSE_BOX.x1, 66, 420, DOOR_U);
  setW(HOUSE_BOX.x1, 67, 420, BRICK);
  setW(HOUSE_BOX.x1 + 1, 64, 420, 'minecraft:stone_brick_stairs[facing=east,half=bottom]');
  setW(HOUSE_BOX.x1 + 1, 65, 420, 'minecraft:air');
  setW(HOUSE_BOX.x1 + 1, 66, 420, 'minecraft:air');
}

function roofY(Z) {
  return 76 - Math.min(Math.abs(Z - 420), 4);
}

function stairAndFloors() {
  // Four oak steps in the northwest corner, clear of the power cabinets.
  for (let i = 0; i < 4; i++) {
    setW(-614, 65 + i, 414 + i, 'minecraft:oak_stairs[facing=south,half=bottom]');
    setW(-613, 65 + i, 414 + i, 'minecraft:air');
    setW(-614, 66 + i, 414 + i, 'minecraft:air');
  }
  for (let X = HOUSE_BOX.x0 + 1; X < HOUSE_BOX.x1; X++) {
    for (let Z = HOUSE_BOX.z0 + 1; Z < HOUSE_BOX.z1; Z++) {
      const stair = X === -614 && Z >= 414 && Z <= 417;
      if (!stair) setW(X, 68, Z, 'minecraft:spruce_planks');
    }
  }
  setW(-614, 69, 417, 'minecraft:air');
  setW(-614, 70, 417, 'minecraft:air');
}

function cable(down, east, north, south, up, west) {
  return `energizedpower:copper_cable[down=${down},east=${east},north=${north},south=${south},up=${up},west=${west}]`;
}

function itemPipe(faces) {
  const f = {
    face_down: 'none',
    face_east: 'none',
    face_north: 'none',
    face_south: 'none',
    face_up: 'none',
    face_west: 'none',
    ...faces,
  };
  return `hydrofarm:item_pipe[face_down=${f.face_down},face_east=${f.face_east},face_north=${f.face_north},face_south=${f.face_south},face_up=${f.face_up},face_west=${f.face_west}]`;
}

function liquidPipe(faces) {
  const f = {
    face_down: 'none',
    face_east: 'none',
    face_north: 'none',
    face_south: 'none',
    face_up: 'none',
    face_west: 'none',
    ...faces,
  };
  return `hydrofarm:liquid_pipe[face_down=${f.face_down},face_east=${f.face_east},face_north=${f.face_north},face_south=${f.face_south},face_up=${f.face_up},face_west=${f.face_west}]`;
}

function groundRooms() {
  // Hall between the power room and the hydro wing.
  for (let Z = 414; Z <= 426; Z++) {
    if (Z === 420 || Z === 421) continue;
    for (let Y = 65; Y <= 67; Y++) setW(-605, Y, Z, WALL);
  }

  // Energized Power, southwest. Cables stay on this side of the hall wall.
  for (const Z of [422, 423, 424, 425]) setW(-613, 65, Z, ELITE);
  setW(-612, 65, 422, BATT);
  setW(-613, 66, 422, LAMP);
  for (const Z of [422, 423, 424]) {
    setW(-613, 63, Z, cable(false, false, true, true, false, false));
  }
  setW(-613, 63, 425, cable(false, false, true, false, false, false));
  setW(-613, 63, 421, cable(false, false, false, true, false, true));
  setW(-614, 63, 421, cable(false, true, false, false, false, true));
  setW(-615, 63, 421, cable(false, true, false, false, true, false));
  for (let Y = 64; Y <= 74; Y++) setW(-615, Y, 421, cable(true, false, false, false, true, false));
  setW(-615, 75, 421, cable(true, true, false, false, false, false));
  setW(-614, 75, 421, cable(false, true, false, false, false, true));
  setW(-613, 75, 421, cable(false, true, false, false, false, true));
  setW(-612, 75, 421, PANEL4);
  setW(-612, 76, 421, 'minecraft:air');

  // Ala Industrial chase on the north wall, separate from the copper run.
  for (let Y = 64; Y <= 71; Y++) setW(-608, Y, HOUSE_BOX.z0, ALA);
  setW(-608, 72, HOUSE_BOX.z0, ALA);
  setW(-608, 72, 414, ALA);
  setW(-609, 73, 414, 'alaindustrial:radiant_solar_panel');
  setW(-608, 73, 414, 'alaindustrial:moonlit_solar_panel');
  setW(-607, 73, 414, 'alaindustrial:daylight_solar_panel');
  setW(-609, 74, 414, 'minecraft:air');
  setW(-608, 74, 414, 'minecraft:air');
  setW(-607, 74, 414, 'minecraft:air');

  // Hydro wing, east of the hall wall.
  for (const X of [-600, -599]) {
    for (const Z of [423, 424]) setW(X, 65, Z, BED);
  }
  setW(-600, 66, 423, itemPipe({ face_down: 'extract', face_east: 'pipe', face_south: 'pipe' }));
  setW(-599, 66, 423, itemPipe({ face_down: 'extract', face_west: 'pipe', face_south: 'pipe', face_east: 'pipe' }));
  setW(-600, 66, 424, itemPipe({ face_down: 'extract', face_east: 'pipe', face_north: 'pipe' }));
  setW(-599, 66, 424, itemPipe({ face_down: 'extract', face_west: 'pipe', face_north: 'pipe' }));
  setW(-598, 66, 423, itemPipe({ face_west: 'pipe', face_down: 'pipe' }));
  setW(-598, 65, 423, itemPipe({ face_up: 'pipe', face_south: 'pipe' }));
  setW(-598, 65, 422, 'minecraft:barrel[facing=up,open=false]');
  for (const X of [-600, -599]) {
    setW(X, 62, 423, liquidPipe({ face_south: 'pipe', face_west: 'pipe', face_east: 'pipe' }));
    setW(X, 62, 424, liquidPipe({ face_north: 'pipe', face_west: 'pipe', face_east: 'pipe' }));
  }
  setW(-601, 62, 424, liquidPipe({ face_east: 'pipe', face_south: 'pipe' }));
  setW(-601, 62, 425, liquidPipe({ face_north: 'pipe', face_up: 'pipe' }));
  setW(-601, 65, 425, TANK);
  setW(-601, 66, 425, TANK);
  setW(-601, 65, 424, SIPHON);
  setW(-603, 65, 415, 'agritech:dark_oak_planter');
  setW(-602, 65, 415, 'agritech:dark_oak_planter');
  setW(-604, 65, 416, 'minecraft:crafting_table');
  setW(-603, 65, 416, 'minecraft:furnace[facing=west,lit=false]');
  setW(-604, 65, 418, 'minecraft:smoker[facing=west,lit=false]');

  // chimney over the kitchen fire, shaft left open through the roof
  setW(-602, 65, 426, 'minecraft:campfire[lit=true,facing=north]');
  for (let Y = 66; Y <= 78; Y++) setW(-602, Y, 426, 'minecraft:air');
  for (const [dx, dz] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    for (let Y = 72; Y <= 79; Y++) {
      const X = -602 + dx,
        Z = 426 + dz;
      if (X === -602 && Z === 426) continue;
      if (edge(X, Z) || Y >= 76) setW(X, Y, Z, 'minecraft:cobblestone');
    }
  }
  setW(-602, 79, 426, 'minecraft:cobblestone_wall');

  // hanging lanterns under the upstairs floor, not standing in the room
  setW(-597, 67, 416, 'minecraft:lantern[hanging=true]');
  setW(-614, 67, 424, 'minecraft:lantern[hanging=true]');
  setW(-607, 67, 426, 'minecraft:lantern[hanging=true]');
  setW(-608, 64, 418, 'minecraft:sea_lantern');
}

function upperFloor() {
  setW(-612, 69, 424, 'minecraft:red_bed[facing=east,part=foot]');
  setW(-611, 69, 424, 'minecraft:red_bed[facing=east,part=head]');
  for (const X of [-614, -613]) setW(X, 69, 422, 'minecraft:bookshelf');
  setW(-600, 69, 416, 'minecraft:barrel[facing=up,open=false]');
  setW(-599, 69, 416, 'minecraft:chest[facing=south]');
  setW(-606, 71, 415, 'minecraft:spruce_slab[type=bottom]');
  setW(-606, 70, 415, 'minecraft:lantern[hanging=true]');
  setW(-606, 71, 425, 'minecraft:spruce_slab[type=bottom]');
  setW(-606, 70, 425, 'minecraft:lantern[hanging=true]');
}

function roof() {
  for (let X = HOUSE_BOX.x0; X <= HOUSE_BOX.x1; X++) {
    for (let Z = HOUSE_BOX.z0; Z <= HOUSE_BOX.z1; Z++) {
      if (X === -602 && Z === 426) continue;
      const y = roofY(Z);
      const facing = Z < 420 ? 'north' : Z > 420 ? 'south' : 'east';
      if (Z === 420) setW(X, y, Z, 'minecraft:stripped_oak_log[axis=x]');
      else setW(X, y, Z, `minecraft:deepslate_tile_stairs[facing=${facing},half=bottom]`);
      if (X === HOUSE_BOX.x0 || X === HOUSE_BOX.x1) {
        for (let yy = 72; yy < y; yy++) setW(X, yy, Z, WALL);
      }
    }
  }
}

function reachable() {
  const pass = (n) =>
    n === 'minecraft:air' ||
    /door|stairs|ladder|sign|carpet|lantern/.test(n);
  const start = [HOUSE_BOX.x1, 65, 420];
  const seen = new Set([start.join()]);
  const q = [start];
  let upper = false;
  let stairs = 0;
  while (q.length) {
    const [X, Y, Z] = q.pop();
    if (Y >= 69 && inside(X, Z)) upper = true;
    if (getW(X, Y, Z).includes('oak_stairs')) stairs++;
    for (const [dx, dy, dz] of [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 0, 1],
      [0, 0, -1],
      [0, 1, 0],
      [0, -1, 0],
    ]) {
      const nX = X + dx,
        nY = Y + dy,
        nZ = Z + dz;
      if (nY < 64 || nY > 71) continue;
      if (nX < HOUSE_BOX.x0 || nX > HOUSE_BOX.x1 || nZ < HOUSE_BOX.z0 || nZ > HOUSE_BOX.z1) continue;
      const key = `${nX},${nY},${nZ}`;
      if (seen.has(key)) continue;
      const b = getW(nX, nY, nZ);
      if (!pass(b)) continue;
      seen.add(key);
      q.push([nX, nY, nZ]);
    }
  }
  return { visited: seen.size, upper, stairs };
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
    water = 0;
  for (const [x, y, z] of stations) if (full(grid.get(x, y + 1, z)).includes('trapdoor')) trapOk++;
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
  for (let X = -620; X <= -618; X++)
    for (let Z = 410; Z <= 430; Z++)
      for (let Y = 60; Y <= 66; Y++) if (getW(X, Y, Z).includes('water')) water++;
  const mods = new Set();
  for (let X = HOUSE_BOX.x0 - 1; X <= HOUSE_BOX.x1 + 1; X++)
    for (let Z = HOUSE_BOX.z0 - 1; Z <= HOUSE_BOX.z1 + 1; Z++)
      for (let Y = 60; Y <= 82; Y++) {
        const n = getW(X, Y, Z).split('[')[0];
        if (n.includes(':') && !n.startsWith('minecraft:')) mods.add(n);
      }
  return {
    stations: stations.length,
    lattice: stations.filter(([x, , z]) => LATTICE_X.includes(wx(x)) && LATTICE_Z.includes(wz(z))).length,
    trapOk,
    farm,
    uncovered,
    water,
    mods: [...mods].sort(),
  };
}

console.log('rebuild main house…');
clearHouse();
shell();
stairAndFloors();
roof();
groundRooms();
upperFloor();
const reach = reachable();
const metrics = coverage();
const need = [
  'agritech:dark_oak_planter',
  'alaindustrial:daylight_solar_panel',
  'alaindustrial:insulated_copper_cable',
  'alaindustrial:moonlit_solar_panel',
  'alaindustrial:radiant_solar_panel',
  'energizedpower:battery_box',
  'energizedpower:copper_cable',
  'energizedpower:elite_battery_box',
  'energizedpower:powered_lamp',
  'energizedpower:solar_panel_4',
  'hydrofarm:hydroponics_bed',
  'hydrofarm:item_pipe',
  'hydrofarm:liquid_pipe',
  'hydrofarm:liquid_siphon',
  'hydrofarm:liquid_tank',
  'mcwdoors:dark_oak_japanese2_door',
  'mcwwindows:blackstone_window',
];
const missing = need.filter((id) => !metrics.mods.includes(id));
if (!reach.upper || reach.stairs < 4 || metrics.uncovered !== 0 || metrics.lattice !== 104 || metrics.water < 10 || missing.length) {
  console.error(JSON.stringify({ reach, metrics, missing }, null, 2));
  process.exit(1);
}
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify({ reach, metrics }, null, 2));
