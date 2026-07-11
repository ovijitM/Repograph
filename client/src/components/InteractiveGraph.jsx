import React, { useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Language Colors
// ─────────────────────────────────────────────────────────────
const LANG_COLORS = {
  'JavaScript': '#f1e05a',
  'JavaScript (JSX)': '#61dafb',
  'TypeScript': '#3178c6',
  'TypeScript (TSX)': '#3178c6',
  'Python': '#4B8BBE',
  'Go': '#00ADD8',
  'Rust': '#dea584',
  'HTML': '#e34c26',
  'CSS': '#563d7c',
  'JSON': '#29beb0',
  'Markdown': '#083fa1',
  'Other': '#6b7280',
};

const LEGEND_LANGS = Object.entries(LANG_COLORS).slice(0, 9);

// ─────────────────────────────────────────────────────────────
// Physics helpers
// ─────────────────────────────────────────────────────────────
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function InteractiveGraph({ nodes, selectedNode, onSelectNode, theme }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Physics state (mutable refs, NOT React state — no re-renders from physics)
  const simRef = useRef({
    nodes: [],
    links: [],
    width: 0,
    height: 0,
    alpha: 1.0,   // simulation "temperature"
  });

  // Interaction state
  const dragRef = useRef(null);  // { node, offsetX, offsetY }
  const panRef = useRef(null);  // { startX, startY, tx, ty }
  const transformRef = useRef({ tx: 0, ty: 0, zoom: 1 });
  const hoveredRef = useRef(null);
  const rafRef = useRef(null);

  // ── Initialise simulation when nodes prop changes ──────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const W = container.clientWidth || 900;
    const H = container.clientHeight || 600;

    simRef.current.width = W;
    simRef.current.height = H;

    // Centre transform
    transformRef.current = { tx: 0, ty: 0, zoom: 1 };

    if (!nodes || nodes.length === 0) {
      simRef.current.nodes = [];
      simRef.current.links = [];
      return;
    }

    // Arrange nodes — wider spread for large graphs to avoid dense clump
    const count = nodes.length;
    const spreadScale = count > 200 ? 0.8 : count > 80 ? 0.5 : 0.3;
    const radius = Math.min(W, H) * spreadScale;

    const sNodes = nodes.map((n, i) => {
      // Use a spiral layout for large graphs for better initial distribution
      const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5°
      const angle = count > 80 ? i * goldenAngle : (2 * Math.PI * i) / count;
      const t = count > 80 ? (i + 0.5) / count : (0.4 + 0.6 * Math.random());
      const r = radius * Math.sqrt(t);  // sqrt for uniform area distribution
      return {
        id: n.path,
        name: n.name,
        language: n.language,
        imports: n.imports || [],
        loc: n.linesOfCode || 0,
        nodeRef: n,
        x: W / 2 + r * Math.cos(angle),
        y: H / 2 + r * Math.sin(angle),
        vx: 0,
        vy: 0,
        radius: clamp(7 + Math.sqrt(n.linesOfCode || 10), 8, 28),
        pinned: false,
      };
    });

    // Build links (only where target exists)
    const idMap = new Map(sNodes.map(n => [n.id, n]));
    const sLinks = [];
    for (const src of sNodes) {
      for (const imp of src.imports) {
        const tgt = idMap.get(imp);
        if (tgt && tgt !== src) sLinks.push({ src, tgt });
      }
    }

    simRef.current.nodes = sNodes;
    simRef.current.links = sLinks;
    simRef.current.alpha = 1.0;
  }, [nodes]);

  // ── Canvas sizing ──────────────────────────────────────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
      simRef.current.width = W;
      simRef.current.height = H;
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [resizeCanvas]);

  // ── Physics tick ───────────────────────────────────────────
  const tick = useCallback(() => {
    const sim = simRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { nodes: sNodes, links, width: W, height: H, alpha } = sim;
    const { tx, ty, zoom } = transformRef.current;
    const ctx = canvas.getContext('2d');

    // ── 1. Physics step (skip if cold) ────────────────────
    if (alpha > 0.005 && sNodes.length > 0) {
      // Scale-adaptive physics: large graphs get gentler forces & stiffer damping
      const N = sNodes.length;
      const isLarge = N > 200;
      const isMedium = N > 80;

      const REPULSION  = isLarge ? 1800 : isMedium ? 2000 : 2200;
      const LINK_SPRING = isLarge ? 0.02 : isMedium ? 0.03 : 0.04;
      const LINK_REST   = isLarge ? 100  : isMedium ? 120  : 140;
      const CENTER_PULL = isLarge ? 0.001 : isMedium ? 0.0015 : 0.002;
      const DAMP        = isLarge ? 0.55  : isMedium ? 0.65  : 0.80;
      const CUT_DIST    = isLarge ? 500  : isMedium ? 700  : 900;
      const MAX_VEL     = isLarge ? 3    : isMedium ? 5    : 10;
      const COOL_RATE   = isLarge ? 0.97 : isMedium ? 0.985 : 0.992;
      const MIN_D2      = isLarge ? 200  : 100; // Floor for d² to prevent force explosions

      const cx = W / 2;
      const cy = H / 2;

      // Repulsion (with distance floor to prevent force explosions)
      for (let i = 0; i < sNodes.length; i++) {
        const a = sNodes[i];
        for (let j = i + 1; j < sNodes.length; j++) {
          const b = sNodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const rawD2 = dx * dx + dy * dy;
          const d2 = Math.max(rawD2, MIN_D2);
          const d = Math.sqrt(d2);

          if (d > CUT_DIST) continue;

          const force = (REPULSION * (a.radius + b.radius)) / d2;
          const fx = (dx / d) * force;
          const fy = (dy / d) * force;

          if (!a.pinned) { a.vx -= fx; a.vy -= fy; }
          if (!b.pinned) { b.vx += fx; b.vy += fy; }
        }
      }

      // Link spring
      for (const { src, tgt } of links) {
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const force = (d - LINK_REST) * LINK_SPRING;
        const fx = (dx / d) * force;
        const fy = (dy / d) * force;
        if (!src.pinned) { src.vx += fx; src.vy += fy; }
        if (!tgt.pinned) { tgt.vx -= fx; tgt.vy -= fy; }
      }

      // Centre gravity + integrate with velocity capping
      for (const n of sNodes) {
        if (n.pinned) continue;
        n.vx += (cx - n.x) * CENTER_PULL;
        n.vy += (cy - n.y) * CENTER_PULL;
        n.vx *= DAMP;
        n.vy *= DAMP;

        // Cap velocity to prevent runaway oscillations
        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (speed > MAX_VEL) {
          n.vx = (n.vx / speed) * MAX_VEL;
          n.vy = (n.vy / speed) * MAX_VEL;
        }

        // Scale displacement by alpha so movements diminish as simulation cools
        n.x += n.vx * alpha;
        n.y += n.vy * alpha;
      }

      // Cool (faster for larger graphs)
      sim.alpha *= COOL_RATE;
    }

    // ── 2. Render ──────────────────────────────────────────
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Read CSS variables for theme-aware colors
    const cssVars = getComputedStyle(document.documentElement);
    const C_BG = cssVars.getPropertyValue('--graph-bg').trim() || '#03020e';
    const C_DOT = cssVars.getPropertyValue('--graph-dot').trim() || 'rgba(255,255,255,0.035)';
    const C_EDGE = cssVars.getPropertyValue('--graph-edge').trim() || (theme === 'light' ? 'rgba(15,23,42,0.16)' : 'rgba(255,255,255,0.18)');
    const C_EDGE_DIM = cssVars.getPropertyValue('--graph-edge-dimmed').trim() || (theme === 'light' ? 'rgba(15,23,42,0.05)' : 'rgba(255,255,255,0.05)');
    const C_LABEL_BG = cssVars.getPropertyValue('--graph-label-bg').trim() || 'rgba(6,5,22,0.82)';
    const C_LABEL_TXT = cssVars.getPropertyValue('--graph-label-color').trim() || 'rgba(241,245,249,0.85)';
    const isLight = theme === 'light';

    // Background
    ctx.fillStyle = C_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dot grid
    const DOT_SPACING = 36;
    ctx.fillStyle = C_DOT;
    for (let gx = DOT_SPACING / 2; gx < canvas.width; gx += DOT_SPACING) {
      for (let gy = DOT_SPACING / 2; gy < canvas.height; gy += DOT_SPACING) {
        ctx.beginPath();
        ctx.arc(gx, gy, 1, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    if (sNodes.length === 0) {
      ctx.fillStyle = 'rgba(100,116,139,0.4)';
      ctx.font = '14px Inter,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No files to display', W / 2, H / 2);
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    ctx.save();
    ctx.translate(tx, ty);
    ctx.scale(zoom, zoom);

    const selId = selectedNode?.path;
    const hovId = hoveredRef.current?.id;

    // ── Draw edges ──────────────────────────────────────
    for (const { src, tgt } of links) {
      const isRelatedToSel = selId && (src.id === selId || tgt.id === selId);
      const isRelatedToHov = hovId && (src.id === hovId || tgt.id === hovId);

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);

      if (selId) {
        if (isRelatedToSel) {
          const c = src.id === selId ? '#f43f5e' : '#06b6d4';
          ctx.strokeStyle = c;
          ctx.lineWidth = 2.0;
          ctx.shadowColor = c;
          ctx.shadowBlur = 6;
        } else if (isRelatedToHov) {
          const c = src.id === hovId ? 'rgba(244,63,94,0.6)' : 'rgba(6,182,212,0.6)';
          ctx.strokeStyle = c;
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 0;
        } else {
          ctx.strokeStyle = C_EDGE_DIM;
          ctx.lineWidth = 0.8;
          ctx.shadowBlur = 0;
        }
      } else if (hovId) {
        if (isRelatedToHov) {
          const c = src.id === hovId ? '#f43f5e' : '#06b6d4';
          ctx.strokeStyle = c;
          ctx.lineWidth = 1.8;
          ctx.shadowColor = c;
          ctx.shadowBlur = 4;
        } else {
          ctx.strokeStyle = C_EDGE_DIM;
          ctx.lineWidth = 0.8;
          ctx.shadowBlur = 0;
        }
      } else {
        ctx.strokeStyle = C_EDGE;
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();

      // Arrowhead
      if (!selId || isRelatedToSel || isRelatedToHov) {
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > tgt.radius + src.radius + 4) {
          const angle = Math.atan2(dy, dx);
          const tx2 = tgt.x - (dx / dist) * (tgt.radius + 3);
          const ty2 = tgt.y - (dy / dist) * (tgt.radius + 3);
          const AL = 7, AW = 4;
          ctx.fillStyle = ctx.strokeStyle;
          ctx.beginPath();
          ctx.moveTo(tx2, ty2);
          ctx.lineTo(tx2 - AL * Math.cos(angle - Math.PI / 6), ty2 - AL * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(tx2 - AL * Math.cos(angle + Math.PI / 6), ty2 - AL * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    ctx.shadowBlur = 0;

    // ── Draw nodes ──────────────────────────────────────
    for (const n of sNodes) {
      const isSelected = selId === n.id;
      const isHovered = hovId === n.id;
      const isRelated = selId && !isSelected &&
        (n.imports.includes(selId) || links.some(l => l.src.id === selId && l.tgt.id === n.id));

      const baseColor = LANG_COLORS[n.language] || LANG_COLORS['Other'];
      let fillColor = baseColor;
      let glowColor = baseColor;
      let glowBlur = 0;
      let alpha = 1;
      const r = isHovered || isSelected ? n.radius + 2 : n.radius;

      if (selId) {
        if (isSelected) { fillColor = '#f43f5e'; glowColor = '#f43f5e'; glowBlur = 28; }
        else if (isRelated) { fillColor = baseColor; glowColor = baseColor; glowBlur = 14; }
        else { alpha = 0.2; fillColor = '#1e293b'; glowBlur = 0; }
      } else if (isHovered) {
        glowColor = '#06b6d4'; glowBlur = 20;
      }

      ctx.globalAlpha = alpha;

      // Outer glow ring for selected/hovered
      if (glowBlur > 0 && alpha > 0.5) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 6, 0, 2 * Math.PI);
        ctx.fillStyle = glowColor + '18';
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = glowBlur * 0.8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Node fill
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, 2 * Math.PI);

      // Radial gradient fill for depth
      const grad = ctx.createRadialGradient(n.x - r * 0.25, n.y - r * 0.25, 0, n.x, n.y, r);
      grad.addColorStop(0, fillColor + 'ff');
      grad.addColorStop(1, fillColor + 'aa');
      ctx.fillStyle = grad;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = glowBlur;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ring border
      ctx.strokeStyle = isSelected ? '#ffffff'
        : isHovered ? '#06b6d4'
          : alpha < 0.5 ? 'rgba(30,41,59,0.6)'
            : baseColor + '55';
      ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1;
      ctx.stroke();

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Label with pill background — only show on hover/select for large graphs
      const showAllLabels = sNodes.length > 200 ? zoom > 2.0 : sNodes.length > 80 ? zoom > 1.2 : zoom > 0.85;
      if (isSelected || isHovered || showAllLabels) {
        const label = n.name.length > 20 ? n.name.slice(0, 18) + '…' : n.name;
        const ly = n.y - r - 8;
        const fontSize = isSelected ? 11 : 10;
        ctx.font = isSelected ? `bold ${fontSize}px Inter,sans-serif` : `${fontSize}px Inter,sans-serif`;
        const tw = ctx.measureText(label).width;

        // Pill bg
        const pw = tw + 10, ph = 14;
        ctx.fillStyle = C_LABEL_BG;
        ctx.beginPath();
        ctx.roundRect(n.x - pw / 2, ly - 11, pw, ph, 5);
        ctx.fill();

        // Text
        ctx.fillStyle = isSelected ? '#f43f5e' : isHovered ? '#06b6d4' : C_LABEL_TXT;
        ctx.textAlign = 'center';
        ctx.shadowColor = isSelected ? '#f43f5e' : isHovered ? '#06b6d4' : 'transparent';
        ctx.shadowBlur = isSelected || isHovered ? 8 : 0;
        ctx.fillText(label, n.x, ly);
        ctx.shadowBlur = 0;
      }
    }

    ctx.restore();

    rafRef.current = requestAnimationFrame(tick);
  }, [selectedNode, theme]);

  // ── Start / stop RAF ──────────────────────────────────────
  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tick]);

  // ── Coordinate conversion ─────────────────────────────────
  const screenToWorld = (clientX, clientY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const { tx, ty, zoom } = transformRef.current;
    return {
      x: (clientX - rect.left - tx) / zoom,
      y: (clientY - rect.top - ty) / zoom,
    };
  };

  const nodeAt = (wx, wy) => {
    const { nodes: sNodes } = simRef.current;
    for (let i = sNodes.length - 1; i >= 0; i--) {
      const n = sNodes[i];
      const dx = n.x - wx;
      const dy = n.y - wy;
      if (dx * dx + dy * dy <= (n.radius + 6) ** 2) return n;
    }
    return null;
  };

  // ── Mouse events ──────────────────────────────────────────
  const onMouseDown = (e) => {
    const w = screenToWorld(e.clientX, e.clientY);
    const n = nodeAt(w.x, w.y);

    if (n) {
      n.pinned = true;
      n.vx = 0;  // Zero velocity to prevent energy injection on pin
      n.vy = 0;
      dragRef.current = { node: n, ox: w.x - n.x, oy: w.y - n.y };
    } else {
      const { tx, ty } = transformRef.current;
      panRef.current = { startX: e.clientX, startY: e.clientY, tx, ty };
    }
  };

  const onMouseMove = (e) => {
    if (dragRef.current) {
      const w = screenToWorld(e.clientX, e.clientY);
      dragRef.current.node.x = w.x - dragRef.current.ox;
      dragRef.current.node.y = w.y - dragRef.current.oy;
      // Gentle, scale-adaptive reheat — don't blast the entire simulation
      const nodeCount = simRef.current.nodes.length;
      const reheat = nodeCount > 200 ? 0.03 : nodeCount > 80 ? 0.08 : 0.25;
      simRef.current.alpha = Math.max(simRef.current.alpha, reheat);
    } else if (panRef.current) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      transformRef.current = {
        ...transformRef.current,
        tx: panRef.current.tx + dx,
        ty: panRef.current.ty + dy,
      };
    } else {
      const w = screenToWorld(e.clientX, e.clientY);
      const h = nodeAt(w.x, w.y);
      if (h !== hoveredRef.current) {
        hoveredRef.current = h;
        canvasRef.current.style.cursor = h ? 'pointer' : 'default';
      }
    }
  };

  const onMouseUp = (e) => {
    if (dragRef.current) {
      const n = dragRef.current.node;
      // If barely moved it was a click — select node
      const w = screenToWorld(e.clientX, e.clientY);
      const moved = Math.abs(w.x - n.x) + Math.abs(w.y - n.y) < 5;
      if (moved) onSelectNode(n.nodeRef);
      n.pinned = false;
      dragRef.current = null;
    }
    panRef.current = null;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.10 : 0.92;
      const { tx, ty, zoom } = transformRef.current;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const newZoom = clamp(zoom * factor, 0.15, 4);
      transformRef.current = {
        tx: mx - (mx - tx) * (newZoom / zoom),
        ty: my - (my - ty) * (newZoom / zoom),
        zoom: newZoom,
      };
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const zoomIn = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { tx, ty, zoom } = transformRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = rect.width / 2;
    const my = rect.height / 2;
    const newZoom = clamp(zoom * 1.25, 0.15, 4);
    transformRef.current = {
      tx: mx - (mx - tx) * (newZoom / zoom),
      ty: my - (my - ty) * (newZoom / zoom),
      zoom: newZoom,
    };
  };

  const zoomOut = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { tx, ty, zoom } = transformRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = rect.width / 2;
    const my = rect.height / 2;
    const newZoom = clamp(zoom / 1.25, 0.15, 4);
    transformRef.current = {
      tx: mx - (mx - tx) * (newZoom / zoom),
      ty: my - (my - ty) * (newZoom / zoom),
      zoom: newZoom,
    };
  };

  const resetZoom = () => {
    transformRef.current = { tx: 0, ty: 0, zoom: 1 };
  };

  // ─────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, background: 'var(--graph-bg)', overflow: 'hidden' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 16, left: 16,
        background: theme === 'light' ? 'rgba(240,244,255,0.88)' : 'rgba(8,7,33,0.78)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border-glass)',
        borderRadius: 12, padding: '10px 14px',
        pointerEvents: 'none', userSelect: 'none',
      }}>
        <div style={{ color: 'var(--text-primary)', fontSize: 10, fontWeight: 700, marginBottom: 6, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
          Language
        </div>
        {LEGEND_LANGS.map(([lang, color]) => (
          <div key={lang} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0, boxShadow: `0 0 5px ${color}60` }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{lang}</span>
          </div>
        ))}
      </div>

      {/* Controls hint */}
      <div style={{
        position: 'absolute', top: 12, right: 12,
        background: theme === 'light' ? 'rgba(240,244,255,0.8)' : 'rgba(8,7,33,0.65)',
        border: '1px solid var(--border-glass)',
        borderRadius: 8, padding: '4px 10px',
        color: 'var(--text-muted)', fontSize: 10, pointerEvents: 'none', userSelect: 'none',
      }}>
        🖱 Scroll=Zoom · Drag=Pan · Click node=Inspect
      </div>

      {/* Floating Zoom Controls */}
      <div style={{
        position: 'absolute', bottom: 16, right: 16,
        display: 'flex', flexDirection: 'column', gap: 6,
        zIndex: 10,
      }}>
        <button
          onClick={zoomIn}
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: theme === 'light' ? 'rgba(240,244,255,0.9)' : 'rgba(8,7,33,0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', outline: 'none', transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            padding: 0
          }}
          title="Zoom In"
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-secondary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-glass)'; }}
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={zoomOut}
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: theme === 'light' ? 'rgba(240,244,255,0.9)' : 'rgba(8,7,33,0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', outline: 'none', transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            padding: 0
          }}
          title="Zoom Out"
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-secondary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-glass)'; }}
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={resetZoom}
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: theme === 'light' ? 'rgba(240,244,255,0.9)' : 'rgba(8,7,33,0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', outline: 'none', transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            padding: 0
          }}
          title="Reset Zoom & Center"
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-secondary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-glass)'; }}
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
