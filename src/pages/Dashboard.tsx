import React, { useState } from 'react';
import { toast } from 'react-toastify';
import KanbanBoard from '../components/KanbanBoard';
import apiClient from '../api/client';
import { Sparkles, X, Copy, Check } from 'lucide-react';

export default function Dashboard() {
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showJDParser, setShowJDParser] = useState(false);
  const [jdText, setJdText] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [source, setSource] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [jdLoading, setJdLoading] = useState(false);

  // Interview Q&A state
  const [showQA, setShowQA] = useState(false);
  const [qaJob, setQaJob] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [qaLoading, setQaLoading] = useState(false);
  const [practiced, setPracticed] = useState<Set<number>>(new Set());

  // Cover letter state
  const [showCoverLetter, setShowCoverLetter] = useState(false);
  const [coverJob, setCoverJob] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [clLoading, setClLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/jobs', { company, role, source, notes, status: 'Wishlist' });
      setShowAddJobModal(false);
      resetForm();
      window.dispatchEvent(new Event('jobAdded'));
      toast.success(`Application for ${role} at ${company} added!`);
    } catch (err) {
      toast.error('Failed to add job application. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => { setCompany(''); setRole(''); setSource(''); setNotes(''); };

  const parseJD = async () => {
    if (!jdText.trim()) return;
    setJdLoading(true);
    try {
      const res = await apiClient.post('/ai/parse-jd', { text: jdText });
      const data = res.data;
      setCompany(data.company || '');
      setRole(data.role || '');
      setSource(data.source || '');
      setNotes(data.notes || '');
      setShowJDParser(false);
      setJdText('');
      setShowAddJobModal(true);
      toast.success('Job description parsed successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to parse job description.');
    } finally {
      setJdLoading(false);
    }
  };

  const generateQuestions = async (job: any) => {
    setQaJob(job);
    setShowQA(true);
    setQaLoading(true);
    setPracticed(new Set());
    try {
      const res = await apiClient.post('/ai/interview-questions', { company: job.company, role: job.role, notes: job.notes });
      setQuestions(res.data);
      toast.info(`Generated interview questions for ${job.role}`);
    } catch {
      setQuestions([]);
      toast.error('Failed to generate interview questions.');
    } finally {
      setQaLoading(false);
    }
  };

  const generateCoverLetter = async (job: any) => {
    setCoverJob(job);
    setShowCoverLetter(true);
    setClLoading(true);
    setCoverLetter('');
    try {
      const res = await apiClient.post('/ai/cover-letter', { company: job.company, role: job.role, notes: job.notes });
      setCoverLetter(res.data.coverLetter);
      toast.info(`Cover letter ready for ${job.company}`);
    } catch {
      setCoverLetter('Failed to generate cover letter.');
      toast.error('Failed to generate cover letter.');
    } finally {
      setClLoading(false);
    }
  };

  const copyCoverLetter = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    toast.success('Cover letter copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="topbar">
        <h1 className="page-title">Job Pipeline</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <button
            className="btn btn-secondary topbar-action-btn"
            onClick={() => setShowJDParser(true)}
            title="Parse Job Description with AI"
          >
            <Sparkles size={14} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
            <span className="desktop-btn-label">AI Parse JD</span>
            <span className="mobile-btn-label">AI</span>
          </button>
          <button
            className="btn btn-primary topbar-action-btn"
            onClick={() => setShowAddJobModal(true)}
          >
            <span className="desktop-btn-label">+ New Application</span>
            <span className="mobile-btn-label">+ New</span>
          </button>
        </div>
      </div>

      <KanbanBoard onGenerateQuestions={generateQuestions} onGenerateCoverLetter={generateCoverLetter} />

      {/* AI JD Parser Modal */}
      {showJDParser && (
        <div className="modal-overlay" onClick={() => { setShowJDParser(false); setJdText(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  flexShrink: 0,
                }}>
                  <Sparkles size={16} style={{ color: 'var(--accent-color)' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                    AI Job Description Parser
                  </h2>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
                    Paste job posting and AI will extract details automatically.
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowJDParser(false); setJdText(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={17} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Job Description Content
              </label>
              <textarea
                className="textarea"
                rows={5}
                value={jdText}
                onChange={e => setJdText(e.target.value)}
                placeholder="Paste the full job posting text here (e.g. from LinkedIn, Indeed, or career portal)..."
                style={{ width: '100%', resize: 'vertical', minHeight: '90px' }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setShowJDParser(false); setJdText(''); }}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={parseJD}
                disabled={jdLoading || !jdText.trim()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
              >
                {jdLoading ? (
                  <>
                    <span className="spinner" style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    Analyzing JD...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Parse & Auto-Fill
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Application Modal */}
      {showAddJobModal && (
        <div className="modal-overlay" onClick={() => setShowAddJobModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Add Job Application
              </h2>
              <button
                onClick={() => setShowAddJobModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleAddJob}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Company Name <span style={{ color: 'var(--danger-color)' }}>*</span>
                </label>
                <input
                  required
                  className="input"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="e.g. Google, Microsoft, Stripe"
                  style={{ width: '100%', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Job Role / Title <span style={{ color: 'var(--danger-color)' }}>*</span>
                </label>
                <input
                  required
                  className="input"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  placeholder="e.g. Senior Full Stack Engineer"
                  style={{ width: '100%', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Application Source / Link
                </label>
                <input
                  className="input"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  placeholder="e.g. LinkedIn, Referral, Company Website"
                  style={{ width: '100%', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Notes & Details (Optional)
                </label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Salary range, tech stack, recruiter notes..."
                  style={{ width: '100%', resize: 'vertical', minHeight: '65px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddJobModal(false)}
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !company.trim() || !role.trim()}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
                >
                  {loading ? (
                    <>
                      <span className="spinner" style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                      Saving...
                    </>
                  ) : (
                    'Add Application'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Q&A Modal */}
      {showQA && qaJob && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '650px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Interview Prep</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{qaJob.role} at {qaJob.company}</p>
              </div>
              <button onClick={() => setShowQA(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
              {qaLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
                  <Sparkles size={24} style={{ animation: 'spin 2s linear infinite', color: 'var(--accent-color)', marginBottom: '0.5rem' }} />
                  <p>Generating targeted interview questions...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {questions.map((q, i) => (
                    <div key={i} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '9999px', background: 'rgba(59,130,246,0.1)', color: 'var(--accent-color)', fontWeight: 600 }}>{q.category}</span>
                        <button
                          onClick={() => setPracticed(p => { const next = new Set(p); if (next.has(i)) next.delete(i); else next.add(i); return next; })}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: practiced.has(i) ? 'var(--success-color)' : 'var(--text-secondary)' }}
                        >
                          {practiced.has(i) ? '✓ Practiced' : 'Mark Practiced'}
                        </button>
                      </div>
                      <p style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '0.4rem' }}>{i + 1}. {q.question}</p>
                      {q.tip && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>💡 {q.tip}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cover Letter Modal */}
      {showCoverLetter && coverJob && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Generated Cover Letter</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{coverJob.role} at {coverJob.company}</p>
              </div>
              <button onClick={() => setShowCoverLetter(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            {clLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
                <Sparkles size={24} style={{ animation: 'spin 2s linear infinite', color: 'var(--accent-color)', marginBottom: '0.5rem' }} />
                <p>Writing your custom cover letter...</p>
              </div>
            ) : (
              <>
                <textarea className="textarea" rows={12} value={coverLetter} onChange={e => setCoverLetter(e.target.value)} style={{ marginBottom: '1rem', lineHeight: 1.6 }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button className="btn btn-secondary" onClick={copyCoverLetter}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy Letter'}
                  </button>
                  <button className="btn btn-primary" onClick={() => setShowCoverLetter(false)}>Done</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
