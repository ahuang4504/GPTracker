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
