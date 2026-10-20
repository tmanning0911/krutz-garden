# Cloud garden build brief

Work only on the Craftmatic model. Do not touch Aternos, live Minecraft, SSH, or Ryan's Mac.

## Goal (about 10 minutes)

Keep styling `krutz-solar-house.schem` so the English stone-walled acre in front of the spruce/oak/cobble house looks finished: natural grades into the wall, flower verges, fewer hatches, no crater, no bright marker colors.

## Mapping

- Schematic: `krutz-solar-house.schem` (128×47×143, expanded W/H/N + taller spires)
- World → local: `localX = worldX + 634`, `localY = worldY - 44`, `localZ = worldZ - 348` (ORIGIN_X/Z shifted after west+north expand)
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

Schematic expanded to **128×47×143** (`localX = worldX + 634`, `localY = worldY - 44`, `localZ = worldZ - 348`).

Memorable features shipped:
- Central fountain court on the main path (~-560,420) with sea-lantern basin glow
- East-gate visitor pavilion + glass greenhouse + flagstone apron
- Hillside solar farm (radiant/moonlit/daylight panels) + buried battery hall + bone-farm stub + chimney/campfire
- House-front carriage loop, pantry wing stub, west dock + bridge
- Formal English garden room, orchard + well, rose parterre, vineyard trellis
- Night lantern ring on walls/towers; path posts; gate banners
- Formal hedge maze (SW beds) with center plinth
- Reflecting pool court + spruce bridge (SE of fountain)
- Herb spiral near house, sundial garden, NW lookout tower
- Buried pantry/sorting stub under east approach
- Softened NW/W exterior skirts
- Waterfall cascade + base pool; rose garden room; oak pergola walk
- Bee apiary; meditation pavilion; carriage stables stub
- Glass cutaway deep-farm window (north) + night path sea-lantern glow
- Healed floating exterior skirts; moon gate; firefly glade; SE amphitheatre
- Expanded greenhouse; fountain end-rod jet; wall-walk parapet
- Zen stepping stones; icehouse cellar; lantern festival posts; NE chapel ruin
- Tea pavilion; iris canal; compost yard; archery butts; willow walk; clock-tower folly
- Stone library; lavender walk; rain cistern; potting shed; wall merlons
- Market stalls; stepping brook; herb wheel; observatory pad; cart track; scarecrows
- Undercroft fill; rose-arch walk; beehive expansion; quarry overlook
- Zen gravel court; hop trellis; camp kitchen; map gazebo; moss steps
- Statue court; reed marsh; drying racks; drain swales; toll booth
- Wine cellar; topiary; millstone ruin; wildflower N strip; battery vents
- NW observatory cupola; koi bridge rails; tool shed; lavender ribbon; solar inverter cabinets
- Secret pantry tunnel; west landing pier; crop mosaic; maple grove; clock tower


- East orchard nursery + shed; candle labyrinth; boat house loft
- Herb drying loft; SE lighthouse; fairy mushroom rings; fountain mosaic
- Bocce court; potager diamonds; amphora plaza; reed beds; cable markers
- Shepherd hut + sheep paddock; fire circle; memorial oak; east service gate
- Laundry yard; root cellar; bird bath; maze plinth; fountain rim lanterns
- Rain garden swale; espalier apple; gatehouse bell; wall seat niches
- Path cobble mix; wall ivy; house-front planters; solar apron
Coverage target unchanged: ~104 lattice stations, uncovered farmland = 0.
