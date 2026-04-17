import { Network } from '@capacitor/network';
import {
  markFailed,
  markInFlight,
  pendingQueue,
  removeQueued,
  type QueueRow,
} from './db';
import { getAccessToken, getActiveWorkspaceId } from '../auth/token-store';

/**
 * Replays queued mutations against the backend when connectivity returns.
 *
 * Listens for:
 *   - 'lp:online' custom event fired by init-native when network reconnects
 *   - Boot-time network status check
 * Runs FIFO with a single in-flight request at a time to preserve
 * causal ordering (e.g., create-then-update on the same task).
 */

const MAX_ATTEMPTS = 5;
let running = false;

export function startSyncEngine(apiBaseUrl: string): () => void {
  const run = () => {
    void drain(apiBaseUrl);
  };

  void (async () => {
    const status = await Network.getStatus();
    if (status.connected) run();
  })();

  const onOnline = () => run();
  window.addEventListener('lp:online', onOnline);

  return () => {
    window.removeEventListener('lp:online', onOnline);
  };
}

async function drain(apiBaseUrl: string): Promise<void> {
  if (running) return;
  running = true;
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const batch = await pendingQueue();
      const next = batch.find((r) => r.status === 'pending' && r.attempts < MAX_ATTEMPTS);
      if (!next) break;
      const ok = await send(apiBaseUrl, next);
      if (!ok) break; // Back off — wait for next trigger
    }
  } finally {
    running = false;
  }
}

async function send(apiBaseUrl: string, entry: QueueRow): Promise<boolean> {
  if (entry.id === undefined) return false;
  await markInFlight(entry.id);
  const url = entry.url.startsWith('http') ? entry.url : `${apiBaseUrl}${entry.url}`;
  const access = getAccessToken();
  const workspaceId = getActiveWorkspaceId();
  const isAuthPath = entry.url.startsWith('/auth') || entry.url.includes('/api/v1/auth');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Client-Id': entry.clientId,
    ...(entry.headers ?? {}),
    ...(access ? { Authorization: `Bearer ${access}` } : {}),
    ...(workspaceId && !isAuthPath ? { 'X-Workspace-Id': workspaceId } : {}),
  };
  try {
    const res = await fetch(url, {
      method: entry.method,
      headers,
      body: entry.body === undefined ? undefined : JSON.stringify(entry.body),
    });
    if (!res.ok) {
      await markFailed(entry.id, `HTTP ${res.status}`);
      return res.status >= 500; // Retry on 5xx, give up on 4xx
    }
    await removeQueued(entry.id);
    window.dispatchEvent(new CustomEvent('lp:sync-success', { detail: { clientId: entry.clientId } }));
    return true;
  } catch (err) {
    await markFailed(entry.id, err instanceof Error ? err.message : String(err));
    return false;
  }
}
