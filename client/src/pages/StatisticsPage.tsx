import React from 'react';
import type { AnalyticsSummary, HunterProfile } from '../../../shared/types.js';

interface Props {
  analytics: AnalyticsSummary | null;
  profile: HunterProfile | null;
}

export const StatisticsPage: React.FC<Props> = ({ analytics, profile }) => {
  if (!analytics || !profile) {
    return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading analytics...</div>;
  }

  const maxXP = Math.max(1, ...analytics.xpHistoryByDay.map((d) => d.xp));

  const attributeKeys = [
    { key: 'discipline', label: 'Discipline', color: '#60a5fa' },
    { key: 'intelligence', label: 'Intelligence', color: '#a855f7' },
    { key: 'focus', label: 'Focus', color: '#00d2ff' },
    { key: 'strength', label: 'Strength', color: '#f87171' },
    { key: 'consistency', label: 'Consistency', color: '#fbbf24' },
    { key: 'productivity', label: 'Productivity', color: '#34d399' },
    { key: 'energy', label: 'Energy', color: '#38bdf8' },
  ] as const;

  const maxAttrVal = Math.max(15, ...Object.values(profile.attributes));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="system-panel" style={{ padding: '20px' }}>
        <h2 className="system-title-glow" style={{ fontSize: '1.3rem', margin: 0 }}>
          HUNTER PERFORMANCE METRICS & RADAR
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Detailed audit of progression velocity, attribute balance, and completion rates.
        </p>
      </div>

      {/* Top 4 Performance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <div className="system-panel" style={{ padding: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--emerald-success)', fontFamily: 'var(--font-mono)' }}>
            {analytics.dailyCompletionRate}%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Today's Completion</div>
        </div>

        <div className="system-panel" style={{ padding: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--system-blue)', fontFamily: 'var(--font-mono)' }}>
            {analytics.weeklyCompletionRate}%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>7-Day Completion Rate</div>
        </div>

        <div className="system-panel" style={{ padding: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--gold-accent)', fontFamily: 'var(--font-mono)' }}>
            🔥 {analytics.currentStreakDays}d
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Streak (Best: {analytics.longestStreakDays}d)</div>
        </div>

        <div className="system-panel" style={{ padding: '18px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--crimson-danger)', fontFamily: 'var(--font-mono)' }}>
            {analytics.mandatoryQuestsFailed}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mandatory Quests Missed</div>
        </div>
      </div>

      {/* Main Row: 7 Attributes Balance (Left) + 7-Day XP Chart (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* 7-Attribute Distribution */}
        <div className="system-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--system-blue)', fontFamily: 'var(--font-mono)', marginBottom: '18px' }}>
            [7 CORE ATTRIBUTES BALANCE]
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {attributeKeys.map((attr) => {
              const val = profile.attributes[attr.key] || 10;
              const percent = Math.min(100, Math.round((val / maxAttrVal) * 100));
              return (
                <div key={attr.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{attr.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: attr.color }}>{val}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${percent}%`,
                      height: '100%',
                      background: attr.color,
                      boxShadow: `0 0 8px ${attr.color}`,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7-Day XP Chart */}
        <div className="system-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--gold-accent)', fontFamily: 'var(--font-mono)', marginBottom: '18px' }}>
            [7-DAY XP ACCUMULATION]
          </h3>

          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '12px',
            height: '180px',
            padding: '10px 0',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            {analytics.xpHistoryByDay.map((item) => {
              const heightPercent = Math.max(8, Math.round((item.xp / maxXP) * 100));
              const dayName = new Date(item.date).toLocaleDateString([], { weekday: 'short' });
              return (
                <div key={item.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--system-blue)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                    {item.xp > 0 ? item.xp : ''}
                  </div>
                  <div style={{
                    width: '100%',
                    maxWidth: '32px',
                    height: `${heightPercent}%`,
                    background: item.xp > 0 ? 'linear-gradient(to top, #0284c7, #00d2ff)' : 'rgba(255,255,255,0.05)',
                    borderRadius: '4px 4px 0 0',
                    boxShadow: item.xp > 0 ? '0 0 8px var(--system-blue-glow)' : 'none',
                    transition: 'height 0.4s ease',
                  }} />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {dayName}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
            Accumulated past week: <strong>{analytics.xpHistoryByDay.reduce((acc, curr) => acc + curr.xp, 0)} XP</strong>
          </div>
        </div>

      </div>

      {/* Quests by Category Distribution */}
      <div className="system-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', color: 'var(--monarch-purple)', fontFamily: 'var(--font-mono)', marginBottom: '18px' }}>
          [OBJECTIVES COMPLETED BY DOMAIN]
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
          {Object.entries(analytics.questsByCategory).map(([cat, count]) => (
            <div key={cat} style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '14px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: count > 0 ? 'var(--system-blue)' : 'var(--text-muted)' }}>
                {count}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize', marginTop: '4px' }}>
                {cat.toLowerCase()}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
