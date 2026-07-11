// ─── Dashboard top header bar ─────────────────────────────────
// Renders logo, repo info pills, theme toggle, GitHub link, and re-analyze button.

import { Github, GitBranch, RefreshCw, MessageSquare, Settings } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function DashboardHeader({
  theme, onToggleTheme,
  repository,
  branches,
  onSwitchBranch,
  isLoading,
  onReAnalyze,
  onLogoClick,
  isChatOpen,
  onToggleChat,
  onOpenSettings,
  user,
  onLogout,
  onOpenCheckout,
}) {
  return (
    <header className="header-bar">
      {/* ── Left: Logo + repo breadcrumb + stat pills ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Logo / back to landing */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          onClick={onLogoClick}
          title="Back to home"
        >
          <span style={{ fontSize: 18 }}>🕸️</span>
          <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--text-primary)' }}>
            Repo
            <span style={{
              background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Graph</span>
          </span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: 'var(--border-glass)' }} />

        {/* owner / repo name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{repository.owner}</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-secondary)' }}>{repository.name}</span>
        </div>

        {/* Stat pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 100,
            background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)',
            color: '#a78bfa', fontWeight: 600,
          }}>
            {repository.totalFiles} files
          </span>
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 100,
            background: 'rgba(6,182,212,0.09)', border: '1px solid rgba(6,182,212,0.2)',
            color: '#67e8f9', fontWeight: 600,
          }}>
            {(repository.totalLinesOfCode || 0).toLocaleString()} loc
          </span>
        </div>
      </div>

      {/* ── Right: controls ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ 
          fontSize: 12, 
          color: 'var(--text-secondary)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 6,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border-glass)',
          borderRadius: 7,
          padding: '3px 8px 3px 6px',
        }}>
          <GitBranch size={12} style={{ color: 'var(--color-secondary)' }} />
          <select
            value={repository.branch || 'main'}
            onChange={(e) => onSwitchBranch(e.target.value)}
            disabled={isLoading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'inherit',
              outline: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {branches && branches.map((b) => (
              <option key={b} value={b} style={{ background: 'var(--graph-bg)', color: 'var(--text-primary)' }}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {user && (
          <>
            {/* Credit Indicator */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, color: 'var(--text-primary)',
              background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: 7, padding: '4px 10px',
            }}>
              <span style={{ fontWeight: 'bold', fontSize: 10.5 }}>⚡ Credits: {user.credits ?? 0}</span>
              <button
                onClick={onOpenCheckout}
                style={{
                  background: 'var(--color-secondary)', border: 'none',
                  color: '#080721', fontSize: 8.5, fontWeight: '800',
                  padding: '2px 6px', borderRadius: 4, cursor: 'pointer',
                  transition: 'opacity 0.18s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Buy
              </button>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 11, color: 'var(--text-secondary)',
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)',
              borderRadius: 7, padding: '4px 10px',
            }}>
              <span style={{ fontSize: 10.5 }}>👤 {user.email}</span>
              <div style={{ width: 1, height: 12, background: 'var(--border-glass)' }} />
              <button
                onClick={onLogout}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  color: '#fca5a5', fontSize: 10.5, fontWeight: 600,
                  cursor: 'pointer', textDecoration: 'underline'
                }}
              >
                Log Out
              </button>
            </div>
          </>
        )}

        <ThemeToggle theme={theme} onToggle={onToggleTheme} />

        <button
          onClick={onOpenSettings}
          title="API Keys Settings"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '26px', height: '26px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)',
            borderRadius: '7px', color: 'var(--text-secondary)',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-glass)'; }}
        >
          <Settings size={12} />
        </button>

        <button
          onClick={onToggleChat}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px',
            background: isChatOpen ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isChatOpen ? 'rgba(6,182,212,0.3)' : 'var(--border-glass)'}`,
            borderRadius: 7, fontSize: 12,
            color: isChatOpen ? 'var(--color-secondary)' : 'var(--text-secondary)',
            fontWeight: isChatOpen ? 600 : 400,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            if (!isChatOpen) {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
            }
          }}
          onMouseLeave={e => {
            if (!isChatOpen) {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-glass)';
            }
          }}
        >
          <MessageSquare size={12} />
          {isChatOpen ? 'Hide Chat' : 'Chat'}
        </button>

        <a
          href={repository.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)',
            borderRadius: 7, fontSize: 12, color: 'var(--text-secondary)',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-glass)'; }}
        >
          <Github size={12} /> GitHub
        </a>

        <button
          onClick={onReAnalyze}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px',
            background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.22)',
            borderRadius: 7, fontSize: 12, color: '#a78bfa',
            fontWeight: 600, cursor: 'pointer', transition: 'background 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.22)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; }}
        >
          <RefreshCw size={11} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          Re-Analyze
        </button>
      </div>
    </header>
  );
}
