import { useState, useEffect, useCallback } from 'react';
import type { UserId, UserName } from '@/lib/types';
import { getStoredUserId, setStoredUserId, clearStoredUserId, getUserNameFromId } from '@/lib/storage';

export function useProfile() {
  const [currentUserId, setCurrentUserId] = useState<UserId | null>(null);
  const [currentUserName, setCurrentUserName] = useState<UserName | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedId = getStoredUserId();
    if (storedId) {
      setCurrentUserId(storedId);
      setCurrentUserName(getUserNameFromId(storedId));
    }
    setIsLoading(false);
  }, []);

  const selectProfile = useCallback((userId: UserId) => {
    setStoredUserId(userId);
    setCurrentUserId(userId);
    setCurrentUserName(getUserNameFromId(userId));
  }, []);

  const changeProfile = useCallback(() => {
    clearStoredUserId();
    setCurrentUserId(null);
    setCurrentUserName(null);
  }, []);

  return {
    currentUserId,
    currentUserName,
    isLoading,
    selectProfile,
    changeProfile,
    isProfileSelected: currentUserId !== null,
  };
}
