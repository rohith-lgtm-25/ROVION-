import React, { useState, useEffect } from 'react';
import type { HunterProfile, SystemSettings } from '../../../shared/types.js';
import { sound } from '../utils/audio.js';

interface Props {
  profile: HunterProfile | null;
  onRefresh: () => void;
  onOpenAuth: () => void;
}

export const SettingsPage: React.FC<Props> = ({ profile, onRefresh, onOpenAuth }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile editable fields
  const [name, setName] = useState(profile?.name || '');
  const [title, setTitle] = useState(profile?.title || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setSaveSuccess(false);
    try {
      // 1. Save Settings
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      // 2. Save Profile info
      await fetch('/api/hunter/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, title, avatarUrl }),
      });

      sound.playQuestComplete();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading System parameters...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="system-panel" style={{ padding: '20px' }}>
        <h2 className="system-title-glow" style={{ fontSize: '1.3rem', margin: 0 }}>
          SYSTEM CORE CONFIGURATION
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Tune XP formulas, safe punishment policies, quiet hours schedules, and hunter identity.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Hunter Identity & Google Sync */}
        <div className="system-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--system-blue)', fontFamily: 'var(--font-mono)' }}>
              [HUNTER PROFILE IDENTIFICATION]
            </h3>
            <button
              type="button"
              onClick={onOpenAuth}
              className="btn-system-secondary"
              style={{ fontSize: '0.8rem' }}
            >
              ⚡ Google Sync Modal
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Hunter Call-Sign</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Title / Class</label>
              <input
                type="text"
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
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Avatar Image URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
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
        </div>

        {/* Configurable XP Formula */}
        <div className="system-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--gold-accent)', fontFamily: 'var(--font-mono)', marginBottom: '16px' }}>
            [CONFIGURABLE XP & LEVEL FORMULA]
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Progression Formula Type</label>
              <select
                value={settings.levelFormula.formulaType}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    levelFormula: { ...settings.levelFormula, formulaType: e.target.value as any },
                  })
                }
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
                <option value="POLYNOMIAL">Polynomial (Base * L^exp + Linear * L)</option>
                <option value="EXPONENTIAL">Exponential (Base * exp^(L-1))</option>
                <option value="LINEAR">Linear (Base * L + Linear)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Base XP</label>
              <input
                type="number"
                value={settings.levelFormula.baseXP}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    levelFormula: { ...settings.levelFormula, baseXP: Number(e.target.value) },
                  })
                }
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
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Exponent / Multiplier</label>
              <input
                type="number"
                step="0.1"
                value={settings.levelFormula.exponent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    levelFormula: { ...settings.levelFormula, exponent: Number(e.target.value) },
                  })
                }
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
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>AP Awarded Per Level Up</label>
              <input
                type="number"
                value={settings.levelFormula.statPointsPerLevel}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    levelFormula: { ...settings.levelFormula, statPointsPerLevel: Number(e.target.value) },
                  })
                }
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
        </div>

        {/* Safe Punishment Pool */}
        <div className="system-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--crimson-danger)', fontFamily: 'var(--font-mono)', marginBottom: '8px' }}>
            [SAFE DISCIPLINE & PUNISHMENT POOL]
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Configure permitted safe penalties when mandatory quests are missed. Harmful actions are strictly prohibited in System Core.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.safePunishmentPool.allowRecoveryTask}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    safePunishmentPool: { ...settings.safePunishmentPool, allowRecoveryTask: e.target.checked },
                  })
                }
              />
              <span>Allow Safe Recovery Protocol Task (Desk tidy / posture reset)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.safePunishmentPool.allowEntertainmentLockout}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    safePunishmentPool: { ...settings.safePunishmentPool, allowEntertainmentLockout: e.target.checked },
                  })
                }
              />
              <span>Allow 2-Hour Entertainment & Gaming Lockout Debuff</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.safePunishmentPool.allowXPDeduction}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    safePunishmentPool: { ...settings.safePunishmentPool, allowXPDeduction: e.target.checked },
                  })
                }
              />
              <span>Allow Minor XP Deduction Penalty (capped, no level de-ranking)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.safePunishmentPool.allowRewardClaimDelay}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    safePunishmentPool: { ...settings.safePunishmentPool, allowRewardClaimDelay: e.target.checked },
                  })
                }
              />
              <span>Allow Temporary Reward Claiming Delay</span>
            </label>
          </div>
        </div>

        {/* Quiet Hours Configuration */}
        <div className="system-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--monarch-purple)', fontFamily: 'var(--font-mono)', marginBottom: '16px' }}>
            [QUIET HOURS & AUDIO]
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.quietHours.enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    quietHours: { ...settings.quietHours, enabled: e.target.checked },
                  })
                }
              />
              <span>Enable Quiet Hours</span>
            </label>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Start Hour (24h format)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={settings.quietHours.startHour}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    quietHours: { ...settings.quietHours, startHour: Number(e.target.value) },
                  })
                }
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
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>End Hour (24h format)</label>
              <input
                type="number"
                min="0"
                max="23"
                value={settings.quietHours.endHour}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    quietHours: { ...settings.quietHours, endHour: Number(e.target.value) },
                  })
                }
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
        </div>

        {/* Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
          {saveSuccess && (
            <span style={{ color: 'var(--emerald-success)', fontSize: '0.85rem', fontWeight: 600 }}>
              ✓ System Parameters Persisted!
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="btn-system"
            style={{ padding: '10px 24px', fontSize: '0.95rem' }}
          >
            {saving ? 'Saving...' : 'Inscribe Settings into Core ✓'}
          </button>
        </div>

      </form>

    </div>
  );
};
