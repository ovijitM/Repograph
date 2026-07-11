// ─── Landing / Home page ──────────────────────────────────────
// Renders the hero, URL input, feature cards, examples, and history.

import React, { useState } from 'react';
import {
  Github, Globe, FileCheck, Sparkles,
  Network, Cpu, MessageCircle, Zap, Settings, X
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

// ── Static data ────────────────────────────────────────────────
const FEATURES = [
  { icon: Network,       label: 'Dependency Graph', color: '#7c3aed',
    desc: 'Force-directed import network with live physics' },
  { icon: Cpu,           label: 'AI Analysis',      color: '#06b6d4',
    desc: 'LangChain RAG-powered architectural overview' },
  { icon: MessageCircle, label: 'Code Q&A',         color: '#f43f5e',
    desc: 'Ask questions about any file or module instantly' },
];

const EXAMPLES = [
  { name: 'expressjs/express',      url: 'https://github.com/expressjs/express',      tag: 'Node.js'  },
  { name: 'facebook/react',         url: 'https://github.com/facebook/react',         tag: 'Frontend' },
  { name: 'python-poetry/poetry',   url: 'https://github.com/python-poetry/poetry',   tag: 'Python'  },
];

// ── Sub-components ─────────────────────────────────────────────
function HeroBadge() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.28)',
      borderRadius: 100, padding: '5px 14px',
    }}>
      <Sparkles size={12} style={{ color: '#a78bfa' }} />
      <span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, letterSpacing: '0.07em' }}>
        AI-POWERED CODE INTELLIGENCE
      </span>
    </div>
  );
}

function FeatureCard({ icon: Icon, label, desc, color }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
        borderRadius: 14, padding: 16,
        display: 'flex', flexDirection: 'column', gap: 8,
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color + '40'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-glass)'; e.currentTarget.style.transform = ''; }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: color + '16', border: `1px solid ${color}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{label}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

function ExampleChip({ name, url, tag, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
        borderRadius: 9, padding: '7px 13px', fontSize: 12,
        color: 'var(--text-secondary)', cursor: 'pointer',
        transition: 'all 0.18s', fontFamily: 'Inter,sans-serif',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.12)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border-glass)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
    >
      <Github size={12} />
      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{name}</span>
      <span style={{
        fontSize: 10, padding: '2px 6px', borderRadius: 5,
        background: 'rgba(124,58,237,0.15)', color: '#a78bfa', fontWeight: 600,
      }}>{tag}</span>
    </button>
  );
}

function HistoryChip({ repo, onClick, onDelete }) {
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the analyzed repository "${repo.owner}/${repo.name}"?`)) {
      onDelete(repo._id);
    }
  };

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
        borderRadius: 7, padding: '5px 11px',
        fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer',
        transition: 'all 0.15s', fontFamily: 'Inter,sans-serif',
        position: 'relative'
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(6,182,212,0.08)'; e.currentTarget.style.borderColor = 'rgba(6,182,212,0.25)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border-glass)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
    >
      <span>🕸</span>
      <span>{repo.owner}/{repo.name}</span>
      <button
        onClick={handleDelete}
        style={{
          background: 'none',
          border: 'none',
          padding: '2px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255, 255, 255, 0.3)',
          borderRadius: '4px',
          marginLeft: '4px',
          transition: 'all 0.15s'
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.3)'; e.currentTarget.style.background = 'none'; }}
      >
        <X size={10} />
      </button>
    </div>
  );
}

// ── Main LandingPage component ─────────────────────────────────
export default function LandingPage({
  theme, onToggleTheme,
  historyRepos,
  onAnalyze,           // fn(url: string) => void
  onLoadFromHistory,   // fn(repoId: string) => void
  onDeleteFromHistory, // fn(repoId: string) => void
  errorMsg,
  onOpenSettings,
  user,
  onLogout,
  onOpenCheckout,
}) {
  const [gitUrl, setGitUrl]           = useState('');
  const [forceRefresh, setForceRefresh] = useState(false);

  const submit = (url = gitUrl) => onAnalyze(url, forceRefresh);

  return (
    <>
      <div className="landing-bg" />
      <div className="landing-grid-overlay" />

      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh', height: 'auto', width: '100vw',
        overflow: 'auto',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px',
      }}>
        {/* Top bar controls */}
        <div className="landing-top-bar">
          {user && (
            <>
              {/* Credit Indicator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                color: 'var(--text-primary)',
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: 8,
                padding: '6px 12px',
                height: 32,
              }}>
                <span style={{ fontWeight: 'bold' }}>⚡ Credits: {user.credits ?? 0}</span>
                <button
                  onClick={onOpenCheckout}
                  style={{
                    background: 'var(--color-secondary)',
                    border: 'none',
                    color: '#080721',
                    fontSize: 9,
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    transition: 'all 0.18s',
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
                borderRadius: 8, padding: '6px 12px', height: 32,
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

          <button
            onClick={onOpenSettings}
            title="API Keys Settings"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)',
              borderRadius: '9px', color: 'var(--text-secondary)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-glass)'; }}
          >
            <Settings size={14} />
          </button>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>

        <div style={{ width: '100%', maxWidth: 820, display: 'flex', flexDirection: 'column', gap: 36 }}
          className="fade-up">

          {/* ── Hero heading ── */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <HeroBadge />
            <h1 style={{
              fontSize: 'clamp(40px,6vw,68px)', fontWeight: 800,
              lineHeight: 1.05, letterSpacing: '-0.03em',
              color: 'var(--text-primary)', fontFamily: 'Outfit,sans-serif', margin: 0,
            }}>
              Repo
              <span style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>Graph</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 500, lineHeight: 1.65, margin: 0 }}>
              Drop any public GitHub repository and explore its architecture
              as an interactive force-directed graph — powered by LangChain AI.
            </p>
          </div>

          {/* ── URL input card ── */}
          <div style={{
            background: 'var(--bg-card)', backdropFilter: 'blur(24px)',
            border: '1px solid rgba(6,182,212,0.18)', borderRadius: 20,
            padding: '26px 28px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 0 40px rgba(124,58,237,0.07)',
          }}>
            <div className="url-input-container">
              <div style={{ flex: 1, position: 'relative' }}>
                <Globe size={15} style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)', pointerEvents: 'none',
                }} />
                <input
                  type="text"
                  placeholder="https://github.com/username/repository"
                  value={gitUrl}
                  onChange={e => setGitUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && submit()}
                  style={{
                    width: '100%', height: 50, paddingLeft: 40, paddingRight: 14,
                    background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                    borderRadius: 11, color: 'var(--text-primary)', fontSize: 14,
                    fontFamily: 'Inter,sans-serif',
                  }}
                />
              </div>
              <button
                onClick={() => submit()}
                className="btn-primary"
                style={{
                  height: 50, padding: '0 24px', borderRadius: 11,
                  display: 'flex', alignItems: 'center', gap: 7,
                  fontSize: 14, fontWeight: 600, flexShrink: 0,
                }}
              >
                <Zap size={15} /> Visualize
              </button>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={forceRefresh}
                onChange={e => setForceRefresh(e.target.checked)}
              />
              Force re-analyze (bypass cached results)
            </label>

            {errorMsg && (
              <div style={{
                marginTop: 12, fontSize: 12, color: '#fca5a5',
                background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
                borderRadius: 9, padding: '9px 13px',
              }}>
                ⚠️ {errorMsg}
              </div>
            )}
          </div>

          {/* ── Feature cards ── */}
          <div className="features-grid">
            {FEATURES.map(f => <FeatureCard key={f.label} {...f} />)}
          </div>

          {/* ── Example repos ── */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Try an example
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {EXAMPLES.map(ex => (
                <ExampleChip key={ex.name} {...ex} onClick={() => submit(ex.url)} />
              ))}
            </div>
          </div>

          {/* ── Recent repos history ── */}
          {historyRepos.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
                <FileCheck size={11} style={{ color: '#10b981' }} />
                Recent Repositories
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, maxHeight: 130, overflowY: 'auto' }}>
                {historyRepos.map(repo => (
                  <HistoryChip 
                    key={repo._id} 
                    repo={repo} 
                    onClick={() => onLoadFromHistory(repo._id)} 
                    onDelete={onDeleteFromHistory}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
