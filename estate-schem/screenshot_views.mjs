/**
 * Screenshot craftmatic viewer at key garden angles.
 * Mesh: mx = (wx+634) - SX/2, my = wy-44, mz = (wz-348) - SZ/2
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const OUT = '/opt/cursor/artifacts/screenshots';
fs.mkdirSync(OUT, { recursive: true });

const SX = 122,
  SZ = 143;
const halfW = SX / 2,
  halfL = SZ / 2;
const toMesh = (wx, wy, wz) => ({
  x: wx + 634 - halfW,
  y: wy - 44,
  z: wz - 348 - halfL,
});

const views = [
  {
    name: 'overview',
    cam: toMesh(-500, 130, 520),
    target: toMesh(-560, 66, 420),
  },
  {
    name: 'north-wall',
    cam: toMesh(-558, 95, 330),
    target: toMesh(-558, 68, 390),
  },
  {
    name: 'east-gate',
    cam: toMesh(-490, 95, 420),
    target: toMesh(-530, 72, 420),
  },
  {
    name: 'house-front',
    // from garden looking west at house doors
    cam: toMesh(-575, 78, 420),
    target: toMesh(-598, 70, 420),
  },
];

async function main() {
  const { default: puppeteer } = await import('puppeteer-core');
  const browser = await puppeteer.launch({
    executablePath: '/usr/local/bin/google-chrome',
    headless: true,
    args: [
      '--no-sandbox',
      '--enable-webgl',
      '--enable-unsafe-swiftshader',
      '--use-gl=swiftshader',
      '--ignore-gpu-blocklist',
      '--window-size=1600,1000',
    ],
    defaultViewport: { width: 1600, height: 1000 },
  });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:3000/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => globalThis.__view?.camera, { timeout: 120000 });
  await new Promise((r) => setTimeout(r, 5000));

  for (const v of views) {
    await page.evaluate((view) => {
      const { camera, controls } = globalThis.__view;
      controls.enableDamping = false;
      camera.position.set(view.cam.x, view.cam.y, view.cam.z);
      controls.target.set(view.target.x, view.target.y, view.target.z);
      controls.update();
      camera.lookAt(controls.target);
      camera.updateMatrixWorld(true);
    }, v);
    await new Promise((r) => setTimeout(r, 1200));
    const dest = path.join(OUT, `krutz-${v.name}.png`);
    await page.screenshot({ path: dest, type: 'png' });
    console.log('wrote', dest, 'cam', v.cam, 'tgt', v.target);
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
