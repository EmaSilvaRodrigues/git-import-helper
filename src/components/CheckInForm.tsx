import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CheckIn, UserId, CurrentWeek, ImageUploadResponse } from '@/lib/types';
import { QUESTIONS } from '@/lib/types';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Lock, Camera, X, Loader2, ImageOff } from 'lucide-react';
import { usePhoto } from '@/hooks/usePhoto';
import { apiClient } from '@/lib/apiClient';
import { ProxiedImage } from '@/components/ProxiedImage';
import { toast } from '@/hooks/use-toast';

const MAX_PHOTOS = 5;

interface PendingPhoto {
  file: File;
  previewUrl: string;
}

interface CheckInFormProps {
  existingCheckIn: CheckIn | null;
  onSave: (data: { best_moment: string; strange_thing: string; learned: string }) => Promise<CheckIn | void>;
  canEdit: boolean;
  weekLabel: string;
  userId: UserId;
  weekData: CurrentWeek;
  isSaving?: boolean;
}

export function CheckInForm({
  existingCheckIn,
  onSave,
  canEdit,
  weekLabel,
  userId,
  weekData,
  isSaving = false,
}: CheckInFormProps) {
  const [formData, setFormData] = useState({
    best_moment: '',
    strange_thing: '',
    learned: '',
  });
  const [isSaved, setIsSaved] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadPhotos, isUploading } = usePhoto();

  // Load server images for existing check-in
  const { data: serverImages = [], refetch: refetchImages } = useQuery({
    queryKey: ['checkin-images', existingCheckIn?.id],
    queryFn: () => existingCheckIn ? apiClient.getCheckInImages(existingCheckIn.id) : [],
    enabled: !!existingCheckIn?.id,
  });

  useEffect(() => {
    if (existingCheckIn) {
      setFormData({
        best_moment: existingCheckIn.best_moment || '',
        strange_thing: existingCheckIn.strange_thing || '',
        learned: existingCheckIn.learned || '',
      });
    }
  }, [existingCheckIn]);

  // Cleanup pending preview URLs on unmount
  useEffect(() => {
    return () => {
      pendingPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, [pendingPhotos]);

  const handleChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setIsSaved(false);
  };

  const totalPhotos = serverImages.length + pendingPhotos.length;
  const canAddMore = totalPhotos < MAX_PHOTOS;

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const remaining = MAX_PHOTOS - serverImages.length - pendingPhotos.length;
    const toAdd = files.slice(0, remaining);

    if (files.length > remaining) {
      toast({
        title: `Máximo ${MAX_PHOTOS} fotos`,
        description: `Só foram adicionadas ${toAdd.length} foto(s).`,
        variant: 'destructive',
      });
    }

    const newPending: PendingPhoto[] = toAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setPendingPhotos((prev) => [...prev, ...newPending]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [serverImages.length, pendingPhotos.length]);

  const removePending = (index: number) => {
    setPendingPhotos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeServerImage = async (imageId: number) => {
    try {
      await apiClient.deleteImage(imageId);
      refetchImages();
    } catch {
      toast({ title: 'Erro ao remover foto', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    setIsSavingAll(true);
    try {
      // 1. Save / update check-in text
      const result = await onSave(formData);

      // Get checkinId: from result (new) or existing
      const checkinId = (result as CheckIn)?.id ?? existingCheckIn?.id;

      // 2. Upload pending photos if any
      if (pendingPhotos.length > 0 && checkinId) {
        await uploadPhotos(pendingPhotos.map((p) => p.file), checkinId);
        // Clean up pending previews
        setPendingPhotos((prev) => {
          prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
          return [];
        });
        refetchImages();
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } finally {
      setIsSavingAll(false);
    }
  };

  const hasContent = formData.best_moment || formData.strange_thing || formData.learned;
  const isWorking = isSavingAll || isSaving || isUploading;

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-light text-foreground">Esta semana</h2>
        <p className="text-sm text-muted-foreground">{weekLabel}</p>
      </div>

      {QUESTIONS.map((question) => (
        <Card key={question.key} className="bg-card/90 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <span>{question.emoji}</span>
              <span>{question.label}</span>
              {!canEdit && <Lock className="h-3 w-3 text-muted-foreground ml-auto" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder={canEdit ? 'Escreve aqui...' : 'Semana bloqueada'}
              value={formData[question.key as keyof typeof formData]}
              onChange={(e) => handleChange(question.key as keyof typeof formData, e.target.value)}
              disabled={!canEdit}
              className="min-h-[100px] resize-none bg-background/50"
            />
          </CardContent>
        </Card>
      ))}

      {/* Photo Section */}
      <Card className="bg-card/90 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <span>📸</span>
            <span>Fotos da semana</span>
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              {totalPhotos}/{MAX_PHOTOS}
            </span>
            {!canEdit && <Lock className="h-3 w-3 text-muted-foreground" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Server images grid */}
          {serverImages.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {serverImages.map((img) => (
                <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-square">
                  <ProxiedImage
                    src={apiClient.getImageUrl(img.filename)}
                    alt="Foto"
                    className="w-full h-full object-cover"
                  />
                  {canEdit && (
                    <button
                      onClick={() => removeServerImage(img.id!)}
                      className="absolute top-1 right-1 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pending previews grid */}
          {pendingPhotos.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {pendingPhotos.map((p, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden aspect-square">
                  <img src={p.previewUrl} alt="Pré-visualização" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-primary/10 border-2 border-primary/40 rounded-xl pointer-events-none" />
                  <button
                    onClick={() => removePending(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-background/80 rounded-full flex items-center justify-center"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          {canEdit && canAddMore && (
            <Button
              variant="outline"
              className="w-full h-16 border-dashed rounded-xl"
              onClick={() => fileInputRef.current?.click()}
              disabled={isWorking}
            >
              <Camera className="h-4 w-4 mr-2" />
              {totalPhotos === 0 ? 'Adicionar fotos' : 'Adicionar mais fotos'}
            </Button>
          )}

          {!canEdit && totalPhotos === 0 && (
            <div className="w-full h-20 border border-dashed border-border rounded-xl flex items-center justify-center text-muted-foreground text-sm">
              Sem fotos
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </CardContent>
      </Card>

      {canEdit && (
        <Button onClick={handleSave} className="w-full" disabled={!hasContent || isWorking}>
          {isWorking ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {pendingPhotos.length > 0 ? 'A guardar e a enviar fotos...' : 'A guardar...'}
            </>
          ) : isSaved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Guardado!
            </>
          ) : existingCheckIn ? (
            'Atualizar check-in'
          ) : (
            'Guardar check-in'
          )}
        </Button>
      )}

      {!canEdit && (
        <p className="text-center text-sm text-muted-foreground">
          <Lock className="h-3 w-3 inline mr-1" />
          Esta semana já passou e o check-in está bloqueado
        </p>
      )}
    </div>
  );
}
