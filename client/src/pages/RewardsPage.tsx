import React, { useState } from 'react';
import type { CustomReward, HunterProfile, RewardCategory } from '../../../shared/types.js';
import { sound } from '../utils/audio.js';

interface Props {
  rewards: CustomReward[];
  profile: HunterProfile | null;
  onRefresh: () => void;
}

export const RewardsPage: React.FC<Props> = ({ rewards, profile, onRefresh }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<RewardCategory>('ENTERTAINMENT');
  const [icon, setIcon] = useState('🎁');
  const [costGold, setCostGold] = useState<number>(50);
  const [minLevel, setMinLevel] = useState<number | ''>('');
  const [minStreakDays, setMinStreakDays] = useState<number | ''>('');
  const [minTotalXP, setMinTotalXP] = useState<number | ''>('');
  const [minWeeklyRate, setMinWeeklyRate] = useState<number | ''>('');
  const [completedCount, setCompletedCount] = useState<number | ''>('');

  const [claimingId, setClaimingId] = useState<string | null>(null);

  const handleClaim = async (reward: CustomReward) => {
    setClaimingId(reward.id);
    try {
      const res = await fetch(`/api/rewards/${reward.id}/claim`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        sound.playLevelUp();
        onRefresh();
      } else {
        sound.playAlert();
        alert(data.error);
      }
    } catch (err) {
      console.error('Failed to claim reward:', err);
    } finally {
      setClaimingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/rewards/${id}`, { method: 'DELETE' });
      sound.playClick();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const conditions: any = {};
    if (minLevel !== '') conditions.minLevel = Number(minLevel);
    if (minStreakDays !== '') conditions.minStreakDays = Number(minStreakDays);
    if (minTotalXP !== '') conditions.minTotalXP = Number(minTotalXP);
    if (minWeeklyRate !== '') conditions.minWeeklyCompletionRate = Number(minWeeklyRate);
    if (completedCount !== '') conditions.completedQuestsCount = Number(completedCount);

    try {
      const res = await fetch('/api/rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          icon,
          costGold,
          conditions,
        }),
      });

      if (res.ok) {
        sound.playQuestComplete();
        setShowCreateModal(false);
        setTitle('');
        setDescription('');
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div className="system-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 className="system-title-glow" style={{ fontSize: '1.3rem', margin: 0 }}>
              LOOT & REWARD GALLERY
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Earn guilt-free leisure, gaming, and real-world treats by fulfilling productivity conditions.
            </p>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setShowCreateModal(true);
            }}
            className="btn-system"
          >
            + Forge Custom Reward
          </button>
        </div>
      </div>

      {/* Rewards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {rewards.map((reward) => (
          <div
            key={reward.id}
            className="system-panel"
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: reward.isUnlocked && !reward.isClaimed
                ? 'rgba(255, 209, 102, 0.05)'
                : 'rgba(14, 19, 29, 0.75)',
              border: reward.isClaimed
                ? '1px solid rgba(16, 185, 129, 0.3)'
                : reward.isUnlocked
                ? '1px solid var(--gold-accent)'
                : '1px solid var(--border-subtle)',
              boxShadow: reward.isUnlocked && !reward.isClaimed ? '0 0 15px var(--gold-glow)' : 'none',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.8rem' }}>{reward.icon}</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color: reward.isClaimed
                      ? 'var(--emerald-success)'
                      : reward.isUnlocked
                      ? 'var(--gold-accent)'
                      : 'var(--text-muted)',
                    fontWeight: 700,
                  }}>
                    {reward.isClaimed ? '✓ CLAIMED' : reward.isUnlocked ? '🔓 UNLOCKED' : '🔒 LOCKED'}
                  </span>
                  <button
                    onClick={() => handleDelete(reward.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>{reward.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                {reward.description}
              </p>

              {/* Conditions Box */}
              <div style={{
                background: 'rgba(0,0,0,0.25)',
                padding: '8px 12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '0.75rem',
              }}>
                <div style={{ color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                  UNLOCK REQUIREMENTS:
                </div>
                {Object.keys(reward.conditions).length === 0 ? (
                  <div style={{ color: 'var(--emerald-success)' }}>• None (Open for claim)</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', color: 'var(--text-secondary)' }}>
                    {reward.conditions.minLevel && (
                      <div>• Minimum Hunter Level: <strong>LV. {reward.conditions.minLevel}</strong> (You: LV. {profile?.level})</div>
                    )}
                    {reward.conditions.minStreakDays && (
                      <div>• Minimum Streak: <strong>{reward.conditions.minStreakDays} Days</strong></div>
                    )}
                    {reward.conditions.minTotalXP && (
                      <div>• Accumulated XP: <strong>{reward.conditions.minTotalXP} XP</strong> (You: {profile?.totalXP} XP)</div>
                    )}
                    {reward.conditions.minWeeklyCompletionRate && (
                      <div>• Weekly Completion Rate: <strong>{reward.conditions.minWeeklyCompletionRate}%</strong></div>
                    )}
                    {reward.conditions.completedQuestsCount && (
                      <div>• Total Finished Quests: <strong>{reward.conditions.completedQuestsCount}</strong></div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom: Cost & Claim Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '14px',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold-accent)', fontWeight: 700 }}>
                {reward.costGold > 0 ? `🪙 ${reward.costGold} Gold` : 'Free Claim'}
              </span>

              {reward.isClaimed ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Enjoyed at {new Date(reward.claimedAt!).toLocaleDateString()}
                </span>
              ) : reward.isUnlocked ? (
                <button
                  onClick={() => handleClaim(reward)}
                  disabled={claimingId === reward.id}
                  className="btn-system"
                  style={{
                    background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                    borderColor: 'var(--gold-accent)',
                    color: '#000',
                    fontWeight: 800,
                  }}
                >
                  {claimingId === reward.id ? 'Claiming...' : 'Claim Reward 🎁'}
                </button>
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Conditions Not Met
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CREATE REWARD MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px',
        }}>
          <div className="system-panel" style={{ width: '100%', maxWidth: '520px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="system-title-glow" style={{ fontSize: '1.25rem', marginBottom: '16px' }}>
              FORGE CUSTOM REWARD
            </h3>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Reward Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2 Hours of Elden Ring / Pizza Night"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: '#fff',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Description</label>
                <textarea
                  placeholder="What you get to enjoy guilt-free..."
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: '#fff',
                    marginTop: '4px',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: '#fff',
                      marginTop: '4px',
                    }}
                  >
                    <option value="ENTERTAINMENT">Entertainment (Anime/Series)</option>
                    <option value="GAMING">Gaming</option>
                    <option value="FOOD">Food / Culinary Treat</option>
                    <option value="LEISURE">Leisure & Outing</option>
                    <option value="TREAT">Treat / Shopping</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Icon (Emoji)</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: '#fff',
                      marginTop: '4px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Gold Cost</label>
                <input
                  type="number"
                  min="0"
                  value={costGold}
                  onChange={(e) => setCostGold(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    color: '#fff',
                    marginTop: '4px',
                  }}
                />
              </div>

              {/* Conditions Sub-form */}
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--gold-accent)', fontWeight: 700, marginBottom: '8px' }}>
                  UNLOCK CONDITIONS (OPTIONAL):
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Min Level</label>
                    <input
                      type="number"
                      placeholder="e.g. 3"
                      value={minLevel}
                      onChange={(e) => setMinLevel(e.target.value ? Number(e.target.value) : '')}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.8rem',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Min Streak (Days)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      value={minStreakDays}
                      onChange={(e) => setMinStreakDays(e.target.value ? Number(e.target.value) : '')}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.8rem',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-system-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-system">
                  Forge Reward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
