import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../api/client';
import MermaidChart from '../components/MermaidChart';
import FlowchartModal from '../components/FlowchartModal';
import { exportSvgToPDF, exportSvgToPNG, getMermaidSvgElement } from '../utils/pdfExport';
import {
  GitBranch, Sparkles, Trash2, Edit2, Maximize2, Search,
  X, CheckCircle2, FileText, Image, ArrowLeft, MoreVertical
} from 'lucide-react';

interface FlowchartItem {
  id: string;
  title: string;
  description: string;
  mermaid_code: string;
  created_at: string;
}

export default function FlowchartHub() {
  const [flowcharts, setFlowcharts] = useState<FlowchartItem[]>([]);
  const [selectedFlowchart, setSelectedFlowchart] = useState<FlowchartItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingPNG, setDownloadingPNG] = useState(false);

  // Mobile Menu & Full Title Modal states
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFullTitleModal, setShowFullTitleModal] = useState(false);

  // Rename modal states
  const [editingFlowchart, setEditingFlowchart] = useState<FlowchartItem | null>(null);
  const [renameTitle, setRenameTitle] = useState('');

  // Modal States
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [topic, setTopic] = useState('');
  const [extraContext, setExtraContext] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showPopupModal, setShowPopupModal] = useState(false);

  const fetchFlowcharts = async () => {
    try {
      const res = await apiClient.get('/flowcharts');
      setFlowcharts(res.data);
    } catch (err) {
      console.error('Error loading flowcharts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlowcharts();
  }, []);

  const toggleSelectFlowchart = (fc: FlowchartItem) => {
    if (selectedFlowchart?.id === fc.id) {
      setSelectedFlowchart(null); // Deselect
    } else {
      setSelectedFlowchart(fc); // Select
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setGenerating(true);

    try {
      const res = await apiClient.post('/ai/generate-flowchart', {
        topic: topic.trim(),
        description: extraContext.trim(),
      });
      const newFc = res.data;
      setFlowcharts([newFc, ...flowcharts]);
      setSelectedFlowchart(newFc);
      setShowGenerateModal(false);
      setTopic('');
      setExtraContext('');
      toast.success(`Generated flowchart: "${newFc.title}"`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to generate flowchart.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlowchart || !renameTitle.trim()) return;

    try {
      const res = await apiClient.put(`/flowcharts/${editingFlowchart.id}`, {
        title: renameTitle.trim(),
      });
      const updated = flowcharts.map(f => f.id === editingFlowchart.id ? { ...f, title: res.data.title } : f);
      setFlowcharts(updated);
      if (selectedFlowchart?.id === editingFlowchart.id) {
        setSelectedFlowchart(prev => prev ? { ...prev, title: res.data.title } : null);
      }
      setEditingFlowchart(null);
      toast.success('Flowchart renamed successfully!');
    } catch (err) {
      toast.error('Failed to rename flowchart.');
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this flowchart?')) return;

    try {
      await apiClient.delete(`/flowcharts/${id}`);
      const updated = flowcharts.filter(f => f.id !== id);
      setFlowcharts(updated);
      if (selectedFlowchart?.id === id) {
        setSelectedFlowchart(null);
      }
      toast.success('Flowchart deleted.');
    } catch (err) {
      toast.error('Failed to delete flowchart.');
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedFlowchart) return;
    const svgElem = (document.querySelector('.main-view-canvas .mermaid-rendered-diagram svg, .main-view-canvas svg[id^="mermaid-"]') || getMermaidSvgElement()) as SVGElement;
    if (!svgElem) {
      toast.error('Diagram not rendered yet.');
      return;
    }
    setDownloadingPDF(true);
    try {
      await exportSvgToPDF(svgElem, selectedFlowchart.title, selectedFlowchart.title);
      toast.success('Flowchart PDF exported!');
    } catch (err) {
      toast.error('Failed to export PDF.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleDownloadPNG = async () => {
    if (!selectedFlowchart) return;
    const svgElem = (document.querySelector('.main-view-canvas .mermaid-rendered-diagram svg, .main-view-canvas svg[id^="mermaid-"]') || getMermaidSvgElement()) as SVGElement;
    if (!svgElem) {
      toast.error('Diagram image not rendered yet.');
      return;
    }
    setDownloadingPNG(true);
    try {
      await exportSvgToPNG(svgElem, selectedFlowchart.title);
      toast.success('Flowchart PNG downloaded!');
    } catch (err) {
      toast.error('Failed to export PNG.');
    } finally {
      setDownloadingPNG(false);
    }
  };

  const filteredFlowcharts = flowcharts.filter(f =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flowchart-hub-container" style={{ display: 'flex', height: 'calc(100vh - 60px)', width: '100%', overflow: 'hidden', position: 'relative' }}>

      {/* Left Sidebar List */}
      <div className={`flowchart-sidebar ${selectedFlowchart ? 'mobile-hide' : ''}`} style={{
        width: '320px',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--kanban-col-bg)',
        flexShrink: 0,
      }}>
        {/* Top Actions & Search */}
        <div style={{ padding: '1rem 0.85rem', borderBottom: '1px solid var(--border-color)' }}>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', padding: '0.6rem' }}
          >
            <Sparkles size={16} /> Generate Flowchart
          </button>

          {/* Search Box */}
          <div style={{ position: 'relative', marginTop: '0.65rem' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter diagrams..."
              style={{ width: '100%', paddingLeft: '2rem', paddingRight: '0.75rem', fontSize: '0.8rem', height: '34px' }}
            />
          </div>
        </div>

        {/* Library Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.85rem 0.35rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Diagrams ({filteredFlowcharts.length})
          </span>
          {selectedFlowchart && (
            <button
              onClick={() => setSelectedFlowchart(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-color)',
                fontSize: '0.72rem',
                cursor: 'pointer',
                fontWeight: 600,
                padding: 0,
              }}
            >
              Clear Selection
            </button>
          )}
        </div>

        {/* Clean, Uniform Cards List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.4rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.85rem' }}>
              Loading diagrams...
            </p>
          ) : filteredFlowcharts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.85rem' }}>No flowcharts found.</p>
            </div>
          ) : (
            filteredFlowcharts.map((fc) => {
              const isSelected = selectedFlowchart?.id === fc.id;
              return (
                <div
                  key={fc.id}
                  onClick={() => toggleSelectFlowchart(fc)}
                  style={{
                    padding: '0.7rem 0.85rem',
                    borderRadius: '0.5rem',
                    border: isSelected ? '1px solid rgba(59, 130, 246, 0.6)' : '1px solid var(--border-color)',
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--card-bg)',
                    boxShadow: isSelected ? '0 0 10px rgba(59, 130, 246, 0.2)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                    margin: 0,
                  }}
                >
                  <div style={{ flex: 1, overflow: 'hidden', paddingRight: '0.5rem' }}>
                    <h3 style={{
                      fontSize: '0.86rem',
                      fontWeight: isSelected ? 700 : 600,
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      margin: '0 0 0.15rem 0',
                    }}>
                      {fc.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(fc.created_at).toLocaleDateString()}
                      </span>
                      {isSelected && (
                        <span style={{
                          fontSize: '0.65rem',
                          color: '#10b981',
                          fontWeight: 700,
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          padding: '0.1rem 0.35rem',
                          borderRadius: '0.25rem',
                        }}>
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem' }} onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => { setEditingFlowchart(fc); setRenameTitle(fc.title); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                      title="Rename"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(fc.id, e)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', padding: '0.25rem', opacity: 0.8 }}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main View Area */}
      <div className={`flowchart-viewer ${!selectedFlowchart ? 'mobile-hide' : ''}`} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', overflow: 'hidden', position: 'relative' }}>
        {selectedFlowchart ? (
          <>
            {/* Topbar */}
            <div className="flowchart-viewer-topbar">
              {/* DESKTOP HEADER (>= 769px) */}
              <div className="desktop-header-controls">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1, paddingRight: '1rem' }}>
                  <button
                    onClick={() => setSelectedFlowchart(null)}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', gap: '0.3rem', flexShrink: 0 }}
                    title="Back to diagrams list"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h1 style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        margin: 0,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {selectedFlowchart.title}
                      </h1>
                      <span style={{
                        fontSize: '0.7rem',
                        color: '#10b981',
                        fontWeight: 600,
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '9999px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}>
                        <CheckCircle2 size={12} /> Selected
                      </span>
                    </div>
                    {selectedFlowchart.description && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedFlowchart.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Direct Action Buttons on Desktop */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPDF}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', gap: '0.3rem' }}
                    title="Download Flowchart PDF"
                  >
                    <FileText size={13} /> {downloadingPDF ? 'Exporting...' : 'PDF'}
                  </button>

                  <button
                    onClick={handleDownloadPNG}
                    disabled={downloadingPNG}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', gap: '0.3rem' }}
                    title="Download High-Resolution PNG Image"
                  >
                    <Image size={13} /> {downloadingPNG ? 'Saving...' : 'PNG'}
                  </button>

                  <button
                    onClick={() => { setEditingFlowchart(selectedFlowchart); setRenameTitle(selectedFlowchart.title); }}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', gap: '0.3rem' }}
                  >
                    <Edit2 size={13} /> Rename
                  </button>

                  <button
                    onClick={() => handleDelete(selectedFlowchart.id)}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', gap: '0.3rem', color: 'var(--danger-color)' }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>

                  <button
                    onClick={() => setShowPopupModal(true)}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', gap: '0.3rem' }}
                  >
                    <Maximize2 size={13} /> Fullscreen
                  </button>
                </div>
              </div>

              {/* MOBILE HEADER (<= 768px): [← Back] | [Truncated Title (tap)] | [⋮] */}
              <div className="mobile-header-controls">
                <button
                  onClick={() => setSelectedFlowchart(null)}
                  className="flowchart-mobile-back-btn"
                  title="Back to diagrams"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                {/* Shortened clickable title */}
                <button
                  onClick={() => setShowFullTitleModal(true)}
                  className="flowchart-mobile-title-btn"
                  title="Tap to view full name"
                >
                  {selectedFlowchart.title}
                </button>

                {/* Subtle Transparent ⋮ Menu Button */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button
                    onClick={() => setShowMobileMenu(m => !m)}
                    className="flowchart-mobile-menu-btn"
                    title="More actions"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* Mobile Dropdown Menu */}
                  {showMobileMenu && (
                    <>
                      <div
                        onClick={() => setShowMobileMenu(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                      />
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 6px)',
                        background: '#11141c',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.65rem',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
                        padding: '0.35rem',
                        minWidth: '150px',
                        zIndex: 95,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.2rem',
                      }}>
                        <button
                          onClick={() => { setShowMobileMenu(false); handleDownloadPDF(); }}
                          disabled={downloadingPDF}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.5rem 0.75rem', background: 'none', border: 'none',
                            color: 'var(--text-primary)', fontSize: '0.82rem', borderRadius: '0.4rem',
                            cursor: 'pointer', textAlign: 'left', width: '100%',
                          }}
                        >
                          <FileText size={14} /> {downloadingPDF ? 'Exporting...' : 'PDF'}
                        </button>
                        <button
                          onClick={() => { setShowMobileMenu(false); handleDownloadPNG(); }}
                          disabled={downloadingPNG}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.5rem 0.75rem', background: 'none', border: 'none',
                            color: 'var(--text-primary)', fontSize: '0.82rem', borderRadius: '0.4rem',
                            cursor: 'pointer', textAlign: 'left', width: '100%',
                          }}
                        >
                          <Image size={14} /> {downloadingPNG ? 'Saving...' : 'PNG'}
                        </button>
                        <button
                          onClick={() => {
                            setShowMobileMenu(false);
                            setEditingFlowchart(selectedFlowchart);
                            setRenameTitle(selectedFlowchart.title);
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.5rem 0.75rem', background: 'none', border: 'none',
                            color: 'var(--text-primary)', fontSize: '0.82rem', borderRadius: '0.4rem',
                            cursor: 'pointer', textAlign: 'left', width: '100%',
                          }}
                        >
                          <Edit2 size={14} /> Rename
                        </button>
                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.2rem 0' }} />
                        <button
                          onClick={() => { setShowMobileMenu(false); handleDelete(selectedFlowchart.id); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.5rem 0.75rem', background: 'none', border: 'none',
                            color: 'var(--danger-color)', fontSize: '0.82rem', borderRadius: '0.4rem',
                            cursor: 'pointer', textAlign: 'left', width: '100%',
                          }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mermaid Canvas */}
            <div className="main-view-canvas" style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
              <MermaidChart
                chart={selectedFlowchart.mermaid_code}
                interactive={true}
              />
            </div>
          </>
        ) : (
          /* Unselected / Empty State Hero View */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.01)',
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '1rem',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-color)',
              marginBottom: '1.25rem',
            }}>
              <GitBranch size={32} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              No Flowchart Selected
            </h2>
            <p style={{ maxWidth: '440px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              Select a system diagram from your library on the left to pan, zoom, and export. Or generate a new architecture diagram with AI below.
            </p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
            >
              <Sparkles size={16} /> Generate Flowchart with AI
            </button>
          </div>
        )}
      </div>

      {/* Rename Flowchart Modal */}
      {editingFlowchart && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div className="modal-header" style={{ margin: 0 }}>Rename Flowchart</div>
              <button onClick={() => setEditingFlowchart(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleRename}>
              <input
                required
                className="input"
                value={renameTitle}
                onChange={e => setRenameTitle(e.target.value)}
                style={{ marginBottom: '1.25rem', width: '100%' }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingFlowchart(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Flowchart Modal */}
      {showGenerateModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} style={{ color: 'var(--accent-color)' }} />
                <h2 className="modal-header" style={{ margin: 0 }}>Generate AI Flowchart</h2>
              </div>
              <button onClick={() => setShowGenerateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>System / Workflow Topic</label>
                <input
                  required
                  className="input"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Distributed Task Queue, URL Shortener, OAuth2 Flow"
                  style={{ width: '100%' }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Additional Context / Requirements (Optional)</label>
                <textarea
                  className="input"
                  rows={3}
                  value={extraContext}
                  onChange={e => setExtraContext(e.target.value)}
                  placeholder="e.g. Highlight Redis caching, worker retry loops, and PostgreSQL write replication"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={generating || !topic.trim()}>
                  {generating ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                      Generating Architecture...
                    </span>
                  ) : (
                    'Generate Flowchart'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Title Details Modal for Mobile */}
      {showFullTitleModal && selectedFlowchart && (
        <div className="modal-overlay" onClick={() => setShowFullTitleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GitBranch size={20} style={{ color: 'var(--accent-color)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Architecture Diagram
                </span>
              </div>
              <button
                onClick={() => setShowFullTitleModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={18} />
              </button>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.6rem', lineHeight: 1.4 }}>
              {selectedFlowchart.title}
            </h2>

            {selectedFlowchart.description ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                {selectedFlowchart.description}
              </p>
            ) : (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                No extra description provided.
              </p>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-color)',
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Created: {new Date(selectedFlowchart.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <button
                className="btn btn-primary"
                onClick={() => setShowFullTitleModal(false)}
                style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Popup Modal */}
      {showPopupModal && selectedFlowchart && (
        <FlowchartModal
          isOpen={showPopupModal}
          onClose={() => setShowPopupModal(false)}
          title={selectedFlowchart.title}
          description={selectedFlowchart.description}
          mermaidCode={selectedFlowchart.mermaid_code}
        />
      )}
    </div>
  );
}
