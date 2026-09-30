// Usage: node verify.js <appDir> <outDir> <routesJson>
// routesJson: {"primary": "/alerts", "detail": "/alerts/AL-2041", "extra": [...]}
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const [appDir, outDir, routesArg] = process.argv.slice(2);
const routes = JSON.parse(routesArg);
fs.mkdirSync(outDir, { recursive: true });
const WIDTHS = [375, 768, 1024, 1440];
const SCENARIOS = ['slow', 'empty', 'error', 'forbidden', 'partial'];

function startPreview(port) {
  const p = spawn('python3', [__dirname + '/spaserve.py', path.join(appDir, 'dist'), String(port)], { stdio: ['ignore', 'pipe', 'ignore'] });
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('preview timeout')), 30000);
    p.stdout.on('data', (d) => { if (/Local/.test(d.toString())) { clearTimeout(t); resolve(p); } });
    p.on('exit', (c) => reject(new Error('preview exited ' + c)));
  });
}

async function settle(page, ms = 1800) { await page.waitForTimeout(ms); }

(async () => {
  const port = 4300 + Math.floor(Math.random() * 1500);
  const server = await startPreview(port);
  const base = `http://localhost:${port}`;
  const browser = await chromium.launch();
  const report = { base, responsive: {}, keyboard: {}, reducedMotion: {}, axe: {}, scenarios: {}, loadRequests: {}, consoleErrors: [] };
  try {
    const pages = [['primary', routes.primary], ['detail', routes.detail], ...(routes.extra || []).map((r, i) => ['extra' + i, r])].filter(([, r]) => r);
    // Responsive + load-time requests
    for (const [name, route] of pages) {
      report.responsive[name] = {};
      for (const w of WIDTHS) {
        const ctx = await browser.newContext({ viewport: { width: w, height: w < 768 ? 812 : 900 } });
        const page = await ctx.newPage();
        const mutations = [];
        page.on('console', (m) => { if (m.type() === 'error') report.consoleErrors.push(`${name}@${w}: ${m.text().slice(0, 200)}`); });
        page.on('pageerror', (e) => report.consoleErrors.push(`${name}@${w} pageerror: ${e.message.slice(0, 200)}`));
        await page.addInitScript(() => {
          const orig = window.fetch;
          window.__calls = [];
          Object.defineProperty(window, 'fetch', {
            configurable: true,
            get() { return this.__f || orig; },
            set(v) { const inner = v; this.__f = (i, init) => { const m = (init && init.method) || 'GET'; window.__calls.push(m + ' ' + (typeof i === 'string' ? i : i.url || String(i))); return inner(i, init); }; },
          });
        });
        await page.goto(base + route, { waitUntil: 'networkidle' });
        await settle(page);
        const m = await page.evaluate(() => {
          const vw = window.innerWidth;
          const doc = document.documentElement;
          const offenders = [];
          for (const el of document.querySelectorAll('body *')) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            if (r.right > vw + 1) {
              // ignore if inside an element that scrolls horizontally
              let p = el.parentElement, scrollable = false;
              while (p && p !== document.body) { const cs = getComputedStyle(p); if (/(auto|scroll|hidden)/.test(cs.overflowX) && p.scrollWidth > p.clientWidth - 1) { scrollable = true; break; } p = p.parentElement; }
              if (!scrollable) offenders.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''} right=${Math.round(r.right)}`);
            }
          }
          const smallTargets = [...document.querySelectorAll('button, a[href], input, select, [role=button]')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 24; }).length;
          return { scrollWidth: doc.scrollWidth, innerWidth: vw, pageOverflowX: doc.scrollWidth > vw + 1, offenders: offenders.slice(0, 8), offenderCount: offenders.length, smallTargets, textLen: document.body.innerText.length, calls: window.__calls || [] };
        });
        const shot = path.join(outDir, `${name}-${w}.png`);
        await page.screenshot({ path: shot, fullPage: true });
        report.responsive[name][w] = { ...m, screenshot: path.basename(shot) };
        if (w === 1440) report.loadRequests[name] = m.calls;
        delete report.responsive[name][w].calls;
        await ctx.close();
      }
    }
    // Keyboard focus at 1440 and 375 on primary + detail
    for (const [name, route] of pages.slice(0, 2)) {
      for (const w of [1440, 375]) {
        const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
        const page = await ctx.newPage();
        await page.goto(base + route, { waitUntil: 'networkidle' });
        await settle(page);
        const stops = [];
        for (let i = 0; i < 30; i++) {
          await page.keyboard.press('Tab');
          const info = await page.evaluate(() => {
            const el = document.activeElement;
            if (!el || el === document.body) return null;
            const cs = getComputedStyle(el);
            const visible = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
            const lb = el.getAttribute('aria-labelledby'); const name = (el.getAttribute('aria-label') || (lb ? lb.split(' ').map((i) => (document.getElementById(i) || {}).innerText || '').join(' ') : '') || el.innerText || el.getAttribute('title') || el.getAttribute('placeholder') || (el.labels && el.labels[0] && el.labels[0].innerText) || '').trim().slice(0, 40);
            const r = el.getBoundingClientRect();
            return { tag: el.tagName.toLowerCase(), role: el.getAttribute('role'), name, focusVisible: visible, outline: cs.outlineStyle + ' ' + cs.outlineWidth, inViewportX: r.right <= window.innerWidth + 1 };
          });
          if (info) stops.push(info);
        }
        if (w === 1440) await page.screenshot({ path: path.join(outDir, `${name}-focus-1440.png`) });
        const uniq = stops.length;
        report.keyboard[`${name}@${w}`] = { stops: uniq, focusVisible: stops.filter((s) => s.focusVisible).length, unnamed: stops.filter((s) => !s.name).length, sample: stops.slice(0, 12) };
        await ctx.close();
      }
    }
    // Reduced motion + axe
    for (const [name, route] of pages.slice(0, 2)) {
      const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 }, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await page.goto(base + route, { waitUntil: 'networkidle' });
      await settle(page, 800);
      report.reducedMotion[name] = await page.evaluate(() => {
        const anims = document.getAnimations().filter((a) => a.playState === 'running');
        let rules = 0;
        for (const ss of document.styleSheets) { try { for (const r of ss.cssRules) if (r.conditionText && r.conditionText.includes('prefers-reduced-motion')) rules++; } catch {} }
        return { runningAnimationsUnderReduce: anims.length, reducedMotionMediaRules: rules };
      });
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      report.axe[name] = axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
      await ctx.close();
    }
    // Scenarios on primary (1024) and detail
    for (const [name, route] of pages.slice(0, 2)) {
      for (const sc of SCENARIOS) {
        const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
        const page = await ctx.newPage();
        const sep = route.includes('?') ? '&' : '?';
        await page.goto(base + route + sep + 'scenario=' + sc, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(sc === 'slow' ? 700 : 2200);
        const text = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 700);
        const live = await page.evaluate(() => document.querySelectorAll('[aria-live],[role=status],[role=alert]').length);
        await page.screenshot({ path: path.join(outDir, `${name}-scenario-${sc}.png`) });
        report.scenarios[`${name}:${sc}`] = { text, liveRegions: live };
        await ctx.close();
      }
    }
  } catch (e) {
    report.error = String(e && e.stack || e).slice(0, 800);
  } finally {
    await browser.close();
    server.kill('SIGTERM');
  }
  report.consoleErrors = [...new Set(report.consoleErrors)].slice(0, 30);
  fs.writeFileSync(path.join(outDir, 'verify.json'), JSON.stringify(report, null, 1));
  console.log('done', outDir);
  process.exit(0);
})();
