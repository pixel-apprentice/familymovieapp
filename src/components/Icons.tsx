import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const StarIcon: React.FC<{ filled: boolean, onClick?: () => void, className?: string }> = ({ filled, onClick, className = '' }) => {
  const { theme } = useTheme();

  if (theme === '8-bit-arcade') {
    return (
      <svg onClick={onClick} className={`w-6 h-6 cursor-pointer transition-transform hover:scale-110 ${filled ? 'text-theme-primary' : 'text-theme-muted'} ${className}`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" />
      </svg>
    );
  }

  if (theme === 'enchanted-library') {
    return (
      <svg onClick={onClick} className={`w-6 h-6 cursor-pointer transition-transform hover:scale-110 ${filled ? 'text-theme-accent' : 'text-theme-muted'} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill={filled ? 'currentColor' : 'none'} />
      </svg>
    );
  }

  return (
    <svg onClick={onClick} className={`w-6 h-6 cursor-pointer transition-transform hover:scale-110 ${filled ? 'text-theme-primary' : 'text-theme-muted'} ${className}`} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
};

export const ThemeIcon: React.FC<{ themeName: string, className?: string }> = ({ themeName, className = '' }) => {
  switch (themeName) {
    case 'midnight-minimalist':
      return <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20z"/></svg>;
    case 'cyber-command':
      return <svg className={`w-5 h-5 animate-radar ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 12L22 12"/></svg>;
    case 'galactic-glow':
      return <svg className={`w-5 h-5 animate-twinkle ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></svg>;
    case 'golden-marquee':
      return <svg className={`w-5 h-5 animate-chase ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/></svg>;
    case '8-bit-arcade':
      return <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4M8 10v4M16 12h.01M18 10h.01"/></svg>;
    case 'enchanted-library':
      return <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
    default:
      return null;
  }
};

