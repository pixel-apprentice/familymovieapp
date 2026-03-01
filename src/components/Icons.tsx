import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const StarIcon: React.FC<{ filled: boolean, onClick?: () => void, className?: string }> = ({ filled, onClick, className = '' }) => {
  const { theme } = useTheme();

  if (theme === 'neon-cyberpunk') {
    return (
      <svg onClick={onClick} className={`w-6 h-6 cursor-pointer transition-transform hover:scale-110 ${filled ? 'text-theme-primary drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' : 'text-theme-muted'} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill={filled ? 'currentColor' : 'none'} />
      </svg>
    );
  }

  if (theme === 'vintage-ticket') {
    return (
      <svg onClick={onClick} className={`w-6 h-6 cursor-pointer transition-transform hover:scale-110 ${filled ? 'text-theme-primary' : 'text-theme-muted'} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    case 'modern-pinnacle':
      return <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></svg>;
    case 'modern-luminous':
      return <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>;
    case 'midnight-cinema':
      return <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20z"/></svg>;
    case 'vintage-ticket':
      return <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 12h.01M21 12h.01"/></svg>;
    case 'neon-cyberpunk':
      return <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case 'minimalist-studio':
      return <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>;
    case 'velvet-theater':
      return <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20h20M5 20V4l7 4 7-4v16"/></svg>;
    case 'sci-fi-hologram':
      return <svg className={`w-5 h-5 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20M12 12l7.07 7.07M12 12L4.93 4.93"/></svg>;
    default:
      return null;
  }
};

