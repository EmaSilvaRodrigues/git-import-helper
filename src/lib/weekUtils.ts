import { apiClient } from './apiClient';
import type { CurrentWeek } from './types';

let cachedWeekData: CurrentWeek | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function getCurrentWeekData(): Promise<CurrentWeek> {
  const now = Date.now();

  // Use cache if still valid
  if (cachedWeekData && now - lastFetchTime < CACHE_DURATION) {
    return cachedWeekData;
  }

  // Fetch from server
  try {
    const weekData = await apiClient.getCurrentWeek();
    cachedWeekData = weekData;
    lastFetchTime = now;
    return weekData;
  } catch (error) {
    console.error('Error fetching current week:', error);

    // Fallback: use old cache if exists
    if (cachedWeekData) {
      return cachedWeekData;
    }

    throw error;
  }
}

export function formatWeekLabel(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-PT', {
      day: 'numeric',
      month: 'long',
    }).format(date);
  };

  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function canEditWeek(
  weekNumber: number,
  year: number,
  currentWeek: CurrentWeek
): boolean {
  return weekNumber === currentWeek.current_week && year === currentWeek.current_year;
}

export function isLocked(isLockedValue: 0 | 1): boolean {
  return isLockedValue === 1;
}

// Get background image index based on week number (1-4)
export function getImageIndex(weekNumber: number): number {
  return ((weekNumber - 1) % 4) + 1;
}

// Clear cache (useful for testing or force refresh)
export function clearWeekCache(): void {
  cachedWeekData = null;
  lastFetchTime = 0;
}

export type { CurrentWeek };
