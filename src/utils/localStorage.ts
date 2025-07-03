import type { SyncStorageData } from "@/types/storage";

type StorageValue = string | number | boolean | object | null | undefined;

export async function getFromStorage<T = unknown>(
  keys: string | string[] | { [key: string]: StorageValue } = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(keys, (result) => {
        resolve(result as T);
      });
    } catch (err) {
      reject(err);
    }
  });
}

// Alias for backward compatibility  
export const getFromStorageRaw = getFromStorage;

export async function setToStorage(items: {
  [key: string]: StorageValue;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set(items, () => resolve());
    } catch (err) {
      reject(err);
    }
  });
}

// Sync storage utilities for cross-browser settings
export async function getSyncStorage<T = SyncStorageData>(
  keys: string | string[] | { [key: string]: StorageValue } = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.get(keys, (result) => {
        resolve(result as T);
      });
    } catch (err) {
      reject(err);
    }
  });
}

export async function setSyncStorage(items: {
  [key: string]: StorageValue;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.set(items, () => resolve());
    } catch (err) {
      reject(err);
    }
  });
}
