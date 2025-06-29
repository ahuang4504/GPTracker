export interface VisitStorageData {
  visitCount?: number;
  displayCount?: number;
  lastSyncedCount?: number;
  lastDateStr?: string;
}

export interface StorageLastDate {
  lastDateStr?: string;
}

export interface SupabaseInvokeResponse<T = unknown> {
  data?: T;
  error?: unknown;
}

export interface VisitCountResponse {
  count?: number;
}
