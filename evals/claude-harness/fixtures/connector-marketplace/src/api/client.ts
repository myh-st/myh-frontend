/** BACKEND CONTRACT – Connector Service API client. Do not edit. */
import { get, send } from './http';
import type {
  Connection,
  ConnectionDetail,
  ConnectionStatus,
  ConnectorType,
  CreateConnectionRequest,
  CreateConnectionResult,
  DisconnectImpact,
  DisconnectResult,
  Me,
  OAuthPendingConnection,
  ReauthorizeResult,
  TestResult,
} from './types';

const path = (id: string) => `/api/connections/${encodeURIComponent(id)}`;

export const isOAuthPending = (r: CreateConnectionResult): r is OAuthPendingConnection => 'authorizationUrl' in r;

export const api = {
  me: () => get<Me>('/api/me'),
  catalog: () => get<ConnectorType[]>('/api/connectors/catalog'),
  connections: (filters: { status?: ConnectionStatus; type?: string } = {}) => {
    const q = new URLSearchParams();
    if (filters.status) q.set('status', filters.status);
    if (filters.type) q.set('type', filters.type);
    const qs = q.toString();
    return get<Connection[]>(`/api/connections${qs ? `?${qs}` : ''}`);
  },
  connection: (id: string) => get<ConnectionDetail>(path(id)),
  impact: (id: string) => get<DisconnectImpact>(`${path(id)}/impact`),
  create: (body: CreateConnectionRequest) => send<CreateConnectionResult>('POST', '/api/connections', body),
  test: (id: string) => send<TestResult>('POST', `${path(id)}/test`),
  reauthorize: (id: string) => send<ReauthorizeResult>('POST', `${path(id)}/reauthorize`),
  reconnect: (id: string, body: { version: number }) => send<ConnectionDetail>('POST', `${path(id)}/reconnect`, body),
  rotateCredentials: (id: string, body: { version: number; credentials: Record<string, string> }) =>
    send<ConnectionDetail>('PATCH', `${path(id)}/credentials`, body),
  disconnect: (id: string, version: number) => send<DisconnectResult>('DELETE', `${path(id)}?version=${version}`),
};
