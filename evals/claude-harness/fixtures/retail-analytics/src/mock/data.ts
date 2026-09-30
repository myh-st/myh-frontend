/**
 * BACKEND-OWNED seed data for the Reporting API mock. Do not edit.
 * Sales facts are generated with a seeded pseudo-random generator so every run returns identical numbers.
 */
import type { Anomaly, Category, Me, Region, Role, SegmentOption, StoreDetail } from '../api/types';

export const DATA_VERSION = 318;
export const REFRESHED_AT = '2026-09-29T05:40:00Z';
/** Last date with loaded sales data. */
export const DATA_END = '2026-09-28';
/** First date users may query. Older facts exist only to serve prior-period comparisons. */
export const AVAILABLE_FROM = '2026-04-02';
export const DEFAULT_RANGE = { from: '2026-07-01', to: '2026-09-28' };
export const MAX_RANGE_DAYS = 180;
/** Stores whose POS feed is delayed in the `partial` scenario. */
export const PARTIAL_MISSING_STORES = ['st-302', 'st-402'];

export const users: Record<Role, Me> = {
  analyst: { id: 'u-204', name: 'Priya Raman', role: 'analyst', regions: ['r-ne', 'r-se', 'r-mw', 'r-w'], permissions: ['reports:read', 'exports:create'] },
  regional_manager: { id: 'u-311', name: 'Marcus Oyelaran-Whitfield', role: 'regional_manager', regions: ['r-se'], permissions: ['reports:read', 'exports:create'] },
  viewer: { id: 'u-402', name: 'Dana Kowalczyk', role: 'viewer', regions: ['r-ne', 'r-se', 'r-mw', 'r-w'], permissions: ['reports:read'] },
};

export const regions: Region[] = [
  { id: 'r-ne', name: 'Northeast' },
  { id: 'r-se', name: 'Southeast' },
  { id: 'r-mw', name: 'Midwest' },
  { id: 'r-w', name: 'West' },
];

export const categories: Category[] = [
  { id: 'c-apparel', name: 'Apparel' },
  { id: 'c-footwear', name: 'Footwear' },
  { id: 'c-home', name: 'Home & Kitchen' },
  { id: 'c-beauty', name: 'Beauty & Personal Care' },
  { id: 'c-elec', name: 'Electronics Accessories' },
  { id: 'c-outdoor', name: 'Outdoor & Travel' },
];

export const segments: SegmentOption[] = [
  { id: 'online', name: 'Online', description: 'Orders placed on the website or app, including ship-from-store and click-and-collect.' },
  { id: 'in_store', name: 'In store', description: 'Orders rung up at a physical register or mobile POS.' },
  { id: 'loyalty', name: 'Loyalty members', description: 'Orders where a Storefront Rewards member ID was attached at checkout.' },
  { id: 'new_customers', name: 'New customers', description: 'First order from a customer not seen in the previous 24 months.' },
];

export const stores: StoreDetail[] = [
  { id: 'st-101', name: 'Boston Newbury Street Flagship', region: 'r-ne', regionName: 'Northeast', format: 'flagship', status: 'open', openedOn: '2014-03-22', manager: 'Aoife Brennan', address: '214 Newbury St, Boston, MA 02116', notes: 'Three-floor flagship with in-store tailoring and a personal-shopping suite. Highest average order value in the fleet.' },
  { id: 'st-102', name: 'Brooklyn Atlantic Terminal', region: 'r-ne', regionName: 'Northeast', format: 'mall', status: 'open', openedOn: '2017-09-09', manager: 'Jamal Whitaker', address: '139 Flatbush Ave, Brooklyn, NY 11217', notes: 'High footfall from the transit hub; basket sizes are small and weekday lunchtime traffic is a large share of visits.' },
  { id: 'st-103', name: 'King of Prussia Mall — Upper Level, Plaza Wing next to the Nordstrom entrance', region: 'r-ne', regionName: 'Northeast', format: 'mall', status: 'remodeling', openedOn: '2012-11-02', manager: 'Teresa Ng', address: '160 N Gulph Rd, Suite 2150, King of Prussia, PA 19406', notes: 'Floor refit in progress from 3 Aug to mid-October 2026. Roughly 45% of selling space is behind hoarding; footwear wall and fitting rooms are relocated to the temporary pop-up at the Court entrance.' },
  { id: 'st-201', name: 'Atlanta Ponce City Market', region: 'r-se', regionName: 'Southeast', format: 'flagship', status: 'open', openedOn: '2016-05-14', manager: 'DeShawn Carter', address: '675 Ponce De Leon Ave NE, Atlanta, GA 30308', notes: 'Flagship with a café concession. Weekend events drive traffic spikes.' },
  { id: 'st-202', name: 'Orlando Vineland Premium Outlets', region: 'r-se', regionName: 'Southeast', format: 'outlet', status: 'open', openedOn: '2015-10-01', manager: 'Lucía Fernández', address: '8200 Vineland Ave, Orlando, FL 32821', notes: 'Tourist-heavy outlet; large international share and high conversion on clearance lines.' },
  { id: 'st-203', name: 'Charlotte SouthPark', region: 'r-se', regionName: 'Southeast', format: 'mall', status: 'temporarily_closed', openedOn: '2018-04-21', manager: 'Grace Holloway', address: '4400 Sharon Rd, Charlotte, NC 28211', notes: 'Closed since 10 Sep 2026 after water damage from a roof failure during the tropical-storm rain event. Reopening depends on the landlord insurance survey; staff reassigned to Atlanta and Orlando in the meantime.' },
  { id: 'st-301', name: 'Chicago Michigan Avenue Flagship', region: 'r-mw', regionName: 'Midwest', format: 'flagship', status: 'open', openedOn: '2013-08-17', manager: 'Katarzyna Nowak', address: '633 N Michigan Ave, Chicago, IL 60611', notes: 'Largest store by selling space. Home & Kitchen shop-in-shop on level 2.' },
  { id: 'st-302', name: 'Minneapolis Mall of America', region: 'r-mw', regionName: 'Midwest', format: 'mall', status: 'open', openedOn: '2019-03-30', manager: 'Erik Lindqvist', address: '60 E Broadway, Bloomington, MN 55425', notes: 'Strong outdoor & travel sales in shoulder seasons.' },
  { id: 'st-303', name: 'Columbus Easton Town Center', region: 'r-mw', regionName: 'Midwest', format: 'mall', status: 'open', openedOn: '2026-06-13', manager: 'Olivia Mensah', address: '4000 Easton Station, Columbus, OH 43219', notes: 'Newest store, opened 13 Jun 2026. No prior-year comparison available.' },
  { id: 'st-401', name: 'Seattle Pacific Place', region: 'r-w', regionName: 'West', format: 'mall', status: 'open', openedOn: '2016-02-06', manager: 'Kenji Watanabe', address: '600 Pine St, Seattle, WA 98101', notes: 'Footfall counters replaced on 3 Sep 2026; visits for 3–6 Sep are overstated.' },
  { id: 'st-402', name: 'Los Angeles Citadel Outlets', region: 'r-w', regionName: 'West', format: 'outlet', status: 'open', openedOn: '2014-06-28', manager: 'Rosa Delgado-Martínez', address: '100 Citadel Dr, Commerce, CA 90040', notes: 'Outlet with the fleet-wide lowest margin; carries end-of-line stock from all West stores.' },
  { id: 'st-900', name: 'E-commerce Fulfilment Hub (Reno, NV) — ships all web and app orders nationwide', region: 'r-w', regionName: 'West', format: 'online_hub', status: 'open', openedOn: '2011-01-10', manager: 'Samira Haddad', address: '1250 Commerce Pkwy, Reno, NV 89502', notes: 'Visits are web/app sessions, not footfall. Returns include both mail-in and return-to-store for online orders.' },
];

interface AnomalyEffect {
  /** Number of days the effect lasts, starting at the anomaly date. */
  days: number;
  revenue?: number;
  visits?: number;
  orders?: number;
  returns?: number;
  /** Multiplier applied to gross profit (revenue − cost). */
  profit?: number;
  /** Zero out all sales from the anomaly date onwards. */
  closed?: boolean;
}

export const anomalies: (Anomaly & { effect?: AnomalyEffect })[] = [
  { id: 'an-3110', metric: 'conversionRate', scope: { dimension: 'segment', key: 'online', label: 'Online' }, date: '2026-09-25', direction: 'down', magnitudePct: 18, explanation: 'Checkout completion fell for web and app orders after the payment provider enabled an additional 3-D Secure challenge for cards issued outside the US. Sessions were normal; orders recovered once the rule was rolled back on the evening of 26 Sep.' },
  { id: 'an-3107', metric: 'returnsRate', scope: { dimension: 'store', key: 'st-900', label: 'E-commerce Fulfilment Hub (Reno, NV) — ships all web and app orders nationwide' }, date: '2026-09-22', direction: 'up', magnitudePct: 186, explanation: 'Returns on online orders spiked after a batch of waterproof jackets (style family OUT-JKT-22) shipped with the wrong size chart printed on the swing tag. The carrier return portal logged 1,140 prepaid labels in 72 hours, most with reason code "too small".', effect: { days: 3, returns: 2.86 } },
  { id: 'an-3102', metric: 'revenue', scope: { dimension: 'store', key: 'st-203', label: 'Charlotte SouthPark' }, date: '2026-09-10', direction: 'down', magnitudePct: 100, explanation: 'Store closed after water damage from a roof failure. No sales recorded since the closure; online orders from the Charlotte area are still fulfilled by the Reno hub.', effect: { days: 999, closed: true } },
  { id: 'an-3098', metric: 'conversionRate', scope: { dimension: 'store', key: 'st-401', label: 'Seattle Pacific Place' }, date: '2026-09-03', direction: 'down', magnitudePct: 38, explanation: 'Footfall counter replacement at the Pine Street entrance double-counted visitors for four days. Orders were in line with forecast, so the conversion dip is a measurement artefact rather than a sales problem.', effect: { days: 4, visits: 1.61 } },
  { id: 'an-3091', metric: 'revenue', scope: { dimension: 'category', key: 'c-beauty', label: 'Beauty & Personal Care' }, date: '2026-08-28', direction: 'up', magnitudePct: 64, explanation: 'Labor Day weekend gift-with-purchase promotion on skincare sets drove revenue well above the seasonal baseline in every region. Margin held because the gift items were vendor-funded.', effect: { days: 3, revenue: 1.64, orders: 1.64 } },
  { id: 'an-3084', metric: 'grossMargin', scope: { dimension: 'region', key: 'r-se', label: 'Southeast' }, date: '2026-08-15', direction: 'down', magnitudePct: 22, explanation: 'Clearance markdowns of 40–60% on summer apparel went live two weeks earlier than the regional merchandising calendar because a price file was loaded against the wrong effective date. Unit sales rose but gross margin dropped for five days until the file was corrected.', effect: { days: 5, profit: 0.78, revenue: 1.12, orders: 1.15 } },
  { id: 'an-3073', metric: 'revenue', scope: { dimension: 'category', key: 'c-elec', label: 'Electronics Accessories' }, date: '2026-07-18', direction: 'down', magnitudePct: 31, explanation: 'Supplier allocation shortfall on USB-C chargers and MagSafe-compatible accessories left most stores with empty bays for six days; the web store showed these lines as back-ordered.', effect: { days: 6, revenue: 0.69, orders: 0.7 } },
  { id: 'an-3066', metric: 'returnsRate', scope: { dimension: 'category', key: 'c-footwear', label: 'Footwear' }, date: '2026-07-07', direction: 'up', magnitudePct: 57, explanation: 'Post-July 4th sale return wave on running shoes, concentrated in half sizes. Pattern matches the same week last year and is within the seasonal envelope once adjusted.', effect: { days: 4, returns: 1.57 } },
  { id: 'an-3059', metric: 'orders', scope: { dimension: 'store', key: 'st-303', label: 'Columbus Easton Town Center' }, date: '2026-06-13', direction: 'up', magnitudePct: 140, explanation: 'Grand-opening week with doorbuster offers and a local radio partnership. Expected; flagged only because the store has no baseline yet.', effect: { days: 7, orders: 2.4, revenue: 2.1, visits: 2.2 } },
];

export interface Fact {
  date: string;
  store: string;
  category: string;
  revenue: number;
  cost: number;
  visits: number;
  orders: number;
  returns: number;
}

export const dayMs = 86_400_000;
export const toTime = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
export const addDays = (iso: string, n: number) => new Date(toTime(iso) + n * dayMs).toISOString().slice(0, 10);
export const daysBetween = (a: string, b: string) => Math.round((toTime(b) - toTime(a)) / dayMs);

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FORMAT = {
  flagship: { visits: 1900, conv: 0.24, aov: 1.15, margin: 0.02 },
  mall: { visits: 1150, conv: 0.19, aov: 1, margin: 0 },
  outlet: { visits: 1350, conv: 0.27, aov: 0.7, margin: -0.12 },
  online_hub: { visits: 42000, conv: 0.031, aov: 1.05, margin: -0.03 },
};

const CATEGORY = {
  'c-apparel': { mix: 0.34, aov: 78, margin: 0.56, returns: 0.14 },
  'c-footwear': { mix: 0.17, aov: 112, margin: 0.44, returns: 0.11 },
  'c-home': { mix: 0.14, aov: 64, margin: 0.38, returns: 0.05 },
  'c-beauty': { mix: 0.13, aov: 41, margin: 0.62, returns: 0.03 },
  'c-elec': { mix: 0.1, aov: 36, margin: 0.29, returns: 0.07 },
  'c-outdoor': { mix: 0.12, aov: 139, margin: 0.41, returns: 0.06 },
} as const;

const DOW = [1.32, 0.86, 0.84, 0.88, 0.95, 1.08, 1.41]; // Sun..Sat

function effectFor(storeId: string, regionId: string, categoryId: string, date: string): AnomalyEffect[] {
  return anomalies
    .filter((a) => {
      if (!a.effect) return false;
      const d = daysBetween(a.date, date);
      if (d < 0 || d >= a.effect.days) return false;
      const { dimension, key } = a.scope;
      return (dimension === 'store' && key === storeId) || (dimension === 'region' && key === regionId) || (dimension === 'category' && key === categoryId);
    })
    .map((a) => a.effect as AnomalyEffect);
}

function generateFacts(): Fact[] {
  const out: Fact[] = [];
  const start = addDays(DATA_END, -359);
  for (let i = 0; i < 360; i++) {
    const date = addDays(start, i);
    const dow = DOW[new Date(toTime(date)).getUTCDay()];
    const season = 1 + 0.08 * Math.sin(((i + 60) / 365) * 2 * Math.PI);
    for (const store of stores) {
      if (date < store.openedOn) continue;
      const f = FORMAT[store.format];
      const storeScale = 0.8 + (hash(store.id) % 400) / 1000;
      const remodel = store.id === 'st-103' && date >= '2026-08-03' ? 0.55 : 1;
      for (const cat of categories) {
        const c = CATEGORY[cat.id as keyof typeof CATEGORY];
        const rnd = mulberry32(hash(`${store.id}|${cat.id}|${date}`));
        let visits = f.visits * storeScale * c.mix * dow * season * remodel * (0.9 + 0.2 * rnd());
        let orders = visits * f.conv * (0.85 + 0.3 * rnd());
        let revenue = orders * c.aov * f.aov * (0.9 + 0.2 * rnd());
        const margin = c.margin + f.margin + (rnd() - 0.5) * 0.04;
        let profit = revenue * margin;
        let returns = revenue * c.returns * (store.format === 'online_hub' ? 1.8 : 1) * (0.75 + 0.5 * rnd());
        for (const e of effectFor(store.id, store.region, cat.id, date)) {
          if (e.closed) {
            visits = orders = revenue = profit = returns = 0;
            continue;
          }
          visits *= e.visits ?? 1;
          orders *= e.orders ?? 1;
          revenue *= e.revenue ?? 1;
          profit *= (e.profit ?? 1) * (e.revenue ?? 1);
          returns *= (e.returns ?? 1) * (e.revenue ?? 1);
        }
        out.push({
          date,
          store: store.id,
          category: cat.id,
          revenue: Math.round(revenue * 100) / 100,
          cost: Math.round((revenue - profit) * 100) / 100,
          visits: Math.round(visits),
          orders: Math.round(orders),
          returns: Math.round(returns * 100) / 100,
        });
      }
    }
  }
  return out;
}

export const facts: Fact[] = generateFacts();
