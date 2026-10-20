/**
 * Ambitious estate expansion for krutz-solar-house.schem
 * - Expand bounds (deeper + taller)
 * - Hillside solar farm + buried battery hall
 * - East-gate visitor pavilion + greenhouse
 * - Central fountain court + carriage loop
 * - West water dock
 * - Garden polish + night lighting
 * Keeps house massing, ~104 lattice stations, uncovered farmland = 0
 */
import { parseToGrid } from './node_modules/craftmatic/dist/schem/parse.js';
import { writeSchematic } from './node_modules/craftmatic/dist/schem/write.js';
import { BlockGrid } from './node_modules/craftmatic/dist/schem/types.js';

const SCHEM = new URL('../krutz-solar-house.schem', import.meta.url).pathname;
const old = await parseToGrid(SCHEM);

const DY = 14; // deeper underground for battery / bone-farm stub
const EXTRA_H = 4; // taller roofs / chimney
const grid = new BlockGrid(old.width, old.height + DY + EXTRA_H, old.length);
for (let y = 0; y < old.height; y++) {
  for (let z = 0; z < old.length; z++) {
    for (let x = 0; x < old.width; x++) {
      grid.set(x, y + DY, z, old.get(x, y, z));
    }
  }
}
for (const be of old.blockEntities) {
  const [x, y, z] = be.pos;
  grid.blockEntities.push({ ...be, pos: [x, y + DY, z] });
}

const ORIGIN_Y = 58 - DY; // world Y of local y=0
const { width: SX, height: SY, length: SZ } = grid;
const toLX = (X) => X + 630;
const toLY = (Y) => Y - ORIGIN_Y;
const toLZ = (Z) => Z - 352;
const wx = (lx) => lx - 630;
const wz = (lz) => lz + 352;

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
const PANELS = [
  'alaindustrial:radiant_solar_panel',
  'alaindustrial:moonlit_solar_panel',
  'alaindustrial:daylight_solar_panel',
];

const full = (b) => (typeof b === 'string' ? b : String(b ?? 'minecraft:air'));
const getW = (X, Y, Z) => full(grid.get(toLX(X), toLY(Y), toLZ(Z)));
const setW = (X, Y, Z, b) => {
  if (HOUSE(X, Z)) return;
  grid.set(toLX(X), toLY(Y), toLZ(Z), b);
};
const setWForce = (X, Y, Z, b) => grid.set(toLX(X), toLY(Y), toLZ(Z), b);
const setSolar = (X, Y, Z, b) => grid.set(toLX(X), toLY(Y), toLZ(Z), b); // solar hill allowed
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
const isTerrain = (n) =>
  /grass_block|dirt$|stone$|granite|diorite|andesite|gravel|sand$|cobblestone$|farmland/.test(n);
const isSoft = (n) =>
  /short_grass|tall_grass|dandelion|poppy|allium|cornflower|oxeye|lily_of|azure|azalea|bush|leaf_litter|firefly|fern|wheat|carrot|potato|beet/.test(
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

function topTerrainY(X, Z) {
  for (let Y = 85; Y >= 45; Y--) {
    if (!inSchem(X, Y, Z)) continue;
    const n = getW(X, Y, Z);
    if (isTerrain(n) || n.includes('dirt_path') || /stone_brick|mossy|cracked|cobble/.test(n)) return Y;
  }
  return null;
}

function clearAbove(X, Y, Z, h = 6) {
  for (let y = Y + 1; y <= Y + h; y++) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n.startsWith(STATION) || n.includes('trapdoor')) continue;
    if (/fence|door|gate|wall|pane|plank|log|stair|slab|brick|lantern|glass|panel|battery/.test(n)) break;
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
  clearAbove(X, Y, Z, 4);
  if (!plant) return;
  const r = hash(X, Z) % 100;
  if (r < 36) setW(X, Y + 1, Z, 'minecraft:short_grass');
  else if (r < 50) setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
  else if (r < 56) setW(X, Y + 1, Z, 'minecraft:leaf_litter');
}

function reshape(X, Z, target, plant) {
  for (let y = 82; y > target; y--) {
    if (!inSchem(X, y, Z)) continue;
    const n = getW(X, y, Z);
    if (n.startsWith(STATION) || n.includes('trapdoor')) continue;
    if (/stone_brick|mossy_stone|cracked_stone|chiseled|glass|panel|battery|lantern/.test(n)) continue;
    if (isTerrain(n) || isSoft(n) || n === 'minecraft:air' || /leaves|log|vine/.test(n)) {
      setW(X, y, Z, 'minecraft:air');
    }
  }
  const cur = topTerrainY(X, Z);
  if (cur == null || cur < target) {
    for (let y = (cur ?? target - 3) + 1; y <= target; y++) {
      if (inSchem(X, y, Z)) setW(X, y, Z, 'minecraft:dirt');
    }
  }
  placeGrass(X, target, Z, plant);
}

// ─── 1. Soften skirts (N/E/S) into 1-block slopes ───
function softenSkirts() {
  for (let X = WALL_X1; X <= WALL_X2; X++) {
    const base = soilY(X);
    for (let dist = 1; dist <= 16; dist++) {
      const Z = WALL_Z1 - dist;
      if (!inSchem(X, 64, Z) || HOUSE(X, Z)) continue;
      reshape(X, Z, Math.max(58, base - dist), dist > 1);
    }
    for (let dist = 1; dist <= 12; dist++) {
      const Z = WALL_Z2 + dist;
      if (!inSchem(X, 64, Z) || HOUSE(X, Z) || SOLAR(X, Z)) continue;
      reshape(X, Z, Math.max(64, base - Math.floor(dist * 0.6)), true);
    }
  }
  for (let Z = WALL_Z1; Z <= WALL_Z2; Z++) {
    for (let dist = 1; dist <= 16; dist++) {
      const X = WALL_X2 + dist;
      if (!inSchem(X, 64, Z) || HOUSE(X, Z)) continue;
      let target = Math.max(64, 70 - dist);
      if (Z >= 416 && Z <= 425) target = Math.max(target, 69 - Math.floor(dist * 0.35)); // gate approach
      if (SOLAR(X, Z)) continue; // solar builder owns this
      reshape(X, Z, target, true);
    }
  }
}

// ─── 2. Break crop monoculture ───
function breakCrops() {
  for (let X = WALL_X1 + 2; X <= WALL_X2 - 2; X++) {
    const Y = soilY(X);
    for (let Z = WALL_Z1 + 4; Z <= WALL_Z2 - 4; Z++) {
      if (HOUSE(X, Z) || SOLAR(X, Z)) continue;
      if (Z >= 418 && Z <= 423) continue; // path corridor
      if (LATTICE_X.includes(X) && LATTICE_Z.some((sz) => Math.abs(sz - Z) <= 1)) continue;
      if (LATTICE_Z.includes(Z) && LATTICE_X.some((sx) => Math.abs(sx - X) <= 1)) continue;
      const h = hash(X, Z);
      const cross = Z % 7 === (X * 2) % 7 || X % 11 === Z % 11;
      const bed = h % 29 === 0;
      if (!cross && !bed) continue;
      if (!isCropish(getW(X, Y, Z)) && !isCropish(getW(X, Y + 1, Z))) continue;
      if (getW(X, Y + 1, Z).startsWith(STATION)) continue;
      placeGrass(X, Y, Z, true);
      if (bed && h % 4 === 0) {
        // tiny flower bed cluster
        for (const [dx, dz] of [
          [1, 0],
          [-1, 0],
          [0, 1],
        ]) {
          const X2 = X + dx,
            Z2 = Z + dz;
          if (X2 <= WALL_X1 || X2 >= WALL_X2 || Z2 <= WALL_Z1 || Z2 >= WALL_Z2) continue;
          if (LATTICE_X.includes(X2) && LATTICE_Z.includes(Z2)) continue;
          const Y2 = soilY(X2);
          if (getW(X2, Y2 + 1, Z2).startsWith(STATION)) continue;
          if (isCropish(getW(X2, Y2, Z2)) || isCropish(getW(X2, Y2 + 1, Z2))) {
            placeGrass(X2, Y2, Z2, false);
            setW(X2, Y2 + 1, Z2, FLOWERS[hash(X2, Z2) % FLOWERS.length]);
          }
        }
      }
    }
  }
  // azalea hedge ribbons that don't eat station cells
  for (let X = -580; X <= -536; X += 2) {
    for (const Z of [378, 468]) {
      if (LATTICE_X.includes(X) && LATTICE_Z.includes(Z)) continue;
      const Y = soilY(X);
      if (!inSchem(X, Y, Z) || HOUSE(X, Z)) continue;
      if (getW(X, Y + 1, Z).startsWith(STATION)) continue;
      placeGrass(X, Y, Z, false);
      setW(X, Y + 1, Z, hash(X, Z) % 2 ? 'minecraft:azalea' : 'minecraft:flowering_azalea');
    }
  }
}

// ─── 3. Path variation + benches + posts ───
function detailPath() {
  for (let X = -588; X <= -530; X++) {
    for (const Z of [420, 421]) {
      if (HOUSE(X, Z) || !inSchem(X, soilY(X), Z)) continue;
      const Y = soilY(X);
      const mix = hash(X, Z) % 100;
      clearAbove(X, Y, Z, 3);
      for (let y = Y - 2; y < Y; y++) if (inSchem(X, y, Z)) setW(X, y, Z, 'minecraft:dirt');
      if (mix < 22) setW(X, Y, Z, 'minecraft:cobblestone');
      else if (mix < 38) setW(X, Y, Z, 'minecraft:mossy_cobblestone');
      else setW(X, Y, Z, 'minecraft:dirt_path');
    }
  }
  // spruce posts + lanterns every 10 along path verges
  for (let X = -586; X <= -534; X += 10) {
    for (const Z of [418, 423]) {
      const Y = soilY(X);
      if (!inSchem(X, Y, Z) || HOUSE(X, Z)) continue;
      if (LATTICE_X.includes(X) && LATTICE_Z.includes(Z)) continue;
      placeGrass(X, Y, Z, false);
      if (!getW(X, Y + 1, Z).startsWith(STATION)) {
        setW(X, Y + 1, Z, 'minecraft:spruce_fence');
        setW(X, Y + 2, Z, 'minecraft:lantern[hanging=false]');
      }
    }
  }
  // benches facing path
  for (let X = -578; X <= -542; X += 14) {
    const Z = 423,
      Y = soilY(X);
    if (!inSchem(X, Y, Z) || HOUSE(X, Z)) continue;
    if (LATTICE_X.includes(X) && LATTICE_Z.includes(Z)) continue;
    placeGrass(X, Y, Z, false);
    if (!getW(X, Y + 1, Z).startsWith(STATION)) {
      setW(X, Y + 1, Z, 'minecraft:spruce_stairs[facing=north,half=bottom]');
    }
  }
}

// ─── 4. Wall rhythm + taller corner towers ───
function polishWalls() {
  const corners = [
    [WALL_X1, WALL_Z1],
    [WALL_X2, WALL_Z1],
    [WALL_X1, WALL_Z2],
    [WALL_X2, WALL_Z2],
  ];
  for (const [CX, CZ] of corners) {
    for (let dx = 0; dx <= 1; dx++) {
      for (let dz = 0; dz <= 1; dz++) {
        const X = CX + (CX === WALL_X2 ? -dx : dx);
        const Z = CZ + (CZ === WALL_Z2 ? -dz : dz);
        if (HOUSE(X, Z)) continue;
        const base = soilY(X);
        for (let Y = base; Y <= base + 8; Y++) {
          if (inSchem(X, Y, Z)) setW(X, Y, Z, brickMix(X, Y, Z));
        }
        if (inSchem(X, base + 9, Z)) setW(X, base + 9, Z, 'minecraft:stone_brick_slab[type=bottom]');
        if (inSchem(X, base + 8, Z)) setW(X, base + 8, Z, 'minecraft:lantern[hanging=false]');
      }
    }
  }
  // even lantern rhythm on walls
  for (let Z = WALL_Z1 + 4; Z <= WALL_Z2 - 4; Z += 6) {
    if (Z >= 418 && Z <= 423) continue;
    for (const X of [WALL_X1, WALL_X2]) {
      const Y = (topTerrainY(X, Z) ?? soilY(X)) + 1;
      if (!inSchem(X, Y, Z) || HOUSE(X, Z)) continue;
      const n = getW(X, Y - 1, Z);
      if (/stone_brick|mossy|cracked|cobble/.test(n) || /stone_brick|mossy|cracked/.test(getW(X, Y, Z))) {
        if (getW(X, Y, Z) === 'minecraft:air' || isSoft(getW(X, Y, Z)) || getW(X, Y, Z).includes('lantern'))
          setW(X, Y, Z, 'minecraft:lantern[hanging=false]');
      }
    }
  }
  for (let X = WALL_X1 + 4; X <= WALL_X2 - 4; X += 6) {
    for (const Z of [WALL_Z1, WALL_Z2]) {
      const Y = (topTerrainY(X, Z) ?? soilY(X)) + 1;
      if (!inSchem(X, Y, Z) || HOUSE(X, Z)) continue;
      if (getW(X, Y, Z) === 'minecraft:air' || isSoft(getW(X, Y, Z)) || getW(X, Y, Z).includes('lantern'))
        setW(X, Y, Z, 'minecraft:lantern[hanging=false]');
    }
  }
  // mossy/cracked mix along wall faces
  for (let Z = WALL_Z1; Z <= WALL_Z2; Z++) {
    for (const X of [WALL_X1, WALL_X2]) {
      for (let Y = 64; Y <= 74; Y++) {
        if (!inSchem(X, Y, Z)) continue;
        const n = getW(X, Y, Z);
        if (/^minecraft:stone_bricks$/.test(n) && hash(X + Y, Z) % 3 === 0) setW(X, Y, Z, brickMix(X, Y, Z));
      }
    }
  }
}

// ─── 5. House-front carriage loop + seamless lawn ───
function carriageLoop() {
  // grade lawn from house steps (-591) to path
  for (let Z = 412; Z <= 428; Z++) {
    for (let X = -591; X <= -587; X++) {
      if (HOUSE(X, Z) || !inSchem(X, 64, Z)) continue;
      for (let y = 65; y <= 70; y++) {
        const n = getW(X, y, Z);
        if (isTerrain(n) || isSoft(n) || isCropish(n)) setW(X, y, Z, 'minecraft:air');
      }
      placeGrass(X, 64, Z, !(Z >= 418 && Z <= 423));
    }
  }
  // cobble carriage oval in front of doors (outside house protect)
  const oval = [];
  for (let t = 0; t < 360; t += 8) {
    const rad = (t * Math.PI) / 180;
    const X = Math.round(-589 + Math.cos(rad) * 2.2);
    const Z = Math.round(420 + Math.sin(rad) * 5.5);
    oval.push([X, Z]);
  }
  for (const [X, Z] of oval) {
    if (HOUSE(X, Z) || X < -591 || !inSchem(X, 64, Z)) continue;
    clearAbove(X, 64, Z, 3);
    setW(X, 63, Z, 'minecraft:dirt');
    setW(X, 64, Z, hash(X, Z) % 3 === 0 ? 'minecraft:mossy_cobblestone' : 'minecraft:cobblestone');
  }
  // spruce stair landing matching house language
  for (let Z = 418; Z <= 422; Z++) {
    if (!inSchem(-591, 64, Z)) continue;
    setW(-591, 64, Z, 'minecraft:spruce_stairs[facing=east,half=bottom]');
    if (inSchem(-590, 64, Z)) {
      clearAbove(-590, 64, Z, 2);
      setW(-590, 64, Z, 'minecraft:cobblestone');
    }
  }
  // planters flanking the landing
  for (const Z of [416, 424]) {
    if (!inSchem(-590, 64, Z)) continue;
    placeGrass(-590, 64, Z, false);
    setW(-590, 65, Z, 'minecraft:potted_azalea_bush');
    setW(-589, 64, Z, 'minecraft:grass_block');
    setW(-589, 65, Z, FLOWERS[Z % FLOWERS.length]);
  }
}

// ─── MEMORABLE: Central fountain court ───
function fountainCourt() {
  const CX = -560,
    CZ = 420;
  const Y = soilY(CX);
  // clear a 9x9 court on/around path — keep stations
  for (let X = CX - 4; X <= CX + 4; X++) {
    for (let Z = CZ - 4; Z <= CZ + 4; Z++) {
      if (HOUSE(X, Z) || !inSchem(X, Y, Z)) continue;
      if (LATTICE_X.includes(X) && LATTICE_Z.includes(Z)) continue;
      clearAbove(X, Y, Z, 5);
      const edge = Math.abs(X - CX) === 4 || Math.abs(Z - CZ) === 4;
      const path = Z === 420 || Z === 421;
      for (let y = Y - 2; y < Y; y++) setW(X, y, Z, 'minecraft:dirt');
      if (edge) {
        setW(X, Y, Z, brickMix(X, Y, Z));
        if ((X + Z) % 2 === 0) setW(X, Y + 1, Z, 'minecraft:stone_brick_wall');
      } else if (path && Math.abs(X - CX) > 1) {
        setW(X, Y, Z, 'minecraft:dirt_path');
      } else if (Math.abs(X - CX) <= 1 && Math.abs(Z - CZ) <= 1) {
        setW(X, Y, Z, 'minecraft:stone_bricks');
      } else {
        setW(X, Y, Z, 'minecraft:grass_block');
        if (hash(X, Z) % 100 < 55) setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
        else if (hash(X, Z) % 100 < 75) setW(X, Y + 1, Z, 'minecraft:short_grass');
      }
    }
  }
  // basin
  for (let X = CX - 1; X <= CX + 1; X++) {
    for (let Z = CZ - 1; Z <= CZ + 1; Z++) {
      setW(X, Y, Z, 'minecraft:stone_bricks');
      if (X === CX && Z === CZ) {
        setW(X, Y + 1, Z, 'minecraft:water');
        setW(X, Y + 2, Z, 'minecraft:water');
        setW(X, Y + 3, Z, 'minecraft:cobblestone_wall');
        setW(X, Y + 4, Z, 'minecraft:lantern[hanging=false]');
      } else {
        setW(X, Y + 1, Z, 'minecraft:water');
        if ((X + Z) % 2 === 0) setW(X, Y + 1, Z, 'minecraft:lily_pad');
      }
    }
  }
  // corner planters
  for (const [X, Z] of [
    [CX - 3, CZ - 3],
    [CX + 3, CZ - 3],
    [CX - 3, CZ + 3],
    [CX + 3, CZ + 3],
  ]) {
    placeGrass(X, Y, Z, false);
    setW(X, Y + 1, Z, 'minecraft:potted_flowering_azalea_bush');
  }
}

// ─── MEMORABLE: East visitor pavilion + greenhouse ───
function visitorPavilion() {
  // just inside east wall, south of gate — spruce/oak/cobble language
  const x0 = -536,
    x1 = -530;
  const z0 = 408,
    z1 = 415;
  const Y = 70;
  for (let X = x0; X <= x1; X++) {
    for (let Z = z0; Z <= z1; Z++) {
      if (HOUSE(X, Z) || !inSchem(X, Y, Z)) continue;
      if (LATTICE_X.includes(X) && LATTICE_Z.includes(Z)) continue;
      clearAbove(X, Y, Z, 8);
      for (let y = Y - 2; y < Y; y++) setW(X, y, Z, 'minecraft:dirt');
      const edge = X === x0 || X === x1 || Z === z0 || Z === z1;
      if (edge) {
        setW(X, Y, Z, 'minecraft:cobblestone');
        for (let y = Y + 1; y <= Y + 3; y++) {
          if ((X + Z + y) % 3 === 0) setW(X, y, Z, 'minecraft:spruce_log[axis=y]');
          else setW(X, y, Z, 'minecraft:oak_planks');
        }
        // window panes on long faces
        if ((X === x0 || X === x1) && Z > z0 && Z < z1 && Z !== 411) {
          setW(X, Y + 2, Z, 'minecraft:glass_pane');
        }
      } else {
        setW(X, Y, Z, 'minecraft:spruce_planks');
        setW(X, Y + 1, Z, 'minecraft:air');
        setW(X, Y + 2, Z, 'minecraft:air');
        setW(X, Y + 3, Z, 'minecraft:air');
      }
      // roof
      setW(X, Y + 4, Z, 'minecraft:spruce_stairs[facing=north,half=bottom]');
    }
  }
  // fix roof orientation — peaked
  for (let X = x0; X <= x1; X++) {
    for (let Z = z0; Z <= z1; Z++) {
      if (LATTICE_X.includes(X) && LATTICE_Z.includes(Z)) continue;
      const midZ = (z0 + z1) / 2;
      if (Z < midZ) setW(X, Y + 4, Z, 'minecraft:spruce_stairs[facing=south,half=bottom]');
      else if (Z > midZ) setW(X, Y + 4, Z, 'minecraft:spruce_stairs[facing=north,half=bottom]');
      else setW(X, Y + 4, Z, 'minecraft:spruce_planks');
      setW(X, Y + 5, Z, Z === Math.round(midZ) ? 'minecraft:spruce_slab[type=bottom]' : 'minecraft:air');
    }
  }
  // doorway north toward gate path
  for (const X of [-534, -533]) {
    setW(X, Y + 1, z1, 'minecraft:air');
    setW(X, Y + 2, z1, 'minecraft:air');
    setW(X, Y + 3, z1, 'minecraft:air');
  }
  setW(-534, Y + 1, z1, 'minecraft:oak_door[facing=north,half=lower,hinge=left,open=false,powered=false]');
  setW(-534, Y + 2, z1, 'minecraft:oak_door[facing=north,half=upper,hinge=left,open=false,powered=false]');
  // interior table + lanterns
  setW(-533, Y + 1, 411, 'minecraft:spruce_stairs[facing=east,half=bottom]');
  setW(-532, Y + 1, 411, 'minecraft:oak_fence');
  setW(-532, Y + 2, 411, 'minecraft:lantern[hanging=false]');
  setW(-533, Y + 1, 412, 'minecraft:crafting_table');
  // glass greenhouse stub attached west
  for (let X = -539; X <= -537; X++) {
    for (let Z = 409; Z <= 414; Z++) {
      if (LATTICE_X.includes(X) && LATTICE_Z.includes(Z)) continue;
      clearAbove(X, Y, Z, 6);
      setW(X, Y, Z, 'minecraft:cobblestone');
      const edge = X === -539 || X === -537 || Z === 409 || Z === 414;
      for (let y = Y + 1; y <= Y + 3; y++) {
        setW(X, y, Z, edge ? 'minecraft:glass' : 'minecraft:air');
      }
      setW(X, Y + 4, Z, 'minecraft:glass');
      if (!edge && hash(X, Z) % 3 === 0) setW(X, Y + 1, Z, 'minecraft:potted_oak_sapling');
      else if (!edge) setW(X, Y + 1, Z, FLOWERS[hash(X, Z) % FLOWERS.length]);
    }
  }
  // planters at pavilion corners + gate approach
  for (const [X, Z] of [
    [-529, 419],
    [-529, 422],
    [-527, 417],
    [-527, 424],
  ]) {
    if (SOLAR(X, Z) || !inSchem(X, 70, Z)) continue;
    const ty = topTerrainY(X, Z) ?? 70;
    placeGrass(X, ty, Z, false);
    setW(X, ty + 1, Z, 'minecraft:potted_flowering_azalea_bush');
  }
  // intentional east gate hillside approach stairs
  for (let dist = 1; dist <= 10; dist++) {
    const X = -528 + dist;
    for (const Z of [420, 421]) {
      if (SOLAR(X, Z) || !inSchem(X, 70, Z)) continue;
      const Yt = Math.max(70, 70 - Math.floor((dist - 1) * 0.35));
      for (let y = Yt - 3; y < Yt; y++) if (inSchem(X, y, Z)) setSolar(X, y, Z, 'minecraft:dirt');
      clearAbove(X, Yt, Z, 4);
      if (dist % 3 === 0) setSolar(X, Yt, Z, 'minecraft:cobblestone');
      else setSolar(X, Yt, Z, 'minecraft:dirt_path');
      // flower verge
      for (const dz of [-2, 2]) {
        const Z2 = Z + dz;
        if (!inSchem(X, Yt, Z2) || SOLAR(X, Z2)) continue;
        placeGrass(X, Math.max(64, Yt - 1), Z2, true);
      }
    }
  }
  // gate pillars taller
  for (const X of [-529, -527]) {
    for (const Z of [419, 422]) {
      if (!inSchem(X, 70, Z)) continue;
      for (let Y = 70; Y <= 76; Y++) setW(X, Y, Z, brickMix(X, Y, Z));
      setW(X, 77, Z, 'minecraft:stone_brick_slab[type=bottom]');
      setW(X, 76, Z, 'minecraft:lantern[hanging=false]');
    }
  }
  if (inSchem(-528, 71, 420))
    setWForce(-528, 71, 420, 'minecraft:oak_fence_gate[facing=east,open=false,powered=false,in_wall=false]');
  if (inSchem(-528, 71, 421))
    setWForce(-528, 71, 421, 'minecraft:oak_fence_gate[facing=east,open=false,powered=false,in_wall=false]');
}

// ─── MEMORABLE: Hillside solar farm + buried battery hall ───
function solarFarmAndBattery() {
  // surface terrace of panels on solar hill
  for (let X = -526; X <= -514; X++) {
    for (let Z = 446; Z <= 464; Z++) {
      if (!inSchem(X, 70, Z)) continue;
      const surf = topTerrainY(X, Z) ?? 70;
      // keep a service path
      const service = Z === 455 || X === -520;
      clearAbove(X, surf, Z, 5);
      for (let y = surf - 2; y < surf; y++) if (inSchem(X, y, Z)) setSolar(X, y, Z, 'minecraft:dirt');
      if (service) {
        setSolar(X, surf, Z, 'minecraft:dirt_path');
        continue;
      }
      // panel grid every other block
      if ((X + Z) % 2 === 0) {
        setSolar(X, surf, Z, 'minecraft:smooth_stone');
        setSolar(X, surf + 1, Z, PANELS[hash(X, Z) % PANELS.length]);
      } else {
        setSolar(X, surf, Z, 'minecraft:grass_block');
        if (hash(X, Z) % 100 < 25) setSolar(X, surf + 1, Z, 'minecraft:short_grass');
      }
    }
  }
  // lightning rod / chimney marker at hill crest
  setSolar(-520, 72, 455, 'minecraft:cobblestone');
  setSolar(-520, 73, 455, 'minecraft:cobblestone_wall');
  setSolar(-520, 74, 455, 'minecraft:cobblestone_wall');
  setSolar(-520, 75, 455, 'minecraft:lightning_rod[facing=up,powered=false]');
  setSolar(-520, 73, 456, 'minecraft:lantern[hanging=false]');

  // buried battery hall under hill (world Y ~56-62)
  const hx0 = -524,
    hx1 = -516,
    hz0 = 450,
    hz1 = 460;
  const floorY = 52;
  for (let X = hx0; X <= hx1; X++) {
    for (let Z = hz0; Z <= hz1; Z++) {
      for (let Y = floorY; Y <= floorY + 5; Y++) {
        if (!inSchem(X, Y, Z)) continue;
        const edge = X === hx0 || X === hx1 || Z === hz0 || Z === hz1 || Y === floorY || Y === floorY + 5;
        if (edge) {
          setSolar(X, Y, Z, Y === floorY ? 'minecraft:deepslate_tiles' : 'minecraft:deepslate_bricks');
        } else {
          setSolar(X, Y, Z, 'minecraft:air');
        }
      }
    }
  }
  // batteries + cable spine
  for (let X = hx0 + 2; X <= hx1 - 2; X += 2) {
    setSolar(X, floorY + 1, 455, 'alaindustrial:battery_box');
    setSolar(X, floorY + 1, 453, 'energizedpower:elite_battery_box');
    setSolar(X, floorY + 1, 457, 'alaindustrial:insulated_copper_cable');
  }
  // stair access from service path
  for (let i = 0; i < 8; i++) {
    const Y = 70 - i;
    const Z = 455;
    const X = -520;
    if (!inSchem(X, Y, Z)) continue;
    setSolar(X, Y, Z, 'minecraft:deepslate_stairs[facing=south,half=bottom]');
    for (let y = Y + 1; y <= Y + 3; y++) if (inSchem(X, y, Z) && getW(X, y, Z) !== 'minecraft:lightning_rod[facing=up,powered=false]') {
      if (!String(getW(X, y, Z)).includes('solar_panel') && !String(getW(X, y, Z)).includes('lightning'))
        setSolar(X, y, Z, 'minecraft:air');
    }
  }
  // hatch at surface over stair
  setSolar(-520, 71, 454, 'minecraft:iron_trapdoor[facing=north,half=top,open=false,powered=false,waterlogged=false]');
  // creative energy source room accent
  setSolar(-518, floorY + 1, 455, 'alaindustrial:creative_energy_source');
  setSolar(-518, floorY + 2, 455, 'minecraft:sea_lantern');
  // lanterns in hall
  for (const Z of [451, 459]) {
    setSolar(-520, floorY + 4, Z, 'minecraft:lantern[hanging=true]');
  }

  // deep bone-farm stub further down with chimney up to surface
  const bx0 = -523,
    bx1 = -517,
    bz0 = 452,
    bz1 = 458;
  const boneY = 46;
  for (let X = bx0; X <= bx1; X++) {
    for (let Z = bz0; Z <= bz1; Z++) {
      for (let Y = boneY; Y <= boneY + 4; Y++) {
        if (!inSchem(X, Y, Z)) continue;
        const edge = X === bx0 || X === bx1 || Z === bz0 || Z === bz1 || Y === boneY || Y === boneY + 4;
        setSolar(X, Y, Z, edge ? 'minecraft:stone_bricks' : 'minecraft:air');
      }
      if (X > bx0 && X < bx1 && Z > bz0 && Z < bz1) {
        setSolar(X, boneY + 1, Z, 'minecraft:soul_sand');
        setSolar(X, boneY + 2, Z, 'minecraft:nether_wart[age=3]');
      }
    }
  }
  // chimney from bone room to hill surface
  for (let Y = boneY + 4; Y <= 74; Y++) {
    if (!inSchem(-520, Y, 452)) continue;
    if (Y < 70) setSolar(-520, Y, 452, 'minecraft:cobblestone');
  }
  setSolar(-520, 74, 452, 'minecraft:campfire[facing=north,lit=true,signal_fire=false,waterlogged=false]');
  setSolar(-521, 71, 452, 'minecraft:cobblestone_wall');
  setSolar(-519, 71, 452, 'minecraft:cobblestone_wall');
}

// ─── West water dock ───
function westDock() {
  // dock into water channel near house front (don't touch house massing)
  for (let X = -619; X <= -612; X++) {
    for (const Z of [408, 409]) {
      if (HOUSE(X, Z) || !inSchem(X, 63, Z)) continue;
      setW(X, 63, Z, 'minecraft:oak_log[axis=x]');
      setW(X, 64, Z, 'minecraft:oak_slab[type=bottom]');
    }
  }
  for (let Z = 408; Z <= 414; Z++) {
    if (HOUSE(-612, Z)) continue;
    if (!inSchem(-612, 63, Z)) continue;
    setW(-612, 63, Z, 'minecraft:oak_log[axis=z]');
    setW(-612, 64, Z, 'minecraft:oak_slab[type=bottom]');
  }
  // posts + lanterns
  for (const [X, Z] of [
    [-619, 408],
    [-612, 408],
    [-612, 414],
  ]) {
    if (HOUSE(X, Z) || !inSchem(X, 64, Z)) continue;
    setW(X, 65, Z, 'minecraft:oak_fence');
    setW(X, 66, Z, 'minecraft:lantern[hanging=false]');
  }
  // lily keep + stone rim near dock
  for (let X = -620; X <= -618; X++) {
    for (let Z = 404; Z <= 407; Z++) {
      if (!inSchem(X, 62, Z)) continue;
      if (getW(X, 62, Z).includes('water') || getW(X, 63, Z).includes('water')) {
        if (hash(X, Z) % 4 === 0) setW(X, 63, Z, 'minecraft:lily_pad');
      }
    }
  }
}

// ─── Leaf litter under trees + night lighting accents ───
function foliageAndNight() {
  for (let X = -620; X <= -514; X++) {
    for (let Z = 360; Z <= 488; Z++) {
      if (!inSchem(X, 70, Z) || HOUSE(X, Z)) continue;
      // leaf litter under leaf canopies
      let leaves = false;
      for (let Y = 68; Y <= 78; Y++) {
        if (getW(X, Y, Z).includes('leaves')) {
          leaves = true;
          break;
        }
      }
      if (leaves) {
        const ty = topTerrainY(X, Z);
        if (ty != null && (getW(X, ty, Z).includes('grass') || getW(X, ty, Z).includes('dirt'))) {
          if (getW(X, ty + 1, Z) === 'minecraft:air' && hash(X, Z) % 100 < 40) {
            setW(X, ty + 1, Z, 'minecraft:leaf_litter');
          }
        }
      }
    }
  }
  // orchard strip north of fountain
  for (let X = -570; X <= -550; X += 3) {
    for (let Z = 388; Z <= 400; Z += 4) {
      if (LATTICE_X.includes(X) && LATTICE_Z.some((sz) => Math.abs(sz - Z) <= 1)) continue;
      const Y = soilY(X);
      if (!inSchem(X, Y, Z) || HOUSE(X, Z)) continue;
      if (getW(X, Y + 1, Z).startsWith(STATION)) continue;
      placeGrass(X, Y, Z, false);
      setW(X, Y + 1, Z, 'minecraft:oak_log[axis=y]');
      setW(X, Y + 2, Z, 'minecraft:oak_log[axis=y]');
      for (const [dx, dy, dz] of [
        [0, 3, 0],
        [1, 3, 0],
        [-1, 3, 0],
        [0, 3, 1],
        [0, 3, -1],
        [0, 4, 0],
        [1, 2, 0],
        [-1, 2, 0],
      ]) {
        if (inSchem(X + dx, Y + dy, Z + dz)) setW(X + dx, Y + dy, Z + dz, 'minecraft:oak_leaves[distance=1,persistent=true]');
      }
      if (hash(X, Z) % 100 < 50) setW(X + 1, Y + 1, Z, 'minecraft:leaf_litter');
    }
  }
  // vineyard trellis south-east beds
  for (let X = -545; X <= -535; X++) {
    for (let Z = 458; Z <= 466; Z += 2) {
      if (LATTICE_X.includes(X) && LATTICE_Z.includes(Z)) continue;
      const Y = soilY(X);
      if (!inSchem(X, Y, Z) || HOUSE(X, Z) || SOLAR(X, Z)) continue;
      if (getW(X, Y + 1, Z).startsWith(STATION)) continue;
      placeGrass(X, Y, Z, false);
      setW(X, Y + 1, Z, 'minecraft:oak_fence');
      if (X % 2 === 0) setW(X, Y + 2, Z, 'minecraft:vine[north=true]');
      else setW(X, Y + 2, Z, 'minecraft:oak_leaves[distance=1,persistent=true]');
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

function convertUncoveredFarmland() {
  const stations = [];
  for (let x = 0; x < SX; x++)
    for (let y = 0; y < SY; y++)
      for (let z = 0; z < SZ; z++) {
        if (full(grid.get(x, y, z)).startsWith(STATION)) stations.push([x, y, z]);
      }
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
        if (ok) continue;
        const X = wx(x),
          Z = wz(z);
        if (HOUSE(X, Z)) continue;
        grid.set(x, y, z, 'minecraft:grass_block');
        const above = full(grid.get(x, y + 1, z));
        if (isCropish(above) || isSoft(above)) {
          const r = hash(X, Z) % 100;
          grid.set(
            x,
            y + 1,
            z,
            r < 40 ? 'minecraft:short_grass' : r < 70 ? FLOWERS[r % FLOWERS.length] : 'minecraft:air',
          );
        }
      }
}

function metrics() {
  const stations = [];
  for (let x = 0; x < SX; x++)
    for (let y = 0; y < SY; y++)
      for (let z = 0; z < SZ; z++) {
        if (full(grid.get(x, y, z)).startsWith(STATION)) stations.push([x, y, z]);
      }
  let uncovered = 0,
    farm = 0,
    trapOk = 0;
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
  for (const [x, y, z] of stations) {
    if (full(grid.get(x, y + 1, z)).includes('trapdoor')) trapOk++;
  }
  const latticeStations = stations.filter(
    ([x, , z]) => LATTICE_X.includes(wx(x)) && LATTICE_Z.includes(wz(z)),
  );
  let panels = 0,
    lanterns = 0;
  for (let x = 0; x < SX; x++)
    for (let y = 0; y < SY; y++)
      for (let z = 0; z < SZ; z++) {
        const n = full(grid.get(x, y, z));
        if (n.includes('solar_panel')) panels++;
        if (n.includes('lantern')) lanterns++;
      }
  return {
    size: { SX, SY, SZ, ORIGIN_Y },
    stations: stations.length,
    latticeStations: latticeStations.length,
    trapOk,
    farm,
    uncovered,
    panels,
    lanterns,
  };
}

console.log('building ambition pass…');
softenSkirts();
breakCrops();
detailPath();
polishWalls();
carriageLoop();
fountainCourt();
visitorPavilion();
solarFarmAndBattery();
westDock();
foliageAndNight();
ensureStations();
convertUncoveredFarmland();

const m = metrics();
writeSchematic(grid, SCHEM, 3700);
console.log(JSON.stringify(m, null, 2));
console.log('elapsed_ms_hint_run_separately');
