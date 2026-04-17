import Dexie, { type Table } from 'dexie';

/**
 * Local persistence and mutation queue for offline-first operation.
 *
 * Two concerns:
 *   1) Cache: server responses stored by resource + key so screens can
 *      render instantly while offline. Entries carry an updatedAt
 *      timestamp used by stale-while-revalidate logic.
 *   2) Queue: user mutations captured while offline, replayed in FIFO
 *      order when the network returns. Each entry has a stable clientId
 *      so server responses can reconcile optimistic records.
 */

export type ResourceKind =
  | 'projects'
  | 'tasks'
  | 'inbox'
  | 'goals'
  | 'docs'
  | 'sprints'
  | 'time-entries'
  | 'workspaces'
  | 'users';

export interface CacheRow {
  id: string;            // `${resource}:${key}`
  resource: ResourceKind;
  key: string;
  payload: unknown;
  updatedAt: number;
}

export interface QueueRow {
  id?: number;           // auto-increment
  clientId: string;      // uuid, attached to optimistic records
  resource: ResourceKind;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  body?: unknown;
  headers?: Record<string, string>;
  createdAt: number;
  attempts: number;
  lastError?: string;
  status: 'pending' | 'in-flight' | 'failed';
}

class LinearPrecisionDB extends Dexie {
  cache!: Table<CacheRow, string>;
  queue!: Table<QueueRow, number>;

  constructor() {
    super('lp-mobile');
    this.version(1).stores({
      cache: 'id, resource, key, updatedAt',
      queue: '++id, clientId, resource, status, createdAt',
    });
  }
}

export const db = new LinearPrecisionDB();

// ---------- Cache helpers ----------

export async function cachePut(resource: ResourceKind, key: string, payload: unknown): Promise<void> {
  await db.cache.put({
    id: `${resource}:${key}`,
    resource,
    key,
    payload,
    updatedAt: Date.now(),
  });
}

export async function cacheGet<T>(resource: ResourceKind, key: string): Promise<T | undefined> {
  const row = await db.cache.get(`${resource}:${key}`);
  return row?.payload as T | undefined;
}

export async function cacheInvalidate(resource: ResourceKind, key?: string): Promise<void> {
  if (key) {
    await db.cache.delete(`${resource}:${key}`);
    return;
  }
  await db.cache.where('resource').equals(resource).delete();
}

// ---------- Queue helpers ----------

export async function enqueue(entry: Omit<QueueRow, 'id' | 'createdAt' | 'attempts' | 'status'>): Promise<number> {
  return db.queue.add({
    ...entry,
    createdAt: Date.now(),
    attempts: 0,
    status: 'pending',
  });
}

export async function pendingQueue(): Promise<QueueRow[]> {
  return db.queue.where('status').notEqual('in-flight').sortBy('createdAt');
}

export async function markInFlight(id: number): Promise<void> {
  await db.queue.update(id, { status: 'in-flight' });
}

export async function markFailed(id: number, error: string): Promise<void> {
  const row = await db.queue.get(id);
  await db.queue.update(id, {
    status: 'failed',
    attempts: (row?.attempts ?? 0) + 1,
    lastError: error,
  });
}

export async function removeQueued(id: number): Promise<void> {
  await db.queue.delete(id);
}

export async function clearAll(): Promise<void> {
  await db.cache.clear();
  await db.queue.clear();
}
