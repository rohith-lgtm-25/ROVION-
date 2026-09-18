import React from 'react';
import type { AnalyticsSummary, HunterProfile } from '../../../shared/types.js';

interface Props {
  analytics: AnalyticsSummary | null;
  profile: HunterProfile | null;
}

export const StatisticsPage: React.FC<Props> = ({ analytics, profile }) => {
  if (!analytics || !profile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.8rem', letterSpacing: '4px', color: 'var(--text-muted)' }}>
          [ LOADING ANALYTICS... ]
        </div>
      </div>
    );
  }

  const maxXP = Math.max(1, ...analytics.xpHistoryByDay.map((d) => d.xp));

  const attributeKeys = [
    { key: 'discipline',   label: 'DISCIPLINE',   color: '#5599ff' },
    { key: 'intelligence', label: 'INTELLIGENCE', color: '#aa55ff' },
    { key: 'focus',        label: 'FOCUS',        color: '#00d4ff' },
    { key: 'strength',     label: 'STRENGTH',     color: '#ff4466' },
    { key: 'consistency',  label: 'CONSISTENCY',  color: '#ffaa00' },
    { key: 'productivity', label: 'PRODUCTIVITY', color: '#00ff88' },
    { key: 'energy',       label: 'ENERGY',       color: '#38d4ff' },
  ] as const;

  const maxAttrVal = Math.max(15, ...Object.values(profile.attributes));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="sl-panel" style={{ padding: '20px 24px' }}>
        <div className="sl-corner-tr" /><div className="sl-corner-bl" /><div className="sl-corner-br" />
        <div className="sl-panel-title" style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, fontSize: '0.8rem' }}>
          ◆ HUNTER PERFORMANCE METRICS & RADAR ◆
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', fontFamily: 'var(--font-body)' }}>
          Detailed audit of progression velocity, attribute balance, and completion rates.
        </p>
      </div>

      {/* Top 4 Performance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="sl-metric-card">
          <div className="sl-metric-val" style={{ color: 'var(--green-neon)', textShadow: '0 0 12px var(--green-glow)', fontSize: '2rem' }}>
            {analytics.dailyCompletionRate}%
          </div>
          <div className="sl-metric-label">Today's Completion</div>
        </div>

        <div className="sl-metric-card">
          <div className="sl-metric-val" style={{ fontSize: '2rem' }}>
            {analytics.weeklyCompletionRate}%
          </div>
          <div className="sl-metric-label">7-Day Completion Rate</div>
        </div>

        <div className="sl-metric-card">
          <div className="sl-metric-val" style={{ color: 'var(--gold)', textShadow: '0 0 12px var(--gold-glow)', fontSize: '2rem' }}>
            🔥 {analytics.currentStreakDays}d
          </div>
          <div className="sl-metric-label">Current Streak (Best: {analytics.longestStreakDays}d)</div>
        </div>

        <div className="sl-metric-card">
          <div className="sl-metric-val" style={{ color: analytics.mandatoryQuestsFailed > 0 ? 'var(--crimson)' : 'var(--green-neon)', fontSize: '2rem' }}>
            {analytics.mandatoryQuestsFailed}
          </div>
          <div className="sl-metric-label">Mandatory Quests Missed</div>
        </div>
      </div>

      {/* Main Row: 7 Attributes Balance (Left) + 7-Day XP Chart (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* 7-Attribute Distribution */}
        <div className="sl-panel" style={{ padding: '24px' }}>
          <div className="sl-corner-tr" /><div className="sl-corner-bl" /><div className="sl-corner-br" />
          <div className="sl-panel-label" style={{ color: 'var(--cyan)', marginBottom: '20px' }}>
            [ 7 CORE ATTRIBUTES BALANCE ]
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {attributeKeys.map((attr) => {
              const val = profile.attributes[attr.key] || 10;
              const percent = Math.min(100, Math.round((val / maxAttrVal) * 100));
              return (
                <div key={attr.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '5px' }}>
                    <span style={{ fontFamily: 'var(--font-hud)', fontWeight: 700, letterSpacing: '2px', color: 'var(--text-secondary)' }}>
                      {attr.label}
                    </span>
                    <span style={{ fontFamily: 'var(--font-hud)', fontWeight: 700, color: attr.color, textShadow: `0 0 8px ${attr.color}40` }}>
                      {val}
                    </span>
                  </div>
                  <div className="sl-progress-track">
                    <div
                      className="sl-progress-fill"
                      style={{
                        width: `${percent}%`,
                        background: `linear-gradient(90deg, ${attr.color}40, ${attr.color})`,
                        boxShadow: `0 0 8px ${attr.color}60`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 7-Day XP Chart */}
        <div className="sl-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="sl-corner-tr" /><div className="sl-corner-bl" /><div className="sl-corner-br" />
          <div className="sl-panel-label" style={{ color: 'var(--gold)', marginBottom: '20px' }}>
            [ 7-DAY XP ACCUMULATION ]
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '10px',
            height: '180px',
            padding: '10px 0',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            {analytics.xpHistoryByDay.map((item) => {
              const heightPercent = Math.max(8, Math.round((item.xp / maxXP) * 100));
              const dayName = new Date(item.date).toLocaleDateString([], { weekday: 'short' });
              return (
                <div key={item.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  {item.xp > 0 && (
                    <div style={{ fontSize: '0.62rem', color: 'var(--cyan)', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                      {item.xp}
                    </div>
                  )}
                  <div style={{
                    width: '100%',
                    maxWidth: '32px',
                    height: `${heightPercent}%`,
                    background: item.xp > 0
                      ? 'linear-gradient(to top, rgba(0,100,200,0.6), #00d4ff)'
                      : 'rgba(0, 30, 60, 0.4)',
                    border: item.xp > 0 ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(0,100,150,0.1)',
                    boxShadow: item.xp > 0 ? '0 0 8px rgba(0,180,255,0.3)' : 'none',
                    transition: 'height 0.4s ease',
                  }} />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', fontFamily: 'var(--font-hud)', letterSpacing: '1px' }}>
                    {dayName}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '16px', fontFamily: 'var(--font-body)' }}>
            Past-week total: <strong style={{ color: 'var(--gold)', fontFamily: 'var(--font-hud)' }}>
              {analytics.xpHistoryByDay.reduce((acc, curr) => acc + curr.xp, 0)} XP
            </strong>
          </div>
        </div>

      </div>

      {/* Quests by Category Distribution */}
      <div className="sl-panel" style={{ padding: '24px' }}>
        <div className="sl-corner-tr" /><div className="sl-corner-bl" /><div className="sl-corner-br" />
        <div className="sl-panel-label" style={{ color: '#cc88ff', marginBottom: '20px' }}>
          [ OBJECTIVES COMPLETED BY DOMAIN ]
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          {Object.entries(analytics.questsByCategory).map(([cat, count]) => (
            <div key={cat} className="sl-metric-card">
              <div className="sl-metric-val" style={{ color: count > 0 ? 'var(--cyan)' : 'var(--text-muted)', fontSize: '1.6rem' }}>
                {count}
              </div>
              <div className="sl-metric-label" style={{ textTransform: 'capitalize' }}>
                {cat.toLowerCase()}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
