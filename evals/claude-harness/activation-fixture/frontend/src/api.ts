export async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { credentials: 'include' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
export const endpoints = {
  opsSummary: '/api/ops/summary', opsQueue: '/api/ops/queue', login: '/auth/login', sso: '/auth/sso/start',
  integrations: '/api/integrations', workflows: '/api/workflows', records: '/api/records', assistant: '/api/assistant',
};
