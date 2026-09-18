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
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

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
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div style={{ fontFamily: 'var(--font-hud)', fontSize: '0.8rem', letterSpacing: '4px', color: 'var(--text-muted)' }}>
          [ LOADING SYSTEM PARAMETERS... ]
        </div>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(0, 10, 25, 0.8)',
    border: '1px solid var(--border-cyan)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.95rem',
    padding: '10px 14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    marginTop: '6px',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none' as const,
    cursor: 'pointer',
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='%2300d4ff'%3E%3Cpath d='M0 0l5 6 5-6z'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    backgroundAttachment: 'initial',
    backgroundColor: 'rgba(0, 10, 25, 0.8)',
    paddingRight: '30px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="sl-panel" style={{ padding: '20px 24px' }}>
        <div className="sl-corner-tr" /><div className="sl-corner-bl" /><div className="sl-corner-br" />
        <div className="sl-panel-title" style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, fontSize: '0.8rem' }}>
          ◆ SYSTEM CORE CONFIGURATION ◆
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px', fontFamily: 'var(--font-body)' }}>
          Tune XP formulas, safe punishment policies, quiet hours schedules, and hunter identity.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Hunter Identity & Google Sync */}
        <div className="sl-panel" style={{ padding: '24px' }}>
          <div className="sl-corner-tr" /><div className="sl-corner-bl" /><div className="sl-corner-br" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div className="sl-panel-label">[ HUNTER PROFILE IDENTIFICATION ]</div>
            <button
              type="button"
              onClick={onOpenAuth}
              className="sl-btn sl-btn-ghost"
              style={{ fontSize: '0.68rem' }}
            >
              ⚡ GOOGLE SYNC
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <div>
              <label className="sl-label">Hunter Call-Sign</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="sl-input"
              />
            </div>

            <div>
              <label className="sl-label">Title / Class</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="sl-input"
              />
            </div>

            <div>
              <label className="sl-label">Avatar Image URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="sl-input"
              />
            </div>
          </div>
        </div>

        {/* Configurable XP Formula */}
        <div className="sl-panel" style={{ padding: '24px' }}>
          <div className="sl-corner-tr" /><div className="sl-corner-bl" /><div className="sl-corner-br" />
          <div className="sl-panel-label" style={{ color: 'var(--gold)', marginBottom: '20px' }}>
            [ CONFIGURABLE XP & LEVEL FORMULA ]
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label className="sl-label">Progression Formula Type</label>
              <select
                value={settings.levelFormula.formulaType}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    levelFormula: { ...settings.levelFormula, formulaType: e.target.value as any },
                  })
                }
                className="sl-select"
              >
                <option value="POLYNOMIAL">Polynomial (Base * L^exp + Linear * L)</option>
                <option value="EXPONENTIAL">Exponential (Base * exp^(L-1))</option>
                <option value="LINEAR">Linear (Base * L + Linear)</option>
              </select>
            </div>

            <div>
              <label className="sl-label">Base XP</label>
              <input
                type="number"
                value={settings.levelFormula.baseXP}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    levelFormula: { ...settings.levelFormula, baseXP: Number(e.target.value) },
                  })
                }
                className="sl-input"
              />
            </div>

            <div>
              <label className="sl-label">Exponent / Multiplier</label>
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
                className="sl-input"
              />
            </div>

            <div>
              <label className="sl-label">AP Awarded Per Level Up</label>
              <input
                type="number"
                value={settings.levelFormula.statPointsPerLevel}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    levelFormula: { ...settings.levelFormula, statPointsPerLevel: Number(e.target.value) },
                  })
                }
                className="sl-input"
              />
            </div>
          </div>
        </div>

        {/* Safe Punishment Pool */}
        <div className="sl-panel" style={{ padding: '24px' }}>
          <div className="sl-corner-tr" /><div className="sl-corner-bl" /><div className="sl-corner-br" />
          <div className="sl-panel-label" style={{ color: 'var(--crimson)', marginBottom: '8px' }}>
            [ SAFE DISCIPLINE & PUNISHMENT POOL ]
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px', fontFamily: 'var(--font-body)' }}>
            Configure permitted safe penalties when mandatory quests are missed. Harmful actions are strictly prohibited.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {[
              { key: 'allowRecoveryTask' as const, label: 'Allow Safe Recovery Protocol Task (Desk tidy / posture reset)' },
              { key: 'allowEntertainmentLockout' as const, label: 'Allow 2-Hour Entertainment & Gaming Lockout Debuff' },
              { key: 'allowXPDeduction' as const, label: 'Allow Minor XP Deduction Penalty (capped, no level de-ranking)' },
              { key: 'allowRewardClaimDelay' as const, label: 'Allow Temporary Reward Claiming Delay' },
            ].map(({ key, label }) => (
              <label
                key={key}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}
              >
                <div
                  onClick={() =>
                    setSettings({
                      ...settings,
                      safePunishmentPool: { ...settings.safePunishmentPool, [key]: !settings.safePunishmentPool[key] },
                    })
                  }
                  className={`sl-checkbox ${settings.safePunishmentPool[key] ? 'checked' : ''}`}
                  style={{ cursor: 'pointer', flexShrink: 0 }}
                />
                <span onClick={() =>
                    setSettings({
                      ...settings,
                      safePunishmentPool: { ...settings.safePunishmentPool, [key]: !settings.safePunishmentPool[key] },
                    })
                  }
                >
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Quiet Hours Configuration */}
        <div className="sl-panel" style={{ padding: '24px' }}>
          <div className="sl-corner-tr" /><div className="sl-corner-bl" /><div className="sl-corner-br" />
          <div className="sl-panel-label" style={{ color: '#cc88ff', marginBottom: '20px' }}>
            [ QUIET HOURS & AUDIO ]
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'var(--font-body)', color: 'var(--text-secondary)' }}>
              <div
                onClick={() =>
                  setSettings({
                    ...settings,
                    quietHours: { ...settings.quietHours, enabled: !settings.quietHours.enabled },
                  })
                }
                className={`sl-checkbox ${settings.quietHours.enabled ? 'checked' : ''}`}
                style={{ cursor: 'pointer', flexShrink: 0 }}
              />
              <span onClick={() =>
                  setSettings({
                    ...settings,
                    quietHours: { ...settings.quietHours, enabled: !settings.quietHours.enabled },
                  })
                }
              >
                Enable Quiet Hours
              </span>
            </label>

            <div>
              <label className="sl-label">Start Hour (24h format)</label>
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
                className="sl-input"
              />
            </div>

            <div>
              <label className="sl-label">End Hour (24h format)</label>
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
                className="sl-input"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
          {saveSuccess && (
            <span style={{ color: 'var(--green-neon)', fontSize: '0.78rem', fontFamily: 'var(--font-hud)', letterSpacing: '2px', textShadow: '0 0 8px var(--green-glow)' }}>
              ✓ SYSTEM PARAMETERS PERSISTED
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="sl-btn sl-btn-primary"
            style={{ padding: '12px 28px' }}
          >
            {saving ? 'SAVING...' : 'INSCRIBE SETTINGS ✓'}
          </button>
        </div>

      </form>

    </div>
  );
};
