import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ID_TO_USER, QUESTIONS } from '@/lib/types';
import type { WeekTimeline, CheckIn, ImageUploadResponse } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, ChevronDown, Users } from 'lucide-react';
import { ProxiedImage } from '@/components/ProxiedImage';

const PAGE_SIZE = 10;

export function HistoryView() {
  const [limit, setLimit] = useState(PAGE_SIZE);

  const { data, isLoading } = useQuery({
    queryKey: ['history', limit],
    queryFn: () => apiClient.getHistory(limit, 0),
  });

  const timeline = data?.timeline ?? [];
  const totalCount = data?.count ?? 0;
  const hasMore = timeline.length < totalCount;

  if (isLoading && timeline.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-lg font-light">
            <Clock className="h-5 w-5" />
            <span>Histórico</span>
          </div>
          <p className="text-sm text-muted-foreground">A carregar...</p>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent><Skeleton className="h-24 w-full" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-lg font-light">
          <Clock className="h-5 w-5" />
          <span>Histórico</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Check-ins de semanas anteriores
        </p>
      </div>

      {timeline.length === 0 ? (
        <Card className="bg-card/90 backdrop-blur-sm border-border/50">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Ainda não há histórico.</p>
          </CardContent>
        </Card>
      ) : (
        timeline.map((week) => (
          <WeekCard key={`${week.week_number}-${week.year}`} week={week} />
        ))
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setLimit((l) => l + PAGE_SIZE)}
            className="gap-2"
          >
            <ChevronDown className="h-4 w-4" />
            Carregar mais
          </Button>
        </div>
      )}
    </div>
  );
}

function WeekCard({ week }: { week: WeekTimeline }) {
  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            Semana {week.week_number} · {week.year}
          </CardTitle>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            {week.checkin_count}/4 membros
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {week.checkins.map((checkin) => (
          <CheckInCard key={checkin.user_id} checkin={checkin} />
        ))}
      </CardContent>
    </Card>
  );
}

function CheckInPhotosHistory({ checkinId, userName }: { checkinId: number; userName: string }) {
  const { data: images = [] } = useQuery<ImageUploadResponse[]>({
    queryKey: ['checkin-images', checkinId],
    queryFn: () => apiClient.getCheckInImages(checkinId),
    enabled: !!checkinId,
  });

  if (images.length === 0) return null;

  return (
    <div className={`grid gap-1.5 mt-2 ${images.length === 1 ? '' : 'grid-cols-2'}`}>
      {images.map((img) => (
        <div key={img.id ?? img.filename} className="rounded-lg overflow-hidden aspect-square">
          <ProxiedImage
            src={apiClient.getImageUrl(img.filename)}
            alt={`Foto de ${userName}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

function CheckInCard({ checkin }: { checkin: CheckIn }) {
  const user = ID_TO_USER[checkin.user_id];

  return (
    <div className="border border-border/40 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
          style={{ backgroundColor: user.color + '33', color: user.color }}
        >
          {user.emoji}
        </span>
        <span className="font-medium text-sm">{user.name}</span>
      </div>

      {QUESTIONS.map((q) => {
        const value = checkin[q.key as keyof CheckIn] as string;
        if (!value) return null;
        return (
          <div key={q.key} className="text-sm">
            <span className="text-muted-foreground">{q.emoji} {q.label}:</span>
            <p className="mt-0.5 whitespace-pre-wrap">{value}</p>
          </div>
        );
      })}

      {checkin.id && (
        <CheckInPhotosHistory checkinId={checkin.id} userName={user.name} />
      )}
    </div>
  );
}
