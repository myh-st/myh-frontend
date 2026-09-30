const { chromium } = require('playwright'); const { AxeBuilder } = require('@axe-core/playwright'); const { spawn } = require('child_process');
const [dir, route] = process.argv.slice(2); const port = 5900 + Math.floor(Math.random()*500);
(async () => {
  const srv = spawn('python3', [__dirname + '/spaserve.py', dir + '/dist', String(port)]); await new Promise(r => setTimeout(r, 800));
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1024, height: 900 } }); const p = await ctx.newPage();
  await p.goto(`http://localhost:${port}${route}`, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  const r = await new AxeBuilder({ page: p }).withTags(['wcag2a','wcag2aa']).analyze();
  for (const v of r.violations) for (const n of v.nodes) console.log(v.id, '|', n.target.join(' '), '|', (n.any[0]||{}).message);
  await b.close(); srv.kill();
})();
