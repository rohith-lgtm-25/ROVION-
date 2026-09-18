import React, { useState } from 'react';
import type {
  AttributeRewards,
  Quest,
  QuestCategory,
  QuestPriority,
  QuestRecurrence,
  QuestStatus,
  RankTier,
} from '../../../shared/types.js';
import { sound } from '../utils/audio.js';

interface Props {
  quests: Quest[];
  onRefresh: () => void;
  onCompleteQuest: (id: string) => void;
  onFailQuest: (id: string) => void;
  onCancelQuest: (id: string) => void;
  onDeleteQuest: (id: string) => void;
  onToggleSubtask: (questId: string, subtaskId: string, current: boolean) => void;
}

export const QuestsPage: React.FC<Props> = ({
  quests,
  onRefresh,
  onCompleteQuest,
  onFailQuest,
  onCancelQuest,
  onDeleteQuest,
  onToggleSubtask,
}) => {
  const [statusFilter, setStatusFilter] = useState<QuestStatus | 'ALL'>('ACTIVE');
  const [categoryFilter, setCategoryFilter] = useState<QuestCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Quest Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<QuestCategory>('CODING');
  const [priority, setPriority] = useState<QuestPriority>('MEDIUM');
  const [difficulty, setDifficulty] = useState<RankTier>('E');
  const [isMandatory, setIsMandatory] = useState(false);
  const [recurrence, setRecurrence] = useState<QuestRecurrence>('ONE_TIME');
  const [deadline, setDeadline] = useState('');
  const [subtasksText, setSubtasksText] = useState('');
  const [customXP, setCustomXP] = useState<number | ''>('');
  const [customGold, setCustomGold] = useState<number | ''>('');

  // Edit Quest Modal
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const subtasks = subtasksText
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const res = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          priority,
          difficulty,
          isMandatory,
          recurrence,
          deadline: deadline || undefined,
          subtasks,
          xpReward: customXP !== '' ? Number(customXP) : undefined,
          goldReward: customGold !== '' ? Number(customGold) : undefined,
        }),
      });

      if (res.ok) {
        sound.playQuestComplete();
        setShowCreateModal(false);
        setTitle('');
        setDescription('');
        setSubtasksText('');
        setDeadline('');
        setCustomXP('');
        setCustomGold('');
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to create quest:', err);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuest) return;

    try {
      const res = await fetch(`/api/quests/${editingQuest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingQuest.title,
          description: editingQuest.description,
          category: editingQuest.category,
          priority: editingQuest.priority,
          difficulty: editingQuest.difficulty,
          deadline: editingQuest.deadline,
          isMandatory: editingQuest.isMandatory,
          recurrence: editingQuest.recurrence,
        }),
      });

      if (res.ok) {
        sound.playClick();
        setEditingQuest(null);
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to edit quest:', err);
    }
  };

  const filteredQuests = quests.filter((q) => {
    if (statusFilter !== 'ALL' && q.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && q.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const match =
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.description.toLowerCase().includes(searchQuery.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header & Controls Bar */}
      <div className="system-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 className="system-title-glow" style={{ fontSize: '1.3rem', margin: 0 }}>
              QUEST LOG & OBJECTIVES
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Manage, track, and conquer personal productivity operations.
            </p>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              setShowCreateModal(true);
            }}
            className="btn-system"
          >
            + Inscribe Custom Quest
          </button>
        </div>

        {/* Filters Row */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px' }}>
            {(['ACTIVE', 'COMPLETED', 'FAILED', 'CANCELLED', 'ALL'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  sound.playClick();
                  setStatusFilter(st);
                }}
                style={{
                  padding: '6px 12px',
                  background: statusFilter === st ? 'var(--system-blue-dark)' : 'transparent',
                  color: statusFilter === st ? '#fff' : 'var(--text-secondary)',
                  border: statusFilter === st ? '1px solid var(--system-blue)' : '1px solid transparent',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            style={{
              padding: '8px 12px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.85rem',
            }}
          >
            <option value="ALL">All Categories</option>
            <option value="CODING">Coding</option>
            <option value="STUDY">Study</option>
            <option value="FITNESS">Fitness</option>
            <option value="DISCIPLINE">Discipline</option>
            <option value="CAREER">Career</option>
            <option value="HEALTH">Health</option>
            <option value="CREATIVE">Creative</option>
            <option value="LIFE">Life</option>
          </select>

          {/* Search Box */}
          <input
            type="text"
            placeholder="Search objectives..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '8px 14px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Quests Grid */}
      {filteredQuests.length === 0 ? (
        <div className="system-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No quests match current status or filters.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
          {filteredQuests.map((quest) => (
            <div
              key={quest.id}
              className="system-panel"
              style={{
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: quest.isMandatory && quest.status === 'ACTIVE'
                  ? '1px solid var(--crimson-danger)'
                  : quest.status === 'COMPLETED'
                  ? '1px solid rgba(16, 185, 129, 0.4)'
                  : '1px solid var(--border-subtle)',
              }}
            >
              <div>
                {/* Header Tags */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span className={`rank-badge rank-${quest.difficulty}`}>{quest.difficulty}</span>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                    }}>
                      {quest.category}
                    </span>
                    {quest.isMandatory && (
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(255, 51, 102, 0.2)',
                        color: 'var(--crimson-danger)',
                        fontWeight: 700,
                      }}>
                        MANDATORY
                      </span>
                    )}
                    {quest.recurrence !== 'ONE_TIME' && (
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(157, 78, 221, 0.2)',
                        color: 'var(--monarch-purple)',
                        fontWeight: 600,
                      }}>
                        🔄 {quest.recurrence}
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                    color: quest.status === 'COMPLETED'
                      ? 'var(--emerald-success)'
                      : quest.status === 'FAILED'
                      ? 'var(--crimson-danger)'
                      : 'var(--system-blue)',
                    fontWeight: 700,
                  }}>
                    [{quest.status}]
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>{quest.title}</h3>
                {quest.description && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    {quest.description}
                  </p>
                )}

                {/* Subtasks Checklist */}
                {quest.subtasks.length > 0 && (
                  <div style={{
                    background: 'rgba(0,0,0,0.25)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    marginBottom: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}>
                    {quest.subtasks.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => {
                          if (quest.status === 'ACTIVE') {
                            sound.playClick();
                            onToggleSubtask(quest.id, st.id, st.completed);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.8rem',
                          color: st.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: st.completed ? 'line-through' : 'none',
                          cursor: quest.status === 'ACTIVE' ? 'pointer' : 'default',
                        }}
                      >
                        <span>{st.completed ? '☑' : '☐'}</span>
                        <span>{st.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rewards & Attributes */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  marginBottom: '14px',
                }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ color: 'var(--system-blue)' }}>+{quest.xpReward} XP</span>
                    <span style={{ color: 'var(--gold-accent)' }}>+{quest.goldReward}G</span>
                  </div>
                  {quest.deadline && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      ⏱ {new Date(quest.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '12px',
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {quest.status === 'ACTIVE' && (
                    <button
                      onClick={() => setEditingQuest(quest)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      ✏️ Edit
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteQuest(quest.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer' }}
                  >
                    🗑️
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {quest.status === 'ACTIVE' && (
                    <>
                      <button
                        onClick={() => onFailQuest(quest.id)}
                        className="btn-system-danger"
                      >
                        Fail
                      </button>
                      <button
                        onClick={() => onCancelQuest(quest.id)}
                        className="btn-system-secondary"
                        style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => onCompleteQuest(quest.id)}
                        className="btn-system-success"
                      >
                        Complete ✓
                      </button>
                    </>
                  )}
                  {quest.status === 'COMPLETED' && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--emerald-success)', fontWeight: 700 }}>
                      ✓ Cleared
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE QUEST MODAL */}
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
          <div className="system-panel" style={{ width: '100%', maxWidth: '580px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="system-title-glow" style={{ fontSize: '1.25rem', marginBottom: '16px' }}>
              INSCRIBE CUSTOM SYSTEM QUEST
            </h3>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Quest Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build WebGL Shader Engine"
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
                  placeholder="Detailed criteria for conquering this objective..."
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

              {/* Category & Difficulty Row */}
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
                    <option value="CODING">Coding (Intel, Focus)</option>
                    <option value="STUDY">Study (Intel, Discipline)</option>
                    <option value="FITNESS">Fitness (Strength, Energy)</option>
                    <option value="DISCIPLINE">Discipline (Discipline, Consistency)</option>
                    <option value="CAREER">Career (Productivity, Focus)</option>
                    <option value="HEALTH">Health (Energy, Consistency)</option>
                    <option value="CREATIVE">Creative (Focus, Productivity)</option>
                    <option value="LIFE">Life (Productivity)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Difficulty / Rank</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
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
                    <option value="E">E-Rank (Simple Habit / 50 XP)</option>
                    <option value="D">D-Rank (Standard Task / 120 XP)</option>
                    <option value="C">C-Rank (Deep Sprint / 300 XP)</option>
                    <option value="B">B-Rank (Challenging Milestone / 750 XP)</option>
                    <option value="A">A-Rank (Hard Boss / 1800 XP)</option>
                    <option value="S">S-Rank (Mastery / 5000 XP)</option>
                  </select>
                </div>
              </div>

              {/* Priority & Recurrence Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
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
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (Mandatory Penalty on Fail)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Recurrence</label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as any)}
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
                    <option value="ONE_TIME">One-Time Quest</option>
                    <option value="DAILY">Daily Recurring</option>
                    <option value="WEEKDAYS">Every Weekday</option>
                    <option value="WEEKLY">Weekly Recurring</option>
                  </select>
                </div>
              </div>

              {/* Mandatory checkbox & Deadline */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isMandatory}
                    onChange={(e) => setIsMandatory(e.target.checked)}
                  />
                  <span>Mandatory Task (triggers penalty if failed)</span>
                </label>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Deadline (optional)</label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: '#fff',
                      marginTop: '4px',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
              </div>

              {/* Subtasks */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Subtasks (one per line)</label>
                <textarea
                  rows={3}
                  placeholder="Phase 1: Setup&#10;Phase 2: Execution&#10;Phase 3: Verification"
                  value={subtasksText}
                  onChange={(e) => setSubtasksText(e.target.value)}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-system-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-system">
                  Inscribe Quest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT QUEST MODAL */}
      {editingQuest && (
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
          <div className="system-panel" style={{ width: '100%', maxWidth: '500px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '14px', color: 'var(--system-blue)' }}>Edit Quest</h3>
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Title</label>
                <input
                  type="text"
                  required
                  value={editingQuest.title}
                  onChange={(e) => setEditingQuest({ ...editingQuest, title: e.target.value })}
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
                  rows={2}
                  value={editingQuest.description}
                  onChange={(e) => setEditingQuest({ ...editingQuest, description: e.target.value })}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingQuest(null)}
                  className="btn-system-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-system">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
