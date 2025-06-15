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
