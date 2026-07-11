import React from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={onToggle}
      title={isDark ? 'Switch to Day Mode' : 'Switch to Dark Mode'}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: 52,
        height: 28,
        borderRadius: 100,
        padding: 3,
        background: isDark
          ? 'rgba(124,58,237,0.15)'
          : 'rgba(14,165,233,0.15)',
        border: isDark
          ? '1px solid rgba(124,58,237,0.3)'
          : '1px solid rgba(14,165,233,0.3)',
        cursor: 'pointer',
        transition: 'background 0.25s, border-color 0.25s',
        flexShrink: 0,
      }}
      aria-label={isDark ? 'Switch to day mode' : 'Switch to dark mode'}
    >
      {/* Track icons */}
      <Moon size={10} style={{
        position: 'absolute', left: 6,
        color: isDark ? '#a78bfa' : 'rgba(100,116,139,0.3)',
        transition: 'color 0.25s',
      }} />
      <Sun size={10} style={{
        position: 'absolute', right: 6,
        color: isDark ? 'rgba(100,116,139,0.3)' : '#0ea5e9',
        transition: 'color 0.25s',
      }} />

      {/* Thumb */}
      <div style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: isDark
          ? 'linear-gradient(135deg, #7c3aed, #a78bfa)'
          : 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
        boxShadow: isDark
          ? '0 0 8px rgba(124,58,237,0.6)'
          : '0 0 8px rgba(14,165,233,0.6)',
        transform: isDark ? 'translateX(0)' : 'translateX(24px)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), background 0.25s, box-shadow 0.25s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {isDark
          ? <Moon size={11} style={{ color: '#fff' }} />
          : <Sun size={11} style={{ color: '#fff' }} />
        }
      </div>
    </button>
  );
}
