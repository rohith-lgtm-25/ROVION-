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
        new Notification('THE SYSTEM // Hunter Interface', {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div className="system-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 className="system-title-glow" style={{ fontSize: '1.3rem', margin: 0 }}>
              NOTIFICATION CENTER
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Real-time feed of System events, level ascensions, reward unlocks, and deadline warnings.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {browserPushStatus !== 'granted' && typeof Notification !== 'undefined' && (
              <button
                onClick={handleRequestPermission}
                className="btn-system-secondary"
                style={{ fontSize: '0.8rem' }}
              >
                🔔 Enable Desktop Push
              </button>
            )}
            <button
              onClick={handleMarkAllRead}
              className="btn-system"
              style={{ fontSize: '0.8rem' }}
            >
              Mark All Read ✓
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
          {(['ALL', 'UNREAD', 'QUEST', 'LEVEL_UP', 'REWARD', 'PENALTY', 'WEEKLY_EVALUATION'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                sound.playClick();
                setFilter(cat);
              }}
              style={{
                padding: '6px 12px',
                background: filter === cat ? 'var(--system-blue-dark)' : 'rgba(255,255,255,0.03)',
                color: filter === cat ? '#fff' : 'var(--text-secondary)',
                border: filter === cat ? '1px solid var(--system-blue)' : '1px solid var(--border-subtle)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="system-panel" style={{ padding: '20px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '50px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            No notifications found under selected filter.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '14px 18px',
                  background: n.read ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 210, 255, 0.05)',
                  border: n.read ? '1px solid var(--border-subtle)' : '1px solid var(--border-glow)',
                  borderLeft: `4px solid ${
                    n.category === 'PENALTY'
                      ? 'var(--crimson-danger)'
                      : n.category === 'LEVEL_UP'
                      ? 'var(--gold-accent)'
                      : n.category === 'REWARD'
                      ? 'var(--emerald-success)'
                      : 'var(--system-blue)'
                  }`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '0.6rem',
                      padding: '2px 8px',
                      background: 'rgba(0,212,255,0.1)',
                      border: '1px solid var(--border-cyan)',
                      color: 'var(--cyan)',
                      fontFamily: 'var(--font-hud)',
                      letterSpacing: '1px',
                    }}>
                      [ ROVION SYSTEM ]
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-hud)' }}>
                      {n.title}
                    </span>
                    {!n.read && (
                      <span style={{ width: '6px', height: '6px', background: 'var(--cyan)', boxShadow: '0 0 6px var(--cyan)' }} />
                    )}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {n.message}
                  </p>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--system-blue)', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    🗑️
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
