import { useQuery } from '@tanstack/react-query';
import type { UserId, CurrentWeek, CheckIn, ImageUploadResponse } from '@/lib/types';
import { QUESTIONS, ID_TO_USER } from '@/lib/types';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { ProxiedImage } from '@/components/ProxiedImage';

interface GroupViewProps {
  currentUserId: UserId;
  weekData: CurrentWeek;
}

function CheckInPhotos({ checkinId, userName }: { checkinId: number; userName: string }) {
  const { data: images = [] } = useQuery<ImageUploadResponse[]>({
    queryKey: ['checkin-images', checkinId],
    queryFn: () => apiClient.getCheckInImages(checkinId),
    enabled: !!checkinId,
  });

  if (images.length === 0) return null;

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span>📸</span>
          <span>Fotos da semana</span>
          <span className="ml-auto text-xs font-normal text-muted-foreground">{images.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-2 ${images.length === 1 ? '' : 'grid-cols-2'}`}>
          {images.map((img) => (
            <div key={img.id ?? img.filename} className="rounded-xl overflow-hidden aspect-square">
              <ProxiedImage
                src={apiClient.getImageUrl(img.filename)}
                alt={`Foto de ${userName}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function GroupView({ currentUserId, weekData }: GroupViewProps) {
  const { data: weekCheckIns = [], isLoading } = useQuery({
    queryKey: ['week-checkins', weekData.current_week, weekData.current_year],
    queryFn: () =>
      apiClient.getCheckInsForWeek(weekData.current_week, weekData.current_year),
  });

  const getCheckInForUser = (userId: UserId): CheckIn | undefined => {
    return weekCheckIns.find((c) => c.user_id === userId);
  };

  const userIds: UserId[] = [1, 2, 3, 4];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-lg font-light">
            <Users className="h-5 w-5" />
            <span>Grupo</span>
          </div>
          <p className="text-sm text-muted-foreground">A carregar...</p>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 text-lg font-light">
          <Users className="h-5 w-5" />
          <span>Grupo</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Semana {weekData.current_week} de {weekData.current_year}
        </p>
      </div>

      <Tabs defaultValue={currentUserId.toString()} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-background/50">
          {userIds.map((userId) => {
            const user = ID_TO_USER[userId];
            const hasCheckIn = getCheckInForUser(userId) !== undefined;
            return (
              <TabsTrigger
                key={userId}
                value={userId.toString()}
                className="relative data-[state=active]:bg-card"
              >
                <span className="mr-1">{user.emoji}</span>
                <span className="hidden sm:inline">{user.name}</span>
                {hasCheckIn && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {userIds.map((userId) => {
          const user = ID_TO_USER[userId];
          const userCheckIn = getCheckInForUser(userId);
          const isCurrentUser = userId === currentUserId;

          return (
            <TabsContent key={userId} value={userId.toString()} className="mt-4 space-y-3">
              {userCheckIn ? (
                <>
                  {QUESTIONS.map((question) => {
                    const value = userCheckIn[question.key as keyof CheckIn] as string;
                    return (
                      <Card
                        key={question.key}
                        className="bg-card/90 backdrop-blur-sm border-border/50"
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <span>{question.emoji}</span>
                            <span>{question.label}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-foreground whitespace-pre-wrap">
                            {value || (
                              <span className="text-muted-foreground italic">
                                Sem resposta
                              </span>
                            )}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {userCheckIn.id && (
                    <CheckInPhotos checkinId={userCheckIn.id} userName={user.name} />
                  )}
                </>
              ) : (
                <Card className="bg-card/90 backdrop-blur-sm border-border/50">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      {isCurrentUser
                        ? 'Ainda não fizeste o teu check-in desta semana'
                        : `${user.name} ainda não fez o check-in desta semana`}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
