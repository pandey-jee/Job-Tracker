import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../api/client';
import {
  Sparkles, X, CheckCircle2, AlertTriangle,
  Copy, Check, ArrowRight, Lightbulb, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Job {
  id: string;
  company: string;
  role: string;
  notes?: string;
  source?: string;
}

interface CompatibilityModalProps {
  job: Job | null;
  onClose: () => void;
}

interface CompatibilityResult {
  matchScore: number;
  matchLevel: string;
  summary: string;
  matchingSkills: string[];
  missingSkills: string[];
  strengths: string[];
  recommendations: string[];
  tailoredBulletPoints: string[];
}

export default function CompatibilityModal({ job, onClose }: CompatibilityModalProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [requiresResume, setRequiresResume] = useState(false);

  useEffect(() => {
    if (job) {
      evaluateFit();
    }
  }, [job]);

  const evaluateFit = async () => {
    if (!job) return;
    setLoading(true);
    setResult(null);
    setRequiresResume(false);

    try {
      const res = await apiClient.post('/ai/check-compatibility', {
        company: job.company,
        role: job.role,
        notes: job.notes,
      });
      setResult(res.data);
    } catch (err: any) {
      if (err.response?.data?.requiresResume) {
        setRequiresResume(true);
      } else {
        toast.error('Failed to evaluate compatibility. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBullet = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success('Tailored bullet point copied to clipboard!');
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (!job) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem',
    }}>
      <div style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '1rem',
        width: '100%',
        maxWidth: '740px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '0.5rem',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-color)',
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                AI Job Compatibility & ATS Match
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                {job.role} • <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{job.company}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '0.375rem',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', gap: '1rem' }}>
              <div className="spinner" style={{ width: 36, height: 36, border: '3px solid rgba(59,130,246,0.2)', borderTopColor: 'var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Comparing Master Resume with {job.role} requirements...
              </p>
            </div>
          )}

          {requiresResume && !loading && (
            <div style={{
              textAlign: 'center',
              padding: '2.5rem 1.5rem',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px dashed rgba(239, 68, 68, 0.3)',
              borderRadius: '0.75rem',
            }}>
              <AlertTriangle size={36} style={{ color: '#ef4444', marginBottom: '0.75rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                Master Resume Required
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto 1.25rem' }}>
                To calculate ATS match scores and missing skill gaps, add your Master Resume in Settings.
              </p>
              <button
                onClick={() => {
                  onClose();
                  navigate('/settings');
                }}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', margin: '0 auto' }}
              >
                Go to Resume Settings <ArrowRight size={15} />
              </button>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Score & Summary Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                padding: '1.25rem 1.5rem',
                backgroundColor: 'rgba(255,255,255,0.025)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.75rem',
              }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `3.5px solid ${getScoreColor(result.matchScore)}`,
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: getScoreColor(result.matchScore), lineHeight: 1 }}>
                    {result.matchScore}%
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
                    Match
                  </span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      backgroundColor: `${getScoreColor(result.matchScore)}20`,
                      color: getScoreColor(result.matchScore),
                      border: `1px solid ${getScoreColor(result.matchScore)}40`,
                    }}>
                      {result.matchLevel}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      • ATS Screening Fit
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {result.summary}
                  </p>
                </div>
              </div>

              {/* Skills Alignment Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Matching Skills */}
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '0.65rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', color: '#10b981', fontSize: '0.85rem', fontWeight: 600 }}>
                    <CheckCircle2 size={16} /> Matching Skills ({result.matchingSkills?.length || 0})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {result.matchingSkills?.map((skill, idx) => (
                      <span key={idx} style={{
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '0.375rem',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                      }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Skills / Gaps */}
                <div style={{
                  padding: '1rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '0.65rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
                    <AlertTriangle size={16} /> Missing Gaps ({result.missingSkills?.length || 0})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {result.missingSkills?.length > 0 ? (
                      result.missingSkills.map((skill, idx) => (
                        <span key={idx} style={{
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '0.375rem',
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                        }}>
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No critical skill gaps found!</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actionable Recommendations */}
              {result.recommendations?.length > 0 && (
                <div style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: 'rgba(59, 130, 246, 0.05)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '0.65rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem', color: 'var(--accent-color)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <Lightbulb size={16} /> ATS & Interview Tailoring Recommendations
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tailored Resume Bullet Points */}
              {result.tailoredBulletPoints?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ShieldCheck size={16} style={{ color: 'var(--accent-color)' }} />
                    Suggested Tailored Resume Bullet Points (Ready to Copy)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {result.tailoredBulletPoints.map((bullet, idx) => (
                      <div key={idx} style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                          • {bullet}
                        </p>
                        <button
                          onClick={() => handleCopyBullet(bullet, idx)}
                          title="Copy to clipboard"
                          style={{
                            background: copiedIdx === idx ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${copiedIdx === idx ? '#10b981' : 'var(--border-color)'}`,
                            color: copiedIdx === idx ? '#10b981' : 'var(--text-primary)',
                            padding: '0.35rem 0.5rem',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.72rem',
                            flexShrink: 0,
                          }}
                        >
                          {copiedIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                          {copiedIdx === idx ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.9rem 1.5rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
          background: 'rgba(255, 255, 255, 0.015)',
        }}>
          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
