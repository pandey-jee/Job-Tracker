import { useState } from 'react';
import { toast } from 'react-toastify';
import { X, GitBranch, FileText, Image } from 'lucide-react';
import MermaidChart from './MermaidChart';
import { exportSvgToPDF, exportSvgToPNG, getMermaidSvgElement } from '../utils/pdfExport';

interface FlowchartModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  mermaidCode: string;
}

export default function FlowchartModal({
  isOpen,
  onClose,
  title,
  description,
  mermaidCode,
}: FlowchartModalProps) {
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingPNG, setExportingPNG] = useState(false);

  if (!isOpen) return null;

  const downloadPNG = async () => {
    const svgElem = (document.querySelector('.modal-flowchart-container .mermaid-rendered-diagram svg, .modal-flowchart-container svg[id^="mermaid-"]') || getMermaidSvgElement()) as SVGElement;
    if (!svgElem) {
      toast.error('Diagram image not ready yet.');
      return;
    }
    setExportingPNG(true);
    try {
      await exportSvgToPNG(svgElem, title);
      toast.success('Flowchart PNG downloaded!');
    } catch (err) {
      toast.error('Failed to export PNG.');
    } finally {
      setExportingPNG(false);
    }
  };

  const downloadPDF = async () => {
    const svgElem = (document.querySelector('.modal-flowchart-container .mermaid-rendered-diagram svg, .modal-flowchart-container svg[id^="mermaid-"]') || getMermaidSvgElement()) as SVGElement;
    if (!svgElem) {
      toast.error('Diagram not rendered yet.');
      return;
    }
    setExportingPDF(true);
    try {
      await exportSvgToPDF(svgElem, title, title);
      toast.success('Flowchart PDF downloaded!');
    } catch (err) {
      toast.error('Failed to export PDF.');
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal modal-flowchart-container"
        style={{
          maxWidth: '92vw',
          width: '1200px',
          height: '88vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '1rem',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1rem 1.75rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'rgba(59,130,246,0.15)',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              color: 'var(--accent-color)',
              display: 'flex'
            }}>
              <GitBranch size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {title}
              </h2>
              {description && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  {description}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={downloadPDF}
              disabled={exportingPDF}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
              title="Download high-resolution PDF"
            >
              <FileText size={14} /> {exportingPDF ? 'Exporting...' : 'PDF'}
            </button>
            <button
              onClick={downloadPNG}
              disabled={exportingPNG}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
              title="Download High-Resolution PNG Image"
            >
              <Image size={14} /> {exportingPNG ? 'Saving...' : 'PNG'}
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.6rem' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Chart Viewport */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <MermaidChart
            chart={mermaidCode}
            interactive={true}
          />
        </div>
      </div>
    </div>
  );
}
