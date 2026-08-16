import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-toastify';
import apiClient from '../api/client';
import { exportNotesToPDF } from '../utils/pdfExport';
import { Sparkles, Plus, X, BookOpen, Layers, Zap, Trash2, Edit2, Download, CheckCircle2, ArrowLeft } from 'lucide-react';

type Resource = {
  id: string;
  subject: string;
  pdf_url: string | null;
  text_notes: string;
  created_at: string;
};

type DepthOption = 'summary' | 'standard' | 'deep_dive';

export default function StudyHub() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  const notesContentRef = useRef<HTMLDivElement>(null);

  // Rename modal / state
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [renameSubject, setRenameSubject] = useState('');

  // Manual upload form
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // AI notes form
  const [aiTopic, setAiTopic] = useState('');
  const [aiDepth, setAiDepth] = useState<DepthOption>('standard');
  const [aiCustomInstruction, setAiCustomInstruction] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const fetchResources = async () => {
    try {
      const res = await apiClient.get('/resources');
      setResources(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchResources(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('subject', subject);
    formData.append('text_notes', notes);
    if (file) formData.append('pdf', file);

    try {
      const res = await apiClient.post('/resources', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const updated = [res.data, ...resources];
      setResources(updated);
      setSelectedResource(res.data);
      setShowModal(false);
      setSubject(''); setNotes(''); setFile(null);
      toast.success('Study material added successfully!');
    } catch (err) {
      toast.error('Upload failed. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;
    setAiLoading(true);
    try {
      const aiRes = await apiClient.post('/ai/generate-study-notes', {
        topic: aiTopic.trim(),
        depth: aiDepth,
        customInstruction: aiCustomInstruction.trim(),
      });

      const newResource = aiRes.data;
      const updated = [newResource, ...resources];
      setResources(updated);
      setSelectedResource(newResource);
      setShowAIModal(false);
      setAiTopic('');
      setAiCustomInstruction('');
      setAiDepth('standard');
      toast.success(`Study guide for "${newResource.subject}" generated!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to generate study notes.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await apiClient.delete(`/resources/${id}`);
      const updated = resources.filter(r => r.id !== id);
      setResources(updated);
      if (selectedResource?.id === id) {
        setSelectedResource(null);
      }
      toast.success('Resource deleted.');
    } catch (err) {
      toast.error('Failed to delete resource.');
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResource || !renameSubject.trim()) return;
    try {
      const res = await apiClient.put(`/resources/${editingResource.id}`, {
        subject: renameSubject.trim(),
      });
      const updated = resources.map(r => r.id === editingResource.id ? { ...r, subject: res.data.subject } : r);
      setResources(updated);
      if (selectedResource?.id === editingResource.id) {
        setSelectedResource(prev => prev ? { ...prev, subject: res.data.subject } : null);
      }
      setEditingResource(null);
      toast.success('Subject renamed successfully!');
    } catch (err) {
      toast.error('Failed to rename subject.');
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedResource) return;
    if (!notesContentRef.current) {
      toast.error('Notes content element not found.');
      return;
    }
    setDownloadingPDF(true);
    try {
      await exportNotesToPDF(selectedResource.subject, notesContentRef.current);
      toast.success('Study Guide PDF exported successfully!');
    } catch (err: any) {
      toast.error('Failed to export PDF.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const toggleSelectResource = (res: Resource) => {
    if (selectedResource?.id === res.id) {
      setSelectedResource(null); // Deselect
    } else {
      setSelectedResource(res); // Select
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden' }}>

      {/* Sidebar / List */}
      <div className={`resource-list ${selectedResource ? 'mobile-hide' : ''}`} style={{ width: '330px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowAIModal(true)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem' }}
          >
            <Sparkles size={16} /> AI Generate Study Notes
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setShowModal(true)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.55rem' }}
          >
            <Plus size={16} /> Add Custom Notes
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0 0.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Study Library ({resources.length})
          </span>
          {selectedResource && (
            <button
              onClick={() => setSelectedResource(null)}
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

        {resources.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <BookOpen size={36} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '0.85rem' }}>No study guides yet.</p>
            <span style={{ fontSize: '0.75rem' }}>Click above to generate notes with AI.</span>
          </div>
        ) : (
          resources.map((res) => {
            const isSelected = selectedResource?.id === res.id;
            return (
              <div
                key={res.id}
                className={`resource-item ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleSelectResource(res)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 0.9rem',
                  borderRadius: '0.5rem',
                  border: isSelected ? '1px solid rgba(59, 130, 246, 0.6)' : '1px solid var(--border-color)',
                  backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--card-bg)',
                  boxShadow: isSelected ? '0 0 12px rgba(59, 130, 246, 0.2)' : 'none',
                  cursor: 'pointer',
                  marginBottom: '0.5rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ flex: 1, overflow: 'hidden', paddingRight: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <h3 style={{
                      fontSize: '0.86rem',
                      fontWeight: isSelected ? 700 : 600,
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      margin: 0,
                    }}>
                      {res.subject}
                    </h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(res.created_at).toLocaleDateString()}
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
                    onClick={() => { setEditingResource(res); setRenameSubject(res.subject); }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }}
                    title="Rename"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(res.id)}
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

      {/* Content Viewer */}
      <div className={`resource-viewer ${!selectedResource ? 'mobile-hide' : ''}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedResource ? (
          <>
            {/* Selected Header Toolbar */}
            <div style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              background: 'var(--card-bg)',
              flexShrink: 0,
            }}>
              {/* Row 1: Back & Title */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', width: '100%', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                  <button
                    onClick={() => setSelectedResource(null)}
                    className="btn btn-secondary"
                    style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', gap: '0.25rem', flexShrink: 0 }}
                    title="Back to topics list"
                  >
                    <ArrowLeft size={13} /> Back
                  </button>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                      <h1 style={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        margin: 0,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {selectedResource.subject}
                      </h1>
                      <span style={{
                        fontSize: '0.65rem',
                        color: '#10b981',
                        fontWeight: 600,
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '9999px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                      }}>
                        <CheckCircle2 size={11} /> Selected
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', overflowX: 'auto' }}>
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloadingPDF}
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', gap: '0.25rem' }}
                  title="Download as PDF document"
                >
                  <Download size={13} /> {downloadingPDF ? 'Exporting...' : 'PDF'}
                </button>
                <button
                  onClick={() => { setEditingResource(selectedResource); setRenameSubject(selectedResource.subject); }}
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', gap: '0.25rem' }}
                >
                  <Edit2 size={13} /> Rename
                </button>
                <button
                  onClick={() => handleDelete(selectedResource.id)}
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', gap: '0.25rem', color: 'var(--danger-color)' }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>

            {/* Markdown Body */}
            <div className="resource-notes" style={{ flex: 1, overflowY: 'auto' }}>
              {selectedResource.text_notes ? (
                <div ref={notesContentRef} className="markdown-body" style={{ color: 'var(--text-primary)', maxWidth: '820px', margin: '0 auto' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedResource.text_notes}
                  </ReactMarkdown>
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>No text notes.</p>
              )}
            </div>
            {selectedResource.pdf_url && (
              <iframe src={selectedResource.pdf_url} className="pdf-viewer" title="PDF Viewer" />
            )}
          </>
        ) : (
          /* Unselected / Empty State Hero View */
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
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
              <BookOpen size={32} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              No Study Material Selected
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '440px', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              Select a topic from your library on the left to read, review interview questions, or download a printable PDF. Or generate a new guide below.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowAIModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
              >
                <Sparkles size={16} /> AI Generate Study Guide
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
              >
                <Plus size={16} /> Add Custom Notes
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {editingResource && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div className="modal-header" style={{ margin: 0 }}>Rename Topic</div>
              <button onClick={() => setEditingResource(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleRename}>
              <input
                required
                className="input"
                value={renameSubject}
                onChange={e => setRenameSubject(e.target.value)}
                style={{ marginBottom: '1.25rem', width: '100%' }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingResource(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Generate Notes Modal */}
      {showAIModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={20} style={{ color: 'var(--accent-color)' }} />
                <h2 className="modal-header" style={{ margin: 0 }}>Generate AI Study Guide</h2>
              </div>
              <button onClick={() => setShowAIModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleGenerateNotes} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Topic or Question</label>
                <input
                  required
                  className="input"
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  placeholder="e.g. Distributed Caching, Redis vs Memcached, React Fiber"
                  style={{ width: '100%' }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Depth Level</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { id: 'summary', label: 'Quick Summary', icon: Zap },
                    { id: 'standard', label: 'Standard Guide', icon: BookOpen },
                    { id: 'deep_dive', label: 'Deep Dive + Q&A', icon: Layers },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setAiDepth(id as DepthOption)}
                      style={{
                        padding: '0.65rem 0.5rem',
                        borderRadius: '0.5rem',
                        border: aiDepth === id ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                        backgroundColor: aiDepth === id ? 'rgba(59, 130, 246, 0.15)' : 'var(--card-bg)',
                        color: aiDepth === id ? 'var(--accent-color)' : 'var(--text-secondary)',
                        fontSize: '0.78rem',
                        fontWeight: aiDepth === id ? 600 : 400,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Special Instructions (Optional)</label>
                <input
                  className="input"
                  value={aiCustomInstruction}
                  onChange={e => setAiCustomInstruction(e.target.value)}
                  placeholder="e.g. Focus on FAANG interview questions, include Python code"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAIModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={aiLoading || !aiTopic.trim()}>
                  {aiLoading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="spinner" style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                      Generating Guide...
                    </span>
                  ) : (
                    'Generate Study Notes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Upload Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 className="modal-header" style={{ margin: 0 }}>Add Custom Notes</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Subject</label>
                <input required className="input" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. System Design Cheat Sheet" style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Notes (Markdown supported)</label>
                <textarea className="input" rows={6} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Paste your study notes or cheat sheet here..." style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
