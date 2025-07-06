// Local storage (device-specific data)
export interface VisitStorageData {
  visitCount?: number;
  lastSyncedCount?: number;
  lastDateStr?: string;
}

export interface StorageLastDate {
  lastDateStr?: string;
}

// Sync storage (cross-browser synced settings)
export interface SyncStorageData {
  chatgptBlocked?: boolean;
}

export interface SupabaseInvokeResponse<T = unknown> {
  data?: T;
  error?: unknown;
}

export interface VisitCountResponse {
  count?: number;
}

// Chart data types
export interface VisitHistoryEntry {
  date: string;
  visits: number;
}

export interface VisitHistoryResponse {
  data?: VisitHistoryEntry[];
  error?: unknown;
}

export type TimePeriod = '1W' | '1M' | '1Y';
