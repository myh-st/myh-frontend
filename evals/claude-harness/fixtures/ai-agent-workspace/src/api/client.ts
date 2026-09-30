/** BACKEND CONTRACT – Agent Runtime API client. Do not edit. */
import { get, send } from './http';
import type { ConversationSummary, Me, Message, PostMessageRequest, PostMessageResponse, RunDetail, WorkspaceScope } from './types';

const enc = encodeURIComponent;

export const api = {
  me: () => get<Me>('/api/me'),
  scope: () => get<WorkspaceScope>('/api/workspace/scope'),
  conversations: () => get<ConversationSummary[]>('/api/conversations'),
  createConversation: (body: { title: string }) => send<ConversationSummary>('POST', '/api/conversations', body),
  messages: (conversationId: string) => get<Message[]>(`/api/conversations/${enc(conversationId)}/messages`),
  /** Starts a billable model run. */
  postMessage: (conversationId: string, body: PostMessageRequest) =>
    send<PostMessageResponse>('POST', `/api/conversations/${enc(conversationId)}/messages`, body),
  run: (runId: string) => get<RunDetail>(`/api/runs/${enc(runId)}`),
  approveAction: (runId: string, actionId: string, body: { version: number }) =>
    send<RunDetail>('POST', `/api/runs/${enc(runId)}/actions/${enc(actionId)}/approve`, body),
  rejectAction: (runId: string, actionId: string, body: { version: number; reason: string }) =>
    send<RunDetail>('POST', `/api/runs/${enc(runId)}/actions/${enc(actionId)}/reject`, body),
  retryAction: (runId: string, actionId: string, body: { version: number }) =>
    send<RunDetail>('POST', `/api/runs/${enc(runId)}/actions/${enc(actionId)}/retry`, body),
  cancelRun: (runId: string) => send<RunDetail>('POST', `/api/runs/${enc(runId)}/cancel`),
};
