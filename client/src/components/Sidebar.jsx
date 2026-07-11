import React, { useState } from 'react';
import { Search, FileCode, Cpu, BarChart3, ChevronRight, Github, FolderGit2 } from 'lucide-react';
import MermaidDiagram from './MermaidDiagram';

const LANG_COLORS = {
  'JavaScript': '#f1e05a', 'JavaScript (JSX)': '#61dafb',
  'TypeScript': '#3178c6', 'TypeScript (TSX)': '#3178c6',
  'Python': '#4B8BBE', 'Go': '#00ADD8', 'Rust': '#dea584',
  'HTML': '#e34c26', 'CSS': '#563d7c', 'JSON': '#29beb0',
  'Markdown': '#6b7280', 'Other': '#6b7280',
};

const getLangColor = (lang) => LANG_COLORS[lang] || LANG_COLORS['Other'];
const getLangAbbr  = (lang) => lang ? lang.substring(0, 3).toUpperCase() : 'TXT';

export default function Sidebar({ repository, nodes, selectedNode, onSelectNode, onReset, className, theme }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('files');

  const filteredNodes = nodes.filter(node =>
    node.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLoc = repository.totalLinesOfCode || 0;

  const formatMarkdownText = (text) => {
    if (!text) return '';

    // Escape HTML tags to prevent injection
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 1. Code blocks: ```lang ... ```
    html = html.replace(/```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)\n```/g, (match, code) => {
      return `<pre class="code-block font-mono my-1 text-[9.5px]" style="background: var(--code-bg); border: 1px solid var(--border-glass); padding: 8px 10px; border-radius: 6px; white-space: pre-wrap; word-break: break-all; word-wrap: break-word; overflow-x: auto; color: var(--text-primary); margin: 6px 0; line-height: 1.4;">${code}</pre>`;
    });

    // 2. Inline code: `code`
    html = html.replace(/`([^`]+)`/g, '<code class="font-mono text-secondary" style="background: rgba(6,182,212,0.08); padding: 1px 4px; border-radius: 4px; color: var(--color-secondary); font-size: 10px;">$1</code>');

    // 3. Headers: ### Title or ## Title or # Title
    html = html.replace(/^\s*###\s+(.+)$/gm, '<h5 style="font-size: 11.5px; font-weight: 700; color: var(--text-primary); margin: 8px 0 4px 0;">$1</h5>');
    html = html.replace(/^\s*##\s+(.+)$/gm, '<h4 style="font-size: 12px; font-weight: 700; color: var(--text-primary); margin: 10px 0 6px 0;">$1</h4>');
    html = html.replace(/^\s*#\s+(.+)$/gm, '<h3 style="font-size: 12.5px; font-weight: 800; color: var(--text-primary); margin: 12px 0 8px 0;">$1</h3>');

    // 4. Bold text: **bold**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight: 700; color: var(--text-primary);">$1</strong>');

    // 5. File Scheme Links: [text](file:///path)
    html = html.replace(/\[([^\]]+)\]\(file:\/\/\/([^)]+)\)/g, '<span class="cursor-pointer" style="color: var(--color-secondary); border-bottom: 1px dashed var(--color-secondary); font-weight: 600;" onclick="window.selectNodePath(\'$2\')">$1</span>');

    // 6. Bullet lists (* or -)
    html = html.replace(/^\s*[-*]\s+(.+)$/gm, '<li style="margin-left: 12px; list-style-type: disc; color: var(--text-secondary); padding: 1px 0; font-size: 10.5px;">$1</li>');

    // 7. Dividers: ---
    html = html.replace(/^\s*---\s*$/gm, '<hr style="border: 0; border-top: 1px solid var(--border-glass); margin: 8px 0;" />');

    // 8. Linebreaks
    html = html.replace(/\n/g, '<br/>');

    // Clean up double br inside list items or dividers
    html = html.replace(/(<li[^>]*>.*?<\/li>)<br\/>/g, '$1');
    html = html.replace(/(<hr[^>]*>)<br\/>/g, '$1');
    html = html.replace(/(<h[345][^>]*>.*?<\/h[345]>)<br\/>/g, '$1');

    return <div dangerouslySetInnerHTML={{ __html: html }} style={{ display: 'inline' }} />;
  };

  const formatMarkdown = (text) => {
    if (!text) return '';

    // Split text by ```mermaid ... ``` blocks
    const parts = text.split(/(```mermaid[\s\S]*?```)/g);

    return (
      <div style={{ fontSize: '11px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
        {parts.map((part, index) => {
          if (part.startsWith('```mermaid')) {
            // Extract the raw mermaid diagram code
            const code = part.replace(/```mermaid\s*\n|```$/g, '').trim();
            return <MermaidDiagram key={index} code={code} theme={theme} />;
          } else {
            return <span key={index}>{formatMarkdownText(part)}</span>;
          }
        })}
      </div>
    );
  };

  return (
    <aside
      className={className || ''}
      style={{
        display: 'flex', flexDirection: 'column',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border-glass)',
        overflow: 'hidden',
        gridColumn: 1, gridRow: 2,
      }}
    >


      {/* Repo info */}
      <div style={{ padding: '12px 16px', background: 'rgba(14,12,45,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <FolderGit2 size={13} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {repository.name}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Files', value: repository.totalFiles, color: 'var(--color-primary)' },
            { label: 'Lines', value: totalLoc.toLocaleString(), color: 'var(--color-secondary)' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)',
              borderRadius: 9, padding: '8px 10px',
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em', marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.color, fontFamily: 'Outfit,sans-serif' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)', flexShrink: 0 }}>
        {[
          { id: 'files',    icon: FileCode, label: 'Files' },
          { id: 'overview', icon: Cpu,      label: 'AI Overview' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '9px 0', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 5, fontSize: 11, fontWeight: 600,
              color: activeTab === tab.id ? 'var(--color-secondary)' : 'var(--text-muted)',
              background: activeTab === tab.id ? 'rgba(6,182,212,0.06)' : 'transparent',
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--color-secondary)' : 'transparent'}`,
              transition: 'all 0.15s', cursor: 'pointer',
              fontFamily: 'Inter,sans-serif',
            }}
            onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>

        {activeTab === 'files' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
            {/* Search */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <Search size={13} style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', pointerEvents: 'none',
              }} />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', height: 34, paddingLeft: 30, paddingRight: 10,
                  background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                  borderRadius: 8, color: 'var(--text-primary)', fontSize: 12, fontFamily: 'Inter,sans-serif',
                  transition: 'border-color 0.18s',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--color-secondary)'}
                onBlur={e => e.target.style.borderColor = 'var(--input-border)'}
              />
            </div>

            {/* Count */}
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
              {filteredNodes.length} FILES
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {filteredNodes.length > 0 ? filteredNodes.map(node => {
                const isSelected = selectedNode?.path === node.path;
                const langColor = getLangColor(node.language);
                return (
                  <button
                    key={node.path}
                    onClick={() => onSelectNode(node)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 8px', borderRadius: 7,
                      border: isSelected ? '1px solid var(--border-glass-bright)' : '1px solid transparent',
                      background: isSelected ? 'rgba(6,182,212,0.09)' : 'transparent',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontSize: 11, textAlign: 'left', cursor: 'pointer',
                      transition: 'all 0.12s', fontFamily: 'Inter,sans-serif',
                    }}
                    onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
                    onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden', flex: 1 }}>
                      {/* Language dot */}
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: langColor, flexShrink: 0,
                        boxShadow: `0 0 6px ${langColor}60`,
                      }} />
                      {/* Lang badge */}
                      <span style={{
                        fontSize: 8.5, padding: '1px 4px', borderRadius: 4,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)',
                        fontFamily: 'monospace', color: 'var(--text-muted)', flexShrink: 0, letterSpacing: '0.04em',
                      }}>
                        {getLangAbbr(node.language)}
                      </span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {node.path}
                      </span>
                    </div>
                    <ChevronRight size={10} style={{
                      flexShrink: 0, color: isSelected ? 'var(--color-secondary)' : 'var(--text-muted)',
                      transform: isSelected ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.15s',
                    }} />
                  </button>
                );
              }) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: 12 }}>
                  No files match your search.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* AI Overview Tab */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Summary */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-glass-bright)',
              borderRadius: 12, padding: 14,
            }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <Cpu size={13} style={{ color: 'var(--color-secondary)' }} />
                Architecture Overview
              </h4>
              {formatMarkdown(repository.summary)}
            </div>

            {/* Language Breakdown */}
            {repository.languages && Object.keys(repository.languages).length > 0 && (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
                borderRadius: 12, padding: 14,
              }}>
                <h4 style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <BarChart3 size={13} style={{ color: 'var(--color-accent)' }} />
                  Language Breakdown
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {Object.entries(repository.languages).map(([lang, pct]) => {
                    const c = getLangColor(lang);
                    return (
                      <div key={lang}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, display: 'inline-block', boxShadow: `0 0 6px ${c}60` }} />
                            <span style={{ color: 'var(--text-secondary)' }}>{lang}</span>
                          </div>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Outfit,sans-serif' }}>{pct}%</span>
                        </div>
                        <div style={{ height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: c, borderRadius: 3, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
