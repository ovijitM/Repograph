// ─── Dashboard / Workspace page ───────────────────────────────
// Renders the full 4-panel layout: header, sidebar, graph, file detail, chatbot.

import React from 'react';
import { Layers } from 'lucide-react';
import DashboardHeader  from '../components/DashboardHeader';
import Sidebar          from '../components/Sidebar';
import InteractiveGraph from '../components/InteractiveGraph';
import FileDetail       from '../components/FileDetail';
import ChatBot          from '../components/ChatBot';

// ── Graph info overlay (pure presentational) ───────────────────
function GraphInfoBadge({ theme }) {
  return (
    <div style={{
      position: 'absolute', top: 14, left: 14,
      background: theme === 'light' ? 'rgba(240,244,255,0.88)' : 'rgba(8,7,33,0.78)',
      backdropFilter: 'blur(16px)',
      border: '1px solid var(--border-glass)', borderRadius: 12,
      padding: '10px 14px', pointerEvents: 'none',
    }}>
      <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Layers size={13} style={{ color: 'var(--color-secondary)' }} />
        Code Dependency Graph
      </span>
      <span style={{ color: 'var(--text-muted)', fontSize: 10.5, display: 'block', marginTop: 3 }}>
        Nodes = files · Edges = imports · Click to inspect
      </span>
    </div>
  );
}

// ── Main DashboardPage ─────────────────────────────────────────
export default function DashboardPage({
  theme, onToggleTheme,
  repository, nodes,
  branches, onSwitchBranch,
  selectedNode, onSelectNode, onCloseNode,
  chatMessages, chatLoading,
  apiLoading,
  onSendChat, onAskFileQuestion,
  onReAnalyze,
  onBackToLanding,
  isChatOpen,
  onToggleChat,
  onCloseChat,
  onOpenSettings,
  user,
  onLogout,
  onOpenCheckout,
}) {
  return (
    <div className="dashboard-grid">

      {/* ── Top header bar ── */}
      <DashboardHeader
        theme={theme}
        onToggleTheme={onToggleTheme}
        repository={repository}
        branches={branches}
        onSwitchBranch={onSwitchBranch}
        isLoading={apiLoading}
        onReAnalyze={onReAnalyze}
        onLogoClick={onBackToLanding}
        isChatOpen={isChatOpen}
        onToggleChat={onToggleChat}
        onOpenSettings={onOpenSettings}
        user={user}
        onLogout={onLogout}
        onOpenCheckout={onOpenCheckout}
      />

      {/* ── Left sidebar: file list + AI overview ── */}
      <Sidebar
        className="dashboard-sidebar"
        repository={repository}
        nodes={nodes}
        selectedNode={selectedNode}
        onSelectNode={onSelectNode}
        onReset={onBackToLanding}
        theme={theme}
      />

      {/* ── Centre: interactive graph canvas ── */}
      <main className="graph-main">
        <InteractiveGraph
          nodes={nodes}
          selectedNode={selectedNode}
          onSelectNode={onSelectNode}
          theme={theme}
        />
        <GraphInfoBadge theme={theme} />
      </main>

      {/* ── Right panels ── */}
      <FileDetail
        selectedNode={selectedNode}
        onClose={onCloseNode}
        onSelectNode={onSelectNode}
        repository={repository}
        theme={theme}
      />

      <ChatBot
        repository={repository}
        chatMessages={chatMessages}
        onSendMessage={onSendChat}
        isLoading={chatLoading}
        isOpen={isChatOpen}
        onClose={onCloseChat}
        theme={theme}
      />

    </div>
  );
}
