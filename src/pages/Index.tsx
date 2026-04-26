import { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useCheckIns } from '@/hooks/useCheckIns';
import { getImageIndex, formatWeekLabel } from '@/lib/weekUtils';
import { ProfileSelector } from '@/components/ProfileSelector';
import { BackgroundImage } from '@/components/BackgroundImage';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { CheckInForm } from '@/components/CheckInForm';
import { GroupView } from '@/components/GroupView';
import { HistoryView } from '@/components/HistoryView';
import type { CheckIn } from '@/lib/types';

const Index = () => {
  const {
    currentUserId,
    currentUserName,
    isLoading: isProfileLoading,
    selectProfile,
    changeProfile,
    isProfileSelected,
  } = useProfile();

  const {
    currentWeekCheckIn,
    saveCheckIn,
    canEdit,
    weekData,
    weekError,
    isLoading: isCheckInsLoading,
    isSaving,
  } = useCheckIns(currentUserId);

  const [activeTab, setActiveTab] = useState<'checkin' | 'group' | 'history'>('checkin');

  // Loading state
  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">A carregar...</div>
      </div>
    );
  }

  // Profile selection
  if (!isProfileSelected || !currentUserId) {
    return <ProfileSelector onSelect={selectProfile} />;
  }

  // Error loading week data
  if (weekError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm px-4">
          <p className="text-destructive mb-4">{weekError}</p>
          <p className="text-sm text-muted-foreground">
            Verifica a ligação ao servidor do diário.
          </p>
        </div>
      </div>
    );
  }

  // Loading check-ins/week data
  if (isCheckInsLoading || !weekData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">
          A carregar dados...
        </div>
      </div>
    );
  }

  const weekLabel = formatWeekLabel(weekData.week_start, weekData.week_end);
  const imageIndex = getImageIndex(weekData.current_week);

  return (
    <BackgroundImage imageIndex={imageIndex} overlay="dark">
      <div className="min-h-screen pb-20">
        <Header currentUserId={currentUserId} onChangeProfile={changeProfile} />

        <main className="container max-w-lg mx-auto px-4 py-6">
          {activeTab === 'checkin' && (
          <CheckInForm
              existingCheckIn={currentWeekCheckIn ?? null}
              onSave={saveCheckIn as (data: { best_moment: string; strange_thing: string; learned: string }) => Promise<CheckIn | void>}
              canEdit={canEdit}
              weekLabel={weekLabel}
              userId={currentUserId}
              weekData={weekData}
              isSaving={isSaving}
            />
          )}
          {activeTab === 'group' && (
            <GroupView currentUserId={currentUserId} weekData={weekData} />
          )}
          {activeTab === 'history' && (
            <HistoryView />
          )}
        </main>

        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </BackgroundImage>
  );
};

export default Index;
