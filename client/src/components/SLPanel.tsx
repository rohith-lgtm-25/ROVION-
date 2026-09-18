import React from 'react';

interface SLPanelProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/** Wraps children in a Solo Leveling–style panel with 4-corner bracket decorations */
export const SLPanel: React.FC<SLPanelProps> = ({ children, className = '', style, title }) => (
  <div className={`sl-panel ${className}`} style={{ position: 'relative', ...style }}>
    {/* Corner brackets */}
    <span className="sl-corner-tr" />
    <span className="sl-corner-bl" />
    <span className="sl-corner-br" />
    {title && <div className="sl-panel-title">{title}</div>}
    {children}
  </div>
);
