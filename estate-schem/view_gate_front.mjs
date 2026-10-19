// Close-up textured viewer of the bastion gate + front steps only.
import { parseToGrid } from './node_modules/craftmatic/dist/schem/parse.js';
import { BlockGrid } from './node_modules/craftmatic/dist/schem/types.js';
import { startViewerServer } from './node_modules/craftmatic/dist/render/server.js';

const src = await parseToGrid('plot40.schem');
const PAD = 10;
// World window around the north gate
const x0 = 60, x1 = 80, z0 = -10, z1 = 8, y0 = 0, y1 = 20;
const w = x1 - x0 + 1;
const h = y1 - y0 + 1;
const l = z1 - z0 + 1;
const grid = new BlockGrid(w, h, l);
for (let y = y0; y <= y1; y++) {
  for (let z = z0; z <= z1; z++) {
    for (let x = x0; x <= x1; x++) {
      const s = src.get(x + PAD, y, z + PAD);
      if (s && s !== 'minecraft:air') grid.set(x - x0, y - y0, z - z0, s);
    }
  }
}
startViewerServer(grid, { port: 3001 });
console.log('gate close-up http://localhost:3001', grid.countNonAir(), 'blocks');
