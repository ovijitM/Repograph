import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import mermaid from 'mermaid';

// Initialize mermaid once globally with base settings
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
});

// Pre-sanitize raw LLM-generated Mermaid syntax to prevent compiler parsing exceptions.
// Works line-by-line: actively repairs edge lines with bad pipe-labels, and
// quotes bare node labels. Never corrupts valid Mermaid syntax.
const sanitizeMermaidCode = (rawCode) => {
  if (!rawCode) return '';

  // Strip leading/trailing markdown code fences if accidentally included
  let sanitized = rawCode.trim();
  if (sanitized.startsWith('```')) {
    sanitized = sanitized.replace(/^```(?:mermaid)?\s*/i, '').replace(/```\s*$/, '').trim();
  }

  const KEYWORD_LINES = /^\s*(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|gitGraph|pie|mindmap|timeline|subgraph|end|direction|note|participant|actor|loop|alt|else|opt|par|critical|break|rect|activate|deactivate|autonumber)\b/i;

  // Sanitize the content of a pipe-label: strip quotes, brackets, parens
  const cleanPipeLabel = (label) => {
    return label
      .replace(/["""''`]/g, '')           // strip all quote chars
      .replace(/[\[\]\(\)\{\}]/g, '')     // strip brackets and parens
      .replace(/[^a-zA-Z0-9 _\-\.\/]/g, '') // only safe printable chars
      .trim()
      .substring(0, 30);                  // truncate long labels
  };

  // Actively repair an edge/connection line
  const fixEdgeLine = (line) => {
    // 1. Remove ALL pipe-labels from <--> bidirectional arrows (not reliably supported)
    line = line.replace(/<-->\s*\|[^|]*\|/g, '<-->');
    // Also handle unclosed pipe after <--> (e.g. <-->| "label..." with no closing |)
    line = line.replace(/<-->\s*\|[^|\n]*$/g, '<-->');

    // 2. Sanitize content in closed pipe-labels for regular arrows: -->|label|
    line = line.replace(/(--[->xoX]?|==+>?|\.->?)\s*\|([^|\n]+)\|/g, (match, arrow, label) => {
      const clean = cleanPipeLabel(label);
      return clean ? `${arrow}|${clean}|` : arrow;
    });

    // 3. Remove unclosed pipe-labels (| text with no closing |) — the main crash source
    line = line.replace(/(--[->xoX]?|==+>?|\.->?)\s*\|([^|\n]*)$/g, (match, arrow) => arrow);

    return line;
  };

  const lines = sanitized.split('\n');
  const fixedLines = lines.map(line => {
    if (!line.trim() || line.trim().startsWith('%%')) return line;
    if (KEYWORD_LINES.test(line)) return line;

    // If it's an edge/connection line — repair it, don't skip it
    if (/-->|---|->|->>|<-->|==|~~>/.test(line)) {
      return fixEdgeLine(line);
    }

    // Pure node definition lines: quote any unquoted square-bracket labels
    return line.replace(/\b(\w[\w.-]*)\s*\[([^\]"]+)\]/g, (match, nodeId, label) => {
      const trimmed = label.trim();
      if (!trimmed) return match;
      const escaped = trimmed.replace(/"/g, "'");
      return `${nodeId}["${escaped}"]`;
    });
  });

  return fixedLines.join('\n');
};

export default function MermaidDiagram({ code, theme, clickable = true }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    let active = true;
    setError(null);

    // Generate a unique ID specifically for this rendering task execution
    const renderId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

    // Resolve color variables dynamically from active document theme styles
    const rootStyle = getComputedStyle(document.documentElement);
    const primaryColor = rootStyle.getPropertyValue('--color-primary').trim() || '#7c3aed';
    const secondaryColor = rootStyle.getPropertyValue('--color-secondary').trim() || '#06b6d4';

    // Re-initialize mermaid with the active application theme
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'light' ? 'default' : 'dark',
      securityLevel: 'loose',
      themeVariables: {
        background: 'transparent',
        primaryColor: primaryColor,
        secondaryColor: secondaryColor,
      }
    });

    const renderDiagram = async () => {
      try {
        const sanitizedCode = sanitizeMermaidCode(code);
        // Validate syntax first to prevent internal rendering crashes on invalid syntax
        await mermaid.parse(sanitizedCode);

        const { svg: renderedSvg } = await mermaid.render(renderId, sanitizedCode);
        if (active) {
          setSvg(renderedSvg);
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (active) {
          setError(err.message || 'Failed to render Mermaid diagram');
        }
      } finally {
        // Clean up temporary DOM elements created by mermaid
        const tempEl = document.getElementById(renderId);
        if (tempEl) tempEl.remove();
        const bindEl = document.getElementById(`d${renderId}`);
        if (bindEl) bindEl.remove();
      }
    };

    renderDiagram();

    return () => {
      active = false;
      const tempEl = document.getElementById(renderId);
      if (tempEl) tempEl.remove();
      const bindEl = document.getElementById(`d${renderId}`);
      if (bindEl) bindEl.remove();
    };
  }, [code, theme]);

  if (error) {
    return (
      <pre className="code-block font-mono my-1 text-[9.5px]" style={{ background: 'var(--code-bg)', border: '1px solid rgba(248,113,113,0.3)', padding: '8px 10px', borderRadius: '6px', whiteSpace: 'pre-wrap', color: '#f87171' }}>
        <code>{code}

// Diagram Render Error:
// {error}</code>
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center p-4 text-[10px] text-text-muted animate-pulse" style={{ color: 'var(--text-muted)' }}>
        Generating diagram...
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes mermaidFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes mermaidScaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .mermaid-svg-container svg {
          max-width: 100% !important;
          height: auto !important;
        }
        .mermaid-expanded-container svg {
          max-width: 100% !important;
          max-height: 70vh !important;
          height: auto !important;
        }
      `}</style>

      <div
        onClick={() => clickable && setIsModalOpen(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: '100%',
          position: 'relative',
          cursor: clickable ? 'pointer' : 'default',
          margin: '8px 0'
        }}
      >
        <div
          className="mermaid-svg-container"
          style={{
            width: '100%',
            overflowX: 'auto',
            display: 'flex',
            justifyContent: 'center',
            padding: '12px',
            background: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.01)',
            border: '1px solid var(--border-glass)',
            borderRadius: '6px',
            transition: 'border-color 0.2s, background-color 0.2s',
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        {/* Subtle magnifying hover overlay */}
        {clickable && hovered && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(15, 14, 46, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '9px',
            color: '#fff',
            pointerEvents: 'none',
            animation: 'mermaidFadeIn 0.15s ease-out',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            zIndex: 10
          }}>
            🔍 Click to expand
          </div>
        )}
      </div>

      {/* Expanded Modal Overlay */}
      {clickable && isModalOpen && createPortal(
        <div
          onClick={() => setIsModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: theme === 'light' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(8, 7, 33, 0.92)',
            backdropFilter: 'blur(20px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'mermaidFadeIn 0.25s ease-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '90vw',
              maxHeight: '90vh',
              background: theme === 'light' ? 'rgba(240, 244, 255, 0.98)' : 'rgba(15, 14, 46, 0.85)',
              border: '1px solid var(--border-glass)',
              borderRadius: '16px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              animation: 'mermaidScaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              borderBottom: '1px solid var(--border-glass)',
              paddingBottom: '12px'
            }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '15px', fontWeight: 700 }}>
                Architecture Flow / Diagram Detail
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s',
                  lineHeight: 1
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              >
                ✕
              </button>
            </div>

            {/* Modal Diagram Body */}
            <div
              className="mermaid-expanded-container"
              style={{
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '24px',
                background: 'rgba(0,0,0,0.15)',
                borderRadius: '8px',
              }}
            >
              <MermaidDiagram code={code} theme={theme} clickable={false} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
