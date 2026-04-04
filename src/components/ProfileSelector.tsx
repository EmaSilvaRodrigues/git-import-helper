import { USERS, USER_MAPPING, type UserId, type UserName } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { BackgroundImage } from './BackgroundImage';

interface ProfileSelectorProps {
  onSelect: (userId: UserId) => void;
}

export function ProfileSelector({ onSelect }: ProfileSelectorProps) {
  const handleSelect = (userName: UserName) => {
    const userId = USER_MAPPING[userName].id;
    onSelect(userId);
  };

  return (
    <BackgroundImage imageIndex={1} overlay="medium">
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-foreground mb-2">
            Check-in Semanal
          </h1>
          <p className="text-muted-foreground">Quem és tu?</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
          {USERS.map((userName) => (
            <Card
              key={userName}
              className="cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg bg-card/90 backdrop-blur-sm border-border/50"
              onClick={() => handleSelect(userName)}
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <span className="text-4xl mb-3">{USER_MAPPING[userName].emoji}</span>
                <span className="text-lg font-medium text-foreground">{userName}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-8 text-center max-w-xs">
          A tua escolha ficará guardada neste dispositivo
        </p>
      </div>
    </BackgroundImage>
  );
}
