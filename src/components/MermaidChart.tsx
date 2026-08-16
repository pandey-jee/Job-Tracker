import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, RotateCcw, Copy, Check, Move } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: 'transparent',
    primaryColor: '#1e3a8a',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#3b82f6',
    lineColor: '#60a5fa',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
    mainBkg: '#0f172a',
    nodeBorder: '#3b82f6',
    clusterBkg: 'rgba(30, 41, 59, 0.4)',
    clusterBorder: '#475569',
    edgeLabelBackground: '#0f172a',
    nodeTextColor: '#f8fafc',
  },
  flowchart: { curve: 'basis', htmlLabels: true, padding: 16 },
  sequence: { actorMargin: 50 },
  securityLevel: 'loose',
});

interface MermaidChartProps {
  chart: string;
  interactive?: boolean;
  onNodeClick?: (nodeLabel: string) => void;
}

function sanitizeMermaid(raw: string): string {
  if (!raw) return 'graph TD\n  Empty[No diagram code provided]';

  let cleaned = raw.trim()
    .replace(/^```(mermaid|flowchart)?\n?/i, '')
    .replace(/```$/, '')
    .trim();

  if (!/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph)/m.test(cleaned)) {
    cleaned = 'graph TD\n' + cleaned;
  }

  cleaned = cleaned.replace(/\[([^"\]\n]*[\(\)\/\:\,\&\#\-\@\%\$\!\?][^"\]\n]*)\]/g, (match, inner) => {
    if (inner.startsWith('"') && inner.endsWith('"')) return match;
    const safeInner = inner.replace(/"/g, "'");
    return `["${safeInner}"]`;
  });

  cleaned = cleaned.replace(/\|([^"\|\n]*[\(\)\/\:\,\&\#\@\%\$\!\?][^"\|\n]*)\|/g, (match, inner) => {
    if (inner.startsWith('"') && inner.endsWith('"')) return match;
    const safeInner = inner.replace(/"/g, "'");
    return `|"${safeInner}"|`;
  });

  return cleaned;
}

export default function MermaidChart({
  chart,
  interactive = true,
  onNodeClick,
}: MermaidChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset zoom & pan whenever the chart data changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [chart]);

  useEffect(() => {
    let isMounted = true;
    setError(null);

    const renderChart = async () => {
      try {
        const sanitized = sanitizeMermaid(chart);
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, sanitized);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        if (isMounted) {
          setError(err?.message || 'Failed to render flowchart');
        }
      }
    };

    renderChart();
    return () => {
      isMounted = false;
    };
  }, [chart]);

  // Bind single-click handlers to diagram nodes if provided
  useEffect(() => {
    if (!svgContent || !containerRef.current || !onNodeClick) return;

    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) return;

    const nodes = svgElement.querySelectorAll('.node');
    nodes.forEach(node => {
      (node as HTMLElement).style.cursor = 'pointer';
      
      const handleClick = (e: Event) => {
        e.stopPropagation();
        const textContent = node.textContent?.trim().replace(/\s+/g, ' ') || '';
        if (textContent && onNodeClick) {
          onNodeClick(textContent);
        }
      };

      node.addEventListener('click', handleClick);
    });
  }, [svgContent, onNodeClick]);

  // Freehand Pan / Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.node') || (e.target as HTMLElement).closest('button')) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Multi-Touch Handlers for Mobile (Pan + Pinch Zoom + Double Tap)
  const touchState = useRef<{
    isPinching: boolean;
    initialDistance: number;
    initialZoom: number;
    lastTap: number;
    touchStartPan: { x: number; y: number };
    touchStartPoint: { x: number; y: number };
  }>({
    isPinching: false,
    initialDistance: 0,
    initialZoom: 1,
    lastTap: 0,
    touchStartPan: { x: 0, y: 0 },
    touchStartPoint: { x: 0, y: 0 },
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!interactive) return;

    if (e.touches.length === 1) {
      const now = Date.now();
      const lastTap = touchState.current.lastTap;

      // Double tap to toggle zoom
      if (now - lastTap < 300) {
        setZoom(prev => (prev > 1.1 ? 1.0 : 1.6));
        touchState.current.lastTap = 0;
        return;
      }
      touchState.current.lastTap = now;

      // Single finger drag
      setIsDragging(true);
      touchState.current.isPinching = false;
      touchState.current.touchStartPan = { ...pan };
      touchState.current.touchStartPoint = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      setIsDragging(false);
      touchState.current.isPinching = true;
      const x1 = e.touches[0].clientX;
      const y1 = e.touches[0].clientY;
      const x2 = e.touches[1].clientX;
      const y2 = e.touches[1].clientY;
      touchState.current.initialDistance = Math.hypot(x2 - x1, y2 - y1);
      touchState.current.initialZoom = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!interactive) return;

    if (e.touches.length === 1 && !touchState.current.isPinching && isDragging) {
      const dx = e.touches[0].clientX - touchState.current.touchStartPoint.x;
      const dy = e.touches[0].clientY - touchState.current.touchStartPoint.y;
      setPan({
        x: touchState.current.touchStartPan.x + dx,
        y: touchState.current.touchStartPan.y + dy,
      });
    } else if (e.touches.length === 2 && touchState.current.isPinching) {
      const x1 = e.touches[0].clientX;
      const y1 = e.touches[0].clientY;
      const x2 = e.touches[1].clientX;
      const y2 = e.touches[1].clientY;
      const currentDistance = Math.hypot(x2 - x1, y2 - y1);

      if (touchState.current.initialDistance > 0) {
        const factor = currentDistance / touchState.current.initialDistance;
        const newZoom = Math.min(Math.max(touchState.current.initialZoom * factor, 0.3), 3.5);
        setZoom(newZoom);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchState.current.isPinching = false;
  };

  // Mouse wheel zoom attached with non-passive listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !interactive) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom(prev => Math.min(Math.max(prev * zoomFactor, 0.3), 3.0));
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [interactive]);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(chart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {interactive && (
        <div
          className="diagram-controls-bar"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            padding: '0.35rem 0.5rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border-color)',
          }}
        >
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0 0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Move size={12} /> Drag to pan
          </span>
          <div style={{ width: '1px', height: '14px', background: 'var(--border-color)', margin: '0 0.2rem' }} />
          <button
            onClick={() => setZoom(z => Math.min(z + 0.2, 3.0))}
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.45rem', fontSize: '0.75rem' }}
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z - 0.2, 0.3))}
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.45rem', fontSize: '0.75rem' }}
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={resetView}
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.45rem', fontSize: '0.75rem' }}
            title="Reset view"
          >
            <RotateCcw size={14} />
          </button>
          <div style={{ width: '1px', height: '14px', background: 'var(--border-color)', margin: '0 0.2rem' }} />
          <button
            onClick={copyCode}
            className="btn btn-secondary"
            style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', gap: '0.25rem' }}
            title="Copy Mermaid Code"
          >
            {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Code'}
          </button>
        </div>
      )}

      {/* Diagram Render Canvas */}
      <div
        ref={containerRef}
        className="mermaid-rendered-diagram"
        onMouseDown={interactive ? handleMouseDown : undefined}
        onMouseMove={interactive ? handleMouseMove : undefined}
        onMouseUp={interactive ? handleMouseUp : undefined}
        onMouseLeave={interactive ? handleMouseUp : undefined}
        onTouchStart={interactive ? handleTouchStart : undefined}
        onTouchMove={interactive ? handleTouchMove : undefined}
        onTouchEnd={interactive ? handleTouchEnd : undefined}
        onTouchCancel={interactive ? handleTouchEnd : undefined}
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: interactive ? (isDragging ? 'grabbing' : 'grab') : 'default',
          overflow: 'hidden',
          userSelect: 'none',
          touchAction: 'none',
        }}
      >
        {error ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger-color)' }}>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Failed to render diagram</p>
            <pre style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem', maxWidth: '600px', overflowX: 'auto' }}>
              {error}
            </pre>
          </div>
        ) : (
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>
    </div>
  );
}
