import React from 'react';
import type { HunterProfile } from '../../../shared/types.js';
import { sound } from '../utils/audio.js';

export type PageView =
  | 'dashboard'
  | 'quests'
  | 'rewards'
  | 'calendar'
  | 'statistics'
  | 'weekly'
  | 'ai'
  | 'notifications'
  | 'settings';

interface Props {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  profile: HunterProfile | null;
  unreadCount: number;
  onOpenAuth: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
}

const navItems: { id: PageView; label: string; short: string }[] = [
  { id: 'dashboard',     label: 'Status',        short: 'STATUS' },
  { id: 'quests',        label: 'Quest Log',     short: 'QUESTS' },
  { id: 'calendar',      label: 'Calendar',      short: 'CALENDAR' },
  { id: 'rewards',       label: 'Rewards',       short: 'REWARDS' },
  { id: 'statistics',    label: 'Statistics',    short: 'STATS' },
  { id: 'weekly',        label: 'Weekly',        short: 'WEEKLY' },
  { id: 'ai',            label: 'AI Oracle',     short: 'A.I.' },
  { id: 'notifications', label: 'System Log',    short: 'LOG' },
  { id: 'settings',      label: 'Config',        short: 'CONFIG' },
];

export const Navbar: React.FC<Props> = ({
  currentPage,
  onNavigate,
  profile,
  unreadCount,
  onOpenAuth,
  audioEnabled,
  onToggleAudio,
}) => {
  return (
    <nav style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      height: '56px',
      marginBottom: '28px',
      background: 'rgba(0, 6, 18, 0.96)',
      borderBottom: '1px solid rgba(0, 212, 255, 0.25)',
      boxShadow: '0 1px 0 rgba(0,212,255,0.1), 0 8px 32px rgba(0,0,0,0.6)',
    }}>

      {/* Animated top line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.6) 30%, rgba(0,212,255,1) 50%, rgba(0,212,255,0.6) 70%, transparent 100%)',
        animation: 'scanRight 4s linear infinite',
      }} />

      {/* Left: System Logo */}
      <div
        onClick={() => { sound.playClick(); onNavigate('dashboard'); }}
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flexShrink: 0 }}
      >
        {/* Hexagon logo mark */}
        <div style={{
          width: '36px', height: '36px',
          background: 'linear-gradient(135deg, #003380, #0066ff, #00d4ff)',
          clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 20px rgba(0,180,255,0.5)',
          fontSize: '0.85rem', fontWeight: 900, color: '#000',
          fontFamily: 'var(--font-hud)',
        }}>
          Ω
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--font-hud)',
            fontSize: '0.85rem',
            fontWeight: 900,
            letterSpacing: '3px',
            color: 'var(--cyan)',
            textShadow: '0 0 12px var(--cyan-glow)',
            lineHeight: 1.1,
          }}>
            ROVION SYSTEM
          </div>
          <div style={{
            fontFamily: 'var(--font-hud)',
            fontSize: '0.5rem',
            letterSpacing: '3px',
            color: 'var(--text-muted)',
          }}>
            HOLOGRAPHIC OS v2.0
          </div>
        </div>
      </div>

      {/* Center: Nav Links */}
      <div style={{ display: 'flex', alignItems: 'stretch', height: '100%', gap: '2px' }}>
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { sound.playClick(); onNavigate(item.id); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '0 14px',
                height: '100%',
                background: isActive ? 'rgba(0, 180, 255, 0.1)' : 'transparent',
                color: isActive ? 'var(--cyan)' : 'var(--text-muted)',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--cyan)' : '2px solid transparent',
                borderTop: isActive ? '2px solid transparent' : '2px solid transparent',
                fontFamily: 'var(--font-hud)',
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textShadow: isActive ? '0 0 10px var(--cyan-glow)' : 'none',
                boxShadow: isActive ? 'inset 0 -2px 8px rgba(0,180,255,0.1)' : 'none',
                position: 'relative',
              }}
            >
              {item.short}
              {item.id === 'notifications' && unreadCount > 0 && (
                <span style={{
                  background: 'var(--crimson)',
                  color: '#fff',
                  fontSize: '0.55rem',
                  fontWeight: 900,
                  padding: '1px 5px',
                  borderRadius: '0',
                  boxShadow: '0 0 8px var(--crimson-glow)',
                  clipPath: 'polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%)',
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right: Gold / Sound / Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

        {/* Sound */}
        <button
          onClick={onToggleAudio}
          className="sl-btn-icon"
          title={audioEnabled ? 'Mute' : 'Enable Audio'}
          style={{ fontSize: '0.8rem' }}
        >
          {audioEnabled ? '🔊' : '🔇'}
        </button>

        {/* Gold */}
        {profile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            background: 'rgba(255, 215, 0, 0.06)',
            border: '1px solid rgba(255,215,0,0.25)',
            fontFamily: 'var(--font-hud)',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '1px',
            color: 'var(--gold)',
            textShadow: '0 0 8px var(--gold-glow)',
          }}>
            ◈ {profile.gold}<span style={{ opacity: 0.5, marginLeft: '2px' }}>G</span>
          </div>
        )}

        {/* Profile Badge */}
        {profile && (
          <div
            onClick={() => { sound.playClick(); onOpenAuth(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px 4px 6px',
              background: 'rgba(0, 180, 255, 0.06)',
              border: '1px solid rgba(0,180,255,0.2)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0,212,255,0.5)';
              e.currentTarget.style.background = 'rgba(0,180,255,0.12)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0,180,255,0.2)';
              e.currentTarget.style.background = 'rgba(0,180,255,0.06)';
            }}
          >
            <img
              src={profile.avatarUrl || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=80&auto=format&fit=crop&q=80'}
              alt={profile.name}
              style={{ width: '26px', height: '26px', objectFit: 'cover', border: '1px solid rgba(0,212,255,0.4)' }}
            />
            <div>
              <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '1px', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {profile.name.toUpperCase().substring(0, 16)}
              </div>
              <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.5rem', letterSpacing: '1.5px', color: 'var(--cyan)' }}>
                LV.{profile.level} · {profile.rank}-RANK
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
