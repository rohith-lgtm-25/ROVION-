import React, { useState, useEffect } from 'react';
import type { WeeklyEvaluation } from '../../../shared/types.js';
import { sound } from '../utils/audio.js';

export const WeeklyReportPage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<WeeklyEvaluation[]>([]);
  const [evaluating, setEvaluating] = useState(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchEvaluations = async () => {
    try {
      const res = await fetch('/api/weekly/evaluations');
      if (res.ok) {
        const data = await res.json();
        setEvaluations(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    try {
      const res = await fetch('/api/weekly/evaluate-current', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        if (data.evaluation.grade === 'S' || data.evaluation.grade === 'A') {
          sound.playLevelUp();
        } else {
          sound.playQuestComplete();
        }
        fetchEvaluations();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleClaimWeeklyReward = async (id: string) => {
    setClaimingId(id);
    try {
      const res = await fetch(`/api/weekly/claim-reward/${id}`, { method: 'POST' });
      if (res.ok) {
        sound.playLevelUp();
        fetchEvaluations();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClaimingId(null);
    }
  };

  const latestEval = evaluations.length > 0 ? evaluations[0] : null;

  const gradeColor = (grade: string) => {
    if (grade === 'S') return 'var(--purple-neon)';
    if (grade === 'A') return 'var(--green-neon)';
    if (grade === 'B') return 'var(--cyan)';
    if (grade === 'C') return 'var(--gold)';
    return 'var(--crimson)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="sl-panel" style={{ padding: '20px 24px' }}>
        <div className="sl-corner-tr" /><div className="sl-corner-bl" /><div className="sl-corner-br" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="sl-panel-title" style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, fontSize: '0.8rem' }}>
              ◆ WEEKLY EVALUATION // PERFORMANCE REPORT ◆
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', fontFamily: 'var(--font-body)' }}>
              Deterministic assessment of weekly performance, bonus XP yields, and weekly reward clearance.
            </p>
          </div>

          <button
            onClick={handleRunEvaluation}
            disabled={evaluating}
            className="sl-btn sl-btn-primary"
          >
            {evaluating ? 'EVALUATING...' : '⚡ RUN WEEKLY AUDIT'}
          </button>
        </div>
      </div>

      {/* Latest Evaluation Showcase */}
      {latestEval ? (
        <div className="sl-panel" style={{ padding: '28px' }}>
          <div className="sl-corner-tr" /><div className="sl-corner-bl" /><div className="sl-corner-br" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.65rem', letterSpacing: '2px', color: 'var(--cyan)', textShadow: '0 0 8px var(--cyan-glow)' }}>
                [ REPORT CARD // {latestEval.weekStartDate} TO {latestEval.weekEndDate} ]
              </div>
              <div style={{ fontFamily: 'var(--font-hud)', fontSize: '1.2rem', fontWeight: 800, marginTop: '6px', color: 'var(--text-primary)', letterSpacing: '2px' }}>
                WEEKLY AUDIT SUMMARY
              </div>
            </div>

            {/* Grade Badge */}
            <div style={{
              width: '80px',
              height: '80px',
              background: latestEval.grade === 'S'
                ? 'linear-gradient(135deg, rgba(136,0,255,0.4), rgba(0,80,200,0.4))'
                : latestEval.grade === 'A'
                ? 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,180,255,0.2))'
                : 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,100,0,0.2))',
              border: `2px solid ${gradeColor(latestEval.grade)}`,
              boxShadow: `0 0 25px ${gradeColor(latestEval.grade)}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-hud)',
              fontSize: '2.5rem',
              fontWeight: 900,
              color: gradeColor(latestEval.grade),
              textShadow: `0 0 20px ${gradeColor(latestEval.grade)}`,
            }}>
              {latestEval.grade}
            </div>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="sl-metric-card">
              <div className="sl-metric-val" style={{ color: 'var(--green-neon)', textShadow: '0 0 12px var(--green-glow)' }}>
                {latestEval.completionRate}%
              </div>
              <div className="sl-metric-label">Completion Rate</div>
            </div>

            <div className="sl-metric-card">
              <div className="sl-metric-val">
                +{latestEval.totalXPBonusEarned} XP
              </div>
              <div className="sl-metric-label">Bonus XP Yield</div>
            </div>

            <div className="sl-metric-card">
              <div className="sl-metric-val" style={{ color: 'var(--text-primary)', fontSize: '1.3rem' }}>
                {latestEval.questsCompletedCount} / {latestEval.questsCompletedCount + latestEval.questsFailedCount}
              </div>
              <div className="sl-metric-label">Objectives Conquered</div>
            </div>

            <div className="sl-metric-card">
              <div className="sl-metric-val" style={{
                color: latestEval.mandatoryFailedCount === 0 ? 'var(--green-neon)' : 'var(--crimson)',
                textShadow: latestEval.mandatoryFailedCount === 0 ? '0 0 12px var(--green-glow)' : '0 0 12px var(--crimson-glow)',
              }}>
                {latestEval.mandatoryFailedCount}
              </div>
              <div className="sl-metric-label">Mandatory Fails</div>
            </div>
          </div>

          {/* Weekly Reward Clearance Banner */}
          <div style={{
            padding: '16px 20px',
            background: latestEval.weeklyRewardEligible ? 'rgba(255, 215, 0, 0.06)' : 'rgba(0, 20, 45, 0.5)',
            border: `1px solid ${latestEval.weeklyRewardEligible ? 'rgba(255,215,0,0.4)' : 'var(--border-subtle)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: latestEval.weeklyRewardEligible ? '0 0 20px rgba(255,215,0,0.1)' : 'none',
          }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-hud)',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '2px',
                color: latestEval.weeklyRewardEligible ? 'var(--gold)' : 'var(--text-muted)',
                textShadow: latestEval.weeklyRewardEligible ? '0 0 8px var(--gold-glow)' : 'none',
              }}>
                {latestEval.weeklyRewardEligible ? '👑 WEEKLY MONARCH REWARD EARNED' : '🔒 WEEKLY REWARD LOCKED'}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'var(--font-body)' }}>
                Reward: <strong>{latestEval.weeklyRewardTitle}</strong> — Requires Grade A or S
              </div>
            </div>

            {latestEval.weeklyRewardEligible && (
              latestEval.weeklyRewardClaimed ? (
                <span style={{ color: 'var(--green-neon)', fontFamily: 'var(--font-hud)', fontSize: '0.75rem', letterSpacing: '2px', textShadow: '0 0 8px var(--green-glow)' }}>
                  ✓ CLAIMED
                </span>
              ) : (
                <button
                  onClick={() => handleClaimWeeklyReward(latestEval.id)}
                  disabled={claimingId === latestEval.id}
                  className="sl-btn"
                  style={{ color: 'var(--gold)', border: '1px solid var(--gold)', background: 'rgba(255,215,0,0.08)', textShadow: '0 0 8px var(--gold-glow)', boxShadow: '0 0 10px rgba(255,215,0,0.2)' }}
                >
                  {claimingId === latestEval.id ? 'CLAIMING...' : 'CLAIM BOSS REWARD 🎁'}
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="sl-panel" style={{ padding: '60px', textAlign: 'center' }}>
          <div className="sl-corner-tr" /><div className="sl-corner-bl" /><div className="sl-corner-br" />
          <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '3px' }}>
            [ NO WEEKLY EVALUATIONS RECORDED ]
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '12px', fontFamily: 'var(--font-body)' }}>
            Click "Run Weekly Audit" to evaluate this week's progress!
          </p>
        </div>
      )}

      {/* Historical Archive */}
      {evaluations.length > 1 && (
        <div className="sl-panel" style={{ padding: '24px' }}>
          <div className="sl-corner-tr" /><div className="sl-corner-bl" /><div className="sl-corner-br" />
          <div className="sl-panel-title" style={{ marginBottom: '16px' }}>PAST WEEKLY EVALUATIONS</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {evaluations.slice(1).map((ev) => (
              <div key={ev.id} className="sl-log-entry" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderLeft: `3px solid ${gradeColor(ev.grade)}`,
              }}>
                <div>
                  <span style={{ fontFamily: 'var(--font-hud)', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '2px', color: gradeColor(ev.grade) }}>
                    GRADE {ev.grade}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: '12px', fontFamily: 'var(--font-mono)' }}>
                    {ev.weekStartDate} → {ev.weekEndDate}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--green-neon)' }}>{ev.completionRate}% DONE</span>
                  <span style={{ color: 'var(--cyan)' }}>+{ev.totalXPBonusEarned} XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
