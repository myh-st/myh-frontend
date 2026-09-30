const { chromium } = require('playwright'); const { spawn } = require('child_process');
const [dir, route, w] = process.argv.slice(2); const port = 6500 + Math.floor(Math.random()*400);
(async () => {
  const srv = spawn('python3', [__dirname + '/spaserve.py', dir + '/dist', String(port)]); await new Promise(r => setTimeout(r, 800));
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: +w, height: 900 } }); const p = await ctx.newPage();
  await p.goto(`http://localhost:${port}${route}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  console.log(await p.evaluate(() => { const vw = innerWidth; return [...document.querySelectorAll('body *')].map(e => [e, e.getBoundingClientRect()]).filter(([e, r]) => r.right > vw + 1 && r.width > 0).slice(0, 6).map(([e, r]) => `${e.tagName}.${e.className} right=${Math.round(r.right)} vis=${getComputedStyle(e).visibility} tr=${getComputedStyle(e).transform}`).join('\n'); }));
  await b.close(); srv.kill();
})();
