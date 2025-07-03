export function isNewDay(lastDateStr?: string): boolean {
  const today = formatDate(new Date());
  return lastDateStr !== today;
}

export async function resetCounts(): Promise<void> {
  try {
    const items = {
      visitCount: 0,
      lastSyncedCount: 0
    };
    
    await new Promise<void>((resolve, reject) => {
      try {
        chrome.storage.local.set(items, () => resolve());
      } catch (err) {
        reject(err);
      }
    });
  } catch (error) {
    console.error("Failed to reset counts:", error);
  }
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}


export function getTimeUntil(hour: number, minute: number, second: number): number {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, second, 0);

  if (target < now) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime();
}

