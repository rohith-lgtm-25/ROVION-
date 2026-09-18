import React from 'react';
import type {
  AnalyticsSummary,
  AttributeType,
  CustomReward,
  HunterProfile,
  Quest,
  SystemNotification,
} from '../../../shared/types.js';
import { sound } from '../utils/audio.js';
import { SLPanel } from '../components/SLPanel.js';

interface Props {
  profile: HunterProfile | null;
  quests: Quest[];
  rewards: CustomReward[];
  analytics: AnalyticsSummary | null;
  notifications: SystemNotification[];
  onAllocateStat: (attribute: AttributeType) => void;
  onCompleteQuest: (id: string) => void;
  onToggleSubtask: (questId: string, subtaskId: string, current: boolean) => void;
  onNavigate: (page: any) => void;
}

const ATTR_META: { key: AttributeType; short: string; label: string; color: string }[] = [
  { key: 'strength',     short: 'STR', label: 'Strength',     color: '#ff4466' },
  { key: 'intelligence', short: 'INT', label: 'Intelligence', color: '#aa55ff' },
  { key: 'focus',        short: 'FOC', label: 'Focus',        color: '#00d4ff' },
  { key: 'discipline',   short: 'DIS', label: 'Discipline',   color: '#5599ff' },
  { key: 'consistency',  short: 'CON', label: 'Consistency',  color: '#ffaa00' },
  { key: 'productivity', short: 'PRD', label: 'Productivity', color: '#00ff88' },
  { key: 'energy',       short: 'ENE', label: 'Energy',       color: '#38d4ff' },
];

const RANK_COLORS: Record<string, string> = {
  E: '#7ab8d4', D: '#5599ff', C: '#00ff88',
  B: '#ffaa00', A: '#ff4466', S: '#cc88ff', MONARCH: '#ff88ff',
};

export const DashboardPage: React.FC<Props> = ({
  profile, quests, rewards, analytics, notifications,
  onAllocateStat, onCompleteQuest, onToggleSubtask, onNavigate,
}) => {
  if (!profile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.8rem', letterSpacing: '4px', color: 'var(--text-muted)' }}>
          [ SYNCHRONIZING SYSTEM CORE... ]
        </div>
      </div>
    );
  }

  const activeQuests = quests.filter((q) => q.status === 'ACTIVE');
  const unlockedRewards = rewards.filter((r) => r.isUnlocked && !r.isClaimed);
  const lockedRewards = rewards.filter((r) => !r.isUnlocked);
  const xpPercent = profile.requiredXP > 0
    ? Math.min(100, Math.round((profile.currentXP / profile.requiredXP) * 100)) : 0;
  const rankColor = RANK_COLORS[profile.rank] || '#00d4ff';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── DEBUFF ALERT ─────────────────────────────────── */}
      {profile.activeDebuffs.length > 0 && (
        <div style={{
          position: 'relative',
          background: 'rgba(255, 34, 68, 0.06)',
          border: '1px solid rgba(255,34,68,0.5)',
          padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 0 20px rgba(255,34,68,0.15)',
          overflow: 'hidden',
        }}>
          <span style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '1px', background: 'linear-gradient(90deg,transparent,var(--crimson),transparent)', animation: 'scanRight 2s linear infinite' }} />
          <div>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.65rem', letterSpacing: '3px', color: 'var(--crimson)', textShadow: '0 0 10px var(--crimson-glow)' }}>
              ⚠ ACTIVE PENALTY DEBUFFS ({profile.activeDebuffs.length})
            </div>
            <div style={{ fontSize: '0.8rem', color: '#ff8899', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              {profile.activeDebuffs.map((d) => d.name).join(' | ')}
            </div>
          </div>
          <button className="sl-btn sl-btn-danger" onClick={() => onNavigate('quests')}>
            CLEAR VIA RECOVERY
          </button>
        </div>
      )}

      {/* ── MAIN GRID ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 380px) 1fr', gap: '20px', alignItems: 'start' }}>

        {/* ━━━━━━━━━━━━━━━━━━━ LEFT: STATUS PANEL ━━━━━━━━━━━━━━━━━━━ */}
        <SLPanel title="PLAYER STATUS">
          <div style={{ padding: '20px' }}>

            {/* Hunter Info */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  position: 'relative',
                  width: '52px', height: '52px',
                  border: `1px solid ${rankColor}`,
                  boxShadow: `0 0 15px ${rankColor}55`,
                }}>
                  <img
                    src={profile.avatarUrl || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=80&auto=format&fit=crop&q=80'}
                    alt="Hunter"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.55rem', letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: '3px' }}>HUNTER ID</div>
                  <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '1px' }}>
                    {profile.name.toUpperCase()}
                  </div>
                  <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.55rem', letterSpacing: '2px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {profile.title.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Rank + Level */}
              <div style={{ textAlign: 'center' }}>
                <div className={`rank-badge rank-${profile.rank}`} style={{ display: 'block', marginBottom: '6px' }}>
                  {profile.rank}-RANK
                </div>
                <div className="sl-level-display" style={{ fontSize: '2.8rem' }}>
                  {profile.level}
                </div>
                <div className="sl-level-label">LEVEL</div>
              </div>
            </div>

            <hr className="sl-divider" />

            {/* XP Bar */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.55rem', letterSpacing: '3px', color: 'var(--text-muted)' }}>EXPERIENCE</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--cyan)' }}>
                  {profile.currentXP} <span style={{ color: 'var(--text-muted)' }}>/ {profile.requiredXP}</span>
                </span>
              </div>
              <div className="sl-progress-track">
                <div className="sl-progress-fill" style={{ width: `${xpPercent}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.5rem', color: 'var(--text-muted)' }}>TOTAL: {profile.totalXP} XP</span>
                <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.5rem', color: 'var(--cyan)' }}>{xpPercent}%</span>
              </div>
            </div>

            {/* HP / Energy Vitals Indicator */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5rem', fontFamily: 'var(--font-hud)', letterSpacing: '1px', color: 'var(--crimson)', marginBottom: '3px' }}>
                  <span>HP / VITALITY</span>
                  <span>100%</span>
                </div>
                <div className="sl-progress-track" style={{ height: '4px' }}>
                  <div className="sl-progress-fill-red" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.5rem', fontFamily: 'var(--font-hud)', letterSpacing: '1px', color: 'var(--cyan)', marginBottom: '3px' }}>
                  <span>MP / ENERGY</span>
                  <span>100%</span>
                </div>
                <div className="sl-progress-track" style={{ height: '4px' }}>
                  <div className="sl-progress-fill" style={{ width: '100%' }} />
                </div>
              </div>
            </div>

            {/* Stat Points Available */}
            {profile.statPoints > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.35)',
                marginBottom: '14px',
                boxShadow: '0 0 15px rgba(0,180,255,0.1)',
                animation: 'pulse-cyan 2s ease infinite',
              }}>
                <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.6rem', letterSpacing: '2px', color: 'var(--text-secondary)' }}>
                  ▶ ATTRIBUTE POINTS AVAILABLE
                </span>
                <span style={{ fontFamily: 'var(--font-hud)', fontSize: '1rem', fontWeight: 900, color: 'var(--cyan)', textShadow: '0 0 12px var(--cyan-glow)' }}>
                  {profile.statPoints}
                </span>
              </div>
            )}

            <hr className="sl-divider" />

            {/* Stats Grid — SL Style */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {ATTR_META.map((attr) => {
                const val = profile.attributes[attr.key] || 10;
                const canAlloc = profile.statPoints > 0;
                return (
                  <div key={attr.key} className="sl-stat-row" style={{ borderLeftColor: attr.color + '55' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="sl-stat-key">{attr.short}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="sl-stat-val" style={{ color: attr.color, textShadow: `0 0 8px ${attr.color}66` }}>
                        {val}
                      </span>
                      {canAlloc && (
                        <button
                          onClick={() => { sound.playClick(); onAllocateStat(attr.key); }}
                          style={{
                            width: '16px', height: '16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0,180,255,0.15)',
                            border: '1px solid rgba(0,180,255,0.4)',
                            color: 'var(--cyan)',
                            fontSize: '0.7rem',
                            fontWeight: 900,
                            cursor: 'pointer',
                            lineHeight: 1,
                            flexShrink: 0,
                            transition: 'all 0.15s',
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(0,212,255,0.3)';
                            e.currentTarget.style.boxShadow = '0 0 8px var(--cyan-glow)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(0,180,255,0.15)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >+</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </SLPanel>

        {/* ━━━━━━━━━━━━━━━━━━━ RIGHT COLUMN ━━━━━━━━━━━━━━━━━━━ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Performance Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { val: `${analytics?.currentStreakDays || 0}D`, label: 'STREAK', sub: `BEST ${analytics?.longestStreakDays || 0}D`, color: '#ffaa00' },
              { val: `${analytics?.dailyCompletionRate || 100}%`, label: 'TODAY', sub: 'COMPLETION', color: '#00ff88' },
              { val: `${analytics?.weeklyCompletionRate || 100}%`, label: '7-DAY', sub: 'COMPLETION', color: '#00d4ff' },
              { val: `${analytics?.totalQuestsCompleted || 0}`, label: 'CLEARED', sub: 'TOTAL QUESTS', color: '#cc88ff' },
            ].map((m, i) => (
              <div key={i} className="sl-metric-card">
                <span className="sl-corner-tr" />
                <span className="sl-corner-bl" />
                <span className="sl-corner-br" />
                <div className="sl-metric-val" style={{ color: m.color, textShadow: `0 0 12px ${m.color}88`, fontSize: '1.6rem' }}>
                  {m.val}
                </div>
                <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.55rem', letterSpacing: '2px', color: m.color, opacity: 0.7, marginTop: '2px' }}>
                  {m.label}
                </div>
                <div className="sl-metric-label">{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Active Quests Queue */}
          <SLPanel title="ACTIVE OBJECTIVES">
            <div style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.55rem', letterSpacing: '2px', color: 'var(--text-muted)' }}>
                  {activeQuests.length} OBJECTIVE{activeQuests.length !== 1 ? 'S' : ''} IN PROGRESS
                </span>
                <button
                  className="sl-btn sl-btn-ghost"
                  style={{ padding: '4px 12px' }}
                  onClick={() => onNavigate('quests')}
                >
                  FULL LOG →
                </button>
              </div>

              {activeQuests.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', fontFamily: 'var(--font-hud)', fontSize: '0.65rem', letterSpacing: '3px', color: 'var(--text-muted)' }}>
                  [ NO ACTIVE OBJECTIVES ]<br />
                  <span style={{ fontSize: '0.55rem', opacity: 0.6 }}>INSCRIBE A QUEST TO BEGIN</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeQuests.slice(0, 4).map((quest) => {
                    const completedST = quest.subtasks.filter((s) => s.completed).length;
                    const totalST = quest.subtasks.length;
                    const stPct = totalST > 0 ? Math.round((completedST / totalST) * 100) : 0;
                    return (
                      <div
                        key={quest.id}
                        className={`sl-quest-card ${quest.isMandatory ? 'mandatory' : ''}`}
                        style={{ borderRadius: 0 }}
                      >
                        <div className="quest-scan" />
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            {/* Tags */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
                              <span className={`rank-badge rank-${quest.difficulty}`}>{quest.difficulty}</span>
                              <span className="sl-tag">{quest.category}</span>
                              {quest.isMandatory && <span className="sl-tag sl-tag-red">MANDATORY</span>}
                              {quest.recurrence !== 'ONE_TIME' && <span className="sl-tag sl-tag-gold">{quest.recurrence}</span>}
                            </div>

                            {/* Title */}
                            <div style={{
                              fontFamily: 'var(--font-body)',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              color: 'var(--text-primary)',
                              marginBottom: '6px',
                            }}>
                              {quest.title}
                            </div>

                            {/* Subtasks */}
                            {totalST > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
                                {quest.subtasks.slice(0, 3).map((st) => (
                                  <div
                                    key={st.id}
                                    className="sl-checkbox-row"
                                    onClick={() => onToggleSubtask(quest.id, st.id, st.completed)}
                                    style={{ color: st.completed ? 'var(--text-muted)' : 'var(--text-secondary)', fontSize: '0.8rem' }}
                                  >
                                    <div className={`sl-checkbox ${st.completed ? 'checked' : ''}`} />
                                    <span style={{ textDecoration: st.completed ? 'line-through' : 'none' }}>{st.text}</span>
                                  </div>
                                ))}
                                {totalST > 0 && (
                                  <div style={{ marginTop: '4px' }}>
                                    <div className="sl-progress-track" style={{ height: '3px' }}>
                                      <div className="sl-progress-fill" style={{ width: `${stPct}%` }} />
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.5rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                      {completedST}/{totalST} TASKS · {stPct}%
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Right: XP + Complete */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.7rem', color: 'var(--cyan)', textShadow: '0 0 8px var(--cyan-glow)', marginBottom: '6px' }}>
                              +{quest.xpReward} XP
                            </div>
                            <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.6rem', color: 'var(--gold)', marginBottom: '8px' }}>
                              +{quest.goldReward}G
                            </div>
                            <button
                              className="sl-btn sl-btn-success"
                              style={{ padding: '5px 12px', fontSize: '0.6rem' }}
                              onClick={() => { sound.playQuestComplete(); onCompleteQuest(quest.id); }}
                            >
                              CLEAR ✓
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </SLPanel>

          {/* Bottom Row: Rewards + System Log */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* Rewards */}
            <SLPanel title="REWARDS">
              <div style={{ padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.55rem', letterSpacing: '2px', color: 'var(--text-muted)' }}>
                    LOOT CACHE
                  </span>
                  <button className="sl-btn sl-btn-ghost" style={{ padding: '2px 8px', fontSize: '0.55rem' }} onClick={() => onNavigate('rewards')}>
                    MANAGE →
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ flex: 1, padding: '8px', background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-hud)', fontSize: '1.1rem', fontWeight: 900, color: 'var(--green-neon)', textShadow: '0 0 10px var(--green-glow)' }}>
                      {unlockedRewards.length}
                    </div>
                    <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.5rem', letterSpacing: '1px', color: 'var(--text-muted)' }}>UNLOCKED</div>
                  </div>
                  <div style={{ flex: 1, padding: '8px', background: 'rgba(0,100,150,0.05)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-hud)', fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-muted)' }}>
                      {lockedRewards.length}
                    </div>
                    <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.5rem', letterSpacing: '1px', color: 'var(--text-muted)' }}>LOCKED</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {unlockedRewards.slice(0, 3).map((r) => (
                    <div key={r.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 10px',
                      background: 'rgba(255,215,0,0.05)',
                      border: '1px solid rgba(255,215,0,0.2)',
                      fontSize: '0.78rem',
                    }}>
                      <span>{r.icon} {r.title}</span>
                      <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.6rem', color: 'var(--gold)' }}>{r.costGold}G</span>
                    </div>
                  ))}
                  {unlockedRewards.length === 0 && (
                    <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.6rem', letterSpacing: '2px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>
                      COMPLETE QUESTS TO UNLOCK
                    </div>
                  )}
                </div>
              </div>
            </SLPanel>

            {/* System Log */}
            <SLPanel title="SYSTEM LOG">
              <div style={{ padding: '14px', maxHeight: '220px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontFamily: 'var(--font-hud)', fontSize: '0.55rem', letterSpacing: '2px', color: 'var(--text-muted)' }}>NOTIFICATIONS</span>
                  <button className="sl-btn sl-btn-ghost" style={{ padding: '2px 8px', fontSize: '0.55rem' }} onClick={() => onNavigate('notifications')}>
                    ALL →
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.6rem', letterSpacing: '2px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 10px' }}>
                    [ NO SYSTEM EVENTS ]
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {notifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        className={`sl-log-entry ${n.category === 'PENALTY' ? 'penalty' : n.category === 'LEVEL_UP' ? 'levelup' : n.category === 'QUEST' ? 'quest' : ''}`}
                      >
                        <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '1px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{n.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SLPanel>

          </div>
        </div>
      </div>
    </div>
  );
};
