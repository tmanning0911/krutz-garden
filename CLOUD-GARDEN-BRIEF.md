# Cloud garden build brief

Work only on the Craftmatic model. Do not touch Aternos, live Minecraft, SSH, or Ryan's Mac.

## Goal (about 10 minutes)

Keep styling `krutz-solar-house.schem` so the English stone-walled acre in front of the spruce/oak/cobble house looks finished: natural grades into the wall, flower verges, fewer hatches, no crater, no bright marker colors.

## Mapping

- Schematic: `krutz-solar-house.schem` (118×41×139, expanded depth+height)
- World → local: `localX = worldX + 630`, `localY = worldY - 44`, `localZ = worldZ - 352` (ORIGIN_Y shifted after underground expand)
- House (do not destroy): `wx <= -592`, `wz 410–430`, roof panels/stations at y≈77, water at x=-620..-618
- Solar hill (do not flatten): `wx >= -526`, `wz 446–464`
- Garden walls: x=-590 / x=-528 / z=368 / z=474; east gate z=420–421
- Soil: x<-566 → 64; x<-552 → 66; x<-538 → 68; else 70
- Station lattice (range 4): xs [-584,-575,-567,-561,-553,-547,-539,-533]; zs [374,383,392,401,410,415,424,429,435,444,453,462,471] (~104 stations). Coverage must stay 0 uncovered farmland.

## Tooling

```bash
cd estate-schem && npm ci
# re-apply color patch after install (node_modules is not in git)
node -e "
const fs=require('fs');
const path='node_modules/craftmatic/dist/blocks/colors.js';
let s=fs.readFileSync(path,'utf8');
const snip=fs.readFileSync('patches/craftmatic-colors-snippet.js','utf8');
if (!s.includes('alaindustrial:garden_drone_station')) {
  s=s.replace(\"'minecraft:dirt': [134, 96, 67],\", \"'minecraft:dirt': [134, 96, 67],\\n\"+snip);
  fs.writeFileSync(path,s);
}
"
node node_modules/craftmatic/bin/craftmatic.js view ../krutz-solar-house.schem --port 3000
```

Parse/write:

```js
import { parseToGrid } from './estate-schem/node_modules/craftmatic/dist/schem/parse.js';
import { writeSchematic } from './estate-schem/node_modules/craftmatic/dist/schem/write.js';
// writeSchematic(grid, 'krutz-solar-house.schem', 3700)
```

Camera: `globalThis.__view = { camera, controls }` after the viewer loads.

## Already done in the current schem

- Moat filled / banks stepped to the wall
- Mixed stone / mossy / cracked wall with slab + lantern rhythm
- Front lawn instead of hedge across the doors
- Azalea hedge, lily ponds with stone rims, flower ribbon on path verges
- East gate pillars + path, 104 surface stations, uncovered farmland = 0
- Color snippet for Ala blocks and sand/gravel/doors

## Still improve

1. Soften any remaining stone cliffs or flat skirts outside the wall (especially north/east).
2. Break the four solid crop stripes with more grass/flower breaks without breaking drone coverage.
3. Make the west lawn meet the house steps and y=64 terrace as one grade.
4. Detail the path (benches, occasional posts, no clutter).
5. After each write, reload the viewer and screenshot north wall, east gate, house front, overview. Fix what still looks cut or bare.
6. Commit the updated `krutz-solar-house.schem` (and any scripts) when done.

## Hard limits

- Do not delete worlds, player files, or Aternos servers.
- Do not SSH anywhere, do not install Ice and Fire, do not reinstall craftmatic (loses custom writer if present; this cloud install is fresh npm so use stock write.js).
- Do not set gamerule doMobSpawning false.
- Do not claim live drones work; this is the model only.

## Ambition build (this session)

Schematic expanded to **118×41×139** (`localY = worldY - 44`).

Memorable features shipped:
- Central fountain court on the main path (~-560,420) with sea-lantern basin glow
- East-gate visitor pavilion + glass greenhouse + flagstone apron
- Hillside solar farm (radiant/moonlit/daylight panels) + buried battery hall + bone-farm stub + chimney/campfire
- House-front carriage loop, pantry wing stub, west dock + bridge
- Formal English garden room, orchard + well, rose parterre, vineyard trellis
- Night lantern ring on walls/towers; path posts; gate banners

Coverage target unchanged: ~104 lattice stations, uncovered farmland = 0.
