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

  const handleAuthSuccess = useCallback((newToken, newUser) => {
    localStorage.setItem('repograph_auth_token', newToken);
    localStorage.setItem('repograph_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('repograph_auth_token');
    localStorage.removeItem('repograph_user');
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

  const handleNodeSelect = useCallback((item) => {
    const full = nodes.find(n => n.path === item.path);
    if (full) setSelectedNode(full);
  }, [nodes]);

  const handleSendChat = useCallback(async (text) => {
    if (!text.trim() || chatLoading || !activeRepo) return;
    setChatMessages(prev => [...prev, { role: 'user', content: text }]);
    try {
      const answer = await sendChatMessage(activeRepo._id, text, chatMessages);
      setChatMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    }
  }, [activeRepo, chatLoading, chatMessages, sendChatMessage]);

  const handleReAnalyze = useCallback(() => {
    if (activeRepo?.url) handleAnalyze(activeRepo.url, true, activeRepo.branch);
  }, [activeRepo, handleAnalyze]);

  const handleSwitchBranch = useCallback((branchName) => {
    if (activeRepo?.url) handleAnalyze(activeRepo.url, false, branchName);
  }, [activeRepo, handleAnalyze]);

  // ── Render ─────────────────────────────────────────────────
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
          onBackToLanding={() => setScreen('landing')}
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
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} theme={theme} onPurchaseSuccess={handlePurchaseSuccess} />

    </div>
  );
}
