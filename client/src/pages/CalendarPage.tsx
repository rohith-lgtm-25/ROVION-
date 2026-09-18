import React, { useState } from 'react';
import type { Quest } from '../../../shared/types.js';
import { sound } from '../utils/audio.js';
import { SLPanel } from '../components/SLPanel.js';

interface CalendarPageProps {
  quests: Quest[];
  onCompleteQuest: (id: string) => void;
  onNavigate: (page: any) => void;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ quests, onCompleteQuest, onNavigate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    sound.playClick();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    sound.playClick();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const formatDateStr = (d: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // Map quests by date string YYYY-MM-DD
  const questsByDate: Record<string, Quest[]> = {};
  quests.forEach((q) => {
    let dateStr = new Date(q.createdAt).toISOString().split('T')[0];
    if (q.deadline) {
      dateStr = new Date(q.deadline).toISOString().split('T')[0];
    }
    if (!questsByDate[dateStr]) questsByDate[dateStr] = [];
    questsByDate[dateStr].push(q);
  });

  const selectedDayQuests = questsByDate[selectedDate] || [];

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Bar */}
      <SLPanel title="SYSTEM CHRONICLES // HOLOGRAPHIC CALENDAR">
        <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: '1rem', fontWeight: 900, color: 'var(--cyan)', letterSpacing: '2px' }}>
              [ ROVION TEMPORAL GRID ]
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Interactive tactical schedule & temporal quest tracking.
            </div>
          </div>

          {/* Month controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="sl-btn sl-btn-ghost" onClick={prevMonth}>◀ PREV</button>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.9rem', fontWeight: 900, letterSpacing: '3px', color: 'var(--cyan)', minWidth: '160px', textAlign: 'center' }}>
              {monthNames[month]} {year}
            </div>
            <button className="sl-btn sl-btn-ghost" onClick={nextMonth}>NEXT ▶</button>
          </div>
        </div>
      </SLPanel>

      {/* Main Grid: Calendar (Left) + Side Panel (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(320px, 380px)', gap: '20px', alignItems: 'start' }}>
        
        {/* Holographic Calendar Grid */}
        <SLPanel title="TEMPORAL MATRIX">
          <div style={{ padding: '20px' }}>
            {/* Days of week header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px', textAlign: 'center' }}>
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d) => (
                <div key={d} style={{ fontFamily: 'var(--font-hud)', fontSize: '0.6rem', letterSpacing: '2px', color: 'var(--text-muted)', fontWeight: 700 }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Date Cells */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {/* Empty leading slots */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} style={{ height: '76px', background: 'rgba(0,10,20,0.3)', border: '1px solid rgba(0,100,150,0.05)' }} />
              ))}

              {/* Days in Month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = formatDateStr(dayNum);
                const dayQuests = questsByDate[dateStr] || [];
                const isSelected = selectedDate === dateStr;
                const isToday = todayStr === dateStr;

                const activeCount = dayQuests.filter(q => q.status === 'ACTIVE').length;
                const completedCount = dayQuests.filter(q => q.status === 'COMPLETED').length;
                const failedCount = dayQuests.filter(q => q.status === 'FAILED').length;

                return (
                  <div
                    key={dateStr}
                    onClick={() => {
                      sound.playClick();
                      setSelectedDate(dateStr);
                    }}
                    style={{
                      height: '76px',
                      padding: '6px',
                      background: isSelected
                        ? 'rgba(0, 212, 255, 0.15)'
                        : isToday
                        ? 'rgba(0, 102, 255, 0.12)'
                        : 'rgba(0, 12, 28, 0.8)',
                      border: isSelected
                        ? '1px solid var(--cyan)'
                        : isToday
                        ? '1px solid var(--blue-neon)'
                        : '1px solid var(--border-subtle)',
                      boxShadow: isSelected
                        ? '0 0 15px var(--cyan-glow), inset 0 0 10px rgba(0,212,255,0.1)'
                        : 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                    }}
                  >
                    {/* Top Row: Date Number + Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontFamily: 'var(--font-hud)',
                        fontSize: '0.75rem',
                        fontWeight: isToday || isSelected ? 900 : 600,
                        color: isSelected ? 'var(--cyan)' : isToday ? 'var(--blue-neon)' : 'var(--text-primary)',
                        textShadow: isSelected ? '0 0 8px var(--cyan)' : 'none',
                      }}>
                        {dayNum}
                      </span>
                      {isToday && (
                        <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.45rem', color: 'var(--cyan)', letterSpacing: '1px', background: 'rgba(0,212,255,0.2)', padding: '1px 3px' }}>
                          TODAY
                        </span>
                      )}
                    </div>

                    {/* Quest Status Dots */}
                    {dayQuests.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {activeCount > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.55rem', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
                            <span style={{ width: '4px', height: '4px', background: 'var(--cyan)', boxShadow: '0 0 4px var(--cyan)' }} />
                            <span>{activeCount} active</span>
                          </div>
                        )}
                        {completedCount > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.55rem', color: 'var(--green-neon)', fontFamily: 'var(--font-mono)' }}>
                            <span style={{ width: '4px', height: '4px', background: 'var(--green-neon)' }} />
                            <span>{completedCount} done</span>
                          </div>
                        )}
                        {failedCount > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.55rem', color: 'var(--crimson)', fontFamily: 'var(--font-mono)' }}>
                            <span style={{ width: '4px', height: '4px', background: 'var(--crimson)' }} />
                            <span>{failedCount} failed</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </SLPanel>

        {/* Selected Date Holographic Side Panel */}
        <SLPanel title={`DATE INSPECTOR // ${selectedDate}`}>
          <div style={{ padding: '18px' }}>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.65rem', letterSpacing: '2px', color: 'var(--cyan)', marginBottom: '14px' }}>
              ▶ SCHEDULED OBJECTIVES ({selectedDayQuests.length})
            </div>

            {selectedDayQuests.length === 0 ? (
              <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-hud)', fontSize: '0.65rem', letterSpacing: '2px' }}>
                [ NO QUESTS RECORDED FOR THIS DATE ]
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedDayQuests.map((q) => (
                  <div
                    key={q.id}
                    className={`sl-quest-card ${q.isMandatory ? 'mandatory' : ''}`}
                    style={{ padding: '10px 12px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <span className={`rank-badge rank-${q.difficulty}`}>{q.difficulty}</span>
                      <span style={{
                        fontFamily: 'var(--font-hud)',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        color: q.status === 'COMPLETED' ? 'var(--green-neon)' : q.status === 'FAILED' ? 'var(--crimson)' : 'var(--cyan)',
                      }}>
                        [{q.status}]
                      </span>
                    </div>

                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {q.title}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--cyan)' }}>
                        +{q.xpReward} XP
                      </span>
                      {q.status === 'ACTIVE' && (
                        <button
                          className="sl-btn sl-btn-success"
                          style={{ padding: '3px 8px', fontSize: '0.55rem' }}
                          onClick={() => onCompleteQuest(q.id)}
                        >
                          CLEAR ✓
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SLPanel>

      </div>
    </div>
  );
};
