import type { UserId } from '@/lib/types';
import { ID_TO_USER } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  currentUserId: UserId;
  onChangeProfile: () => void;
}

export function Header({ currentUserId, onChangeProfile }: HeaderProps) {
  const user = ID_TO_USER[currentUserId];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="container max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <h1 className="text-lg font-light">Check-in Semanal</h1>

        <div className="flex items-center gap-2">
          <span className="text-sm flex items-center gap-1">
            <span>{user.emoji}</span>
            <span className="font-medium">{user.name}</span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onChangeProfile}
            className="h-8 w-8"
            title="Trocar perfil"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
