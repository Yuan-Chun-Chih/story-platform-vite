import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  active?: boolean;
  style?: React.CSSProperties;
}

const GlassCard = ({ children, className = '', onClick, active = false, style = {} }: GlassCardProps) => (
  <div 
    onClick={onClick}
    style={style}
    className={`
      relative backdrop-blur-md border border-white/10 shadow-lg rounded-xl transition-all duration-300 overflow-hidden
      ${active ? 'bg-white/15 border-yellow-400/50 shadow-yellow-400/20' : 'bg-white/5 hover:bg-white/10 hover:border-white/20'}
      ${className}
    `}
  >
    {children}
  </div>
);

export default GlassCard;
