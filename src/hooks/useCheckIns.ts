import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CheckIn, UserId, CurrentWeek } from '@/lib/types';
import { apiClient } from '@/lib/apiClient';
import { getCurrentWeekData, canEditWeek } from '@/lib/weekUtils';
import { toast } from '@/hooks/use-toast';

export function useCheckIns(userId: UserId | null) {
  const queryClient = useQueryClient();
  const [weekData, setWeekData] = useState<CurrentWeek | null>(null);
  const [weekError, setWeekError] = useState<string | null>(null);
  const [weekLoaded, setWeekLoaded] = useState(false);

  // Load current week data from server
  useEffect(() => {
    getCurrentWeekData()
      .then((data) => {
        setWeekData(data);
        setWeekLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load week data:', error);
        setWeekError(
          error instanceof Error
            ? `Erro ao carregar dados do servidor: ${error.message}`
            : 'Erro ao carregar dados do servidor'
        );
        setWeekLoaded(true);
      });
  }, []);

  // Query: User's check-in for current week
  const {
    data: currentWeekCheckIn,
    isLoading: isLoadingCheckIn,
    error: checkInError,
  } = useQuery({
    queryKey: ['checkin', userId, weekData?.current_week, weekData?.current_year],
    queryFn: async () => {
      if (!userId || !weekData) return null;
      return apiClient.getCheckIn(userId, weekData.current_week, weekData.current_year);
    },
    enabled: !!userId && !!weekData,
  });

  // Query: All check-ins for current week
  const {
    data: weekCheckIns = [],
    isLoading: isLoadingWeek,
    error: weekCheckInsError,
  } = useQuery({
    queryKey: ['week-checkins', weekData?.current_week, weekData?.current_year],
    queryFn: async () => {
      if (!weekData) return [];
      return apiClient.getCheckInsForWeek(weekData.current_week, weekData.current_year);
    },
    enabled: !!weekData,
  });

  // Mutation: Create check-in
  const createMutation = useMutation({
    mutationFn: async (data: { best_moment: string; strange_thing: string; learned: string }) => {
      if (!userId || !weekData) throw new Error('User or week data not available');

      return apiClient.createCheckIn({
        user_id: userId,
        week_number: weekData.current_week,
        year: weekData.current_year,
        ...data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin'] });
      queryClient.invalidateQueries({ queryKey: ['week-checkins'] });
      toast({
        title: 'Check-in guardado!',
        description: 'As tuas respostas foram guardadas com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao guardar',
        description: error instanceof Error ? error.message : 'Ocorreu um erro.',
        variant: 'destructive',
      });
    },
  });

  // Mutation: Update check-in
  const updateMutation = useMutation({
    mutationFn: async ({
      checkinId,
      data,
    }: {
      checkinId: number;
      data: { best_moment?: string; strange_thing?: string; learned?: string };
    }) => {
      return apiClient.updateCheckIn(checkinId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin'] });
      queryClient.invalidateQueries({ queryKey: ['week-checkins'] });
      toast({
        title: 'Check-in atualizado!',
        description: 'As tuas alterações foram guardadas.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error instanceof Error ? error.message : 'Ocorreu um erro.',
        variant: 'destructive',
      });
    },
  });

  const saveCheckIn = useCallback(
    async (data: { best_moment: string; strange_thing: string; learned: string }): Promise<CheckIn | void> => {
      if (!weekData) return;

      if (!canEditWeek(weekData.current_week, weekData.current_year, weekData)) {
        toast({
          title: 'Semana bloqueada',
          description: 'Não podes editar check-ins de semanas passadas.',
          variant: 'destructive',
        });
        return;
      }

      if (currentWeekCheckIn) {
        return updateMutation.mutateAsync({
          checkinId: currentWeekCheckIn.id,
          data,
        });
      } else {
        return createMutation.mutateAsync(data);
      }
    },
    [currentWeekCheckIn, weekData, createMutation, updateMutation]
  );

  const canEdit = weekData
    ? canEditWeek(weekData.current_week, weekData.current_year, weekData)
    : false;

  const queryError = checkInError || weekCheckInsError;

  return {
    currentWeekCheckIn,
    weekCheckIns,
    weekData,
    weekError:
      weekError ||
      (queryError instanceof Error
        ? `Erro ao carregar dados do servidor: ${queryError.message}`
        : null),
    saveCheckIn,
    canEdit,
    isLoading: !weekLoaded || (!!weekData && !queryError && (isLoadingCheckIn || isLoadingWeek)),
    isSaving: createMutation.isPending || updateMutation.isPending,
  };
}
