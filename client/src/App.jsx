// ─── App.jsx — Root orchestrator ──────────────────────────────
// Responsibilities:
//   • Owns top-level screen state ('landing' | 'loading' | 'dashboard')
//   • Owns repository / node / chat state
//   • Delegates API calls to useRepoApi()
//   • Delegates theme management to useTheme()
//   • Renders one of: LandingPage | Loader | DashboardPage

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme }    from './hooks/useTheme';
import { useRepoApi }  from './hooks/useRepoApi';
import LandingPage     from './pages/LandingPage';
import DashboardPage   from './pages/DashboardPage';
import Loader          from './components/Loader';
import SettingsModal   from './components/SettingsModal';
import AuthPage        from './pages/AuthPage';
import MarketingPage   from './pages/MarketingPage';
import CheckoutModal   from './components/CheckoutModal';
import AdminDashboardPage from './pages/AdminDashboardPage';

export default function App() {
  // ── Authentication state ──────────────────────────────────
  const [token, setToken] = useState(localStorage.getItem('repograph_auth_token') || '');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('repograph_user') || 'null');
    } catch {
      return null;
    }
  });
  const [showAuth, setShowAuth] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentToast, setPaymentToast] = useState(''); // 'success' | 'cancelled' | ''
  const [isAdminRoute, setIsAdminRoute] = useState(
    window.location.pathname === '/admin' || window.location.hash === '#/admin'
  );

  // ── Route listener for path changes ────────────────────────
  useEffect(() => {
    const handleUrlChange = () => {
      setIsAdminRoute(window.location.pathname === '/admin' || window.location.hash === '#/admin');
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // ── Theme ──────────────────────────────────────────────────
  const { theme, toggle: toggleTheme } = useTheme();

  // ── Navigation ─────────────────────────────────────────────
  const [screen, setScreen] = useState('landing'); // 'landing' | 'loading' | 'dashboard'

  // ── Repository state ───────────────────────────────────────
  const [historyRepos, setHistoryRepos] = useState([]);
  const [activeRepo,   setActiveRepo]   = useState(null);
  const [nodes,        setNodes]        = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [branches,     setBranches]     = useState(['main']);

  // ── Chat state ─────────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatOpen, setIsChatOpen]     = useState(false);

  // ── URL used for the Loader screen display ─────────────────
  const [pendingUrl, setPendingUrl] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // ── API layer ──────────────────────────────────────────────
  const {
    apiLoading, chatLoading, errorMsg,
    analyzeRepo, loadRepo, fetchBranches, fetchHistory, sendChatMessage,
  } = useRepoApi();

  // ── Expose node selection to the chatbot link callback ─────
  useEffect(() => {
    window.selectNodePath = (filePath) => {
      const match = nodes.find(n => n.path === filePath);
      if (match) setSelectedNode(match);
    };
    return () => { delete window.selectNodePath; };
  }, [nodes]);

  // ── Load history on mount or token changes ─────────────────
  useEffect(() => {
    if (token) {
      fetchHistory().then(setHistoryRepos);
    } else {
      setHistoryRepos([]);
    }
  }, [fetchHistory, token]);

  // ── Handle Stripe payment return (?payment=success/cancelled) ─
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success' || payment === 'cancelled') {
      setPaymentToast(payment);
      // Remove query param from URL without page reload
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh credit balance from server
      if (payment === 'success' && token) {
        fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
          .then(r => r.json())
          .then(profile => {
            setUser(prev => prev ? { ...prev, credits: profile.credits } : null);
            const localUser = JSON.parse(localStorage.getItem('repograph_user') || '{}');
            localUser.credits = profile.credits;
            localStorage.setItem('repograph_user', JSON.stringify(localUser));
          })
          .catch(console.error);
      }
      // Auto-dismiss toast after 5s
      setTimeout(() => setPaymentToast(''), 5000);
    }
  }, [token]);

  const handleAuthSuccess = useCallback((newToken, newUser) => {
    localStorage.setItem('repograph_auth_token', newToken);
    localStorage.setItem('repograph_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('repograph_auth_token');
    localStorage.removeItem('repograph_user');
    localStorage.removeItem('repograph_active_repo_id');
    setToken('');
    setUser(null);
    setScreen('landing');
    setShowAuth(false);
  }, []);

  const handlePurchaseSuccess = useCallback((newCredits) => {
    setUser(prev => prev ? { ...prev, credits: newCredits } : null);
    const localUser = JSON.parse(localStorage.getItem('repograph_user') || '{}');
    localUser.credits = newCredits;
    localStorage.setItem('repograph_user', JSON.stringify(localUser));
  }, []);

  // ── Helpers to apply a successfully fetched repo payload ───
  const applyRepoPayload = useCallback((data) => {
    setActiveRepo(data.repository);
    setNodes(data.nodes);
    setSelectedNode(null);
    setChatMessages([]);
    setIsChatOpen(false);
    setScreen('dashboard');

    if (data.repository && data.repository._id) {
      localStorage.setItem('repograph_active_repo_id', data.repository._id);
      fetchBranches(data.repository._id).then((branchesList) => {
        setBranches(branchesList || ['main']);
      });
    }
  }, [fetchBranches]);

  // ── Handlers ───────────────────────────────────────────────
  const handleAnalyze = useCallback(async (url, forceRefresh = false, branch = '') => {
    if (!url?.trim()) return;
    setPendingUrl(url);
    setScreen('loading');
    const data = await analyzeRepo(url, forceRefresh, branch);
    if (data) {
      applyRepoPayload(data);
      fetchHistory().then(setHistoryRepos);
      
      if (data.credits !== undefined) {
        setUser(prev => prev ? { ...prev, credits: data.credits } : null);
        const localUser = JSON.parse(localStorage.getItem('repograph_user') || '{}');
        localUser.credits = data.credits;
        localStorage.setItem('repograph_user', JSON.stringify(localUser));
      }
    } else {
      setScreen('landing'); // error — useRepoApi already set errorMsg
      
      // Sync profile credits count on failure (in case of a refund)
      try {
        const token = localStorage.getItem('repograph_auth_token');
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const profile = await res.json();
          setUser(prev => prev ? { ...prev, credits: profile.credits } : null);
          const localUser = JSON.parse(localStorage.getItem('repograph_user') || '{}');
          localUser.credits = profile.credits;
          localStorage.setItem('repograph_user', JSON.stringify(localUser));
        }
      } catch (refundErr) {
        console.error('Failed to sync refund credits:', refundErr);
      }
    }
  }, [analyzeRepo, applyRepoPayload, fetchHistory]);

  const handleLoadFromHistory = useCallback(async (repoId) => {
    setScreen('loading');
    const data = await loadRepo(repoId);
    if (data) applyRepoPayload(data);
    else       setScreen('landing');
  }, [loadRepo, applyRepoPayload]);

  const handleBackToLanding = useCallback(() => {
    localStorage.removeItem('repograph_active_repo_id');
    setScreen('landing');
  }, []);

  // ── Restore active repository session on reload ────────────
  useEffect(() => {
    if (token) {
      const activeRepoId = localStorage.getItem('repograph_active_repo_id');
      if (activeRepoId) {
        handleLoadFromHistory(activeRepoId);
      }
    }
  }, [token, handleLoadFromHistory]);

  const handleNodeSelect = useCallback((item) => {
    const full = nodes.find(n => n.path === item.path);
    if (full) setSelectedNode(full);
  }, [nodes]);

  const handleSendChat = useCallback(async (text) => {
    if (!text.trim() || chatLoading || !activeRepo) return;
    setChatMessages(prev => [...prev, { role: 'user', content: text }]);
    try {
      const result = await sendChatMessage(activeRepo._id, text, chatMessages);
      // result may be { answer, creditsRemaining } or just a string
      const answer = typeof result === 'string' ? result : result?.answer;
      const creditsRemaining = result?.creditsRemaining;
      setChatMessages(prev => [...prev, { role: 'assistant', content: answer }]);
      // Sync credit balance if server returned updated count
      if (creditsRemaining !== undefined) {
        setUser(prev => prev ? { ...prev, credits: creditsRemaining } : null);
        const localUser = JSON.parse(localStorage.getItem('repograph_user') || '{}');
        localUser.credits = creditsRemaining;
        localStorage.setItem('repograph_user', JSON.stringify(localUser));
      }
    } catch (err) {
      const msg = err.message || 'Unknown error';
      // Show insufficient credit error prominently
      if (err.creditLimitReached) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: `⚡ **Out of credits.** ${msg}` }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${msg}` }]);
      }
    }
  }, [activeRepo, chatLoading, chatMessages, sendChatMessage]);

  const handleReAnalyze = useCallback(() => {
    if (activeRepo?.url) handleAnalyze(activeRepo.url, true, activeRepo.branch);
  }, [activeRepo, handleAnalyze]);

  const handleSwitchBranch = useCallback((branchName) => {
    if (activeRepo?.url) handleAnalyze(activeRepo.url, false, branchName);
  }, [activeRepo, handleAnalyze]);

  // ── Render ─────────────────────────────────────────────────
  if (isAdminRoute) {
    if (!token) {
      return <AuthPage onAuthSuccess={handleAuthSuccess} onBack={() => {
        window.history.replaceState({}, '', '/');
        setIsAdminRoute(false);
      }} />;
    }
    if (user?.role !== 'admin') {
      return (
        <div style={{
          width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: 'var(--graph-bg)',
          color: 'var(--text-primary)', fontFamily: 'var(--font-body)', gap: 12
        }}>
          <h2>🔒 Access Denied</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Admin credentials required.</p>
          <button onClick={handleLogout} style={{
            padding: '10px 20px', background: 'var(--color-primary)', border: 'none',
            color: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13
          }}>
            Log In with another account
          </button>
        </div>
      );
    }
    return <AdminDashboardPage theme={theme} onLogout={handleLogout} />;
  }

  if (!token) {
    if (showAuth) {
      return <AuthPage onAuthSuccess={handleAuthSuccess} onBack={() => setShowAuth(false)} />;
    }
    return <MarketingPage theme={theme} onToggleTheme={toggleTheme} onGetStarted={() => setShowAuth(true)} />;
  }
  if (screen === 'loading') return <Loader gitUrl={pendingUrl} />;

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>

      {screen === 'landing' && (
        <LandingPage
          theme={theme}
          onToggleTheme={toggleTheme}
          historyRepos={historyRepos}
          errorMsg={errorMsg}
          onAnalyze={handleAnalyze}
          onLoadFromHistory={handleLoadFromHistory}
          onOpenSettings={() => setIsSettingsOpen(true)}
          user={user}
          onLogout={handleLogout}
          onOpenCheckout={() => setIsCheckoutOpen(true)}
        />
      )}

      {screen === 'dashboard' && activeRepo && (
        <DashboardPage
          theme={theme}
          onToggleTheme={toggleTheme}
          repository={activeRepo}
          nodes={nodes}
          branches={branches}
          onSwitchBranch={handleSwitchBranch}
          selectedNode={selectedNode}
          onSelectNode={handleNodeSelect}
          onCloseNode={() => setSelectedNode(null)}
          chatMessages={chatMessages}
          chatLoading={chatLoading}
          apiLoading={apiLoading}
          onSendChat={handleSendChat}
          onReAnalyze={handleReAnalyze}
          onBackToLanding={handleBackToLanding}
          isChatOpen={isChatOpen}
          onToggleChat={() => setIsChatOpen(prev => !prev)}
          onCloseChat={() => setIsChatOpen(false)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          user={user}
          onLogout={handleLogout}
          onOpenCheckout={() => setIsCheckoutOpen(true)}
        />
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} theme={theme} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} theme={theme} />

      {/* Payment return toast */}
      {paymentToast && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 999, padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
          background: paymentToast === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.12)',
          border: `1px solid ${paymentToast === 'success' ? 'rgba(16,185,129,0.35)' : 'rgba(244,63,94,0.3)'}`,
          color: paymentToast === 'success' ? '#6ee7b7' : '#fca5a5',
          backdropFilter: 'blur(12px)',
          cursor: 'pointer',
        }} onClick={() => setPaymentToast('')}>
          {paymentToast === 'success' ? '✅ Payment successful! Credits added to your account.' : '❌ Payment cancelled. No charges made.'}
        </div>
      )}

    </div>
  );
}
