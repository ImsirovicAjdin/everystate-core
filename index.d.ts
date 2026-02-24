/**
 * @everystate/core
 *
 * Path-based reactive state management.
 */

/** Detail object passed to wildcard and global subscribers */
export interface ChangeDetail {
  path: string;
  value: any;
  oldValue: any;
}

/** Unsubscribe function returned by store.subscribe() */
export type Unsubscribe = () => void;

/** The EveryState store instance */
export interface EveryStateStore {
  /**
   * Get value at a dot-separated path.
   * Returns entire state if no path is provided.
   */
  get(path?: string): any;

  /**
   * Set value at a dot-separated path and notify subscribers.
   * @returns The value that was set
   */
  set(path: string, value: any): any;

  /**
   * Run an async fetcher and manage loading/success/error status at `path.status`, `path.data`, `path.error`.
   * Supports AbortController cancellation.
   */
  setAsync(path: string, fetcher: (signal: AbortSignal) => Promise<any>): Promise<any>;

  /**
   * Cancel an in-flight async operation at path.
   */
  cancel(path: string): void;

  /**
   * Batch multiple set() calls. Subscribers fire once per unique path after the batch completes.
   * Supports nesting.
   */
  batch(fn: () => void): void;

  /**
   * Set multiple paths atomically.
   * Accepts a plain object `{ path: value }`, an array of `[path, value]` pairs, or a Map.
   */
  setMany(entries: Record<string, any> | [string, any][] | Map<string, any>): void;

  /**
   * Subscribe to changes at a path.
   * - Exact path: `handler(value, detail)` fires when that specific path changes.
   * - Wildcard (`'user.*'`): `handler(detail)` fires when any child of `user` changes.
   * - Global (`'*'`): `handler(detail)` fires on any change.
   * @returns Unsubscribe function
   */
  subscribe(path: string, handler: (valueOrDetail: any, detail?: ChangeDetail) => void): Unsubscribe;

  /**
   * Destroy the store, abort all async ops, and clear all subscriptions.
   */
  destroy(): void;
}

/**
 * Create a new EveryState store.
 * @param initial - Initial state object (deep-cloned)
 */
export function createEveryState(initial?: Record<string, any>): EveryStateStore;

/** Query client wrapper for EveryState async patterns */
export interface QueryClient {
  query(key: string, fetcher: (signal: AbortSignal) => Promise<any>): Promise<any>;
  subscribe(key: string, cb: (value: any) => void): Unsubscribe;
  subscribeToStatus(key: string, cb: (status: string) => void): Unsubscribe;
  subscribeToError(key: string, cb: (error: any) => void): Unsubscribe;
  getData(key: string): any;
  getStatus(key: string): string | undefined;
  getError(key: string): any;
  cancel(key: string): void;
  invalidate(key: string): void;
}

/**
 * Create a QueryClient that wraps an EveryState store with standard query patterns.
 */
export function createQueryClient(store: EveryStateStore): QueryClient;
