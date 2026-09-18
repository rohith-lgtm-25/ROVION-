import React, { useState } from 'react';
import type { HunterProfile } from '../../../shared/types.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: HunterProfile | null;
  onProfileSynced: (updated: HunterProfile) => void;
}

export const GoogleAuthModal: React.FC<Props> = ({ isOpen, onClose, profile, onProfileSynced }) => {
  const [loading, setLoading] = useState(false);
  const [customName, setCustomName] = useState(profile?.name || '');
  const [customEmail, setCustomEmail] = useState(profile?.email || '');

  if (!isOpen) return null;

  const handleGoogleSignIn = async (presetUser?: { name: string; email: string; avatarUrl: string }) => {
    setLoading(true);
    try {
      const payload = presetUser || {
        name: customName || 'Sung Jin-Woo (Player)',
        email: customEmail || 'hunter.awakening@gmail.com',
        avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
      };

      const res = await fetch('/api/auth/google-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        onProfileSynced(data.profile);
        onClose();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error('Google Sign-In failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20000,
      padding: '20px',
    }}>
      <div className="system-panel" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '32px',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 0 40px rgba(0, 210, 255, 0.25)',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '1.2rem',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>

        {/* System Emblem */}
        <div style={{
          width: '56px',
          height: '56px',
          margin: '0 auto 16px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.2), rgba(157, 78, 221, 0.2))',
          border: '1px solid var(--system-blue)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          boxShadow: '0 0 20px var(--system-blue-glow)',
        }}>
          ⚡
        </div>

        <h2 className="system-title-glow" style={{ fontSize: '1.4rem', marginBottom: '8px' }}>
          HUNTER AWAKENING PROTOCOL
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Authenticate with Google to synchronize your Hunter Identity and progression save state.
        </p>

        {/* Google Official Button */}
        <button
          onClick={() => handleGoogleSignIn()}
          disabled={loading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '12px 20px',
            backgroundColor: '#ffffff',
            color: '#1f2937',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.95rem',
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            marginBottom: '20px',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
        >
          {/* Google SVG Logo */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {loading ? 'Authenticating...' : 'Continue with Google'}
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          margin: '16px 0',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span>OR CUSTOM HUNTER IDENTIFIER</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hunter Call-Sign</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Sung Jin-Woo"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.85rem',
                marginTop: '4px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Google Email</label>
            <input
              type="email"
              value={customEmail}
              onChange={(e) => setCustomEmail(e.target.value)}
              placeholder="e.g. hunter@gmail.com"
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.85rem',
                marginTop: '4px',
              }}
            />
          </div>

          <button
            onClick={() => handleGoogleSignIn()}
            className="btn-system"
            style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
          >
            Awaken / Synchronize
          </button>
        </div>
      </div>
    </div>
  );
};
