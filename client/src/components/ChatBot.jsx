import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2, Minimize2, Maximize2, GripVertical } from 'lucide-react';
import GlassCard from './GlassCard';
import MermaidDiagram from './MermaidDiagram';

export default function ChatBot({ repository, chatMessages, onSendMessage, isLoading, isOpen, onClose, theme }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [dimensions, setDimensions] = useState({ width: 360, height: 480 });
  // Position: null means "use default bottom-right", otherwise { x, y } in px from top-left
  const [position, setPosition] = useState(null);
  const isDraggingRef = useRef(false);

  const handleResizeStart = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;

    // Get the current rendered position so we can adjust it when resizing from left/top
    const el = e.currentTarget.closest('[data-chatbot-root]');
    const rect = el.getBoundingClientRect();
    const startLeft = rect.left;
    const startTop = rect.top;

    const resizesLeft = direction.includes('left');
    const resizesRight = direction.includes('right');
    const resizesTop = direction.includes('top');
    const resizesBottom = direction.includes('bottom');

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startLeft;
      let newY = startTop;

      if (resizesLeft) {
        newWidth = Math.max(280, Math.min(800, startWidth - dx));
        newX = startLeft + (startWidth - newWidth);
      }
      if (resizesRight) {
        newWidth = Math.max(280, Math.min(800, startWidth + dx));
      }
      if (resizesTop) {
        newHeight = Math.max(200, Math.min(800, startHeight - dy));
        newY = startTop + (startHeight - newHeight);
      }
      if (resizesBottom) {
        newHeight = Math.max(200, Math.min(800, startHeight + dy));
      }

      setDimensions({ width: newWidth, height: newHeight });
      // Always switch to absolute positioning when resizing
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // ── Drag-to-move handler (on header bar) ──────────────────
  const handleDragStart = (e) => {
    // Don't start drag if clicking on buttons
    if (e.target.closest('button')) return;
    e.preventDefault();
    isDraggingRef.current = false;

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;

    // Get current position of the chatbot element
    const el = e.currentTarget.closest('[data-chatbot-root]');
    const rect = el.getBoundingClientRect();
    const startLeft = rect.left;
    const startTop = rect.top;

    const handleMouseMove = (moveEvent) => {
      isDraggingRef.current = true;
      const dx = moveEvent.clientX - startMouseX;
      const dy = moveEvent.clientY - startMouseY;

      // Clamp to viewport
      const maxX = window.innerWidth - 40;
      const maxY = window.innerHeight - 40;
      const newX = Math.max(0, Math.min(maxX, startLeft + dx));
      const newY = Math.max(0, Math.min(maxY, startTop + dy));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      // Reset after a tick so click handlers on children don't fire
      setTimeout(() => { isDraggingRef.current = false; }, 0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOpen, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
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

  if (!isOpen) return null;

  // Compute inline styles for positioning
  const positionStyle = position
    ? { top: `${position.y}px`, left: `${position.x}px`, bottom: 'auto', right: 'auto' }
    : { bottom: '24px', right: '24px', top: 'auto', left: 'auto' };

  return (
    <div 
      data-chatbot-root
      className={`fixed z-50 flex flex-col ${isMinimized ? 'transition-all duration-300' : ''}`}
      style={{
        ...positionStyle,
        width: isMinimized ? '260px' : `${dimensions.width}px`,
        height: isMinimized ? '42px' : `${dimensions.height}px`,
      }}
    >
      {/* Resize handles — all 8 directions (4 edges + 4 corners) */}
      {!isMinimized && (
        <>
          {/* Corners */}
          {[
            { dir: 'top-left',     cursor: 'nwse-resize', top: -4, left: -4, width: 12, height: 12 },
            { dir: 'top-right',    cursor: 'nesw-resize', top: -4, right: -4, width: 12, height: 12 },
            { dir: 'bottom-left',  cursor: 'nesw-resize', bottom: -4, left: -4, width: 12, height: 12 },
            { dir: 'bottom-right', cursor: 'nwse-resize', bottom: -4, right: -4, width: 12, height: 12 },
          ].map(({ dir, cursor, ...pos }) => (
            <div
              key={dir}
              onMouseDown={(e) => handleResizeStart(e, dir)}
              style={{ position: 'absolute', ...pos, cursor, zIndex: 100, background: 'transparent' }}
            />
          ))}
          {/* Edges */}
          {[
            { dir: 'top',    cursor: 'ns-resize',  top: -3, left: 10, right: 10, height: 6 },
            { dir: 'bottom', cursor: 'ns-resize',  bottom: -3, left: 10, right: 10, height: 6 },
            { dir: 'left',   cursor: 'ew-resize',  top: 10, left: -3, bottom: 10, width: 6 },
            { dir: 'right',  cursor: 'ew-resize',  top: 10, right: -3, bottom: 10, width: 6 },
          ].map(({ dir, cursor, ...pos }) => (
            <div
              key={dir}
              onMouseDown={(e) => handleResizeStart(e, dir)}
              style={{ position: 'absolute', ...pos, cursor, zIndex: 99, background: 'transparent' }}
            />
          ))}
        </>
      )}
      <GlassCard className="w-full h-full flex flex-col overflow-hidden border-glass-bright" style={{ boxShadow: '0 8px 24px rgba(124, 58, 237, 0.12)' }}>
        <div 
          onMouseDown={handleDragStart}
          className="flex items-center justify-between shrink-0" 
          style={{ padding: isMinimized ? '6px 10px' : '10px 14px', background: 'rgba(3,2,14,0.03)', borderBottom: isMinimized ? 'none' : '1px solid var(--border-glass)', cursor: 'grab', userSelect: 'none' }}
        >
          <div className="flex items-center gap-2" style={{ overflow: 'hidden', minWidth: 0 }}>
            {!isMinimized && <GripVertical size={12} style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.5 }} />}
            <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/30" style={{ borderColor: 'var(--border-glass-bright)', flexShrink: 0 }}>
              <Bot size={13} style={{ color: 'var(--color-secondary)' }} />
            </div>
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <h3 className="text-[11px] font-bold" style={{ color: 'var(--text-primary)', margin: 0, lineHeight: 1.2, whiteSpace: 'nowrap' }}>LangChain Assistant</h3>
              {!isMinimized && <p className="text-[9px]" style={{ color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap' }}>Drag header to move · Chat with codebase</p>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsMinimized(!isMinimized)} 
              className="text-text-muted hover:text-white p-1 rounded hover:bg-glass"
              style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
            </button>
            <button 
              onClick={onClose} 
              className="text-text-muted hover:text-white p-1 rounded hover:bg-glass"
              style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5" style={{ padding: '12px', background: 'rgba(14,12,45,0.01)' }}>
              {chatMessages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 gap-2.5 text-text-muted" style={{ color: 'var(--text-muted)' }}>
                  <Bot size={28} className="text-secondary opacity-40 animate-pulse" style={{ color: 'var(--color-secondary)' }} />
                  <p className="text-[10.5px] max-w-[240px] leading-relaxed">
                    Ask me anything about repository architecture, schemas, files, or variables.
                  </p>
                  <div className="flex flex-col gap-1.5 mt-1 w-full max-w-[260px]">
                    {[
                      'How is the database structured?',
                      'Explain the code flow in this project.',
                      'Where are the API routing files?'
                    ].map(q => (
                      <button
                        key={q}
                        onClick={() => onSendMessage(q)}
                        className="text-[9.5px] text-left p-1.5 rounded transition-all"
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-glass)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontFamily: 'Inter,sans-serif'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--border-glass-bright)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--border-glass)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                      >
                        "{q}"
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, idx) => {
                const isAI = msg.role === 'assistant';
                return (
                  <div 
                    key={idx} 
                    className={`flex gap-2 max-w-[90%] ${isAI ? 'self-start' : 'self-end flex-row-reverse'}`}
                  >
                    <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center border text-[8px]"
                      style={{
                        background: isAI ? 'rgba(6,182,212,0.1)' : 'rgba(124,58,237,0.1)',
                        borderColor: isAI ? 'rgba(6,182,212,0.2)' : 'rgba(124,58,237,0.2)',
                        color: isAI ? 'var(--color-secondary)' : 'var(--color-primary)',
                        marginTop: '2px'
                      }}
                    >
                      {isAI ? <Bot size={10} /> : <User size={10} />}
                    </div>
                    <div className="leading-relaxed"
                      style={{
                        borderRadius: isAI ? '0px 10px 10px 10px' : '10px 0px 10px 10px',
                        background: isAI ? 'var(--chat-bg-bot)' : 'var(--chat-bg-user)',
                        border: isAI ? '1px solid var(--border-glass)' : 'none',
                        color: isAI ? 'var(--text-secondary)' : '#fff',
                        padding: '6px 10px',
                        fontSize: '11px',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                        maxWidth: '100%',
                      }}
                    >
                      {isAI ? formatMarkdown(msg.content) : msg.content}
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex gap-2 self-start max-w-[85%]">
                  <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center border"
                    style={{
                      background: 'rgba(6,182,212,0.1)',
                      borderColor: 'rgba(6,182,212,0.2)',
                      color: 'var(--color-secondary)',
                      marginTop: '2px'
                    }}
                  >
                    <Bot size={10} />
                  </div>
                  <div className="flex items-center gap-1.5"
                    style={{
                      borderRadius: '0px 10px 10px 10px',
                      background: 'var(--chat-bg-bot)',
                      border: '1px solid var(--border-glass)',
                      color: 'var(--text-muted)',
                      padding: '6px 10px',
                      fontSize: '10.5px'
                    }}
                  >
                    <Loader2 size={11} className="animate-spin" style={{ color: 'var(--color-secondary)' }} />
                    Searching index context...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Send Form */}
            <form onSubmit={handleSubmit} className="flex gap-1.5 shrink-0" style={{ padding: '8px 10px', borderTop: '1px solid var(--border-glass)', background: 'rgba(3,2,14,0.02)' }}>
              <input
                type="text"
                placeholder="Ask LangChain about this repo..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 rounded-md py-1.5 px-3 text-[11px] focus:outline-none transition-colors"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="p-1.5 rounded-md flex items-center justify-center transition-colors disabled:opacity-50 shrink-0"
                style={{ background: 'var(--color-secondary)', cursor: 'pointer', border: 'none' }}
              >
                <Send size={12} style={{ color: '#fff' }} />
              </button>
            </form>
          </>
        )}
      </GlassCard>
    </div>
  );
}
