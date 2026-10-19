# Vanderbilt estate — what is already decided

Taylor plays Minecraft Java 26.3 as Kutz4you (Microsoft Kutz6501, UUID 43ebb3b8-360d-46c2-b711-a25fc98557ef) on a Mac with a DualSense over USB. Fabric profile name is "26.3 with PS5 controller" (id fabric-26.3-controller, loader 0.19.5). Java 25 comes from the launcher runtime `java-runtime-epsilon`, not Homebrew. Mods stay as they are. Sodium stays 0.9.2. Do not install Ice and Fire or the industry-mod list.

The house they accepted is Claude's 1:1 schematic, `estate-schem/biltmore_1to1.schem`. Do not generate a competing château. The October 15 estate was deleted on purpose: the west wing was the only part you could enter, the upper floors had no stair, rooms were sealed behind walls, and lamp posts and floor lanterns made the grounds and the halls unusable.

## The build

A Biltmore-scale limestone mansion on a large walled property. Solarium, kitchen, basement, aquarium, barn for live animals, cherry trees, imperial grass gardens, a flowing fountain in front with gardens on both sides, and a gate that opens while you stand on it.

Materials: smooth quartz for the pale stone, deepslate tile roofs, dark oak floors. Quartz paths, grass lawns, stone lake shore. No sandstone, terracotta, cobble, gravel, dirt paths, or exposed dirt. Iron for the gate doors. Nothing hanging from chains. No copper bulbs or lanterns standing in the middle of rooms or across the lawns. Mob control is invisible `minecraft:light` plus lamps on the wall walk and the drive. Hostile sounds travel about 16 blocks, so the ground under the map stays solid and a lit band outside the wall keeps spawners out of earshot. Do not light the wilderness past that band.

The gate is pressure plates in the floor, both sides, mechanics buried. No surface redstone, levers, torches, or trapdoors. Sea lanterns and lanterns, not copper bulbs stuck on the walls. One end rod, the fountain jet.

Rooms must be enterable from the front door, with a real stair to every floor a player is meant to use. Doors go in existing openings and through walls that seal a whole wing. Tall arches stay open. Macaw's dark oak classic doors, quartz pane windows, and dark oak furniture. Do not put doors in front of glass. Do not mass-fill crawlspaces or layered floors.

## Systems that already worked

Hydrofarm and Energized Power are separate networks. Four quadrants on each bed have a planter and a seed in block-entity NBT. Pipes extract into labeled cellar chests. Seeds and planters live in barrels so neighboring collections do not merge. Pantry stores are barrels for the same reason. Easy Mob Farm and husbandry beds need a captured animal, so empty machines were never placed.

Solar: 170 panels, tiers 4 through 7, on a quartz terrace with a power house, lightning rod, and a cable spine back to the battery. Sky above every panel stays air. Powered lamps only glow when the cable has energy. Copper bulbs are the always-on lights.

Wall Clock and Watch (`wallclockwatch:analog_clock`) sits in a north-facing item frame on the north limestone face. Chunk entities live in `dimensions/minecraft/overworld/entities/`, not in the chunk's Entities tag. CustomName is a text-component compound, and `node_modules/craftmatic/dist/schem/write.js` writes compounds. Do not reinstall craftmatic or that writer is lost.

## How a build has to be made

This is the method. Follow it on every build.

1. Write code, not blocks. A program generates the whole build and saves a WorldEdit schematic. One rule updates every repeat of a detail: window surrounds, dormers, chimneys, wall bays, posts.

2. Research first. Pull real measurements before placing anything: nominations, fact sheets, guidebooks, and the reference pictures counted in blocks. At the agreed scale, the house, rooms, and features come out close to those sizes. A same-shaped stand-in at a different size is a different building.

3. Depth over flat walls. Windows set back into the wall. Cornices and pilasters stick out. Stairs, slabs, and walls are trim. Flat walls read as amateur.

4. Automated checks. Before calling a build done, run scripts: every room reachable on foot from the front door, no dark mob spots where the build is meant to be safe, doors and beds complete, every block valid for this Java version, and a gate that actually opens when its plate is pressed. That is how a walled-shut door, a mirrored layout, and a blocked stair get caught.

5. Compare against photos. Render the model and set it next to the reference. Wrong placements get fixed from that comparison. There are no public blueprints precise to the block, so room sizes and window counts stay a close reading of the photos. A screenshot of anything that looks off is the next correction.

## Current

The mansion is set aside. The live world is **Green Property**. The Kakitho curtain is gone. In its place is Hongmenbao, the Red Gate Castle of the Wang family compound in Lingshi, Shanxi, at 1 block = 1 meter.

The measured plan is 105 m by 180 m. One gate sits in the south wall, slightly east of center, with a carved brick screen wall (照壁) on the grass outside it. Materials follow the Qing Shanxi castle: grey brick walls (polished andesite and andesite), slate-grey tile roofs (andesite stairs), river cobbles on Dragon Scale Street, red lacquer on the fortress gate and street doors (crimson), dark oak beams and lattice, spruce upper floors, chiselled stone plaques. The wall is a little over 2 m thick, with a crenellated walk. Dragon Scale Street runs north from the gate, about 4 m wide and shifted 4.5 m east, and three cross lanes make the character 王. The street climbs about 15 m in four terraces. There are 27 courtyards: seven, seven, seven, and six. The ordinary courts are about 14 m wide. Each is a two-court house with a moon gate, a north cave hall, and a wooden room over it. Watchtowers sit on the northeast and northwest corners. Spawn is on the grass south of the screen, facing the gate. Buried plates open the red gates. Four solar panels sit in the west wall walk.

Kitchen gardens sit in the front yards of the four 底甲 courts along z≈70 (wheat at x=13, carrot at 27, potato at −19, beetroot at −6). Each is a 2×2 Hydrofarm bed plot with a path ring, a water tank, and a trapdoor supply barrel. Item pipes bury at y=62 under the beds and run under Dragon Scale Street (x=5) into the first east cave-hall pantry at z=49, y=65 — labeled Wheat / Carrot / Potato / Beetroot barrels. Liquid pipes sit one layer deeper at y=61 (spine x=4), fed by a cistern siphon under the pantry court. Hydrofarm and Energized Power stay separate networks.

## World
`Vanderbilt Estate` was removed on 15 Oct 2026. New World and New World (1) were not part of this and were left alone. Do not shrink the world border. 26.3 chunks live in `dimensions/minecraft/overworld/region/`. Spawn is a compound, not SpawnX/Y/Z. If Minecraft is open, do not write the world. A paste has to be a normal WorldEdit paste so pipes and redstone get neighbor updates.

Last layout, for when it is rebuilt: schematic origin world (−144, 48, −220), grass at y=80, gate at world (3, 81, −216), spawn [3, 81, −232] facing the gate. Property 288 by 434. South ridge rises from the wall, north valley falls to a stone-shored lake. Cherry grove north, meadow and peaks south, flower forest east, birch forest west.
