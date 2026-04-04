import type { UserId, UserName } from './types';
import { USER_MAPPING, ID_TO_USER } from './types';

const PROFILE_KEY = 'floripa-selected-user-id';

export function getStoredUserId(): UserId | null {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (!stored) return null;

    const id = parseInt(stored, 10);
    if (id >= 1 && id <= 4) {
      return id as UserId;
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredUserId(userId: UserId): void {
  try {
    localStorage.setItem(PROFILE_KEY, userId.toString());
  } catch (error) {
    console.error('Failed to save user ID:', error);
  }
}

export function clearStoredUserId(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch (error) {
    console.error('Failed to clear user ID:', error);
  }
}

export function getUserNameFromId(userId: UserId): UserName {
  return ID_TO_USER[userId].name;
}

export function getUserIdFromName(userName: UserName): UserId {
  return USER_MAPPING[userName].id;
}

export function getUserColor(userId: UserId): string {
  return ID_TO_USER[userId].color;
}

export function getUserEmoji(userId: UserId): string {
  return ID_TO_USER[userId].emoji;
}
