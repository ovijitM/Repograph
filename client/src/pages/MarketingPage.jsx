import React, { useState, useEffect } from 'react';
import { ArrowRight, Code, Shield, Sparkles, Network, HelpCircle, Key } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

export default function MarketingPage({ theme, onToggleTheme, onGetStarted }) {
  const isDark = theme === 'dark';

  // ── Fake Interactive Demo Animation Loop ────────────────
  const [demoStep, setDemoStep] = useState(0); // 0: Idle, 1: Hover File, 2: Click File, 3: Hover Input 1, 4: Type Chat 1, 5: AI Loading 1, 6: AI Reply 1, 7: Hover Input 2, 8: Type Chat 2, 9: AI Loading 2, 10: AI Reply 2, 11: Resetting
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    let timeouts = [];

    const runDemo = () => {
      // Step 0: Reset (0s)
      setDemoStep(0);
      setTypedText('');

      // Step 1: Hover File (1.5s)
      timeouts.push(setTimeout(() => {
        setDemoStep(1);
      }, 1500));

      // Step 2: Click File (2.8s)
      timeouts.push(setTimeout(() => {
        setDemoStep(2);
      }, 2800));

      // Step 3: Hover Chat Input 1 (4.2s)
      timeouts.push(setTimeout(() => {
        setDemoStep(3);
      }, 4200));

      // Step 4: Start Typing Chat 1 (5.4s)
      timeouts.push(setTimeout(() => {
        setDemoStep(4);

        // Typing effect loop 1
        const text = "Explain this codebase structure...";
        let currentIdx = 0;
        const typingInterval = setInterval(() => {
          if (currentIdx <= text.length) {
            setTypedText(text.substring(0, currentIdx));
            currentIdx++;
          } else {
            clearInterval(typingInterval);
          }
        }, 50);

        timeouts.push({ close: () => clearInterval(typingInterval) });
      }, 5400));

      // Step 5: AI Loading 1 (8.2s)
      timeouts.push(setTimeout(() => {
        setDemoStep(5);
      }, 8200));

      // Step 6: AI Reply 1 (9.4s)
      timeouts.push(setTimeout(() => {
        setDemoStep(6);
      }, 9400));

      // Step 7: Hover Chat Input 2 (13.0s)
      timeouts.push(setTimeout(() => {
        setDemoStep(7);
        setTypedText('');
      }, 13000));

      // Step 8: Start Typing Chat 2 (14.2s)
      timeouts.push(setTimeout(() => {
        setDemoStep(8);

        // Typing effect loop 2
        const text = "How are credits charged?";
        let currentIdx = 0;
        const typingInterval = setInterval(() => {
          if (currentIdx <= text.length) {
            setTypedText(text.substring(0, currentIdx));
            currentIdx++;
          } else {
            clearInterval(typingInterval);
          }
        }, 50);

        timeouts.push({ close: () => clearInterval(typingInterval) });
      }, 14200));

      // Step 9: AI Loading 2 (17.2s)
      timeouts.push(setTimeout(() => {
        setDemoStep(9);
      }, 17200));

      // Step 10: AI Reply 2 (18.4s)
      timeouts.push(setTimeout(() => {
        setDemoStep(10);
      }, 18400));

      // Step 11: Done/Hold and loop reset (23.5s)
      timeouts.push(setTimeout(() => {
        setDemoStep(11);
        setTimeout(runDemo, 800);
      }, 23500));
    };

    runDemo();

    return () => {
      timeouts.forEach(t => {
        if (t.close) t.close();
        else clearTimeout(t);
      });
    };
  }, []);

  const getCursorPos = () => {
    switch (demoStep) {
      case 0: return { left: '48%', top: '48%', scale: 1, clickRipple: false };
      case 1: return { left: '72px', top: '115px', scale: 1, clickRipple: false };
      case 2: return { left: '72px', top: '115px', scale: 0.85, clickRipple: true };
      case 3: return { left: '820px', top: '472px', scale: 1, clickRipple: false };
      case 4: return { left: '820px', top: '472px', scale: 0.85, clickRipple: true };
      case 5:
      case 6: return { left: '520px', top: '240px', scale: 1, clickRipple: false };
      case 7: return { left: '820px', top: '472px', scale: 1, clickRipple: false };
      case 8: return { left: '820px', top: '472px', scale: 0.85, clickRipple: true };
      case 9:
      case 10: return { left: '520px', top: '240px', scale: 1, clickRipple: false };
      case 11: return { left: '48%', top: '48%', scale: 1, clickRipple: false };
      default: return { left: '48%', top: '48%', scale: 1, clickRipple: false };
    }
  };
  const cursor = getCursorPos();

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: isDark ? 'var(--bg-darker)' : '#f4f6fa',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-body)',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      {/* Dynamic Ambient Background Glows */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '20%',
        width: '40vw',
        height: '40vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '10%',
        width: '50vw',
        height: '50vw',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <style>{`
        .btn-glow-primary {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
          color: white;
          border: none;
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.35);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-glow-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(124, 58, 237, 0.5);
          opacity: 0.95;
        }
        .btn-secondary-outline {
          background: transparent;
          border: 1px solid var(--border-glass-bright);
          color: var(--text-primary);
          transition: all 0.3s;
        }
        .btn-secondary-outline:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--color-secondary);
        }
        .feature-card {
          background: ${isDark ? 'rgba(15, 14, 38, 0.6)' : 'rgba(255, 255, 255, 0.7)'};
          border: 1px solid var(--border-glass);
          border-radius: 20px;
          padding: 24px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .feature-card:hover {
          transform: translateY(-4px);
          border-color: var(--border-glass-bright);
          box-shadow: 0 10px 30px rgba(6, 182, 212, 0.08);
        }
        .nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          transition: color 0.2s;
        }
        .nav-link:hover {
          color: var(--text-primary);
        }
        @keyframes float1 {
          0% { transform: translate(-50%, -50%) translate(0, 0); }
          50% { transform: translate(-50%, -50%) translate(6px, -8px); }
          100% { transform: translate(-50%, -50%) translate(0, 0); }
        }
        @keyframes float2 {
          0% { transform: translate(-50%, -50%) translate(0, 0); }
          50% { transform: translate(-50%, -50%) translate(-8px, 6px); }
          100% { transform: translate(-50%, -50%) translate(0, 0); }
        }
        @keyframes float3 {
          0% { transform: translate(-50%, -50%) translate(0, 0); }
          50% { transform: translate(-50%, -50%) translate(10px, 8px); }
          100% { transform: translate(-50%, -50%) translate(0, 0); }
        }
        @keyframes float4 {
          0% { transform: translate(-50%, -50%) translate(0, 0); }
          50% { transform: translate(-50%, -50%) translate(-6px, -6px); }
          100% { transform: translate(-50%, -50%) translate(0, 0); }
        }
        @keyframes float5 {
          0% { transform: translate(-50%, -50%) translate(0, 0); }
          50% { transform: translate(-50%, -50%) translate(8px, -4px); }
          100% { transform: translate(-50%, -50%) translate(0, 0); }
        }
        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.6); }
          70% { box-shadow: 0 0 0 10px rgba(244, 63, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0); }
        }
        @keyframes ripple {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes blink {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        @keyframes bubbleFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header / Navbar */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '70px',
        background: isDark ? 'rgba(3, 2, 14, 0.75)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        zIndex: 100
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={onGetStarted}>
          <span style={{ fontSize: '26px' }}>🕸️</span>
          <span style={{
            fontFamily: 'var(--font-title)',
            fontWeight: '900',
            fontSize: '20px',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(90deg, #ffffff 30%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: isDark ? 'transparent' : 'inherit'
          }}>
            Repo<span style={{ color: 'var(--color-secondary)' }}>Graph</span>
          </span>
        </div>

        {/* Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How it Works</a>
          <a href="#security" className="nav-link">Security</a>
        </nav>

        {/* Controls / CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            onClick={onGetStarted}
            className="btn-secondary-outline"
            style={{
              padding: '8px 18px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
          <button
            onClick={onGetStarted}
            className="btn-glow-primary"
            style={{
              padding: '8px 20px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: '160px 24px 80px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Decorative Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 14px',
          borderRadius: '100px',
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          color: 'var(--color-secondary)',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          marginBottom: '24px'
        }}>
          <Sparkles size={11} /> Next-Gen Codebase Intelligence
        </div>

        <h1 style={{
          fontFamily: 'var(--font-title)',
          fontSize: '56px',
          fontWeight: '900',
          letterSpacing: '-0.03em',
          lineHeight: '1.15',
          maxWidth: '850px',
          margin: '0 auto 20px auto',
          color: isDark ? '#ffffff' : '#0f172a'
        }}>
          Visualize Code Architectures <br />
          <span style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            In Interactive 3D Graphs
          </span>
        </h1>

        <p style={{
          fontSize: '15px',
          lineHeight: '1.6',
          color: 'var(--text-secondary)',
          maxWidth: '620px',
          margin: '0 auto 36px auto'
        }}>
          Shallow-clone public repositories instantly. Explore file import networks, view individual file dependency counts, and chat with your codebase using LangChain AI models.
        </p>

        {/* Hero CTA */}
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
          <button
            onClick={onGetStarted}
            className="btn-glow-primary"
            style={{
              padding: '12px 28px',
              borderRadius: '14px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Analyze Repository Free <ArrowRight size={15} />
          </button>
        </div>

        {/* 3D CSS Dashboard Mockup (WOW Factor) */}
        <div style={{
          marginTop: '60px',
          width: '100%',
          maxWidth: '1000px',
          height: '520px',
          borderRadius: '24px',
          background: isDark ? 'rgba(8, 7, 33, 0.45)' : 'rgba(255, 255, 255, 0.6)',
          border: '1px solid var(--border-glass-bright)',
          boxShadow: isDark
            ? '0 30px 100px rgba(0,0,0,0.7), 0 0 80px rgba(6, 182, 212, 0.08)'
            : '0 30px 100px rgba(8, 7, 33, 0.1), 0 0 60px rgba(6, 182, 212, 0.03)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
          {/* Mock Header */}
          <div style={{
            height: '48px',
            borderBottom: '1px solid var(--border-glass)',
            background: isDark ? 'rgba(3, 2, 14, 0.8)' : 'rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px'
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
              repograph.io/workspace/facebook-react
            </div>
            <div style={{ width: '30px' }} />
          </div>

          {/* Mock Grid Panels */}
          <div style={{ flex: 1, display: 'flex' }}>
            {/* Sidebar Left */}
            <div style={{
              width: '220px',
              borderRight: '1px solid var(--border-glass)',
              background: isDark ? 'rgba(6, 5, 22, 0.5)' : 'rgba(248, 250, 252, 0.7)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ height: '14px', width: '90px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                {['App.jsx', 'components/Sidebar.jsx', 'components/Graph.jsx', 'hooks/useTheme.js', 'utils/parser.js'].map((f, i) => {
                  const isHighlighted = i === 1 && demoStep >= 2 && demoStep < 7;
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '10px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        background: isHighlighted ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                        border: isHighlighted ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
                        color: isHighlighted ? 'var(--color-secondary)' : 'var(--text-secondary)',
                        transition: 'all 0.3s'
                      }}
                    >
                      <span style={{ fontSize: '8px', opacity: 0.6 }}>📄</span> {f}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Central Canvas View */}
            <div style={{
              flex: 1,
              position: 'relative',
              background: isDark ? '#040316' : '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {/* Fake Network Nodes */}
              <div style={{
                position: 'absolute', width: '20px', height: '20px', borderRadius: '50%', background: '#7c3aed', boxShadow: '0 0 10px #7c3aed',
                left: '20%', top: '30%',
                animation: 'float1 5s ease-in-out infinite'
              }}>
                <span style={{
                  position: 'absolute', left: '26px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '8px', fontWeight: '600', fontFamily: 'var(--font-code)',
                  color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(15, 23, 42, 0.65)',
                  whiteSpace: 'nowrap', pointerEvents: 'none'
                }}>
                  App.jsx
                </span>
              </div>

              <div style={{
                position: 'absolute', width: '14px', height: '14px', borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 10px #06b6d4',
                left: '45%', top: '25%',
                animation: 'float2 6s ease-in-out infinite'
              }}>
                <span style={{
                  position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '8px', fontWeight: '600', fontFamily: 'var(--font-code)',
                  color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(15, 23, 42, 0.65)',
                  whiteSpace: 'nowrap', pointerEvents: 'none'
                }}>
                  hooks/useTheme.js
                </span>
              </div>

              {/* Interactive Target Node components/Sidebar.jsx */}
              <div style={{
                position: 'absolute',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#f43f5e',
                boxShadow: (demoStep >= 2 && demoStep < 7) ? '0 0 25px #f43f5e' : '0 0 15px #f43f5e',
                border: (demoStep >= 2 && demoStep < 7) ? '2px solid white' : 'none',
                left: '40%',
                top: '50%',
                animation: (demoStep >= 2 && demoStep < 7)
                  ? 'float3 7s ease-in-out infinite, pulseRing 1.5s infinite ease-in-out'
                  : 'float3 7s ease-in-out infinite',
                transition: 'all 0.3s'
              }}>
                <span style={{
                  position: 'absolute', left: '34px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '8px',
                  fontWeight: (demoStep >= 2 && demoStep < 7) ? '800' : '600',
                  fontFamily: 'var(--font-code)',
                  color: (demoStep >= 2 && demoStep < 7)
                    ? (isDark ? '#ffffff' : '#0f172a')
                    : (isDark ? 'rgba(255,255,255,0.65)' : 'rgba(15, 23, 42, 0.65)'),
                  textShadow: (demoStep >= 2 && demoStep < 7) ? '0 0 10px rgba(244,63,94,0.3)' : 'none',
                  whiteSpace: 'nowrap', pointerEvents: 'none',
                  transition: 'all 0.3s'
                }}>
                  components/Sidebar.jsx
                </span>
              </div>

              <div style={{
                position: 'absolute', width: '16px', height: '16px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981',
                left: '65%', top: '40%',
                animation: 'float4 8s ease-in-out infinite'
              }}>
                <span style={{
                  position: 'absolute', left: '22px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '8px', fontWeight: '600', fontFamily: 'var(--font-code)',
                  color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(15, 23, 42, 0.65)',
                  whiteSpace: 'nowrap', pointerEvents: 'none'
                }}>
                  components/Graph.jsx
                </span>
              </div>

              <div style={{
                position: 'absolute', width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 10px #f59e0b',
                left: '60%', top: '70%',
                animation: 'float5 5s ease-in-out infinite'
              }}>
                <span style={{
                  position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '8px', fontWeight: '600', fontFamily: 'var(--font-code)',
                  color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(15, 23, 42, 0.65)',
                  whiteSpace: 'nowrap', pointerEvents: 'none'
                }}>
                  utils/parser.js
                </span>
              </div>

              {/* Connecting lines */}
              {(() => {
                const lineStrokeColor = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(15, 23, 42, 0.09)';
                return (
                  <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
                    <line
                      x1="20%" y1="30%" x2="40%" y2="50%"
                      stroke={(demoStep >= 2 && demoStep < 7) ? 'var(--color-accent)' : lineStrokeColor}
                      strokeWidth={(demoStep >= 2 && demoStep < 7) ? '1.8' : '1'}
                      style={{ transition: 'stroke 0.4s' }}
                    />
                    <line x1="45%" y1="25%" x2="40%" y2="50%" stroke={lineStrokeColor} strokeWidth="1" />
                    <line x1="40%" y1="50%" x2="65%" y2="40%" stroke={lineStrokeColor} strokeWidth="1" />
                    <line x1="60%" y1="70%" x2="40%" y2="50%" stroke={lineStrokeColor} strokeWidth="1" />
                  </svg>
                );
              })()}

              <div style={{
                position: 'absolute',
                bottom: '14px',
                right: '14px',
                background: 'rgba(0,0,0,0.4)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '9px',
                color: 'rgba(255,255,255,0.5)',
                border: '1px solid var(--border-glass)'
              }}>
                Graph Layout View
              </div>
            </div>

            {/* Chatbot Right */}
            <div style={{
              width: '260px',
              borderLeft: '1px solid var(--border-glass)',
              background: isDark ? 'rgba(6, 5, 22, 0.5)' : 'rgba(248, 250, 252, 0.7)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', marginBottom: '10px' }}>
                  💬 Codebase Chat
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginTop: '8px',
                    maxHeight: '340px',
                    overflowY: 'auto',
                    paddingRight: '2px'
                  }}
                >
                  {/* Default starting bubble */}
                  {demoStep < 4 && (
                    <div style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-glass)',
                      fontSize: '9.5px',
                      color: 'var(--text-muted)',
                      lineHeight: '1.4'
                    }}>
                      Select a file or node to ask question or begin chatting with code repository models.
                    </div>
                  )}

                  {/* Question 1 & Answer 1 Block */}
                  {demoStep >= 4 && (
                    <>
                      {/* User Bubble 1 */}
                      <div style={{
                        padding: '8px 12px',
                        borderRadius: '10px 10px 2px 10px',
                        background: 'rgba(124, 58, 237, 0.15)',
                        border: '1px solid rgba(124, 58, 237, 0.25)',
                        fontSize: '9.5px',
                        color: '#c084fc',
                        alignSelf: 'flex-end',
                        animation: 'bubbleFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                      }}>
                        Explain this codebase structure...
                      </div>

                      {/* AI Loading 1 */}
                      {demoStep === 5 && (
                        <div style={{
                          padding: '8px 12px',
                          borderRadius: '10px 10px 10px 2px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border-glass)',
                          fontSize: '9.5px',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          animation: 'bubbleFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                        }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            border: '1.5px solid transparent',
                            borderTopColor: 'var(--color-secondary)',
                            animation: 'spin 1s linear infinite'
                          }} />
                          Thinking...
                        </div>
                      )}

                      {/* AI Response 1 */}
                      {demoStep >= 6 && (
                        <div style={{
                          padding: '8px 12px',
                          borderRadius: '10px 10px 10px 2px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid var(--border-glass)',
                          fontSize: '9.5px',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.45',
                          animation: 'bubbleFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                        }}>
                          This codebase uses a React client communication layer connecting to an Express + MongoDB database server. <br /><br />
                          Primary modules are <strong>InteractiveGraph</strong> and <strong>useRepoApi</strong> for background file parsing.
                        </div>
                      )}
                    </>
                  )}

                  {/* Question 2 & Answer 2 Block */}
                  {demoStep >= 8 && (
                    <>
                      {/* User Bubble 2 */}
                      <div style={{
                        padding: '8px 12px',
                        borderRadius: '10px 10px 2px 10px',
                        background: 'rgba(124, 58, 237, 0.15)',
                        border: '1px solid rgba(124, 58, 237, 0.25)',
                        fontSize: '9.5px',
                        color: '#c084fc',
                        alignSelf: 'flex-end',
                        animation: 'bubbleFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                      }}>
                        How are credits charged?
                      </div>

                      {/* AI Loading 2 */}
                      {demoStep === 9 && (
                        <div style={{
                          padding: '8px 12px',
                          borderRadius: '10px 10px 10px 2px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border-glass)',
                          fontSize: '9.5px',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          animation: 'bubbleFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                        }}>
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            border: '1.5px solid transparent',
                            borderTopColor: 'var(--color-secondary)',
                            animation: 'spin 1s linear infinite'
                          }} />
                          Thinking...
                        </div>
                      )}

                      {/* AI Response 2 */}
                      {demoStep >= 10 && (
                        <div style={{
                          padding: '8px 12px',
                          borderRadius: '10px 10px 10px 2px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid var(--border-glass)',
                          fontSize: '9.5px',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.45',
                          animation: 'bubbleFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                        }}>
                          Analyzing new code repositories costs <strong>1 credit</strong>. If the analysis fails during background cloning or parsing, the credit is automatically refunded.
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Prompt Input bar with Typing placeholder */}
              <div style={{
                height: '32px',
                background: 'rgba(0,0,0,0.18)',
                border: '1px solid var(--border-glass)',
                borderRadius: '8px',
                padding: '0 10px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '9.5px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                position: 'relative'
              }}>
                {demoStep === 4 ? (
                  <>
                    <span>{typedText}</span>
                    <span style={{
                      display: 'inline-block',
                      width: '1px',
                      height: '11px',
                      background: 'var(--color-secondary)',
                      marginLeft: '2px',
                      animation: 'blink 0.8s infinite'
                    }} />
                  </>
                ) : demoStep > 4 && demoStep < 8 ? (
                  <span style={{ opacity: 0.6 }}>Explain this codebase structure...</span>
                ) : demoStep === 8 ? (
                  <>
                    <span>{typedText}</span>
                    <span style={{
                      display: 'inline-block',
                      width: '1px',
                      height: '11px',
                      background: 'var(--color-secondary)',
                      marginLeft: '2px',
                      animation: 'blink 0.8s infinite'
                    }} />
                  </>
                ) : demoStep > 8 && demoStep < 11 ? (
                  <span style={{ opacity: 0.6 }}>How are credits charged?</span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Ask LangChain...</span>
                )}
              </div>
            </div>
          </div>

          {/* Fake Cursor Overlay */}
          <div style={{
            position: 'absolute',
            left: cursor.left,
            top: cursor.top,
            width: '24px',
            height: '24px',
            transform: `scale(${cursor.scale})`,
            pointerEvents: 'none',
            transition: demoStep === 7 || demoStep === 0 ? 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)' : 'all 1.2s cubic-bezier(0.25, 1, 0.5, 1)',
            zIndex: 1000
          }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.5 3V17.2L8.7 13L13.7 21L16.2 19.5L11.2 11.5L16.2 11.2L4.5 3Z" fill="white" stroke="black" strokeWidth="2" strokeLinejoin="round" />
            </svg>

            {/* Click Ripple Indicator */}
            {cursor.clickRipple && (
              <div style={{
                position: 'absolute',
                top: '-7px',
                left: '-7px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '2.5px solid var(--color-secondary)',
                animation: 'ripple 0.6s ease-out forwards',
                pointerEvents: 'none'
              }} />
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{
        padding: '80px 40px',
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '32px', fontWeight: '900', color: isDark ? '#ffffff' : '#0f172a' }}>
            Fully Featured Workspace
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Everything you need to digest and navigate code structure instantly.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {/* Card 1 */}
          <div className="feature-card">
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(124, 58, 237, 0.15)', display: 'flex', alignItems: 'center', justify: 'center', marginBottom: '16px', border: '1px solid rgba(124, 58, 237, 0.25)' }}>
              <Network style={{ color: 'var(--color-primary)', margin: 'auto' }} size={20} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Interactive Network
            </h3>
            <p style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              Observe files as node points scaled by lines of code, connected by import arrows. Drag nodes to physics-align files.
            </p>
          </div>

          {/* Card 2 */}
          <div className="feature-card">
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justify: 'center', marginBottom: '16px', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
              <Code style={{ color: 'var(--color-secondary)', margin: 'auto' }} size={20} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
              File Summaries
            </h3>
            <p style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              Get automated, AI-generated descriptions for every class, function exports, and dependency graph.
            </p>
          </div>

          {/* Card 3 */}
          <div className="feature-card">
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justify: 'center', marginBottom: '16px', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
              <Key style={{ color: 'var(--color-accent)', margin: 'auto' }} size={20} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Bring Your Own Key
            </h3>
            <p style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              Input your own Gemini or OpenAI API keys stored locally in your browser to run limitless vector embeddings for free.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works / Steps */}
      <section id="how-it-works" style={{
        padding: '80px 40px',
        background: isDark ? 'rgba(8, 7, 33, 0.2)' : 'rgba(255, 255, 255, 0.3)',
        borderTop: '1px solid var(--border-glass)',
        borderBottom: '1px solid var(--border-glass)'
      }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '32px', fontWeight: '900', color: isDark ? '#ffffff' : '#0f172a' }}>
              Map Your Code in 3 Simple Steps
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {[{
              step: '01',
              title: 'Provide Repository URL',
              desc: 'Log in and paste any public GitHub repository link. You can select specific branch tags if needed.'
            }, {
              step: '02',
              title: 'Automated Structure Analysis',
              desc: 'Our worker clones the repository into a secure sandboxed folder, parses imports, and structures the nodes.'
            }, {
              step: '03',
              title: 'Interactive RAG Assistant',
              desc: 'Interact with the visual 3D dependency model and query code architectures with our LLM RAG chatbot.'
            }].map((s, idx) => (
              <div key={idx} style={{
                display: 'flex',
                gap: '24px',
                alignItems: 'flex-start',
                padding: '24px',
                background: isDark ? 'rgba(15, 14, 38, 0.4)' : 'rgba(255, 255, 255, 0.5)',
                border: '1px solid var(--border-glass)',
                borderRadius: '20px'
              }}>
                <span style={{
                  fontFamily: 'var(--font-title)',
                  fontSize: '36px',
                  fontWeight: '900',
                  color: 'var(--color-secondary)',
                  opacity: 0.8,
                  lineHeight: '1'
                }}>{s.step}</span>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>{s.title}</h3>
                  <p style={{ fontSize: '12px', lineHeight: '1.6', color: 'var(--text-secondary)', margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" style={{
        padding: '80px 40px',
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.08) 0%, transparent 60%)',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none'
        }} />
        <div style={{
          maxWidth: '650px',
          margin: '0 auto',
          background: isDark ? 'rgba(15, 14, 38, 0.5)' : 'rgba(255, 255, 255, 0.7)',
          border: '1px solid var(--border-glass)',
          borderRadius: '24px',
          padding: '40px'
        }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justify: 'center', margin: '0 auto 20px auto', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
            <Shield style={{ color: 'var(--color-success)', margin: 'auto' }} size={24} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '24px', fontWeight: '900', color: isDark ? '#ffffff' : '#0f172a', marginBottom: '12px' }}>
            Secure & Sandboxed Architecture
          </h2>
          <p style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            We enforce strict controls on analyzing repositories. Cloning and parsing run in sandboxed ephemeral paths with strict boundaries (max 50MB / 500 files limits) to avoid local host server compromises.
          </p>
          <button
            onClick={onGetStarted}
            className="btn-glow-primary"
            style={{
              padding: '10px 24px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Start Analyzing Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px',
        textAlign: 'center',
        borderTop: '1px solid var(--border-glass)',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }}>
        <div>© 2026 RepoGraph. Made for developers with RAG & D3 capabilities.</div>
      </footer>
    </div>
  );
}
