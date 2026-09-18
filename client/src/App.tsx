import { useState, useEffect } from 'react';
import type {
  AnalyticsSummary,
  AttributeType,
  CustomReward,
  HunterProfile,
  Quest,
  SystemNotification,
} from '../../shared/types.js';
import { Navbar, type PageView } from './components/Navbar.js';
import { GoogleAuthModal } from './components/GoogleAuthModal.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { QuestsPage } from './pages/QuestsPage.js';
import { RewardsPage } from './pages/RewardsPage.js';
import { CalendarPage } from './pages/CalendarPage.js';
import { StatisticsPage } from './pages/StatisticsPage.js';
import { WeeklyReportPage } from './pages/WeeklyReportPage.js';
import { AIAssistantPage } from './pages/AIAssistantPage.js';
import { NotificationsPage } from './pages/NotificationsPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { sound } from './utils/audio.js';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('dashboard');
  const [profile, setProfile] = useState<HunterProfile | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [rewards, setRewards] = useState<CustomReward[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const fetchSystemState = async () => {
    try {
      const [statusRes, questsRes, rewardsRes, notifsRes, analyticsRes] = await Promise.all([
        fetch('/api/system/status'),
        fetch('/api/quests'),
        fetch('/api/rewards'),
        fetch('/api/notifications'),
        fetch('/api/analytics'),
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        setProfile(data.profile);
      }
      if (questsRes.ok) {
        const data = await questsRes.json();
        setQuests(data);
      }
      if (rewardsRes.ok) {
        const data = await rewardsRes.json();
        setRewards(data);
      }
      if (notifsRes.ok) {
        const data = await notifsRes.json();
        setNotifications(data);
      }
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('System state fetch error:', err);
    }
  };

  useEffect(() => {
    fetchSystemState();
    const timer = setInterval(fetchSystemState, 12000);
    return () => clearInterval(timer);
  }, []);

  const showBanner = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), 4500);
  };

  const handleToggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    sound.setEnabled(next);
    if (next) sound.playClick();
  };

  // Stat Allocation
  const handleAllocateStat = async (attribute: AttributeType) => {
    if (!profile || profile.statPoints <= 0) return;
    try {
      const res = await fetch('/api/hunter/allocate-stat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attribute, points: 1 }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
        showBanner(`[SYSTEM] +1 AP assigned to ${attribute.toUpperCase()}`);
        fetchSystemState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quest Actions
  const handleCompleteQuest = async (id: string) => {
    try {
      const res = await fetch(`/api/quests/${id}/complete`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        if (data.levelResult?.didLevelUp) {
          sound.playLevelUp();
          showBanner(`★ [LEVEL UP] Ascended to Level ${data.levelResult.newLevel}! +3 Stat Points awarded!`);
        } else {
          sound.playQuestComplete();
          showBanner(`[QUEST CLEARED] Conquered '${data.quest.title}' (+${data.quest.xpReward} XP, +${data.quest.goldReward}G)`);
        }
        fetchSystemState();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFailQuest = async (id: string) => {
    if (!confirm('Declare this quest FAILED? If marked mandatory, safe penalty discipline will be applied.')) return;
    try {
      const res = await fetch(`/api/quests/${id}/fail`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        sound.playAlert();
        if (data.punishmentResult) {
          showBanner('⚠️ [PENALTY INFLICTED] Mandatory task missed. Safe recovery debuff assigned.');
        } else {
          showBanner('[QUEST FAILED] Objective marked as failed.');
        }
        fetchSystemState();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelQuest = async (id: string) => {
    try {
      await fetch(`/api/quests/${id}/cancel`, { method: 'POST' });
      sound.playClick();
      fetchSystemState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuest = async (id: string) => {
    try {
      await fetch(`/api/quests/${id}`, { method: 'DELETE' });
      sound.playClick();
      fetchSystemState();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubtask = async (questId: string, subtaskId: string, current: boolean) => {
    try {
      await fetch(`/api/quests/${questId}/subtask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtaskId, completed: !current }),
      });
      fetchSystemState();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '20px 24px', minHeight: '100vh' }}>
      
      {/* SL System Banner */}
      {statusBanner && (
        <div className="sl-status-banner">
          ▶ {statusBanner}
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        profile={profile}
        unreadCount={unreadCount}
        onOpenAuth={() => setIsAuthOpen(true)}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
      />

      {/* Active Page View */}
      <main>
        {currentPage === 'dashboard' && (
          <DashboardPage
            profile={profile}
            quests={quests}
            rewards={rewards}
            analytics={analytics}
            notifications={notifications}
            onAllocateStat={handleAllocateStat}
            onCompleteQuest={handleCompleteQuest}
            onToggleSubtask={handleToggleSubtask}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'quests' && (
          <QuestsPage
            quests={quests}
            onRefresh={fetchSystemState}
            onCompleteQuest={handleCompleteQuest}
            onFailQuest={handleFailQuest}
            onCancelQuest={handleCancelQuest}
            onDeleteQuest={handleDeleteQuest}
            onToggleSubtask={handleToggleSubtask}
          />
        )}

        {currentPage === 'rewards' && (
          <RewardsPage
            rewards={rewards}
            profile={profile}
            onRefresh={fetchSystemState}
          />
        )}

        {currentPage === 'calendar' && (
          <CalendarPage
            quests={quests}
            onCompleteQuest={handleCompleteQuest}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === 'statistics' && (
          <StatisticsPage
            analytics={analytics}
            profile={profile}
          />
        )}

        {currentPage === 'weekly' && (
          <WeeklyReportPage />
        )}

        {currentPage === 'ai' && (
          <AIAssistantPage
            profile={profile}
            onQuestCreated={() => {
              showBanner('[SYSTEM] Quest inscribed into System Log via AI Parser.');
              fetchSystemState();
            }}
          />
        )}

        {currentPage === 'notifications' && (
          <NotificationsPage
            notifications={notifications}
            onRefresh={fetchSystemState}
          />
        )}

        {currentPage === 'settings' && (
          <SettingsPage
            profile={profile}
            onRefresh={fetchSystemState}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}
      </main>

      {/* Google Sign-In & Hunter Awakening Modal */}
      <GoogleAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        profile={profile}
        onProfileSynced={(updated) => {
          setProfile(updated);
          showBanner('[HUNTER AUTHENTICATED] Google Identity Synchronized.');
          fetchSystemState();
        }}
      />

    </div>
  );
}
