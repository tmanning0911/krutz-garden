// Textured 3D viewer for plot40.schem — uses craftmatic's real block PNGs.
import { parseToGrid } from './node_modules/craftmatic/dist/schem/parse.js';
import { startViewerServer } from './node_modules/craftmatic/dist/render/server.js';

const grid = await parseToGrid('plot40.schem');
startViewerServer(grid, { port: 3000 });
console.log('estate textured viewer http://localhost:3000', grid.countNonAir(), 'blocks');
