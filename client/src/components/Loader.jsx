import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Loader2, GitBranch, Cpu, Database, Network, Braces, Box, Sparkles } from 'lucide-react';

const STEPS = [
  { label: 'Accessing public repository URL',     icon: GitBranch, color: '#7c3aed' },
  { label: 'Performing shallow Git clone',         icon: Box,       color: '#06b6d4' },
  { label: 'Recursively parsing directory files',  icon: Braces,    color: '#7c3aed' },
  { label: 'Analyzing imports & dependency links', icon: Network,   color: '#f43f5e' },
  { label: 'Running LangChain LLM overview',       icon: Cpu,       color: '#06b6d4' },
  { label: 'Generating per-file AI summaries',     icon: Sparkles,  color: '#f59e0b' },
  { label: 'Indexing snippets into vector DB',     icon: Database,  color: '#10b981' },
  { label: 'Finalizing graph visualization',       icon: Network,   color: '#7c3aed' },
];

// Extract repo name from URL
function repoName(url) {
  if (!url) return '';
  const parts = url.replace(/\/$/, '').split('/');
  if (parts.length >= 2) return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  return url;
}

export default function Loader({ gitUrl }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots]               = useState('');

  // Simulate step progression
  useEffect(() => {
    const iv = setInterval(() => {
      setCurrentStep(prev => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 3800);
    return () => clearInterval(iv);
  }, []);

  // Animated ellipsis for the active step
  useEffect(() => {
    const iv = setInterval(() => {
      setDots(d => (d.length >= 3 ? '' : d + '.'));
    }, 420);
    return () => clearInterval(iv);
  }, []);

  const pct = Math.round(((currentStep + 1) / STEPS.length) * 100);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'var(--bg-darker)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>

      {/* Background glows */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 70% 55% at 20% 30%, rgba(124,58,237,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 80% 70%, rgba(6,182,212,0.07) 0%, transparent 60%)
        `,
      }} />

      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, var(--graph-dot) 1.5px, transparent 1.5px)',
        backgroundSize: '36px 36px',
      }} />

      {/* Main card */}
      <div 
        className="loader-card"
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 560,
          margin: '0 24px',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(28px)',
          border: '1px solid var(--border-glass)',
          borderRadius: 24,
          padding: '40px 36px 32px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.45), 0 0 60px rgba(124,58,237,0.05)',
          transition: 'all 0.3s ease',
        }}
      >

        {/* Top spinner + brand */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, marginBottom: 32 }}>
          {/* Orbital rings */}
          <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
            {/* Outer ring */}
            <div style={{
              position: 'absolute', inset: 0,
              border: '2px solid var(--border-glass)',
              borderRadius: '50%',
            }} />
            {/* Spinning ring 1 */}
            <div style={{
              position: 'absolute', inset: 0,
              border: '2px solid transparent',
              borderTopColor: '#7c3aed',
              borderRadius: '50%',
              animation: 'spin 1.2s linear infinite',
            }} />
            {/* Spinning ring 2 (reverse) */}
            <div style={{
              position: 'absolute', inset: 8,
              border: '2px solid transparent',
              borderBottomColor: '#06b6d4',
              borderRadius: '50%',
              animation: 'spin 1.8s linear infinite reverse',
            }} />
            {/* Spinning ring 3 */}
            <div style={{
              position: 'absolute', inset: 16,
              border: '1.5px solid transparent',
              borderLeftColor: '#f43f5e',
              borderRadius: '50%',
              animation: 'spin 2.4s linear infinite',
            }} />
            {/* Center icon */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>🕸️</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontFamily: 'Outfit,sans-serif', fontWeight: 800, fontSize: 24,
              color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0,
            }}>
              Analyzing Repository
            </h2>
            {gitUrl && (
              <div style={{
                marginTop: 8, fontSize: 12, color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}>
                <GitBranch size={11} style={{ color: 'var(--color-primary)' }} />
                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{repoName(gitUrl)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Progress</span>
            <span style={{
              fontWeight: 700, fontFamily: 'Outfit,sans-serif',
              color: pct === 100 ? 'var(--color-success)' : 'var(--color-secondary)',
              fontSize: 12,
            }}>{pct}%</span>
          </div>
          <div style={{
            height: 5, borderRadius: 10,
            background: 'var(--border-glass)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 10,
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
              transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '0 0 10px rgba(6,182,212,0.3)',
            }} />
          </div>
        </div>

        {/* Steps list */}
        <div style={{
          background: 'rgba(0,0,0,0.03)',
          border: '1px solid var(--border-glass)',
          borderRadius: 14, padding: '4px 0',
          marginBottom: 20,
        }}>
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isActive    = idx === currentStep;
            const isPending   = idx > currentStep;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 16px',
                  borderRadius: 10,
                  background: isActive ? `${step.color}0d` : 'transparent',
                  borderLeft: isActive ? `3px solid ${step.color}` : '3px solid transparent',
                  transition: 'all 0.3s ease',
                  opacity: isPending ? 0.38 : 1,
                }}
              >
                {/* Icon/state */}
                <div style={{ flexShrink: 0 }}>
                  {isCompleted ? (
                    <CheckCircle2 size={15} style={{ color: 'var(--color-success)' }} />
                  ) : isActive ? (
                    <Loader2 size={15} style={{
                      color: step.color,
                      animation: 'spin 1s linear infinite',
                    }} />
                  ) : (
                    <Circle size={15} style={{ color: 'var(--text-muted)' }} />
                  )}
                </div>

                {/* Step icon */}
                <div style={{
                  width: 26, height: 26, borderRadius: 7,
                  background: isActive ? `${step.color}1a` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? step.color + '30' : 'var(--border-glass)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all 0.3s',
                }}>
                  <step.icon size={13} style={{
                    color: isActive ? step.color : isCompleted ? 'var(--color-success)' : 'var(--text-muted)',
                  }} />
                </div>

                {/* Label */}
                <span style={{
                  fontSize: 12, fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--text-primary)'
                       : isCompleted ? 'var(--text-secondary)'
                       : 'var(--text-muted)',
                  letterSpacing: '-0.01em',
                  flex: 1,
                }}>
                  {step.label}{isActive ? dots : ''}
                </span>

                {/* Completed badge */}
                {isCompleted && (
                  <span style={{
                    fontSize: 9, padding: '1px 6px', borderRadius: 5,
                    background: 'rgba(16,185,129,0.12)', color: 'var(--color-success)',
                    fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0,
                  }}>DONE</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p style={{
          fontSize: 11, color: 'var(--text-muted)', textAlign: 'center',
          lineHeight: 1.6, margin: 0,
        }}>
          ⏱ Initial analysis can take <strong style={{ color: 'var(--text-secondary)' }}>30–45s</strong> for large repos.
          &nbsp;Subsequent loads are <strong style={{ color: 'var(--color-success)' }}>instant</strong>.
        </p>
      </div>

      {/* Bottom branding */}
      <div style={{
        position: 'relative', zIndex: 1, marginTop: 20,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: 15 }}>🕸️</span>
        <span style={{ fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--text-muted)' }}>
          Repo<span style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Graph</span>
        </span>
      </div>
    </div>
  );
}
