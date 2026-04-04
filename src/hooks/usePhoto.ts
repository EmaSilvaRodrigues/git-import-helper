import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ImageUploadResponse } from '@/lib/types';
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/hooks/use-toast';

interface UsePhotoReturn {
  uploadPhotos: (files: File[], checkinId: number) => Promise<ImageUploadResponse[]>;
  isUploading: boolean;
  error: string | null;
}

export function usePhoto(): UsePhotoReturn {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadPhotos = useCallback(
    async (files: File[], checkinId: number): Promise<ImageUploadResponse[]> => {
      setError(null);

      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          const message = 'A imagem deve ter menos de 10MB.';
          setError(message);
          toast({ title: 'Ficheiro muito grande', description: message, variant: 'destructive' });
          return [];
        }
        if (!validTypes.includes(file.type)) {
          const message = 'Use apenas JPG, PNG, WebP ou HEIC.';
          setError(message);
          toast({ title: 'Formato inválido', description: message, variant: 'destructive' });
          return [];
        }
      }

      setIsUploading(true);
      try {
        const results = await Promise.all(
          files.map((file) => apiClient.uploadImage(checkinId, file))
        );
        queryClient.invalidateQueries({ queryKey: ['checkin-images', checkinId] });
        queryClient.invalidateQueries({ queryKey: ['checkin'] });
        queryClient.invalidateQueries({ queryKey: ['week-checkins'] });
        return results;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao enviar fotos.';
        setError(message);
        toast({ title: 'Erro ao enviar foto', description: message, variant: 'destructive' });
        return [];
      } finally {
        setIsUploading(false);
      }
    },
    [queryClient]
  );

  return { uploadPhotos, isUploading, error };
}
