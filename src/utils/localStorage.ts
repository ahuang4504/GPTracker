import { dailyResetManager } from "./dailyResetManager";

type StorageValue = string | number | boolean | object | null | undefined;

// Internal function that doesn't trigger daily reset (to prevent infinite recursion)
export async function getFromStorageRaw<T = unknown>(
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

export async function getFromStorage<T = unknown>(
  keys: string | string[] | { [key: string]: StorageValue } = {}
): Promise<T> {
  // Ensure daily reset is performed before getting storage data
  await dailyResetManager.ensureDailyReset();
  
  return getFromStorageRaw<T>(keys);
}

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
