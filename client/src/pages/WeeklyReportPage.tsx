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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="system-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 className="system-title-glow" style={{ fontSize: '1.3rem', margin: 0 }}>
              WEEKLY EVALUATION & REPORT CARD
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Deterministic assessment of weekly performance, bonus XP yields, and weekly reward clearance.
            </p>
          </div>

          <button
            onClick={handleRunEvaluation}
            disabled={evaluating}
            className="btn-system"
          >
            {evaluating ? 'Evaluating Week...' : '⚡ Run Weekly Audit'}
          </button>
        </div>
      </div>

      {/* Latest Evaluation Showcase */}
      {latestEval ? (
        <div className="system-panel" style={{
          padding: '28px',
          background: 'linear-gradient(135deg, rgba(14, 19, 29, 0.9), rgba(20, 27, 45, 0.9))',
          border: '1px solid var(--system-blue)',
          boxShadow: '0 0 30px var(--system-blue-glow)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--system-blue)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                [REPORT CARD // {latestEval.weekStartDate} TO {latestEval.weekEndDate}]
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '4px' }}>
                Weekly Audit Summary
              </h3>
            </div>

            {/* Big Grade Badge */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: latestEval.grade === 'S'
                ? 'linear-gradient(135deg, #a855f7, #ec4899)'
                : latestEval.grade === 'A'
                ? 'linear-gradient(135deg, #06d6a0, #00d2ff)'
                : 'linear-gradient(135deg, #f59e0b, #ef4444)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: '2.5rem',
              fontWeight: 900,
              color: '#fff',
              boxShadow: '0 0 25px rgba(0, 210, 255, 0.4)',
            }}>
              {latestEval.grade}
            </div>
          </div>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--emerald-success)', fontFamily: 'var(--font-mono)' }}>
                {latestEval.completionRate}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completion Rate</div>
            </div>

            <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--system-blue)', fontFamily: 'var(--font-mono)' }}>
                +{latestEval.totalXPBonusEarned} XP
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bonus XP Yield</div>
            </div>

            <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {latestEval.questsCompletedCount} / {latestEval.questsCompletedCount + latestEval.questsFailedCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Objectives Conquered</div>
            </div>

            <div style={{ padding: '14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: latestEval.mandatoryFailedCount === 0 ? 'var(--emerald-success)' : 'var(--crimson-danger)', fontFamily: 'var(--font-mono)' }}>
                {latestEval.mandatoryFailedCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mandatory Fails</div>
            </div>
          </div>

          {/* Weekly Reward Clearance Banner */}
          <div style={{
            padding: '16px 20px',
            background: latestEval.weeklyRewardEligible ? 'rgba(255, 209, 102, 0.1)' : 'rgba(255, 255, 255, 0.03)',
            border: latestEval.weeklyRewardEligible ? '1px solid var(--gold-accent)' : '1px solid var(--border-subtle)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: latestEval.weeklyRewardEligible ? 'var(--gold-accent)' : 'var(--text-secondary)' }}>
                {latestEval.weeklyRewardEligible ? '👑 WEEKLY MONARCH REWARD EARNED' : '🔒 WEEKLY REWARD LOCKED'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Reward: <strong>{latestEval.weeklyRewardTitle}</strong> (Requires Grade A or S)
              </div>
            </div>

            {latestEval.weeklyRewardEligible && (
              latestEval.weeklyRewardClaimed ? (
                <span style={{ color: 'var(--emerald-success)', fontWeight: 700, fontSize: '0.85rem' }}>
                  ✓ Claimed
                </span>
              ) : (
                <button
                  onClick={() => handleClaimWeeklyReward(latestEval.id)}
                  disabled={claimingId === latestEval.id}
                  className="btn-system"
                  style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#000', fontWeight: 800 }}
                >
                  {claimingId === latestEval.id ? 'Claiming...' : 'Claim Weekly Boss Reward 🎁'}
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="system-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No weekly evaluations recorded yet. Click "Run Weekly Audit" to evaluate this week's progress!
        </div>
      )}

      {/* Historical Archive */}
      {evaluations.length > 1 && (
        <div className="system-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: '16px' }}>
            [PAST WEEKLY EVALUATIONS]
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {evaluations.slice(1).map((ev) => (
              <div key={ev.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
              }}>
                <div>
                  <span style={{ fontWeight: 700 }}>Grade {ev.grade}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '10px' }}>
                    {ev.weekStartDate} to {ev.weekEndDate}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--emerald-success)' }}>{ev.completionRate}% Done</span>
                  <span style={{ color: 'var(--system-blue)' }}>+{ev.totalXPBonusEarned} XP</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
