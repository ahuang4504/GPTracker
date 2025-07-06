import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";
import type {
  VisitHistoryEntry,
  VisitHistoryResponse,
  TimePeriod,
} from "@/types/storage";

async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        throw lastError;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

function generateDateRange(period: TimePeriod): string[] {
  const now = new Date();
  const dates: string[] = [];

  switch (period) {
    case "1W":
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split("T")[0]);
      }
      break;

    case "1M":
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split("T")[0]);
      }
      break;

    case "1Y":
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        dates.push(
          `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
            2,
            "0"
          )}`
        );
      }
      break;
  }

  return dates;
}

function aggregateToMonthly(data: VisitHistoryEntry[]): VisitHistoryEntry[] {
  const monthlyTotals = new Map<string, number>();

  data.forEach((entry) => {
    // Extract YYYY-MM from daily date (YYYY-MM-DD)
    const monthKey = entry.date.substring(0, 7); // "2024-01-15" -> "2024-01"
    const currentTotal = monthlyTotals.get(monthKey) || 0;
    monthlyTotals.set(monthKey, currentTotal + entry.visits);
  });

  return Array.from(monthlyTotals.entries())
    .map(([date, visits]) => ({
      date,
      visits,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function fillMissingDates(
  data: VisitHistoryEntry[],
  period: TimePeriod
): VisitHistoryEntry[] {
  const expectedDates = generateDateRange(period);
  const dataMap = new Map(data.map((entry) => [entry.date, entry.visits]));

  return expectedDates.map((date) => ({
    date,
    visits: dataMap.get(date) || 0,
  }));
}

export async function fetchVisitHistory(
  session: Session,
  period: TimePeriod
): Promise<VisitHistoryEntry[]> {
  if (!session?.access_token) {
    throw new Error("No session or access token available");
  }

  const functionMap = {
    "1W": "get_visit_history_week",
    "1M": "get_visit_history_month",
    "1Y": "get_visit_history_year",
  };

  const functionName = functionMap[period];

  const response = await withRetry(
    async () => {
      const result = await supabase.functions.invoke<VisitHistoryResponse>(
        functionName,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {},
        }
      );

      if (result.error) {
        throw new Error(
          `Failed to fetch ${period} history: ${JSON.stringify(result.error)}`
        );
      }

      return result;
    },
    3,
    1000
  );

  let rawData: VisitHistoryEntry[] = [];

  if (response.data?.data) {
    rawData = response.data.data;
  } else if (Array.isArray(response.data)) {
    rawData = response.data;
  } else if (response.data) {
    rawData = [];
  }

  if (period === "1Y") {
    const aggregatedData = aggregateToMonthly(rawData);
    return fillMissingDates(aggregatedData, period);
  }

  return fillMissingDates(rawData, period);
}

export function formatDateLabel(date: string, period: TimePeriod): string {
  const dateObj = new Date(date);

  switch (period) {
    case "1W":
      return dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    case "1M":
      return dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    case "1Y":
      return dateObj.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    default:
      return date;
  }
}

export function getPeriodDisplayName(period: TimePeriod): string {
  const displayNames = {
    "1W": "1 Week",
    "1M": "1 Month",
    "1Y": "1 Year",
  };
  return displayNames[period];
}
