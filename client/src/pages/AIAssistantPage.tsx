import React, { useState } from 'react';
import type {
  AIAdvisorAnalysisResponse,
  HunterProfile,
  ParsedNaturalQuestProposal,
} from '../../../shared/types.js';
import { sound } from '../utils/audio.js';

interface Props {
  profile: HunterProfile | null;
  onQuestCreated: () => void;
}

export const AIAssistantPage: React.FC<Props> = ({ profile, onQuestCreated }) => {
  const [command, setCommand] = useState('');
  const [parsing, setParsing] = useState(false);
  const [proposal, setProposal] = useState<ParsedNaturalQuestProposal | null>(null);

  // Performance Advisor state
  const [advising, setAdvising] = useState(false);
  const [advice, setAdvice] = useState<AIAdvisorAnalysisResponse | null>(null);

  const sampleCommands = [
    'Study Python for 1 hour.',
    'Finish DBMS assignment by 9 PM.',
    'Work on MineNav-X for 2 hours.',
    'Exercise every weekday.',
  ];

  const handleParseCommand = async (cmdText?: string) => {
    const textToUse = cmdText || command;
    if (!textToUse.trim()) return;

    setParsing(true);
    setProposal(null);
    try {
      const res = await fetch('/api/ai/parse-quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: textToUse }),
      });
      const data = await res.json();
      if (res.ok) {
        sound.playClick();
        setProposal(data);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmQuest = async () => {
    if (!proposal) return;

    try {
      const res = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: proposal.title,
          description: proposal.description,
          category: proposal.category,
          priority: proposal.priority,
          difficulty: proposal.difficulty,
          isMandatory: proposal.isMandatory,
          recurrence: proposal.recurrence,
          deadline: proposal.deadline,
          subtasks: proposal.subtasks,
          attributeRewards: proposal.attributeRewards,
          xpReward: proposal.xpReward,
          goldReward: proposal.goldReward,
        }),
      });

      if (res.ok) {
        sound.playQuestComplete();
        setProposal(null);
        setCommand('');
        onQuestCreated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFetchAdvice = async () => {
    setAdvising(true);
    try {
      const res = await fetch('/api/ai/performance-advice', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        sound.playClick();
        setAdvice(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdvising(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="sl-panel" style={{ padding: '20px 24px' }}>
        <div className="sl-corner-tr" /><div className="sl-corner-bl" /><div className="sl-corner-br" />
        <div className="sl-panel-title">AI ORACLE // QUEST FORMULATOR</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', fontFamily: 'var(--font-body)' }}>
          Natural language command parsing with confirmation preview, plus real-data performance analysis.
        </p>
      </div>

      {/* SECTION 1: Natural Language Quest Parser */}
      <div className="sl-panel" style={{ padding: '24px' }}>
        <div className="sl-corner-tr" /><div className="sl-corner-bl" /><div className="sl-corner-br" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <span style={{ fontSize: '1.2rem' }}>⚡</span>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Natural Language Quest Formulation</h3>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Type any thought or plan. The AI converts it into a structured quest with subtasks, attributes, and difficulty for your confirmation.
        </p>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleParseCommand();
          }}
          style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}
        >
          <input
            type="text"
            placeholder="e.g. Finish DBMS assignment by 9 PM, or Study Python for 1 hour..."
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            className="sl-input"
            style={{ flex: 1 }}
          />
          <button type="submit" disabled={parsing} className="sl-btn sl-btn-primary">
            {parsing ? 'Formulating...' : 'PARSE ⚡'}
          </button>
        </form>

        {/* Quick Sample Prompts */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-hud)', letterSpacing: '1px' }}>SAMPLES:</span>
          {sampleCommands.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setCommand(s);
                handleParseCommand(s);
              }}
              className="sl-tab"
            >
              "{s}"
            </button>
          ))}
        </div>

        {/* Structured Confirmation Card */}
        {proposal && (
          <div style={{
            marginTop: '20px',
            padding: '20px',
            background: 'rgba(0, 15, 35, 0.9)',
            border: '1px solid var(--cyan)',
            boxShadow: '0 0 20px var(--cyan-glow)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={`rank-badge rank-${proposal.difficulty}`}>{proposal.difficulty}-RANK</span>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', fontWeight: 600 }}>
                  {proposal.category}
                </span>
                <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: proposal.priority === 'URGENT' ? 'rgba(255,51,102,0.2)' : 'rgba(255,255,255,0.08)', color: proposal.priority === 'URGENT' ? 'var(--crimson-danger)' : 'inherit', fontWeight: 600 }}>
                  {proposal.priority} PRIORITY
                </span>
                {proposal.recurrence !== 'ONE_TIME' && (
                  <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(157,78,221,0.2)', color: 'var(--monarch-purple)', fontWeight: 600 }}>
                    🔄 {proposal.recurrence}
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Confidence: {proposal.confidenceScore}%
              </span>
            </div>

            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>{proposal.title}</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{proposal.description}</p>

            {/* Subtasks */}
            {proposal.subtasks.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                  SUGGESTED EXECUTION SUBTASKS:
                </div>
                {proposal.subtasks.map((st, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-primary)', padding: '2px 0' }}>
                    • {st}
                  </div>
                ))}
              </div>
            )}

            {/* Yield preview */}
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', marginBottom: '16px' }}>
              <span style={{ color: 'var(--system-blue)' }}>+{proposal.xpReward} XP</span>
              <span style={{ color: 'var(--gold-accent)' }}>+{proposal.goldReward} Gold</span>
              {proposal.deadline && (
                <span style={{ color: 'var(--text-muted)' }}>
                  Deadline: {new Date(proposal.deadline).toLocaleString()}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setProposal(null)}
                className="sl-btn sl-btn-ghost"
              >
                DISCARD
              </button>
              <button
                type="button"
                onClick={handleConfirmQuest}
                className="sl-btn sl-btn-success"
              >
                INSCRIBE QUEST ✓
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Real-Data AI Performance Advisor */}
      <div className="sl-panel" style={{ padding: '24px' }}>
        <div className="sl-corner-tr" /><div className="sl-corner-bl" /><div className="sl-corner-br" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🧠</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Real-Data Tactical Performance Advisor</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Analyzes actual completed quests, failure rates, burnout risks, and attribute distributions from SQLite.
            </p>
          </div>

          <button
            onClick={handleFetchAdvice}
            disabled={advising}
            className="sl-btn sl-btn-primary"
          >
            {advising ? 'AUDITING...' : '⚡ AUDIT EFFICIENCY'}
          </button>
        </div>

        {advice ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Health Score Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>OPERATIONAL HEALTH SCORE</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: advice.healthScore >= 70 ? 'var(--emerald-success)' : 'var(--gold-accent)', fontFamily: 'var(--font-mono)' }}>
                  {advice.healthScore} / 100
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>RECOMMENDED FOCUS:</span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--system-blue)' }}>
                  {advice.suggestedFocusCategory}
                </div>
              </div>
            </div>

            {/* Summary */}
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.6 }}>
              "{advice.summary}"
            </p>

            {/* Strengths & Burnout Risks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--emerald-success)', fontWeight: 700, marginBottom: '6px' }}>
                  ✓ IDENTIFIED STRENGTHS
                </div>
                {advice.strengths.map((s, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '2px 0' }}>• {s}</div>
                ))}
              </div>

              <div style={{ padding: '14px', background: 'rgba(255, 51, 102, 0.05)', border: '1px solid rgba(255, 51, 102, 0.2)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--crimson-danger)', fontWeight: 700, marginBottom: '6px' }}>
                  ⚠️ BURNOUT & BOTTLENECK RISKS
                </div>
                {advice.burnoutRisks.map((b, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: '#fca5a5', padding: '2px 0' }}>• {b}</div>
                ))}
              </div>
            </div>

            {/* Tactical Recommendations */}
            <div style={{ padding: '16px', background: 'rgba(0, 210, 255, 0.04)', border: '1px solid var(--border-glow)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--system-blue)', fontWeight: 700, marginBottom: '8px' }}>
                TACTICAL RECOMMENDATIONS:
              </div>
              {advice.tacticalRecommendations.map((r, i) => (
                <div key={i} style={{ fontSize: '0.85rem', color: 'var(--text-primary)', padding: '3px 0' }}>
                  {i + 1}. {r}
                </div>
              ))}
            </div>

            {/* Closing Directive */}
            <div style={{ fontSize: '0.8rem', color: 'var(--monarch-purple)', fontStyle: 'italic', textAlign: 'center', marginTop: '4px' }}>
              ⚡ "{advice.motivationalDirective}"
            </div>
          </div>
        ) : (
          <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            Click "Audit Hunter Efficiency" to perform a real-time data analysis of your productivity habits.
          </div>
        )}
      </div>

    </div>
  );
};
