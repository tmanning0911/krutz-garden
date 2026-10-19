// Textured viewer for the live Ironcrest world snapshot (includes in-game edits).
import { parseToGrid } from './node_modules/craftmatic/dist/schem/parse.js';
import { BlockGrid } from './node_modules/craftmatic/dist/schem/types.js';
import { startViewerServer } from './node_modules/craftmatic/dist/render/server.js';

const src = await parseToGrid('live_ironcrest.schem');
startViewerServer(src, { port: 3000 });
console.log('live Ironcrest http://localhost:3000', src.countNonAir(), 'blocks');

// Gate close-up — north bastion where the stone + windows were added
const x0 = 55, x1 = 105, z0 = 0, z1 = 25, y0 = 0, y1 = 40;
const grid = new BlockGrid(x1 - x0 + 1, y1 - y0 + 1, z1 - z0 + 1);
for (let y = y0; y <= y1; y++) {
  for (let z = z0; z <= z1; z++) {
    for (let x = x0; x <= x1; x++) {
      const s = src.get(x, y, z);
      if (s && s !== 'minecraft:air') grid.set(x - x0, y - y0, z - z0, s);
    }
  }
}
startViewerServer(grid, { port: 3001 });
console.log('gate edits close-up http://localhost:3001', grid.countNonAir(), 'blocks');
