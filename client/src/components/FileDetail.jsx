import React, { useState, useEffect } from 'react';
import { X, FileText, Info, Code2, Link, ArrowRightLeft, MessageSquarePlus, Terminal, Loader2 } from 'lucide-react';
import MermaidDiagram from './MermaidDiagram';

export default function FileDetail({ selectedNode, onClose, onSelectNode, repository, theme }) {
  const [showCode, setShowCode] = useState(false);
  const [fileQuestion, setFileQuestion] = useState('');
  const [askedQuestion, setAskedQuestion] = useState('');
  const [queryAnswer, setQueryAnswer] = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState('');

  useEffect(() => {
    setFileQuestion('');
    setAskedQuestion('');
    setQueryAnswer('');
    setQueryLoading(false);
    setQueryError('');
  }, [selectedNode]);

  if (!selectedNode) return null;

  // Format file size
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!fileQuestion.trim() || queryLoading) return;

    const questionText = fileQuestion.trim();
    setAskedQuestion(questionText);
    setFileQuestion('');
    setQueryAnswer('');
    setQueryError('');
    setQueryLoading(true);

    try {
      const res = await fetch(`/api/repos/${repository._id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `In the file \`${selectedNode.path}\`, ${questionText}`,
          chatHistory: []
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get answer');
      setQueryAnswer(data.answer);
    } catch (err) {
      setQueryError(err.message || 'Error occurred while querying the file.');
    } finally {
      setQueryLoading(false);
    }
  };

  // Helper to format regular markdown text into HTML
  const formatMarkdownText = (text) => {
    if (!text) return null;

    // Escape HTML tags to prevent injection
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 0. Tables: | header | ... | \n | --- | ... | \n | row | ... |
    const tableRegex = /((?:^\s*\|.*\|\s*$(?:\r?\n)?)+)/gm;
    html = html.replace(tableRegex, (match) => {
      const lines = match.trim().split(/\r?\n/);
      if (lines.length < 2) return match;

      const rows = lines.map(line => {
        const cells = line.trim().replace(/^\||\|$/g, '').split('|');
        return cells.map(cell => cell.trim());
      });

      const isDelimiter = rows[1] && rows[1].every(cell => /^[:\-\s]+$/.test(cell));
      if (!isDelimiter) return match;

      const headers = rows[0];
      const dataRows = rows.slice(2);

      let tableHtml = '<div style="overflow-x: auto; margin: 8px 0; border-radius: 6px; border: 1px solid var(--border-glass);">';
      tableHtml += '<table style="width: 100%; border-collapse: collapse; font-size: 10px; text-align: left; background: rgba(255,255,255,0.01);">';
      
      // Header
      tableHtml += '<thead style="background: rgba(255,255,255,0.04); border-bottom: 1px solid var(--border-glass);">';
      tableHtml += '<tr>';
      headers.forEach((header, idx) => {
        const borderRightStyle = idx === headers.length - 1 ? '' : ' border-right: 1px solid var(--border-glass);';
        tableHtml += `<th style="padding: 6px 10px; font-weight: 700; color: var(--text-primary);${borderRightStyle}">${header}</th>`;
      });
      tableHtml += '</tr>';
      tableHtml += '</thead>';

      // Body
      tableHtml += '<tbody>';
      dataRows.forEach((row, rIdx) => {
        const rowBg = rIdx % 2 === 1 ? 'rgba(255,255,255,0.01)' : 'transparent';
        tableHtml += `<tr style="background: ${rowBg}; border-bottom: 1px solid var(--border-glass-bright, rgba(255,255,255,0.05));">`;
        row.forEach((cell, idx) => {
          const borderRightStyle = idx === row.length - 1 ? '' : ' border-right: 1px solid var(--border-glass);';
          tableHtml += `<td style="padding: 6px 10px; color: var(--text-secondary);${borderRightStyle}">${cell}</td>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</tbody>';
      tableHtml += '</table>';
      tableHtml += '</div>';

      return tableHtml;
    });

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

  // Robust, compact HTML formatter for markdown
  const formatMarkdown = (text) => {
    if (!text) return '';

    // Split text by ```mermaid ... ``` blocks
    const parts = text.split(/(```mermaid[\s\S]*?```)/g);

    return (
      <div style={{ fontSize: '11px', lineHeight: '1.5' }}>
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
    <div className="w-96 h-full flex flex-col z-10 overflow-hidden relative shadow-2xl"
      style={{
        background: 'var(--detail-bg)',
        borderLeft: '1px solid var(--border-glass)',
        gridColumn: 3,
        gridRow: 2,
      }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between"
        style={{
          borderBottom: '1px solid var(--border-glass)',
          background: 'rgba(3,2,14,0.03)'
        }}
      >
        <div className="flex items-center gap-2 truncate">
          <FileText size={16} style={{ color: 'var(--color-accent)' }} />
          <h3 className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{selectedNode.name}</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded transition-colors"
          style={{
            color: 'var(--text-muted)',
            background: 'transparent',
            cursor: 'pointer'
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* File Meta Info */}
        <div className="grid grid-cols-3 gap-2 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
          <div className="p-2 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', minWidth: 0 }}>
            <div style={{ color: 'var(--text-muted)' }}>Language</div>
            <div className="font-semibold truncate mt-0.5" style={{ color: 'var(--text-primary)' }}>{selectedNode.language || 'Plain Text'}</div>
          </div>
          <div className="p-2 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', minWidth: 0 }}>
            <div style={{ color: 'var(--text-muted)' }}>Size</div>
            <div className="font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{formatBytes(selectedNode.size)}</div>
          </div>
          <div className="p-2 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', minWidth: 0 }}>
            <div style={{ color: 'var(--text-muted)' }}>Lines</div>
            <div className="font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{selectedNode.linesOfCode}</div>
          </div>
        </div>

        {/* Path Label */}
        <div className="p-2 rounded text-[10px] flex items-center gap-1"
          style={{
            background: 'rgba(14,12,45,0.02)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-muted)'
          }}
        >
          <Terminal size={10} />
          <span className="font-mono truncate">{selectedNode.path}</span>
        </div>

        {/* AI File Summary */}
        <div className="rounded-lg p-3"
          style={{
            background: 'rgba(124, 58, 237, 0.05)',
            border: '1px solid rgba(124, 58, 237, 0.2)'
          }}
        >
          <h4 className="font-bold text-xs flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-primary)' }}>
            <Info size={13} style={{ color: 'var(--color-primary)' }} />
            AI File Analysis
          </h4>
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {selectedNode.summary}
          </p>
        </div>

        {/* Code Snippet Viewer */}
        {selectedNode.codeSnippet && (
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border-glass)' }}>
            <button
              onClick={() => setShowCode(!showCode)}
              className="w-full px-3 py-2 flex items-center justify-between text-left text-xs font-semibold transition-colors"
              style={{
                background: 'rgba(14,12,45,0.03)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                border: 'none'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,12,45,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(14,12,45,0.03)'}
            >
              <span className="flex items-center gap-1.5">
                <Code2 size={13} style={{ color: 'var(--color-secondary)' }} />
                Code Preview (First 150 lines)
              </span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{showCode ? 'Collapse' : 'Expand'}</span>
            </button>
            
            {showCode && (
              <pre className="code-block m-0 rounded-none border-0 text-[10px] max-h-60 overflow-y-auto font-mono">
                <code>{selectedNode.codeSnippet}</code>
              </pre>
            )}
          </div>
        )}

        {/* Code Exports list */}
        {selectedNode.exports && selectedNode.exports.length > 0 && (
          <div className="border rounded-lg p-3" style={{ borderColor: 'var(--border-glass)', background: 'rgba(14,12,45,0.01)' }}>
            <h4 className="font-bold text-xs flex items-center gap-1.5 mb-2" style={{ color: 'var(--text-primary)' }}>
              <ArrowRightLeft size={13} style={{ color: 'var(--color-accent)' }} />
              Exports
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {selectedNode.exports.map(exp => (
                <span key={exp} className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono"
                  style={{
                    background: 'rgba(244,63,94,0.08)',
                    borderColor: 'rgba(244,63,94,0.2)',
                    color: 'var(--color-accent)'
                  }}
                >
                  {exp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Code Imports / File Dependencies */}
        <div className="border rounded-lg p-3" style={{ borderColor: 'var(--border-glass)', background: 'rgba(14,12,45,0.01)' }}>
          <h4 className="font-bold text-xs flex items-center gap-1.5 mb-2" style={{ color: 'var(--text-primary)' }}>
            <Link size={13} style={{ color: 'var(--color-secondary)' }} />
            Depends On (Imports)
          </h4>
          {selectedNode.imports && selectedNode.imports.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {selectedNode.imports.map(imp => {
                const parts = imp.split('/');
                const baseName = parts[parts.length - 1];
                return (
                  <button
                    key={imp}
                    onClick={() => onSelectNode({ path: imp })} // search node by path in parents
                    className="w-full flex items-center justify-between text-left text-[10px] p-1.5 rounded border border-transparent transition-colors"
                    style={{
                      color: 'var(--text-secondary)',
                      background: 'transparent',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor = 'var(--border-glass-bright)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    <span className="truncate max-w-[200px] font-mono">{baseName} <span className="text-text-muted text-[8px] font-sans" style={{ color: 'var(--text-muted)' }}>({imp})</span></span>
                    <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary/10 shrink-0" style={{ color: 'var(--color-secondary)', background: 'rgba(6,182,212,0.1)' }}>View Node</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-[10px] italic py-1" style={{ color: 'var(--text-muted)' }}>
              This file does not import any other local source files.
            </div>
          )}
        </div>

        {/* Localized File Chat Input */}
        <div className="border rounded-lg p-3 mt-auto shrink-0" style={{ borderColor: 'var(--border-glass)', background: 'rgba(14,12,45,0.03)' }}>
          <h4 className="font-bold text-xs flex items-center gap-1.5 mb-2" style={{ color: 'var(--text-primary)' }}>
            <MessageSquarePlus size={13} style={{ color: 'var(--color-primary)' }} />
            Query This File
          </h4>
          <form onSubmit={handleAskQuestion} className="flex gap-2">
            <input
              type="text"
              placeholder="Ask a question about this file..."
              value={fileQuestion}
              onChange={(e) => setFileQuestion(e.target.value)}
              disabled={queryLoading}
              className="flex-1 border rounded py-1.5 px-2.5 text-[11px]"
              style={{
                background: 'var(--input-bg)',
                borderColor: 'var(--input-border)',
                color: 'var(--text-primary)'
              }}
            />
            <button
              type="submit"
              disabled={queryLoading}
              className="px-3 py-1.5 rounded text-[11px] font-semibold transition-colors disabled:opacity-50"
              style={{ background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', border: 'none' }}
            >
              Ask
            </button>
          </form>

          {/* Asked Question & Answer Display */}
          {(queryLoading || queryAnswer || queryError) && (
            <div className="mt-3 p-2.5 rounded border text-[11px]" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'var(--border-glass)' }}>
              <div className="flex justify-between items-start mb-2 pb-1.5" style={{ borderBottom: '1px dashed var(--border-glass)' }}>
                <span className="font-semibold text-text-secondary truncate pr-2" style={{ color: 'var(--text-secondary)' }}>
                  Question: "{askedQuestion}"
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAskedQuestion('');
                    setQueryAnswer('');
                    setQueryError('');
                  }}
                  className="text-[9px] hover:text-white px-1.5 py-0.5 rounded transition-colors shrink-0"
                  style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', border: 'none' }}
                >
                  Clear
                </button>
              </div>

              {queryLoading && (
                <div className="flex items-center gap-1.5 py-1 text-text-muted" style={{ color: 'var(--text-muted)' }}>
                  <Loader2 size={12} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                  Analyzing file...
                </div>
              )}

              {queryError && (
                <div className="py-1" style={{ color: '#f87171' }}>
                  {queryError}
                </div>
              )}

              {queryAnswer && (
                <div className="markdown-answer leading-relaxed max-h-64 overflow-y-auto pr-1" style={{ color: 'var(--text-secondary)' }}>
                  {formatMarkdown(queryAnswer)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
