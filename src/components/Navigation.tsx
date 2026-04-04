import { Button } from '@/components/ui/button';
import { PenLine, Users, Clock } from 'lucide-react';

interface NavigationProps {
  activeTab: 'checkin' | 'group' | 'history';
  onTabChange: (tab: 'checkin' | 'group' | 'history') => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border/50 safe-area-pb">
      <div className="container max-w-lg mx-auto px-4">
        <div className="flex justify-around py-2">
          <Button
            variant={activeTab === 'checkin' ? 'default' : 'ghost'}
            className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => onTabChange('checkin')}
          >
            <PenLine className="h-5 w-5" />
            <span className="text-xs">Check-in</span>
          </Button>
          
          <Button
            variant={activeTab === 'group' ? 'default' : 'ghost'}
            className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => onTabChange('group')}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs">Grupo</span>
          </Button>

          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => onTabChange('history')}
          >
            <Clock className="h-5 w-5" />
            <span className="text-xs">Histórico</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}
