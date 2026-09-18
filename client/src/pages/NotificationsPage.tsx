import React, { useState } from 'react';
import type { NotificationCategory, SystemNotification } from '../../../shared/types.js';
import { sound } from '../utils/audio.js';

interface Props {
  notifications: SystemNotification[];
  onRefresh: () => void;
}

export const NotificationsPage: React.FC<Props> = ({ notifications, onRefresh }) => {
  const [filter, setFilter] = useState<NotificationCategory | 'ALL' | 'UNREAD'>('ALL');
  const [browserPushStatus, setBrowserPushStatus] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const handleRequestPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const permission = await Notification.requestPermission();
      setBrowserPushStatus(permission);
      if (permission === 'granted') {
        new Notification('ROVION SYSTEM // Hunter Interface', {
          body: 'Browser notifications initialized. Real-time quest reminders active.',
        });
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' });
      sound.playClick();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      sound.playClick();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      sound.playClick();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.read;
    if (filter !== 'ALL' && n.category !== filter) return false;
    return true;
  });

  const getCategoryColor = (cat: string) => {
    if (cat === 'PENALTY') return 'var(--crimson)';
    if (cat === 'LEVEL_UP') return 'var(--gold)';
    if (cat === 'REWARD') return 'var(--green-neon)';
    return 'var(--cyan)';
  };

  const FILTER_TABS = ['ALL', 'UNREAD', 'QUEST', 'LEVEL_UP', 'REWARD', 'PENALTY', 'WEEKLY_EVALUATION'] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div className="sl-panel" style={{ padding: '20px 24px' }}>
        <div className="sl-corner-tr" /><div className="sl-corner-bl" /><div className="sl-corner-br" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="sl-panel-title" style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, fontSize: '0.8rem' }}>
              ◆ NOTIFICATION CENTER // SYSTEM LOG ◆
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', fontFamily: 'var(--font-body)' }}>
              Real-time feed of System events, level ascensions, reward unlocks, and deadline warnings.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {browserPushStatus !== 'granted' && typeof Notification !== 'undefined' && (
              <button
                onClick={handleRequestPermission}
                className="sl-btn sl-btn-ghost"
                style={{ fontSize: '0.72rem' }}
              >
                🔔 ENABLE PUSH
              </button>
            )}
            <button
              onClick={handleMarkAllRead}
              className="sl-btn sl-btn-primary"
            >
              MARK ALL READ ✓
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '16px', flexWrap: 'wrap', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          {FILTER_TABS.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                sound.playClick();
                setFilter(cat);
              }}
              className={`sl-tab ${filter === cat ? 'active' : ''}`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="sl-panel" style={{ padding: '20px' }}>
        <div className="sl-corner-tr" /><div className="sl-corner-bl" /><div className="sl-corner-br" />
        {filtered.length === 0 ? (
          <div style={{ padding: '50px 0', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '3px' }}>
              [ NO TRANSMISSIONS ]
            </div>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontFamily: 'var(--font-body)' }}>
              No notifications found under selected filter.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '14px 16px',
                  background: n.read ? 'rgba(0, 8, 22, 0.6)' : 'rgba(0, 25, 55, 0.8)',
                  border: n.read ? '1px solid var(--border-subtle)' : '1px solid var(--border-cyan)',
                  borderLeft: `3px solid ${getCategoryColor(n.category)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'all 0.2s',
                  boxShadow: !n.read ? `inset 0 0 30px rgba(0,180,255,0.03)` : 'none',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '0.58rem',
                      padding: '2px 8px',
                      background: 'rgba(0,212,255,0.1)',
                      border: '1px solid var(--border-cyan)',
                      color: 'var(--cyan)',
                      fontFamily: 'var(--font-hud)',
                      letterSpacing: '1px',
                    }}>
                      [ ROVION SYSTEM ]
                    </span>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-hud)', letterSpacing: '1px' }}>
                      {n.title}
                    </span>
                    {!n.read && (
                      <span style={{
                        width: '6px', height: '6px',
                        background: 'var(--cyan)',
                        boxShadow: '0 0 6px var(--cyan)',
                        display: 'inline-block',
                        flexShrink: 0,
                      }} />
                    )}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
                    {n.message}
                  </p>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="sl-btn sl-btn-ghost"
                      style={{ fontSize: '0.62rem', padding: '4px 10px', minHeight: 'auto' }}
                    >
                      READ
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="sl-btn sl-btn-danger"
                    style={{ fontSize: '0.62rem', padding: '4px 10px', minHeight: 'auto' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
